import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

const authPaths = ['/login', '/register']

export default function AppShell() {
  const location = useLocation()
  if (authPaths.includes(location.pathname)) {
    return <Outlet />
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-0">
      {/* Skip navigation link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-surface-0 focus:outline-none"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6"
          role="main"
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}