// 간단 분석 탭 — Supabase guru_votes에 쌓인 13인 표결을 날짜별로 보여준다.
//
// 보고서(docs/report/*.md)를 읽는 다른 탭들과 달리 이 탭의 원천은 DB다. 표결 스킬이
// 하루치를 seed → put으로 채우므로, 날짜를 고르면 그 날의 대상 종목 전체가 종합의견
// 순(매수 → 매도)으로 나온다. 행을 펼치면 누가 무슨 판정을 냈는지까지 볼 수 있다.
//
// 날짜 선택은 shadcn date picker(Popover + Calendar) 조합이며, 표결이 없는 날은
// 아예 못 고르게 막는다(빈 화면을 보여주느니 선택지에서 지우는 편이 덜 헷갈린다).
//
// 행을 펼치면 그 종목의 표결 이력 전체를 티커로 다시 조회해 거장×날짜 히트맵으로 보여준다
// (vote-history.tsx). 고른 날짜 열이 강조되므로 "그날 누가 뭐라 했나"와 "그 판정이 언제
// 바뀌었나"를 한 그림에서 읽을 수 있다.

import { useEffect, useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Calendar03FreeIcons,
  ArrowDown01FreeIcons,
  ArrowRight02FreeIcons,
} from '@hugeicons/core-free-icons'
import { ko } from 'date-fns/locale'

import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { VerdictBadge } from '@/components/verdict-badge'
import { TallyBar } from '@/components/tally-bar'
import { VoteHistory } from '@/components/vote-history'
import { cn } from '@/lib/utils'
import { fetchVoteDates, fetchVotesByDate, fetchVotesByTicker, isVotesConfigured } from '@/lib/votes'
import type { VoteRow } from '@/lib/votes'

/** Date → 'YYYY-MM-DD'. toISOString은 UTC로 밀려 하루 어긋날 수 있어 로컬 기준으로 만든다. */
function toDateKey(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** 'YYYY-MM-DD' → 로컬 자정 Date. */
function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function formatLabel(key: string): string {
  return `${key} (${WEEKDAYS[fromDateKey(key).getDay()]})`
}

type DatesState =
  | { status: 'loading' }
  | { status: 'ready'; dates: string[] }
  | { status: 'error'; message: string }

type RowsState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; rows: VoteRow[] }
  | { status: 'error'; message: string }

export interface VoteAnalysisProps {
  /** 티커 → tradingview logoid (Dashboard가 이미 만들어 둔 맵을 재사용) */
  logoMap?: Map<string, string>
}

export function VoteAnalysis({ logoMap }: VoteAnalysisProps) {
  const [datesState, setDatesState] = useState<DatesState>({ status: 'loading' })
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [rowsState, setRowsState] = useState<RowsState>({ status: 'idle' })
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  // 표결이 있는 날짜 목록 — 최초 1회. 가장 최근 날짜를 기본 선택한다.
  useEffect(() => {
    if (!isVotesConfigured()) {
      setDatesState({
        status: 'error',
        message:
          'Supabase 연결 정보가 없습니다. app/.env에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY를 넣어 주세요.',
      })
      return
    }
    let alive = true
    fetchVoteDates()
      .then((dates) => {
        if (!alive) return
        setDatesState({ status: 'ready', dates })
        if (dates.length > 0) setSelectedDate(dates[0])
      })
      .catch((e: Error) => {
        if (alive) setDatesState({ status: 'error', message: e.message })
      })
    return () => {
      alive = false
    }
  }, [])

  // 선택된 날짜의 표결
  useEffect(() => {
    if (!selectedDate) return
    let alive = true
    setRowsState({ status: 'loading' })
    setExpanded(null)
    fetchVotesByDate(selectedDate)
      .then((rows) => {
        if (alive) setRowsState({ status: 'ready', rows })
      })
      .catch((e: Error) => {
        if (alive) setRowsState({ status: 'error', message: e.message })
      })
    return () => {
      alive = false
    }
  }, [selectedDate])

  const availableDates = useMemo(
    () => (datesState.status === 'ready' ? datesState.dates : []),
    [datesState],
  )
  const availableSet = useMemo(() => new Set(availableDates), [availableDates])

  const summary = useMemo(() => {
    if (rowsState.status !== 'ready') return null
    const rows = rowsState.rows
    return {
      total: rows.length,
      done: rows.filter((r) => r.overall).length,
      buy: rows.filter((r) => r.overall === '매수').length,
    }
  }, [rowsState])

  if (datesState.status === 'loading') {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (datesState.status === 'error') return <Notice message={datesState.message} />

  if (availableDates.length === 0) {
    return <Notice message="저장된 표결이 없습니다. guru-report 스킬로 표결을 돌리면 여기에 쌓입니다." />
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더: 날짜 선택 + 요약 */}
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <HugeiconsIcon icon={Calendar03FreeIcons} className="size-4 text-muted-foreground" />
            {selectedDate ? formatLabel(selectedDate) : '날짜 선택'}의 표결
          </h2>
          <p className="text-xs text-muted-foreground">
            {summary
              ? `대상 ${summary.total}종목 · 판정 완료 ${summary.done}종목 · 종합 매수 ${summary.buy}종목`
              : '13인 거장의 매수·보유·관망·매도 판정을 한 화면에 모았습니다.'}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">분석 날짜:</span>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-7 w-[180px] justify-between px-2.5 text-xs font-normal"
              >
                {selectedDate || '날짜 선택'}
                <HugeiconsIcon icon={Calendar03FreeIcons} className="size-3.5 text-muted-foreground" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                locale={ko}
                defaultMonth={selectedDate ? fromDateKey(selectedDate) : undefined}
                startMonth={fromDateKey(availableDates[availableDates.length - 1])}
                endMonth={fromDateKey(availableDates[0])}
                selected={selectedDate ? fromDateKey(selectedDate) : undefined}
                // 표결이 없는 날은 선택 불가
                disabled={(date: Date) => !availableSet.has(toDateKey(date))}
                onSelect={(date: Date | undefined) => {
                  if (!date) return
                  setSelectedDate(toDateKey(date))
                  setOpen(false)
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {rowsState.status === 'loading' && <Skeleton className="h-64 w-full" />}
      {rowsState.status === 'error' && <Notice message={rowsState.message} />}
      {rowsState.status === 'ready' &&
        (rowsState.rows.length === 0 ? (
          <Notice message="이 날짜에는 표결 대상 종목이 없습니다." />
        ) : (
          <VoteTable
            rows={rowsState.rows}
            selectedDate={selectedDate}
            logoMap={logoMap}
            expanded={expanded}
            onToggle={(ticker) => setExpanded((prev) => (prev === ticker ? null : ticker))}
          />
        ))}
    </div>
  )
}

function VoteTable({
  rows,
  selectedDate,
  logoMap,
  expanded,
  onToggle,
}: {
  rows: VoteRow[]
  selectedDate: string
  logoMap?: Map<string, string>
  expanded: string | null
  onToggle: (ticker: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-left text-xs">
          <thead className="border-b border-border bg-muted/50 text-[0.6875rem] font-medium uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">종목 코드</th>
              <th className="px-4 py-3 font-semibold">종목명</th>
              <th className="px-4 py-3 font-semibold">종합의견</th>
              <th className="px-4 py-3 font-semibold">표결 통계</th>
              <th className="px-4 py-3 text-center font-semibold">판정 인원</th>
              <th className="px-4 py-3 font-semibold">스크리너</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => {
              const logoid = logoMap?.get(r.ticker)
              const isOpen = expanded === r.ticker
              return (
                <VoteTableRow
                  key={r.ticker}
                  row={r}
                  selectedDate={selectedDate}
                  logoid={logoid}
                  isOpen={isOpen}
                  onToggle={onToggle}
                />
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function VoteTableRow({
  row,
  selectedDate,
  logoid,
  isOpen,
  onToggle,
}: {
  row: VoteRow
  selectedDate: string
  logoid?: string
  isOpen: boolean
  onToggle: (ticker: string) => void
}) {
  return (
    <>
      <tr
        onClick={() => onToggle(row.ticker)}
        className={cn('cursor-pointer transition-colors hover:bg-muted/40', isOpen && 'bg-muted/30')}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {logoid && (
              <img
                src={`https://s3-symbol-logo.tradingview.com/${logoid}.svg`}
                alt=""
                loading="lazy"
                className="size-5 shrink-0 rounded-full"
              />
            )}
            <span className="font-mono font-medium text-muted-foreground">{row.ticker}</span>
          </div>
        </td>
        <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
        <td className="px-4 py-3">
          {row.overall ? (
            <VerdictBadge verdict={row.overall} />
          ) : (
            <span className="text-muted-foreground/60">미판정</span>
          )}
        </td>
        <td className="max-w-[200px] px-4 py-3">
          {row.votedCount > 0 ? (
            <TallyBar tally={row.tally} />
          ) : (
            <span className="text-muted-foreground/60">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-center">
          <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-[0.6875rem] text-muted-foreground">
            {row.votedCount}/13
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {row.screeners.length === 0 ? (
              <span className="text-muted-foreground/60">—</span>
            ) : (
              row.screeners.map((s) => (
                <Badge key={s} variant="outline" className="text-[0.625rem] font-normal">
                  {s}
                </Badge>
              ))
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <HugeiconsIcon
            icon={isOpen ? ArrowDown01FreeIcons : ArrowRight02FreeIcons}
            className="inline size-4 text-muted-foreground/60"
          />
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-muted/20">
          <td colSpan={7} className="px-4 py-3">
            <HistoryPanel row={row} selectedDate={selectedDate} />
          </td>
        </tr>
      )}
    </>
  )
}

type HistoryState =
  | { status: 'loading' }
  | { status: 'ready'; rows: VoteRow[] }
  | { status: 'error'; message: string }

/** 펼친 행의 본문 — 티커별 이력을 불러와 히트맵으로. 이력 조회가 실패해도 현재 날짜 한 열은 그린다. */
function HistoryPanel({ row, selectedDate }: { row: VoteRow; selectedDate: string }) {
  const [state, setState] = useState<HistoryState>({ status: 'loading' })

  useEffect(() => {
    let alive = true
    setState({ status: 'loading' })
    fetchVotesByTicker(row.ticker)
      .then((rows) => {
        if (alive) setState({ status: 'ready', rows })
      })
      .catch((e: Error) => {
        if (alive) setState({ status: 'error', message: e.message })
      })
    return () => {
      alive = false
    }
  }, [row.ticker])

  if (state.status === 'loading') return <Skeleton className="h-40 w-full" />

  const rows = state.status === 'ready' && state.rows.length > 0 ? state.rows : [row]

  return (
    <div className="flex flex-col gap-2">
      {state.status === 'error' && (
        <p className="text-[0.6875rem] text-muted-foreground">
          이력을 불러오지 못해 선택한 날짜만 표시합니다. ({state.message})
        </p>
      )}
      <VoteHistory rows={rows} selectedDate={selectedDate} />
    </div>
  )
}

function Notice({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/50 px-4 py-10 text-center text-xs text-muted-foreground">
      {message}
    </div>
  )
}
