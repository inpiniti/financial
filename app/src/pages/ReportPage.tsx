// 보고서 뷰 (/r/:date/:ticker) — 설계 5절 "보고서 뷰" 참조.
//
// 구성: ReportPage(카탈로그 로딩·경로 매칭·없음 상태) → ReportView(문서 목차·선택·본문 로딩).
// report가 확정된 뒤에만 ReportView를 마운트해, 내부에서는 report를 항상 존재하는 값으로 다룬다
// (params가 바뀌면 key로 강제 리마운트해 이전 티커의 선택·로딩 상태가 새 티커로 새지 않게 한다).
//
// 선택 상태는 `?doc=final|debate|data|{guru 폴더명}` 쿼리로 유지한다 — 새로고침·공유해도 같은
// 문서가 열린다. 유효하지 않거나(existent하지 않음) 비활성(진행중) 문서를 가리키면 기본값으로
// 조용히 정규화한다(URL 교체, 히스토리 추가 없음).

import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  AlertCircleFreeIcons,
  ArrowLeft02FreeIcons,
  BubbleChatFreeIcons,
  Database01FreeIcons,
  FileEmpty02FreeIcons,
  HourglassFreeIcons,
  Refresh01FreeIcons,
  StarFreeIcons,
  UserFreeIcons,
} from '@hugeicons/core-free-icons'
import { loadCatalog } from '@/lib/catalog'
import type { RawLoader, ReportCatalog, TickerReport } from '@/lib/catalog'
import type { Verdict } from '@/lib/meta'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { VerdictBadge } from '@/components/verdict-badge'
import { TallyBar } from '@/components/tally-bar'
import { MarkdownView } from '@/components/markdown-view'

const TOTAL_GURUS = 13

// ── 문서 목차 모델 ──────────────────────────────────────────────────────

type DocEntry =
  | { kind: 'final'; key: 'final'; label: string; disabled: boolean }
  | { kind: 'debate'; key: 'debate'; label: string; disabled: boolean }
  | { kind: 'data'; key: 'data'; label: string; disabled: boolean }
  | { kind: 'guru'; key: string; label: string; verdict: Verdict | null; confidence: number | null; disabled: false }

interface DocEntries {
  top: DocEntry[]
  gurus: DocEntry[]
  bottom: DocEntry[]
}

function buildDocEntries(report: TickerReport): DocEntries {
  const inProgress = report.status !== 'final'
  return {
    top: [
      { kind: 'final', key: 'final', label: '최종 보고서', disabled: inProgress },
      { kind: 'debate', key: 'debate', label: '원탁 토론', disabled: inProgress },
    ],
    gurus: report.gurus.map((g) => ({
      kind: 'guru',
      key: g.folder,
      label: g.guru,
      verdict: g.verdict,
      confidence: g.confidence,
      disabled: false,
    })),
    bottom: [{ kind: 'data', key: 'data', label: '데이터 팩', disabled: !report.data }],
  }
}

function findEntry(entries: DocEntries, key: string): DocEntry | undefined {
  return (
    entries.top.find((e) => e.key === key) ??
    entries.gurus.find((e) => e.key === key) ??
    entries.bottom.find((e) => e.key === key)
  )
}

/** 기본 선택 문서: 최종 보고서가 있으면 최종, 없으면 표시명 정렬 순서의 첫 거장, 그것도 없으면 데이터 팩. */
function resolveDefaultKey(report: TickerReport): string | null {
  if (report.status === 'final') return 'final'
  if (report.gurus.length > 0) return report.gurus[0].folder
  if (report.data) return 'data'
  return null
}

function loaderFor(report: TickerReport, key: string | null): RawLoader | undefined {
  if (!key) return undefined
  if (key === 'final') return report.final
  if (key === 'debate') return report.debate
  if (key === 'data') return report.data
  return report.gurus.find((g) => g.folder === key)?.load
}

function isProgressGated(entry: DocEntry): boolean {
  return entry.kind === 'final' || entry.kind === 'debate'
}

function entryIcon(entry: DocEntry): IconSvgElement {
  switch (entry.kind) {
    case 'final':
      return StarFreeIcons
    case 'debate':
      return BubbleChatFreeIcons
    case 'data':
      return Database01FreeIcons
    case 'guru':
      return UserFreeIcons
  }
}

function extractVerdictWord(text: string): Verdict | null {
  const match = text.match(/^(매수|보유|매도|관망)/)
  return (match?.[1] as Verdict | undefined) ?? null
}

// ── 최상위: 카탈로그 로딩 · 경로 매칭 ───────────────────────────────────

type CatalogState = { status: 'loading' } | { status: 'ready'; catalog: ReportCatalog } | { status: 'error' }

function ReportPage() {
  const { date = '', ticker = '' } = useParams<{ date: string; ticker: string }>()
  const [state, setState] = useState<CatalogState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    loadCatalog()
      .then((catalog) => {
        if (alive) setState({ status: 'ready', catalog })
      })
      .catch(() => {
        if (alive) setState({ status: 'error' })
      })
    return () => {
      alive = false
    }
  }, [])

  if (state.status === 'loading') return <ReportPageSkeleton />
  if (state.status === 'error') return <CatalogErrorState />

  const report = state.catalog.get(date)?.find((r) => r.ticker === ticker)
  if (!report) return <NotFoundState date={date} ticker={ticker} />

  // date+ticker가 바뀌면 강제 리마운트 — 이전 티커에서 열어둔 문서 선택·로딩 상태가 새 리포트로
  // 새는 것을 막는다 (같은 /r/:date/:ticker 라우트 엘리먼트이므로 리액트가 기본적으로는 재사용한다).
  return <ReportView key={`${report.date}/${report.ticker}`} report={report} />
}

// ── ReportView: 문서 목차 · 선택 · 본문 로딩 ────────────────────────────

type ContentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; raw: string }
  | { status: 'error' }

function ReportView({ report }: { report: TickerReport }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const entries = useMemo(() => buildDocEntries(report), [report])
  const defaultKey = useMemo(() => resolveDefaultKey(report), [report])

  const requestedKey = searchParams.get('doc')
  const requestedEntry = requestedKey ? findEntry(entries, requestedKey) : undefined
  const selectedKey = requestedEntry && !requestedEntry.disabled ? requestedEntry.key : defaultKey
  const selectedEntry = selectedKey ? findEntry(entries, selectedKey) : undefined

  // URL 정규화: doc이 없거나 무효/비활성 문서를 가리키면 기본값으로 조용히 치환한다.
  useEffect(() => {
    if (!selectedKey || requestedKey === selectedKey) return
    const next = new URLSearchParams(searchParams)
    next.set('doc', selectedKey)
    setSearchParams(next, { replace: true })
  }, [requestedKey, selectedKey, searchParams, setSearchParams])

  const [content, setContent] = useState<ContentState>({ status: 'idle' })
  const [retryTick, setRetryTick] = useState(0)

  // 문서 전환 시 본문 스크롤을 최상단으로.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedKey])

  useEffect(() => {
    const loader = loaderFor(report, selectedKey)
    if (!loader) {
      setContent({ status: 'idle' })
      return
    }
    let alive = true
    setContent({ status: 'loading' })
    loader()
      .then((raw) => {
        if (alive) setContent({ status: 'ready', raw })
      })
      .catch(() => {
        if (alive) setContent({ status: 'error' })
      })
    return () => {
      alive = false
    }
  }, [report, selectedKey, retryTick])

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <ReportSidebar report={report} entries={entries} selectedKey={selectedKey} />
      <div className="min-w-0 flex-1">
        <ReportContent report={report} entry={selectedEntry} content={content} onRetry={() => setRetryTick((t) => t + 1)} />
      </div>
    </div>
  )
}

// ── 사이드바 ────────────────────────────────────────────────────────────

function ReportSidebar({
  report,
  entries,
  selectedKey,
}: {
  report: TickerReport
  entries: DocEntries
  selectedKey: string | null
}) {
  const allEntries = [...entries.top, ...entries.gurus, ...entries.bottom]

  return (
    <aside className="flex flex-col gap-4 lg:sticky lg:top-16 lg:w-64 lg:shrink-0 lg:self-start">
      <SidebarHeader report={report} />

      {/* 데스크톱: 세로 목차 (sticky) */}
      <nav className="hidden flex-col gap-4 lg:flex" aria-label="문서 목차">
        <NavGroup entries={entries.top} selectedKey={selectedKey} />
        <Separator />
        <NavGroup entries={entries.gurus} selectedKey={selectedKey} />
        <Separator />
        <NavGroup entries={entries.bottom} selectedKey={selectedKey} />
      </nav>

      {/* 모바일: 상단 가로 스크롤 칩 목록 */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden" aria-label="문서 목차">
        {allEntries.map((entry) => (
          <NavChip key={entry.key} entry={entry} active={entry.key === selectedKey} />
        ))}
      </nav>
    </aside>
  )
}

function SidebarHeader({ report }: { report: TickerReport }) {
  const verdictWord = report.finalVerdict ? extractVerdictWord(report.finalVerdict) : null

  return (
    <div className="flex flex-col gap-2.5">
      <Link
        to="/"
        className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-3" />
        대시보드
      </Link>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-[0.6875rem] text-muted-foreground">{report.ticker}</span>
          <h1 className="truncate font-heading text-base font-semibold text-foreground">{report.name}</h1>
        </div>
        <p className="text-xs text-muted-foreground">{report.date}</p>
      </div>
      {report.status === 'final' ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">종합</span>
            <VerdictBadge verdict={verdictWord} />
          </div>
          {report.tally && <TallyBar tally={report.tally} />}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <HugeiconsIcon icon={HourglassFreeIcons} className="size-3.5" />
          <span>
            진행중 · 거장 {report.gurus.length}/{TOTAL_GURUS}
          </span>
        </div>
      )}
    </div>
  )
}

function NavGroup({ entries, selectedKey }: { entries: DocEntry[]; selectedKey: string | null }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {entries.map((entry) => (
        <li key={entry.key}>
          <NavItem entry={entry} active={entry.key === selectedKey} />
        </li>
      ))}
    </ul>
  )
}

function NavItem({ entry, active }: { entry: DocEntry; active: boolean }) {
  const inner = (
    <>
      <HugeiconsIcon icon={entryIcon(entry)} className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.kind === 'guru' && (
        <VerdictBadge verdict={entry.verdict} confidence={entry.confidence} className="shrink-0" />
      )}
    </>
  )

  if (entry.disabled) {
    return (
      <div
        className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground/50"
        aria-disabled="true"
      >
        {inner}
        {isProgressGated(entry) && <span className="shrink-0 text-[0.625rem]">진행중</span>}
      </div>
    )
  }

  return (
    <Link
      to={`?doc=${encodeURIComponent(entry.key)}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors',
        active
          ? 'bg-muted font-medium text-foreground'
          : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {inner}
    </Link>
  )
}

function NavChip({ entry, active }: { entry: DocEntry; active: boolean }) {
  const inner = (
    <>
      <HugeiconsIcon icon={entryIcon(entry)} className="size-3" />
      <span>{entry.label}</span>
      {isProgressGated(entry) && entry.disabled && <span className="text-[0.625rem]">· 진행중</span>}
    </>
  )

  if (entry.disabled) {
    return (
      <div className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-border px-3 py-1.5 text-[0.6875rem] whitespace-nowrap text-muted-foreground/50">
        {inner}
      </div>
    )
  }

  return (
    <Link
      to={`?doc=${encodeURIComponent(entry.key)}`}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[0.6875rem] whitespace-nowrap transition-colors',
        active
          ? 'border-transparent bg-foreground text-background'
          : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground',
      )}
    >
      {inner}
    </Link>
  )
}

// ── 본문 ────────────────────────────────────────────────────────────────

function ReportContent({
  report,
  entry,
  content,
  onRetry,
}: {
  report: TickerReport
  entry: DocEntry | undefined
  content: ContentState
  onRetry: () => void
}) {
  if (!entry) return <NoDocumentState />

  return (
    <div>
      <ContentHeader report={report} entry={entry} />
      {(content.status === 'idle' || content.status === 'loading') && <ContentSkeleton />}
      {content.status === 'error' && <ContentErrorState onRetry={onRetry} />}
      {content.status === 'ready' && (
        <MarkdownView key={entry.key} hideLeadingHeader>
          {content.raw}
        </MarkdownView>
      )}
    </div>
  )
}

function ContentHeader({ report, entry }: { report: TickerReport; entry: DocEntry }) {
  if (entry.kind === 'final') {
    const verdictWord = report.finalVerdict ? extractVerdictWord(report.finalVerdict) : null
    return (
      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <HugeiconsIcon icon={StarFreeIcons} className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-lg font-semibold text-foreground">최종 투자 보고서</h2>
          <VerdictBadge verdict={verdictWord} />
        </div>
        {report.finalVerdict && <p className="text-sm leading-relaxed text-muted-foreground">{report.finalVerdict}</p>}
        {report.tally && <TallyBar tally={report.tally} className="max-w-sm" />}
      </div>
    )
  }

  if (entry.kind === 'debate') {
    return (
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-5">
        <HugeiconsIcon icon={BubbleChatFreeIcons} className="size-4 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold text-foreground">원탁 토론</h2>
      </div>
    )
  }

  if (entry.kind === 'data') {
    return (
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-5">
        <HugeiconsIcon icon={Database01FreeIcons} className="size-4 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold text-foreground">데이터 팩</h2>
      </div>
    )
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border pb-5">
      <h2 className="font-heading text-lg font-semibold text-foreground">{entry.label}</h2>
      <VerdictBadge verdict={entry.verdict} confidence={entry.confidence} />
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="문서를 불러오고 있어요">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

function ContentErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <HugeiconsIcon icon={AlertCircleFreeIcons} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">문서를 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">잠시 뒤에 다시 시도해 주세요</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
        <HugeiconsIcon icon={Refresh01FreeIcons} data-icon="inline-start" />
        다시 시도
      </Button>
    </div>
  )
}

function NoDocumentState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
      <HugeiconsIcon icon={FileEmpty02FreeIcons} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">아직 볼 수 있는 문서가 없어요</p>
      <p className="text-xs text-muted-foreground">거장 분석이 시작되면 여기에 나타나요</p>
    </div>
  )
}

// ── 카탈로그 레벨 상태 ──────────────────────────────────────────────────

function ReportPageSkeleton() {
  return (
    <div
      className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8"
      aria-busy="true"
      aria-label="보고서를 불러오고 있어요"
    >
      <div className="flex flex-col gap-3 lg:w-64 lg:shrink-0">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="min-w-0 flex-1">
        <ContentSkeleton />
      </div>
    </div>
  )
}

function CatalogErrorState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
      <p className="text-sm font-medium text-foreground">보고서를 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">잠시 뒤 새로고침해 주세요</p>
    </div>
  )
}

export default ReportPage

function NotFoundState({ date, ticker }: { date: string; ticker: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-20 text-center">
      <HugeiconsIcon icon={FileEmpty02FreeIcons} className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">
        {ticker} · {date} 보고서를 찾을 수 없어요
      </p>
      <p className="text-xs text-muted-foreground">삭제되었거나 아직 만들어지지 않았을 수 있어요</p>
      <Button asChild size="sm" variant="outline" className="mt-2">
        <Link to="/">
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} data-icon="inline-start" />
          대시보드로 돌아가기
        </Link>
      </Button>
    </div>
  )
}
