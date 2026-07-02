import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  GraduationCap,
  FileSearch,
  Settings,
  type LucideIcon,
} from 'lucide-react'

interface NavItem {
  label: string
  path: string
  icon: LucideIcon
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Market', path: '/market', icon: TrendingUp },
  { label: 'Portfolio', path: '/portfolio', icon: PieChart },
  { label: 'Learning', path: '/learning', icon: GraduationCap },
  { label: 'Research', path: '/research', icon: FileSearch },
]

export default function Sidebar() {
  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-surface-1">
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle">
          <TrendingUp className="h-4.5 w-4.5 text-accent" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-tx-primary">
          Tradevo
        </span>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {primaryNav.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
                }`
              }
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom: Settings */}
      <div className="border-t border-border px-3 py-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors ${
              isActive
                ? 'bg-accent-subtle text-accent'
                : 'text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
            }`
          }
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}