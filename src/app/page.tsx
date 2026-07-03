'use client'

import { TradevoShell } from '@/components/tradevo/tradevo-shell'
import { useTradevoStore } from '@/store/tradevo-store'
import DashboardPage from '@/components/tradevo/pages/dashboard'
import PortfolioPage from '@/components/tradevo/pages/portfolio'
import { MarketPage } from '@/components/tradevo/pages/market'
import { CompanyDetailPage } from '@/components/tradevo/pages/company-detail'
import { ResearchPage } from '@/components/tradevo/pages/research'
import { LearningPage } from '@/components/tradevo/pages/learning'
import { NotificationsPage } from '@/components/tradevo/pages/notifications'
import { ProfilePage } from '@/components/tradevo/pages/profile'

export default function Home() {
  const { currentPage } = useTradevoStore()

  const getPage = () => {
    switch (currentPage) {
      case 'portfolio':
        return <PortfolioPage />
      case 'market':
        return <MarketPage />
      case 'company':
        return <CompanyDetailPage />
      case 'research':
        return <ResearchPage />
      case 'learning':
        return <LearningPage />
      case 'notifications':
        return <NotificationsPage />
      case 'profile':
      case 'settings':
        return <ProfilePage />
      case 'dashboard':
      default:
        return <DashboardPage />
    }
  }

  return <TradevoShell>{getPage()}</TradevoShell>
}