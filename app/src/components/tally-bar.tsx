// 표결 분포 스택 미니바 — 최종보고서 헤더의 표결(매수·보유·매도·관망 득표수)을 한눈에 보여준다.
//
// 색: 매수·매도는 verdict-badge와 같은 색 계열(--verdict-buy/--verdict-sell)로 통일하고,
// 보유·관망은 뉴트럴 팔레트 내 두 단계 명도로 구분한다(진하기=중립 성향의 강도).
// 항상 고정된 순서(매수→보유→관망→매도, 강세→약세 스펙트럼)로 그려 카드마다 다시 훑지
// 않아도 되게 하고, 색만으로 구분하지 않도록 범례에 점 마커 + 텍스트 라벨을 항상 병기한다.
// 득표 0인 항목은 바·범례 모두에서 생략한다(빈 구간을 그리지 않음).

import type { Tally, Verdict } from '@/lib/meta'
import { cn } from '@/lib/utils'

export interface TallyBarProps {
  tally: Tally
  className?: string
}

const ORDER: Verdict[] = ['매수', '보유', '관망', '매도']

const SEGMENT_CLASS: Record<Verdict, string> = {
  매수: 'bg-verdict-buy',
  보유: 'bg-muted-foreground',
  관망: 'bg-muted-foreground/40',
  매도: 'bg-verdict-sell',
}

const LABEL_CLASS: Record<Verdict, string> = {
  매수: 'text-verdict-buy',
  보유: 'text-foreground',
  관망: 'text-muted-foreground',
  매도: 'text-verdict-sell',
}

export function TallyBar({ tally, className }: TallyBarProps) {
  const entries = ORDER.filter((v) => (tally[v] ?? 0) > 0)
  const total = entries.reduce((sum, v) => sum + tally[v], 0)

  if (total === 0) return null

  const summary = entries.map((v) => `${v} ${tally[v]}표`).join(', ')

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div
        role="img"
        aria-label={`표결 분포: ${summary}`}
        className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-muted"
      >
        {entries.map((v) => (
          <div
            key={v}
            className={SEGMENT_CLASS[v]}
            style={{ width: `${(tally[v] / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5" aria-hidden="true">
        {entries.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 text-[0.625rem]">
            <span className={cn('inline-block size-1.5 shrink-0 rounded-full', SEGMENT_CLASS[v])} />
            <span className={LABEL_CLASS[v]}>
              {v}
              {tally[v]}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
