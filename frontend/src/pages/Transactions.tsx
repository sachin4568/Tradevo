import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Receipt } from 'lucide-react'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { useCompanies } from '@/hooks/useCompanies'

type FilterType = 'all' | 'buy' | 'sell'

const filterOptions: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Buy', value: 'buy' },
  { label: 'Sell', value: 'sell' },
]

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatValue(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Transactions() {
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const transactions = usePortfolioStore((s) => s.transactions)
  const { data: companies } = useCompanies()

  const companyMap = useMemo(() => {
    const map = new Map<string, string>()
    companies?.forEach((c) => map.set(c.id, c.symbol))
    return map
  }, [companies])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return transactions
    return transactions.filter((t) => t.action === activeFilter)
  }, [transactions, activeFilter])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">
          Transactions
        </h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Complete history of your investment activity
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setActiveFilter(opt.value)}
            className={`rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
              activeFilter === opt.value
                ? 'bg-accent-subtle text-accent'
                : 'border border-border text-tx-secondary hover:bg-surface-2 hover:text-tx-primary'
            }`}
          >
            {opt.label}
            {opt.value !== 'all' && (
              <span className="ml-1.5 text-[11.5px] text-tx-muted">
                (
                {transactions.filter(
                  (t) => t.action === opt.value,
                ).length}
                )
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-[12.5px] text-tx-muted">
          {transactions.length} total
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Receipt className="mb-3 h-10 w-10 text-tx-muted/40" />
            <p className="mb-1 text-[14px] font-medium text-tx-primary">
              {transactions.length === 0
                ? 'No transactions yet'
                : `No ${activeFilter} transactions`}
            </p>
            <p className="text-[13px] text-tx-muted">
              {transactions.length === 0
                ? 'Your buy and sell transactions will appear here.'
                : `You have no ${activeFilter} transactions to display.`}
            </p>
            {transactions.length === 0 && (
              <button
                onClick={() => navigate('/market')}
                className="mt-4 rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle-hover"
              >
                Explore Market
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-[12px] font-medium text-tx-muted">
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const symbol =
                    companyMap.get(tx.companyId) ?? 'Unknown'
                  const isBuy = tx.action === 'buy'
                  return (
                    <tr
                      key={tx.id}
                      className="border-b border-border-subtle transition-colors hover:bg-surface-2"
                    >
                      <td className="px-4 py-3 text-[12.5px] font-mono text-tx-muted">
                        {tx.id}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[13px] font-medium text-tx-primary">
                          {symbol}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[12px] font-medium ${
                            isBuy
                              ? 'bg-tx-success/10 text-tx-success'
                              : 'bg-tx-danger/10 text-tx-danger'
                          }`}
                        >
                          <ArrowUpDown className="h-3 w-3" />
                          {isBuy ? 'Buy' : 'Sell'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-tx-primary">
                        {tx.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-tx-secondary">
                        {formatValue(tx.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-medium text-tx-primary">
                        {formatValue(tx.total)}
                      </td>
                      <td className="px-4 py-3 text-[12.5px] text-tx-muted">
                        {formatDate(tx.timestamp)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}