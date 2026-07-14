// 스크리너 (/screener) — 13인의 거장 필터 세트로 토스증권에서 종목을 골라온다.
// 데이터: bitcoin-ai-backend의 /toss/* (docs/tossfilter.md의 필터 세트를 서버가 그대로 들고 있다)

import { useEffect, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02FreeIcons, FilterFreeIcons, RefreshFreeIcons } from '@hugeicons/core-free-icons'
import {
  changeRate,
  fetchGuruPicks,
  fetchGurus,
  formatMetric,
  formatPrice,
  metricColumns,
} from '@/lib/screener'
import type { Guru, GuruPicks, Nation, Stock } from '@/lib/screener'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

function ScreenerPage() {
  const [gurus, setGurus] = useState<Guru[] | null>(null)
  const [guruError, setGuruError] = useState(false)
  const [selected, setSelected] = useState('공통')
  const [nation, setNation] = useState<Nation>('kr')

  const [picks, setPicks] = useState<GuruPicks | null>(null)
  const [picksState, setPicksState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchGurus(controller.signal)
      .then(setGurus)
      .catch(() => {
        if (!controller.signal.aborted) setGuruError(true)
      })
    return () => controller.abort()
  }, [reloadKey])

  useEffect(() => {
    const controller = new AbortController()
    setPicksState('loading')
    fetchGuruPicks(selected, nation, 50, controller.signal)
      .then((data) => {
        setPicks(data)
        setPicksState('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setPicksState('error')
      })
    return () => controller.abort()
  }, [selected, nation, reloadKey])

  const activeGuru = gurus?.find((g) => g.key === selected)

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight">
          <HugeiconsIcon icon={FilterFreeIcons} className="size-4.5 text-muted-foreground" />
          거장의 종목 필터
        </h1>
        <p className="text-xs text-muted-foreground">
          13인의 거장이 각자 어떤 조건으로 종목을 걸러내는지, 토스증권 스크리너에 그대로 적용한 결과입니다.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <GuruTabs gurus={gurus} error={guruError} selected={selected} onSelect={setSelected} />
        <NationToggle nation={nation} onChange={setNation} />
      </div>

      {activeGuru && <GuruBrief guru={activeGuru} totalCount={picks?.totalCount ?? null} />}

      {picksState === 'loading' && <ResultSkeleton />}
      {picksState === 'error' && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {picksState === 'ready' && picks && <ResultTable picks={picks} />}
    </div>
  )
}

function GuruTabs({
  gurus,
  error,
  selected,
  onSelect,
}: {
  gurus: Guru[] | null
  error: boolean
  selected: string
  onSelect: (key: string) => void
}) {
  if (error) {
    return <p className="text-xs text-muted-foreground">거장 목록을 불러오지 못했어요</p>
  }
  if (!gurus) {
    return (
      <div className="flex gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-7 w-16" />
        ))}
      </div>
    )
  }

  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {gurus.map((guru) => (
        <Button
          key={guru.key}
          variant={guru.key === selected ? 'default' : 'ghost'}
          size="sm"
          className="shrink-0"
          onClick={() => onSelect(guru.key)}
        >
          {guru.key}
        </Button>
      ))}
    </div>
  )
}

function NationToggle({ nation, onChange }: { nation: Nation; onChange: (n: Nation) => void }) {
  return (
    <div className="flex shrink-0 rounded-lg bg-muted p-[3px]">
      {(['kr', 'us'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
            nation === value
              ? 'bg-background text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {value === 'kr' ? '국내' : '해외'}
        </button>
      ))}
    </div>
  )
}

function GuruBrief({ guru, totalCount }: { guru: Guru; totalCount: number | null }) {
  // 거장들이 권한 "손으로 검토 가능한" 구간은 20~40개다.
  const tooFew = totalCount !== null && totalCount < 15
  const tooMany = totalCount !== null && totalCount > 60

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm">
          <span>{guru.name}</span>
          <Badge variant="secondary">{guru.style}</Badge>
          <Badge variant="outline">필터 {guru.filterCount}개</Badge>
          {totalCount !== null && (
            <Badge variant={tooFew || tooMany ? 'destructive' : 'outline'}>
              {totalCount}종목
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs/relaxed text-foreground">“{guru.principle}”</p>
        {guru.note && (
          <p className="flex gap-1.5 text-[0.6875rem]/relaxed text-muted-foreground">
            <HugeiconsIcon icon={Alert02FreeIcons} className="mt-px size-3.5 shrink-0" />
            <span>{guru.note}</span>
          </p>
        )}
        {tooMany && guru.tighten && (
          <p className="text-[0.6875rem] text-muted-foreground">
            결과가 많아요 — 조이려면: {guru.tighten}
          </p>
        )}
        {tooFew && guru.loosen && (
          <p className="text-[0.6875rem] text-muted-foreground">
            결과가 적어요 — 풀려면: {guru.loosen}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ResultTable({ picks }: { picks: GuruPicks }) {
  if (picks.stocks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-16 text-center">
        <p className="text-sm font-medium">조건을 통과한 종목이 없어요</p>
        <p className="text-xs text-muted-foreground">
          {picks.loosen ? `풀려면: ${picks.loosen}` : '필터가 너무 엄격합니다'}
        </p>
      </div>
    )
  }

  const columns = metricColumns(picks.stocks)

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-max text-xs">
        <thead className="border-b border-border bg-muted/40">
          <tr className="text-left text-muted-foreground">
            <th className="px-3 py-2 font-medium">종목</th>
            <th className="px-3 py-2 text-right font-medium">현재가</th>
            {columns.map((col) => (
              <th key={col} className="px-3 py-2 text-right font-medium whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {picks.stocks.map((stock) => (
            <StockRow key={stock.stockCode} stock={stock} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StockRow({ stock, columns }: { stock: Stock; columns: string[] }) {
  const change = changeRate(stock.price, stock.prevClose)

  return (
    <tr className="border-b border-border last:border-0 hover:bg-muted/30">
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          {stock.logoImageUrl && (
            <img
              src={stock.logoImageUrl}
              alt=""
              loading="lazy"
              className="size-5 shrink-0 rounded-full"
            />
          )}
          <span className="font-medium whitespace-nowrap">{stock.name}</span>
        </div>
      </td>
      <td className="px-3 py-2 text-right whitespace-nowrap">
        <span>{formatPrice(stock.price)}</span>
        {change !== null && (
          <span
            className={cn(
              'ml-1.5 text-[0.6875rem]',
              change > 0 && 'text-red-600 dark:text-red-400',
              change < 0 && 'text-blue-600 dark:text-blue-400',
              change === 0 && 'text-muted-foreground',
            )}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}%
          </span>
        )}
      </td>
      {columns.map((col) => (
        <td key={col} className="px-3 py-2 text-right whitespace-nowrap text-muted-foreground">
          {formatMetric(col, stock[col])}
        </td>
      ))}
    </tr>
  )
}

function ResultSkeleton() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="종목을 불러오고 있어요">
      <Skeleton className="h-9 w-full" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
      <p className="pt-1 text-center text-[0.6875rem] text-muted-foreground">
        서버가 잠들어 있으면 첫 조회에 30초 정도 걸릴 수 있어요
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <p className="text-sm font-medium">종목을 불러오지 못했어요</p>
      <p className="text-xs text-muted-foreground">
        스크리너 서버가 깨어나는 중일 수 있어요. 잠시 뒤 다시 시도해 주세요.
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <HugeiconsIcon icon={RefreshFreeIcons} data-icon="inline-start" />
        다시 시도
      </Button>
    </div>
  )
}

export default ScreenerPage
