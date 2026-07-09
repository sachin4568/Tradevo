import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  PieChart,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Wallet,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { usePortfolio } from '@/hooks/usePortfolio'
import { usePortfolioAllocation } from '@/hooks/usePortfolioAllocation'
import { usePortfolioReview, useRiskSummary } from '@/hooks/useAIDecision'
import { AISectionLoader } from '@/components/shared/AISectionLoader'
import { AIInsightCard } from '@/components/shared/AIInsightCard'
import MarkdownContent from '@/components/shared/MarkdownContent'
import AllocationDonut from '@/components/charts/AllocationDonut'
import ProfessionalChart from '@/components/charts/ProfessionalChart'
import { generatePortfolioLineData, generateMockOHLCV } from '@/lib/mockOHLCV'
import type { TimelineFilter } from '@/types/chart'

function formatValue(value: number): string {
  return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Portfolio() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const portfolio = usePortfolio()
  const allocationData = usePortfolioAllocation()
  const [timeline, setTimeline] = useState<TimelineFilter>('1M')
  const {
    data: reviewData,
    isLoading: reviewLoading,
    isError: reviewError,
  } = usePortfolioReview()
  const {
    data: riskData,
    isLoading: riskLoading,
    isError: riskError,
  } = useRiskSummary()

  // Line chart data for portfolio
  const lineData = useMemo(() => {
    return generatePortfolioLineData(portfolio.totalValue || 1000000, timeline)
  }, [portfolio.totalValue, timeline])

  // OHLCV data for the chart component (used only if candlestick mode, but portfolio forces line)
  const ohlcvData = useMemo(() => {
    return generateMockOHLCV('portfolio', portfolio.totalValue || 1000000, timeline)
  }, [portfolio.totalValue, timeline])

  const handleRetryAI = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-decision', 'portfolio-review'] })
    queryClient.invalidateQueries({ queryKey: ['ai-decision', 'risk-summary'] })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Portfolio</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">Your investment holdings and performance</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="mb-1 text-[12px] text-tx-muted">Current Value</p>
          <p className="text-xl font-semibold text-tx-primary">
            {portfolio.isEmpty ? '₹--' : formatValue(portfolio.totalValue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="mb-1 text-[12px] text-tx-muted">Total Invested</p>
          <p className="text-xl font-semibold text-tx-primary">
            {portfolio.isEmpty ? '₹--' : formatValue(portfolio.totalInvested)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="mb-1 text-[12px] text-tx-muted">Total P&L</p>
          <p className={`text-xl font-semibold ${portfolio.isEmpty ? 'text-tx-muted' : portfolio.totalPnL >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}>
            {portfolio.isEmpty ? '₹--' : `${portfolio.totalPnL >= 0 ? '+' : ''}${formatValue(portfolio.totalPnL)}`}
          </p>
          {!portfolio.isEmpty && (
            <p className={`mt-0.5 text-[12px] ${portfolio.totalPnLPercent >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}>
              {portfolio.totalPnLPercent >= 0 ? '+' : ''}{portfolio.totalPnLPercent.toFixed(2)}%
            </p>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface-1 p-4">
          <p className="mb-1 text-[12px] text-tx-muted">Day Change</p>
          <p className={`text-xl font-semibold ${portfolio.isEmpty ? 'text-tx-muted' : portfolio.totalDayPnL >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}>
            {portfolio.isEmpty ? '₹--' : `${portfolio.totalDayPnL >= 0 ? '+' : ''}${formatValue(portfolio.totalDayPnL)}`}
          </p>
        </div>
      </div>

      {/* Virtual Cash */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 px-4 py-3">
        <Wallet className="h-4 w-4 text-tx-muted" />
        <span className="text-[12.5px] text-tx-muted">Virtual Cash Available</span>
        <span className="ml-auto text-[14px] font-semibold text-tx-primary">{formatValue(portfolio.virtualCash)}</span>
      </div>

      {/* Portfolio Line Chart — full width, Groww-style */}
      <div className="rounded-xl border border-border bg-surface-1 p-4">
        <ProfessionalChart
          ohlcvData={ohlcvData}
          lineData={lineData}
          height={360}
          defaultMode="line"
          defaultTimeline={timeline}
          showChartTypeToggle={false}
          showTimeline={true}
          isPortfolio={true}
          onTimelineChange={setTimeline}
        />
      </div>

      {/* Allocation Donut */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-tx-primary">Sector Allocation</h3>
        </div>
        <div className="p-4">
          <AllocationDonut data={allocationData} height={220} />
        </div>
      </div>

      {/* AI Portfolio Review */}
      <AISectionLoader isLoading={reviewLoading} isError={reviewError} onRetry={handleRetryAI} hasData={!!reviewData} showWhenEmpty={false}>
        {reviewData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-accent" />
              <h2 className="text-[14px] font-semibold text-tx-primary">Portfolio Characteristics</h2>
            </div>
            <AIInsightCard heading="Portfolio Overview" body={reviewData.characteristics} provenance={reviewData.provenance} category="portfolio" />
            {reviewData.sectorObservations.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <h3 className="mb-3 text-[13px] font-semibold text-tx-primary">Sector Breakdown</h3>
                <div className="space-y-3">
                  {reviewData.sectorObservations.map((obs, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-[11px] font-semibold text-accent">{obs.allocationPercent}%</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-tx-primary">{obs.sector}</p>
                        <p className="mt-0.5 text-[12px] leading-relaxed text-tx-secondary">{obs.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {reviewData.observations.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <h3 className="mb-2.5 text-[13px] font-semibold text-tx-primary">Noteworthy Observations</h3>
                <ul className="space-y-2">
                  {reviewData.observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <p className="text-[12.5px] leading-relaxed text-tx-secondary">{obs}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {reviewData.educationalNote && (
              <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-4">
                <p className="mb-1.5 text-[12px] font-medium text-tx-muted">Educational Context</p>
                <div className="text-[12.5px] leading-relaxed text-tx-secondary"><MarkdownContent content={reviewData.educationalNote} /></div>
              </div>
            )}
          </div>
        )}
      </AISectionLoader>

      {/* AI Risk Summary */}
      <AISectionLoader isLoading={riskLoading} isError={riskError} onRetry={handleRetryAI} hasData={!!riskData} showWhenEmpty={false}>
        {riskData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-accent" />
              <h2 className="text-[14px] font-semibold text-tx-primary">Risk Characteristics</h2>
            </div>
            <AIInsightCard heading="Risk Profile Overview" body={riskData.riskProfile} provenance={riskData.provenance} category="risk" />
            {riskData.observations.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <h3 className="mb-2.5 text-[13px] font-semibold text-tx-primary">Risk Observations</h3>
                <ul className="space-y-2">
                  {riskData.observations.map((obs, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <p className="text-[12.5px] leading-relaxed text-tx-secondary">{obs}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {riskData.considerations.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-4">
                <p className="mb-1.5 text-[12px] font-medium text-tx-muted">Concepts to Explore</p>
                <ul className="space-y-2">
                  {riskData.considerations.map((c, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-tx-muted" />
                      <p className="text-[12.5px] leading-relaxed text-tx-secondary">{c}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </AISectionLoader>

      {/* Holdings Table */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-tx-primary">Holdings</h3>
          <span className="text-[12px] text-tx-muted">{portfolio.holdingsWithDetails.length} {portfolio.holdingsWithDetails.length === 1 ? 'stock' : 'stocks'}</span>
        </div>
        {portfolio.isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PieChart className="mb-3 h-10 w-10 text-tx-muted/40" />
            <p className="mb-1 text-[14px] font-medium text-tx-primary">No holdings yet</p>
            <p className="mb-4 text-[13px] text-tx-muted">Start investing to see your holdings here.</p>
            <button onClick={() => navigate('/market')} className="flex items-center gap-1.5 rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle-hover">
              Explore Market <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-[12px] font-medium text-tx-muted">
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-right">Qty</th>
                  <th className="px-4 py-3 text-right">Avg Price</th>
                  <th className="px-4 py-3 text-right">LTP</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3 text-right">Current Value</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.holdingsWithDetails.map((h) => {
                  const isUp = h.pnl >= 0
                  return (
                    <tr key={h.companyId} className="border-b border-border-subtle transition-colors hover:bg-surface-2">
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/market/${h.companyId}`)} className="text-left">
                          <p className="text-[13px] font-medium text-tx-primary">{h.company.symbol}</p>
                          <p className="text-[11.5px] text-tx-muted">{h.company.sector}</p>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] text-tx-primary">{h.quantity}</td>
                      <td className="px-4 py-3 text-right text-[13px] text-tx-secondary">{formatValue(h.avgPrice)}</td>
                      <td className="px-4 py-3 text-right text-[13px] text-tx-primary">{formatValue(h.currentPrice)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isUp ? <TrendingUp className="h-3 w-3 text-tx-success" /> : <TrendingDown className="h-3 w-3 text-tx-danger" />}
                          <span className={`text-[13px] font-medium ${isUp ? 'text-tx-success' : 'text-tx-danger'}`}>{isUp ? '+' : ''}{formatValue(h.pnl)}</span>
                          <span className={`ml-1 text-[11.5px] ${isUp ? 'text-tx-success/70' : 'text-tx-danger/70'}`}>({isUp ? '+' : ''}{h.pnlPercent.toFixed(2)}%)</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[13px] font-medium text-tx-primary">{formatValue(h.currentValue)}</td>
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