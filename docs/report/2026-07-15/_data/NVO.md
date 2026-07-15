# NVO (Novo Nordisk A/S, ADR) 공용 데이터 팩

조회일: 2026-07-15. 주가·시총·PER 등 시장지표는 **USD**(ADR 기준), 재무제표(매출·이익 등)는 원 보고통화 **DKK**(덴마크 크로네) 기준. ADR 1주 = 보통주 1주 환산 기준(2023-09 2:1 액면분할 반영). 서로 통화가 다르므로 마진율(%)·성장률(%) 비교에는 문제없으나 절대금액을 섞어 계산하지 말 것.

## 1. 기업 개요
- 덴마크 소재 글로벌 제약사. 당뇨병 치료제(인슐린, GLP-1: Ozempic/Rybelsus)와 비만 치료제(GLP-1: Wegovy, 경구정 Wegovy pill)가 핵심 사업(Diabetes & Obesity Care 부문). 희귀질환(혈우병 등) 부문 별도.
- 주요 제품: Ozempic(당뇨), Wegovy(비만, 주사·경구정), Rybelsus(경구 GLP-1), 인슐린 제품군(NovoRapid/NovoLog 등).
- 2026년 초 Wegovy 경구정 출시, 1분기에만 130만 건 처방(자체 전망 상회).
- 경쟁사: Eli Lilly(Zepbound/Mounjaro, 최대 경쟁자, GLP-1 시장점유율 역전 우위), 그 외 화이자·암젠 등 GLP-1 파이프라인 진입 기업, 컴파운딩(조제) 약국(가격 저가 대체재).
- 최근 시장점유율: Novo 약 40% vs Lilly 약 60% (2026-02 CNBC 보도 기준).

## 2. 재무 실적 (연간, DKK 백만 단위 = 표시된 raw값 그대로, FY 12월 결산)

| 회계연도(말) | 매출 | 매출총이익 | 영업이익 | 순이익 | 희석EPS | 영업CF | FCF |
|---|---|---|---|---|---|---|---|
| FY2022 | 176,954M | 148,506M | 74,809M | 55,525M | 12.22 | 78,887M | 64,134M |
| FY2023 | 232,261M | 196,496M | 102,574M | 83,683M | 18.62 | 108,908M | 70,012M |
| FY2024 | 290,403M | 245,881M | 128,339M | 100,988M | 22.63 | 120,968M | 69,659M |
| FY2025 | 309,064M | 250,276M | 127,658M | 102,434M | 23.03 | 119,102M | 28,989M |

- 마진: 매출총이익률 FY2025 81.0%, 영업이익률 41.3%, 순이익률 33.1% (계산치, Yahoo `financialsChart`의 non-GAAP 순이익률 33.14%와 유사).
- FCF 급감(FY2025 28,989M, 전년 69,659M) — capex 증가 및 운전자본 부담 영향 추정(세부 원인 확인 불가).
- 출처: Yahoo fundamentals-timeseries, `asOfDate` = 각 회계연도말.

### 최근 분기 (DKK 백만)

| 분기 | 매출 | 영업이익 | 순이익(GAAP) | 희석EPS(GAAP) | 영업CF | FCF |
|---|---|---|---|---|---|---|
| 2Q2025(6/30) | 76,857 | - | 26,503 | 5.96(비GAAP 컨센서스 기준 실적) | - | - |
| 3Q2025(9/30) | 74,976 | 23,682 | 20,006 | 4.50 | 46,107 | 30,692 |
| 4Q2025(12/31) | 79,144 | 31,736 | 26,891 | 6.04 | 7,619 | -36,218 |
| **1Q2026(3/31)** | **96,823** | **59,618** | **48,557** | **10.91(GAAP)** / 6.63(비GAAP 컨센서스 대비 실적, 서프라이즈 -4.75%) | 24,084 | 12,045 |

- 1Q2026 매출 급증(QoQ +22%, YoY +32% 보고기준)은 **미국 340B 약가 프로그램 관련 일회성 충당금 환입(약 42억 달러)** 때문. 이를 제외한 조정 매출은 오히려 YoY -4%. 조정영업이익 328.6억 DKK(컨센서스 287.4억 상회), 조정영업이익은 YoY -6%.
- Obesity Care(비만) 조정 매출 YoY +22%, Wegovy가 견인.
- 회사는 2026 연간 가이던스를 조정매출·조정영업이익 각각 **-4%~-12%**(constant FX)로 상향 좁힘(기존 -5%~-13%).
- 출처: [Reuters/IndexBox](https://www.indexbox.io/blog/novo-nordisk-q1-2026-results-beat-expectations-wegovy-strength-drives-improved-outlook/), [GlobeNewswire 2026-05-06](https://www.globenewswire.com/news-release/2026/05/06/3288491/0/en/novo-nordisk-s-adjusted-operating-profit-reached-dkk-32-858-million-in-q1-2026.html), [CNBC 2026-05-06](https://www.cnbc.com/2026/05/06/wegovy-glp1-weight-loss-novo-nordisk-earnings-stock-nvo-ozempic.html)

## 3. 재무 안전성 (DKK 백만, 연말 기준)

| 항목 | FY2022 | FY2023 | FY2024 | FY2025 | 1Q2026(3/31) |
|---|---|---|---|---|---|
| 유동자산 | 108,194 | 139,646 | 161,788 | 172,453 | 177,317 |
| 유동부채 | 120,940 | 169,655 | 217,614 | 215,661 | 225,158 |
| 유동비율 | 0.89 | 0.82 | 0.74 | 0.80 | **0.79**(Yahoo financialData 0.788와 일치) |
| 재고자산 | 24,388 | 31,811 | 40,849 | 49,623 | 51,352 |
| 총부채(TotalDebt) | 25,784 | 27,006 | 102,787 | 130,958 | 146,382 |
| 자기자본(Stockholders Equity) | 83,486 | 106,561 | 143,486 | 194,047 | 203,065 |
| 부채/자본 | 30.9% | 25.3% | 71.6% | 67.5% | **72.1%**(Yahoo debtToEquity 72.09%) |

- 유동비율이 1.0 미만으로 그레이엄 기준 안전마진 취약. FY2024부터 총부채가 급증(102.8B→146.4B DKK, 2년 만에 약 5.7배) — 대규모 차입 확대 국면(생산설비 투자·자사주매입 등 추정, 세부 확인 불가).
- 이자보상배율: 확인 불가(이자비용 항목 미수집).
- ROE(financialData 기준, trailing): **71.4%**, ROA 19.25%. ROIC: 확인 불가(직접 계산 데이터 부족).
- Quick Ratio(Yahoo): 0.54.

## 4. 밸류에이션 (2026-07-15 기준, USD, ADR)

| 지표 | 값 |
|---|---|
| 현재가 | $49.07 |
| 시가총액 | $217.13B |
| Trailing PER | 11.82x |
| Forward PER | 15.18x (defaultKeyStatistics 모듈은 2.31x로 상이 — 통화/추정치 기준 차이로 추정, **확인 불가/상충**) |
| PBR | 7.02x (BVPS $6.99) |
| PSR (trailing 12M) | 0.66x |
| EV/EBITDA | 1.98x (EV $343.68B — EBITDA가 DKK, EV가 USD 혼재 가능성 있어 신뢰도 낮음, 참고용) |
| EV/Revenue | 1.05x |
| PEG | 3.66 |
| 배당수익률 | 3.66% (연배당 $1.80/주, 배당성향 42.6%) |
| 베타 | 0.36 |

- Forward PER 두 값(15.18x vs 2.31x)이 모듈 간 상충 — Yahoo 원자료 자체의 통화/추정 EPS 처리 오류로 판단, 리포트 작성 시 15.18x(summaryDetail) 채택 권고, 2.31x는 참고 제외.
- EV/EBITDA는 EBITDA($DKK 기준 173.88B로 표기되었으나 실제 USD 환산 여부 불명) 신뢰도 낮음 — **확인 불가로 처리 권고**.

## 5. 수급·심리 (기준일 명시)

| 항목 | 값 | 기준일 |
|---|---|---|
| 공매도 비율(% of Float) | 0.88% | 2026-06-30 |
| Short Ratio(일수) | 2.05 | 2026-06-30 |
| 공매도 주식수 | 27.78M (전월 22.68M 대비 증가) | 2026-06-30 |
| 내부자 지분율 | 0.00%(사실상 0, ADR 특성상 원주 기준 미반영 가능) | 조회일 |
| 기관 지분율 | 9.91% (기관 수 1,536개) | 조회일 |
| 애널리스트 등급 분포 | Strong Buy 0 / Buy 4 / Hold 10 / Sell 0 / Strong Sell 0 (총 14명) | 최근월(0m) |
| 추천 평균(recommendationMean) | 2.43 (Buy) | 조회일 |
| 목표주가(평균/중앙값/고/저) | $48.07 / $46.31 / $63.17 / $39.66 | 조회일 |
| 애널리스트 수(financialData) | 12명 | 조회일 |

- ADR 특성상 내부자 지분율은 원주(코펜하겐 상장) 기준과 다를 수 있어 참고용.
- 외부 검색 결과 등급 분포는 소스마다 상이(S&P Global 14명 Buy 컨센서스, 다른 소스는 5 Buy/5 Hold/2 Sell 등) — Yahoo 원자료(Buy 4/Hold 10) 우선 채택.

## 6. 주가 흐름

- 현재가 $49.07, 52주 고 $71.80 / 저 $35.12 → 저점 대비 +39.7%, 고점 대비 -31.7% (52주 레인지 내 하단권).
- 52주 변화율: -26.69%(YoY), 같은 기간 S&P500은 +20.37% — 대폭 언더퍼폼.
- 50일 이동평균 $45.56, 200일 이동평균 $47.51 — 현재가가 두 이평선 모두 상회(단기 반등 국면).
- 역사적 고점: $148.15(2024년 중반 피크 대비 약 -67%, 코펜하겐 원주 기준 고점 대비 -75% 보도).
- **최근 급락 이벤트**: 2026-02-23, 차세대 비만약 CagriSema 임상에서 Eli Lilly 경쟁제품 대비 열등한 결과 발표 → 주가 15%대 급락([Forbes](https://www.forbes.com/sites/martinadilicosa/2026/02/23/novo-nordisks-new-weight-loss-shot-loses-to-rival-eli-lilly-in-clinical-trial-stock-plummets/), [CNBC](https://www.cnbc.com/2026/02/23/novo-nordisk-stock-cagrisema-trial-fails-weight-loss.html)). 2026-02-04 실적 발표 시에도 2026년 성장 둔화 가이던스로 -15% 하락([CNBC](https://www.cnbc.com/2026/02/04/eli-lilly-novo-nordisk-earnings-glp1-market.html)).
- 이후 Wegovy 경구정 출시 호조(1Q2026 130만 처방) 등으로 저점(35.12) 대비 일부 반등한 상태.

## 7. 최근 뉴스·이벤트

| 항목 | 내용 | 날짜/출처 |
|---|---|---|
| 최근 실적 | 1Q2026 매출 968억 DKK(보고기준 YoY+32%, 340B 일회성 환입 제외 조정 시 YoY -4%), 조정영업이익 컨센서스 상회 | 2026-05-06, [GlobeNewswire](https://www.globenewswire.com/news-release/2026/05/06/3288491/0/en/novo-nordisk-s-adjusted-operating-profit-reached-dkk-32-858-million-in-q1-2026.html) |
| 가이던스 | FY2026 조정매출·조정영업이익 각 -4%~-12%(constant FX)로 소폭 상향(기존 -5%~-13%) | 2026-05-06, 상동 |
| 파이프라인 리스크 | 차세대 비만약 CagriSema 임상이 Eli Lilly 경쟁제품(Zepbound) 대비 열등 → 주가 15% 급락 | 2026-02-23, [Forbes](https://www.forbes.com/sites/martinadilicosa/2026/02/23/novo-nordisks-new-weight-loss-shot-loses-to-rival-eli-lilly-in-clinical-trial-stock-plummets/) |
| 신제품 | Wegovy 경구정(pill) 2026년 초 출시, 1분기 130만 건 처방(자체 전망 상회) | 2026, [IndexBox](https://www.indexbox.io/blog/novo-nordisk-vs-eli-lilly-wegovy-pill-shifts-the-glp-1-battle-in-2026/) |
| 소송/규제 | 투자자 집단소송(구 CEO 및 회사 상대, GLP-1 컴파운딩 시장 영향 과소평가·시장침투력 과대평가 주장) 진행 중, 2026-04-03 수정 소장에서 현 CEO(Maziar Mike Doustdar)는 피고에서 제외 | 2026-04-03, [SEC 6-K](https://www.sec.gov/Archives/edgar/data/0000353278/000035327826000018/caq12026.htm) |
| 소송/규제 | Novo·Lilly 상대 컴파운딩 약국(Strive)의 반독점 소송 제기(텔레헬스사와의 독점계약으로 컴파운딩 약국 배제 주장). 회사측은 중대한 재무 영향 없을 것으로 판단 | 2026-01-14, [BioSpace](https://www.biospace.com/business/compounder-sues-lilly-novo-claims-coordinated-crackdown) |
| 자사 소송 제기 | Novo Nordisk가 Hims & Hers를 상대로 컴파운딩 비만약 관련 소송 제기 | 2026-02-09, [CNBC](https://www.cnbc.com/2026/02/09/novo-nordisk-sues-hims-hers-compounded-obesity-drugs.html) |
| 경쟁 구도 | GLP-1 시장점유율 Novo 약 40% vs Eli Lilly 약 60%로 역전, Lilly 2026 매출 가이던스 +25% 성장(Novo는 역성장) | 2026-02, [CNBC](https://www.cnbc.com/2026/02/25/novo-nordisk-stock-nvo-lly-eli-lilly-ozempic-weight-loss-obesity.html) |
| 차기 실적 발표일 | 2026-08-05 (2Q2026) | Yahoo calendarEvents |

## 8. 애널리스트 컨센서스 (2Q2026, FY2026, FY2027 EPS/매출 추정, DKK 기준)

| 구분 | 0q(2Q2026, 6/30 마감) | +1q(3Q2026, 9/30 마감) | 0y(FY2026) | +1y(FY2027) |
|---|---|---|---|---|
| EPS 평균 | 5.18 | 4.658 | 21.61 | 21.23 |
| EPS 저/고 | 4.97 / 5.55 | 4.39 / 5.094 | 19.37 / 24.90 | 16.80 / 23.92 |
| EPS 분석가 수 | 3 | 3 | 8 | 8 |
| EPS 성장률(YoY) | -13.09% | +3.51% | -6.17% | -1.74% |
| 매출 평균 | 71,522M | 71,533M | 293,298M | 299,205M |
| 매출 저/고 | 69,910M / 73,274M | 69,756M / 73,493M | 272,677M / 321,414M | 273,098M / 339,130M |
| 매출 분석가 수 | 12 | 10 | 28 | 28 |
| 매출 성장률(YoY) | -6.94% | -4.59% | -5.10% | +2.01% |

- 분석가 수·추정치 분산이 EPS(3~8명, 범위 넓음)와 매출(10~28명)에서 차이 — EPS 추정 신뢰구간이 상대적으로 넓음에 유의.
- 2Q2026(8/5 발표 예정) 시장 컨센서스: 매출 $71.5B DKK(약 715억), EPS 5.18 DKK — 외부 소스(웹검색) 기준 EPS 5.31 USD/매출 $73.06B USD 추정치도 존재(통화 상이, 교차검증 시 유의).

## 9. 확인 불가 항목 목록
- 이자보상배율(이자비용 데이터 미수집)
- ROIC(직접 계산용 세부 데이터 부족)
- FY2025 FCF 급감의 세부 원인(설비투자·운전자본 항목별 분해)
- EV/EBITDA의 통화 정합성(EBITDA가 DKK인지 USD 환산인지 불명확 — 참고용으로만 사용)
- Forward PER 상충값 처리(15.18x vs 2.31x 중 후자의 근거)
- ADR 기준 내부자 지분율(원주 기준과 상이할 가능성, 원주 데이터 미수집)
