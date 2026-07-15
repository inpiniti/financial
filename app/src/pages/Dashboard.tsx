import { useEffect, useState, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowLeft02FreeIcons,
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
} from '@hugeicons/core-free-icons'

import { loadCatalog } from '@/lib/catalog'
import type { ReportCatalog, TickerReport, Verdict } from '@/lib/catalog'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { VerdictBadge } from '@/components/verdict-badge'
import { TallyBar } from '@/components/tally-bar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { MarkdownView } from '@/components/markdown-view'

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

// 거장 목록 상수 정의 (13인) 및 대표 도서 정보 매핑
const GURUS_INFO = [
  { key: '뉴욕주민', name: '뉴욕주민', style: '가치투자 / 월스트리트 트레이더', bookFilename: '미국_주식_투자지도_요약.md', bookTitle: '미국 주식 투자지도' },
  { key: '마이클-버리', name: '마이클 버리', style: '역발상 / 딥 밸류', bookFilename: '빅쇼트.md', bookTitle: '빅쇼트' },
  { key: '모니시-파브라이', name: '모니시 파브라이', style: '단도 투자 / 고집적 가치투자', bookFilename: '단도 투자.md', bookTitle: '단도 투자' },
  { key: '벤저민-그레이엄', name: '벤저민 그레이엄', style: '계량 가치투자 / 안전마진', bookFilename: '현명한_투자자.md', bookTitle: '현명한 투자자' },
  { key: '세스-클라먼', name: '세스 클라먼', style: '보수적 가치투자 / 안전마진', bookFilename: '안전마진.md', bookTitle: '안전마진' },
  { key: '앙드레-코스톨라니', name: '앙드레 코스톨라니', style: '투자 심리학 / 달걀 모형', bookFilename: '돈_뜨겁게_사랑하고_차갑게_다루어라.md', bookTitle: '돈 뜨겁게 사랑하고 차갑게 다루어라' },
  { key: '애스워스-다모다란', name: '애스워스 다모다란', style: '뉴욕대 가치평가 거장', bookFilename: '주식_가치평가_완벽정리.md', bookTitle: '주식 가치평가 완벽정리' },
  { key: '워런-버핏', name: '워런 버핏', style: '경제적 해자 / 장기 복리', bookFilename: '워런_버핏의_재무제표_활용법_요약.md', bookTitle: '워런 버핏의 재무제표 활용법' },
  { key: '잭-슈웨거', name: '잭 슈웨거', style: '시장 마법사 / 트레이딩 거장', bookFilename: '마켓_위저드.md', bookTitle: '마켓 위저드' },
  { key: '조엘-그린블라트', name: '조엘 그린블라트', style: '마법공식 / 고자본수익률', bookFilename: '주식시장을 이기는 작은 책.md', bookTitle: '주식시장을 이기는 작은 책' },
  { key: '존-템플턴', name: '존 템플턴', style: '글로벌 역발상 / 영적 투자자', bookFilename: '주식_투자_원칙.md', bookTitle: '주식 투자 원칙' },
  { key: '피터-린치', name: '피터 린치', style: '생활 속 발견 / 가브 성장주', bookFilename: '이기는_투자.md', bookTitle: '이기는 투자' },
  { key: '필립-피셔', name: '필립 피셔', style: '위대한 기업 / 사실수집(Scuttlebutt)', bookFilename: '위대한_기업에_투자하라.md', bookTitle: '위대한 기업에 투자하라' },
]

function extractVerdictWord(text: string): Verdict | null {
  const match = text.match(/^(매수|보유|매도|관망)/)
  return (match?.[1] as Verdict | undefined) ?? null
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
  const view = searchParams.get('view') || 'main' // main | guru-detail | ticker-detail | report-detail
  const activeTab = searchParams.get('tab') || 'gurus' // gurus | tickers (메인 탭전환용)
  const selectedGuruKey = searchParams.get('guru') || '' // 거장 key
  const selectedTicker = searchParams.get('ticker') || '' // 종목 ticker
  const selectedDate = searchParams.get('date') || '' // 날짜
  const selectedDoc = searchParams.get('doc') || 'final' // final | debate | data | {guruKey}

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

  // 1. 공통 종목 리스트 생성 (보고서로 저장되어 있는 고유 종목 리스트)
  const uniqueTickers = useMemo(() => {
    if (loadState.status !== 'ready') return []
    const tickerMap = new Map<string, { ticker: string; name: string; reportCount: number; lastDate: string }>()

    for (const [date, reports] of loadState.catalog.entries()) {
      for (const r of reports) {
        const exist = tickerMap.get(r.ticker)
        if (exist) {
          exist.reportCount += 1
        } else {
          tickerMap.set(r.ticker, {
            ticker: r.ticker,
            name: r.name,
            reportCount: 1,
            lastDate: date,
          })
        }
      }
    }
    return Array.from(tickerMap.values()).sort((a, b) => b.lastDate.localeCompare(a.lastDate))
  }, [loadState])

  // 스택 이동 함수
  const pushView = (params: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    Object.entries(params).forEach(([k, v]) => {
      if (v) next.set(k, v); else next.delete(k)
    })
    setSearchParams(next)
  }

  // 뒤로 가기 헬퍼 함수
  const goBack = () => {
    if (view === 'report-detail') {
      pushView({ view: 'ticker-detail', date: '', doc: '' })
    } else if (view === 'ticker-detail') {
      if (selectedGuruKey) {
        pushView({ view: 'guru-detail', ticker: '' })
      } else {
        pushView({ view: 'main', ticker: '' })
      }
    } else if (view === 'guru-detail') {
      pushView({ view: 'main', guru: '' })
    }
  }

  if (loadState.status === 'loading') return <DashboardSkeleton />
  if (loadState.status === 'error') return <ErrorState />

  const { catalog } = loadState

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 1단계: 메인 탭 뷰 */}
      {view === 'main' && (
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-1.5">
            <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              거장들의 투자 통찰
            </h1>
            <p className="text-xs text-muted-foreground sm:text-sm">
              13인의 투자 거장들의 분석 보고서와 도서 정보, 그리고 최신 투자 스크리너 자료를 한자리에서 탐색합니다.
            </p>
          </header>

          <Tabs
            value={activeTab}
            onValueChange={(val) => pushView({ tab: val })}
            className="w-full"
          >
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="gurus" className="gap-1.5 py-1">
                <HugeiconsIcon icon={UserFreeIcons} className="size-3.5" />
                거장 리스트
              </TabsTrigger>
              <TabsTrigger value="tickers" className="gap-1.5 py-1">
                <HugeiconsIcon icon={LayersFreeIcons} className="size-3.5" />
                종목 리스트
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
                          onClick={() => pushView({ view: 'guru-detail', guru: guru.key })}
                          className="hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground">
                              <HugeiconsIcon icon={UserFreeIcons} className="size-3.5" />
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
                          <th className="px-4 py-3 text-center font-semibold">총 보고서 수</th>
                          <th className="px-4 py-3 text-right font-semibold">최신 분석일</th>
                          <th className="px-4 py-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {uniqueTickers.map((t) => (
                          <tr
                            key={t.ticker}
                            onClick={() => pushView({ view: 'ticker-detail', ticker: t.ticker })}
                            className="hover:bg-muted/40 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3 font-mono font-medium text-muted-foreground">{t.ticker}</td>
                            <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
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
          </Tabs>
        </div>
      )}

      {/* 2단계: 거장 상세 뷰 */}
      {view === 'guru-detail' && (
        <GuruDetailView
          guruKey={selectedGuruKey}
          catalog={catalog}
          onBack={goBack}
          onSelectTicker={(ticker) => pushView({ view: 'ticker-detail', ticker })}
        />
      )}

      {/* 3단계: 종목 상세 뷰 */}
      {view === 'ticker-detail' && (
        <TickerDetailView
          ticker={selectedTicker}
          catalog={catalog}
          onBack={goBack}
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
          onBack={goBack}
        />
      )}
    </div>
  )
}

// ── 2단계: 거장 상세 뷰 컴포넌트 ──────────────────────────────────────────
function GuruDetailView({
  guruKey,
  catalog,
  onBack,
  onSelectTicker,
}: {
  guruKey: string
  catalog: ReportCatalog
  onBack: () => void
  onSelectTicker: (ticker: string) => void
}) {
  const guruInfo = GURUS_INFO.find((g) => g.key === guruKey)

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
    return (
      <div className="flex flex-col gap-4">
        <Button onClick={onBack} variant="ghost" size="sm" className="w-fit">
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-3.5 mr-1" />
          뒤로가기
        </Button>
        <EmptyState message="거장 정보를 찾을 수 없습니다." />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-4" />
          메인
        </button>
        <span className="text-xs text-muted-foreground">거장 상세 프로필</span>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* 거장 개요 및 스타일 카드 */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <HugeiconsIcon icon={UserFreeIcons} className="size-5" />
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

        {/* 거장 관련 도서 정보 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
              <HugeiconsIcon icon={BookOpen02FreeIcons} className="size-4 text-primary" />
              추천 도서
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-foreground">{guruInfo.bookTitle}</h4>
            <p className="text-[0.6875rem] text-muted-foreground leading-normal">
              거장의 정수가 담겨 있는 도서 원문을 요약 분석한 자료를 서재 탭에서 열람하실 수 있습니다.
            </p>
            <div className="mt-2 text-[0.6875rem] font-medium text-primary flex items-center gap-1">
              <span>파일명: {guruInfo.bookFilename}</span>
            </div>
          </CardContent>
        </Card>
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
  onBack,
  onSelectReport,
}: {
  ticker: string
  catalog: ReportCatalog
  onBack: () => void
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

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-4" />
          이전으로
        </button>
        <span className="font-mono text-[0.6875rem] text-muted-foreground">{ticker}</span>
      </div>

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
  onBack,
}: {
  date: string
  ticker: string
  catalog: ReportCatalog
  selectedDoc: string
  setSelectedDoc: (doc: string) => void
  onBack: () => void
}) {
  const report = useMemo(() => {
    return catalog.get(date)?.find((r) => r.ticker === ticker)
  }, [catalog, date, ticker])

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
        { kind: 'data', key: 'data', label: '데이터 팩', disabled: !report.data, icon: Database01FreeIcons } as DocEntry
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
    return (
      <div className="flex flex-col gap-4">
        <Button onClick={onBack} variant="ghost" size="sm" className="w-fit">
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-3.5 mr-1" />
          뒤로가기
        </Button>
        <EmptyState message="보고서를 불러올 수 없습니다." />
      </div>
    )
  }

  const verdictWord = report.finalVerdict ? extractVerdictWord(report.finalVerdict) : null

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 헤더 네비게이션 */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft02FreeIcons} className="size-4" />
          {report.name} 목록
        </button>
        <span className="font-mono text-[0.6875rem] text-muted-foreground">
          {report.ticker} · {report.date}
        </span>
      </div>

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
