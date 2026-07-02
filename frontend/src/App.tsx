import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import AppShell from './components/layout/AppShell'
import ProtectedRoute from './components/auth/ProtectedRoute'
import ErrorBoundary from './components/error/ErrorBoundary'
import Login from './pages/Login'
import Register from './pages/Register'
import { useAuth } from './hooks/useAuth'

// ─── Lazy-loaded pages ───
// Core navigation pages are loaded eagerly (Dashboard, Market, Portfolio, Learning).
// Secondary pages are lazy-loaded to reduce initial bundle size.

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Market = lazy(() => import('./pages/Market'))
const CompanyDetails = lazy(() => import('./pages/CompanyDetails'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Watchlist = lazy(() => import('./pages/Watchlist'))
const Learning = lazy(() => import('./pages/Learning'))
const ModuleDetails = lazy(() => import('./pages/ModuleDetails'))
const LessonView = lazy(() => import('./pages/LessonView'))
const Research = lazy(() => import('./pages/Research'))
const DeepResearch = lazy(() => import('./pages/DeepResearch'))
const Notifications = lazy(() => import('./pages/Notifications'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))

/** Minimal loading fallback for Suspense boundaries */
function PageLoader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
    </div>
  )
}

function AuthRedirect() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (!isAuthenticated) {
      ;(window as any).__loginRedirect = location.pathname + location.search
    }
  }, [isAuthenticated, location])

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  return <Navigate to="/login" replace />
}

function App() {
  return (
    <ErrorBoundary section="application">
      <Suspense fallback={<PageLoader />}>
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<AuthRedirect />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/market" element={<Market />} />
            <Route path="/market/:companyId" element={<CompanyDetails />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/transactions" element={<Transactions />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/learning" element={<Learning />} />
            <Route path="/learning/:moduleId" element={<ModuleDetails />} />
            <Route path="/learning/:moduleId/:lessonId" element={<LessonView />} />
            <Route path="/research" element={<Research />} />
            <Route path="/research/:companyId" element={<DeepResearch />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App