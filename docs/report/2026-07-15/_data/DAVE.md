# DAVE (Dave Inc.) 데이터 팩

- 조회일: 2026-07-15 (미 동부시간 2026-07-14 종가 기준)
- 거래소: NASDAQ(NGM), 통화: USD
- 데이터 출처: Yahoo Finance chart/fundamentals-timeseries/quoteSummary API, WebSearch(뉴스)

## 1. 기업 개요

- **사업 모델**: 미국 모바일 네오뱅킹/핀테크. 저소득·페이체크투페이체크(paycheck-to-paycheck) 소비자 대상 금융 앱.
- **주요 제품**: `ExtraCash`(무이자 소액 단기 현금선지급/오버드래프트 대체 상품, 핵심 수익원), `Dave Checking`(디지털 요구불예금 계좌, Dave Card 직불카드), `Budget`(가계부·지출 예측 도구), `Side Hustle`(부업 구인 포털).
- **직원 수**: 280명 (Yahoo assetProfile 기준). 2015년 설립, LA 본사.
- **경쟁사**: MoneyLion, Earnin, DailyPay(현금선지급 동종업계), Chime·Varo(네오뱅크), 전통 대형은행(JPMorgan, Wells Fargo)의 오버드래프트 상품.
- 2023-01-06 1:32 역병합(reverse split) 이력 — 현재 발행주식수 매우 적음(약 11.4M주).

## 2. 재무 실적 (연간, 단위: 천 USD)

| 회계연도(12/31) | 매출 | 매출총이익률 | 영업이익률 | 순이익 | 희석EPS | OCF | FCF |
|---|---|---|---|---|---|---|---|
| FY2022 | 204,838 | 84.4% | -65.6% | -128,906 | -10.92 | -44,883 | -54,195 |
| FY2023 | 259,093 | 76.3% | -16.3% | -48,517 | -4.07 | 33,754 | 25,171 |
| FY2024 | 347,076 | 81.3% | 10.0% | 57,873 | 4.19 | 125,137 | 117,575 |
| FY2025 | 554,182 | 86.7% | 33.7% | 195,865 | 13.53 | 290,023 | 283,249 |

- FY2025 매출 YoY +59.7%. 2024년 흑자전환 이후 급격한 이익 레버리지 확대.
- ROE(FY2025, 기말 자기자본 기준): 195,865/352,727 = **55.5%**. financialData 모듈의 TTM 기준 ROE는 111.6%(자기자본이 1Q2026 자사주 매입으로 급감한 상태 반영, 아래 참고).
- ROIC: 확인 불가(세부 투하자본 조정 항목 미제공).

### 최근 분기 (단위: 천 USD)

| 분기 | 매출 | 매출총이익 | 영업이익 | 순이익 | 희석EPS |
|---|---|---|---|---|---|
| 3Q2025 (9/30) | 150,725 | 130,751 | 45,898 | 92,072 | 6.34 |
| 4Q2025 (12/31) | 163,721 | 143,958 | 64,494 | 65,941 | 4.57 |
| 1Q2026 (3/31, 최신) | 158,414 | 137,707 | 59,566 | 57,936 | 4.02 |

- 1Q2026 매출 YoY +47%, 순이익 YoY +101%, Adjusted EBITDA YoY +57%($69.3M).
- 1Q2026 매출총이익률 86.9%, 영업이익률 37.6%, 순이익률 36.6% — 전년 동기 대비 개선.
- TTM(2Q25~1Q26) 매출 $604.6M (financialData.totalRevenue와 일치).
- 2026년 가이던스 상향: 매출 $710M~$720M (2026-05-05 실적 발표 시).

## 3. 재무 안전성 (최근 분기 1Q2026 기준, 단위: 천 USD, 별도 표기 시 예외)

| 항목 | 1Q2026 (3/31) | FY2025 (12/31) |
|---|---|---|
| 유동자산 | 479,626 | 436,696 |
| 유동부채 | 124,343 | 113,997 |
| 유동비율 | 3.86배 | 3.83배 |
| 당좌비율(quickRatio, Yahoo) | 1.53배 | - |
| 총부채(TotalDebt) | 268,206 | 75,204 |
| 총현금 | 133,327(현금성자산) / 179,951(financialData 총현금) | 80,523 |
| 자기자본 | 203,781 | 352,727 |
| 부채/자본(D/E) | 131.6% | 21.3% |
| 재고자산 | 해당 없음(핀테크, 재고 개념 없음) | 해당 없음 |
| 이자보상배율 | 확인 불가(이자비용 별도 라인 미제공) |

- **주의**: 1Q2026에 자기자본이 급감(352.7M→203.8M)하고 총부채가 급증(75.2M→268.2M)한 이유는 (1) 약 $195M 규모 자사주 매입(발행주식의 7.0%) 집행, (2) 2026-06-01부로 ExtraCash 채권을 Coastal Community Bank와의 전략적 펀딩 약정으로 이전하며 관련 부채 계상 때문(뉴스 참조, 아래 7절). 유동비율은 여전히 양호(3.86배)하나 부채비율 급등은 일회성/구조변경 요인 감안 필요.

## 4. 밸류에이션 (2026-07-14 종가 기준)

| 항목 | 값 |
|---|---|
| 현재가 | $417.00 |
| 시가총액 | $5.30B |
| 기업가치(EV) | $5.39B |
| PER(trailing) | 25.0배 |
| PER(forward) | 19.8배 |
| PBR | 26.02배 (BVPS $16.03) |
| PSR(trailing 12M) | 8.77배 |
| EV/매출 | 8.92배 |
| EV/EBITDA | 24.80배 |
| PEG | 확인 불가(Yahoo 미제공) |
| 배당수익률 | 없음(무배당) |
| 베타 | 3.83 (변동성 매우 높음) |

- PBR·PER 모두 고밸류에이션 구간 — 최근 급등(아래 6절) 반영. Forward PER(19.8배)는 trailing 대비 낮아 이익 성장 기대 반영.

## 5. 수급·심리 (기준일 2026-06-30/07-14 전후)

| 항목 | 값 |
|---|---|
| 공매도 비율(% of float) | 22.04% (숏 주식 2.46M주, shortRatio 3.8일) |
| 전월 대비 숏 잔고 | 2.10M(5/29) → 2.46M(6/30), 증가 |
| 내부자 지분율 | 10.84% |
| 기관 지분율 | 99.83% (기관 383개) — float 대비 111.97%로 매도 후 재매수 등 통계적 왜곡 가능성 있음 |
| 발행주식수 | 11.40M (float 9.41M) |

### 애널리스트 등급 분포 (최근월, 총 12명 = strongBuy 3 + buy 8 + hold 1)

| 구분 | 인원 |
|---|---|
| Strong Buy | 3 |
| Buy | 8 |
| Hold | 1 |
| Sell | 0 |
| Strong Sell | 0 |

- 추천 평균(recommendationMean) 1.42 → "Strong Buy" 등급.
- 목표주가(quoteSummary financialData, 기준 시점 다소 지연): 평균 $373.09, 중앙값 $370, 최고 $485, 최저 $260, 애널리스트 11명.
- **최신 목표가 갱신(WebSearch, 2026-07-01)**: Benchmark $475(유지 Buy), UBS $470(상향, 종전 $300), KBW(Keefe Bruyette) $485(상향, 종전 $340). 현재가($417)는 quoteSummary 평균치를 상회하나 최신 상향 목표가들과는 근접~하회.
- 공매도 비중(22%)이 매우 높아 숏스퀴즈 가능성 및 변동성 확대 리스크 존재.

## 6. 주가 흐름

| 항목 | 값 |
|---|---|
| 52주 최고 | $419.86 (2026-07-14 장중, 사실상 현재가 근접) |
| 52주 최저 | $152.21 |
| 사상 최고가(all-time high) | $491.07 |
| 현재가 | $417.00 (52주 레인지 상단, 고점 대비 -0.7%) |
| 50일 이동평균 | $293.65 |
| 200일 이동평균 | $229.57 |
| 52주 등락률 | +92.4% (S&P500 +20.4% 대비 대폭 아웃퍼폼) |

- 최근 1년 흐름: 2025-07 $218 → 2025-10 저점 $195 → 2026-01 저점 $164 → 2026-04 반등 $275 → 2026-06 $314 → 2026-07-14 $417로 최근 한 달새 급등.
- 2026년 상반기 YTD +68% 이상, 2026년 6월 미국 최고 수익률 종목 상위권 언급.
- **최근 급등 원인** (2026-07 초·중순): (1) 2026-05-05 발표된 1Q2026 실적 서프라이즈(매출 YoY +47%, 순이익 YoY +101%) 및 가이던스 상향, (2) 애널리스트들의 연쇄적 목표주가 상향(Benchmark $475, UBS $470, KBW $485, 2026-07-01 전후), (3) Coastal Community Bank와의 펀딩 구조 개편으로 $200M 이상 유동성 확보 기대. [Yahoo Finance](https://finance.yahoo.com/markets/stocks/articles/dave-stock-buy-hold-sell-144600695.html), [Investing.com](https://www.investing.com/news/analyst-ratings/benchmark-raises-dave-stock-price-target-to-475-on-strong-gains-93CH-4770358)

## 7. 최근 실적·이벤트

- **1Q FY2026 실적(발표 2026-05-05)**: 매출 $158.4M(YoY +47%), 순이익 $57.9M(YoY +101%), Adjusted EBITDA $69.3M(YoY +57%). ExtraCash 취급액(originations) $2.1B(YoY +37%), ExtraCash 손실 차감 후 수익화율(Monetization Rate Net of Losses) 5.1%(4년래 최고). 월간 거래 회원(MTM) 299만명(YoY +18%), 신규 회원 69.5만명(YoY +22%, 고객획득비용 $18). 28일 연체율 1.69%(1분기 기준 사상 최저). [PR Newswire](https://www.prnewswire.com/news-releases/dave-reports-first-quarter-2026-financial-results-302763226.html), [StockTitan](https://www.stocktitan.net/news/DAVE/dave-reports-first-quarter-2026-financial-w48jwxd1gycx.html)
- **자본배분**: 1분기 중 약 $195M 자사주 매입 집행(발행주식의 7.0%) — 자기자본 급감·부채비율 급등의 주 원인.
- **펀딩 구조 개편**: 2026-06-01부로 ExtraCash 채권을 Coastal Community Bank와의 전략적 펀딩 약정으로 이전 시작. 직접 펀딩 부담 축소, 자본비용 절감, $200M 이상 유동성 확보 기대(회사 발표 인용).
- **가이던스**: 2026년 매출 가이던스 $710M~$720M로 상향(직전 대비 상향), Adjusted EBITDA·Adjusted Diluted EPS도 상향.
- **차기 실적 발표일**: 2026-08-05 (WebSearch 다수 소스 일치, 2Q2026 실적). ※ Yahoo calendarEvents 모듈은 5/5(1Q 실적)로 표시되어 있어 최신화 지연 확인됨 — 웹서치 결과 사용.
- **규제/소송 리스크**:
  - 2024-11 FTC가 Dave를 상대로 ExtraCash 상품의 소비자 오도 소지 제기하며 제소.
  - 2026-01 볼티모어시가 Dave를 상대로 "오도성 마케팅과 고리대금성 수수료(APR 최대 약 2,500%로 주장)"를 이유로 제소(볼티모어는 동종업계 MoneyLion도 2025-10 제소한 바 있음).
  - 업계 전반적으로 CFPB의 가이던스 축소·예산 축소로 연방 차원 감독은 약화되는 대신 주·시 단위(뉴욕주 법무장관, 볼티모어시 등) 집행이 늘어나는 추세 — Dave의 핵심 수익원인 ExtraCash 수수료 구조 자체가 소송 리스크에 노출.
  [Cobalt Intelligence](https://newsletter.cobaltintelligence.com/p/baltimore-sues-fintech-dave-2500-apr-claims-filed), [Banking Dive](https://www.bankingdive.com/news/baltimore-sues-fintech-dave-cash-advance-misleading-high-interest-cfpb/809009/), [American Banker](https://www.americanbanker.com/news/baltimore-mayor-sues-fintech-dave-for-usurious-fees)

## 8. 확인 불가 항목

- ROIC (투하자본이익률) — 세부 조정 항목 미제공으로 미산출
- 이자보상배율 — 이자비용 별도 라인 미확인
- PEG 비율 — Yahoo defaultKeyStatistics 미제공(빈 값)
- 재고자산 — 핀테크 비즈니스 특성상 해당 없음(N/A)
- Yahoo calendarEvents의 차기 실적일이 구버전(2026-05-05)으로 표시되어 있어, 실제 차기 실적일은 WebSearch 결과(2026-08-05)로 대체 사용함
- FTC 소송·볼티모어시 소송의 최신 진행 상황(화해/기각 여부) — 뉴스 검색 시점(2026-07-15) 기준 진행 중으로만 확인, 최종 결론 확인 불가
