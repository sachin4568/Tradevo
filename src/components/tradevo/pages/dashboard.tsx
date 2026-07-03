'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  GraduationCap,
  Activity,
  IndianRupee,
  CircleDot,
  AlertTriangle,
  Zap,
} from 'lucide-react'
import { useTradevoStore } from '@/store/tradevo-store'
import {
  mockUser,
  mockPortfolio,
  mockCompanies,
  mockPortfolioChart,
  mockSectorAllocation,
  mockAIBrief,
  mockLearningModules,
  mockAIInsights,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

/* ───────────────────────────── Helpers ───────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
}

function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatINRCompact(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}K`
  return `₹${value}`
}

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getGreetingSubtitle(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Here\'s what\'s moving in the markets today.'
  if (h < 17) return 'Mid-day market update and your portfolio status.'
  return 'Markets are closed. Here\'s your end-of-day summary.'
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function buildSparklinePath(data: number[], width = 80, height = 32): string {
  if (!data.length) return ''
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)
  return data
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - min) / range) * (height - 4) - 2
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

/* ───────────────────────────── Tooltip ───────────────────────────── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="surface-card-static p-3 text-xs shadow-xl">
      <p className="text-text-tertiary mb-1">
        {label
          ? new Date(label).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })
          : ''}
      </p>
      <p className="text-text-primary font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {formatINR(payload[0].value)}
      </p>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const { navigate, setSelectedCompany } = useTradevoStore()

  const chartData = useMemo(
    () => mockPortfolioChart.slice(-22),
    [],
  )

  const watchlistedCompanies = useMemo(
    () => mockCompanies.filter((c) => c.isWatchlisted),
    [],
  )

  const topMovers = useMemo(() => {
    return [...mockCompanies]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3)
  }, [])

  const activeModule = useMemo(
    () => mockLearningModules.find((m) => m.progress > 0 && m.progress < 100),
    [],
  )

  const totalInvested = mockPortfolio.holdings.reduce(
    (s, h) => s + h.totalInvested,
    0,
  )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid gap-4 lg:gap-5 lg:grid-cols-3"
    >
      {/* ══════════════ ROW 1: Greeting + AI Brief ══════════════ */}

      {/* Greeting Card */}
      <motion.div variants={item} className="lg:col-span-1">
        <div className="surface-card-static p-5 h-full flex flex-col justify-between">
          <div>
            <p className="text-text-tertiary text-sm mb-1">{formatDate()}</p>
            <h2 className="text-xl lg:text-2xl font-semibold text-text-primary tracking-tight">
              {getGreeting()}, {mockUser.name.split(' ')[0]}
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              {getGreetingSubtitle()}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-text-tertiary">
            <Sparkles className="h-3.5 w-3.5 text-tv-cyan" />
            <span>AI is monitoring 14 stocks for you</span>
          </div>
        </div>
      </motion.div>

      {/* AI Daily Brief */}
      <motion.div variants={item} className="lg:col-span-2">
        <div className="surface-card-static accent-border-cyan p-5 h-full">
          <div className="flex items-center gap-2 mb-3">
            <span className="ai-badge">AI</span>
            <span className="text-sm font-medium text-text-primary">
              Daily Brief
            </span>
            <Badge
              variant="outline"
              className={cn(
                'ml-auto text-[11px] border-tv-emerald/30 text-tv-emerald',
                mockAIBrief.sentiment === 'positive' &&
                  'bg-tv-emerald-muted border-tv-emerald/30 text-tv-emerald',
                mockAIBrief.sentiment === 'negative' &&
                  'bg-tv-coral-muted border-tv-coral/30 text-tv-coral',
              )}
            >
              {mockAIBrief.marketMood}
            </Badge>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
            {mockAIBrief.topInsight}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {mockAIBrief.watchlistAlerts.map((alert, i) => (
              <span
                key={i}
                className={cn(
                  'inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full',
                  alert.type === 'opportunity'
                    ? 'bg-tv-emerald-muted text-tv-emerald'
                    : 'bg-tv-amber-muted text-tv-amber',
                )}
              >
                {alert.type === 'opportunity' ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                <span className="font-medium">{alert.company}</span>
                <span className="hidden sm:inline text-text-tertiary">
                  — {alert.message.slice(0, 50)}...
                </span>
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════════ ROW 2: Portfolio Summary + Health Score ══════════════ */}

      {/* Portfolio Summary */}
      <motion.div variants={item} className="lg:col-span-2">
        <div className="surface-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-text-tertiary text-xs uppercase tracking-wider font-medium mb-1">
                Portfolio Value
              </p>
              <p
                className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {formatINR(mockPortfolio.totalValue)}
              </p>
              <div className="flex items-center gap-3 mt-1.5">
                <span
                  className={cn(
                    'text-sm font-medium flex items-center gap-1',
                    mockPortfolio.dayPnl >= 0 ? 'text-tv-emerald' : 'text-tv-coral',
                  )}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {mockPortfolio.dayPnl >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5" />
                  )}
                  {formatINR(Math.abs(mockPortfolio.dayPnl))}
                </span>
                <span
                  className={cn(
                    'text-xs px-1.5 py-0.5 rounded font-medium',
                    mockPortfolio.dayPnlPercent >= 0
                      ? 'bg-tv-emerald-muted text-tv-emerald'
                      : 'bg-tv-coral-muted text-tv-coral',
                  )}
                >
                  {mockPortfolio.dayPnlPercent >= 0 ? '+' : ''}
                  {mockPortfolio.dayPnlPercent}%
                </span>
                <span className="text-xs text-text-tertiary">today</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-[11px] border-tv-emerald/30 text-tv-emerald bg-tv-emerald-muted"
              >
                +{mockPortfolio.overallPnlPercent}%
              </Badge>
              <span className="text-[11px] text-text-tertiary">overall</span>
            </div>
          </div>

          {/* Mini Area Chart */}
          <div className="h-32 lg:h-36 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                <defs>
                  <linearGradient id="dashGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--tv-cyan)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--tv-cyan)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: string) =>
                    new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  }
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={['dataMin - 5000', 'dataMax + 5000']}
                  hide
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--tv-cyan)"
                  strokeWidth={2}
                  fill="url(#dashGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--tv-cyan)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Portfolio Health Score */}
      <motion.div variants={item} className="lg:col-span-1">
        <div className="surface-card-static p-5 h-full flex flex-col items-center justify-center text-center">
          <p className="text-text-tertiary text-xs uppercase tracking-wider font-medium mb-4">
            Portfolio Health
          </p>
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="var(--surface-2)"
                strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="var(--tv-cyan)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${78 * 2.64} ${100 * 2.64}`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-2xl font-bold text-text-primary"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                78
              </span>
              <span className="text-[10px] text-text-tertiary">/100</span>
            </div>
          </div>
          <Badge
            variant="outline"
            className="mt-3 text-xs border-tv-cyan/30 text-tv-cyan bg-tv-cyan-muted"
          >
            Good
          </Badge>
          <p className="text-xs text-text-tertiary mt-3 leading-relaxed max-w-[200px]">
            <span className="ai-badge mr-1">AI</span>
            Diversification could improve your score. Consider adding Healthcare exposure.
          </p>
        </div>
      </motion.div>

      {/* ══════════════ ROW 3: Market Mood + Quick Stats + Top Movers ══════════════ */}

      {/* Market Mood */}
      <motion.div variants={item} className="lg:col-span-1">
        <div className="surface-card p-4 h-full">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-tv-cyan" />
            <span className="text-sm font-medium text-text-primary">Market Mood</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div
              className={cn(
                'h-9 w-9 rounded-full flex items-center justify-center',
                mockAIBrief.sentiment === 'positive' ? 'bg-tv-emerald-muted' : 'bg-tv-coral-muted',
              )}
            >
              {mockAIBrief.sentiment === 'positive' ? (
                <TrendingUp className="h-4.5 w-4.5 text-tv-emerald" />
              ) : (
                <TrendingDown className="h-4.5 w-4.5 text-tv-coral" />
              )}
            </div>
            <div>
              <p
                className={cn(
                  'text-sm font-semibold',
                  mockAIBrief.sentiment === 'positive' ? 'text-tv-emerald' : 'text-tv-coral',
                )}
              >
                {mockAIBrief.marketMood}
              </p>
              <p className="text-[11px] text-text-tertiary">NIFTY 50 near 24,500</p>
            </div>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
            {mockAIBrief.topInsight.slice(0, 140)}...
          </p>
        </div>
      </motion.div>

      {/* Quick Stats (2x2) */}
      <motion.div variants={item} className="lg:col-span-1">
        <div className="grid grid-cols-2 gap-3 h-full">
          {[
            {
              label: 'Total Invested',
              value: formatINRCompact(totalInvested),
              icon: Wallet,
              color: 'text-tv-cyan',
            },
            {
              label: 'Day P&L',
              value: `${mockPortfolio.dayPnl >= 0 ? '+' : ''}${formatINRCompact(mockPortfolio.dayPnl)}`,
              icon: mockPortfolio.dayPnl >= 0 ? TrendingUp : TrendingDown,
              color: mockPortfolio.dayPnl >= 0 ? 'text-tv-emerald' : 'text-tv-coral',
            },
            {
              label: 'Overall Returns',
              value: `+${formatINRCompact(mockPortfolio.overallPnl)}`,
              icon: ArrowUpRight,
              color: 'text-tv-emerald',
            },
            {
              label: 'Cash Available',
              value: formatINRCompact(mockPortfolio.cash),
              icon: IndianRupee,
              color: 'text-tv-blue',
            },
          ].map((stat) => (
            <div key={stat.label} className="surface-card-static p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-text-tertiary">{stat.label}</span>
                <stat.icon className={cn('h-3.5 w-3.5', stat.color)} />
              </div>
              <span
                className={cn('text-sm font-semibold', stat.color)}
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Top Movers */}
      <motion.div variants={item} className="lg:col-span-1">
        <div className="surface-card p-4 h-full">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="h-4 w-4 text-tv-amber" />
            <span className="text-sm font-medium text-text-primary">Top Movers</span>
          </div>
          <div className="space-y-2.5">
            {topMovers.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompany(company.id)}
                className="w-full flex items-center justify-between group text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-text-primary group-hover:text-tv-cyan transition-colors truncate">
                    {company.name}
                  </p>
                  <p className="text-[11px] text-text-tertiary">{company.ticker}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <svg
                    width="52"
                    height="24"
                    viewBox="0 0 80 32"
                    className="opacity-70"
                  >
                    <path
                      d={buildSparklinePath(company.miniChartData, 80, 32)}
                      fill="none"
                      stroke={company.change >= 0 ? 'var(--tv-emerald)' : 'var(--tv-coral)'}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-right w-16">
                    <p
                      className="text-xs font-medium text-text-primary"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      ₹{company.price.toLocaleString('en-IN')}
                    </p>
                    <p
                      className={cn(
                        'text-[11px] font-medium',
                        company.changePercent >= 0 ? 'text-tv-emerald' : 'text-tv-coral',
                      )}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {company.changePercent >= 0 ? '+' : ''}
                      {company.changePercent}%
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════════ ROW 4: Watchlist + Learning ══════════════ */}

      {/* Watchlist */}
      <motion.div variants={item} className="lg:col-span-2">
        <div className="surface-card-static p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm font-medium text-text-primary">Watchlist</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-text-tertiary hover:text-text-secondary"
              onClick={() => navigate('market')}
            >
              View all
            </Button>
          </div>
          {watchlistedCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Eye className="h-8 w-8 text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">No stocks on your watchlist</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => navigate('market')}
              >
                Discover stocks
              </Button>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-1 -mx-1 px-1">
              {watchlistedCompanies.map((company) => (
                <button
                  key={company.id}
                  onClick={() => setSelectedCompany(company.id)}
                  className="min-w-[180px] p-3 rounded-lg bg-surface-2 border border-border-subtle hover:border-tv-cyan/40 transition-all group shrink-0 text-left"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary group-hover:text-tv-cyan transition-colors truncate">
                        {company.name}
                      </p>
                      <p className="text-[11px] text-text-tertiary">{company.ticker}</p>
                    </div>
                    <div
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded font-medium',
                        company.changePercent >= 0
                          ? 'bg-tv-emerald-muted text-tv-emerald'
                          : 'bg-tv-coral-muted text-tv-coral',
                      )}
                    >
                      {company.changePercent >= 0 ? '+' : ''}
                      {company.changePercent}%
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <p
                      className="text-sm font-semibold text-text-primary"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      ₹{company.price.toLocaleString('en-IN')}
                    </p>
                    <svg
                      width="56"
                      height="20"
                      viewBox="0 0 80 32"
                      className="opacity-80"
                    >
                      <path
                        d={buildSparklinePath(company.miniChartData, 80, 32)}
                        fill="none"
                        stroke={
                          company.change >= 0 ? 'var(--tv-emerald)' : 'var(--tv-coral)'
                        }
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Learning Progress */}
      <motion.div variants={item} className="lg:col-span-1">
        <div className="surface-card p-4 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="h-4 w-4 text-tv-blue" />
            <span className="text-sm font-medium text-text-primary">Learning</span>
          </div>
          {activeModule ? (
            <>
              <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
                {activeModule.title}
              </p>
              <div className="flex-1 flex flex-col justify-end gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] text-text-tertiary">
                      {activeModule.completedLessons}/{activeModule.lessons} lessons
                    </span>
                    <span
                      className="text-xs font-medium text-tv-cyan"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {activeModule.progress}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-tv-cyan transition-all duration-700"
                      style={{ width: `${activeModule.progress}%` }}
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs border-tv-cyan/30 text-tv-cyan hover:bg-tv-cyan-muted hover:text-tv-cyan"
                  onClick={() => navigate('learning')}
                >
                  Continue Learning
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <GraduationCap className="h-8 w-8 text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">Start your learning journey</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3 text-xs"
                onClick={() => navigate('learning')}
              >
                Explore modules
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}