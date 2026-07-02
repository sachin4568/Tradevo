import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  PieChart,
  GraduationCap,
  FileSearch,
  Eye,
  Wallet,
  BarChart3,
  Newspaper,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { useMarketOverview, useMarketNews } from '@/hooks/useMarket'
import { usePortfolio } from '@/hooks/usePortfolio'
import { usePortfolioAllocation } from '@/hooks/usePortfolioAllocation'
import { useWatchlist } from '@/hooks/useWatchlist'
import { useLearningProgress } from '@/hooks/useLearning'
import AllocationDonut from '@/components/charts/AllocationDonut'
import { useDashboardInsights } from '@/hooks/useAIDecision'
import { AIInsightCard } from '@/components/shared/AIInsightCard'
import { AISectionLoader } from '@/components/shared/AISectionLoader'

function Card({
  title,
  children,
  className = '',
  action,
  loading,
}: {
  title: string
  children: React.ReactNode
  className?: string
  action?: { label: string; onClick: () => void }
  loading?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-border bg-surface-1 ${className}`}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-[13px] font-semibold text-tx-primary">
          {title}
        </h3>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
          >
            {action.label}
          </button>
        )}
      </div>
      <div className="flex-1 p-4">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: React.ElementType
  message: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface-2">
        <Icon className="h-5 w-5 text-tx-muted" />
      </div>
      <p className="text-[13px] text-tx-muted">{message}</p>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-4 py-3 transition-colors hover:border-accent/30 hover:bg-accent-subtle"
    >
      <Icon className="h-5 w-5 text-accent" />
      <span className="text-[12px] font-medium text-tx-secondary">
        {label}
      </span>
    </button>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatPnl(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}₹${Math.abs(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function DashboardLearningWidget() {
  const navigate = useNavigate()
  const {
    completedCount,
    totalLessons,
    progressPercent,
    currentModule,
    nextLesson,
  } = useLearningProgress()

  // No lessons started yet
  if (completedCount === 0 && !nextLesson) {
    return (
      <EmptyState
        icon={GraduationCap}
        message="Begin your learning journey to track progress here."
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* Progress bar + percentage */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-[12px] font-semibold text-tx-secondary">
          {progressPercent}%
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-2.5">
          <p className="text-[11px] text-tx-muted">Completed</p>
          <p className="text-[15px] font-semibold text-tx-primary">
            {completedCount}
            <span className="text-[12px] font-normal text-tx-muted">
              /{totalLessons}
            </span>
          </p>
        </div>
        <div className="rounded-lg border border-border-subtle bg-surface-2 p-2.5">
          <p className="text-[11px] text-tx-muted">Current Module</p>
          <p className="text-[13px] font-medium leading-snug text-tx-primary">
            {currentModule?.title ?? 'None'}
          </p>
        </div>
      </div>

      {/* Next lesson / Continue button */}
      {nextLesson && (
        <button
          onClick={() =>
            navigate(
              `/learning/${nextLesson.moduleId}/${nextLesson.lessonId}`,
            )
          }
          className="flex w-full items-center justify-between rounded-lg border border-border-subtle bg-surface-2 px-3 py-2.5 text-left transition-colors hover:bg-surface-3"
        >
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-tx-muted">Next Lesson</p>
            <p className="truncate text-[13px] font-medium text-tx-primary">
              {nextLesson.title}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 text-accent">
            <span className="text-[12px] font-medium">Continue</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
        </button>
      )}
    </div>
  )
}

function DashboardAIInsightsCard() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useDashboardInsights()

  return (
    <Card title="AI Insights">
      <AISectionLoader
        isLoading={isLoading}
        isError={isError}
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['ai-decision', 'dashboard-insights'] })}
        hasData={!!data && data.insights.length > 0}
        showWhenEmpty
        emptyMessage="AI insights will appear as you invest"
      >
        {data && data.insights.length > 0 && (
          <div className="space-y-3">
            {data.insights.slice(0, 2).map((insight, i) => (
              <AIInsightCard
                key={i}
                heading={insight.heading}
                body={insight.body}
                provenance={insight.provenance}
                category={insight.category}
              />
            ))}
          </div>
        )}
      </AISectionLoader>
    </Card>
  )
}

function DashboardAIInsightsFullWidth() {
  const queryClient = useQueryClient()
  const { data, isLoading, isError } = useDashboardInsights()

  // Only show full-width section when we have more than 2 insights
  if (!data || data.insights.length <= 2) return null

  return (
    <AISectionLoader
      isLoading={isLoading}
      isError={isError}
      onRetry={() => queryClient.invalidateQueries({ queryKey: ['ai-decision', 'dashboard-insights'] })}
      hasData={true}
    >
      <div className="space-y-3">
        {data.insights.slice(2).map((insight, i) => (
          <AIInsightCard
            key={i}
            heading={insight.heading}
            body={insight.body}
            provenance={insight.provenance}
            category={insight.category}
          />
        ))}
      </div>
    </AISectionLoader>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: market, isLoading: marketLoading } = useMarketOverview()
  const { data: news, isLoading: newsLoading } = useMarketNews()
  const portfolio = usePortfolio()
  const allocationData = usePortfolioAllocation()
  const { companies: watchlistCompanies } = useWatchlist()

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">
          Dashboard
        </h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Your investment overview
        </p>
      </div>

      {/* Portfolio Summary */}
      <Card title="Portfolio Summary">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <Wallet className="h-3.5 w-3.5 text-tx-muted" />
              <span className="text-[12px] text-tx-muted">
                Total Value
              </span>
            </div>
            <span className="text-xl font-semibold text-tx-primary">
              {portfolio.isEmpty
                ? '₹--'
                : `₹${portfolio.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <BarChart3 className="h-3.5 w-3.5 text-tx-muted" />
              <span className="text-[12px] text-tx-muted">Invested</span>
            </div>
            <span className="text-xl font-semibold text-tx-primary">
              {portfolio.isEmpty
                ? '₹--'
                : `₹${portfolio.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-tx-muted" />
              <span className="text-[12px] text-tx-muted">
                Today's P&L
              </span>
            </div>
            <span
              className={`text-xl font-semibold ${portfolio.isEmpty ? 'text-tx-muted' : portfolio.totalDayPnL >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}
            >
              {portfolio.isEmpty ? '₹--' : formatPnl(portfolio.totalDayPnL)}
            </span>
          </div>
          <div className="rounded-lg border border-border-subtle bg-surface-2 p-3.5">
            <div className="mb-1.5 flex items-center gap-2">
              <PieChart className="h-3.5 w-3.5 text-tx-muted" />
              <span className="text-[12px] text-tx-muted">Total P&L</span>
            </div>
            <span
              className={`text-xl font-semibold ${portfolio.isEmpty ? 'text-tx-muted' : portfolio.totalPnL >= 0 ? 'text-tx-success' : 'text-tx-danger'}`}
            >
              {portfolio.isEmpty ? '₹--' : formatPnl(portfolio.totalPnL)}
            </span>
          </div>
        </div>
      </Card>

      {/* Row 2: Market Overview + AI Insights */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          title="Market Overview"
          action={{
            label: 'View Market',
            onClick: () => navigate('/market'),
          }}
          loading={marketLoading}
        >
          {market && (
            <div className="space-y-4">
              {/* Indices */}
              <div className="grid grid-cols-2 gap-3">
                {market.indices.map((idx) => {
                  const isUp = idx.change >= 0
                  return (
                    <div
                      key={idx.name}
                      className="rounded-lg border border-border-subtle bg-surface-2 p-3"
                    >
                      <p className="text-[11.5px] text-tx-muted">
                        {idx.name}
                      </p>
                      <p className="mt-1 text-[15px] font-semibold text-tx-primary">
                        {idx.value.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        className={`mt-0.5 text-[12px] font-medium ${
                          isUp
                            ? 'text-tx-success'
                            : 'text-tx-danger'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {idx.change.toFixed(2)} ({isUp ? '+' : ''}
                        {idx.changePercent.toFixed(2)}%)
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Top Movers */}
              <div>
                <p className="mb-2 text-[12px] font-medium text-tx-secondary">
                  Top Movers
                </p>
                <div className="space-y-1.5">
                  {market.topGainers.slice(0, 3).map((m) => (
                    <button
                      key={m.companyId}
                      onClick={() =>
                        navigate(`/market/${m.companyId}`)
                      }
                      className="flex w-full items-center justify-between rounded-md bg-surface-2 px-3 py-2 text-left transition-colors hover:bg-surface-3"
                    >
                      <div>
                        <span className="text-[12.5px] font-medium text-tx-primary">
                          {m.symbol}
                        </span>
                        <span className="ml-2 text-[11.5px] text-tx-muted">
                          {m.name.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[12px] font-medium text-tx-success">
                        +{m.changePercent.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                  {market.topLosers.slice(0, 3).map((m) => (
                    <button
                      key={m.companyId}
                      onClick={() =>
                        navigate(`/market/${m.companyId}`)
                      }
                      className="flex w-full items-center justify-between rounded-md bg-surface-2 px-3 py-2 text-left transition-colors hover:bg-surface-3"
                    >
                      <div>
                        <span className="text-[12.5px] font-medium text-tx-primary">
                          {m.symbol}
                        </span>
                        <span className="ml-2 text-[11.5px] text-tx-muted">
                          {m.name.split(' ')[0]}
                        </span>
                      </div>
                      <span className="text-[12px] font-medium text-tx-danger">
                        {m.changePercent.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <DashboardAIInsightsCard />
      </div>

      {/* Row 2.5: AI Insights (shown when AI data available) */}
      <DashboardAIInsightsFullWidth />

      {/* Row 3: Watchlist + Learning Progress */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card
          title="Watchlist"
          action={{
            label: 'View All',
            onClick: () => navigate('/watchlist'),
          }}
        >
          {watchlistCompanies.length > 0 ? (
            <div className="space-y-1.5">
              {watchlistCompanies.slice(0, 5).map((c) => {
                const isUp = c.dayChange >= 0
                return (
                  <button
                    key={c.id}
                    onClick={() =>
                      navigate(`/market/${c.id}`)
                    }
                    className="flex w-full items-center justify-between rounded-md bg-surface-2 px-3 py-2 text-left transition-colors hover:bg-surface-3"
                  >
                    <div>
                      <span className="text-[12.5px] font-medium text-tx-primary">
                        {c.symbol}
                      </span>
                      <span className="ml-2 text-[11.5px] text-tx-muted">
                        {c.name.split(' ')[0]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[12.5px] font-medium text-tx-primary">
                        ₹
                        {c.currentPrice.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={`text-[11.5px] font-medium ${isUp ? 'text-tx-success' : 'text-tx-danger'}`}
                      >
                        {isUp ? '+' : ''}
                        {c.dayChangePercent.toFixed(2)}%
                      </span>
                    </div>
                  </button>
                )
              })}
              {watchlistCompanies.length > 5 && (
                <button
                  onClick={() => navigate('/watchlist')}
                  className="mt-1 w-full rounded-md py-1.5 text-center text-[12px] font-medium text-accent hover:text-accent-hover"
                >
                  +{watchlistCompanies.length - 5} more
                </button>
              )}
            </div>
          ) : (
            <EmptyState
              icon={Eye}
              message="Star companies from the Market page to track them here."
            />
          )}
        </Card>

        <Card
          title="Learning Progress"
          action={{
            label: 'View Learning',
            onClick: () => navigate('/learning'),
          }}
        >
          <DashboardLearningWidget />
        </Card>
      </div>

      {/* Row 4: Latest News + Allocation Chart */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Latest News" loading={newsLoading}>
          {news && news.length > 0 ? (
            <div className="space-y-3">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border-subtle bg-surface-2 p-3"
                >
                  <p className="text-[13px] font-medium leading-snug text-tx-primary">
                    {item.headline}
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
            <EmptyState
              icon={Newspaper}
              message="No news updates at the moment."
            />
          )}
        </Card>

        <Card title="Sector Allocation">
          <AllocationDonut data={allocationData} height={200} />
        </Card>
      </div>

      {/* Row 5: Quick Actions */}
      <Card title="Quick Actions">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          <QuickAction
            icon={TrendingUp}
            label="Buy"
            onClick={() => navigate('/market')}
          />
          <QuickAction
            icon={PieChart}
            label="Portfolio"
            onClick={() => navigate('/portfolio')}
          />
          <QuickAction
            icon={FileSearch}
            label="Research"
            onClick={() => navigate('/research')}
          />
          <QuickAction
            icon={GraduationCap}
            label="Simulator"
            onClick={() => navigate('/learning')}
          />
          <QuickAction
            icon={Eye}
            label="Watchlist"
            onClick={() => navigate('/watchlist')}
          />
          <QuickAction
            icon={Sparkles}
            label="AI Insights"
            onClick={() => navigate('/research')}
          />
        </div>
      </Card>
    </div>
  )
}