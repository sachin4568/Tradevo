'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Star,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ShieldAlert,
  Zap,
  BarChart3,
  Activity,
  Clock,
  ExternalLink,
  Brain,
  Target,
  AlertTriangle,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react'
import { useTradevoStore } from '@/store/tradevo-store'
import { mockCompanies, generateCandlestickData } from '@/lib/mock-data'
import { formatPrice, getScoreColor, getScoreBg } from '@/lib/format'
import { cn } from '@/lib/utils'
import { CandlestickChart } from '@/components/tradevo/shared/candlestick-chart'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'

/* ──────────────────────── Helpers are imported from @/lib/format ──────────────────────── */

/* Mock news generator based on company */
function getMockNews(company: (typeof mockCompanies)[number]) {
  const newsTemplates = [
    {
      headline: `${company.name} Q3 Results Beat Street Estimates`,
      source: 'Economic Times',
      time: '2h ago',
      summary: `${company.name} reported stronger-than-expected quarterly results, with revenue growth of ${Math.floor(Math.random() * 15 + 8)}% YoY. The company's EBITDA margin expanded by ${Math.floor(Math.random() * 200 + 50)} basis points, driven by operational efficiency gains.`,
    },
    {
      headline: `${company.ticker} Sees Strong Institutional Buying`,
      source: 'Moneycontrol',
      time: '5h ago',
      summary: `Domestic institutional investors increased their stake in ${company.name} by ${Math.floor(Math.random() * 3 + 1)}% this quarter. FII activity remained positive with net purchases of ₹${Math.floor(Math.random() * 5000 + 1000)} Cr.`,
    },
    {
      headline: `Analysts Raise Price Target for ${company.name}`,
      source: 'LiveMint',
      time: '1d ago',
      summary: `Multiple brokerages have upgraded ${company.name} following positive sector outlook. Average revised price target stands at ${formatPrice(company.price * (1 + Math.random() * 0.15 + 0.05))}, implying ${Math.floor(Math.random() * 15 + 5)}% upside from current levels.`,
    },
    {
      headline: `${company.sector} Sector Outlook: What It Means for ${company.ticker}`,
      source: 'NDTV Profit',
      time: '2d ago',
      summary: `The ${company.sector.toLowerCase()} sector is poised for growth driven by favorable government policies and strong domestic demand. ${company.name} remains well-positioned to capitalize on this trend with its market-leading position.`,
    },
    {
      headline: `${company.name} Announces Strategic Expansion Plans`,
      source: 'Business Standard',
      time: '3d ago',
      summary: `${company.name} outlined its growth strategy for FY26, including plans to invest ₹${Math.floor(Math.random() * 10000 + 2000)} Cr in capacity expansion and new product lines. Management guided for ${Math.floor(Math.random() * 10 + 12)}% revenue growth.`,
    },
  ]
  return newsTemplates
}

/* Mock financial data */
function getMockFinancials(company: (typeof mockCompanies)[number]) {
  return [
    { label: 'Revenue (TTM)', value: `₹${(Math.floor(Math.random() * 200 + 50) * 1000).toLocaleString('en-IN')} Cr`, growth: Math.floor(Math.random() * 20 + 5), positive: true },
    { label: 'Net Profit (TTM)', value: `₹${(Math.floor(Math.random() * 50 + 10) * 1000).toLocaleString('en-IN')} Cr`, growth: Math.floor(Math.random() * 25 + 8), positive: true },
    { label: 'EPS', value: `₹${(company.price / company.pe).toFixed(2)}`, growth: Math.floor(Math.random() * 15 + 3), positive: true },
    { label: 'Debt / Equity', value: (Math.random() * 0.8 + 0.1).toFixed(2), growth: null, positive: null },
    { label: 'Return on Equity', value: `${(Math.random() * 15 + 10).toFixed(1)}%`, growth: Math.floor(Math.random() * 5 + 1), positive: true },
    { label: 'ROCE', value: `${(Math.random() * 12 + 8).toFixed(1)}%`, growth: Math.floor(Math.random() * 4 - 1), positive: Math.random() > 0.3 },
  ]
}

/* ──────────────────────── AI Score Circle ──────────────────────── */

function AiScoreCircle({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 70 ? 'var(--tv-emerald)' : score >= 50 ? 'var(--tv-amber)' : 'var(--tv-coral)'

  return (
    <div className="relative flex items-center justify-center">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="6"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-2xl font-bold tabular-nums', getScoreColor(score))}>
          {score}
        </span>
        <span className="text-[10px] text-text-tertiary font-medium -mt-0.5">/ 100</span>
      </div>
    </div>
  )
}

/* ──────────────────────── (Tooltip is now built into CandlestickChart) ──────────────────────── */

/* ──────────────────────── Company Detail Page ──────────────────────── */

export function CompanyDetailPage() {
  const { selectedCompany, goBack, openTradeModal } = useTradevoStore()

  const company = useMemo(
    () => mockCompanies.find((c) => c.id === selectedCompany) ?? null,
    [selectedCompany]
  )

  const candlestickData = useMemo(
    () => (company ? generateCandlestickData(company.miniChartData, company.price, 180) : []),
    [company]
  )

  const sectorAvg = useMemo(() => {
    if (!company) return 0
    const sameSector = mockCompanies.filter((c) => c.sector === company.sector)
    return Math.round(sameSector.reduce((s, c) => s + c.aiScore, 0) / sameSector.length)
  }, [company])

  const news = useMemo(() => (company ? getMockNews(company) : []), [company])
  const financials = useMemo(() => (company ? getMockFinancials(company) : []), [company])

  /* ─── Empty state ─── */
  if (!company) {
    return (
      <div className="max-w-7xl mx-auto flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2 mb-4">
          <BarChart3 className="size-7 text-text-tertiary" />
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-1.5">
          No Company Selected
        </h2>
        <p className="text-sm text-text-tertiary max-w-[320px]">
          Select a company from the Market page to view detailed analysis.
        </p>
      </div>
    )
  }

  const isPositive = company.change >= 0
  const isBullish = company.aiScore >= 65
  const confidence = company.aiScore >= 75 ? 'High' : company.aiScore >= 55 ? 'Medium' : 'Low'

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={goBack}
            className="flex items-center justify-center size-9 rounded-lg bg-surface-1 border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all"
            aria-label="Go back"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary tracking-tight truncate">
              {company.name}
            </h1>
            <span className="ai-badge shrink-0">{company.ticker}</span>
          </div>
          <button
            className="flex items-center justify-center size-9 rounded-lg hover:bg-surface-1 transition-colors"
            aria-label={company.isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <Star
              className={cn(
                'size-5 transition-colors',
                company.isWatchlisted
                  ? 'fill-tv-amber text-tv-amber'
                  : 'text-text-tertiary hover:text-tv-amber'
              )}
            />
          </button>
        </div>

        {/* Sub-header row */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl lg:text-4xl font-bold text-text-primary tabular-nums">
                {formatPrice(company.price)}
              </span>
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <TrendingUp className="size-4 text-tv-emerald" />
                ) : (
                  <TrendingDown className="size-4 text-tv-coral" />
                )}
                <span
                  className={cn(
                    'text-sm font-semibold tabular-nums',
                    isPositive ? 'text-tv-emerald' : 'text-tv-coral'
                  )}
                >
                  {isPositive ? '+' : ''}
                  {formatPrice(Math.abs(company.change))} ({isPositive ? '+' : ''}
                  {company.changePercent}%)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-md bg-surface-2 text-text-secondary font-medium">
                {company.sector}
              </span>
              <span className="text-xs text-text-tertiary">
                Market Cap: {company.marketCap}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:ml-auto">
            <Button
              size="sm"
              className="bg-tv-emerald hover:bg-tv-emerald/90 text-white font-semibold"
              onClick={() =>
                openTradeModal({
                  id: company.id,
                  name: company.name,
                  ticker: company.ticker,
                  price: company.price,
                  change: company.change,
                  changePercent: company.changePercent,
                  sector: company.sector,
                }, 'buy')
              }
            >
              Buy
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-tv-coral/40 text-tv-coral hover:bg-tv-coral-muted font-semibold"
              onClick={() =>
                openTradeModal({
                  id: company.id,
                  name: company.name,
                  ticker: company.ticker,
                  price: company.price,
                  change: company.change,
                  changePercent: company.changePercent,
                  sector: company.sector,
                }, 'sell')
              }
            >
              Sell
            </Button>
            <AiScoreCircle score={company.aiScore} />
          </div>
        </div>
      </motion.div>

      {/* ─── Tabs ─── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-surface-1 border border-border-subtle">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="ai-analysis" className="gap-1.5">
              <Sparkles className="size-3.5" />
              AI Analysis
            </TabsTrigger>
          </TabsList>

          {/* ────── Overview Tab ────── */}
          <TabsContent value="overview" className="space-y-5 mt-4">
            {/* Key metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'Market Cap', value: company.marketCap },
                { label: 'P/E Ratio', value: company.pe.toFixed(1) },
                { label: 'Volume', value: company.volume },
                {
                  label: '52W High',
                  value: formatPrice(company.price * 1.18),
                  note: 'approx',
                },
                {
                  label: '52W Low',
                  value: formatPrice(company.price * 0.72),
                  note: 'approx',
                },
                { label: 'Dividend Yield', value: `${(Math.random() * 2 + 0.5).toFixed(2)}%` },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="surface-card-static p-4 space-y-1"
                >
                  <p className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">
                    {metric.label}
                  </p>
                  <p className="text-base font-semibold text-text-primary tabular-nums">
                    {metric.value}
                  </p>
                  {metric.note && (
                    <p className="text-[10px] text-text-tertiary">{metric.note}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Candlestick Chart */}
            <div className="surface-card-static p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-1">
                Price Chart
              </h3>
              <p className="text-xs text-text-tertiary mb-4">OHLCV with volume</p>
              <CandlestickChart data={candlestickData} height={400} />
            </div>

            {/* Sector comparison */}
            <div className="surface-card-static p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary">
                AI Score vs Sector Average
              </h3>
              <div className="space-y-3">
                {/* Company score bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-secondary font-medium">{company.name}</span>
                    <span className={cn('font-bold tabular-nums', getScoreColor(company.aiScore))}>
                      {company.aiScore}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${company.aiScore}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                      className={cn(
                        'h-full rounded-full',
                        company.aiScore >= 70 ? 'bg-tv-emerald' : company.aiScore >= 50 ? 'bg-tv-amber' : 'bg-tv-coral'
                      )}
                    />
                  </div>
                </div>
                {/* Sector average bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary">{company.sector} Avg</span>
                    <span className="text-text-tertiary font-medium tabular-nums">
                      {sectorAvg}
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${sectorAvg}%` }}
                      transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-text-tertiary/40"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-text-tertiary">
                {company.aiScore > sectorAvg
                  ? `${company.name} outperforms the ${company.sector.toLowerCase()} sector average by ${company.aiScore - sectorAvg} points.`
                  : `${company.name} trails the ${company.sector.toLowerCase()} sector average by ${sectorAvg - company.aiScore} points.`}
              </p>
            </div>
          </TabsContent>

          {/* ────── Financials Tab ────── */}
          <TabsContent value="financials" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {financials.map((item) => (
                <div key={item.label} className="surface-card-static p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-text-tertiary font-medium uppercase tracking-wider">
                      {item.label}
                    </p>
                    {item.growth !== null && item.positive !== null && (
                      <div
                        className={cn(
                          'flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded',
                          item.positive
                            ? 'text-tv-emerald bg-tv-emerald-muted'
                            : 'text-tv-coral bg-tv-coral-muted'
                        )}
                      >
                        {item.positive ? (
                          <ArrowUpRight className="size-3" />
                        ) : (
                          <ArrowDownRight className="size-3" />
                        )}
                        {item.positive ? '+' : ''}
                        {item.growth}%
                      </div>
                    )}
                  </div>
                  <p className="text-xl font-semibold text-text-primary tabular-nums">
                    {item.value}
                  </p>
                  {item.growth !== null && (
                    <p className="text-[11px] text-text-tertiary">YoY Growth</p>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ────── News Tab ────── */}
          <TabsContent value="news" className="mt-4 space-y-3">
            {news.map((item, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="surface-card p-4 group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h4 className="text-sm font-medium text-text-primary group-hover:text-tv-cyan transition-colors leading-snug">
                    {item.headline}
                  </h4>
                  <ExternalLink className="size-3.5 text-text-tertiary shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-text-secondary leading-relaxed mb-2.5">
                  {item.summary}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-text-tertiary">
                  <span className="font-medium text-text-secondary">{item.source}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3" />
                    {item.time}
                  </span>
                </div>
              </motion.article>
            ))}
          </TabsContent>

          {/* ────── AI Analysis Tab ────── */}
          <TabsContent value="ai-analysis" className="mt-4 space-y-4">
            {/* Overall verdict */}
            <div className="surface-card-static p-5 space-y-4 accent-border-cyan">
              <div className="flex items-center gap-2">
                <span className="ai-badge flex items-center gap-1">
                  <Sparkles className="size-3" /> AI Verdict
                </span>
                <div
                  className={cn(
                    'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                    isBullish
                      ? 'bg-tv-emerald-muted text-tv-emerald'
                      : 'bg-tv-coral-muted text-tv-coral'
                  )}
                >
                  {isBullish ? (
                    <TrendingUp className="size-3" />
                  ) : (
                    <TrendingDown className="size-3" />
                  )}
                  {isBullish ? 'Bullish' : 'Bearish'}
                </div>
              </div>

              <div className="flex items-center gap-6 flex-wrap">
                <AiScoreCircle score={company.aiScore} />
                <div className="space-y-2 flex-1 min-w-[180px]">
                  <div>
                    <p className="text-xs text-text-tertiary mb-0.5">Confidence Level</p>
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded',
                        confidence === 'High'
                          ? 'bg-tv-emerald-muted text-tv-emerald'
                          : confidence === 'Medium'
                            ? 'bg-tv-amber-muted text-tv-amber'
                            : 'bg-tv-coral-muted text-tv-coral'
                      )}
                    >
                      <Target className="size-3" />
                      {confidence}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-text-secondary">
                    <span>Fundamentals: <strong className="text-text-primary">{company.fundamentalScore}</strong></span>
                    <span>Technicals: <strong className="text-text-primary">{company.technicalScore}</strong></span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                {isBullish
                  ? `${company.name} shows strong fundamentals with consistent revenue growth and improving margins. The technical setup indicates an uptrend with the stock trading above key moving averages. Institutional accumulation has been noted over the past quarter. The ${company.sector.toLowerCase()} sector tailwinds provide additional support. Risk-reward ratio remains favorable at current levels.`
                  : `${company.name} faces mixed signals in the current market environment. While the long-term fundamentals remain intact, near-term headwinds from sector rotation and valuation concerns weigh on the stock. Technical indicators suggest a consolidation phase. A cautious approach with staggered entry is recommended.`}
              </p>
            </div>

            {/* Expandable sections */}
            <Accordion type="multiple" className="space-y-3">
              {/* Company Health */}
              <AccordionItem
                value="health"
                className="surface-card-static !border-border-subtle !rounded-lg overflow-hidden px-0"
              >
                <AccordionTrigger className="px-5 hover:no-underline hover:bg-surface-1/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-7 rounded-md bg-tv-emerald-muted">
                      <Activity className="size-3.5 text-tv-emerald" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">Company Health</span>
                    <span className={cn('text-xs font-bold', getScoreColor(company.fundamentalScore))}>
                      {company.fundamentalScore}/100
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5">
                  <div className="space-y-3">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {company.fundamentalScore >= 75
                        ? `${company.name} demonstrates excellent financial health with robust revenue growth, expanding margins, and strong return ratios. The balance sheet is well-managed with comfortable debt levels and consistent free cash flow generation. Management has a proven track record of capital allocation.`
                        : `${company.name} shows moderate financial health. While revenue trends are positive, certain efficiency metrics warrant monitoring. The company maintains an adequate balance sheet, though debt levels are slightly elevated. Continued focus on operational improvement is needed.`}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'Revenue Growth', value: `${(Math.random() * 15 + 5).toFixed(1)}%` },
                        { label: 'Margin Trend', value: company.fundamentalScore > 70 ? 'Expanding' : 'Stable' },
                        { label: 'Cash Flow', value: company.fundamentalScore > 65 ? 'Strong' : 'Moderate' },
                        { label: 'Debt Level', value: company.pe < 25 ? 'Low' : 'Moderate' },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-surface-1">
                          <span className="text-[11px] text-text-tertiary">{m.label}</span>
                          <span className="text-xs font-medium text-text-primary">{m.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Risk Assessment */}
              <AccordionItem
                value="risk"
                className="surface-card-static !border-border-subtle !rounded-lg overflow-hidden px-0"
              >
                <AccordionTrigger className="px-5 hover:no-underline hover:bg-surface-1/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-7 rounded-md bg-tv-coral-muted">
                      <ShieldAlert className="size-3.5 text-tv-coral" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">Risk Assessment</span>
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded-full',
                        company.aiScore >= 75
                          ? 'bg-tv-emerald-muted text-tv-emerald'
                          : company.aiScore >= 55
                            ? 'bg-tv-amber-muted text-tv-amber'
                            : 'bg-tv-coral-muted text-tv-coral'
                      )}
                    >
                      {company.aiScore >= 75 ? 'Low Risk' : company.aiScore >= 55 ? 'Moderate' : 'Higher Risk'}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5">
                  <ul className="space-y-2.5">
                    {[
                      {
                        label: 'Valuation Risk',
                        text: company.pe > 40 ? 'P/E ratio of ' + company.pe.toFixed(1) + ' is elevated vs sector peers. Premium valuation limits upside in bearish scenarios.' : 'P/E ratio of ' + company.pe.toFixed(1) + ' is reasonable relative to growth, offering margin of safety.',
                        severity: company.pe > 40 ? 'high' : 'low',
                      },
                      {
                        label: 'Sector Concentration',
                        text: `${company.name}'s performance is closely tied to ${company.sector.toLowerCase()} sector dynamics. Regulatory changes could impact operations.`,
                        severity: 'medium',
                      },
                      {
                        label: 'Liquidity Risk',
                        text: `Average daily volume of ${company.volume} shares provides adequate liquidity for retail investors. Institutional block trades may experience slippage.`,
                        severity: 'low',
                      },
                      {
                        label: 'Market Risk',
                        text: 'Broad market corrections and global macro events (Fed policy, geopolitical tensions) pose systematic risks to the position.',
                        severity: 'medium',
                      },
                    ].map((risk) => (
                      <li key={risk.label} className="flex items-start gap-2.5">
                        <AlertTriangle
                          className={cn(
                            'size-4 mt-0.5 shrink-0',
                            risk.severity === 'high'
                              ? 'text-tv-coral'
                              : risk.severity === 'medium'
                                ? 'text-tv-amber'
                                : 'text-tv-emerald'
                          )}
                        />
                        <div>
                          <p className="text-xs font-semibold text-text-primary">{risk.label}</p>
                          <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{risk.text}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Catalysts */}
              <AccordionItem
                value="catalysts"
                className="surface-card-static !border-border-subtle !rounded-lg overflow-hidden px-0"
              >
                <AccordionTrigger className="px-5 hover:no-underline hover:bg-surface-1/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-7 rounded-md bg-tv-amber-muted">
                      <Zap className="size-3.5 text-tv-amber" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">Catalysts & Opportunities</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5">
                  <ul className="space-y-2.5">
                    {[
                      {
                        title: 'Earnings Momentum',
                        desc: `Upcoming Q4 results expected to continue the trend of beating analyst estimates. Consensus EPS growth forecast at ${Math.floor(Math.random() * 10 + 12)}%.`,
                      },
                      {
                        title: 'Sector Tailwinds',
                        desc: `Government push on ${company.sector === 'Technology' ? 'digital transformation and AI adoption' : company.sector === 'Financial Services' ? 'credit growth and financial inclusion' : company.sector === 'Energy' ? 'green energy transition and Reliance Jio expansion' : company.sector === 'FMCG' ? 'rural demand recovery and premiumization' : 'EV transition and infrastructure spending'} provides a strong demand backdrop.`,
                      },
                      {
                        title: 'Expansion Plans',
                        desc: `${company.name} has outlined capacity expansion and market diversification initiatives that could drive revenue acceleration in FY26-27.`,
                      },
                    ].map((cat) => (
                      <li key={cat.title} className="flex items-start gap-2.5">
                        <CheckCircle2 className="size-4 mt-0.5 text-tv-emerald shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-text-primary">{cat.title}</p>
                          <p className="text-xs text-text-secondary leading-relaxed mt-0.5">{cat.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              {/* Technical Outlook */}
              <AccordionItem
                value="technical"
                className="surface-card-static !border-border-subtle !rounded-lg overflow-hidden px-0"
              >
                <AccordionTrigger className="px-5 hover:no-underline hover:bg-surface-1/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-7 rounded-md bg-tv-blue-muted">
                      <BarChart3 className="size-3.5 text-tv-blue" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">Technical Outlook</span>
                    <span className={cn('text-xs font-bold', getScoreColor(company.technicalScore))}>
                      {company.technicalScore}/100
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5">
                  <div className="space-y-3">
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {company.technicalScore >= 70
                        ? `${company.ticker} is in a strong uptrend, trading above its 20-day (₹${formatPrice(company.price * 0.97)}), 50-day (₹${formatPrice(company.price * 0.93)}), and 200-day (₹${formatPrice(company.price * 0.87)}) moving averages. RSI at ${Math.floor(company.technicalScore * 0.8 + 10)} indicates healthy momentum without overbought conditions. MACD histogram is positive and expanding, confirming bullish momentum. Volume has been supportive of the current move.`
                        : `${company.ticker} is in a consolidation phase near current levels. The stock is trading near its 20-DMA with mixed signals from oscillators. RSI at ${Math.floor(company.technicalScore * 0.8 + 10)} suggests neutral conditions. A breakout above ₹${formatPrice(company.price * 1.04)} could signal resumption of the uptrend, while support lies at ₹${formatPrice(company.price * 0.95)}.`}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: 'RSI (14)', value: `${Math.floor(company.technicalScore * 0.8 + 10)}`, status: company.technicalScore > 75 ? 'Overbought' : company.technicalScore > 45 ? 'Neutral' : 'Oversold' },
                        { label: 'MACD', value: company.change >= 0 ? 'Bullish' : 'Bearish', status: company.change >= 0 ? 'Positive' : 'Negative' },
                        { label: 'Support', value: formatPrice(company.price * 0.95), status: 'Key Level' },
                        { label: 'Resistance', value: formatPrice(company.price * 1.06), status: 'Breakout Zone' },
                      ].map((t) => (
                        <div key={t.label} className="flex items-center justify-between py-1.5 px-2.5 rounded-md bg-surface-1">
                          <span className="text-[11px] text-text-tertiary">{t.label}</span>
                          <div className="text-right">
                            <span className="text-xs font-medium text-text-primary block">{t.value}</span>
                            <span className="text-[10px] text-text-tertiary">{t.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* AI Recommendation */}
              <AccordionItem
                value="recommendation"
                className="surface-card-static !border-border-subtle !rounded-lg overflow-hidden px-0"
              >
                <AccordionTrigger className="px-5 hover:no-underline hover:bg-surface-1/50">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center size-7 rounded-md bg-tv-cyan-muted">
                      <Brain className="size-3.5 text-tv-cyan" />
                    </div>
                    <span className="text-sm font-medium text-text-primary">AI Recommendation</span>
                    <span className="ai-badge">Final</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-5">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-1">
                      <div
                        className={cn(
                          'flex items-center justify-center size-10 rounded-xl',
                          isBullish ? 'bg-tv-emerald-muted' : 'bg-tv-coral-muted'
                        )}
                      >
                        <IndianRupee className={cn('size-5', isBullish ? 'text-tv-emerald' : 'text-tv-coral')} />
                      </div>
                      <div>
                        <p className={cn('text-sm font-semibold', isBullish ? 'text-tv-emerald' : 'text-tv-coral')}>
                          {isBullish ? 'Accumulate / Buy on Dips' : 'Hold / Wait for Better Entry'}
                        </p>
                        <p className="text-xs text-text-tertiary mt-0.5">
                          {isBullish
                            ? `Target: ${formatPrice(company.price * 1.12)} | Stop Loss: ${formatPrice(company.price * 0.94)}`
                            : `Buy Zone: ${formatPrice(company.price * 0.92)} – ${formatPrice(company.price * 0.95)}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                      {isBullish
                        ? `Based on our multi-factor analysis, ${company.name} presents a compelling opportunity for medium to long-term investors. The confluence of strong fundamentals, positive technical structure, and favorable sector dynamics creates a high-probability setup. We recommend accumulating in the ${formatPrice(company.price * 0.96)}–${formatPrice(company.price * 1.01)} range with a 12-month target of ${formatPrice(company.price * 1.15)}. Risk-reward ratio stands at approximately 1:${(2 + Math.random()).toFixed(1)}.`
                        : `Current levels do not offer an optimal entry point for ${company.name}. We recommend waiting for a pullback to the ${formatPrice(company.price * 0.92)}–${formatPrice(company.price * 0.95)} zone where risk-reward improves significantly. Existing holders should maintain positions with a trailing stop loss at ${formatPrice(company.price * 0.94)}. Fresh buying can be considered on signs of reversal.`}
                    </p>
                    <p className="text-[11px] text-text-tertiary italic">
                      Disclaimer: This AI analysis is for informational purposes only and does not constitute financial advice. Always conduct your own research or consult a financial advisor.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}