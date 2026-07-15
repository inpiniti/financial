# AMD (Advanced Micro Devices, Inc.) 데이터 팩

- 조회일: 2026-07-15 (미 동부시간 2026-07-14 종가 기준)
- 거래소: NASDAQ(NMS), 통화: USD
- 데이터 출처: Yahoo Finance chart/fundamentals-timeseries/quoteSummary API, WebSearch(뉴스)

## 1. 기업 개요

- **사업 모델**: 팹리스 반도체 설계사. CPU(x86, EPYC 서버·Ryzen PC), GPU(Radeon 게이밍, Instinct AI 가속기), 임베디드(자일링스 FPGA 인수분), 데이터센터·PC·게이밍·임베디드 4개 세그먼트.
- **주요 성장 동력**: Instinct MI 시리즈 AI GPU(MI300 → MI400, 2026년 하반기 출시 예정)로 데이터센터 AI 가속기 시장에서 Nvidia에 도전.
- **경쟁사**: Nvidia(AI GPU 절대강자), Intel(x86 CPU), Qualcomm/Broadcom(일부 임베디드·네트워킹), Marvell(데이터센터 커스텀 실리콘).

## 2. 재무 실적 (연간, GAAP 기준, 단위: 백만 USD)

| 회계연도(12/31) | 매출 | 매출총이익률 | 영업이익률 | 순이익(GAAP) | 희석EPS | OCF | FCF |
|---|---|---|---|---|---|---|---|
| FY2022 | 23,601 | 44.9% | 5.4% | 1,320 | 0.84 | 3,565 | 3,115 |
| FY2023 | 22,680 | 46.1% | 1.8% | 854 | 0.53 | 1,667 | 1,121 |
| FY2024 | 25,785 | 49.4% | 8.1% | 1,641 | 1.00 | 3,041 | 2,405 |
| FY2025 | 34,639 | 49.5% | 10.7% | 4,335 | 2.65 | 7,709 | 6,735 |

- ROE(GAAP 순이익/자기자본, 기말 기준): FY2022 2.4% → FY2023 1.5% → FY2024 2.9% → FY2025 6.9%. ROIC은 별도 미산출(NOPAT·투하자본 세부 조정 불가 — 확인 불가).
- 참고: Yahoo `earnings` 모듈 표시 순이익(FY2025 6,831M, 마진 19.7%)은 **Non-GAAP(조정) 기준**이라 위 GAAP 표와 다름. 위 표는 fundamentals-timeseries(GAAP 원자료)를 사용.

### 최근 분기 (GAAP, 단위: 백만 USD)

| 분기 | 매출 | 매출총이익 | 영업이익 | 순이익 | 희석EPS(GAAP) |
|---|---|---|---|---|---|
| 3Q2025 (9/30) | 9,246 | 4,780 | 1,270 | 1,243 | 0.75 |
| 4Q2025 (12/31) | 10,270 | 5,577 | 1,752 | 1,511 | 0.92 |
| 1Q2026 (3/31, 최신) | 10,253 | 5,416 | 1,476 | 1,383 | 0.84 |

- 1Q2026 매출 YoY +38%, 데이터센터 부문 매출 YoY +57%(5.8B$) — 뉴스 참조.
- 1Q2026 Non-GAAP EPS $1.37 (컨센서스 상회, 가이던스 상단 초과).
- TTM(2Q25~1Q26) 매출 37,454M$ (financialData.totalRevenue와 일치).
- 2Q2026(다음 분기) 가이던스: 매출 약 11.2B$ ±300M (YoY +46%), 컨센서스(11.30B$, 애널리스트 39명) 상회.

## 3. 재무 안전성 (최근 분기 1Q2026 기준, 단위: 백만 USD)

| 항목 | 값 |
|---|---|
| 유동자산 | 28,628 |
| 유동부채 | 10,506 |
| 유동비율 | 2.72배 (Yahoo `currentRatio` 확인치 일치) |
| 당좌비율(quickRatio) | 1.75배 |
| 재고자산 | 8,045 |
| 총부채(TotalDebt) | 3,871 |
| 총현금 | 12,347 |
| 순부채 | 마이너스(순현금 8,476M, 총현금-총부채) |
| 자기자본 | 64,462 |
| 부채/자본(Debt/Equity) | 6.0%(Yahoo 표기, 총부채/자기자본 기준으로 매우 낮음) |
| 이자보상배율 | 확인 불가(이자비용 세부 항목 미제공) |

- 재무 안전성 매우 양호: 유동비율 2.7배, 순현금 포지션, 총부채/자기자본 6% 수준.

## 4. 밸류에이션 (2026-07-14 종가 기준)

| 항목 | 값 |
|---|---|
| 현재가 | $548.13 |
| 시가총액 | $893.78B |
| PER(trailing GAAP) | 178.5배 |
| PER(forward) | 41.1배 |
| PBR | 13.86배 (BVPS $39.55) |
| PSR(trailing) | 23.86배 |
| EV/EBITDA | 116.1배 (EBITDA 마진 낮은 GAAP 기준 왜곡 — 참고용) |
| PEG | 1.34 |
| 배당수익률 | 없음(무배당) |
| 베타 | 2.47 |

- trailing PER·EV/EBITDA가 극단적으로 높은 이유: GAAP 순이익·EBITDA가 자일링스 인수 관련 상각 등으로 낮게 잡히기 때문. Forward PER(41배)·PEG(1.34)가 밸류에이션 판단에 더 적합.

## 5. 수급·심리 (기준일 2026-06-30 전후)

| 항목 | 값 |
|---|---|
| 공매도 비율(% of float) | 2.56% (숏 주식 41.58M주, shortRatio 1.3일) |
| 전월 대비 숏 잔고 | 44.07M → 41.58M (감소) |
| 내부자 지분율 | 0.40% |
| 기관 지분율 | 71.97% (기관 4,261개) |
| 발행주식수 | 1,630.6M |

### 애널리스트 등급 분포 (최근월, 총 51명)

| 구분 | 인원 |
|---|---|
| Strong Buy | 5 |
| Buy | 36 |
| Hold | 10 |
| Sell | 0 |
| Strong Sell | 0 |

- 추천 평균(recommendationMean) 1.49 → "Strong Buy" 등급.
- 목표주가: 평균 $525.40, 중앙값 $515, 최고 $725(KeyBanc, 월가 최고치), 최저 $320. 애널리스트 수 47명.
- 현재가($548.13)가 평균 목표가를 이미 상회 — 최근 랠리로 목표가 상향 조정이 이어지는 국면.

## 6. 주가 흐름

| 항목 | 값 |
|---|---|
| 52주 최고 | $584.73 (전고점=역사적 최고가) |
| 52주 최저 | $149.22 |
| 현재가 | $548.13 (52주 레인지 상단 근접, 고점 대비 -6.3%) |
| 50일 이동평균 | $485.84 |
| 200일 이동평균 | $289.53 |
| 52주 등락률 | +243.4% |

- 최근 1년간 저점($149) 대비 3.7배 급등. 200일선($290) 대비 현재가 89% 상회 — 강한 상승 추세.
- **최근 급등 원인** (2026-07 초·중순): MI400/Venice 프로세서에 대한 수요 기대(Morgan Stanley 7/9 리포트), KeyBanc·BofA·TD Cowen 등 목표주가 상향(KeyBanc $725로 월가 최고), Zen 6 CPU 출시 모멘텀. [Interactive Crypto](https://www.interactivecrypto.com/amd-s-ai-chip-surge-and-zen-6-launch-drive-stock-higher-amid-sector-rally-jul-2026), [Benzinga](https://www.benzinga.com/analyst-stock-ratings/reiteration/26/07/60447358/amd-stock-surges-as-keybanc-bank-of-america-and-td-cowen-turn-more-bullish)
- **리스크 요인**: TSMC CoWoS(첨단 패키징) 공급 병목 — TSMC CEO(2026-06-04)는 2026년 내내 완전 매진, 리드타임 52~78주라고 언급. Nvidia가 CoWoS 용량의 약 60%를 확보한 반면 AMD는 약 11%에 그침 — MI400 램프업 속도 제약 우려. [Forbes](https://www.forbes.com/sites/greatspeculations/2026/07/13/will-tsmcs-capacity-crunch-derail-the-amd-stock-rally/)

## 7. 최근 실적·이벤트

- **1Q FY2026 실적(발표 2026-05-05)**: 매출 $10.25B(YoY +38%, 자체 가이던스 상단 초과), Non-GAAP EPS $1.37(컨센서스 $1.27~1.29 상회). 데이터센터 매출 $5.8B(YoY +57%), EPYC·Instinct GPU 수요 견조. [TradingKey](https://www.tradingkey.com/analysis/stocks/us-stocks/261861695-amd-earnings-datacenter-revenue-epyc-instinct-ai-inference-tradingkey), [DCD](https://www.datacenterdynamics.com/en/news/amd-posts-q1-2026-data-center-revenue-of-58bn-forecasts-120bn-server-cpu-income-by-2030/)
- **가이던스**: 2Q FY2026 매출 약 $11.2B±$300M(YoY +46%, QoQ +9%), 컨센서스($10.5B) 상회. CEO 리사 수는 내년 데이터센터 AI 매출 "수백억 달러" 자신감 표명, 서버 CPU 시장 성장 전망을 연 18%→35%로 상향, 2030년까지 서버 CPU 매출 $120B 목표 제시.
- **차기 실적 발표일**: 2026-08-04 (Yahoo calendarEvents 확정치, 컨센서스 EPS $1.61, 매출 $11.30B, 애널리스트 39~40명).
- **규제/소송 리스크**: 2025년 4월 미국 정부의 대중국 AI칩(MI308) 수출 라이선스 규제로 2Q2025에 약 $800M 재고 관련 비용 인식. 2025년 4분기부터 라이선스 승인받아 출하 재개, 약 $360M 환입. 2025년 8월 미 정부가 라이선스 대가로 매출의 15%를 요구한다는 보도 있었으나 정식 규정은 미공표 상태 — 향후 규정화 시 소송 리스크 가능성 존재. 리사 수 CEO는 중국이 여전히 매출의 약 20% 차지한다고 언급. [CNBC](https://www.cnbc.com/2025/07/15/amd-mi308-ai-chip-china.html), [SEC 10-Q FY2026](https://www.sec.gov/Archives/edgar/data/0000002488/000000248826000076/amd-20260328.htm)

## 8. 확인 불가 항목

- ROIC (투하자본이익률) — 세부 조정 항목 미제공으로 미산출
- 이자보상배율 — 이자비용 별도 라인 미확인
- 배당수익률/배당 관련 — AMD 무배당 정책으로 해당사항 없음
- EV/EBITDA의 실질적 의미 — GAAP EBITDA가 상각비 영향으로 왜곡되어 있어 정상화 EBITDA 기준 재계산 필요(원자료 미확보)
