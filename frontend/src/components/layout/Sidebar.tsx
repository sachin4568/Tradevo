import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, TrendingUp, PieChart, GraduationCap,
  FileSearch, Bell, Settings, type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
  badge?: number
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Market', path: '/market', icon: TrendingUp },
  { label: 'Portfolio', path: '/portfolio', icon: PieChart },
  { label: 'Research', path: '/research', icon: FileSearch },
  { label: 'Learning', path: '/learning', icon: GraduationCap },
  { label: 'Notifications', path: '/notifications', icon: Bell, badge: 7 },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0] || 'User'
  const initials = user
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'U'

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-surface-1">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle">
          <TrendingUp className="h-4.5 w-4.5 text-accent" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-tx-primary">Tradevo</span>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3" aria-label="Primary navigation">
        <ul className="space-y-0.5" role="list">
          {primaryNav.map(item => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === '/dashboard'}
                className={({ isActive }) =>
                  `flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                    isActive ? 'bg-accent-subtle text-accent' : 'text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className="h-[17px] w-[17px] shrink-0" />
                  {item.label}
                </div>
                {item.badge != null && item.badge > 0 && (
                  <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom: Settings + User Profile (no duplicate settings icon) */}
      <div className="border-t border-border px-2.5 py-2.5 space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              isActive ? 'bg-accent-subtle text-accent' : 'text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
            }`
          }
        >
          <Settings className="h-[17px] w-[17px] shrink-0" />
          Settings
        </NavLink>

        {/* User profile — clickable, no settings icon */}
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-surface-2"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-tx-primary">{firstName}</p>
            <p className="text-[10.5px] text-tx-muted">Investor</p>
          </div>
        </button>
      </div>
    </aside>
  )
}