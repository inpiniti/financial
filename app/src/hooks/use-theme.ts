// 다크모드 토글 훅 — shadcn 표준 방식(document.documentElement에 `dark` 클래스 토글 + localStorage 저장).
// index.html의 인라인 스크립트가 첫 페인트 전에 클래스를 이미 반영해두므로, 여기서는 그 상태를
// 초기값으로 읽어와 이후 토글만 담당한다 (FOUC 없음).

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof document === 'undefined') return 'light'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggleTheme }
}
