'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Star,
  Newspaper,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useTradevoStore } from '@/store/tradevo-store'
import { mockCompanies } from '@/lib/mock-data'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { cn } from '@/lib/utils'
import { formatPrice, getScoreColor, getScoreBg, getScoreDotColor } from '@/lib/format'

/* ──────────────────────── Constants ──────────────────────── */

const SECTORS = [
  'All',
  'Technology',
  'Financial Services',
  'FMCG',
  'Energy',
  'Automotive',
] as const

type SectorFilter = (typeof SECTORS)[number]

/* ──────────────────────── Helpers ──────────────────────── */

/* ──────────────────────── Sparkline ──────────────────────── */

function Sparkline({
  data,
  positive,
}: {
  data: readonly number[]
  positive: boolean
}) {
  const width = 200
  const height = 40
  const padding = 2

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((val - min) / range) * (height - padding * 2)
    return `${x},${y}`
  })

  const linePoints = points.join(' ')
  const areaPoints = `${padding},${height} ${linePoints} ${width - padding},${height}`

  const strokeColor = positive ? 'var(--tv-cyan)' : 'var(--tv-coral)'
  const gradId = positive ? 'sparkGradUp' : 'sparkGradDown'
  const gradStart = positive ? 'var(--tv-cyan)' : 'var(--tv-coral)'

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-10"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gradStart} stopOpacity="0.25" />
          <stop offset="100%" stopColor={gradStart} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={linePoints}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* ──────────────────────── Score Pill ──────────────────────── */

function ScorePill({
  label,
  score,
}: {
  label: string
  score: number
}) {
  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md', getScoreBg(score))}>
      <span className={cn('size-1.5 rounded-full shrink-0', getScoreDotColor(score))} />
      <span className="text-[11px] font-semibold text-text-tertiary">{label}</span>
      <span className={cn('text-[11px] font-bold', getScoreColor(score))}>{score}</span>
    </div>
  )
}

/* ──────────────────────── Company Card ──────────────────────── */

function CompanyCard({
  company,
  index,
}: {
  company: (typeof mockCompanies)[number]
  index: number
}) {
  const { setSelectedCompany, navigate } = useTradevoStore()
  const isPositive = company.change >= 0

  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.04,
        ease: [0.16, 1, 0.3, 1],
      }}
      onClick={() => {
        setSelectedCompany(company.id)
        navigate('company')
      }}
      className="surface-card p-4 text-left w-full cursor-pointer group"
    >
      {/* Header: name, ticker, star */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-text-primary truncate">
            {company.name}
          </h3>
          <p className="text-xs text-text-tertiary mt-0.5">{company.ticker}</p>
        </div>
        <Star
          className={cn(
            'size-4 shrink-0 mt-0.5 transition-colors',
            company.isWatchlisted
              ? 'fill-tv-amber text-tv-amber'
              : 'text-text-tertiary group-hover:text-text-secondary'
          )}
        />
      </div>

      {/* Price + change */}
      <div className="mb-3">
        <p className="text-lg font-semibold text-text-primary tabular-nums">
          {formatPrice(company.price)}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          {isPositive ? (
            <TrendingUp className="size-3.5 text-tv-emerald" />
          ) : (
            <TrendingDown className="size-3.5 text-tv-coral" />
          )}
          <span
            className={cn(
              'text-xs font-medium tabular-nums',
              isPositive ? 'text-tv-emerald' : 'text-tv-coral'
            )}
          >
            {isPositive ? '+' : ''}
            {formatPrice(Math.abs(company.change))} (
            {isPositive ? '+' : ''}
            {company.changePercent}%)
          </span>
        </div>
      </div>

      {/* Sparkline */}
      <div className="mb-3">
        <Sparkline data={company.miniChartData} positive={isPositive} />
      </div>

      {/* Score pills */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <ScorePill label="AI" score={company.aiScore} />
        <ScorePill label="Fund" score={company.fundamentalScore} />
        <ScorePill label="Tech" score={company.technicalScore} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[11px] text-text-tertiary pt-2.5 border-t border-border-subtle">
        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-surface-2 font-medium text-text-secondary">
          {company.sector}
        </span>
        <div className="flex items-center gap-3">
          <span>{company.marketCap}</span>
          <span>P/E {company.pe}</span>
          <span className="inline-flex items-center gap-1">
            <Newspaper className="size-3" />
            {company.newsCount}
          </span>
        </div>
      </div>
    </motion.button>
  )
}

/* ──────────────────────── Market Page ──────────────────────── */

export function MarketPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeSector, setActiveSector] = useState<SectorFilter>('All')

  const filteredCompanies = useMemo(() => {
    let companies = mockCompanies

    // Sector filter
    if (activeSector !== 'All') {
      companies = companies.filter((c) => c.sector === activeSector)
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      companies = companies.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ticker.toLowerCase().includes(q)
      )
    }

    return companies
  }, [searchQuery, activeSector])

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      <PageHeader
        title="Market"
        subtitle="Explore and discover investment opportunities"
      />

      {/* Search bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08 }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Indian companies..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-1 border border-border-subtle text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-tv-cyan/30 focus:border-tv-cyan/50 transition-all"
          />
        </div>
      </motion.div>

      {/* Sector filter tabs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.12 }}
        className="flex gap-2 overflow-x-auto scrollbar-thin pb-1 -mb-1"
      >
        {SECTORS.map((sector) => (
          <button
            key={sector}
            onClick={() => setActiveSector(sector)}
            className={cn(
              'shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 min-h-[36px] flex items-center',
              activeSector === sector
                ? 'bg-tv-cyan-muted text-tv-cyan'
                : 'bg-surface-1 text-text-tertiary hover:text-text-secondary hover:bg-surface-2 border border-border-subtle'
            )}
          >
            {sector}
          </button>
        ))}
      </motion.div>

      {/* Results count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className="text-xs text-text-tertiary"
      >
        {filteredCompanies.length} {filteredCompanies.length === 1 ? 'company' : 'companies'} found
      </motion.p>

      {/* Company grid */}
      <AnimatePresence mode="wait">
        {filteredCompanies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company, i) => (
              <CompanyCard
                key={company.id}
                company={company}
                index={i}
              />
            ))}
          </div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-2 mb-4">
              <Search className="size-6 text-text-tertiary" />
            </div>
            <p className="text-sm font-medium text-text-secondary mb-1">
              No companies match your search
            </p>
            <p className="text-xs text-text-tertiary max-w-[260px]">
              Try a different name or ticker.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}