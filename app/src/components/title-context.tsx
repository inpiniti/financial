import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

// 헤더 타이틀 게시/구독 컨텍스트
// - TitleProvider: {title, setTitle} 상태를 보관한다.
// - useTitle(): 헤더가 현재 타이틀을 구독한다 (기본값 '투자 보고서').
// - useSetTitle(title): 각 뷰가 마운트/변경 시 타이틀을 게시한다.
//   언마운트 시 기본값으로 되돌릴 필요는 없다 — 다음 뷰가 마운트되며 덮어쓴다.

const DEFAULT_TITLE = '투자 보고서'

interface TitleContextValue {
  title: string
  setTitle: (title: string) => void
}

const TitleContext = createContext<TitleContextValue | undefined>(undefined)

export function TitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState(DEFAULT_TITLE)

  const value = useMemo(() => ({ title, setTitle }), [title])

  return <TitleContext.Provider value={value}>{children}</TitleContext.Provider>
}

function useTitleContext(): TitleContextValue {
  const ctx = useContext(TitleContext)
  if (!ctx) {
    throw new Error('useTitle/useSetTitle은 TitleProvider 내부에서만 사용할 수 있습니다.')
  }
  return ctx
}

// 헤더가 현재 타이틀을 구독할 때 사용한다.
export function useTitle(): string {
  return useTitleContext().title
}

// 각 뷰가 자신의 타이틀을 게시할 때 사용한다.
export function useSetTitle(title: string): void {
  const { setTitle } = useTitleContext()

  useEffect(() => {
    setTitle(title)
  }, [title, setTitle])
}
