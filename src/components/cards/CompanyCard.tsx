import { useNavigate } from 'react-router-dom'
import { TrendingUp, TrendingDown, Star } from 'lucide-react'
import type { Company } from '@/types/company'
import { useWatchlistStore } from '@/stores/watchlistStore'

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

export default function CompanyCard({ company }: { company: Company }) {
  const navigate = useNavigate()
  const watchlistIds = useWatchlistStore((s) => s.watchlistIds)
  const toggleWatchlist = useWatchlistStore((s) => s.toggle)
  const isWatched = watchlistIds.includes(company.id)
  const isPositive = company.dayChange >= 0

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