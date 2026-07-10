// 대시보드 (/) — 날짜 내림차순 섹션 → 티커 카드 그리드 (설계 5절 "대시보드" 참조).
// catalog는 loadCatalog()가 이미 날짜 내림차순으로 정렬해 준다(Map 삽입 순서 그대로 사용).

import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { FileEmpty02FreeIcons, HourglassFreeIcons } from '@hugeicons/core-free-icons'
import { loadCatalog } from '@/lib/catalog'
import type { ReportCatalog, TickerReport } from '@/lib/catalog'
import type { Verdict } from '@/lib/meta'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VerdictBadge } from '@/components/verdict-badge'
import { TallyBar } from '@/components/tally-bar'

// 설계 문서 4-1/5절: 거장은 13인 고정 — 진행중 카드의 "거장 n/13" 분모로 쓴다.
const TOTAL_GURUS = 13

function extractVerdictWord(text: string): Verdict | null {
  const match = text.match(/^(매수|보유|매도|관망)/)
  return (match?.[1] as Verdict | undefined) ?? null
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; catalog: ReportCatalog }
  | { status: 'error' }

function Dashboard() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })

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

  if (state.status === 'loading') return <DashboardSkeleton />
  if (state.status === 'error') return <ErrorState />

  const dateSections = [...state.catalog.entries()]
  if (dateSections.length === 0) return <EmptyState />

  return (
    <div className="flex flex-col gap-8">
      {dateSections.map(([date, reports]) => (
        <section key={date} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">{date}</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report) => (
              <TickerCard key={report.ticker} report={report} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function TickerCard({ report }: { report: TickerReport }) {
  const verdictWord = report.finalVerdict ? extractVerdictWord(report.finalVerdict) : null

  return (
    <Link
      to={`/r/${report.date}/${report.ticker}`}
      className="block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-baseline gap-1.5 text-sm">
            <span className="font-mono text-[0.6875rem] text-muted-foreground">{report.ticker}</span>
            <span>{report.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {report.status === 'final' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">종합</span>
                <VerdictBadge verdict={verdictWord} />
              </div>
              {report.finalVerdict && (
                <p
                  className="truncate text-[0.6875rem] text-muted-foreground"
                  title={report.finalVerdict}
                >
                  {report.finalVerdict}
                </p>
              )}
              {report.tally && <TallyBar tally={report.tally} />}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HugeiconsIcon icon={HourglassFreeIcons} className="size-3.5" />
              <span>진행중</span>
              <span>
                · 거장 {report.gurus.length}/{TOTAL_GURUS}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="보고서를 불러오고 있어요">
      {[0, 1].map((section) => (
        <div key={section} className="flex flex-col gap-3">
          <Skeleton className="h-5 w-28" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((card) => (
              <Skeleton key={card} className="h-28 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
      <HugeiconsIcon icon={FileEmpty02FreeIcons} className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">아직 투자 보고서가 없어요</p>
      <p className="text-xs text-muted-foreground">새 보고서를 만들면 여기에 나타나요</p>
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
      <p className="text-sm font-medium">보고서를 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">잠시 뒤 새로고침해 주세요</p>
    </div>
  )
}

export default Dashboard
