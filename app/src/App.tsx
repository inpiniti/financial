// 앱 레이아웃 — 상단 헤더([뒤로가기] · 타이틀 · 다크모드 토글) + <Outlet/>.
// 라우트 정의는 main.tsx에 있다 (이 컴포넌트는 각 라우트가 공유하는 뼈대만 담당).
// 네비게이션은 단일 라우트 `/` 안에서 URL 쿼리(view 등)로 전환되므로,
// 뒤로가기는 useNavigate가 아니라 goBack(searchParams)로 쿼리를 계산해 처리한다.

import { ArrowLeft02FreeIcons, Moon02FreeIcons, Sun03FreeIcons } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Outlet, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/button'
import { useTitle } from '@/components/title-context'
import { useTheme } from '@/hooks/use-theme'
import { goBack, viewOf } from '@/lib/nav'

function App() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [searchParams, setSearchParams] = useSearchParams()
  const title = useTitle()
  const showBack = viewOf(searchParams) !== 'main'

  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-4">
          {showBack && (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="뒤로가기"
              onClick={() => setSearchParams(goBack(searchParams))}
            >
              <HugeiconsIcon icon={ArrowLeft02FreeIcons} />
            </Button>
          )}
          <span className="font-heading text-sm font-semibold tracking-tight">{title}</span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <HugeiconsIcon icon={isDark ? Sun03FreeIcons : Moon02FreeIcons} />
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default App
