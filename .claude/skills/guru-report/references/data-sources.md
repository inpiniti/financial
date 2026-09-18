# 무료 데이터 소스 레시피 (가입/API 키 불필요)

데이터 팩 작성 시 아래 엔드포인트를 사용한다.
공통 규칙: **Yahoo 계열은 브라우저 User-Agent 헤더 필수** (없으면 429). 아래 `$UA` 사용.

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
```

티커 표기: 미국 주식은 그대로(`AAPL`), 한국 주식은 코스피 `.KS` / 코스닥 `.KQ` 접미사(`005930.KS`, `035720.KQ`).

---

## 1. 주가 · 52주 고저 · 시세 — Yahoo chart API (crumb 불필요)

```bash
curl -s -H "User-Agent: $UA" \
  "https://query1.finance.yahoo.com/v8/finance/chart/{티커}?range=1y&interval=1wk"
```

- `meta`에 현재가(`regularMarketPrice`), 52주 고가(`fiftyTwoWeekHigh`), 52주 저가(`fiftyTwoWeekLow`), 통화, 거래소가 들어 있다.
- `timestamp`와 `indicators.quote`가 가격 히스토리다.
- `range`는 `5d`, `1mo`, `3mo`, `6mo`, `1y`, `2y`, `5y` 등으로 조정 가능.

---

## 2. 연간·분기 재무 — Yahoo fundamentals-timeseries (crumb 불필요)

```bash
curl -s -H "User-Agent: $UA" \
  "https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/{티커}?type={타입목록}&period1=1420070400&period2={현재유닉스초}"
```

`type`에 콤마로 연결하여 다중 조회 가능 (분기 실적은 `annual` → `quarterly`로 교체):

- **손익**: `annualTotalRevenue`, `annualGrossProfit`, `annualOperatingIncome`, `annualNetIncome`, `annualDilutedEPS`
- **현금흐름**: `annualOperatingCashFlow`, `annualFreeCashFlow`, `annualCapitalExpenditure`
- **재무상태 & 안전성**: `annualTotalDebt`, `annualStockholdersEquity`, `annualCashAndCashEquivalents`, `annualCurrentAssets`, `annualCurrentLiabilities`, `annualInventory` (유동비율·NCAV·운전자본·재고 추이 분석용)

응답의 `reportedValue.raw`가 수치, `asOfDate`가 기준일이다. 마진율, ROE, ROIC, 부채비율, 유동비율은 이 원자료를 토대로 직접 계산해 표에 기재한다.

---

## 3. 밸류에이션 지표 · 컨센서스 · 수급 — Yahoo quoteSummary (crumb 필요)

### Crumb 발급 (쿠키 → crumb 순서, 세션당 1회면 충분)

```bash
CJ=$(mktemp)
curl -s -c "$CJ" -H "User-Agent: $UA" "https://fc.yahoo.com" -o /dev/null
CRUMB=$(curl -s -b "$CJ" -H "User-Agent: $UA" "https://query1.finance.yahoo.com/v1/test/getcrumb")
```

### 상세 모듈 일괄 조회

```bash
curl -s -b "$CJ" -H "User-Agent: $UA" \
  "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{티커}?modules=summaryDetail,defaultKeyStatistics,financialData,earningsTrend,earnings,majorHoldersBreakdown,recommendationTrend,calendarEvents&crumb=$CRUMB"
```

### 주요 모듈별 핵심 정보:
- `summaryDetail`: PER(trailing/forward), PBR, 배당수익률, 시가총액, 50일/200일 이동평균선
- `defaultKeyStatistics`: PEG 비율, EV/EBITDA, 발행주식수, 베타(Beta), `shortPercentOfFloat`(공매도 비율), `heldPercentInsiders`(내부자 지분율), `heldPercentInstitutions`(기관 지분율)
- `financialData`: ROE, ROA, 영업이익률, 순이익률, 목표주가(애널리스트 평균/최고/최저), 추천 등급, 총현금/총부채
- `earningsTrend`: FY1 / FY2 EPS 및 매출 컨센서스 추정치 (애널리스트 수, 성장률 전망)
- `earnings`: 최근 분기 실적 및 어닝 서프라이즈 이력
- `majorHoldersBreakdown`: 내부자 및 기관 지분 상세 구성
- `recommendationTrend`: 애널리스트 등급 분포 (strongBuy / buy / hold / sell / strongSell 인원 분포)
- `calendarEvents`: 차기 실적 발표 예정일, 배당락일

---

## 4. 공시 원자료 및 규제 보고서

### 미국 상장사 — SEC EDGAR (crumb 불필요, User-Agent에 연락처 포함)
```bash
curl -s -H "User-Agent: ResearchBot research@example.com" \
  "https://data.sec.gov/api/xbrl/companyfacts/CIK{10자리CIK}.json"
```
- CIK 조회: `https://www.sec.gov/files/company_tickers.json` (티커 → CIK 매핑, 10자리 0-패딩)
- 10-K(사업보고서), 10-Q(분기보고서)의 정확한 공식 회계 수치 확인용.

### 한국 상장사 — DART 및 네이버 증권
- 한국 주식은 Yahoo에서 누락될 수 있는 PER, PBR, 배당, 최근 분기 실적, 사업보고서 공시 등을 네이버 증권(`https://m.stock.naver.com/domestic/stock/{티커}`) 및 DART 전자공시 기사를 통해 WebSearch로 확인하고 보완한다.

---

## 5. 뉴스 · 이벤트 · 정성 정보 및 경쟁사 비교 — WebSearch / WebFetch

거장들의 정밀한 정성 분석(해자, 경영진 역량, 경쟁 우위, 리스크)을 위해 아래 항목을 웹 조사를 통해 충분히 수집한다:
- **최근 실적 발표 및 컨퍼런스 콜 요지**: 경영진의 가이던스, 신제품/신시장 진출 현황
- **경쟁사 비교**: 동종업계 핵심 경쟁사 2~3곳의 주요 지표(매출 성장률, 마진, 밸류에이션) 비교
- **핵심 리스크 및 이슈**: 진행 중인 소송, 규제 리스크, 지정학적 리스크, 회계 이슈 등 (출처와 날짜 명시)
- **차기 주요 이벤트**: 실적 발표일, 신제품 런칭, 승인 일정 등

---

## 주의사항

- **품질 최우선**: 토큰을 아끼기 위해 데이터를 자르거나 "확인 불가"로 무책임하게 넘기지 않는다. 13인의 거장이 사실관계에 기반해 치열하게 논쟁할 수 있도록 풍부하고 정확한 데이터를 제공한다.
- 모든 수치에 기준 시점(`asOfDate` 또는 조회 시점)을 명시한다.
- 임시 파일(쿠키, JSON 등)은 작업 후 정리한다.
