import {
  Bell,
  TrendingUp,
  Sparkles,
  Newspaper,
  GraduationCap,
  CheckCheck,
} from 'lucide-react'

const categories = [
  { key: 'all', label: 'All', icon: Bell },
  { key: 'market', label: 'Market', icon: TrendingUp },
  { key: 'ai', label: 'AI Alerts', icon: Sparkles },
  { key: 'company', label: 'Company', icon: Newspaper },
  { key: 'learning', label: 'Learning', icon: GraduationCap },
] as const

export default function Notifications() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-tx-primary">
            Notifications
          </h1>
          <p className="mt-0.5 text-[13px] text-tx-muted">
            Alerts, reminders, and updates
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-[13px] font-medium text-accent transition-colors hover:text-accent-hover">
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat, i) => (
          <button
            key={cat.key}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              i === 0
                ? 'bg-accent-subtle text-accent'
                : 'border border-border-subtle text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
            }`}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-20">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
          <Bell className="h-6 w-6 text-tx-muted" />
        </div>
        <h3 className="mb-1 text-[14px] font-medium text-tx-primary">
          No notifications
        </h3>
        <p className="max-w-xs text-center text-[13px] text-tx-muted">
          Smart alerts and updates will appear here based on your portfolio,
          watchlist, and market activity.
        </p>
      </div>
    </div>
  )
}