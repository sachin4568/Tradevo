import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft, TrendingUp, TrendingDown, Star, ExternalLink,
  BarChart3, DollarSign, Newspaper, Building2, Globe, Users,
  Calendar, Shield, Target, Activity, Brain, ChevronDown,
} from 'lucide-react'
import { useCompany } from '@/hooks/useCompanies'
import { usePortfolioStore } from '@/stores/portfolioStore'
import ProfessionalChart from '@/components/charts/ProfessionalChart'
import TradePanel from '@/components/trade/TradePanel'
import { generateMockOHLCV } from '@/lib/mockOHLCV'
import type { TimelineFilter } from '@/types/chart'

/* ─── Helpers ─── */

function fmt(v: number) { return v.toLocaleString('en-IN', { minimumFractionDigits: 2 }) }
function fmtCompact(v: number) {
  if (v >= 10000000) return '₹' + (v / 10000000).toFixed(2) + ' Cr'
  if (v >= 100000) return '₹' + (v / 100000).toFixed(2) + ' L'
  return '₹' + fmt(v)
}

/* ─── Compact Metric Card (Groww-style) ─── */

function MetricCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-2">
      <p className="text-[11px] text-tx-muted">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold text-tx-primary">{value}</p>
      {sub && <p className="text-[10.5px] text-tx-muted">{sub}</p>}
    </div>
  )
}

/* ─── Tab type ─── */
type TabId = 'stats' | 'financials' | 'news' | 'fundamentals' | 'about' | 'ai'

const TABS: { id: TabId; label: string }[] = [
  { id: 'stats', label: 'Key Statistics' },
  { id: 'financials', label: 'Financials' },
  { id: 'news', label: 'News' },
  { id: 'fundamentals', label: 'Fundamentals' },
  { id: 'about', label: 'About Company' },
  { id: 'ai', label: 'AI Analysis' },
]

/* ─── AI Panel (right side) ─── */

function AIPanel({ company, onOpenResearch }: { company: any; onOpenResearch: () => void }) {
  const isUp = company.dayChange >= 0
  const score = 72
  const riskLevel = 'Moderate'

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface-1 overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <span className="text-[12.5px] font-semibold text-tx-primary">AI Summary</span>
        </div>
        <span className="text-[11px] text-tx-muted">Confidence: {score}%</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Score */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-[16px] font-bold"
            style={{ borderColor: score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171', color: score >= 70 ? '#34d399' : score >= 50 ? '#fbbf24' : '#f87171' }}>
            {score}
          </div>
          <div>
            <p className="text-[12px] font-medium text-tx-primary">AI Score</p>
            <p className="text-[11px] text-tx-muted">{score >= 70 ? 'Bullish' : score >= 50 ? 'Neutral' : 'Bearish'} Outlook</p>
          </div>
        </div>

        {/* Risk Meter */}
        <div>
          <p className="text-[11px] font-semibold text-tx-muted mb-1.5">Risk Level</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3">
            <div className="h-full rounded-full transition-all" style={{ width: '55%', background: 'linear-gradient(90deg, #34d399, #fbbf24)' }} />
          </div>
          <p className="mt-1 text-[11px] text-tx-secondary">{riskLevel}</p>
        </div>

        {/* Bull/Bear Cases */}
        <div className="space-y-2.5">
          <div className="rounded-lg bg-tx-success/5 border border-tx-success/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-tx-success mb-1">Bull Case</p>
            <p className="text-[11.5px] leading-relaxed text-tx-secondary">
              Strong institutional buying. Breakout above 200-DMA. Sector tailwinds from government policy. ROE expansion trend.
            </p>
          </div>
          <div className="rounded-lg bg-tx-danger/5 border border-tx-danger/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-tx-danger mb-1">Bear Case</p>
            <p className="text-[11.5px] leading-relaxed text-tx-secondary">
              Global headwinds. Rising input costs. Valuation premium vs peers. FII selling in recent sessions.
            </p>
          </div>
        </div>

        {/* Technical Signals */}
        <div>
          <p className="text-[11px] font-semibold text-tx-muted mb-2">Technical Signals</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'RSI', value: '62', good: true },
              { label: 'MACD', value: 'Bullish', good: true },
              { label: 'MA-20', value: 'Above', good: true },
              { label: 'MA-50', value: 'Above', good: true },
              { label: 'Volume', value: 'High', good: true },
              { label: 'Trend', value: 'Up', good: true },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between rounded bg-surface-2 px-2.5 py-1.5">
                <span className="text-[10.5px] text-tx-muted">{s.label}</span>
                <span className={`text-[10.5px] font-medium ${s.good ? 'text-tx-success' : 'text-tx-danger'}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fundamental Signals */}
        <div>
          <p className="text-[11px] font-semibold text-tx-muted mb-2">Fundamental Signals</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'P/E vs Sector', value: 'Premium' },
              { label: 'Debt/Equity', value: 'Low' },
              { label: 'Dividend', value: 'Yield 1.2%' },
              { label: 'Promoter', value: 'Increasing' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between rounded bg-surface-2 px-2.5 py-1.5">
                <span className="text-[10.5px] text-tx-muted">{s.label}</span>
                <span className="text-[10.5px] font-medium text-tx-primary">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Deep Research CTA */}
      <div className="border-t border-border p-3">
        <button
          onClick={onOpenResearch}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-subtle py-2 text-[12px] font-semibold text-accent transition-colors hover:bg-accent-subtle-hover"
        >
          <Brain className="h-3.5 w-3.5" /> View Full AI Research
        </button>
      </div>
    </div>
  )
}

/* ─── Main Component ─── */

export default function CompanyDetails() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const { data: company, isLoading } = useCompany(companyId ?? '')
  const holdings = usePortfolioStore(s => s.holdings)
  const [timeline, setTimeline] = useState<TimelineFilter>('1M')
  const [tradePanelOpen, setTradePanelOpen] = useState(false)
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy')
  const [activeTab, setActiveTab] = useState<TabId>('stats')
  const [indicatorsOpen, setIndicatorsOpen] = useState(false)
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['Volume'])

  const toggleIndicator = (name: string) => {
    setSelectedIndicators(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  const ohlcvData = useMemo(() => {
    if (!company) return []
    return generateMockOHLCV(company.id, company.currentPrice, timeline)
  }, [company, timeline])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-tx-danger">Company not found</p>
        <button onClick={() => navigate('/market')} className="mt-2 text-[13px] font-medium text-accent hover:text-accent-hover">Back to Market</button>
      </div>
    )
  }

  const isPositive = company.dayChange >= 0
  const holding = holdings.find(h => h.companyId === company.id)

  const handleBuy = () => { setTradeAction('buy'); setTradePanelOpen(true) }
  const handleSell = () => { setTradeAction('sell'); setTradePanelOpen(true) }
  const handleResearch = () => navigate(`/research/${companyId}`)

  return (
    <div className="-mx-2">
      {/* ─── Company Header ─── */}
      <div className="flex items-start justify-between gap-4 px-2 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/market')} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tx-secondary transition-colors hover:bg-surface-2">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-tx-primary">{company.name}</h1>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-tx-muted">{company.exchange}</span>
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] font-medium text-tx-muted">{company.sector}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[12px] text-tx-muted">
              <span>{company.symbol}</span>
              <span>&middot;</span>
              <span>{company.industry}</span>
              {holding && <span>&middot;</span>}
              {holding && <span className="text-tx-secondary">You hold <b>{holding.quantity}</b> shares</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[12px] font-medium text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary">
            <Star className="h-3.5 w-3.5" /> Watchlist
          </button>
          <div className="flex items-center gap-1 rounded-lg bg-accent-subtle px-2.5 py-1.5">
            <Brain className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-semibold text-accent">AI 72</span>
          </div>
        </div>
      </div>

      {/* ─── Price Header ─── */}
      <div className="flex items-baseline gap-3 px-2 pb-3">
        <span className="text-2xl font-bold text-tx-primary">₹{fmt(company.currentPrice)}</span>
        <span className={`flex items-center gap-1 text-[14px] font-semibold ${isPositive ? 'text-tx-success' : 'text-tx-danger'}`}>
          {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {isPositive ? '+' : ''}{company.dayChange.toFixed(2)} ({isPositive ? '+' : ''}{company.dayChangePercent.toFixed(2)}%)
        </span>
      </div>

      {/* ─── Chart + AI Panel (70/30 split) ─── */}
      <div className="flex gap-4 px-2" style={{ minHeight: 420 }}>
        {/* Chart Area (70-75%) */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-border bg-surface-1 p-3">
            <ProfessionalChart
              ohlcvData={ohlcvData}
              height={370}
              defaultMode="line"
              defaultTimeline={timeline}
              showChartTypeToggle={true}
              showTimeline={true}
              onTimelineChange={setTimeline}
            />
            {/* Indicator selector bar */}
            <div className="relative mt-2 flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setIndicatorsOpen(!indicatorsOpen)}
                  className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-medium text-tx-secondary hover:bg-surface-3"
                >
                  Indicators <ChevronDown className="h-3 w-3" />
                </button>
                <AnimatePresence>
                  {indicatorsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute left-0 top-full z-10 mt-1 w-40 rounded-lg border border-border bg-surface-1 p-1.5 shadow-xl"
                    >
                      {['Volume', 'Moving Average', 'RSI', 'MACD', 'Bollinger Bands'].map(ind => (
                        <button
                          key={ind}
                          onClick={() => toggleIndicator(ind)}
                          className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[11.5px] transition-colors ${
                            selectedIndicators.includes(ind) ? 'bg-accent-subtle text-accent' : 'text-tx-secondary hover:bg-surface-2'
                          }`}
                        >
                          <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${selectedIndicators.includes(ind) ? 'border-accent bg-accent' : 'border-border'}`}>
                            {selectedIndicators.includes(ind) && <span className="text-[8px] font-bold text-white">&#10003;</span>}
                          </span>
                          {ind}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex gap-1">
                {selectedIndicators.map(ind => (
                  <span key={ind} className="rounded-full bg-accent-subtle px-2 py-0.5 text-[10.5px] font-medium text-accent">
                    {ind} <button onClick={() => toggleIndicator(ind)} className="ml-0.5 text-accent/60 hover:text-accent">&times;</button>
                  </span>
                ))}
              </div>
              {/* Fullscreen button placeholder */}
              <button className="ml-auto rounded-md border border-border-subtle bg-surface-2 p-1.5 text-tx-muted hover:bg-surface-3 hover:text-tx-secondary" title="Fullscreen">
                <BarChart3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* AI Panel (25-30%) */}
        <div className="hidden lg:block w-[300px] shrink-0">
          <AIPanel company={company} onOpenResearch={handleResearch} />
        </div>
      </div>

      {/* ─── Action Bar: Buy / Sell / AI Research ─── */}
      <div className="flex items-center gap-3 px-2 py-3">
        <button onClick={handleBuy} className="flex items-center justify-center gap-2 rounded-lg bg-tx-success px-6 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-tx-success/90">
          <TrendingUp className="h-4 w-4" /> Buy
        </button>
        <button onClick={handleSell} disabled={!holding || holding.quantity <= 0}
          className={`flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-[13px] font-semibold transition-colors ${holding && holding.quantity > 0 ? 'bg-tx-danger text-white hover:bg-tx-danger/90' : 'bg-tx-danger/10 text-tx-danger/40 cursor-not-allowed'}`}>
          <TrendingDown className="h-4 w-4" /> Sell
        </button>
        <button onClick={handleResearch} className="flex items-center justify-center gap-2 rounded-lg bg-accent-subtle px-5 py-2.5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-subtle-hover">
          <Brain className="h-4 w-4" /> AI Research
        </button>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="border-b border-border px-2">
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 border-b-2 px-4 py-2.5 text-[12.5px] font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-accent text-accent'
                  : 'border-transparent text-tx-muted hover:text-tx-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="px-2 py-4">
        {activeTab === 'stats' && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            <MetricCard label="Market Cap" value={company.marketCap} />
            <MetricCard label="P/E Ratio" value={company.pe.toString()} />
            <MetricCard label="P/B Ratio" value={company.pb.toString()} />
            <MetricCard label="EPS" value={`₹${(company.currentPrice / company.pe).toFixed(2)}`} />
            <MetricCard label="Dividend Yield" value={`${company.dividendYield.toFixed(1)}%`} />
            <MetricCard label="52W High" value={`₹${fmt(company.week52High)}`} />
            <MetricCard label="52W Low" value={`₹${fmt(company.week52Low)}`} />
            <MetricCard label="Volume" value={company.volume.toLocaleString('en-IN')} />
            <MetricCard label="Beta" value="1.12" sub="vs NIFTY 50" />
            <MetricCard label="Book Value" value={`₹${(company.currentPrice / company.pb).toFixed(2)}`} />
            <MetricCard label="Face Value" value="₹10.00" />
            <MetricCard label="ROE" value={`${company.financials.roe.toFixed(1)}%`} />
          </div>
        )}

        {activeTab === 'financials' && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            <MetricCard label="Revenue" value={fmtCompact(company.financials.revenue)} />
            <MetricCard label="Net Profit" value={fmtCompact(company.financials.netProfit)} />
            <MetricCard label="Debt" value={fmtCompact(company.financials.debt)} />
            <MetricCard label="Cash Flow" value={fmtCompact(company.financials.cashFlow)} />
            <MetricCard label="ROE" value={`${company.financials.roe.toFixed(1)}%`} />
            <MetricCard label="ROA" value={`${company.financials.roa.toFixed(1)}%`} />
            <MetricCard label="Promoter Holding" value={`${company.financials.promotorHolding.toFixed(1)}%`} />
            <MetricCard label="Inst. Holding" value={`${company.financials.institutionalHolding.toFixed(1)}%`} />
          </div>
        )}

        {activeTab === 'news' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {company.news.length > 0 ? company.news.map(item => (
              <div key={item.id} className="rounded-lg border border-border-subtle bg-surface-1 p-3">
                <p className="text-[12.5px] font-medium leading-snug text-tx-primary">{item.headline}</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-tx-muted">{item.summary}</p>
                <div className="mt-1.5 flex items-center gap-2 text-[10.5px] text-tx-muted">
                  <span>{item.source}</span><span>&middot;</span>
                  <span>{new Date(item.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              </div>
            )) : <p className="text-[12.5px] text-tx-muted col-span-2">No news available.</p>}
          </div>
        )}

        {activeTab === 'fundamentals' && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
            <MetricCard label="P/E Ratio" value={company.pe.toString()} sub="vs Sector: 24.5" />
            <MetricCard label="P/B Ratio" value={company.pb.toString()} sub="vs Sector: 3.2" />
            <MetricCard label="Dividend Yield" value={`${company.dividendYield.toFixed(1)}%`} sub="Sector Avg: 1.5%" />
            <MetricCard label="ROE" value={`${company.financials.roe.toFixed(1)}%`} sub="Sector Avg: 14.2%" />
            <MetricCard label="ROCE" value={`${(company.financials.roe * 0.85).toFixed(1)}%`} sub="Sector Avg: 12.8%" />
            <MetricCard label="Debt/Equity" value="0.42" sub="Low leverage" />
          </div>
        )}

        {activeTab === 'about' && (
          <div className="rounded-xl border border-border bg-surface-1 p-4" style={{ maxHeight: 220 }}>
            <p className="text-[12.5px] leading-relaxed text-tx-secondary">{company.description}</p>
            <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3 xl:grid-cols-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-tx-muted" />
                <span className="text-[11.5px] text-tx-muted">CEO: <span className="text-tx-primary">{company.name.split(' ')[0]} Singh</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-tx-muted" />
                <span className="text-[11.5px] text-tx-muted">Founded: <span className="text-tx-primary">{company.foundedYear}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-tx-muted" />
                <span className="text-[11.5px] text-tx-muted">Employees: <span className="text-tx-primary">{company.employees.toLocaleString('en-IN')}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-tx-muted" />
                <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[11.5px] text-accent hover:text-accent-hover">
                  {company.website} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* AI Analysis panel content for non-lg screens (on lg it's in the side panel) */}
            <div className="rounded-xl border border-border bg-surface-1 p-4 lg:hidden">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-4 w-4 text-accent" />
                <span className="text-[12.5px] font-semibold text-tx-primary">AI Analysis</span>
              </div>
              <AIPanel company={company} onOpenResearch={handleResearch} />
            </div>
            <div className="space-y-3">
              <div className="rounded-lg bg-tx-success/5 border border-tx-success/10 px-3.5 py-3">
                <p className="text-[11px] font-semibold text-tx-success mb-1">Overall Sentiment</p>
                <p className="text-[12px] leading-relaxed text-tx-secondary">
                  The stock shows strong momentum with institutional accumulation. Technical indicators suggest continuation of uptrend in the near term. Fundamental strength supported by improving margins and market share gains.
                </p>
              </div>
              <div className="rounded-lg bg-accent-subtle px-3.5 py-3">
                <p className="text-[11px] font-semibold text-accent mb-1">Key Takeaway</p>
                <p className="text-[12px] leading-relaxed text-tx-secondary">
                  {company.name} appears well-positioned for moderate upside. Consider accumulating on dips near the 50-DMA support level. Maintain stop-loss below recent swing low for risk management.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Slide-in Trade Panel ─── */}
      <AnimatePresence>
        {tradePanelOpen && (
          <>
            {/* Backdrop (subtle, no blur) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setTradePanelOpen(false)}
            />
            <TradePanel
              companyId={company.id}
              action={tradeAction}
              onClose={() => setTradePanelOpen(false)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}