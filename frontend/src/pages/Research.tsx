import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  FileSearch,
  TrendingUp,
  Brain,
  Search,
  ArrowRight,
  X,
  TrendingUp as TrendIcon,
  TrendingDown,
  Minus,
  Compass,
} from 'lucide-react'
import {
  useMarketIntelligence,
  useSectorAnalysis,
  useResearchHistory,
} from '@/hooks/useResearch'
import { useOpportunityScan } from '@/hooks/useAIDecision'
import { useCompanies } from '@/hooks/useCompanies'
import { getAvailableReportCompanies } from '@/data/research'
import ResearchCard from '@/components/cards/ResearchCard'
import MarkdownContent from '@/components/shared/MarkdownContent'
import { AISectionLoader } from '@/components/shared/AISectionLoader'
import type { Outlook } from '@/types/research'

// ─── Helpers ───

const sentimentColors: Record<string, string> = {
  positive: 'text-tx-success',
  negative: 'text-tx-danger',
  neutral: 'text-tx-warning',
}

const outlookConfig: Record<Outlook, { color: string; bg: string; icon: React.ElementType }> = {
  bullish: { color: 'text-tx-success', bg: 'bg-tx-success/10', icon: TrendingUp },
  bearish: { color: 'text-tx-danger', bg: 'bg-tx-danger/10', icon: TrendingDown },
  neutral: { color: 'text-tx-warning', bg: 'bg-tx-warning/10', icon: Minus },
}

const trendIcons: Record<string, React.ElementType> = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

// ─── Main Page ───

export default function Research() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  const { data: marketIntel, isLoading: miLoading } = useMarketIntelligence()
  const { data: sectors, isLoading: secLoading } = useSectorAnalysis()
  const { history, count: historyCount } = useResearchHistory()
  const { data: companies } = useCompanies()
  const { data: oppData, isLoading: oppLoading, isError: oppError } = useOpportunityScan()

  const availableReports = useMemo(
    () => getAvailableReportCompanies(),
    [],
  )

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !companies) return []
    const q = searchQuery.toLowerCase()
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.sector.toLowerCase().includes(q),
    )
  }, [searchQuery, companies])

  function handleSearchSelect(companyId: string) {
    setSearchOpen(false)
    setSearchQuery('')
    navigate(`/research/${companyId}`)
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Research</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          AI-powered investment research and market intelligence
        </p>
      </div>

      {/* Quick actions row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Company Search CTA */}
        <div className="relative">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex w-full items-center gap-3 rounded-xl border border-accent/20 bg-accent-subtle p-4 text-left transition-colors hover:bg-accent-subtle-hover"
          >
            <Search className="h-5 w-5 shrink-0 text-accent" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-semibold text-tx-primary">
                Research a Company
              </p>
              <p className="mt-0.5 text-[12px] text-tx-secondary">
                Search and generate a research report
              </p>
            </div>
          </button>

          {/* Search dropdown */}
          {searchOpen && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-border bg-surface-1 shadow-xl">
              <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                <Search className="h-4 w-4 text-tx-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, symbol, or sector..."
                  className="flex-1 bg-transparent text-[13px] text-tx-primary placeholder:text-tx-muted focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setSearchOpen(false)
                    setSearchQuery('')
                  }}
                  className="text-tx-muted hover:text-tx-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto p-1.5">
                {searchResults.length === 0 ? (
                  <p className="px-2 py-4 text-center text-[13px] text-tx-muted">
                    No companies found
                  </p>
                ) : (
                  searchResults.map((c) => {
                    const hasReport = availableReports.some(
                      (r) => r.companyId === c.id,
                    )
                    return (
                      <button
                        key={c.id}
                        onClick={() => handleSearchSelect(c.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-2"
                      >
                        <div>
                          <span className="text-[13px] font-medium text-tx-primary">
                            {c.name}
                          </span>
                          <span className="ml-2 text-[12px] text-tx-muted">
                            {c.symbol}
                          </span>
                        </div>
                        {hasReport ? (
                          <span className="text-[11px] text-accent">
                            View Report
                          </span>
                        ) : (
                          <span className="text-[11px] text-tx-muted">
                            Coming Soon
                          </span>
                        )}
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
          <TrendIcon className="h-5 w-5 shrink-0 text-tx-muted" />
          <div>
            <p className="text-[13.5px] font-semibold text-tx-primary">
              Market Intelligence
            </p>
            <p className="mt-0.5 text-[12px] text-tx-muted">
              Overview of current market conditions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-1 p-4">
          <Brain className="h-5 w-5 shrink-0 text-tx-muted" />
          <div>
            <p className="text-[13.5px] font-semibold text-tx-primary">
              Sector Analysis
            </p>
            <p className="mt-0.5 text-[12px] text-tx-muted">
              Sector-wise opportunities and risks
            </p>
          </div>
        </div>
      </div>

      {/* Market Intelligence */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <TrendIcon className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Market Intelligence
          </h3>
        </div>
        <div className="p-4">
          {miLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
            </div>
          ) : marketIntel ? (
            <div className="space-y-4">
              {/* Summary */}
              <div className="rounded-lg bg-surface-2 p-4">
                <div className="text-[13px] leading-relaxed text-tx-secondary">
                  <MarkdownContent content={marketIntel.summary} />
                </div>
              </div>

              {/* Key indices + economic indicators */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Indices */}
                <div>
                  <p className="mb-2 text-[12px] font-medium text-tx-secondary">
                    Key Indices
                  </p>
                  <div className="space-y-1.5">
                    {marketIntel.keyIndices.map((idx) => (
                      <div
                        key={idx.name}
                        className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2 px-3 py-2"
                      >
                        <span className="text-[12.5px] font-medium text-tx-primary">
                          {idx.name}
                        </span>
                        <div className="text-right">
                          <span className="block text-[12px] text-tx-secondary">
                            {idx.value.toLocaleString('en-IN', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                          <span
                            className={`text-[11.5px] font-medium ${sentimentColors[idx.sentiment]}`}
                          >
                            {idx.change >= 0 ? '+' : ''}
                            {idx.change.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Economic Indicators */}
                <div>
                  <p className="mb-2 text-[12px] font-medium text-tx-secondary">
                    Economic Indicators
                  </p>
                  <div className="space-y-1.5">
                    {marketIntel.economicIndicators.map((ind) => {
                      const TIcon = trendIcons[ind.trend] ?? Minus
                      return (
                        <div
                          key={ind.name}
                          className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-2 px-3 py-2"
                        >
                          <span className="text-[12.5px] text-tx-secondary">
                            {ind.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[12px] font-medium text-tx-primary">
                              {ind.value}
                            </span>
                            <TIcon
                              className={`h-3 w-3 ${ind.trend === 'up' ? 'text-tx-success' : ind.trend === 'down' ? 'text-tx-danger' : 'text-tx-warning'}`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-tx-muted">
              Unable to load market intelligence.
            </div>
          )}
        </div>
      </div>

      {/* Sector Analysis */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Brain className="h-4 w-4 text-tx-muted" />
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Sector Analysis
          </h3>
        </div>
        <div className="p-4">
          {secLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
            </div>
          ) : sectors ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {sectors.map((sector) => {
                const cfg = outlookConfig[sector.outlook]
                const SIcon = cfg.icon
                return (
                  <div
                    key={sector.sector}
                    className="rounded-xl border border-border-subtle bg-surface-2 p-4"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <p className="text-[13px] font-semibold text-tx-primary">
                          {sector.sector}
                        </p>
                        <p className="mt-0.5 text-[12px] text-tx-muted">
                          {sector.performance}
                        </p>
                      </div>
                      <span
                        className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${cfg.color} ${cfg.bg}`}
                      >
                        <SIcon className="h-3 w-3" />
                        {sector.outlook}
                      </span>
                    </div>

                    <div className="mb-3 space-y-1.5">
                      <div>
                        <p className="text-[11px] font-medium text-tx-success">
                          Opportunities
                        </p>
                        {sector.opportunities.map((o, i) => (
                          <p
                            key={i}
                            className="text-[12px] text-tx-secondary"
                          >
                            {o}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-tx-danger">
                          Risks
                        </p>
                        {sector.risks.map((r, i) => (
                          <p
                            key={i}
                            className="text-[12px] text-tx-secondary"
                          >
                            {r}
                          </p>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11.5px] text-tx-muted">
                      <span className="font-medium">Top stocks:</span>
                      {sector.topStocks.map((s, i) => (
                        <span key={i}>
                          {s}
                          {i < sector.topStocks.length - 1 && ','}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-[13px] text-tx-muted">
              Unable to load sector analysis.
            </div>
          )}
        </div>
      </div>

      {/* AI Opportunity Scan — optional, graceful degradation */}
      <AISectionLoader
        isLoading={oppLoading}
        isError={oppError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['ai-decision', 'opportunity-scan'] })}
        hasData={!!oppData}
        showWhenEmpty={false}
      >
        {oppData && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-accent" />
              <h2 className="text-[14px] font-semibold text-tx-primary">
                Learning Opportunities
              </h2>
            </div>
            {oppData.reasoning && (
              <p className="text-[12.5px] leading-relaxed text-tx-secondary">
                {oppData.reasoning}
              </p>
            )}
            <div className="space-y-2">
              {oppData.opportunities.map((opp, i) => (
                <button
                  key={i}
                  onClick={() => navigate(`/market/${opp.companyId}`)}
                  className="flex w-full items-start gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left transition-colors hover:border-accent/30 hover:bg-surface-2"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-subtle">
                    <span className="text-[12px] font-bold text-accent">{opp.symbol.slice(0, 2)}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-semibold text-tx-primary">{opp.companyName}</p>
                      <span className="text-[11.5px] text-tx-muted">{opp.symbol}</span>
                    </div>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-tx-secondary">{opp.reason}</p>
                    <p className="mt-1.5 text-[11.5px] text-tx-muted">{opp.relevance}</p>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-tx-muted" />
                </button>
              ))}
            </div>
            <div className="border-t border-border/50 pt-2.5">
              <p className="text-[11px] text-tx-muted">{oppData.provenance.reason}</p>
              <p className="mt-0.5 text-[11px] text-tx-muted/70">
                Data sources: {oppData.provenance.dataSources.join(', ')}
              </p>
            </div>
          </div>
        )}
      </AISectionLoader>

      {/* Research History */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Research History
          </h3>
          {historyCount > 0 && (
            <span className="text-[12px] text-tx-muted">
              {historyCount} report{historyCount !== 1 ? 's' : ''} viewed
            </span>
          )}
        </div>
        <div className="p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileSearch className="mb-3 h-10 w-10 text-tx-muted/40" />
              <p className="mb-1 text-[14px] font-medium text-tx-primary">
                No research reports viewed yet
              </p>
              <p className="mb-5 max-w-sm text-[13px] text-tx-muted">
                Search for a company above or select one from the Market page
                to view an AI-powered research report.
              </p>
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-accent-subtle-hover"
              >
                Search Company
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => {
                const company = companies?.find((c) => c.id === item.companyId)
                if (!company) return null
                return (
                  <ResearchCard
                    key={item.companyId}
                    companyId={company.id}
                    companyName={company.name}
                    symbol={company.symbol}
                    sector={company.sector}
                    viewedAt={item.viewedAt}
                    analysisCoverage={0}
                    outlook="neutral"
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}