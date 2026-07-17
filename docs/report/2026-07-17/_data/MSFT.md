# MSFT (Microsoft Corporation) 공용 데이터 팩

조회일: 2026-07-17 (미국 동부 기준 장중, Yahoo Finance quote 기준)

## 1. 기업 개요

- **사업 모델**: 소프트웨어·클라우드·디바이스 종합 플랫폼 기업. 3대 보고 세그먼트
  - **Productivity and Business Processes**: Office 365/M365, LinkedIn, Dynamics 365, Copilot(생산성 AI)
  - **Intelligent Cloud**: Azure(클라우드 인프라·AI), Windows Server, GitHub, 엔터프라이즈 서비스
  - **More Personal Computing**: Windows OEM, Surface, Xbox/게이밍(Activision Blizzard 포함), Bing/검색광고
- **경쟁사**: Azure — AWS(Amazon), Google Cloud / 생산성 SW — Google Workspace / 게임 — Sony(PlayStation) / AI — OpenAI(파트너이자 잠재 경쟁), Google Gemini, Amazon(Bedrock)
- FY(회계연도)는 6월 말 마감. FY2026 = 2025년 7월~2026년 6월.

## 2. 재무 실적 (연간 FY2022~FY2025, 단위: $M, Yahoo fundamentals-timeseries, asOfDate=6/30 각 연도)

| 항목 | FY2022 | FY2023 | FY2024 | FY2025 |
|---|---:|---:|---:|---:|
| 매출 | 198,270 | 211,915 | 245,122 | 281,724 |
| 매출총이익률 | 68.4% | 68.9% | 69.8% | 68.8% |
| 영업이익률 | 42.1% | 41.8% | 44.6% | 45.6% |
| 순이익 | 72,738 | 72,361 | 88,136 | 101,832 |
| 희석 EPS ($) | 9.65 | 9.68 | 11.80 | 13.64 |
| FCF | 65,149 | 59,475 | 74,071 | 71,611 |
| 영업현금흐름 | 89,035 | 87,582 | 118,548 | 136,162 |
| 자기자본(Equity) | 166,542 | 206,223 | 268,477 | 343,479 |
| 총부채 | 61,270 | 59,965 | 67,127 | 60,588 |
| ROE | 43.7% | 35.1% | 32.8% | 29.6% |
| 부채/자본(D/E) | 36.8% | 29.1% | 25.0% | 17.6% |

- ROIC: 확인 불가(투하자본 세부 산정 불가, quoteSummary에 항목 없음)
- 참고: FY2025 FCF가 전년 대비 소폭 감소(AI 데이터센터 capex 급증 영향). 언론 보도상 "최근 2년간 FCF 사실상 정체" 지적 다수(Motley Fool 2026-07-15).

### 최근 분기 (FY2026 Q3, 2026-03-31 마감 / FY2026 Q2, 2025-12-31 마감)

| 항목 | FY26 Q2 (12/31) | FY26 Q3 (3/31) |
|---|---:|---:|
| 매출 | 81,273 | 82,886 |
| 매출총이익 | 55,295 | 56,058 (67.6%) |
| 영업이익 | 38,275 | 38,398 (46.3%) |
| 순이익 | 38,458 | 31,778 (38.3%) |
| 희석 EPS | 5.16 | 4.27 (컨센서스 4.10 상회, 서프라이즈 +4.9%) |
| FCF | 5,882 | 15,803 |
| 유동자산 | 180,190 | 175,329 |
| 유동부채 | 130,005 | 136,661 |
| 유동비율 | 1.39 | 1.28 |
| 재고 | 1,059 | 1,219 |
| 총부채 | 57,607 | 56,965 |
| 자기자본 | 390,875 | 414,367 |

**FY26 Q3(2026-04-29 발표) 하이라이트**: 매출 $82.9B, Azure 매출 성장률 +40% YoY(컨센서스 35~36% 상회), AI 사업 연환산 매출(run-rate) $37B(+123% YoY), Copilot 유료 시트 2,000만 돌파(1월 1,500만→33% 증가). 다만 capex가 전년比 63% 급증해 연간 capex 가이던스 약 $190B로 상향 — FCF 훼손 우려의 근원. (출처: CNBC 2026-04-29, Microsoft Source 2026-04-29, Alphastreet)

## 3. 재무 안전성 (그레이엄류 평가용, 최근분기 기준 2026-03-31)

| 항목 | 값 |
|---|---:|
| 유동자산 | $175,329M |
| 유동부채 | $136,661M |
| 유동비율 | 1.28 |
| 당좌비율(quickRatio, Yahoo) | 1.14 |
| 총부채 | $56,965M(분기)/$60,588M(FY25말, Yahoo financialData 기준 totalDebt $125.4B는 리스부채 등 포함 광의치 — 괴리 있음, 아래 참고) |
| 재고 | $1,219M (경상 매출 대비 미미 — 소프트웨어 기업 특성) |
| 이자보상배율 | 확인 불가(이자비용 raw 데이터 미취득) |
| NCAV(순유동자산-총부채) | 유동자산-총부채 기준 대략 음수 아님이나 시총 대비 무의미하게 작음(대형 성장주 특성상 NCAV 투자 대상 아님) |

**주의**: `financialData.totalDebt`($125.4B, quoteSummary)와 `annualTotalDebt`(fundamentals-timeseries, $60.6B)가 큰 차이. 전자는 운용리스부채 등을 포함한 광의 부채, 후자는 유이자부채(회사채 등) 중심으로 추정. 상세 조정 불가 — "확인 불가"로 표시, 두 수치 모두 참고용 병기.

## 4. 밸류에이션 (조회일 2026-07-17 기준)

| 항목 | 값 |
|---|---:|
| 현재가 | $393.11 |
| 시가총액 | $2.918조 |
| PER (trailing) | 23.4배 |
| PER (forward) | 20.3배 |
| PBR | 7.04배 (BVPS $55.78) |
| PSR (trailing 12M) | 9.17배 |
| EV/EBITDA | 16.4배 |
| PEG | 1.19 |
| 배당수익률 | 0.91% |

## 5. 수급·심리 (조회일 2026-07-17)

| 항목 | 값 |
|---|---:|
| 공매도 비율(% of float) | 1.2% |
| 내부자 지분율 | 0.08% |
| 기관 지분율 | 76.1% |
| 베타 | 1.13 |

### 애널리스트 등급 분포 (최신월, recommendationTrend)

| Strong Buy | Buy | Hold | Sell | Strong Sell |
|---:|---:|---:|---:|---:|
| 12 | 41 | 3 | 0 | 0 |

- 종합 추천: **Strong Buy** (analyst 수 55명, financialData 기준)
- 목표주가: 평균 $558.66 / 최고 $870 / 최저 $400 (현재가 대비 평균 +42% 상방)

### 컨센서스 추정 (earningsTrend, 조회일 기준)

| 기간 | EPS 추정 평균 | 매출 추정 평균 | YoY 성장률 | 애널리스트 수 |
|---|---:|---:|---:|---:|
| 0Q(FY26 Q4, 6/30 마감) | $4.24 | $87.67B | +16.2% | 30 |
| +1Q(FY27 Q1) | $4.62 | $89.69B | +11.9% | 26 |
| 0Y(FY26 전체) | $16.81 | $329.51B | +23.3% | 24 |

## 6. 주가 흐름

- 52주 고가: $555.45 / 52주 저가: $349.20 / 현재가 $393.11 → 52주 밴드 내 하위 약 21% 위치(고점 대비 약 -29%)
- 최근 1년 추이: 2025년 7월 $510선 → 2025년 하반기 $500~550 박스권 → 2026년 4~5월 실적 호조에도 6월 급락 시작, 6월 한 달간 -21.6%(사상 최대 6월 낙폭 중 하나), 2026년 연초 대비 -24% 이상 하락 후 7월 현재 $380~400 박스권에서 등락
- **최근 급등락 원인**:
  - AI 데이터센터 capex 급증(전년比 +63%, 연간 가이던스 ~$190B)에 따른 FCF 정체·훼손 우려가 6~7월 하락의 핵심 동인 (Motley Fool 2026-06-25, 2026-07-15)
  - 6월 초 트럼프 행정부의 AI 소프트웨어 심사 프로그램 관련 행정명령이 주가에 단기 악재로 작용
  - FTC의 Azure/Copilot/클라우드 번들링 반독점 조사 확대(2026년 상반기 내내 진행 중, AWS·Google Cloud·Salesforce 등 경쟁사에도 자료 요청) — 규제 리스크 지속
  - Xbox 게이밍 부문 마진 압박: 하드웨어 매출 YoY -33%, 게이밍 매출 -7%, 약 1,000명 규모 감원 계획 보도
  - 다만 4/29 발표 FY26 Q3 실적 자체는 Azure +40%·Copilot 시트 2,000만 등 예상 상회 — "펀더멘털은 견조하나 capex/규제 우려에 밸류에이션 디레이팅" 구도로 다수 매체 진단

## 7. 최근 뉴스·이벤트 요약

| 항목 | 내용 |
|---|---|
| 최근 실적 | FY26 Q3(2026-04-29 발표, 3/31 마감): 매출 $82.9B, EPS $4.27(컨센서스 상회), Azure +40% YoY, AI 연환산 매출 $37B(+123%) |
| 가이던스 | FY2026 capex 약 $190B (메모리 가격 급등 영향 포함) |
| 규제·소송 | FTC의 Azure/Windows/Office 번들링 및 AI 관행 반독점 조사 진행 중(2026-02 확대 보도, Bloomberg/CIO) — 결론 시점 확인 불가 |
| 기타 이슈 | Xbox 부문 구조조정(~1,000명 감원 보도), 트럼프 행정부 AI 소프트웨어 심사 행정명령(6월 초) |
| 차기 실적 발표일 | **2026-07-29** (FY26 Q4, calendarEvents 기준), 컨센서스 EPS $4.24, 매출 $87.67B |
| 배당락일(다음) | 2027-08-19 (Unix 1787184000, exDividendDate) — 확인: 재계산 필요할 수 있으니 참고용 |

## 8. 확인 불가 항목

- ROIC (투하자본이익률) — 원자료 미제공
- 이자보상배율 — 이자비용 raw 수치 미취득
- SEC EDGAR 교차검증 — 이번 조사에서 미실시(Yahoo 데이터 간 정합성은 확보, 총부채 정의 차이만 병기)
- 배당락일 정확성 — Unix timestamp 환산값이 통상적 분기 배당 스케줄과 다소 이질적(재확인 필요)

---
### 출처
- Yahoo Finance chart API, fundamentals-timeseries, quoteSummary (조회일 2026-07-17)
- [Why Microsoft Stock Is Sinking Today - Motley Fool](https://www.fool.com/investing/2026/06/02/why-microsoft-stock-is-sinking-today/)
- [Why Microsoft Stock Just Dropped - Motley Fool](https://www.fool.com/investing/2026/06/25/why-microsoft-stock-just-dropped/)
- [Microsoft Stock Looks Cheap. Here's What's Really Going On - Motley Fool](https://www.fool.com/investing/2026/07/15/microsoft-stock-looks-cheap-heres-whats-really-goi/)
- [Microsoft (MSFT) Q3 earnings report 2026 - CNBC](https://www.cnbc.com/2026/04/29/microsoft-msft-q3-earnings-report-2026.html)
- [Microsoft Cloud and AI strength fuels third quarter results - Microsoft Source](https://news.microsoft.com/source/2026/04/29/microsoft-cloud-and-ai-strength-fuels-third-quarter-results/)
- [FTC's Ongoing Microsoft Antitrust Probe - Windows News](https://windowsnews.ai/article/ftcs-ongoing-microsoft-antitrust-probe-focuses-on-azure-and-ai-bundling-to-lock-out-competitors.421205)
- [FTC Ratchets Up Microsoft Probe - Bloomberg](https://www.bloomberg.com/news/articles/2026-02-13/ftc-ratchets-up-microsoft-probe-queries-rivals-on-cloud-ai)
