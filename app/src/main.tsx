import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router'
import './index.css'
import App from './App.tsx'
import Dashboard from './pages/Dashboard.tsx'
import { TitleProvider } from './components/title-context.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <TitleProvider>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Dashboard />} />
          </Route>
        </Routes>
      </TitleProvider>
    </BrowserRouter>
  </StrictMode>,
)
