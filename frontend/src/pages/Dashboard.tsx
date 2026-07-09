import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, BarChart3, Eye, GraduationCap,
  FileText, Zap, Activity, ChevronRight, Sparkles, ArrowUpRight,
  IndianRupee, ShieldCheck, CircleDollarSign,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { useMarketOverview } from '@/hooks/useMarket'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useLearningProgress } from '@/hooks/useLearning'
import { useAuth } from '@/hooks/useAuth'
import { generatePortfolioLineData } from '@/lib/mockOHLCV'
import type { TimelineFilter } from '@/types/chart'

/* ─── Helpers ─── */

function formatCurrency(v: number) {
  return '₹' + v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function formatCompact(v: number) {
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(1) + 'Cr'
  if (v >= 100000) return '₹' + (v / 100000).toFixed(1) + 'L'
  if (v >= 1000) return '₹' + (v / 1000).toFixed(1) + 'K'
  return '₹' + v.toFixed(0)
}

/* ─── Demo / Fallback data (shown when portfolio is empty) ─── */

const DEMO_PORTFOLIO_VALUE = 1245670
const DEMO_INVESTED = 1030000
const DEMO_DAY_PNL = 4230
const DEMO_TOTAL_RETURNS = 150000
const DEMO_CASH = 120000
const DEMO_HEALTH_SCORE = 78
const DEMO_AI_STOCKS = 14

const DEMO_TOP_MOVERS = [
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel', price: 1580.25, change: 2.11 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance', price: 7250.80, change: 1.83 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1145.60, change: 1.52 },
]

const DEMO_DAILY_BRIEF = {
  sentiment: 'Cautiously Optimistic' as const,
  summary: 'NIFTY 50 is testing the 24,500 resistance level with strong institutional buying in banking and energy sectors. FIIs net buyers for the 5th consecutive session. Global cues remain supportive with US Fed signalling a pause on rate hikes. Banking stocks leading the rally with ICICI Bank and HDFC Bank hitting fresh 52-week highs.',
  alerts: [
    { name: 'Bajaj Finance', type: 'bullish' as const, text: 'Breaking above 200-DMA with volume spike. Short-term bullish target ₹7,500.' },
    { name: 'Infosys', type: 'warning' as const, text: 'RSI entering overbought zone (72). Consider trailing stop-loss at ₹1,680.' },
    { name: 'ICICI Bank', type: 'bullish' as const, text: 'Q3 results beat estimates by 8%. ROE improvement trend continues.' },
  ],
}

const DEMO_MARKET_MOOD = {
  status: 'Cautiously Optimistic',
  nifty: '24,500',
  description: 'NIFTY 50 is testing the 24,500 resistance level with strong institutional buying in banking and energy sectors. FIIs net buyers for the 5th consecutive session. Global cues remain supportive with US Fed signalling a pause on rate hikes.',
}

/* ─── Sub-components ─── */

function PortfolioHealthRing({ score }: { score: number }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const statusLabel = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Needs Work'
  const statusColor = score >= 80 ? '#34d399' : score >= 60 ? '#22d3ee' : score >= 40 ? '#fbbf24' : '#f87171'

  return (
    <div className="flex items-center gap-5">
      <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--color-surface-3)" strokeWidth="8" />
          <circle cx="50" cy="50" r={radius} fill="none" stroke={statusColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[18px] font-bold text-tx-primary">{score}</span>
          <span className="text-[9px] text-tx-muted">/100</span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold text-white`} style={{ backgroundColor: statusColor }}>{statusLabel}</span>
        </div>
        <p className="text-[12px] leading-relaxed text-tx-secondary">
          {score >= 80
            ? 'Your portfolio is well-diversified with strong risk-adjusted returns. Keep it up!'
            : 'Diversification could improve your score. Consider adding Healthcare exposure.'}
        </p>
      </div>
    </div>
  )
}

function MiniLineChart({ data, height = 80, color }: { data: { date: string; value: number }[]; height?: number; color?: string }) {
  const lineColor = color || '#22d3ee'
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="miniGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity={0.2} />
            <stop offset="100%" stopColor={lineColor} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <XAxis dataKey="date" hide />
        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
        <Tooltip content={({ active, payload }) => {
          if (!active || !payload?.length) return null
          return (
            <div className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-[11px] shadow-lg">
              <span className="text-tx-primary">₹{(payload[0].value as number).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          )
        }} />
        <Area type="monotone" dataKey="value" stroke={lineColor} strokeWidth={1.8} fill="url(#miniGrad)" dot={false} isAnimationActive animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ─── Main Dashboard ─── */

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: market } = useMarketOverview()
  const portfolio = usePortfolio()
  const { companies: watchlistCompanies } = useWatchlist()
  const { completedCount, totalLessons, progressPercent, nextLesson } = useLearningProgress()
  const [chartTimeline] = useState<TimelineFilter>('1M')

  // Use real data when available, otherwise demo data
  const totalValue = portfolio.isEmpty ? DEMO_PORTFOLIO_VALUE : portfolio.totalValue
  const totalInvested = portfolio.isEmpty ? DEMO_INVESTED : portfolio.totalInvested
  const dayPnl = portfolio.isEmpty ? DEMO_DAY_PNL : portfolio.totalDayPnL
  const totalReturns = portfolio.isEmpty ? DEMO_TOTAL_RETURNS : portfolio.totalPnL
  const cash = portfolio.isEmpty ? DEMO_CASH : portfolio.virtualCash
  const healthScore = portfolio.isEmpty ? DEMO_HEALTH_SCORE : Math.min(100, Math.max(40, 60 + Math.floor(portfolio.totalPnLPercent)))
  const dayPnlPercent = totalValue > 0 ? (dayPnl / (totalValue - dayPnl)) * 100 : 0

  const lineData = useMemo(() => generatePortfolioLineData(totalValue, chartTimeline), [totalValue, chartTimeline])

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || 'Investor'
  const dateStr = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  const marketStatus = market?.status === 'open' ? 'Markets are open' : 'Markets are closed. Here\'s your end-of-day summary.'

  // Top movers from market API or demo
  const topMovers = market?.topGainers?.slice(0, 3).map(m => ({
    symbol: m.symbol,
    name: m.name,
    price: m.price,
    change: m.changePercent,
  })) || DEMO_TOP_MOVERS

  return (
    <div className="space-y-5">
      {/* ─── Welcome Banner ─── */}
      <div className="rounded-xl border border-border bg-surface-1 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[12px] text-tx-muted">{dateStr}</p>
            <h1 className="mt-0.5 text-xl font-bold text-tx-primary">{greeting}, {firstName}</h1>
            <p className="mt-1 text-[13px] text-tx-secondary">{marketStatus}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-accent/20 bg-accent-subtle px-3.5 py-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-[12px] font-medium text-accent">AI is monitoring {DEMO_AI_STOCKS} stocks for you</span>
          </div>
        </div>
      </div>

      {/* ─── Daily Brief + Portfolio Value ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Daily Brief — wider (3/5) */}
        <div className="lg:col-span-3 rounded-xl border border-border bg-surface-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              <h3 className="text-[13px] font-semibold text-tx-primary">Daily Brief</h3>
            </div>
            <span className="rounded-full bg-accent-subtle px-2.5 py-0.5 text-[11px] font-semibold text-accent">{DEMO_DAILY_BRIEF.sentiment}</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[13px] leading-relaxed text-tx-secondary">{DEMO_DAILY_BRIEF.summary}</p>
            <div className="space-y-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-tx-muted">Stock Alerts</p>
              {DEMO_DAILY_BRIEF.alerts.map((alert, i) => (
                <div key={i} className={`rounded-lg px-3.5 py-2.5 ${alert.type === 'bullish' ? 'bg-accent-subtle' : 'bg-tx-warning/10'}`}>
                  <div className="flex items-center gap-2">
                    {alert.type === 'bullish'
                      ? <ArrowUpRight className="h-3.5 w-3.5 text-tx-success" />
                      : <Activity className="h-3.5 w-3.5 text-tx-warning" />}
                    <span className="text-[12.5px] font-semibold text-tx-primary">{alert.name}</span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-tx-secondary">{alert.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Portfolio Value — (2/5) */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-1 overflow-hidden">
          <div className="border-b border-border px-5 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-tx-muted">Portfolio Value</p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="text-2xl font-bold text-tx-primary">{formatCurrency(totalValue)}</span>
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-tx-success flex items-center gap-0.5">
                  <TrendingUp className="h-3.5 w-3.5" />+{formatCompact(dayPnl)}
                </span>
                <span className="text-[12px] font-medium text-tx-success">+{dayPnlPercent.toFixed(2)}%</span>
                <span className="text-[11px] text-tx-muted">today</span>
              </div>
            </div>
          </div>
          <div className="px-3 pb-3 pt-1">
            <MiniLineChart data={lineData} height={140} />
            <div className="mt-1 flex justify-center gap-4 text-[10px] text-tx-muted">
              {lineData.filter((_, i) => i === 0 || i === Math.floor(lineData.length / 2) || i === lineData.length - 1)
                .map((d, i) => <span key={i}>{d.date}</span>)}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Portfolio Health + Market Mood ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Portfolio Health */}
        <div className="rounded-xl border border-border bg-surface-1 p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-accent" />
            <h3 className="text-[13px] font-semibold text-tx-primary">Portfolio Health</h3>
          </div>
          <PortfolioHealthRing score={healthScore} />
        </div>

        {/* Market Mood */}
        <div className="rounded-xl border border-border bg-surface-1 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-accent" />
            <h3 className="text-[13px] font-semibold text-tx-primary">Market Mood</h3>
          </div>
          <div className="mb-1">
            <span className="text-[15px] font-semibold text-accent">{DEMO_MARKET_MOOD.status}</span>
            <span className="ml-2 text-[12px] text-tx-muted">NIFTY 50 near {DEMO_MARKET_MOOD.nifty}</span>
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-tx-secondary">{DEMO_MARKET_MOOD.description}</p>
          {/* Market indices inline */}
          {market && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {market.indices.slice(0, 4).map(idx => {
                const isUp = idx.change >= 0
                return (
                  <div key={idx.name} className="rounded-lg bg-surface-2 px-3 py-2">
                    <p className="text-[10.5px] text-tx-muted">{idx.name}</p>
                    <div className="mt-0.5 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-tx-primary">{idx.value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                      <span className={`text-[11px] font-medium ${isUp ? 'text-tx-success' : 'text-tx-danger'}`}>
                        {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ─── Financial Metrics Grid ─── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle"><IndianRupee className="h-4 w-4 text-accent" /></div>
            <span className="text-[12px] text-tx-muted">Total Invested</span>
          </div>
          <p className="text-lg font-bold text-tx-primary">{formatCompact(totalInvested)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tx-success/10"><TrendingUp className="h-4 w-4 text-tx-success" /></div>
            <span className="text-[12px] text-tx-muted">Day P&L</span>
          </div>
          <p className={`text-lg font-bold ${dayPnl >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}>{dayPnl >= 0 ? '+' : ''}{formatCompact(dayPnl)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-tx-success/10"><BarChart3 className="h-4 w-4 text-tx-success" /></div>
            <span className="text-[12px] text-tx-muted">Overall Returns</span>
          </div>
          <p className={`text-lg font-bold ${totalReturns >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}>{totalReturns >= 0 ? '+' : ''}{formatCompact(totalReturns)}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-subtle"><CircleDollarSign className="h-4 w-4 text-accent" /></div>
            <span className="text-[12px] text-tx-muted">Cash Available</span>
          </div>
          <p className="text-lg font-bold text-tx-primary">{formatCompact(cash)}</p>
        </div>
      </div>

      {/* ─── Top Movers ─── */}
      <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-tx-warning" />
            <h3 className="text-[13px] font-semibold text-tx-primary">Top Movers</h3>
          </div>
          <button onClick={() => navigate('/market')} className="text-[12px] font-medium text-accent hover:text-accent-hover">View All</button>
        </div>
        <div className="divide-y divide-border">
          {topMovers.map(m => (
            <button key={m.symbol} onClick={() => navigate('/market')} className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-surface-2">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-subtle text-[12px] font-bold text-accent">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-tx-primary">{m.name}</p>
                  <p className="text-[11px] text-tx-muted">{m.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-semibold text-tx-primary">₹{m.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p className="text-[12px] font-medium text-tx-success">+{m.change.toFixed(2)}%</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Watchlist + Learning ─── */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Watchlist */}
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              <h3 className="text-[13px] font-semibold text-tx-primary">Watchlist</h3>
            </div>
            <button onClick={() => navigate('/watchlist')} className="text-[12px] font-medium text-accent hover:text-accent-hover">View All</button>
          </div>
          <div className="p-4">
            {watchlistCompanies.length > 0 ? (
              <div className="space-y-1.5">
                {watchlistCompanies.slice(0, 4).map(c => {
                  const isUp = c.dayChange >= 0
                  return (
                    <button key={c.id} onClick={() => navigate(`/market/${c.id}`)} className="flex w-full items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3">
                      <div>
                        <span className="text-[12.5px] font-medium text-tx-primary">{c.symbol}</span>
                        <span className="ml-2 text-[11px] text-tx-muted">{c.name.split(' ')[0]}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[12.5px] font-medium text-tx-primary">₹{c.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-[11px] font-medium ${isUp ? 'text-tx-success' : 'text-tx-danger'}`}>{isUp ? '+' : ''}{c.dayChangePercent.toFixed(2)}%</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Eye className="mb-2 h-5 w-5 text-tx-muted" />
                <p className="text-[12px] text-tx-muted">Star companies from the Market page to track them here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Learning */}
        <div className="rounded-xl border border-border bg-surface-1 overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-accent" />
              <h3 className="text-[13px] font-semibold text-tx-primary">Learning</h3>
            </div>
            <button onClick={() => navigate('/learning')} className="text-[12px] font-medium text-accent hover:text-accent-hover">View All</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[12px] font-semibold text-tx-secondary">{progressPercent}%</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-lg bg-surface-2 p-2.5">
                <p className="text-[11px] text-tx-muted">Completed</p>
                <p className="text-[15px] font-semibold text-tx-primary">{completedCount}<span className="text-[12px] font-normal text-tx-muted">/{totalLessons}</span></p>
              </div>
              <div className="rounded-lg bg-surface-2 p-2.5">
                <p className="text-[11px] text-tx-muted">Progress</p>
                <p className="text-[15px] font-semibold text-tx-primary">{completedCount} Lessons</p>
              </div>
            </div>
            {nextLesson && (
              <button onClick={() => navigate(`/learning/${nextLesson.moduleId}/${nextLesson.lessonId}`)} className="flex w-full items-center justify-between rounded-lg bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] text-tx-muted">Next Lesson</p>
                  <p className="truncate text-[12.5px] font-medium text-tx-primary">{nextLesson.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-accent" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}