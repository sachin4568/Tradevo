'use client'

import React, { useMemo, useState } from 'react'
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
  BarChart,
  Bar,
} from 'recharts'
import {
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  IndianRupee,
  Plus,
  TrendingUp,
  Shield,
  Brain,
  CircleDot,
} from 'lucide-react'
import { useTradevoStore } from '@/store/tradevo-store'
import {
  mockPortfolio,
  mockPortfolioChart,
  mockSectorAllocation,
  mockCompanies,
  mockAIInsights,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'

/* ───────────────────────────── Helpers ───────────────────────────── */

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
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

function formatINRDecimal(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const SECTOR_COLORS = [
  'var(--tv-cyan)',
  'var(--tv-emerald)',
  'var(--tv-amber)',
  'var(--tv-coral)',
  'var(--tv-blue)',
]

const accentMap: Record<string, { border: string; bg: string }> = {
  portfolio: { border: 'accent-border-cyan', bg: 'bg-tv-cyan-muted' },
  behavior: { border: 'accent-border-amber', bg: 'bg-tv-amber-muted' },
  risk: { border: 'accent-border-coral', bg: 'bg-tv-coral-muted' },
  opportunity: { border: 'accent-border-emerald', bg: 'bg-tv-emerald-muted' },
  learning: { border: 'accent-border-cyan', bg: 'bg-tv-cyan-muted' },
}

const iconMap: Record<string, React.ElementType> = {
  portfolio: TrendingUp,
  behavior: Brain,
  risk: Shield,
  opportunity: ArrowUpRight,
  learning: Sparkles,
}

/* ───────────────────────────── Tooltip ───────────────────────────── */

function PerformanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number; dataKey: string; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  const dateStr = label
    ? new Date(label).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''
  return (
    <div className="surface-card-static p-3 text-xs shadow-xl min-w-[180px]">
      <p className="text-text-tertiary mb-2 font-medium">{dateStr}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-text-secondary">
              {p.dataKey === 'value' ? 'Portfolio' : 'NIFTY'}
            </span>
          </div>
          <span
            className="text-text-primary font-medium"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {p.dataKey === 'value' ? formatINR(p.value) : p.value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  )
}

function SectorTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: { sector: string; value: number; percentage: number } }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="surface-card-static p-3 text-xs shadow-xl">
      <p className="text-text-primary font-medium">{d.sector}</p>
      <p className="text-text-secondary mt-0.5">{formatINR(d.value)}</p>
      <p className="text-text-tertiary">{d.percentage}%</p>
    </div>
  )
}

/* ───────────────────────────────────────────────────────────────────── */

export default function PortfolioPage() {
  const { openTradeModal, setSelectedCompany } = useTradevoStore()
  const [timeline, setTimeline] = useState('1M')

  const chartData = useMemo(() => {
    const sliceMap: Record<string, number> = {
      Today: 1,
      '1W': 5,
      '1M': 22,
      '3M': 22,
      '6M': 22,
      '1Y': 22,
      All: 22,
    }
    const n = sliceMap[timeline] ?? 22
    return mockPortfolioChart.slice(-n)
  }, [timeline])

  const portfolioInsights = useMemo(
    () =>
      mockAIInsights.filter(
        (i) => i.type === 'portfolio' || i.type === 'behavior' || i.type === 'risk',
      ),
    [],
  )

  const holdingsWithCompany = useMemo(
    () =>
      mockPortfolio.holdings.map((h) => {
        const comp = mockCompanies.find((c) => c.id === h.companyId)
        return { ...h, ...comp }
      }),
    [],
  )

  const sectorMaxValue = useMemo(
    () => Math.max(...mockSectorAllocation.map((s) => s.value)),
    [],
  )

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ══════════════ Page Header ══════════════ */}
      <motion.div variants={item}>
        <PageHeader
          title="Portfolio"
          subtitle="Your investment overview"
          actions={
            <Button
              size="sm"
              className="bg-tv-cyan text-surface-0 hover:bg-tv-cyan/90 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Add Investment</span>
            </Button>
          }
        />
      </motion.div>

      {/* ══════════════ Timeline Tabs ══════════════ */}
      <motion.div variants={item}>
        <ToggleGroup
          type="single"
          value={timeline}
          onValueChange={(v) => v && setTimeline(v)}
          className="bg-surface-2 rounded-lg p-1 gap-0.5"
        >
          {['Today', '1W', '1M', '3M', '6M', '1Y', 'All'].map((t) => (
            <ToggleGroupItem
              key={t}
              value={t}
              className={cn(
                'text-xs px-3 py-1.5 rounded-md font-medium transition-all data-[state=on]:bg-tv-cyan data-[state=on]:text-surface-0 data-[state=off]:text-text-tertiary data-[state=off]:hover:text-text-secondary',
              )}
            >
              {t}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </motion.div>

      {/* ══════════════ Summary Stats ══════════════ */}
      <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Value */}
        <div className="surface-card-static p-4">
          <p className="text-text-tertiary text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Total Value
          </p>
          <p
            className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatINR(mockPortfolio.totalValue)}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={cn(
                'text-xs font-medium flex items-center gap-0.5',
                mockPortfolio.dayPnl >= 0 ? 'text-tv-emerald' : 'text-tv-coral',
              )}
            >
              {mockPortfolio.dayPnl >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {mockPortfolio.dayPnl >= 0 ? '+' : ''}
              {formatINR(Math.abs(mockPortfolio.dayPnl))}
            </span>
            <span className="text-[11px] text-text-tertiary">today</span>
          </div>
        </div>

        {/* Day P&L */}
        <div className="surface-card-static p-4">
          <p className="text-text-tertiary text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Day P&L
          </p>
          <p
            className={cn(
              'text-xl lg:text-2xl font-bold tracking-tight',
              mockPortfolio.dayPnl >= 0 ? 'text-tv-emerald' : 'text-tv-coral',
            )}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {mockPortfolio.dayPnl >= 0 ? '+' : ''}
            {formatINR(Math.abs(mockPortfolio.dayPnl))}
          </p>
          <span
            className={cn(
              'inline-block text-xs px-1.5 py-0.5 rounded mt-1 font-medium',
              mockPortfolio.dayPnlPercent >= 0
                ? 'bg-tv-emerald-muted text-tv-emerald'
                : 'bg-tv-coral-muted text-tv-coral',
            )}
          >
            {mockPortfolio.dayPnlPercent >= 0 ? '+' : ''}
            {mockPortfolio.dayPnlPercent}%
          </span>
        </div>

        {/* Overall P&L */}
        <div className="surface-card-static p-4">
          <p className="text-text-tertiary text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Overall P&L
          </p>
          <p
            className={cn(
              'text-xl lg:text-2xl font-bold tracking-tight',
              mockPortfolio.overallPnl >= 0 ? 'text-tv-emerald' : 'text-tv-coral',
            )}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {mockPortfolio.overallPnl >= 0 ? '+' : ''}
            {formatINR(Math.abs(mockPortfolio.overallPnl))}
          </p>
          <span
            className={cn(
              'inline-block text-xs px-1.5 py-0.5 rounded mt-1 font-medium',
              mockPortfolio.overallPnlPercent >= 0
                ? 'bg-tv-emerald-muted text-tv-emerald'
                : 'bg-tv-coral-muted text-tv-coral',
            )}
          >
            {mockPortfolio.overallPnlPercent >= 0 ? '+' : ''}
            {mockPortfolio.overallPnlPercent}%
          </span>
        </div>

        {/* Cash Available */}
        <div className="surface-card-static p-4">
          <p className="text-text-tertiary text-[11px] uppercase tracking-wider font-medium mb-1.5">
            Cash Available
          </p>
          <p
            className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatINR(mockPortfolio.cash)}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-1.5 text-[11px] h-7 border-tv-cyan/30 text-tv-cyan hover:bg-tv-cyan-muted hover:text-tv-cyan"
          >
            <Plus className="h-3 w-3 mr-1" />
            Deposit
          </Button>
        </div>
      </motion.div>

      {/* ══════════════ Performance Chart ══════════════ */}
      <motion.div variants={item} className="surface-card-static p-4 lg:p-5">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-sm font-medium text-text-primary">Performance</h3>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2 w-4 rounded-full bg-tv-cyan" />
              Portfolio
            </span>
            <span className="flex items-center gap-1.5 text-text-tertiary">
              <span className="h-0 w-4 border-t-2 border-dashed border-text-tertiary" />
              NIFTY 50
            </span>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="portGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--tv-cyan)" stopOpacity={0.2} />
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
                domain={['dataMin - 10000', 'dataMax + 10000']}
                hide
              />
              <Tooltip content={<PerformanceTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--tv-cyan)"
                strokeWidth={2}
                fill="url(#portGrad)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--tv-cyan)', stroke: 'var(--surface-1)', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="benchmark"
                stroke="var(--text-tertiary)"
                strokeWidth={1.5}
                strokeDasharray="6 3"
                fill="none"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ══════════════ Allocation + Sector Breakdown ══════════════ */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Asset Allocation Donut */}
        <div className="lg:col-span-2 surface-card-static p-4 lg:p-5">
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Asset Allocation
          </h3>
          <div className="relative">
            <div className="h-52 lg:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={mockSectorAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                  >
                    {mockSectorAllocation.map((_, i) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<SectorTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-lg font-bold text-text-primary"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {mockPortfolio.holdings.length} Stocks
              </span>
              <span className="text-[11px] text-text-tertiary">sectors</span>
            </div>
          </div>
        </div>

        {/* Sector Breakdown */}
        <div className="lg:col-span-3 surface-card-static p-4 lg:p-5">
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Sector Breakdown
          </h3>
          <div className="space-y-3.5">
            {mockSectorAllocation.map((sector, i) => (
              <div key={sector.sector}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length] }}
                    />
                    <span className="text-sm text-text-primary">{sector.sector}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-xs text-text-secondary"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatINR(sector.value)}
                    </span>
                    <span
                      className="text-xs font-medium text-text-tertiary w-10 text-right"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {sector.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${(sector.value / sectorMaxValue) * 100}%`,
                      backgroundColor: SECTOR_COLORS[i % SECTOR_COLORS.length],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ══════════════ Holdings Table ══════════════ */}
      <motion.div variants={item} className="surface-card-static p-4 lg:p-5">
        <h3 className="text-sm font-medium text-text-primary mb-4">
          Holdings ({mockPortfolio.holdings.length})
        </h3>
        <div className="overflow-x-auto scrollbar-thin -mx-4 lg:-mx-5 px-4 lg:px-5">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 pr-4">
                  Company
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 px-3">
                  Qty
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 px-3">
                  Avg Price
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 px-3">
                  LTP
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 px-3">
                  P&L
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 px-3">
                  P&L%
                </th>
                <th className="text-right text-[11px] uppercase tracking-wider text-text-tertiary font-medium pb-3 pl-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {holdingsWithCompany.map((h) => {
                const isPositive = h.pnl >= 0
                return (
                  <tr
                    key={h.companyId}
                    className="group hover:bg-surface-2/60 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => setSelectedCompany(h.companyId)}
                        className="text-left hover:text-tv-cyan transition-colors"
                      >
                        <p className="text-sm font-medium text-text-primary group-hover:text-tv-cyan transition-colors">
                          {h.name}
                        </p>
                        <p className="text-[11px] text-text-tertiary">{h.ticker}</p>
                      </button>
                    </td>
                    <td
                      className="py-3 px-3 text-right text-text-secondary"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {h.qty}
                    </td>
                    <td
                      className="py-3 px-3 text-right text-text-secondary"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatINRDecimal(h.avgPrice)}
                    </td>
                    <td
                      className="py-3 px-3 text-right text-text-primary font-medium"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {formatINRDecimal(h.currentPrice)}
                    </td>
                    <td
                      className={cn(
                        'py-3 px-3 text-right font-medium',
                        isPositive ? 'text-tv-emerald' : 'text-tv-coral',
                      )}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {isPositive ? '+' : ''}
                      {formatINR(Math.abs(h.pnl))}
                    </td>
                    <td
                      className={cn(
                        'py-3 px-3 text-right',
                        isPositive ? 'text-tv-emerald' : 'text-tv-coral',
                      )}
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      <span
                        className={cn(
                          'inline-block text-[11px] px-1.5 py-0.5 rounded font-medium',
                          isPositive
                            ? 'bg-tv-emerald-muted text-tv-emerald'
                            : 'bg-tv-coral-muted text-tv-coral',
                        )}
                      >
                        {isPositive ? '+' : ''}
                        {h.pnlPercent}%
                      </span>
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[11px] h-7 px-3 border-tv-cyan/30 text-tv-cyan hover:bg-tv-cyan-muted hover:text-tv-cyan opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          openTradeModal({
                            id: h.companyId,
                            name: h.name,
                            ticker: h.ticker,
                            price: h.currentPrice,
                            change: h.dayChange,
                          })
                        }
                      >
                        Trade
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ══════════════ AI Observations ══════════════ */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-tv-cyan" />
          <h3 className="text-sm font-medium text-text-primary">AI Observations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolioInsights.slice(0, 3).map((insight) => {
            const config = accentMap[insight.type] ?? accentMap.portfolio
            const Icon = iconMap[insight.type] ?? Sparkles
            return (
              <div
                key={insight.id}
                className={cn(
                  'surface-card-static p-4',
                  config.border,
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="ai-badge">AI</span>
                  <div
                    className={cn(
                      'h-6 w-6 rounded-md flex items-center justify-center',
                      config.bg,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 text-text-primary" />
                  </div>
                </div>
                <p className="text-sm font-medium text-text-primary mb-1.5">
                  {insight.title}
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  {insight.message}
                </p>
                {insight.action && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 text-xs text-tv-cyan hover:text-tv-cyan hover:bg-tv-cyan-muted h-7 px-2"
                  >
                    {insight.action}
                    <CircleDot className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}