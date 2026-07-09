'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  PieChart,
  FileText,
  GraduationCap,
  Bell,
  Settings,
  Search,
  Sparkles,
  Menu,
  Plus,
  Minus,
  Send,
  TrendingDown,
  Brain,
  Shield,
  BarChart3,
  ChevronRight,
  Building2,
  BookOpen,
  Briefcase,
  Zap,
  ChevronDown,
  Wallet,
} from 'lucide-react'
import { useTradevoStore, type TradevoPage, type TradeCompany } from '@/store/tradevo-store'
import { cn } from '@/lib/utils'
import { formatINR, formatINRDecimal, formatPrice, calculateBrokerage } from '@/lib/format'
import { mockCompanies, mockResearchReports, mockLearningModules, mockUser } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Command as CommandPrimitive } from 'cmdk'
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'

/* ───────────────────────────── Types ───────────────────────────── */

interface NavItem {
  page: TradevoPage
  label: string
  icon: React.ElementType
  badge?: number
}

/* ───────────────────────────── Constants ───────────────────────────── */

const NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'market', label: 'Market', icon: TrendingUp },
  { page: 'portfolio', label: 'Portfolio', icon: PieChart },
  { page: 'research', label: 'Research', icon: FileText },
  { page: 'learning', label: 'Learning', icon: GraduationCap },
]

const MOBILE_NAV_ITEMS: NavItem[] = [
  { page: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { page: 'market', label: 'Market', icon: TrendingUp },
  { page: 'portfolio', label: 'Portfolio', icon: PieChart },
  { page: 'research', label: 'Research', icon: FileText },
]

const SPOTLIGHT_DATA = {
  companies: mockCompanies.map(c => ({
    name: c.name,
    ticker: c.ticker,
    sector: c.sector,
    id: c.id,
  })),
  research: mockResearchReports.map(r => `${r.companyName}: ${r.verdict}`),
  lessons: mockLearningModules.map(m => m.title),
  portfolio: [
    'View Holdings',
    'Performance Summary',
    'Rebalance Portfolio',
  ],
  actions: [
    'New Trade',
    'Set Price Alert',
    'Export Data',
  ],
}

/* ───────────────────────────── Sidebar Nav Item ───────────────────────────── */

function SidebarNavItem({
  item,
  active,
  onClick,
  notificationCount,
}: {
  item: NavItem
  active: boolean
  onClick: () => void
  notificationCount?: number
}) {
  const Icon = item.icon
  const count = item.page === 'notifications' ? notificationCount : item.badge

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 w-full',
        active
          ? 'bg-tv-cyan-muted text-tv-cyan border-l-2 border-tv-cyan'
          : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-2 border-l-2 border-transparent'
      )}
    >
      <Icon className="size-[18px] shrink-0" />
      <span>{item.label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-tv-coral text-[10px] font-bold text-white px-1.5">
          {count}
        </span>
      )}
    </button>
  )
}

/* ───────────────────────────── Desktop Sidebar ───────────────────────────── */

function DesktopSidebar() {
  const { currentPage, navigate, notificationCount, setAiPanelOpen } =
    useTradevoStore()

  return (
    <aside className="hidden lg:flex w-[260px] flex-col border-r border-border-subtle bg-surface-0 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 h-14 border-b border-border-subtle shrink-0">
        <span className="text-tv-cyan text-xl font-bold">◆</span>
        <span className="text-text-primary text-lg font-semibold tracking-tight">
          Tradevo
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.page}
            item={item}
            active={currentPage === item.page}
            onClick={() => navigate(item.page)}
            notificationCount={notificationCount}
          />
        ))}

        {/* Notifications */}
        <SidebarNavItem
          item={{ page: 'notifications', label: 'Notifications', icon: Bell }}
          active={currentPage === 'notifications'}
          onClick={() => navigate('notifications')}
          notificationCount={notificationCount}
        />

        <Separator className="!my-3 !bg-border-subtle" />

        {/* Settings */}
        <SidebarNavItem
          item={{ page: 'settings', label: 'Settings', icon: Settings }}
          active={currentPage === 'settings'}
          onClick={() => navigate('settings')}
        />
      </nav>

      {/* Bottom section: User */}
      <div className="border-t border-border-subtle p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tv-cyan-muted text-tv-cyan text-sm font-semibold">
            {mockUser.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{mockUser.name}</p>
            <p className="text-xs text-text-tertiary">Investor</p>
          </div>
          <button
            onClick={() => navigate('settings')}
            className="text-text-tertiary hover:text-text-secondary transition-colors p-1 rounded-md hover:bg-surface-2"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

/* ───────────────────────────── Mobile Sidebar (Sheet) ───────────────────────────── */

function MobileSidebar() {
  const { sidebarOpen, setSidebarOpen, currentPage, navigate, notificationCount } =
    useTradevoStore()

  return (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-[280px] p-0 bg-surface-0 border-border-subtle">
        <SheetHeader className="border-b border-border-subtle h-14 flex-row items-center gap-2 px-5">
          <span className="text-tv-cyan text-xl font-bold">◆</span>
          <SheetTitle className="text-text-primary text-lg font-semibold tracking-tight">
            Tradevo
          </SheetTitle>
        </SheetHeader>
        <SheetDescription className="sr-only">Navigation menu</SheetDescription>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarNavItem
              key={item.page}
              item={item}
              active={currentPage === item.page}
              onClick={() => {
                navigate(item.page)
                setSidebarOpen(false)
              }}
              notificationCount={notificationCount}
            />
          ))}
          <SidebarNavItem
            item={{ page: 'notifications', label: 'Notifications', icon: Bell }}
            active={currentPage === 'notifications'}
            onClick={() => {
              navigate('notifications')
              setSidebarOpen(false)
            }}
            notificationCount={notificationCount}
          />
          <Separator className="!my-3 !bg-border-subtle" />
          <SidebarNavItem
            item={{ page: 'settings', label: 'Settings', icon: Settings }}
            active={currentPage === 'settings'}
            onClick={() => {
              navigate('settings')
              setSidebarOpen(false)
            }}
          />
        </nav>

        <div className="border-t border-border-subtle p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-tv-cyan-muted text-tv-cyan text-sm font-semibold">
              {mockUser.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{mockUser.name}</p>
              <p className="text-xs text-text-tertiary">Investor</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ───────────────────────────── Top Bar ───────────────────────────── */

function TopBar() {
  const { setSpotlightOpen, notificationCount, setAiPanelOpen } =
    useTradevoStore()

  return (
    <header className="h-14 border-b border-border-subtle bg-surface-0 flex items-center px-4 lg:px-6 gap-3 shrink-0">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-text-tertiary hover:text-text-secondary"
        onClick={() => useTradevoStore.getState().setSidebarOpen(true)}
      >
        <Menu className="size-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Search trigger */}
      <button
        onClick={() => setSpotlightOpen(true)}
        className="flex items-center gap-2 flex-1 max-w-md h-9 rounded-lg bg-surface-2 px-3 text-sm text-text-tertiary hover:bg-surface-3 transition-colors cursor-pointer"
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate hidden sm:inline">Search companies, research...</span>
        <span className="sm:hidden">Search...</span>
        <kbd className="ml-auto hidden sm:inline-flex items-center gap-0.5 rounded border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Notification bell */}
      <Button
        variant="ghost"
        size="icon"
        className="relative text-text-tertiary hover:text-text-secondary"
        onClick={() => useTradevoStore.getState().navigate('notifications')}
      >
        <Bell className="size-[18px]" />
        {notificationCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-tv-coral text-[9px] font-bold text-white px-1"
          >
            {notificationCount}
          </motion.span>
        )}
        <span className="sr-only">Notifications</span>
      </Button>

      {/* User avatar */}
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tv-cyan-muted text-tv-cyan text-xs font-semibold cursor-pointer hover:bg-tv-cyan/20 transition-colors">
        AM
      </div>
    </header>
  )
}

/* ───────────────────────────── Mobile Bottom Nav ───────────────────────────── */

function MobileBottomNav() {
  const { currentPage, navigate, setAiPanelOpen } = useTradevoStore()

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 h-16 bg-surface-0 border-t border-border-subtle z-50 flex items-center justify-around px-2">
      {MOBILE_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        const active = currentPage === item.page
        return (
          <button
            key={item.page}
            onClick={() => navigate(item.page)}
            className={cn(
              'flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors min-w-[56px]',
              active ? 'text-tv-cyan' : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            <Icon className="size-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        )
      })}

      {/* AI button in nav */}
      <button
        onClick={() => setAiPanelOpen(true)}
        className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors relative"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tv-cyan text-background glow-cyan-sm">
          <Sparkles className="size-4" />
        </div>
        <span className="text-[10px] font-medium text-tv-cyan">AI</span>
      </button>
    </nav>
  )
}

/* ───────────────────────────── Spotlight Search ───────────────────────────── */

function SpotlightSearch() {
  const { spotlightOpen, setSpotlightOpen, navigate, setAiPanelOpen, openTradeModal, setSelectedCompany } =
    useTradevoStore()

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSpotlightOpen(!spotlightOpen)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [spotlightOpen, setSpotlightOpen])

  const handleSelect = useCallback(
    (action: () => void) => {
      action()
      setSpotlightOpen(false)
    },
    [setSpotlightOpen]
  )

  return (
    <Dialog open={spotlightOpen} onOpenChange={setSpotlightOpen}>
      <DialogContent
        className="overflow-hidden p-0 max-w-2xl [&>button]:hidden"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Search</DialogTitle>
          <DialogDescription>Search companies, research, and more</DialogDescription>
        </DialogHeader>
        <Command className="[&_[cmdk-group-heading]]:text-text-tertiary [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-4 [&_[cmdk-input-wrapper]_svg]:w-4 [&_[cmdk-input]]:h-11 [&_[cmdk-item]]:px-3 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]]:rounded-lg [&_[cmdk-item]_svg]:h-4 [&_[cmdk-item]_svg]:w-4 bg-surface-0 [&_[cmdk-input]]:text-text-primary [&_[cmdk-input]]:placeholder:text-text-tertiary border-0 shadow-2xl">
          <div className="flex items-center border-b border-border-subtle px-3" data-slot="command-input-wrapper">
            <Search className="size-4 shrink-0 text-text-tertiary" />
            <CommandPrimitive.Input
              placeholder="Search companies, research, lessons..."
              className="flex h-11 w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-text-tertiary text-text-primary"
            />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border-subtle bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary">
              ESC
            </kbd>
          </div>
          <CommandList className="max-h-[360px]">
            <CommandEmpty className="py-8 text-center text-sm text-text-tertiary">
              No results found.
            </CommandEmpty>
            <CommandGroup heading="Companies">
              {SPOTLIGHT_DATA.companies.map((c) => (
                <CommandItem
                  key={c.ticker}
                  onSelect={() =>
                    handleSelect(() => {
                      setSelectedCompany(c.id)
                      navigate('company')
                    })
                  }
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Building2 className="size-4 text-text-tertiary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-text-primary">{c.name}</span>
                    <span className="ml-2 text-xs text-text-tertiary">{c.ticker}</span>
                  </div>
                  <span className="text-xs text-text-tertiary">{c.sector}</span>
                  <ChevronRight className="size-3 text-text-tertiary" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Research">
              {SPOTLIGHT_DATA.research.map((r) => (
                <CommandItem
                  key={r}
                  onSelect={() => handleSelect(() => navigate('research'))}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <FileText className="size-4 text-text-tertiary shrink-0" />
                  <span className="flex-1 text-sm">{r}</span>
                  <ChevronRight className="size-3 text-text-tertiary" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Lessons">
              {SPOTLIGHT_DATA.lessons.map((l) => (
                <CommandItem
                  key={l}
                  onSelect={() => handleSelect(() => navigate('learning'))}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <BookOpen className="size-4 text-text-tertiary shrink-0" />
                  <span className="flex-1 text-sm">{l}</span>
                  <ChevronRight className="size-3 text-text-tertiary" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Portfolio">
              {SPOTLIGHT_DATA.portfolio.map((p) => (
                <CommandItem
                  key={p}
                  onSelect={() => handleSelect(() => navigate('portfolio'))}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Briefcase className="size-4 text-text-tertiary shrink-0" />
                  <span className="flex-1 text-sm">{p}</span>
                  <ChevronRight className="size-3 text-text-tertiary" />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Actions">
              {SPOTLIGHT_DATA.actions.map((a) => (
                <CommandItem
                  key={a}
                  onSelect={() =>
                    handleSelect(() => {
                      if (a === 'New Trade') navigate('market')
                      else if (a === 'Set Price Alert') navigate('market')
                      else if (a === 'Export Data') navigate('portfolio')
                    })
                  }
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Zap className="size-4 text-text-tertiary shrink-0" />
                  <span className="flex-1 text-sm">{a}</span>
                  <ChevronRight className="size-3 text-text-tertiary" />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}

/* ───────────────────────────── AI Panel ───────────────────────────── */

const AI_INSIGHTS = [
  {
    icon: Brain,
    title: 'Portfolio Risk Assessment',
    text: 'Your portfolio beta is 1.24, suggesting moderate market correlation. Consider adding defensive positions.',
    accent: 'tv-cyan' as const,
  },
  {
    icon: TrendingUp,
    title: 'Sector Opportunity',
    text: 'Healthcare sector shows 12% undervaluation. Your exposure is only 5% — consider increasing allocation.',
    accent: 'tv-emerald' as const,
  },
  {
    icon: Shield,
    title: 'Risk Alert',
    text: 'Reliance position is 23% of portfolio. Consider reducing to below 15% for better diversification.',
    accent: 'tv-amber' as const,
  },
  {
    icon: BarChart3,
    title: 'Market Sentiment',
    text: 'Current market sentiment is bullish with 68% positive indicators. Momentum looks strong for Q1.',
    accent: 'tv-blue' as const,
  },
]

function AiPanel() {
  const { aiPanelOpen, setAiPanelOpen } = useTradevoStore()
  const [message, setMessage] = useState('')

  return (
    <Sheet open={aiPanelOpen} onOpenChange={setAiPanelOpen}>
      <SheetContent
        side="right"
        className="w-[400px] max-w-full p-0 bg-surface-0 border-border-subtle flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 h-14 border-b border-border-subtle shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tv-cyan-muted">
            <Sparkles className="size-4 text-tv-cyan" />
          </div>
          <div>
            <SheetTitle className="text-text-primary text-sm font-semibold">
              AI Assistant
            </SheetTitle>
            <SheetDescription className="text-text-tertiary text-xs">
              Powered by Tradevo AI
            </SheetDescription>
          </div>
        </div>

        {/* Chat body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
          {/* Welcome message */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-2"
          >
            <p className="text-sm text-text-primary leading-relaxed">
              Hello Arjun! I&apos;ve been analyzing your portfolio. Here are some thoughts
              that might help with your investment decisions today.
            </p>
          </motion.div>

          {/* AI insight cards */}
          {AI_INSIGHTS.map((insight, i) => {
            const Icon = insight.icon
            return (
              <motion.div
                key={insight.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="surface-card-static p-4 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg shrink-0',
                      insight.accent === 'tv-cyan' && 'bg-tv-cyan-muted',
                      insight.accent === 'tv-emerald' && 'bg-tv-emerald-muted',
                      insight.accent === 'tv-amber' && 'bg-tv-amber-muted',
                      insight.accent === 'tv-blue' && 'bg-tv-blue-muted'
                    )}
                  >
                    <Icon
                      className={cn(
                        'size-4',
                        insight.accent === 'tv-cyan' && 'text-tv-cyan',
                        insight.accent === 'tv-emerald' && 'text-tv-emerald',
                        insight.accent === 'tv-amber' && 'text-tv-amber',
                        insight.accent === 'tv-blue' && 'text-tv-blue'
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-text-primary">
                        {insight.title}
                      </span>
                      <span className="ai-badge">AI</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {insight.text}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-11">
                  <button
                    className={cn(
                      'text-xs font-medium px-3 py-1 rounded-md transition-colors',
                      insight.accent === 'tv-cyan' && 'bg-tv-cyan-muted text-tv-cyan hover:bg-tv-cyan/20',
                      insight.accent === 'tv-emerald' && 'bg-tv-emerald-muted text-tv-emerald hover:bg-tv-emerald/20',
                      insight.accent === 'tv-amber' && 'bg-tv-amber-muted text-tv-amber hover:bg-tv-amber/20',
                      insight.accent === 'tv-blue' && 'bg-tv-blue-muted text-tv-blue hover:bg-tv-blue/20'
                    )}
                  >
                    View Details
                  </button>
                  <button className="text-xs font-medium text-text-tertiary hover:text-text-secondary px-3 py-1 rounded-md hover:bg-surface-2 transition-colors">
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Input area */}
        <div className="border-t border-border-subtle p-4 shrink-0">
          <div className="flex items-center gap-2 rounded-lg bg-surface-2 border border-border-subtle px-3 py-1.5 focus-within:border-tv-cyan/40 transition-colors">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask about your portfolio..."
              className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-tertiary outline-none py-1"
            />
            <button
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md transition-all',
                message.trim()
                  ? 'bg-tv-cyan text-background hover:bg-tv-cyan/90'
                  : 'text-text-tertiary'
              )}
              disabled={!message.trim()}
            >
              <Send className="size-3.5" />
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ───────────────────────────── Trade Modal ───────────────────────────── */

function TradeModalInner({ company, initialType }: { company: TradeCompany; initialType: 'buy' | 'sell' }) {
  const { closeTradeModal } = useTradevoStore()
  const [localType, setLocalType] = useState<'buy' | 'sell'>(initialType)
  const [quantity, setQuantity] = useState(1)
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stoploss'>('market')
  const [limitPrice, setLimitPrice] = useState(company.price)
  const [stopPrice, setStopPrice] = useState(company.price)
  const [showCharges, setShowCharges] = useState(false)

  const isBuy = localType === 'buy'
  const changePercent = company.changePercent ?? 0
  const change = company.change ?? 0

  // Effective price based on order type
  const effectivePrice = orderType === 'market' ? company.price : orderType === 'limit' ? limitPrice : stopPrice

  // Brokerage calculation
  const charges = calculateBrokerage(localType, effectivePrice, quantity, orderType)

  // Mock available balance
  const availableBalance = 85000

  // Mock holding for sell (avg buy price)
  const mockHolding = {
    quantity: 50,
    avgPrice: company.price * 0.95,
  }
  const hasHolding = mockHolding.quantity > 0

  // Estimated P&L for sell
  const estimatedPnL = !isBuy && hasHolding
    ? (effectivePrice - mockHolding.avgPrice) * quantity
    : null

  return (
    <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-surface-0 border-border-subtle flex flex-col max-h-[90vh] sm:max-h-[85vh]">
        {/* Header — company info */}
        <div className="px-4 pt-4 pb-3 border-b border-border-subtle">
          <DialogTitle className="text-text-primary font-semibold text-sm">
            {company.name}{' '}
            <span className="text-text-tertiary font-normal">{company.ticker}</span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-3 mt-1.5">
            <span className="text-lg font-bold text-text-primary">
              {formatPrice(company.price)}
            </span>
            <span
              className={cn(
                'text-xs font-semibold px-1.5 py-0.5 rounded',
                changePercent >= 0
                  ? 'text-tv-emerald bg-tv-emerald-muted'
                  : 'text-tv-coral bg-tv-coral-muted'
              )}
            >
              {changePercent >= 0 ? '+' : ''}
              {formatPrice(Math.abs(change))}{' '}
              ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
            </span>
          </DialogDescription>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Buy / Sell tabs */}
          <Tabs value={localType} onValueChange={(v) => setLocalType(v as 'buy' | 'sell')}>
            <TabsList className="w-full h-10 bg-surface-2 rounded-lg p-1">
              <TabsTrigger
                value="buy"
                className={cn(
                  'flex-1 rounded-md text-sm font-semibold transition-all h-8',
                  'data-[state=active]:bg-emerald-600 data-[state=active]:text-white',
                  'data-[state=inactive]:text-text-tertiary hover:text-text-secondary'
                )}
              >
                BUY
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className={cn(
                  'flex-1 rounded-md text-sm font-semibold transition-all h-8',
                  'data-[state=active]:bg-red-600 data-[state=active]:text-white',
                  'data-[state=inactive]:text-text-tertiary hover:text-text-secondary'
                )}
              >
                SELL
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Order Type selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Order Type
            </label>
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as 'market' | 'limit' | 'stoploss')}>
              <TabsList className="w-full h-9 bg-surface-2 rounded-lg p-1">
                {(['market', 'limit', 'stoploss'] as const).map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className={cn(
                      'flex-1 rounded-md text-xs font-medium transition-all h-7',
                      'data-[state=active]:bg-surface-0 data-[state=active]:text-text-primary data-[state=active]:shadow-sm',
                      'data-[state=inactive]:text-text-tertiary'
                    )}
                  >
                    {t === 'market' ? 'Market' : t === 'limit' ? 'Limit' : 'Stop Loss'}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Limit / Stop Loss price input */}
          {(orderType === 'limit' || orderType === 'stoploss') && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
                {orderType === 'limit' ? 'Limit Price' : 'Trigger Price'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-tertiary font-medium">
                  ₹
                </span>
                <Input
                  type="number"
                  value={orderType === 'limit' ? limitPrice : stopPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    if (orderType === 'limit') setLimitPrice(val)
                    else setStopPrice(val)
                  }}
                  className="h-10 pl-7 text-sm font-semibold bg-surface-2 border-border-subtle text-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance:none [&::-webkit-inner-spin-button]:appearance:none"
                  step={0.05}
                />
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-2">
            <label className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">
              Quantity
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
              >
                <Minus className="size-4" />
              </button>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="h-10 flex-1 text-center text-base font-semibold bg-surface-2 border-border-subtle text-text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance:none [&::-webkit-inner-spin-button]:appearance:none"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors"
              >
                <Plus className="size-4" />
              </button>
            </div>
            {/* Quick quantity buttons */}
            <div className="flex gap-2">
              {[1, 5, 10, 25, 50, 100].map((q) => (
                <button
                  key={q}
                  onClick={() => setQuantity(q)}
                  className={cn(
                    'flex-1 h-7 rounded text-[11px] font-medium transition-colors',
                    quantity === q
                      ? 'bg-surface-3 text-text-primary border border-border-subtle'
                      : 'bg-surface-1 text-text-tertiary hover:text-text-secondary hover:bg-surface-2'
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Order value summary */}
          <div className="rounded-lg bg-surface-2 border border-border-subtle p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">{quantity} × {formatPrice(effectivePrice)}</span>
              <span className="text-sm font-bold text-text-primary">
                {formatINRDecimal(charges.orderValue)}
              </span>
            </div>
          </div>

          {/* Holdings info for sell */}
          {!isBuy && hasHolding && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-600 font-medium">Your Holdings</span>
                <span className="text-xs text-text-tertiary">{mockHolding.quantity} shares @ avg {formatPrice(mockHolding.avgPrice)}</span>
              </div>
              {estimatedPnL !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-tertiary">Est. P&L</span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      estimatedPnL >= 0 ? 'text-tv-emerald' : 'text-tv-coral'
                    )}
                  >
                    {estimatedPnL >= 0 ? '+' : ''}
                    {formatINRDecimal(estimatedPnL)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Estimated Charges (collapsible) */}
          <div className="rounded-lg border border-border-subtle overflow-hidden">
            <button
              onClick={() => setShowCharges(!showCharges)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors"
            >
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                Estimated Charges
              </span>
              <ChevronDown
                className={cn(
                  'size-4 text-text-tertiary transition-transform',
                  showCharges && 'rotate-180'
                )}
              />
            </button>
            {showCharges && (
              <div className="px-3 py-2.5 space-y-1.5 bg-surface-1">
                <ChargeRow label="Order Value" value={formatINRDecimal(charges.orderValue)} bold />
                <ChargeRow label="Brokerage" value={formatINRDecimal(charges.brokerage)} />
                <ChargeRow label="STT" value={formatINRDecimal(charges.stt)} />
                <ChargeRow label="Exchange Charges" value={formatINRDecimal(charges.exchangeCharges)} />
                <ChargeRow label="GST (18%)" value={formatINRDecimal(charges.gst)} />
                <ChargeRow label="SEBI Charges" value={formatINRDecimal(charges.sebiCharges)} />
                <ChargeRow label="Stamp Duty" value={formatINRDecimal(charges.stampDuty)} />
                <Separator className="my-1.5 bg-border-subtle" />
                <ChargeRow label="Total Charges" value={formatINRDecimal(charges.totalCharges)} bold highlight />
                <Separator className="my-1.5 bg-border-subtle" />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-xs font-bold text-text-primary">
                    {isBuy ? 'Net Debit' : 'Net Credit'}
                  </span>
                  <span
                    className={cn(
                      'text-sm font-bold',
                      isBuy ? 'text-text-primary' : 'text-tv-emerald'
                    )}
                  >
                    {formatINRDecimal(charges.netAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Available Balance */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <Wallet className="size-3.5" />
              <span className="text-xs">Available Balance</span>
            </div>
            <span className="text-sm font-semibold text-text-primary">
              {formatINR(availableBalance)}
            </span>
          </div>
        </div>

        {/* Sticky footer buttons */}
        <div className="border-t border-border-subtle px-4 py-3 flex gap-3 bg-surface-0 shrink-0">
          <Button
            variant="outline"
            className="flex-1 h-11 border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-2 text-sm"
            onClick={closeTradeModal}
          >
            Cancel
          </Button>
          <Button
            className={cn(
              'flex-1 h-11 font-semibold transition-all text-white text-sm',
              isBuy
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-red-600 hover:bg-red-700'
            )}
            onClick={closeTradeModal}
          >
            PLACE {isBuy ? 'BUY' : 'SELL'} ORDER
          </Button>
        </div>
      </DialogContent>
  )
}

/* ─── Small helper component for charges table ─── */

function ChargeRow({
  label,
  value,
  bold = false,
  highlight = false,
}: {
  label: string
  value: string
  bold?: boolean
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={cn(
          'text-xs',
          bold ? 'font-semibold text-text-primary' : 'text-text-tertiary'
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          'text-xs tabular-nums',
          bold && !highlight && 'font-semibold text-text-primary',
          highlight && 'font-bold text-amber-600'
        )}
      >
        {value}
      </span>
    </div>
  )
}

/* ───────────────────────────── Trade Modal Wrapper ───────────────────────────── */

function TradeModalWrapper() {
  const { tradeModalOpen, tradeModalCompany, closeTradeModal, tradeType } =
    useTradevoStore()

  if (!tradeModalOpen || !tradeModalCompany) return null

  return (
    <Dialog open={tradeModalOpen} onOpenChange={(open) => !open && closeTradeModal()}>
      <TradeModalInner
        key={tradeModalCompany.id + tradeType}
        company={tradeModalCompany}
        initialType={tradeType}
      />
    </Dialog>
  )
}

/* ───────────────────────────── Floating AI Button ───────────────────────────── */

function FloatingAiButton() {
  const { setAiPanelOpen } = useTradevoStore()

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setAiPanelOpen(true)}
      className="fixed bottom-20 lg:bottom-6 right-4 w-14 h-14 rounded-full bg-tv-cyan text-background flex items-center justify-center glow-cyan z-50 shadow-lg hover:shadow-tv-cyan/25 transition-shadow cursor-pointer"
      aria-label="Open AI Assistant"
    >
      <Sparkles className="size-5" />
    </motion.button>
  )
}

/* ───────────────────────────── Tradevo Shell ───────────────────────────── */

export function TradevoShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <DesktopSidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <TopBar />

        {/* Page content — scrollable */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4 lg:p-6 pb-20 lg:pb-6">
          {children}
        </div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />

      {/* Floating AI button */}
      <FloatingAiButton />

      {/* Spotlight search */}
      <SpotlightSearch />

      {/* AI Panel */}
      <AiPanel />

      {/* Trade Modal */}
      <TradeModalWrapper />
    </div>
  )
}