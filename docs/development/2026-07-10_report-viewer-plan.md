# 개발 플랜 — 투자 보고서 뷰어

> 작성일: 2026-07-10 | 기준 설계: [report-viewer-v1.md](../design/report-viewer-v1.md) | 분류: **대형** (앱 신설 — 화면 구조·데이터 계약이 새로 생김)

## 사용법

- 각 단계는 Agent 도구에 표의 `모델`·`effort`를 그대로 넣어 서브에이전트로 실행한다. 플랜 세션은 오케스트레이션(검수·병합·보고)만 한다.
- 에이전트가 막히거나 반복 불합격이면 한 단계 위 모델/effort로 승급하고 이 문서에 기록한다.
- 의존 순서: `0 → 1 → (2 ∥ 3) → 4 → 5` (2·3은 1의 catalog 계약 확정 후 병렬 가능)

## 단계별 지정 표

| 단계 | 작업 | 사용 스킬 | 에이전트 모델 (effort) | 완료 기준 |
|---|---|---|---|---|
| 0 스캐폴딩 | `app/` Vite+React19+TS 생성, Tailwind v4 + shadcn init (**neutral / mira** — 공식 문서로 플래그 확인), react-router·react-markdown·remark-gfm 설치, `server.fs.allow`로 `../docs` 접근 스모크 테스트 | — (맞는 스킬 없음) | Sonnet (medium, thinking O) | `npm run dev`로 빈 페이지가 mira 테마로 뜨고, docs의 md 1개를 raw import해 콘솔 출력 성공 |
| 1 데이터 계층 | `lib/catalog.ts`·`lib/meta.ts` — glob 로딩, 경로→카탈로그 변환, 헤더 메타 파서(의견·확신도·표결), interest ticker 매핑. 설계 4절 계약 그대로. 실측 파일(005930 전체·000660 진행중·BRK.B 티커) 대상 단위 테스트 | codebase-design, tdd | **Opus** (high, thinking O) | 테스트 통과: 2026-07-10 카탈로그에 티커 2개, 005930은 status=final·표결 {매도:6,관망:5…}, 000660은 in-progress, 파싱 실패 시 null |
| 2 대시보드 | `/` — 날짜 그룹 × 티커 카드 그리드, 상태·종합의견 배지, 표결 미니바(스택 바) | frontend-design, toss-design, dataviz | Sonnet (medium, thinking O) | 실데이터로 카드 2장 렌더, 진행중/최종 구분 표시, 카드 클릭 → 라우트 이동 |
| 3 보고서 뷰 | `/r/:date/:ticker` — 사이드바(최종/토론/거장13+배지/데이터팩) + 마크다운 본문(GFM 표), 본문 lazy 로딩 | frontend-design, toss-design, vercel-composition-patterns | Sonnet (high, thinking O) | 005930 최종보고서의 표가 깨짐 없이 렌더, 거장 전환 동작, 000660에서 최종/토론 비활성 |
| 4 마무리 | `/books` 서재, 다크모드 토글, 빈 상태·로딩 스켈레톤, 마이크로카피 정리 | toss-design, frontend-design | Haiku (medium, thinking X) | books 13권 열람 가능, 다크모드 전환 시 배지 색 대비 유지 |
| ~~5 검증~~ | ~~전 화면 실기동 검증 + 코드 리뷰~~ **생략 — 사용자 지시 (2026-07-10, "실기동 검증은 안 해도 됨")**. 각 단계의 빌드/테스트 통과로 갈음 | — | — | — |

## 모델 선택 근거

- **1단계만 Opus**: catalog/meta는 전 화면이 딛는 계약 — 틀리면 2·3·4 전부 재작업. 나머지 UI는 계약 위에서의 조립이라 Sonnet 주력.
- 3단계 Sonnet high: 마크다운 렌더 엣지케이스(중첩 표·긴 문서 성능·lazy 로딩)가 2단계보다 많음.
- 4단계 Haiku: 컴포넌트 재사용 위주의 기계적 작업.

## 스킬별 역할 요약

| 스킬 | 사용 단계 | 역할 |
|---|---|---|
| codebase-design | 1 | catalog를 깊은 모듈로 — 파싱 내부를 숨기고 좁은 인터페이스 노출 |
| tdd | 1 | 실측 파일 기반 파서 테스트 선행 |
| frontend-design / toss-design | 2·3·4 | 비주얼 품질 + 한국어 UX 라이팅·빈 상태·스켈레톤 패턴 |
| dataviz | 2 | 표결 미니바 색·형태 규칙 |
| vercel-composition-patterns | 3 | 사이드바/본문 컴포지션 설계 |
| verify / run / code-review | 5 | 실기동 검증·리뷰 |

## 다음 단계

사용자 승인("플랜대로 진행해줘") 후 0단계부터 실행. 조율된 변경은 이 문서와 설계 v1(→v2)에 반영한다.

## 실행 기록 (2026-07-10)

- **전 단계(0~4) 완료.** 최종 상태: 테스트 32개 통과, `tsc -b --noEmit`·`npm run build` 통과.
- 0단계: shadcn `mira` 스타일은 `components.json`의 `style: "radix-mira"`로 적용 확인 (baseColor neutral). 세션 한도로 에이전트가 중단됐으나 산출물은 완성 상태였음 — 오케스트레이터가 빌드 재검증으로 완료 처리.
- **2∥3 병렬 → 순차로 변경**: 두 단계가 라우터·공용 컴포넌트(VerdictBadge/TallyBar)를 공유해 충돌 위험 — 2단계가 라우터 골격·공용 컴포넌트를 소유하고 3단계가 재사용하는 순차 구조로 조정.
- 설계 4절 계약 이탈 (구현 확정, v2 반영 대상): ① 본문은 `raw: string` 대신 lazy 로더 `() => Promise<string>` ② `GuruReport`에 `folder`(원본 폴더명) 필드 추가 ③ 정렬 확정 — 날짜 내림차순·티커 오름차순·거장 한국어 가나다순.
- 디자인 결정: 매수=빨강·매도=초록 (국내 증시 관례, 토스 토큰 기반), 보유·관망은 무채색 2단계. dataviz 팔레트 검증 통과 값만 채택.
- 5단계(실기동 검증)는 사용자 지시로 생략.
