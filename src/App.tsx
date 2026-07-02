import { Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Dashboard from './pages/Dashboard'
import Market from './pages/Market'
import CompanyDetails from './pages/CompanyDetails'
import Portfolio from './pages/Portfolio'
import Transactions from './pages/Transactions'
import Watchlist from './pages/Watchlist'
import Learning from './pages/Learning'
import Research from './pages/Research'
import DeepResearch from './pages/DeepResearch'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/market" element={<Market />} />
        <Route path="/market/:companyId" element={<CompanyDetails />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/portfolio/transactions" element={<Transactions />} />
        <Route path="/watchlist" element={<Watchlist />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/research" element={<Research />} />
        <Route path="/research/:reportId" element={<DeepResearch />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App