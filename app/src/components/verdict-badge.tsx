// 투자의견 배지 — 거장 개별 의견(매수·보유·매도·관망 + 확신도)과 최종 종합의견 모두에 재사용.
//
// 톤: 매수=긍정(붉은 계열, 국내 증시 상승 관례), 매도=부정(초록 계열, 하락 관례),
// 보유·관망=중립(뉴트럴 팔레트 그대로). 색은 index.css의 --verdict-* 토큰만 사용한다
// (dataviz 스킬로 라이트/다크 각각 카테고리컬 CVD 검증 완료 — src/index.css 주석 참조).
//
// verdict가 null이면(파싱 실패 등) 아무것도 렌더링하지 않는다 — 호출부는 null 체크 없이
// 항상 마운트만 하면 된다.

import type { Verdict } from '@/lib/meta'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface VerdictBadgeProps {
  verdict: Verdict | null
  /** 확신도(1~10). 있으면 "관망 8"처럼 의견 뒤에 병기한다. */
  confidence?: number | null
  className?: string
}

type Tone = 'buy' | 'sell' | 'neutral'

const TONE_BY_VERDICT: Record<Verdict, Tone> = {
  매수: 'buy',
  매도: 'sell',
  보유: 'neutral',
  관망: 'neutral',
}

const TONE_CLASS: Record<Tone, string> = {
  buy: 'border-transparent bg-verdict-buy-bg text-verdict-buy',
  sell: 'border-transparent bg-verdict-sell-bg text-verdict-sell',
  neutral: 'border-border bg-input/20 text-foreground dark:bg-input/30',
}

export function VerdictBadge({ verdict, confidence, className }: VerdictBadgeProps) {
  if (!verdict) return null

  const label = confidence != null ? `${verdict} ${confidence}` : verdict

  return (
    <Badge variant="outline" className={cn(TONE_CLASS[TONE_BY_VERDICT[verdict]], className)}>
      {label}
    </Badge>
  )
}
