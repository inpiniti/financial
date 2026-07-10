# 무료 데이터 소스 레시피 (가입/API 키 불필요)

데이터 팩 작성 시 아래 엔드포인트를 사용한다. 전부 2026-07 기준 실제 호출 검증됨.
공통 규칙: **Yahoo 계열은 브라우저 User-Agent 헤더 필수** (없으면 429). 아래 `$UA` 사용.

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
```

티커 표기: 미국 주식은 그대로(`AAPL`), 한국 주식은 코스피 `.KS` / 코스닥 `.KQ` 접미사(`005930.KS`).

## 1. 주가 · 52주 고저 · 시세 — Yahoo chart API (crumb 불필요)

```bash
curl -s -H "User-Agent: $UA" \
  "https://query1.finance.yahoo.com/v8/finance/chart/{티커}?range=1y&interval=1wk"
```

`meta`에 현재가(`regularMarketPrice`), 52주 고저, 통화, 거래소가 들어 있고, `timestamp`/`indicators.quote`가 가격 히스토리다. `range`는 `5d`/`3mo`/`1y`/`5y` 등.

## 2. 연간·분기 재무 — Yahoo fundamentals-timeseries (crumb 불필요)

```bash
curl -s -H "User-Agent: $UA" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{티커}?type={타입목록}&period1=1420070400&period2={현재유닉스초}"
```

`type`에 콤마로 이어 붙인다. 자주 쓰는 타입 (분기는 `annual` → `quarterly`로 교체):

- `annualTotalRevenue`, `annualGrossProfit`, `annualOperatingIncome`, `annualNetIncome`
- `annualDilutedEPS`, `annualFreeCashFlow`, `annualOperatingCashFlow`
- `annualTotalDebt`, `annualStockholdersEquity`, `annualCashAndCashEquivalents`

응답의 `reportedValue.raw`가 수치, `asOfDate`가 기준일. 마진·ROE·부채비율은 이 원자료로 직접 계산한다.

## 3. 밸류에이션 지표 · 컨센서스 — Yahoo quoteSummary (crumb 필요)

crumb 발급(쿠키 → crumb 순서, 세션당 1회면 충분):

```bash
CJ=$(mktemp)
curl -s -c "$CJ" -H "User-Agent: $UA" "https://fc.yahoo.com" -o /dev/null
CRUMB=$(curl -s -b "$CJ" -H "User-Agent: $UA" "https://query1.finance.yahoo.com/v1/test/getcrumb")
```

조회:

```bash
curl -s -b "$CJ" -H "User-Agent: $UA" \
  "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{티커}?modules={모듈목록}&crumb=$CRUMB"
```

유용한 모듈:

- `summaryDetail` — PER(trailing/forward), PBR 계산용, 배당수익률, 시가총액
- `defaultKeyStatistics` — PEG, EV/EBITDA, 발행주식수, 베타
- `financialData` — ROE, 마진, 목표주가(애널리스트), 추천 등급, 현금/부채
- `earningsTrend` — EPS/매출 컨센서스 추정치 (FY1/FY2, 애널리스트 수 포함)
- `earnings` — 최근 분기 실적과 어닝 서프라이즈

## 4. 미국 상장사 공시 원자료 — SEC EDGAR (crumb 불필요, UA에 이메일 권장)

```bash
curl -s -H "User-Agent: research {이메일}" \
  "https://data.sec.gov/api/xbrl/companyfacts/CIK{10자리CIK}.json"
```

- CIK 조회: `https://www.sec.gov/files/company_tickers.json` (티커→CIK 매핑, 10자리로 0-패딩)
- 전 계정과목의 연도별 XBRL 수치가 나온다. Yahoo 수치와 크게 다르면 EDGAR을 우선한다.
- 한국 주식은 해당 없음 — Yahoo 데이터 + WebSearch(DART 공시 기사)로 보완.

## 5. 뉴스 · 이벤트 · 정성 정보 — WebSearch/WebFetch

실적 발표 요지, 가이던스, 리스크 이슈, 경쟁 구도는 WebSearch로 조사하고 출처·날짜를 명시한다.

## 주의

- 모든 수치에 기준 시점(asOfDate 또는 조회일)을 적는다. 조회 실패 항목은 "확인 불가"로 남기고 추정하지 않는다.
- Yahoo가 일시적으로 429를 주면 수 초 간격을 두고 1~2회만 재시도한다.
- 임시 파일(쿠키 등)은 스크래치 디렉토리에 만들고 사용 후 삭제한다.
