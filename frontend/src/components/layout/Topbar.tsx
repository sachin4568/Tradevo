import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, User, LogOut, Moon, Sun, Shield, FileCheck, UserCog } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export default function Topbar() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('tradevo-theme')
    if (saved) return saved === 'dark'
    return true
  })
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) { root.classList.remove('light'); root.classList.add('dark') }
    else { root.classList.remove('dark'); root.classList.add('light') }
    localStorage.setItem('tradevo-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const initials = user ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : ''

  function handleSignOut() { setDropdownOpen(false); logout(); navigate('/login', { replace: true }) }

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-surface-1 px-5">
      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-input px-3 py-1.5 text-tx-muted transition-colors focus-within:border-accent/40 focus-within:text-tx-secondary">
        <Search className="h-3.5 w-3.5" />
        <input type="text" placeholder="Search companies, research..." className="w-[300px] bg-transparent text-[13px] outline-none placeholder:text-tx-muted" />
      </div>

      {/* Right: Theme + Notifications + Avatar */}
      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="relative flex h-8 items-center rounded-full p-0.5 transition-colors hover:bg-surface-2"
          title={darkMode ? 'Light mode' : 'Dark mode'}
        >
          <div className={`flex h-6 w-10 items-center rounded-full p-0.5 transition-colors duration-200 ${darkMode ? 'bg-accent/20 justify-end' : 'bg-tx-muted/30 justify-start'}`}>
            <div className={`flex h-5 w-5 items-center justify-center rounded-full transition-all duration-200 ${darkMode ? 'bg-accent shadow-lg shadow-accent/30' : 'bg-tx-muted'}`}>
              {darkMode ? <Moon className="h-3 w-3 text-white" /> : <Sun className="h-3 w-3 text-white" />}
            </div>
          </div>
        </button>

        {/* Notifications */}
        <button onClick={() => navigate('/notifications')} className="relative flex h-8 w-8 items-center justify-center rounded-lg text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* User Avatar Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex h-8 items-center rounded-lg px-0.5 transition-colors hover:bg-surface-2">
            <div className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
              {initials || <User className="h-3 w-3 text-accent" />}
            </div>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-border bg-surface-1 py-1 shadow-xl">
              <div className="border-b border-border px-3 py-2.5">
                <p className="truncate text-[13px] font-medium text-tx-primary">{user?.name}</p>
                <p className="truncate text-[11.5px] text-tx-muted">{user?.email}</p>
              </div>

              <button onClick={() => { setDropdownOpen(false); navigate('/profile') }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
                <User className="h-4 w-4" /> My Profile
              </button>
              <button onClick={() => { setDropdownOpen(false); navigate('/profile') }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
                <UserCog className="h-4 w-4" /> Account
              </button>
              <button onClick={() => { setDropdownOpen(false); navigate('/settings') }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
                <FileCheck className="h-4 w-4" /> KYC
              </button>
              <button onClick={() => { setDropdownOpen(false); navigate('/settings') }} className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
                <Shield className="h-4 w-4" /> Security
              </button>

              <div className="border-t border-border" />
              <button onClick={handleSignOut} className="flex w-full items-center gap-2.5 px-3 py-2 text-[12.5px] text-tx-danger transition-colors hover:bg-tx-danger/5">
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}