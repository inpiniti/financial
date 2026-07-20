# BRK.B (Berkshire Hathaway Inc. Class B) 공용 데이터 팩

조회일: 2026-07-20 (가격 데이터 기준일: 2026-07-17 종가, Yahoo `BRK-B`)
※ Yahoo Finance 티커 표기는 `BRK-B`. 본 문서 및 보고서 표기는 `BRK.B` 유지.

## 1. 기업 개요
- 섹터/산업(GICS 유사): Financial Services / Insurance-Diversified (지주회사, 사실상 복합기업)
- 본사: Omaha, NE / 직원 387,800명 / CEO: Greg Abel(2026-01-01 취임, 워런 버핏 후임), 버핏은 이사회 의장 유지, Ajit Jain(보험 부문 부회장)
- 사업 모델: 보험(GEICO, 재보험, 특수보험) 언더라이팅 + 플로트 운용을 축으로, 철도(BNSF), 에너지(BHE, 발전·송전·가스), 제조·서비스·소매(정밀부품·건자재·소비재 등) 자회사군과 대규모 상장주식 포트폴리오(애플, 아메리칸익스프레스 등)를 보유한 복합 지주회사.
- 주요 세그먼트: 보험 언더라이팅/투자, BNSF 철도, Berkshire Hathaway Energy, 제조/서비스/소매, 상장주식 투자 포트폴리오
- 경쟁사(직접 비교 어려운 복합기업이나 부문별): 보험(Chubb, Travelers, Progressive), 철도(Union Pacific, CSX), 유틸리티(NextEra Energy, Duke Energy), 지주회사 구조(Markel, Loews)

## 2. 재무 요약 (연간, USD)
| 항목 | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---|---|---|---|
| 매출(annualTotalRevenue) | 234.1B | 439.3B* | 424.2B* | 410.5B* |
| 순이익(annualNetIncome) | -22.76B | 96.22B | 89.00B | 66.97B |
| 희석 EPS | -10.33 | 44.27 | 41.27 | 31.04 |
| 영업현금흐름 | 37.35B | 49.20B | 30.59B | 45.97B |
| FCF | 21.89B | 29.79B | 11.62B | 25.04B |
| 자기자본(Stockholders Equity) | 473.4B | 561.3B | 649.4B | 717.4B |
| 총부채(Total Debt) | 122.7B | 128.3B | 124.8B | 129.1B |

*주: Yahoo `annualTotalRevenue`는 파생상품·유가증권 평가손익을 포함한 GAAP 총수익 개념이라 연도별 변동폭이 큼(버핏의 "영업이익" 기준과 다름). `financialData.totalRevenue`(TTM) = 375.4B, `financialData.earnings.financialsChart`(비영업이익 제외) 기준 매출: FY2022 302.1B / FY2023 364.5B / FY2024 371.4B / FY2025 371.4B, 순이익(비GAAP): FY2022 30.8B / FY2023 37.4B / FY2024 47.4B / FY2025 44.5B — 시장 컨센서스는 이 비GAAP 기준을 주로 인용.
자료: Yahoo fundamentals-timeseries, quoteSummary(financialData/earnings), 조회일 2026-07-20.

### 최근 분기 (2026-03-31, 1Q2026)
| 항목 | 1Q2025 | 2Q2025 | 3Q2025 | 4Q2025 | 1Q2026 |
|---|---|---|---|---|---|
| 매출 | 83.29B | 98.88B | - | 111.44B | 92.07B |
| 순이익(GAAP) | 4.60B | 12.37B | - | 19.20B | 10.11B |
| 희석 EPS | 2.13 | 5.73 | - | - | 4.68 |
| 영업이익(비GAAP, WebSearch) | 9.64B(전년동기) | - | - | - | 11.35B(컨센 11.56B 미스) |
| FCF | 6.62B | 5.23B | - | 4.99B | 5.45B |

1Q2026(Greg Abel 취임 후 첫 분기): 영업이익 11.35B(전년비 +18%, 컨센서스 미달), 순이익 10.1B(전년동기 4.6B 대비 2배 이상, 주식평가익 반영). 보험 언더라이팅 이익 +28%(1.72B), BNSF 1.38B, BHE 1.11B. 현금성자산 397B로 사상 최대. 출처: [Berkshire Hathaway Q1 2026 earnings](https://finance.yahoo.com/markets/stocks/articles/berkshire-hathaway-q1-2026-earnings-120012784.html), [IndexBox](https://www.indexbox.io/blog/berkshire-hathaway-q1-2026-results-record-cash-reserves-under-new-ceo-greg-abel/), 2026-05.

### 마진·수익성 (TTM 기준, financialData)
| 지표 | 값 |
|---|---|
| 매출총이익률 | 27.78% |
| 영업이익률 | 14.35% |
| EBITDA마진 | 31.44% |
| 순이익률 | 19.30% |
| ROE | 10.50% |
| ROA | 5.39% |
| ROIC | 확인 불가(지주회사 구조상 투하자본 정의 모호, Yahoo 미제공) |

## 3. 재무 안전성
| 지표 | 값 (asOfDate) |
|---|---|
| 유동비율(currentRatio) | 2.88 |
| 당좌비율(quickRatio) | 2.70 |
| 총현금(totalCash) | 397.4B (1Q2026) |
| 총부채(totalDebt) | 128.9B (1Q2026) |
| 순현금(=총부채-총현금) | -268.5B (순부채 아닌 순현금 우위) |
| 부채/자본(debtToEquity) | 17.67% |
| 이자보상배율 | 확인 불가(Yahoo 미제공; 보험/에너지 자회사별 부채 구조가 상이해 연결 기준 산출 어려움) |
| 유동자산/유동부채/재고 세부 | 확인 불가(Yahoo fundamentals-timeseries에 annualCurrentAssets/Liabilities/Inventory 항목 미제공 — 지주회사 재무제표는 통상 대차대조표 형태가 아님) |

## 4. 밸류에이션
| 지표 | 값 |
|---|---|
| 현재가(2026-07-17 종가) | $490.91 |
| 시가총액 | $1.059T |
| PER(trailing) | 14.62 |
| PER(forward) | 22.82 (버핏 초과이익 제외한 낮은 forward EPS 추정 반영) |
| PBR | 1.46 (수정치: 북밸류는 A주 기준 $505,559.44 → B주 환산 $337.04, Yahoo 원자료 PBR 0.00은 A/B 환산 오류이므로 무시) |
| PSR | 2.82 |
| EV/EBITDA | Yahoo 원자료 -2.25는 순현금 우위로 EV가 음수가 되어 무의미. 순현금 반영 수정 EV≈$790.3B → EV/EBITDA ≈ 6.70배(EBITDA 118.0B 기준) |
| EV/Sales(수정) | 2.11배 |
| PEG | 10.06(저성장 반영, 참고용) |
| 배당수익률 | 0% (무배당 정책 유지) |

## 5. 수급·심리
| 지표 | 값 (기준일) |
|---|---|
| 공매도 비율(shortPercentOfFloat) | 0.96% (2026-03-31) |
| 내부자 지분율 | 0.26% |
| 기관 지분율 | 67.31% (기관 5,860개) |
| 애널리스트 등급 분포(최근월) | 강력매수 0 / 매수 2 / 보유 2 / 매도 0 / 강력매도 0 (총 커버리지 3~4명으로 소수) |
| 목표주가 | 평균 $520.33 / 중앙값 $510 / 최고 $570 / 최저 $481 |
| 추천 요약(recommendationKey) | buy (mean 2.00) |

## 6. 주가 흐름
| 지표 | 값 |
|---|---|
| 52주 고가/저가 | $516.85 / $455.19 |
| 현재가 위치 | 고점 대비 -5.0%, 저점 대비 +7.9% (박스권 중상단) |
| 사상 최고/최저 | $542.07 / $19.80(분할조정 전 포함 장기 데이터) |
| 50일/200일 이평선 | $487.59 / $490.29 (200일선 부근에서 등락) |
| 베타 | 0.61 (저변동) |
| 1년/YTD 흐름 | 52주 변화 +3.48%(vs S&P500 +18.27%), 2026 YTD -1.8%(S&P500 +10.7%). 6월 강한 반등으로 연초 대비 격차 축소(6/1 기준 -17.5%p → 현재 -12.4%p). 출처: [CNBC 2026-07-11](https://www.cnbc.com/2026/07/11/berkshire-hathaway-gains-ground-but-still-trails-the-sp-500-as-26-enters-second-half.html) |

## 7. 최근 뉴스/이벤트
| 항목 | 내용 | 출처/날짜 |
|---|---|---|
| 차기 실적 발표(2Q2026) | 2026-08-01 (추정), EPS 컨센서스 $5.05 | Yahoo calendarEvents |
| CEO 승계 | 2026-01-01 Greg Abel이 CEO 취임, 버핏은 이사회 의장으로 유임 | Yahoo/Forbes 2026-05 |
| 버핏 지분 처분 계획 | 향후 8년간 보유 주식 전량(약 $140B) 자선단체 등에 매각/증여 계획 발표, 게이츠재단 신규 증여는 일시 중단, 자녀 재단 등으로 이전 확대 | [Bloomberg 2026-07-14](https://www.bloomberg.com/news/articles/2026-07-14/buffett-to-offload-berkshire-stake-in-8-years-as-gates-snubbed) |
| 현금 보유 | 1Q2026말 현금 397B로 사상 최대, 12분기 연속 순매도(주식 매도초과 150B+ 누적) — 밸류에이션 부담 시사 | [Motley Fool 2026-06-27](https://www.fool.com/investing/2026/06/27/warren-buffetts-berkshire-hathaway-is-sitting-on-n/) |
| 규제/소송 | 확인된 중대 이슈 없음(WebSearch 범위 내) |

## 8. 애널리스트 컨센서스 (연간)
| 구분 | FY2026(E) |
|---|---|
| EPS 컨센서스 | $20.80 (전년비 +0.89%, 애널리스트 3명) |
| 매출 컨센서스 | $388.8B (전년비 +4.67%, 애널리스트 2명) |
| 2Q2026 EPS 컨센서스 | $5.05 (전년동기 $5.17 대비 -2.35%, 애널리스트 2명) |
※ 커버리지 애널리스트 수가 2~4명으로 소수 — 컨센서스 신뢰구간 낮음에 유의.

## 9. SBC 조정
Berkshire는 자회사 대부분이 완전 인수된 비상장 자회사라 스톡옵션/RSU 기반 보상(SBC) 비중이 S&P500 평균 대비 극히 낮음. Yahoo cashflow 항목에 별도 SBC 조정치 없음 — "SBC로 인한 이익 왜곡"은 사실상 미미한 것으로 판단(확인 불가지만 정성적으로 낮은 리스크).

## 10. 동종업계 컴프 (참고용, 부문별 비교사 상이)
| 기업 | PER(trailing) | PBR | EV/EBITDA | 영업이익률 |
|---|---|---|---|---|
| BRK.B | 14.62 | 1.46(수정) | 6.70(수정) | 14.35% |
| Chubb (CB) | 확인 불가(본 세션 미조회) | 확인 불가 | 확인 불가 | 확인 불가 |
| Union Pacific (UNP) | 확인 불가 | 확인 불가 | 확인 불가 | 확인 불가 |
| Markel (MKL) | 확인 불가 | 확인 불가 | 확인 불가 | 확인 불가 |
※ 컴프사 개별 조회는 본 세션 범위 외(시간 제약) — 필요 시 개별 데이터 팩 추가 조회 요망. 해당 필드 불확인.

## 11. 순부채·ROA·EV/Sales·Forward PER
| 지표 | 값 |
|---|---|
| 순부채(총부채-총현금) | -268.5B (순현금 268.5B 우위) |
| ROA | 5.39% |
| EV/Sales(수정) | 2.11배 |
| Forward PER | 22.82배 |

## 12. 희석 리스크
전환사채·스톡옵션 없음(플로트/영구자본 중심 지주회사 구조). 발행주식(sharesOutstanding, A+B 환산) 1,398,308,677주(B주 환산 기준), impliedSharesOutstanding 2,156,853,797(A주 환산 포함 전체 경제적 지분 추정치로 Yahoo 계산방식 상 A/B 혼합). 희석 리스크는 사실상 없음 — 버핏의 자선 증여로 인한 매도 압력(연 수백만 B주 규모)이 유일한 대량 공급 요인.

## 13. 환율 필드
해당 없음 (미국 내수 상장, ADR 아님).

## 14. 업종별 특화 지표 — 보험(다각화 지주회사 성격 감안 참고용)
| 지표 | 값 |
|---|---|
| 언더라이팅 이익(1Q2026) | $1.72B (전년비 +28%) |
| 콤바인드레이쇼 | 확인 불가(세그먼트 세부 비율 미조회) |
| 신계약 프리미엄 성장 | 확인 불가 |
※ Berkshire는 순수 보험사가 아닌 복합기업이라 업종 특화지표 적용에 한계 있음.

## 15. 거시 이벤트 캘린더
| 일정 | 내용 |
|---|---|
| 2026-08-01(추정) | 2Q2026 실적 발표 |
| FOMC/CPI 등 거시 일정 | 확인 불가(본 세션 미조회, 필요 시 별도 확인) |

## 16. ESG/지배구조 스크리닝
- 진행 중 중대 소송/규제 위반: 확인된 바 없음(WebSearch 범위 내)
- 경영진 리스크: 2026-01 CEO 승계(버핏→Abel) 완료, 이슈 없이 순조롭게 진행 중. governance risk score(Yahoo) — auditRisk 10, boardRisk 10, compensationRisk 9, shareHolderRightsRisk 10, overallRisk 10 (10점 만점 중 최고 리스크 등급 — 이중 클래스 주식 구조·이사회 독립성 관련 통상적 저평가 요인으로 해석, 실질 스캔들 아님)

---
### 데이터 출처
- Yahoo Finance chart API (`BRK-B`, range=1y interval=1wk), fundamentals-timeseries, quoteSummary(summaryDetail/defaultKeyStatistics/financialData/earningsTrend/earnings/majorHoldersBreakdown/recommendationTrend/calendarEvents/assetProfile) — 조회일 2026-07-20
- WebSearch: CNBC(2026-07-11), Bloomberg(2026-07-14), Motley Fool(2026-06-27), Yahoo/Forbes/IndexBox(2026-05, 1Q2026 실적)
- SEC EDGAR: 본 세션 미조회(시간 제약, Yahoo 데이터로 충분히 정합성 확보되어 생략)

### 확인 불가 항목 목록
유동자산/유동부채/재고 세부, 이자보상배율, ROIC, 동종업계 컴프 개별사 수치, 콤바인드레이쇼/신계약 프리미엄 성장, FOMC/CPI 등 일반 거시 캘린더, SBC 조정 정량치
