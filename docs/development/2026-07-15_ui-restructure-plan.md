# 개발 플랜 — UI 재구성 (타이틀바 · 거장 스크리너 · 도서 뷰 · 레거시 제거)

> 작성일: 2026-07-15 | 기준 설계: [report-viewer-v2.md](../design/report-viewer-v2.md) | 분류: **대형**
>
> 근거: 라우트/화면 구조 변경(레거시 3개 제거·`book-detail` 서브뷰 신설) + 타이틀바 횡단 관심사 변경 = 설계 자체가 바뀜.

## 사용법

각 단계는 표의 `모델(effort)`로 **서브에이전트에 위임**해 실행한다. 이 플랜 세션은 오케스트레이션(분류·검수·병합·보고)만 한다.
단계 의존: `0 → (1 ∥ 1b) → 2 → 3 → 4`. 모든 코드 변경은 `financial/app/` 하위.

## 단계별 지정 표

| 단계 | 작업 | 사용 스킬 | 에이전트 모델 (effort) | 완료 기준 |
|---|---|---|---|---|
| **0 기반 계약** | ① `lib/gurus.ts` 신설 — `GURUS_INFO`를 Dashboard에서 추출, `screenerKey` 필드 추가(설계 3-1 매핑). ② `lib/nav.ts` 신설 — 순수 `goBack(params)`·`viewOf(params)`. ③ `TitleContext`(provider+`useSetTitle` 훅). ④ `components/ui/table.tsx`(shadcn table 프리미티브) 추가 + `@tanstack/react-table` 설치. Dashboard는 아직 `lib/gurus.ts`를 import만 하도록 최소 변경 | frontend-design | **Sonnet** (high, thinking O) | tsc 통과, Dashboard가 `lib/gurus.ts`의 GURUS_INFO를 사용, `@tanstack/react-table` 설치됨 |
| **1 타이틀바** | `App.tsx` 헤더 재작성 — 대시보드/종목찾기/서재 버튼 제거, `<` 뒤로가기(메인 제외)·현재 타이틀(TitleContext 구독) 표시, 다크토글 유지. `main.tsx`에 TitleProvider 래핑. Dashboard 각 뷰가 `useSetTitle(...)` 게시 | frontend-design, toss-design | Sonnet (medium, thinking O) | 뉴욕주민 진입 시 헤더 "뉴욕주민" + `<`만, 메인은 "투자 보고서" + 뒤로가기 없음 |
| **1b 스크리너 표 컴포넌트** | `components/screener-data-table.tsx` 신설 — ScreenerPage의 로직(fetchGuruPicks·metricColumns·formatMetric·국내/해외 토글·스켈레톤/에러/재시도)을 **shadcn data table**로 재구현. `guruKey`·초기 `nation` props. 새 파일이라 1과 병렬 가능 | frontend-design | Sonnet (high, thinking O) | 컴포넌트 단독으로 특정 거장 스크리너 표 렌더(정렬 가능), 국내/해외 전환 동작 |
| **2 Dashboard 개편** | `Dashboard.tsx`: ⓐ 종목 리스트 탭에 최신 완료본 종합의견+투표통계 열(설계 3-2), ⓑ `GuruDetailView`에 추천도서 클릭→`book-detail` + 보고서/도서 사이 `<ScreenerDataTable>` 섹션, ⓒ `book-detail` 서브뷰(단일 책 뷰어) + `goBack` 연동. 같은 파일 순차 편집 | frontend-design, toss-design | Sonnet (high, thinking O) | 종목 리스트에 의견·투표바 표시, 거장 상세에 스크리너 표, 추천도서 클릭 시 책 본문 표시 |
| **3 레거시 제거** | `main.tsx`에서 `/r/:date/:ticker`·`/books`·`/screener` 라우트+lazy import 삭제. `ReportPage.tsx`·`BooksPage.tsx`·`ScreenerPage.tsx` 삭제. 잔존 import 정리 | — | Sonnet (medium, thinking O) | 세 파일 삭제, tsc·`npm run build` 통과, dangling import 0 |
| **4 검증** | `tsc`·`npm run build`·앱 구동 스모크(메인→거장→스크리너/도서/보고서→뒤로가기 전 경로), screenerKey 매핑을 `/toss/gurus` 실제 키와 대조 | verify, run | Sonnet (medium, thinking O) — 막히면 high 승급 | 전 경로 무오류, 13인 스크리너 모두 결과 반환(빈 매핑 없음) |

## 스킬별 역할 요약

- **frontend-design** — 타이틀바·표·카드 등 UI 재구성 시 시각 일관성(radix-mira 팔레트) 유지.
- **toss-design** — 한국어 UI 문구(뒤로가기·빈 상태·에러·토글 라벨)와 인터랙션을 토스 톤으로.
- **verify / run** — 실제 앱을 띄워 전 경로를 손으로 밟아 동작 확인(테스트만으로 끝내지 않음).

## 승급 규칙

검증(4)에서 반복 실패하거나 타이틀/뒤로가기 상태 어긋남이 재현되면 해당 단계를 **Opus (high)** 로 승급하고 이 문서에 기록한다.

## 다음 단계

문서 승인 후 단계 0부터 순차 실행. 0 완료 시 1·1b 병렬 착수.
