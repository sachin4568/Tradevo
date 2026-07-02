import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useCompanies } from '@/hooks/useCompanies'
import CompanyCard from '@/components/cards/CompanyCard'
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