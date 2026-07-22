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
      deposit_frcr: num(c.frcr_dncl_amt_2), // 외화예수금액2 (외화사용가능금액)
      withdrawable_frcr: num(c.frcr_drwg_psbl_amt_1), // 외화출금가능금액
      withdrawable_krw: num(c.frcr_evlu_amt2), // 출금가능원화금액
      buy_margin_frcr: num(c.frcr_buy_mgn_amt), // 외화매수증거금 (미결제 매수분)
      nxdy_withdrawable_frcr: num(c.nxdy_frcr_drwg_psbl_amt), // 익일외화출금가능금액
      fx_rate: num(c.frst_bltn_exrt), // 최초고시환율
    })),
    summary_krw: {
      buy_total: num(s.pchs_amt_smtl),
      eval_total: num(s.evlu_amt_smtl),
      pl_total: num(s.evlu_pfls_amt_smtl),
      pl_rate_pct: num(s.evlu_erng_rt1),
      total_asset: num(s.tot_asst_amt),
      deposit_krw: num(s.dncl_amt), // 예수금액 (원화)
      deposit_total: num(s.tot_dncl_amt), // 총예수금액
      cma_eval: num(s.cma_evlu_amt), // CMA평가금액
      withdrawable_total: num(s.wdrw_psbl_tot_amt), // 인출가능총금액
      frcr_usable: num(s.frcr_use_psbl_amt), // 외화사용가능금액
      frcr_eval_total: num(s.frcr_evlu_tota), // 외화평가총액
      frcr_balance_total: num(s.tot_frcr_cblc_smtl), // 총외화잔고합계
      buy_margin: num(s.buy_mgn_amt), // 매수증거금액
      margin_total: num(s.mgna_tota), // 증거금총액
      // 가용현금 = 외화사용가능금액(원화환산)만. 원화 총예수금(tot_dncl_amt)은
      // 성격이 불분명해 현금으로 세지 않는다 (사용자 확인, 2026-07-22).
      // 외화예수금 중 매수증거금(미결제 매수분)도 해당 주식이 이미 holdings 평가액에
      // 잡혀 있어 제외. 검증: tot_asst_amt ≈ 주식평가액(KRW) + tot_dncl_amt + frcr_use_psbl_amt
      usable_cash: num(s.frcr_use_psbl_amt) ?? 0,
      cash_weight_pct:
        num(s.tot_asst_amt) > 0
          ? Math.round(((num(s.frcr_use_psbl_amt) ?? 0) / num(s.tot_asst_amt)) * 1000) / 10
          : null,
    },
  };
}

const env = loadEnv();
const token = await getToken(env);
const raw = await fetchBalance(env, token);
console.log(JSON.stringify(normalize(raw), null, 2));
