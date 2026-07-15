// 앱 레이아웃 — 상단 헤더(앱 타이틀 · 서재 링크 · 다크모드 토글) + <Outlet/>.
// 라우트 정의는 main.tsx에 있다 (이 컴포넌트는 각 라우트가 공유하는 뼈대만 담당).

import {
  Bookshelf01FreeIcons,
  FilterFreeIcons,
  Moon02FreeIcons,
  Sun03FreeIcons,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link, Outlet } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/hooks/use-theme'

function App() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-4">
          <Link to="/" className="font-heading text-sm font-semibold tracking-tight">
            투자 보고서
          </Link>
          <nav className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <HugeiconsIcon icon={Bookshelf01FreeIcons} data-icon="inline-start" />
                대시보드
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/screener">
                <HugeiconsIcon icon={FilterFreeIcons} data-icon="inline-start" />
                종목 찾기
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/books">
                <HugeiconsIcon icon={Bookshelf01FreeIcons} data-icon="inline-start" />
                서재
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={toggleTheme}
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              <HugeiconsIcon icon={isDark ? Sun03FreeIcons : Moon02FreeIcons} />
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default App
