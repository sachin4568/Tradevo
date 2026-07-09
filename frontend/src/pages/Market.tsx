import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, SlidersHorizontal, TrendingUp, TrendingDown, Star } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import { useWatchlistStore } from '@/stores/watchlistStore'
import Sparkline from '@/components/charts/Sparkline'
import { generateMockOHLCV } from '@/lib/mockOHLCV'
import type { Sector } from '@/types/market'

const sectors: Sector[] = [
  'All Sectors',
  'Banking',
  'IT',
  'FMCG',
  'Automobile',
  'Pharma',
  'Energy',
]

function formatPrice(value: number): string {
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatVolume(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
  return value.toString()
}

function CompanyCard({ company }: { company: any }) {
  const navigate = useNavigate()
  const watchlistIds = useWatchlistStore((s) => s.watchlistIds)
  const toggleWatchlist = useWatchlistStore((s) => s.toggle)
  const isWatched = watchlistIds.includes(company.id)
  const isPositive = company.dayChange >= 0

  // Generate sparkline data from OHLCV close prices
  const sparklineData = useMemo(() => {
    const ohlcv = generateMockOHLCV(company.id, company.currentPrice, '1W')
    return ohlcv.map(d => d.close)
  }, [company.id, company.currentPrice])

  return (
    <div className="relative rounded-xl border border-border bg-surface-1 p-4 transition-colors hover:border-border hover:bg-surface-2">
      {/* Star / Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          toggleWatchlist(company.id)
        }}
        className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-surface-2"
        title={
          isWatched ? 'Remove from watchlist' : 'Add to watchlist'
        }
      >
        <Star
          className={`h-4 w-4 ${
            isWatched
              ? 'fill-tx-warning text-tx-warning'
              : 'text-tx-muted/60 hover:text-tx-secondary'
          }`}
        />
      </button>

      {/* Clickable content */}
      <button
        onClick={() => navigate(`/market/${company.id}`)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold text-tx-primary">
            {company.symbol}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-tx-muted">
            {company.name}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[11.5px] text-tx-muted">
            <span className="rounded bg-surface-2 px-1.5 py-0.5">
              {company.sector}
            </span>
            <span>Vol: {formatVolume(company.volume)}</span>
          </div>
          {/* Sparkline */}
          <div className="mt-2">
            <Sparkline
              data={sparklineData}
              width={120}
              height={32}
              trend={isPositive ? 'up' : 'down'}
            />
          </div>
        </div>

        <div className="ml-4 shrink-0 text-right">
          <p className="text-[14px] font-semibold text-tx-primary">
            ₹{formatPrice(company.currentPrice)}
          </p>
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[12.5px] font-medium ${
              isPositive ? 'text-tx-success' : 'text-tx-danger'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>
              {isPositive ? '+' : ''}
              {company.dayChange.toFixed(2)} ({isPositive ? '+' : ''}
              {company.dayChangePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </button>
    </div>
  )
}

export default function Market() {
  const [search, setSearch] = useState('')
  const [activeSector, setActiveSector] = useState<Sector>('All Sectors')
  const { data: companies, isLoading, error } = useCompanies()

  const filtered = useMemo(() => {
    if (!companies) return []
    let result = companies

    if (activeSector !== 'All Sectors') {
      result = result.filter((c) => c.sector === activeSector)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.symbol.toLowerCase().includes(q) ||
          c.sector.toLowerCase().includes(q),
      )
    }

    return result
  }, [companies, search, activeSector])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Market</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Explore companies and market data
        </p>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border-subtle bg-surface-input px-3 py-2">
          <Search className="h-4 w-4 text-tx-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name or symbol..."
            className="flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-tx-muted"
          />
        </div>
        <button className="flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-[13px] font-medium text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Sector tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sectors.map((sector) => (
          <button
            key={sector}
            onClick={() => setActiveSector(sector)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
              sector === activeSector
                ? 'bg-accent-subtle text-accent'
                : 'border border-border-subtle text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-20">
          <p className="text-[14px] font-medium text-tx-danger">
            Failed to load companies
          </p>
          <p className="mt-1 text-[13px] text-tx-muted">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-20">
          <p className="text-[14px] font-medium text-tx-primary">
            No companies found
          </p>
          <p className="mt-1 text-[13px] text-tx-muted">
            {search
              ? `No results for "${search}"`
              : `No companies in ${activeSector}`}
          </p>
        </div>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  )
}