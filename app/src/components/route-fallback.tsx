// React.lazy 페이지 전환 중 표시하는 자리표시자. 빈 화면 대신 스켈레톤으로 레이아웃을 잡아둔다
// (토스 디자인: 도허티 임계 — 0.4초 내 피드백, 스피너 단독 금지).

import { Skeleton } from '@/components/ui/skeleton'

export function RouteFallback() {
  return (
    <div className="flex flex-col gap-3 py-2">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}
