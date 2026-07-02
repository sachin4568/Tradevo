import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  function handleSignOut() {
    setDropdownOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

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

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-9 items-center gap-2 rounded-lg px-2.5 transition-colors hover:bg-surface-2"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-subtle">
              {initials ? (
                <span className="text-[11px] font-bold text-accent">
                  {initials}
                </span>
              ) : (
                <User className="h-3.5 w-3.5 text-accent" />
              )}
            </div>
            <span className="text-[13.5px] font-medium text-tx-secondary">
              {user?.name?.split(' ')[0] ?? 'User'}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-tx-muted" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-border bg-surface-1 py-1 shadow-xl">
              {/* User info header */}
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-tx-primary">
                  {user?.name}
                </p>
                <p className="truncate text-[12px] text-tx-muted">
                  {user?.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/profile')
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                onClick={() => {
                  setDropdownOpen(false)
                  navigate('/settings')
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>

              <div className="border-t border-border" />

              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-tx-danger transition-colors hover:bg-tx-danger/5"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}