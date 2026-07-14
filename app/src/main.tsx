import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import App from './App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import { RouteFallback } from './components/route-fallback.tsx'

const ReportPage = lazy(() => import('./pages/ReportPage.tsx'))
const BooksPage = lazy(() => import('./pages/BooksPage.tsx'))
const ScreenerPage = lazy(() => import('./pages/ScreenerPage.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Dashboard />} />
          <Route
            path="r/:date/:ticker"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ReportPage />
              </Suspense>
            }
          />
          <Route
            path="books"
            element={
              <Suspense fallback={<RouteFallback />}>
                <BooksPage />
              </Suspense>
            }
          />
          <Route
            path="screener"
            element={
              <Suspense fallback={<RouteFallback />}>
                <ScreenerPage />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
