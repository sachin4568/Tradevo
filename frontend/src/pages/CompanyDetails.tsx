import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Newspaper,
  DollarSign,
  FileText,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { useCompany } from '@/hooks/useCompanies'
import OrderModal from '@/components/modals/OrderModal'
import { getAvailableReportCompanies } from '@/data/research'
import { usePortfolioStore } from '@/stores/portfolioStore'

function formatCurrency(value: number): string {
  if (value >= 1000)
    return `₹${(value / 1000).toFixed(1)}K Cr`
  return `₹${value.toLocaleString('en-IN')} Cr`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2 px-3.5 py-2.5">
      <span className="text-[12.5px] text-tx-muted">{label}</span>
      <span className="text-[13px] font-medium text-tx-primary">
        {value}
      </span>
    </div>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Icon className="h-4 w-4 text-tx-muted" />
        <h3 className="text-[13px] font-semibold text-tx-primary">
          {title}
        </h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export default function CompanyDetails() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const { data: company, isLoading, error } = useCompany(companyId ?? '')
  const hasReport = companyId ? getAvailableReportCompanies().some((r) => r.companyId === companyId) : false
  const holdings = usePortfolioStore((s) => s.holdings)
  const [orderModal, setOrderModal] = useState<{
    open: boolean
    action: 'buy' | 'sell'
  }>({ open: false, action: 'buy' })

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (error || !company) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-tx-danger">
          Company not found
        </p>
        <button
          onClick={() => navigate('/market')}
          className="mt-2 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Back to Market
        </button>
      </div>
    )
  }

  const isPositive = company.dayChange >= 0
  const holding = holdings.find((h) => h.companyId === company.id)
  const canSell = holding && holding.quantity > 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/market')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-tx-primary">
              {company.name}
            </h1>
            <span className="shrink-0 rounded bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-tx-muted">
              {company.exchange}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-[13px] text-tx-muted">
            <span>{company.symbol}</span>
            <span>&middot;</span>
            <span>{company.sector}</span>
            <span>&middot;</span>
            <span>{company.industry}</span>
          </div>
        </div>
      </div>

      {/* Price + Actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-1 p-4 lg:col-span-2">
          <p className="text-[12px] text-tx-muted">Current Price</p>
          <div className="mt-1 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-tx-primary">
              ₹
              {company.currentPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </span>
            <span
              className={`flex items-center gap-1 text-[14px] font-medium ${
                isPositive ? 'text-tx-success' : 'text-tx-danger'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {isPositive ? '+' : ''}
              {company.dayChange.toFixed(2)} ({isPositive ? '+' : ''}
              {company.dayChangePercent.toFixed(2)}%)
            </span>
          </div>
          {holding && (
            <p className="mt-1.5 text-[12px] text-tx-muted">
              You hold{' '}
              <span className="font-medium text-tx-secondary">
                {holding.quantity} shares
              </span>{' '}
              at avg ₹
              {holding.avgPrice.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
              })}
            </p>
          )}
          <div className="mt-4 flex h-[200px] items-center justify-center rounded-lg bg-surface-2">
            <p className="text-[13px] text-tx-muted">
              Price chart loads with real-time data
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => setOrderModal({ open: true, action: 'buy' })}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-tx-success py-2.5 text-[13.5px] font-semibold text-surface-0 transition-colors hover:bg-tx-success/90"
          >
            <TrendingUp className="h-4 w-4" />
            Buy
          </button>
          <button
            onClick={() =>
              setOrderModal({ open: true, action: 'sell' })
            }
            disabled={!canSell}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors ${
              canSell
                ? 'bg-tx-danger text-surface-0 hover:bg-tx-danger/90'
                : 'bg-tx-danger/10 text-tx-danger/40 cursor-not-allowed'
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            Sell
          </button>
          <button
            disabled={!hasReport}
            onClick={() =>
              hasReport && navigate(`/research/${companyId}`)
            }
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13.5px] font-semibold transition-colors ${
              hasReport
                ? 'bg-accent-subtle text-accent hover:bg-accent-subtle-hover cursor-pointer'
                : 'bg-accent-subtle/20 text-accent/30 cursor-not-allowed'
            }`
          }
          >
            <FileText className="h-4 w-4" />
            Deep Research
          </button>
        </div>
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Company Overview */}
        <Section icon={Building2} title="Company Overview">
          <div className="space-y-3">
            <p className="text-[13px] leading-relaxed text-tx-secondary">
              {company.description}
            </p>
            <div className="flex items-center gap-4 text-[12px] text-tx-muted">
              <span>Founded: {company.foundedYear}</span>
              <span>
                Employees:{' '}
                {company.employees.toLocaleString('en-IN')}
              </span>
            </div>
            <a
              href={`https://${company.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:text-accent-hover"
            >
              {company.website}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </Section>

        {/* Basic Statistics */}
        <Section icon={BarChart3} title="Basic Statistics">
          <div className="space-y-2">
            <StatRow
              label="Market Cap"
              value={`₹${company.marketCap}`}
            />
            <StatRow label="P/E Ratio" value={company.pe.toString()} />
            <StatRow label="P/B Ratio" value={company.pb.toString()} />
            <StatRow
              label="Dividend Yield"
              value={formatPercent(company.dividendYield)}
            />
            <StatRow
              label="Volume"
              value={company.volume.toLocaleString('en-IN')}
            />
            <StatRow
              label="52W High"
              value={`₹${company.week52High.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            />
            <StatRow
              label="52W Low"
              value={`₹${company.week52Low.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            />
            <StatRow
              label="Prev Close"
              value={`₹${company.previousClose.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
            />
          </div>
        </Section>

        {/* Key Metrics */}
        <Section icon={DollarSign} title="Key Metrics">
          <div className="space-y-2">
            <StatRow
              label="Revenue"
              value={formatCurrency(company.financials.revenue)}
            />
            <StatRow
              label="Net Profit"
              value={formatCurrency(company.financials.netProfit)}
            />
            <StatRow
              label="Debt"
              value={formatCurrency(company.financials.debt)}
            />
            <StatRow
              label="Cash Flow"
              value={formatCurrency(company.financials.cashFlow)}
            />
            <StatRow
              label="ROE"
              value={formatPercent(company.financials.roe)}
            />
            <StatRow
              label="ROA"
              value={formatPercent(company.financials.roa)}
            />
            <StatRow
              label="Promotor Holding"
              value={formatPercent(
                company.financials.promotorHolding,
              )}
            />
            <StatRow
              label="Inst. Holding"
              value={formatPercent(
                company.financials.institutionalHolding,
              )}
            />
          </div>
        </Section>

        {/* News */}
        <Section icon={Newspaper} title="News">
          {company.news.length > 0 ? (
            <div className="space-y-3">
              {company.news.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border-subtle bg-surface-2 p-3"
                >
                  <p className="text-[13px] font-medium leading-snug text-tx-primary">
                    {item.headline}
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-tx-muted">
                    {item.summary}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-tx-muted">
                    <span>{item.source}</span>
                    <span>&middot;</span>
                    <span>{formatDate(item.publishedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-[13px] text-tx-muted">
                No news available.
              </p>
            </div>
          )}
        </Section>
      </div>

      {/* Order Modal */}
      {orderModal.open && (
        <OrderModal
          companyId={company.id}
          action={orderModal.action}
          onClose={() =>
            setOrderModal({ open: false, action: 'buy' })
          }
        />
      )}
    </div>
  )
}