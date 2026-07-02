import { useNavigate } from 'react-router-dom'
import { Eye, Star } from 'lucide-react'
import { useWatchlist } from '@/hooks/useWatchlist'

export default function Watchlist() {
  const navigate = useNavigate()
  const { companies: watchlistCompanies } = useWatchlist()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">
          Watchlist
        </h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          {watchlistCompanies.length > 0
            ? `${watchlistCompanies.length} compan${watchlistCompanies.length === 1 ? 'y' : 'ies'} tracked`
            : 'Track companies you are interested in'}
        </p>
      </div>

      {watchlistCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface-1 py-20">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2">
            <Star className="h-6 w-6 text-tx-muted/60" />
          </div>
          <h3 className="mb-1 text-[14px] font-medium text-tx-primary">
            Your watchlist is empty
          </h3>
          <p className="mb-5 max-w-xs text-center text-[13px] text-tx-muted">
            Star companies from the Market page to track them here.
          </p>
          <button
            onClick={() => navigate('/market')}
            className="rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle-hover"
          >
            Browse Market
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {watchlistCompanies.map((c) => {
            const isUp = c.dayChange >= 0
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/market/${c.id}`)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-1 p-4 text-left transition-colors hover:border-border hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 shrink-0 text-tx-muted" />
                    <p className="truncate text-[13.5px] font-semibold text-tx-primary">
                      {c.symbol}
                    </p>
                    <span className="shrink-0 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-tx-muted">
                      {c.sector}
                    </span>
                  </div>
                  <p className="mt-0.5 pl-[22px] truncate text-[12px] text-tx-muted">
                    {c.name}
                  </p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <p className="text-[14px] font-semibold text-tx-primary">
                    ₹
                    {c.currentPrice.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p
                    className={`mt-0.5 text-[12.5px] font-medium ${isUp ? 'text-tx-success' : 'text-tx-danger'}`}
                  >
                    {isUp ? '+' : ''}
                    {c.dayChange.toFixed(2)} ({isUp ? '+' : ''}
                    {c.dayChangePercent.toFixed(2)}%)
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}