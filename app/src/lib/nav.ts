// 순수 네비게이션 헬퍼
// Dashboard.tsx 내부에 있던 goBack 로직을 URL 쿼리만 입력받는 순수 함수로 추출했다.
// (Dashboard.tsx는 이번 단계에서 아직 이 모듈을 사용하지 않는다 — 다음 단계에서 교체)

export type ReportView = 'main' | 'guru-detail' | 'ticker-detail' | 'report-detail' | 'book-detail'

export function viewOf(params: URLSearchParams): ReportView {
  return (params.get('view') as ReportView | null) || 'main'
}

// 뒤로가기 대상 규칙:
// - report-detail → ticker-detail (date·doc 비움)
// - ticker-detail → (guru 있으면 guru-detail(ticker 비움), 없으면 main(ticker 비움))
// - guru-detail   → main (guru 비움)
// - book-detail   → guru-detail (book 비움)
// 그 외(main 등)는 변경 없이 그대로 반환한다.
export function goBack(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params)
  const view = viewOf(params)

  if (view === 'report-detail') {
    next.set('view', 'ticker-detail')
    next.delete('date')
    next.delete('doc')
  } else if (view === 'ticker-detail') {
    if (next.get('guru')) {
      next.set('view', 'guru-detail')
    } else {
      next.set('view', 'main')
    }
    next.delete('ticker')
  } else if (view === 'guru-detail') {
    next.set('view', 'main')
    next.delete('guru')
  } else if (view === 'book-detail') {
    next.set('view', 'guru-detail')
    next.delete('book')
  }

  return next
}
