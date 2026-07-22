#!/usr/bin/env node
/**
 * 한국투자증권 해외주식 체결기준현재잔고 조회
 *
 * 사용법:  node fetch_balance.mjs
 * 필요:    저장소 루트의 .env 파일 (KIS_APPKEY, KIS_APPSECRET, KIS_CANO, KIS_ACNT_PRDT_CD)
 * 출력:    stdout에 정규화된 JSON (holdings + summary)
 *
 * 토큰은 .env 옆의 .kis-token.json에 캐시된다 (유효기간 24h, 잦은 재발급 시
 * KIS가 직전 토큰을 반환하므로 캐시가 정석). 두 파일 모두 .gitignore 대상.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const ENV_PATH = join(ROOT, ".env");
const TOKEN_CACHE = join(ROOT, ".kis-token.json");
const BASE = "https://openapi.koreainvestment.com:9443";

function loadEnv() {
  if (!existsSync(ENV_PATH)) {
    console.error(`.env 파일이 없습니다: ${ENV_PATH}`);
    console.error("KIS_APPKEY=..., KIS_APPSECRET=..., KIS_CANO=..., KIS_ACNT_PRDT_CD=... 형식으로 작성하세요.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(ENV_PATH, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  for (const k of ["KIS_APPKEY", "KIS_APPSECRET", "KIS_CANO", "KIS_ACNT_PRDT_CD"]) {
    if (!env[k]) {
      console.error(`.env에 ${k}가 없습니다.`);
      process.exit(1);
    }
  }
  return env;
}

async function getToken(env) {
  if (existsSync(TOKEN_CACHE)) {
    try {
      const cached = JSON.parse(readFileSync(TOKEN_CACHE, "utf8"));
      // 만료 5분 전까지만 재사용
      if (new Date(cached.expired).getTime() - Date.now() > 5 * 60 * 1000) {
        return cached.access_token;
      }
    } catch {
      /* 캐시 손상 시 재발급 */
    }
  }
  const res = await fetch(`${BASE}/oauth2/tokenP`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify({
      grant_type: "client_credentials",
      appkey: env.KIS_APPKEY,
      appsecret: env.KIS_APPSECRET,
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("토큰 발급 실패:", JSON.stringify(data));
    process.exit(1);
  }
  writeFileSync(
    TOKEN_CACHE,
    JSON.stringify({ access_token: data.access_token, expired: data.access_token_token_expired }, null, 2)
  );
  return data.access_token;
}

async function fetchBalance(env, token) {
  const params = new URLSearchParams({
    CANO: env.KIS_CANO,
    ACNT_PRDT_CD: env.KIS_ACNT_PRDT_CD,
    WCRC_FRCR_DVSN_CD: "02", // 외화
    NATN_CD: "000", // 전체
    TR_MKET_CD: "00", // 전체
    INQR_DVSN_CD: "00", // 전체
  });
  const res = await fetch(`${BASE}/uapi/overseas-stock/v1/trading/inquire-present-balance?${params}`, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      authorization: `Bearer ${token}`,
      appkey: env.KIS_APPKEY,
      appsecret: env.KIS_APPSECRET,
      tr_id: "CTRP6504R",
      custtype: "P",
    },
  });
  const data = await res.json();
  if (data.rt_cd !== "0") {
    console.error(`잔고 조회 실패 [${data.msg_cd}]: ${data.msg1}`);
    process.exit(1);
  }
  return data;
}

const num = (s) => (s === "" || s == null ? null : Number(s));

function normalize(raw) {
  const holdings = (raw.output1 || [])
    .filter((h) => num(h.ccld_qty_smtl1) > 0)
    .map((h) => ({
      ticker: h.pdno,
      name: h.prdt_name,
      exchange: h.ovrs_excg_cd,
      market: h.tr_mket_name,
      currency: h.buy_crcy_cd,
      qty: num(h.ccld_qty_smtl1),
      avg_price: num(h.avg_unpr3),
      cur_price: num(h.ovrs_now_pric1),
      buy_amt_frcr: num(h.frcr_pchs_amt),
      eval_amt_frcr: num(h.frcr_evlu_amt2),
      pl_amt_frcr: num(h.evlu_pfls_amt2),
      pl_rate_pct: num(h.evlu_pfls_rt1),
      fx_rate: num(h.bass_exrt),
    }));
  const totalEval = holdings.reduce((s, h) => s + (h.eval_amt_frcr ?? 0) * (h.fx_rate ?? 1), 0);
  for (const h of holdings) {
    h.weight_pct =
      totalEval > 0 ? Math.round((((h.eval_amt_frcr ?? 0) * (h.fx_rate ?? 1)) / totalEval) * 1000) / 10 : null;
  }
  const s = raw.output3 || {};
  return {
    as_of: new Date().toISOString(),
    holdings,
    cash: (raw.output2 || []).map((c) => ({
      currency: c.crcy_cd,
      deposit_frcr: num(c.frcr_dncl_amt_2),
      withdrawable_frcr: num(c.frcr_drwg_psbl_amt_1),
    })),
    summary_krw: {
      buy_total: num(s.pchs_amt_smtl),
      eval_total: num(s.evlu_amt_smtl),
      pl_total: num(s.evlu_pfls_amt_smtl),
      pl_rate_pct: num(s.evlu_erng_rt1),
      total_asset: num(s.tot_asst_amt),
      deposit_total: num(s.tot_dncl_amt),
    },
  };
}

const env = loadEnv();
const token = await getToken(env);
const raw = await fetchBalance(env, token);
console.log(JSON.stringify(normalize(raw), null, 2));
