// 종목 1개의 일자별 표결 히트맵 — 행 = 종합 + 13인 거장, 열 = 표결이 있었던 날짜.
//
// 형태 선택: 데이터가 "13명의 범주형 판정이 날짜에 따라 어떻게 바뀌었나"이므로 날짜별
// 득표수 막대(스택)보다 거장×날짜 히트맵이 낫다. 막대는 "몇 명이 매수였나"까지만 보이고
// "누가 마음을 바꿨나"가 사라지는데, 히트맵은 한 행을 가로로 읽으면 거장별 변화가,
// 한 열을 세로로 읽으면 그날의 분포가 그대로 보인다. 종합(g0) 행을 맨 위에 두고
// 구분선으로 떼어 "결론 → 근거" 순서로 읽히게 했다.
//
// 색: 매수·매도는 --verdict-buy/--verdict-sell, 보유·관망은 뉴트럴 두 단계(tally-bar와 동일).
// 색만으로 구분하지 않도록 범례에 점 마커 + 글자를 병기하고, 셀마다 aria-label과 hover
// 툴팁(날짜·거장·판정)을 붙인다. 현재 선택된 날짜 열은 테두리로 강조한다.

import { useState } from 'react'

import type { Verdict } from '@/lib/meta'
import type { VoteRow } from '@/lib/votes'
import { cn } from '@/lib/utils'

export interface VoteHistoryProps {
  rows: VoteRow[]
  /** 강조할 날짜(간단 분석 탭에서 고른 날짜) */
  selectedDate?: string
  className?: string
}

const ORDER: Verdict[] = ['매수', '보유', '관망', '매도']

const CELL_CLASS: Record<Verdict, string> = {
  매수: 'bg-verdict-buy',
  보유: 'bg-muted-foreground',
  관망: 'bg-muted-foreground/40',
  매도: 'bg-verdict-sell',
}

const EMPTY_CELL = 'border border-dashed border-muted-foreground/50 bg-transparent'

/** 'YYYY-MM-DD' → 'M/D' (열 머리글용 짧은 표기) */
const shortDate = (key: string) => {
  const [, m, d] = key.split('-')
  return `${Number(m)}/${Number(d)}`
}

interface Tip {
  date: string
  who: string
  verdict: Verdict | null
  x: number
  y: number
}

export function VoteHistory({ rows, selectedDate, className }: VoteHistoryProps) {
  const [tip, setTip] = useState<Tip | null>(null)

  if (rows.length === 0) return null

  // 행 정의: 종합 1줄 + 거장 13줄. 거장 순서는 g1~g13 컬럼 순서(첫 행의 votes 배열)를 따른다.
  const gurus = rows[0].votes.map((v) => ({ key: v.screenerKey, name: v.name }))
  const lines: { key: string; name: string; pick: (r: VoteRow) => Verdict | null }[] = [
    { key: '__overall', name: '종합', pick: (r) => r.overall },
    ...gurus.map((g, i) => ({ key: g.key, name: g.name, pick: (r: VoteRow) => r.votes[i]?.verdict ?? null })),
  ]

  const show = (e: React.MouseEvent<HTMLElement>, date: string, who: string, verdict: Verdict | null) => {
    const host = e.currentTarget.closest('[data-heatmap]') as HTMLElement | null
    const hb = host?.getBoundingClientRect()
    const cb = e.currentTarget.getBoundingClientRect()
    setTip({
      date,
      who,
      verdict,
      x: cb.left + cb.width / 2 - (hb?.left ?? 0) + (host?.scrollLeft ?? 0),
      y: cb.top - (hb?.top ?? 0) + (host?.scrollTop ?? 0),
    })
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[0.6875rem] font-semibold text-foreground">일자별 표결 추이</span>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5" aria-hidden="true">
          {ORDER.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground">
              <span className={cn('inline-block size-2 rounded-[3px]', CELL_CLASS[v])} />
              {v}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 text-[0.625rem] text-muted-foreground">
            <span className={cn('inline-block size-2 rounded-[3px]', EMPTY_CELL)} />
            미판정
          </span>
        </div>
      </div>

      <div data-heatmap className="relative overflow-x-auto" onMouseLeave={() => setTip(null)}>
        <table
          role="img"
          aria-label={`${rows[0].name} 일자별 표결 히트맵`}
          className="border-separate border-spacing-0 text-[0.625rem]"
        >
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-muted/20 pr-2 text-left font-normal text-muted-foreground"></th>
              {rows.map((r) => (
                <th
                  key={r.date}
                  scope="col"
                  className={cn(
                    'min-w-7 px-0.5 pb-1 text-center font-mono font-normal tabular-nums',
                    r.date === selectedDate ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                  title={r.date}
                >
                  {shortDate(r.date)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, li) => (
              <tr key={line.key}>
                <th
                  scope="row"
                  className={cn(
                    'sticky left-0 z-10 whitespace-nowrap bg-muted/20 pr-2 text-left font-normal text-muted-foreground',
                    li === 0 && 'font-semibold text-foreground',
                    li === 1 && 'pt-1.5',
                  )}
                >
                  {line.name}
                </th>
                {rows.map((r) => {
                  const verdict = line.pick(r)
                  const isSel = r.date === selectedDate
                  return (
                    <td key={r.date} className={cn('p-0.5', li === 1 && 'pt-2')}>
                      <div
                        aria-label={`${r.date} ${line.name}: ${verdict ?? '미판정'}`}
                        onMouseEnter={(e) => show(e, r.date, line.name, verdict)}
                        className={cn(
                          'h-4 w-full min-w-6 rounded-[3px] transition-opacity hover:opacity-80',
                          verdict ? CELL_CLASS[verdict] : EMPTY_CELL,
                          isSel && 'ring-2 ring-foreground/70 ring-offset-1 ring-offset-background',
                        )}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {tip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-[0.6875rem] text-popover-foreground shadow-md"
            style={{ left: tip.x, top: tip.y - 4 }}
          >
            <span className="font-mono text-muted-foreground">{tip.date}</span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span>{tip.who}</span>
            <span className="mx-1.5 text-muted-foreground/50">·</span>
            <span className="font-semibold">{tip.verdict ?? '미판정'}</span>
          </div>
        )}
      </div>
    </div>
  )
}
