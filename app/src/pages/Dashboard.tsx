import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  AlertCircleFreeIcons,
  BookOpen02FreeIcons,
  FileEmpty02FreeIcons,
  HourglassFreeIcons,
  UserFreeIcons,
  LayersFreeIcons,
  SignatureFreeIcons,
  Book02FreeIcons,
  ArrowRight02FreeIcons,
  StarFreeIcons,
  BubbleChatFreeIcons,
  Database01FreeIcons,
  Search01FreeIcons,
} from '@hugeicons/core-free-icons'

import { loadCatalog } from '@/lib/catalog'
import type { ReportCatalog, TickerReport, Verdict, Tally } from '@/lib/catalog'
import { GURUS_INFO } from '@/lib/gurus'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VerdictBadge } from '@/components/verdict-badge'
import { TallyBar } from '@/components/tally-bar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MarkdownView } from '@/components/markdown-view'
import { ScreenerDataTable } from '@/components/screener-data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSetTitle } from '@/components/title-context'
import krLogoData from '../../../docs/kr_logo.json'
import usLogoData from '../../../docs/us_logo.json'

interface LogoItem {
  ticker?: string
  logoid?: string
}

// 스택의 각 문서 엔트리 타입 정의
interface DocEntry {
  kind: string
  key: string
  label: string
  disabled: boolean
  icon: any
  verdict?: Verdict | null | undefined
  confidence?: number | null
}

function extractVerdictWord(text: string): Verdict | null {
  const match = text.match(/^(매수|보유|매도|관망)/)
  return (match?.[1] as Verdict | undefined) ?? null
}

/** 도서 파일명(확장자 제거, _는 공백으로) → 책 제목. BooksPage의 규칙과 동일. */
function filenameToTitle(filename: string): string {
  return filename.replace(/\.md$/i, '').replace(/_/g, ' ')
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; catalog: ReportCatalog }
  | { status: 'error' }

type ContentState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; raw: string }
  | { status: 'error' }

export default function Dashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loadState, setLoadState] = useState<LoadState>({ status: 'loading' })

  // 스택 네비게이션을 위한 URL 쿼리 상태 추출
  const view = searchParams.get('view') || 'main' // main | guru-detail | ticker-detail | report-detail | book-detail
  const activeTab = searchParams.get('tab') || 'gurus' // gurus | tickers (메인 탭전환용)
  const selectedGuruKey = searchParams.get('guru') || '' // 거장 key
  const selectedTicker = searchParams.get('ticker') || '' // 종목 ticker
  const selectedDate = searchParams.get('date') || '' // 날짜
  const selectedDoc = searchParams.get('doc') || 'final' // final | debate | data | {guruKey}
  const selectedBook = searchParams.get('book') || '' // 도서 파일명

  useEffect(() => {
    let alive = true
    loadCatalog()
      .then((catalog) => {
        if (alive) setLoadState({ status: 'ready', catalog })
      })
      .catch(() => {
        if (alive) setLoadState({ status: 'error' })
      })
    return () => {
      alive = false
    }
  }, [])

  // 로고 매핑 (국내/해외 종목별)
  const logoMap = useMemo(() => {
    const map = new Map<string, string>()

    ;[...(krLogoData as LogoItem[]), ...(usLogoData as LogoItem[])].forEach((item) => {
      if (!item.ticker || !item.logoid) return
      map.set(item.ticker, item.logoid)
    })

    return map
  }, [])

  // 1. 공통 종목 리스트 생성 (보고서로 저장되어 있는 고유 종목 리스트)
  //    각 종목에 최신 '완료(final)' 보고서 기준의 종합의견·투표통계를 함께 계산한다.
  const uniqueTickers = useMemo<TickerRow[]>(() => {
    if (loadState.status !== 'ready') return []

    interface TickerAgg extends TickerRow {
      latestFinalDate: string | null // 최신 완료본의 날짜 (비교용)
    }

    const tickerMap = new Map<string, TickerAgg>()

    for (const [date, reports] of loadState.catalog.entries()) {
      for (const r of reports) {
        let agg = tickerMap.get(r.ticker)
        if (!agg) {
          const logoid = logoMap.get(r.ticker)
          agg = {
            ticker: r.ticker,
            name: r.name,
            logoImageUrl: logoid ? `https://s3-symbol-logo.tradingview.com/${logoid}.svg` : null,
            reportCount: 0,
            lastDate: date,
            latestFinalDate: null,
            latestVerdict: null,
            latestTally: null,
          }
          tickerMap.set(r.ticker, agg)
        }

        agg.reportCount += 1
        if (date.localeCompare(agg.lastDate) > 0) agg.lastDate = date // 모든 보고서 중 최신

        // 최신 완료본 추적: status==='final'인 보고서 중 date 최댓값
        if (r.status === 'final') {
          if (!agg.latestFinalDate || date.localeCompare(agg.latestFinalDate) > 0) {
            agg.latestFinalDate = date
            agg.latestVerdict = r.finalVerdict ? extractVerdictWord(r.finalVerdict) : null
            agg.latestTally = r.tally ?? null
          }
        }
      }
    }

    return Array.from(tickerMap.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [loadState, logoMap])

  // 스택 이동 함수
  const pushView = (params: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(params).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k)
    })
    setSearchParams(next)
  }

  if (loadState.status === 'loading') return <DashboardSkeleton />
  if (loadState.status === 'error') return <ErrorState />

  const { catalog } = loadState

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1단계: 메인 탭 뷰 */}
      {view === 'main' && (
        <MainView
          activeTab={activeTab}
          uniqueTickers={uniqueTickers}
          onChangeTab={(tab) => pushView({ tab })}
          onSelectGuru={(guru) => pushView({ view: 'guru-detail', guru })}
          onSelectTicker={(ticker) => pushView({ view: 'ticker-detail', ticker })}
        />
      )}

      {/* 2단계: 거장 상세 뷰 */}
      {view === 'guru-detail' && (
        <GuruDetailView
          guruKey={selectedGuruKey}
          catalog={catalog}
          onSelectTicker={(ticker) => pushView({ view: 'ticker-detail', ticker })}
          onSelectBook={(filename) => pushView({ view: 'book-detail', book: filename })}
        />
      )}

      {/* 3단계: 종목 상세 뷰 */}
      {view === 'ticker-detail' && (
        <TickerDetailView
          ticker={selectedTicker}
          catalog={catalog}
          onSelectReport={(date) => pushView({ view: 'report-detail', date, doc: 'final' })}
        />
      )}

      {/* 4단계: 보고서 상세 뷰 */}
      {view === 'report-detail' && (
        <ReportDetailView
          date={selectedDate}
          ticker={selectedTicker}
          catalog={catalog}
          selectedDoc={selectedDoc}
          setSelectedDoc={(doc) => pushView({ doc })}
        />
      )}

      {/* 서브뷰: 단일 도서 뷰어 */}
      {view === 'book-detail' && <BookDetailView filename={selectedBook} />}
    </div>
  )
}

// ── 1단계: 메인 탭 뷰 컴포넌트 ──────────────────────────────────────────────
interface TickerRow {
  ticker: string
  name: string
  logoImageUrl: string | null
  reportCount: number
  lastDate: string
  latestVerdict: Verdict | null
  latestTally: Tally | null
}

function MainView({
  activeTab,
  uniqueTickers,
  onChangeTab,
  onSelectGuru,
  onSelectTicker,
}: {
  activeTab: string
  uniqueTickers: TickerRow[]
  onChangeTab: (tab: string) => void
  onSelectGuru: (guru: string) => void
  onSelectTicker: (ticker: string) => void
}) {
  useSetTitle('투자 보고서')
  const [selectedScreener, setSelectedScreener] = useState<string>('공통')

  const currentScreener = useMemo(() => {
    if (selectedScreener === '공통') {
      return {
        title: '13인 공통분모 스크리너',
        description: '거장 13인의 필터에서 공통으로 겹치는 조건만 모아, 누구 기준으로 봐도 무난한 종목을 걸러냅니다.',
      }
    }
    const guru = GURUS_INFO.find((g) => g.screenerKey === selectedScreener)
    return {
      title: `${guru?.name || '거장'}의 스크리너`,
      description: `${guru?.name || '거장'}의 투자 기준(${guru?.style || ''})을 바탕으로 필터링한 종목입니다.`,
    }
  }, [selectedScreener])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1.5">
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          거장들의 투자 통찰
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          13인의 투자 거장들의 분석 보고서와 도서 정보, 그리고 최신 투자 스크리너 자료를 한자리에서 탐색합니다.
        </p>
      </header>

      <Tabs value={activeTab} onValueChange={onChangeTab} className="w-full">
        <TabsList className="grid w-full max-w-[560px] grid-cols-3">
          <TabsTrigger value="gurus" className="gap-1.5 py-1">
            <HugeiconsIcon icon={UserFreeIcons} className="size-3.5" />
            거장 리스트
          </TabsTrigger>
          <TabsTrigger value="tickers" className="gap-1.5 py-1">
            <HugeiconsIcon icon={LayersFreeIcons} className="size-3.5" />
            종목 리스트
          </TabsTrigger>
          <TabsTrigger value="screener" className="gap-1.5 py-1">
            <HugeiconsIcon icon={Search01FreeIcons} className="size-3.5" />
            종합 스크리너
          </TabsTrigger>
        </TabsList>

        {/* 거장 리스트 탭 */}
        <TabsContent value="gurus" className="mt-4">
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-xs text-left">
                <thead className="border-b border-border bg-muted/50 text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">거장 이름</th>
                    <th className="px-4 py-3 font-semibold">투자 스타일</th>
                    <th className="px-4 py-3 font-semibold">대표 도서</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {GURUS_INFO.map((guru) => (
                    <tr
                      key={guru.key}
                      onClick={() => onSelectGuru(guru.key)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                        <div className="size-7 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0">
                          {guru.avatar ? (
                            <img
                              src={guru.avatar}
                              alt={guru.name}
                              className="size-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="size-full items-center justify-center bg-muted text-muted-foreground"
                            style={{ display: guru.avatar ? 'none' : 'flex' }}
                          >
                            <HugeiconsIcon icon={UserFreeIcons} className="size-3.5" />
                          </div>
                        </div>
                        <span>{guru.name}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{guru.style}</td>
                      <td className="px-4 py-3 text-muted-foreground flex items-center gap-1">
                        <HugeiconsIcon icon={Book02FreeIcons} className="size-3.5 text-muted-foreground/70" />
                        <span>{guru.bookTitle}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <HugeiconsIcon icon={ArrowRight02FreeIcons} className="size-4 text-muted-foreground/60 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* 종목 리스트 탭 */}
        <TabsContent value="tickers" className="mt-4">
          {uniqueTickers.length === 0 ? (
            <EmptyState message="저장된 종목이 없습니다." />
          ) : (
            <div className="rounded-lg border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-max text-xs text-left">
                  <thead className="border-b border-border bg-muted/50 text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 font-semibold">종목 코드</th>
                      <th className="px-4 py-3 font-semibold">종목명</th>
                      <th className="px-4 py-3 font-semibold">종합의견</th>
                      <th className="px-4 py-3 font-semibold">투표 통계</th>
                      <th className="px-4 py-3 text-center font-semibold">총 보고서 수</th>
                      <th className="px-4 py-3 text-right font-semibold">최신 분석일</th>
                      <th className="px-4 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {uniqueTickers.map((t) => (
                      <tr
                        key={t.ticker}
                        onClick={() => onSelectTicker(t.ticker)}
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {t.logoImageUrl && (
                              <img
                                src={t.logoImageUrl}
                                alt=""
                                loading="lazy"
                                className="size-5 shrink-0 rounded-full"
                              />
                            )}
                            <span className="font-mono font-medium text-muted-foreground">{t.ticker}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                        <td className="px-4 py-3">
                          {t.latestVerdict ? (
                            <VerdictBadge verdict={t.latestVerdict} />
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 max-w-[200px]">
                          {t.latestTally ? (
                            <TallyBar tally={t.latestTally} />
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-foreground font-semibold">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[0.6875rem]">
                            {t.reportCount}개
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground">{t.lastDate}</td>
                        <td className="px-4 py-3 text-right">
                          <HugeiconsIcon icon={ArrowRight02FreeIcons} className="size-4 text-muted-foreground/60 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 종합 스크리너 탭 — 13인 공통분모(공통 프리셋) 또는 선택된 거장 */}
        <TabsContent value="screener" className="mt-4">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <HugeiconsIcon icon={Search01FreeIcons} className="size-4 text-muted-foreground" />
                  {currentScreener.title}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {currentScreener.description}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground font-medium">대상 필터 선택:</span>
                <Select value={selectedScreener} onValueChange={setSelectedScreener}>
                  <SelectTrigger className="h-7 w-[180px] text-xs">
                    <SelectValue placeholder="필터 선택" />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    <SelectItem value="공통">종합 (13인 공통분모)</SelectItem>
                    {GURUS_INFO.map((guru) => (
                      <SelectItem key={guru.key} value={guru.screenerKey}>
                        {guru.name} ({guru.style.split(' / ')[0]})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ScreenerDataTable screenerKey={selectedScreener} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ── 2단계: 거장 상세 뷰 컴포넌트 ──────────────────────────────────────────
function GuruDetailView({
  guruKey,
  catalog,
  onSelectTicker,
  onSelectBook,
}: {
  guruKey: string
  catalog: ReportCatalog
  onSelectTicker: (ticker: string) => void
  onSelectBook: (filename: string) => void
}) {
  const guruInfo = GURUS_INFO.find((g) => g.key === guruKey)
  useSetTitle(guruInfo?.name ?? '거장')

  // 해당 거장이 투자의견을 남겼거나 분석에 참여한 종목 목록을 찾습니다.
  const guruPicks = useMemo(() => {
    const picksMap = new Map<string, { ticker: string; name: string; lastDate: string; verdict: Verdict | null; confidence: number | null }>()

    for (const [date, reports] of catalog.entries()) {
      for (const r of reports) {
        const matchingGuruReport = r.gurus.find(
          (g) => g.folder === guruKey || g.guru.replace(/\s+/g, '-') === guruKey.replace(/\s+/g, '-')
        )
        if (matchingGuruReport) {
          const exist = picksMap.get(r.ticker)
          if (!exist || date.localeCompare(exist.lastDate) > 0) {
            picksMap.set(r.ticker, {
              ticker: r.ticker,
              name: r.name,
              lastDate: date,
              verdict: matchingGuruReport.verdict,
              confidence: matchingGuruReport.confidence,
            })
          }
        }
      }
    }

    return Array.from(picksMap.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [catalog, guruKey])

  if (!guruInfo) {
    return <EmptyState message="거장 정보를 찾을 수 없습니다." />
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* 거장 개요 및 스타일 카드 */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {guruInfo.avatar ? (
                  <img
                    src={guruInfo.avatar}
                    alt={guruInfo.name}
                    className="size-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="size-full items-center justify-center bg-primary text-primary-foreground"
                  style={{ display: guruInfo.avatar ? 'none' : 'flex' }}
                >
                  <HugeiconsIcon icon={UserFreeIcons} className="size-5" />
                </div>
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">{guruInfo.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{guruInfo.style}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground leading-relaxed">
              본 대시보드는 글로벌 최고 투자 대가인 {guruInfo.name}의 투자 방법론과 역사적인 서적에서 도출된 규칙들을 바탕으로 각 종목을 필터링하고 종합 분석을 제공합니다. 아래 추천 및 분석 참여 이력 테이블을 통해 의견 분포를 검토해보세요.
            </p>
          </CardContent>
        </Card>

        {/* 거장 관련 도서 정보 카드 — 클릭하면 단일 도서 뷰어로 이동 */}
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onSelectBook(guruInfo.bookFilename)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelectBook(guruInfo.bookFilename)
            }
          }}
          className="cursor-pointer transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <HugeiconsIcon icon={BookOpen02FreeIcons} className="size-4 text-primary" />
              추천 도서
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground">{guruInfo.bookTitle}</h4>
            <p className="text-[0.6875rem] text-muted-foreground leading-normal">
              거장의 정수가 담긴 도서 원문을 요약한 자료예요. 카드를 눌러 바로 읽어보세요.
            </p>
            <div className="mt-1 inline-flex items-center gap-1 text-[0.6875rem] font-medium text-primary">
              <span>도서 보기</span>
              <HugeiconsIcon icon={ArrowRight02FreeIcons} className="size-3.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 거장의 스크리너 — 개요/추천도서와 보고서 이력 사이. 콜드스타트로 느려도 형제 요소라 독립 렌더 */}
      <div className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <HugeiconsIcon icon={Search01FreeIcons} className="size-4 text-muted-foreground" />
            거장의 스크리너
          </h3>
          <p className="text-[0.6875rem] text-muted-foreground">
            {guruInfo.name}의 투자 기준을 통과한 종목들이에요. 국내·해외를 골라서 살펴보세요.
          </p>
        </div>
        <ScreenerDataTable screenerKey={guruInfo.screenerKey} />
      </div>

      {/* 거장 분석/추천 종목 리스트 */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <HugeiconsIcon icon={SignatureFreeIcons} className="size-4 text-muted-foreground" />
          분석 및 투자의견 이력
        </h3>

        {guruPicks.length === 0 ? (
          <EmptyState message="거장이 분석에 참여한 종목이 아직 없습니다." />
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-xs text-left">
                <thead className="border-b border-border bg-muted/50 text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">종목 코드</th>
                    <th className="px-4 py-3 font-semibold">종목명</th>
                    <th className="px-4 py-3 font-semibold">최근 의견</th>
                    <th className="px-4 py-3 text-center font-semibold">확신도</th>
                    <th className="px-4 py-3 text-right font-semibold">분석 일자</th>
                    <th className="px-4 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {guruPicks.map((pick) => (
                    <tr
                      key={pick.ticker}
                      onClick={() => onSelectTicker(pick.ticker)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-muted-foreground">{pick.ticker}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{pick.name}</td>
                      <td className="px-4 py-3">
                        <VerdictBadge verdict={pick.verdict} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {pick.confidence ? (
                          <span className="font-semibold text-foreground">{pick.confidence} / 10</span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{pick.lastDate}</td>
                      <td className="px-4 py-3 text-right">
                        <HugeiconsIcon icon={ArrowRight02FreeIcons} className="size-4 text-muted-foreground/60 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── 3단계: 종목 상세 뷰 컴포넌트 ──────────────────────────────────────────
function TickerDetailView({
  ticker,
  catalog,
  onSelectReport,
}: {
  ticker: string
  catalog: ReportCatalog
  onSelectReport: (date: string) => void
}) {
  // 해당 ticker를 갖고 있는 날짜별 보고서 수집
  const reportsForTicker = useMemo(() => {
    const list: TickerReport[] = []
    for (const reports of catalog.values()) {
      const match = reports.find((r) => r.ticker === ticker)
      if (match) {
        list.push(match)
      }
    }
    return list.sort((a, b) => b.date.localeCompare(a.date)) // 최신날짜 순 정렬
  }, [catalog, ticker])

  const tickerName = reportsForTicker[0]?.name || ticker
  useSetTitle(tickerName)

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <header className="flex flex-col gap-1">
        <div className="flex items-baseline gap-2">
          <h2 className="font-heading text-lg font-bold text-foreground sm:text-xl">{tickerName}</h2>
          <span className="font-mono text-xs text-muted-foreground">{ticker}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          날짜별로 저장된 분석 보고서 목록입니다. 원하는 날짜를 선택하여 개별 거장 의견 및 원탁 토론 내용을 확인하실 수 있습니다.
        </p>
      </header>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-xs text-left">
            <thead className="border-b border-border bg-muted/50 text-[0.6875rem] font-medium text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">보고서 일자</th>
                <th className="px-4 py-3 font-semibold">상태</th>
                <th className="px-4 py-3 font-semibold">종합의견</th>
                <th className="px-4 py-3 font-semibold">거장 투표 통계</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reportsForTicker.map((report) => {
                const verdictWord = report.finalVerdict ? extractVerdictWord(report.finalVerdict) : null
                return (
                  <tr
                    key={report.date}
                    onClick={() => onSelectReport(report.date)}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">{report.date}</td>
                    <td className="px-4 py-3">
                      {report.status === 'final' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary text-[0.625rem] font-medium">
                          최종 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[0.625rem] font-medium">
                          <HugeiconsIcon icon={HourglassFreeIcons} className="size-3" />
                          진행중 ({report.gurus.length}/13)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {report.status === 'final' ? (
                        <VerdictBadge verdict={verdictWord} />
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {report.tally ? (
                        <TallyBar tally={report.tally} />
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <HugeiconsIcon icon={ArrowRight02FreeIcons} className="size-4 text-muted-foreground/60 inline" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── 4단계: 보고서 상세 뷰 컴포넌트 ──────────────────────────────────────────
function ReportDetailView({
  date,
  ticker,
  catalog,
  selectedDoc,
  setSelectedDoc,
}: {
  date: string
  ticker: string
  catalog: ReportCatalog
  selectedDoc: string
  setSelectedDoc: (doc: string) => void
}) {
  const report = useMemo(() => {
    return catalog.get(date)?.find((r) => r.ticker === ticker)
  }, [catalog, date, ticker])

  useSetTitle(report?.name ?? report?.ticker ?? '보고서')

  const [content, setContent] = useState<ContentState>({ status: 'idle' })
  const [retryTick, setRetryTick] = useState(0)

  // 보고서 항목 정보 구축
  const docEntries = useMemo(() => {
    if (!report) return { top: [], gurus: [], bottom: [] }
    const inProgress = report.status !== 'final'
    return {
      top: [
        { kind: 'final', key: 'final', label: '최종 보고서', disabled: inProgress, icon: StarFreeIcons } as DocEntry,
        { kind: 'debate', key: 'debate', label: '원탁 토론', disabled: inProgress, icon: BubbleChatFreeIcons } as DocEntry,
      ],
      gurus: report.gurus.map((g) => ({
        kind: 'guru',
        key: g.folder,
        label: g.guru,
        verdict: g.verdict,
        confidence: g.confidence,
        disabled: false,
        icon: UserFreeIcons
      }) as DocEntry),
      bottom: [
        { kind: 'data', key: 'data', label: '데이터 팩', disabled: !report.data, icon: Database01FreeIcons } as DocEntry,
        { kind: 'valueDrivers', key: 'valueDrivers', label: '가치 드라이버', disabled: !report.valueDrivers, icon: LayersFreeIcons } as DocEntry
      ],
    }
  }, [report])

  // 현재 선택된 문서 엔트리
  const currentEntry = useMemo<DocEntry>(() => {
    const all = [...docEntries.top, ...docEntries.gurus, ...docEntries.bottom]
    return all.find((e) => e.key === selectedDoc) || all[0]
  }, [docEntries, selectedDoc])

  // 본문 로더 가져오기
  const loader = useMemo(() => {
    if (!report) return undefined
    if (selectedDoc === 'final') return report.final
    if (selectedDoc === 'debate') return report.debate
    if (selectedDoc === 'data') return report.data
    if (selectedDoc === 'valueDrivers') return report.valueDrivers
    return report.gurus.find((g) => g.folder === selectedDoc)?.load
  }, [report, selectedDoc])

  useEffect(() => {
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
  }, [loader, retryTick])

  if (!report) {
    return <EmptyState message="보고서를 불러올 수 없습니다." />
  }

  const verdictWord = report.finalVerdict ? extractVerdictWord(report.finalVerdict) : null

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 모바일 가로 칩 네비게이션 */}
      <nav className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden" aria-label="문서 탭">
        {[...docEntries.top, ...docEntries.gurus, ...docEntries.bottom].map((entry) => {
          const isActive = entry.key === selectedDoc
          if (entry.disabled) return null
          return (
            <button
              key={entry.key}
              onClick={() => setSelectedDoc(entry.key)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-[0.6875rem] whitespace-nowrap transition-all ${
                isActive
                  ? 'border-transparent bg-foreground text-background font-medium'
                  : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <HugeiconsIcon icon={entry.icon} className="size-3" />
              <span>{entry.label}</span>
              {entry.kind === 'guru' && 'verdict' in entry && (
                <VerdictBadge verdict={entry.verdict} className="ml-1 scale-90" />
              )}
            </button>
          )
        })}
      </nav>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* 데스크톱 사이드바 네비게이션 */}
        <aside className="hidden lg:flex flex-col gap-4 lg:w-64 lg:shrink-0 lg:sticky lg:top-16">
          <div className="flex flex-col gap-2">
            <h3 className="font-heading text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              문서 목록
            </h3>
            <ul className="flex flex-col gap-0.5">
              {/* 최종 보고서 & 토론 */}
              {docEntries.top.map((entry) => (
                <li key={entry.key}>
                  <SidebarLink
                    entry={entry}
                    isActive={entry.key === selectedDoc}
                    onClick={() => setSelectedDoc(entry.key)}
                  />
                </li>
              ))}
              <Separator className="my-1.5" />
              {/* 거장 개별 의견 */}
              {docEntries.gurus.map((entry) => (
                <li key={entry.key}>
                  <SidebarLink
                    entry={entry}
                    isActive={entry.key === selectedDoc}
                    onClick={() => setSelectedDoc(entry.key)}
                  />
                </li>
              ))}
              <Separator className="my-1.5" />
              {/* 데이터 팩 */}
              {docEntries.bottom.map((entry) => (
                <li key={entry.key}>
                  <SidebarLink
                    entry={entry}
                    isActive={entry.key === selectedDoc}
                    onClick={() => setSelectedDoc(entry.key)}
                  />
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* 보고서 내용 */}
        <div className="min-w-0 flex-1 bg-card rounded-lg border border-border p-4 md:p-6 shadow-xs">
          {/* 내용 헤더 */}
          <div className="mb-6 border-b border-border pb-5">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <HugeiconsIcon icon={currentEntry?.icon || StarFreeIcons} className="size-4.5 text-muted-foreground" />
              <h2 className="font-heading text-base font-bold text-foreground">
                {currentEntry?.label}
              </h2>
              {currentEntry?.kind === 'final' && <VerdictBadge verdict={verdictWord} />}
              {currentEntry?.kind === 'guru' && 'verdict' in currentEntry && (
                <VerdictBadge verdict={currentEntry.verdict} confidence={currentEntry.confidence} />
              )}
            </div>

            {currentEntry?.kind === 'final' && report.finalVerdict && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                {report.finalVerdict}
              </p>
            )}

            {currentEntry?.kind === 'final' && report.tally && (
              <div className="mt-3 max-w-sm">
                <TallyBar tally={report.tally} />
              </div>
            )}
          </div>

          {/* 마크다운 렌더링 영역 */}
          {content.status === 'loading' && <ContentSkeleton />}
          {content.status === 'error' && (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-xs text-muted-foreground">본문을 불러오는 중 오류가 발생했습니다.</p>
              <Button size="sm" variant="outline" onClick={() => setRetryTick((t) => t + 1)}>
                다시 시도
              </Button>
            </div>
          )}
          {content.status === 'ready' && (
            <MarkdownView key={selectedDoc} hideLeadingHeader>
              {content.raw}
            </MarkdownView>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 서브뷰: 단일 도서 뷰어 ──────────────────────────────────────────────────
function BookDetailView({ filename }: { filename: string }) {
  useSetTitle(filenameToTitle(filename))

  const [content, setContent] = useState<ContentState>({ status: 'idle' })
  const [retryTick, setRetryTick] = useState(0)

  // 진입 시 스크롤 최상단으로.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [filename])

  useEffect(() => {
    if (!filename) {
      setContent({ status: 'error' })
      return
    }

    let alive = true
    setContent({ status: 'loading' })

    const globRecords = import.meta.glob('../../../docs/books/*.md', {
      query: '?raw',
      import: 'default',
    }) as Record<string, () => Promise<string>>

    // 경로에서 파일명으로 로더 찾기
    const loader = Object.entries(globRecords).find(([path]) =>
      path.endsWith(`/${filename}`),
    )?.[1]

    if (!loader) {
      if (alive) setContent({ status: 'error' })
      return
    }

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
  }, [filename, retryTick])

  return (
    <div className="min-w-0 flex-1 animate-in fade-in duration-300">
      <div className="mb-6 flex items-center gap-2 border-b border-border pb-5">
        <HugeiconsIcon icon={BookOpen02FreeIcons} className="size-4 text-muted-foreground" />
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {filenameToTitle(filename)}
        </h2>
      </div>

      {(content.status === 'idle' || content.status === 'loading') && <ContentSkeleton />}
      {content.status === 'error' && <BookErrorState onRetry={() => setRetryTick((t) => t + 1)} />}
      {content.status === 'ready' && <MarkdownView key={filename}>{content.raw}</MarkdownView>}
    </div>
  )
}

function BookErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <HugeiconsIcon icon={AlertCircleFreeIcons} className="size-6 text-muted-foreground" />
      <p className="text-sm font-medium text-foreground">책을 불러올 수 없습니다</p>
      <p className="text-xs text-muted-foreground">잠시 뒤에 다시 시도해 주세요</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
        다시 시도
      </Button>
    </div>
  )
}

function SidebarLink({
  entry,
  isActive,
  onClick,
}: {
  entry: any
  isActive: boolean
  onClick: () => void
}) {
  if (entry.disabled) {
    return (
      <span className="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground/40 cursor-not-allowed">
        <HugeiconsIcon icon={entry.icon} className="size-3.5 shrink-0" />
        <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      </span>
    )
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs text-left transition-colors ${
        isActive
          ? 'bg-muted font-semibold text-foreground'
          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`}
    >
      <HugeiconsIcon icon={entry.icon} className="size-3.5 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
      {entry.kind === 'guru' && entry.verdict && (
        <VerdictBadge verdict={entry.verdict} confidence={entry.confidence} className="shrink-0 scale-90" />
      )}
    </button>
  )
}

// ── 공용 뼈대 및 로딩 컴포넌트 ──────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="데이터를 불러오고 있어요">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-28" />
        <Skeleton className="h-8 w-28" />
      </div>
      <div className="rounded-lg border border-border p-4 flex flex-col gap-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex justify-between items-center py-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  )
}

function ContentSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-20 text-center">
      <p className="text-sm font-medium">데이터를 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">잠시 뒤 새로고침해 주세요</p>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
      <HugeiconsIcon icon={FileEmpty02FreeIcons} className="size-8 text-muted-foreground" />
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}
