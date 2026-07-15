# 설계 v2 — 투자 보고서 뷰어 (스택 네비 · 타이틀바 · 거장 스크리너)

> 작성일: 2026-07-15 | 기준: [report-viewer-v1.md](report-viewer-v1.md) (얼림) | 이 문서는 v2이며 이후 변경은 v3로 버전업한다
>
> v1은 라우트 3개(`/`, `/r/:date/:ticker`, `/books`) 구조였다. 이후 커밋 `e63fb1a`·`09e3fb1`·`456d159`(UI 개편)에서
> 대시보드가 **URL 쿼리 기반 스택 네비게이션**으로 재구성되며 v1 설계와 실제 코드가 갈라졌다.
> v2는 (1) 그 스택 네비 현실을 설계에 반영하고, (2) 이번 요청의 변경(타이틀바·거장 스크리너·도서 뷰·레거시 제거)을 확정한다.

## 1. 목표 (이번 변경)

1. **종목 리스트** — 최신 '완료' 보고서 기준의 **종합의견 + 투표통계**를 열에 노출한다.
2. **거장 상세** — 추천도서를 **클릭 가능**하게 하고(→ 단일 책 뷰), 보고서 리스트와 도서 사이에 **해당 거장의 스크리너 리스트**(shadcn data table)를 추가한다.
3. **타이틀바** — 상단 헤더가 뒤 페이지가 아니라 **현재 화면의 타이틀**을 보여주고, 메인이 아니면 좌측에 `<` 뒤로가기 버튼만 둔다. 대시보드/종목찾기/서재 버튼과 해당 레거시 화면을 제거한다.

## 2. 화면 구조 (v2 확정)

라우트는 **단 하나(`/`)** 로 수렴한다. 화면 전환은 전부 `/` 안의 URL 쿼리 스택으로 처리한다.

### 2-1. 라우트

| 라우트 | 상태 | 비고 |
|---|---|---|
| `/` | **유지** | App 레이아웃 + Dashboard 스택. 모든 화면이 여기 안에 있다 |
| ~~`/r/:date/:ticker`~~ | **제거** | 기능은 스택의 `view=report-detail`이 이미 대체 (ReportPage 삭제) |
| ~~`/books`~~ | **제거** | 스택의 `view=book-detail`(단일 책)로 대체 (BooksPage 삭제) |
| ~~`/screener`~~ | **제거** | 거장 상세의 스크리너 섹션으로 흡수 (ScreenerPage 삭제) |

### 2-2. 스택 뷰 (URL 쿼리 `view`)

```
main ─┬─ (tab=gurus)  ─→ guru-detail ─┬─→ ticker-detail ─→ report-detail
      └─ (tab=tickers)─→ ticker-detail┘        └─────────────┘
                              guru-detail ─→ book-detail   (신설)
```

| view | 쿼리 파라미터 | 타이틀 | 뒤로가기 대상 |
|---|---|---|---|
| `main` | `tab` | **"투자 보고서"** | (없음) |
| `guru-detail` | `guru` | 거장 이름 (예: 뉴욕주민) | main |
| `ticker-detail` | `ticker` (`guru` 유지 가능) | 종목명 | guru 있으면 guru-detail, 없으면 main |
| `report-detail` | `date` · `doc` | 문서 라벨 (또는 종목명) | ticker-detail |
| `book-detail` **(신설)** | `book`(파일명) | 책 제목 | guru-detail |

### 2-3. 타이틀바 (App 헤더) — 횡단 계약

```
┌───────────────────────────────────────────────┐
│ [<]  뉴욕주민                            [☾]   │   ← 서브 화면
├───────────────────────────────────────────────┤
│      투자 보고서                         [☾]   │   ← 메인(뒤로가기 없음)
└───────────────────────────────────────────────┘
```

- 헤더는 `useSearchParams`로 현재 스택 상태를 읽는다.
- **뒤로가기**: `view !== 'main'`일 때 좌측에 `<` 아이콘 버튼만 (글자 없음). 클릭 시 `goBack(params)`(순수 함수)로 이전 뷰로.
- **타이틀**: 각 뷰가 자신의 타이틀을 `TitleContext`에 게시(publish)하고, 헤더가 이를 구독해 표시한다.
  - 이유: 종목명·책 제목은 catalog/파일명 해석이 필요해 App가 직접 계산하기 어렵다. "현재 화면이 자기 타이틀을 안다"는 원칙이 가장 견고하다.
  - guru 이름은 정적(`lib/gurus.ts`)이라 App가 직접 계산해도 되지만, 일관성을 위해 게시 경로로 통일한다. 미게시 시 폴백 "투자 보고서".
- 기존 헤더의 **대시보드 / 종목찾기 / 서재 버튼 제거**. 다크모드 토글만 우측에 남긴다.

## 3. 데이터 계약 변경/추가

### 3-1. `lib/gurus.ts` (신설 — 공유 계약)

Dashboard 내부 상수 `GURUS_INFO`를 공유 모듈로 승격하고 필드를 확장한다.

```ts
interface GuruInfo {
  key: string          // 스택/URL 키 (예: '뉴욕주민', '마이클-버리')  — 기존 유지
  name: string
  style: string
  bookFilename: string // docs/books/*.md 파일명 (13개 전부 실재 확인됨)
  bookTitle: string
  screenerKey: string  // 신설 — 백엔드 /toss/{key} 키 (예: '뉴욕주민','버핏','그레이엄','버리' …)
}
```

- **screenerKey 매핑**(Dashboard key → 토스 프리셋 key): 뉴욕주민→뉴욕주민, 마이클-버리→버리, 모니시-파브라이→파브라이, 벤저민-그레이엄→그레이엄, 세스-클라먼→클라먼, 앙드레-코스톨라니→코스톨라니, 애스워스-다모다란→다모다란, 워런-버핏→버핏, 잭-슈웨거→슈웨거, 조엘-그린블라트→그린블라트, 존-템플턴→템플턴, 피터-린치→린치, 필립-피셔→피셔.

### 3-2. 종목 리스트 통계 (Dashboard `uniqueTickers`)

`uniqueTickers` 누적기에 **최신 '완료(final)' 보고서**의 `finalVerdict`·`tally`를 추가한다.

```ts
{ ticker, name, reportCount, lastDate,
  latestVerdict: Verdict | null,   // 최신 status==='final' 보고서의 finalVerdict → extractVerdictWord
  latestTally:   Tally   | null }  // 같은 보고서의 tally
```

- "최신 완료 보고서" = status==='final'인 보고서 중 date 최댓값. 완료본이 하나도 없으면 verdict·tally는 null(`—`).

### 3-3. 스크리너 (기존 `lib/screener.ts` 재사용)

- `fetchGurus`/`fetchGuruPicks(screenerKey, nation, size)` 그대로 사용. HF Space 콜드 스타트(수십 초) 스켈레톤·에러·재시도 UI 유지.
- 표는 **shadcn data table**로 만든다 → `components/ui/table.tsx`(shadcn 프리미티브) + `@tanstack/react-table`(신규 의존성) 기반 `ScreenerDataTable` 컴포넌트. 동적 지표 컬럼은 `metricColumns()` 결과로 `ColumnDef[]`를 생성한다.

### 3-4. 도서 단일 뷰 (`book-detail`)

- BooksPage의 본문 로더(`docs/books/*.md` glob + MarkdownView)만 추려 **단일 책 뷰어**로 재사용. 목록/사이드바 없음.
- 파일 부재 시 "책을 불러올 수 없습니다" 빈 상태(현 13개는 전부 실재).

## 4. 하지 않는 것 (v2 범위 제외)

- ❌ 종목 리스트에 스파크라인·시계열 — 이번 범위 아님
- ❌ 거장 스크리너 결과의 종목 → 종목 상세 연결(스크리너 종목은 보고서가 없을 수 있음) — 단순 표까지만
- ❌ 서재(책 목록) 화면 부활 — 도서는 추천도서 경유 단일 뷰만
- ❌ 백엔드/스크리너 서버 코드 변경 — 프런트만

## 5. 리스크

| 리스크 | 대응 |
|---|---|
| 타이틀/뒤로가기 상태를 App↔Dashboard가 공유하며 어긋남 | `goBack`은 순수 함수로 `lib/nav.ts`에 격리, 타이틀은 TitleContext 단방향 게시. 각 뷰 마운트 시 게시 |
| `@tanstack/react-table` 신규 의존성 도입 비용 | 동적 컬럼 표 1개에만 사용. 과하면 shadcn Table 프리미티브만으로 정적 표 대체 가능(플랜에서 결정) |
| 스크리너 HF Space 콜드 스타트로 거장 상세 진입이 느려 보임 | 스크리너 섹션은 지연 로드 + 스켈레톤/30초 안내. 보고서·도서 섹션은 스크리너와 독립 렌더 |
| screenerKey 매핑 오타로 특정 거장 스크리너 빈 결과 | `lib/gurus.ts` 매핑을 `/toss/gurus` 실제 키와 대조하는 스모크 확인(플랜 검증 단계) |
| 레거시 3개 페이지 삭제 시 참조 잔존(빌드 실패) | 재사용 조각(도서 뷰어·스크리너 표) 먼저 추출 후 삭제. tsc·build로 확인 |
