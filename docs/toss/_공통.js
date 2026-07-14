/**
 * 토스증권 스크리너 API 공통 모듈
 * ---------------------------------------------------------------
 * 사용법:
 *   1) 브라우저에서 https://www.tossinvest.com/screener 에 로그인한 상태로 접속
 *   2) F12 → Console 탭
 *   3) 이 파일 전체를 붙여넣고 엔터 (한 번만)
 *   4) 그 다음 원하는 구루 파일(예: 07-워런-버핏.js)을 붙여넣고 엔터
 *
 * 쿠키(SESSION/UTK/XSRF-TOKEN)는 브라우저가 자동으로 실어 보내므로
 * 이 파일에는 어떤 인증정보도 하드코딩하지 않는다.
 */

const TOSS_API = "https://wts-cert-api.tossinvest.com/api/v2/screener/screen";

/** 쿠키에서 XSRF 토큰을 읽어온다 (요청 헤더에 반드시 필요) */
function getXsrfToken() {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (!m) throw new Error("XSRF-TOKEN 쿠키가 없다. tossinvest.com에 로그인했는지 확인하라.");
  return decodeURIComponent(m[1]);
}

/** 정렬 기준 — 표시 순서일 뿐 결과 집합에는 영향 없음 */
const SORT_기본 = { column: "C_주가등락률_1W", label: "주가등락률", order: "DESC" };

/**
 * 스크리너 조회
 * @param {string} 이름   - 콘솔 출력용 라벨
 * @param {Array}  filters - 필터 조건 배열
 * @param {object} opts    - { nation, size, sort }
 */
async function tossScreen(이름, filters, opts = {}) {
  const body = {
    pagingParam: { key: null, number: 1, size: opts.size ?? 50 },
    filters,
    sort: opts.sort ?? SORT_기본,
    nation: opts.nation ?? "kr", // "kr" = 국내, "us" = 해외
  };

  const res = await fetch(TOSS_API, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-xsrf-token": getXsrfToken(),
    },
    credentials: "include",
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error(`[${이름}] HTTP ${res.status}`, await res.text());
    return null;
  }

  const json = await res.json();
  const rows = json?.result?.stocks ?? json?.result?.items ?? json?.result ?? [];
  console.log(`\n===== ${이름} =====`);
  console.log(`검색된 종목: ${Array.isArray(rows) ? rows.length : "?"}개 (size=${body.pagingParam.size} 상한)`);
  if (Array.isArray(rows) && rows.length) console.table(rows);
  else console.log(json); // 응답 구조가 예상과 다르면 원본을 그대로 보여준다
  return json;
}

// ─────────────────────────────────────────────────────────────
// 필터 조건 빌더 (반복되는 JSON 구조를 줄이기 위한 헬퍼)
// ─────────────────────────────────────────────────────────────

/** 숫자 범위. 비율은 소수로 넣는다 (10% → 0.1, 부채비율 100% → 1) */
const 범위 = (from, to, { includeFrom = true, includeTo = false } = {}) => ({
  id: "NUMBER_RANGE_DEFAULT",
  type: "NUMBER_RANGE",
  value: {
    from: from ?? null,
    to: to ?? null,
    includeFrom: from == null ? null : includeFrom,
    includeTo: to == null ? null : includeTo,
  },
});

/** 기간 선택 조건 */
const 기간 = (id, value) => ({ id, type: "PERIOD", value });

/** 재무 지표용 기간: "QUARTER"(직전 분기) | "TTM"(최근 1년 / 연속증가 필터에서는 연도별) */
const 기간_분기TTM = (v) => 기간("기간_선택_QUARTER_TTM", v);
/** 연평균 지표용 기간: "TTM_3"(최근 3년 평균) | "TTM_5"(최근 5년 평균) */
const 기간_3년5년 = (v) => 기간("기간_선택_TTM3_TTM5", v);
/** 주가등락률 등: "DAY_1"(하루) | "DAY_5"(1주) | "DAY_20"(1개월) */
const 기간_일월 = (v) => 기간("기간_선택_DAY_TO_MONTH", v);
/** 거래량·거래대금: "DAY_1" | "DAY_5"(1주) | "DAY_20"(1개월) | "DAY_60"(3개월) | "DAY_120"(6개월) | "DAY_240"(12개월) */
const 기간_일년 = (v) => 기간("기간_선택_DAY_TO_YEAR", v);

/** 단순 숫자범위 필터 하나 */
const F = (id, from, to, opt) => ({ id, conditions: [범위(from, to, opt)] });

/** 기간 + 숫자범위 필터 하나 */
const FP = (id, period, from, to, opt) => ({
  id,
  conditions: [period, 범위(from, to, opt)],
});

// 자주 쓰는 단위 상수
const 억 = 100_000_000;
const 조 = 1_000_000_000_000;

console.log("✅ 토스 스크리너 공통 모듈 로드 완료. 이제 구루 파일을 붙여넣어라.");
