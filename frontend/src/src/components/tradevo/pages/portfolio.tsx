'use client'

import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
  mockPortfolioOHLC,
  mockSectorAllocation,
  mockCompanies,
  mockAIInsights,
} from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { formatINR, formatINRDecimal, SECTOR_COLORS, AI_ACCENT_MAP, containerVariants, itemVariants } from '@/lib/format'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { CandlestickChart } from '@/components/tradevo/shared/candlestick-chart'
import { Badge } from '@/components/ui/badge'

/* ──────────────────────── Shared Maps ──────────────────────── */

const accentMap = AI_ACCENT_MAP

const iconMap: Record<string, React.ElementType> = {
  portfolio: TrendingUp,
  behavior: Brain,
  risk: Shield,
  opportunity: ArrowUpRight,
  learning: Sparkles,
}

/* ───────────────────────────────────────────────────────────────────── */

export default function PortfolioPage() {
  const { openTradeModal, setSelectedCompany, navigate } = useTradevoStore()
  const [timeline, setTimeline] = useState('1M')

  const portfolioInsights = useMemo(
    () =>
      mockAIInsights.filter(
        (i) => i.type === 'portfolio' || i.type === 'behavior' || i.type === 'risk',
      ),
    []
  )

  const holdingsWithCompany = useMemo(
    () =>
      mockPortfolio.holdings.map((h) => {
        const comp = mockCompanies.find((c) => c.id === h.companyId)
        return { ...h, ...comp }
      }),
    []
  )

  const sectorTotalValue = useMemo(
    () => mockSectorAllocation.reduce((sum, s) => sum + s.value, 0),
    []
  )

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {/* ══════════════ Page Header ══════════════ */}
      <motion.div variants={itemVariants}>
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

      {/* ══════════════ Candlestick Chart with Timeline ══════════════ */}
      <motion.div variants={itemVariants} className="surface-card-static p-4 lg:p-5">
        <div className="flex items-center gap-4 mb-4">
          <h3 className="text-sm font-medium text-text-primary">Performance</h3>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2 w-4 rounded-full bg-tv-emerald" />
              Bullish
            </span>
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2 w-4 rounded-full bg-tv-coral" />
              Bearish
            </span>
          </div>
        </div>
        <CandlestickChart
          data={mockPortfolioOHLC}
          height={320}
          showVolume
          externalTimeframe={timeline}
          onTimeframeChange={setTimeline}
        />
      </motion.div>

      {/* ══════════════ Summary Stats ══════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* ══════════════ Allocation + Sector Breakdown ══════════════ */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Asset Allocation Donut */}
        <div className="lg:col-span-2 surface-card-static p-4 lg:p-5">
          <h3 className="text-sm font-medium text-text-primary mb-4">
            Asset Allocation
          </h3>
          <div className="relative">
            <div className="h-52 lg:h-56">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {mockSectorAllocation.map((sector, i) => {
                  const total = mockSectorAllocation.reduce((s, sec) => s + sec.value, 0)
                  const startAngle = mockSectorAllocation.slice(0, i).reduce((s, sec) => s + (sec.value / total) * 360, 0) - 90
                  const endAngle = startAngle + (sector.value / total) * 360
                  const startRad = (startAngle * Math.PI) / 180
                  const endRad = (endAngle * Math.PI) / 180
                  const outerR = 85
                  const innerR = 60
                  const cx = 100
                  const cy = 100
                  const x1o = cx + outerR * Math.cos(startRad)
                  const y1o = cy + outerR * Math.sin(startRad)
                  const x2o = cx + outerR * Math.cos(endRad)
                  const y2o = cy + outerR * Math.sin(endRad)
                  const x1i = cx + innerR * Math.cos(endRad)
                  const y1i = cy + innerR * Math.sin(endRad)
                  const x2i = cx + innerR * Math.cos(startRad)
                  const y2i = cy + innerR * Math.sin(startRad)
                  const largeArc = endAngle - startAngle > 180 ? 1 : 0
                  return (
                    <path
                      key={sector.sector}
                      d={`M ${x1o} ${y1o} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2i} ${y2i} Z`}
                      fill={SECTOR_COLORS[i % SECTOR_COLORS.length]}
                      stroke="none"
                      opacity={0.85}
                    />
                  )
                })}
              </svg>
            </div>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span
                className="text-lg font-bold text-text-primary"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {mockPortfolio.holdings.length} Stocks
              </span>
              <span className="text-[11px] text-text-tertiary">across {mockSectorAllocation.length} sectors</span>
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
                      width: `${(sector.value / sectorTotalValue) * 100}%`,
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
      <motion.div variants={itemVariants} className="surface-card-static p-4 lg:p-5">
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
                        onClick={() => {
                          setSelectedCompany(h.companyId)
                          navigate('company')
                        }}
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
                        className="text-[11px] h-7 px-3 border-tv-cyan/30 text-tv-cyan hover:bg-tv-cyan-muted hover:text-tv-cyan lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                        onClick={() =>
                          openTradeModal({
                            id: h.companyId,
                            name: h.name,
                            ticker: h.ticker,
                            price: h.currentPrice,
                            change: h.dayChange ?? 0,
                            changePercent: h.dayChangePercent ?? 0,
                            sector: h.sector ?? '',
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
      <motion.div variants={itemVariants}>
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