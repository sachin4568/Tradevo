import { useNavigate } from 'react-router-dom'
import { Search, Bell, User } from 'lucide-react'

export default function Topbar() {
  const navigate = useNavigate()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-6">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-tx-muted transition-colors focus-within:border-accent/40 focus-within:text-tx-secondary">
        <Search className="h-4 w-4" />
        <input
          type="text"
          placeholder="Search companies, research, or features..."
          className="w-[360px] bg-transparent text-[13.5px] outline-none placeholder:text-tx-muted"
        />
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigate('/notifications')}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
        >
          <Bell className="h-[18px] w-[18px]" />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 transition-colors hover:bg-surface-2"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-subtle">
            <User className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-[13.5px] font-medium text-tx-secondary">
            Profile
          </span>
        </button>
      </div>
    </header>
  )
}