# 토스증권 스크리너 API — 13인의 거장 필터 세트

> 작성일: 2026-07-14 | 근거: [../tossfilter.md](../tossfilter.md) (13인 거장 조언 종합)
> **모든 스펙은 2026-07-14 실제 API 호출로 검증 완료** (추정값 없음)

## 두 가지 사용 방법

### A. 서버 API (권장) — `bitcoin-ai-backend`

토스 세션을 **서버가 발급·캐시**하므로 브라우저도 로그인도 필요 없다.

| 엔드포인트 | 설명 |
|---|---|
| `GET /toss/gurus` | 프리셋 14종 목록 (원칙·필터 수·실측 종목 수·조이고 푸는 순서) |
| `GET /toss/공통` | 13인 공통분모 세트로 조회 |
| `GET /toss/벤저민` · `/toss/그레이엄` · `/toss/graham` | 별칭 아무거나 가능 |
| `GET /toss/버핏` · `/toss/세스` · `/toss/린치` … | 13인 각각 |
| `POST /toss/screen` | 커스텀 필터 배열로 직접 조회 |
| `GET /toss/session` · `POST /toss/session/refresh` | 세션 상태 / 강제 재발급 |

쿼리 파라미터: `?nation=kr|us&size=50&page=1`

```bash
curl "http://localhost:8000/toss/버핏?size=30"
curl "http://localhost:8000/toss/gurus"
```

구현: `services/toss_screener_service.py` (세션 관리 + 필터 빌더 + 프리셋), `routers/toss.py`

### B. 브라우저 콘솔 (즉석 실험용)

1. <https://www.tossinvest.com/screener> 접속 → `F12` → Console
2. [`_공통.js`](_공통.js) 붙여넣기 (세션당 한 번)
3. 원하는 구루 파일(예: [`07-워런-버핏.js`](07-워런-버핏.js)) 붙여넣기 → `console.table` 출력

## 파일 목록

| 파일 | 세트 | 필터 수 | 실측 종목 수 |
|---|---|---|---|
| [`00-공통분모.js`](00-공통분모.js) | **13인 합의** | 5 | 116 |
| [`01-벤저민-그레이엄.js`](01-벤저민-그레이엄.js) | 가치 | 6 | **3** ⚠️ 너무 적음 |
| [`02-세스-클라먼.js`](02-세스-클라먼.js) | 가치 | 6 | 124 |
| [`03-모니시-파브라이.js`](03-모니시-파브라이.js) | 가치 | 6 | 141 |
| [`04-조엘-그린블라트.js`](04-조엘-그린블라트.js) | 마법공식 | **4** | 39 ✅ |
| [`05-앙드레-코스톨라니.js`](05-앙드레-코스톨라니.js) | 대형 우량 | 6 | 8 ⚠️ |
| [`06-잭-슈웨거.js`](06-잭-슈웨거.js) | **추세** | 4 | **2** ⚠️ 너무 적음 |
| [`07-워런-버핏.js`](07-워런-버핏.js) | 퀄리티 | 6 | 18 ✅ |
| [`08-필립-피셔.js`](08-필립-피셔.js) | 성장 | 5 | 36 ✅ |
| [`09-뉴욕주민.js`](09-뉴욕주민.js) | 퀄리티 | 7 | 26 ✅ |
| [`10-피터-린치.js`](10-피터-린치.js) | PEG | 6 | 73 |
| [`11-애스워스-다모다란.js`](11-애스워스-다모다란.js) | 가치+방벽 | 9 | 23 ✅ |
| [`12-존-템플턴.js`](12-존-템플턴.js) | **역발상** | 5 | 16 ✅ |
| [`13-마이클-버리.js`](13-마이클-버리.js) | 소외 소형주 | 5 | 151 |

*실측: 2026-07-14 국내(kr) 기준, 전체 상장 2,474종목 중. 장세에 따라 변한다.*
거장들이 권한 적정 구간은 **20~40개**다. 각 파일 하단 주석에 조이고 푸는 순서가 있다.

⚠️ **06(슈웨거)과 12(템플턴)는 정반대다.** 정배열(상승 추세)과 52주 신저가를 동시에 켜면 결과가 0개다.
⚠️ **13(버리)은 시가총액이 나머지와 정반대다** (소형주 전용).

---

## API 스펙 (실측 검증 완료)

### 1단계 — 세션 발급 (로그인 불필요)

```
GET https://wts-api.tossinvest.com/api/v3/init
```

→ `XSRF-TOKEN`, `SESSION`, `UTK`, `BTK`, `_browserId` 쿠키를 한 번에 내려준다. **익명으로 발급된다.**

### 2단계 — 조회

```
POST https://wts-cert-api.tossinvest.com/api/v2/screener/screen
```

필수 요소:

| 항목 | 값 |
|---|---|
| 쿠키 | 1단계에서 받은 전체 + **`deviceId`** |
| 헤더 | `x-xsrf-token: <XSRF-TOKEN 쿠키값>`, `content-type: application/json` |

> ⚠️ **`deviceId` 쿠키가 함정이다.** init이 내려주지 않으므로 클라이언트가 직접 만들어 넣어야 한다
> (형식: `WTS-<32자리 hex>`). 없으면 서버가 **원인 메시지 없는 400**을 던진다.
> `{"error":{"statusCode":400,"code":null,"message":null}}` 이 뜨면 십중팔구 이것이다.

### 요청 본문

```json
{
  "pagingParam": { "key": null, "number": 1, "size": 50 },
  "filters": [ { "id": "필터ID", "conditions": [ ... ] } ],
  "nation": "kr",
  "sort": { "column": "C_주가등락률_1W", "label": "주가등락률", "order": "DESC" }
}
```

- `nation`: **`"kr"`(국내) | `"us"`(해외)** — 필드 자체를 빼면 400
- `sort`: 선택. 표시 순서일 뿐 결과 집합에는 영향 없음
- `filters: []` (빈 배열)이면 전체 종목 (국내 2,474개)

### 응답

```json
{ "result": { "totalCount": 116, "page": 1, "lastPage": false,
              "stocks": [ { "stockCode": "A095570", "name": "AJ네트웍스",
                            "base": {"krw": 4265}, "close": {"krw": 4235},
                            "columns": [ {"id":"C_PER","label":"PER","value":6.09} ] } ] } }
```

`stockCode`는 `A` + 6자리 종목코드다.
`columns`는 **적용한 필터에 따라 동적으로 달라진다** (걸지 않은 지표는 응답에 없다).

### 조건(condition) 타입

| type | id | value |
|---|---|---|
| `NUMBER_RANGE` | `NUMBER_RANGE_DEFAULT` | `{from, to, includeFrom, includeTo}` — 없는 쪽은 전부 `null` |
| `PERIOD` | `기간_선택_QUARTER_TTM` | `"QUARTER"`(직전 분기) \| `"TTM"` |
| `PERIOD` | `기간_선택_TTM3_TTM5` | `"TTM_3"` \| `"TTM_5"` |
| `PERIOD` | `기간_선택_DAY_TO_MONTH` | `"DAY_1"` \| `"DAY_5"`(1주) \| `"DAY_20"`(1개월) |
| `PERIOD` | `기간_선택_DAY_TO_YEAR` | `"DAY_1"` \| `"DAY_5"` \| `"DAY_20"`(1개월) \| `"DAY_60"`(3개월) \| `"DAY_120"`(6개월) \| `"DAY_240"`(12개월) |
| `WEEK_NEW_PRICE_HIT_WITHIN` | `WEEK_NEW_PRICE_HIT` | `{within: 일수, numberOfWeeks: 4~52}` |
| `MOVING_AVERAGE_ALIGN_ARRAY` | `이동평균선_배열` | `[{shortPeriod, midPeriod, longPeriod, within, alignType: "positive"\|"negative"}]` |
| `MOVING_AVERAGE_CROSS_ARRAY` | `이동평균선_돌파` | `[{shortPeriod, longPeriod, within, crossDirection: "upward"\|"downward"}]` |
| `PRICE_MOVING_AVERAGE_CROSS_ARRAY` | `주가_이동평균선_돌파` | `[{period, within, crossDirection}]` |
| `PRICE_BOLLINGER_BAND_CROSS_ARRAY` | `주가_볼린저밴드_돌파` | `[{crossBand: "upper"\|"lower", within, crossDirection}]` |

**기간 enum은 전부 `DAY_N` 형식이다.** `MONTH_1`, `WEEK_1`, `YEAR_1` 같은 값은 전부 400을 던진다.

### ⭐ `기간_선택_QUARTER_TTM`의 의미가 필터마다 다르다

| 필터 종류 | `"QUARTER"` | `"TTM"` |
|---|---|---|
| 일반 재무 지표 (ROE, 영업이익률, 부채비율 …) | 직전 분기 | 최근 1년 |
| **연속증가 계열** (순이익_연속_증가 등) | **분기별** | **연도별** |

실측: `순이익_연속_증가 ≥ 3`이 `QUARTER`면 129종목(3분기 연속), `TTM`이면 214종목(3년 연속). `YEAR`는 400.

### 값 단위 (실측 확인)

| 종류 | 단위 | 예 |
|---|---|---|
| **모든 비율** | **소수** | 10% → `0.1` · 부채비율 100% → `1` · 이자보상배율 300% → `3` · 배당수익률 3% → `0.03` |
| 시가총액·거래대금·주가 | **원 (raw)** | 3,000억 → `300000000000` (검증: 1조↑ = 292종목, 3,000억↑ = 614종목) |
| 거래량 | 주 (raw) | 100만주 → `1000000` |
| 연속증가·연속지급 | 횟수 | 3년 연속 → `3` |

### 필터 ID 전체 (46종)

`시가총액` `주가` `주가등락률` `주가_연속_상승` `주가_연속_하락`
`PER` `PBR` `PSR` `PFCR` `EV_EBITDA`
`매출액_증감률` `연평균_매출액_증감률` `매출액_연속_증가`
`매출_총이익_증감률` `매출_총이익_연속_증가`
`영업_이익_증감률` `영업_이익_연속_증가`
`순이익_증감률` `연평균_순이익_증감률` `순이익_연속_증가` `순이익_어닝_서프라이즈`(국내 불가)
`매출_총_이익률` `영업_이익률` `순_이익률` `ROE` `ROA`
`부채_비율` `유동_비율` `이자_보상_배율`
`배당_성향` `배당_수익률` `주당_배당금` `배당_연속_지급_년수` `배당_연속_성장_년수`
`CUSTOM_N주_신고가_달성_경과일` `CUSTOM_N주_신저가_달성_경과일`
`거래량` `거래량_비율` `거래대금` `거래대금_비율`
`CUSTOM_주가_이동평균선_돌파` `CUSTOM_이동평균선_돌파` `CUSTOM_이동평균선_배열`
`CUSTOM_거래량_이동평균선_돌파` `CUSTOM_주가_볼린저밴드_돌파` `RSI_범위`

> `EV_EBITDA`는 기간 조건 없이도 동작한다 (붙여도 무시된다).
