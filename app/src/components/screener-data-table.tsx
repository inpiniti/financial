// 거장 스크리너 데이터테이블 — 거장 하나를 받아 토스 스크리너 결과를 shadcn Table +
// @tanstack/react-table로 렌더한다. 거장 선택 탭은 이 컴포넌트의 관심사가 아니다
// (그건 상위 페이지가 props로 screenerKey를 바꿔가며 담당한다).

import { useEffect, useMemo, useState } from 'react'
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDown01FreeIcons,
  ArrowUp01FreeIcons,
  ArrowUpDownFreeIcons,
  RefreshFreeIcons,
} from '@hugeicons/core-free-icons'
import {
  changeRate,
  fetchGuruPicks,
  formatMetric,
  formatPrice,
  metricColumns,
} from '@/lib/screener'
import type { GuruPicks, Nation, Stock } from '@/lib/screener'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** 표 한 행 — 고정 필드 + 동적 지표 값을 한 곳에 모은다(정렬용 raw 값 포함). */
type Row = Stock & { changePercent: number | null }

export function ScreenerDataTable({
  screenerKey,
  initialNation = 'kr',
}: {
  screenerKey: string
  initialNation?: Nation
}) {
  const [nation, setNation] = useState<Nation>(initialNation)
  const [picks, setPicks] = useState<GuruPicks | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState('loading')
    fetchGuruPicks(screenerKey, nation, 200, controller.signal)
      .then((data) => {
        setPicks(data)
        setState('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setState('error')
      })
    return () => controller.abort()
  }, [screenerKey, nation, reloadKey])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ResultCount picks={state === 'ready' ? picks : null} />
        <NationToggle nation={nation} onChange={setNation} />
      </div>

      {state === 'loading' && <ResultSkeleton />}
      {state === 'error' && <ErrorState onRetry={() => setReloadKey((k) => k + 1)} />}
      {state === 'ready' && picks && <ResultTable picks={picks} />}
    </div>
  )
}

function ResultCount({ picks }: { picks: GuruPicks | null }) {
  if (!picks) return <span />
  return (
    <p className="text-[0.6875rem] text-muted-foreground">
      조건을 통과한 종목 {picks.totalCount.toLocaleString('ko-KR')}개
    </p>
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

function ResultTable({ picks }: { picks: GuruPicks }) {
  const [sorting, setSorting] = useState<SortingState>([])

  const rows = useMemo<Row[]>(
    () =>
      picks.stocks.map((stock) => ({
        ...stock,
        changePercent: changeRate(stock.price, stock.prevClose),
      })),
    [picks.stocks],
  )

  const metricKeys = useMemo(() => metricColumns(picks.stocks), [picks.stocks])

  const columns = useMemo<ColumnDef<Row>[]>(() => {
    const stockColumn: ColumnDef<Row> = {
      id: 'stock',
      header: '종목',
      enableSorting: false,
      cell: ({ row }) => <StockCell stock={row.original} />,
    }

    const priceColumn: ColumnDef<Row> = {
      id: 'price',
      accessorFn: (row) => row.price,
      header: '현재가',
      sortUndefined: 'last',
      cell: ({ row }) => (
        <PriceCell price={row.original.price} changePercent={row.original.changePercent} />
      ),
    }

    const metricColumnDefs: ColumnDef<Row>[] = metricKeys.map((key) => ({
      id: key,
      accessorFn: (row) => row[key],
      header: key,
      sortUndefined: 'last',
      sortingFn: (a, b, columnId) => {
        const av = a.getValue(columnId)
        const bv = b.getValue(columnId)
        const an = typeof av === 'number' ? av : null
        const bn = typeof bv === 'number' ? bv : null
        if (an === null && bn === null) return 0
        if (an === null) return 1
        if (bn === null) return -1
        return an - bn
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatMetric(key, row.original[key])}</span>
      ),
    }))

    return [stockColumn, priceColumn, ...metricColumnDefs]
  }, [metricKeys])

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="min-w-max">
        <TableHeader className="bg-muted/40">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortable = header.column.getCanSort()
                const sortDir = header.column.getIsSorted()
                const isStockColumn = header.column.id === 'stock'

                return (
                  <TableHead
                    key={header.id}
                    className={cn(
                      'text-muted-foreground',
                      !isStockColumn && 'text-right',
                      sortable && 'cursor-pointer select-none hover:text-foreground',
                    )}
                    onClick={sortable ? header.column.getToggleSortingHandler() : undefined}
                  >
                    <span
                      className={cn(
                        'inline-flex items-center gap-1',
                        !isStockColumn && 'justify-end',
                      )}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortable && (
                        <HugeiconsIcon
                          icon={
                            sortDir === 'asc'
                              ? ArrowUp01FreeIcons
                              : sortDir === 'desc'
                                ? ArrowDown01FreeIcons
                                : ArrowUpDownFreeIcons
                          }
                          className={cn(
                            'size-3',
                            sortDir ? 'text-foreground' : 'text-muted-foreground/50',
                          )}
                        />
                      )}
                    </span>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(cell.column.id !== 'stock' && 'text-right')}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StockCell({ stock }: { stock: Stock }) {
  return (
    <div className="flex items-center gap-2">
      {stock.logoImageUrl && (
        <img
          src={stock.logoImageUrl}
          alt=""
          loading="lazy"
          className="size-5 shrink-0 rounded-full"
        />
      )}
      <div className="flex flex-col leading-tight">
        <span className="font-medium whitespace-nowrap">{stock.name}</span>
        {stock.ticker && (
          <span className="font-mono text-[0.6875rem] text-muted-foreground">{stock.ticker}</span>
        )}
      </div>
    </div>
  )
}

function PriceCell({
  price,
  changePercent,
}: {
  price: number | null
  changePercent: number | null
}) {
  return (
    <span className="whitespace-nowrap">
      <span>{formatPrice(price)}</span>
      {changePercent !== null && (
        <span
          className={cn(
            'ml-1.5 text-[0.6875rem]',
            changePercent > 0 && 'text-red-600 dark:text-red-400',
            changePercent < 0 && 'text-blue-600 dark:text-blue-400',
            changePercent === 0 && 'text-muted-foreground',
          )}
        >
          {changePercent > 0 ? '+' : ''}
          {changePercent.toFixed(2)}%
        </span>
      )}
    </span>
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
