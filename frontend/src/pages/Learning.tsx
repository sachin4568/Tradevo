import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  BookOpen,
  Brain,
  Briefcase,
  BarChart3,
  LineChart,
  ShieldCheck,
  Wallet,
  Target,
  CheckCircle2,
  Circle,
  ChevronRight,
  Trophy,
  Lightbulb,
  Compass,
  BookMarked,
} from 'lucide-react'
import { useModules, useLearningProgress, useAchievements } from '@/hooks/useLearning'
import { useCoachingTip, useLessonRecommendation, useLearningReflection } from '@/hooks/useAILearning'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { AISectionLoader } from '@/components/shared/AISectionLoader'
import { AIInsightCard } from '@/components/shared/AIInsightCard'
import MarkdownContent from '@/components/shared/MarkdownContent'
import LearningReflectionTimeline from '@/components/learning/LearningReflectionTimeline'
import PerformanceAreaChart from '@/components/charts/PerformanceAreaChart'
import { usePortfolioPerformance } from '@/hooks/usePortfolioPerformance'

// ─── Icon mapping ───

const iconMap: Record<string, React.ElementType> = {
  BookOpen,
  Brain,
  Briefcase,
  BarChart3,
  LineChart,
  ShieldCheck,
}

const categoryColors: Record<string, string> = {
  Beginner: 'text-tx-success bg-tx-success/10',
  Intermediate: 'text-tx-warning bg-tx-warning/10',
  Advanced: 'text-tx-danger bg-tx-danger/10',
}

// ─── Stat Card ───

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-tx-muted" />
        <span className="text-[12px] text-tx-muted">{label}</span>
      </div>
      <p className="text-xl font-semibold text-tx-primary">{value}</p>
      <p className="mt-0.5 text-[12px] text-tx-muted">{sub}</p>
    </div>
  )
}

// ─── Module Card ───

function ModuleCard({
  moduleId,
  title,
  description,
  category,
  icon,
  totalLessons,
  completedLessons,
  inProgressLessons,
  progressPercent,
}: {
  moduleId: string
  title: string
  description: string
  category: string
  icon: string
  totalLessons: number
  completedLessons: number
  inProgressLessons: number
  progressPercent: number
}) {
  const navigate = useNavigate()
  const Icon = iconMap[icon] ?? BookOpen

  return (
    <button
      onClick={() => navigate(`/learning/${moduleId}`)}
      className="flex w-full flex-col rounded-xl border border-border bg-surface-1 p-5 text-left transition-colors hover:border-accent/30 hover:bg-surface-2"
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-subtle">
          <Icon className="h-5 w-5 text-accent" />
        </div>
        <span
          className={`rounded px-2 py-0.5 text-[11px] font-medium ${categoryColors[category] ?? 'text-tx-muted bg-surface-2'}`}
        >
          {category}
        </span>
      </div>

      {/* Title + description */}
      <h3 className="mt-3 text-[14.5px] font-semibold text-tx-primary">
        {title}
      </h3>
      <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-tx-muted">
        {description}
      </p>

      {/* Progress */}
      <div className="mt-4 space-y-2">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[12px]">
          <span className="text-tx-secondary">
            {completedLessons}/{totalLessons} completed
          </span>
          {inProgressLessons > 0 && (
            <span className="text-accent">1 in progress</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Main Learning Page ───

export default function Learning() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: modules, isLoading } = useModules()
  const {
    totalLessons,
    completedCount,
    inProgressCount,
    progressPercent,
    completedDurationMinutes,
    totalDurationMinutes,
    moduleStats,
    nextLesson,
    currentModule,
  } = useLearningProgress()
  const { unlocked: unlockedAchievements } = useAchievements()
  const virtualCash = usePortfolioStore((s) => s.virtualCash)
  const transactions = usePortfolioStore((s) => s.transactions)
  const hasTrades = transactions.length > 0
  const performanceData = usePortfolioPerformance()

  // AI Learning hooks — optional, graceful degradation
  const {
    data: coachingTip,
    isLoading: tipLoading,
    isError: tipError,
  } = useCoachingTip()
  const {
    data: lessonRec,
    isLoading: recLoading,
    isError: recError,
  } = useLessonRecommendation()
  const {
    data: reflection,
    isLoading: reflectionLoading,
    isError: reflectionError,
  } = useLearningReflection()

  const handleRetryAI = () => {
    queryClient.invalidateQueries({ queryKey: ['ai-learning'] })
  }

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div>
        <h1 className="text-lg font-semibold text-tx-primary">Learning</h1>
        <p className="mt-0.5 text-[13px] text-tx-muted">
          Master investing with structured lessons on the Indian stock market
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label="Virtual Balance"
          value={`₹${virtualCash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="Available capital"
        />
        <StatCard
          icon={Target}
          label="Lessons Completed"
          value={`${completedCount}/${totalLessons}`}
          sub={inProgressCount > 0 ? `${inProgressCount} in progress` : 'Keep going!'}
        />
        <StatCard
          icon={CheckCircle2}
          label="Overall Progress"
          value={`${progressPercent}%`}
          sub={`${completedDurationMinutes}/${totalDurationMinutes} min read`}
        />
        <StatCard
          icon={Trophy}
          label="Achievements"
          value={`${unlockedAchievements.length}`}
          sub="Unlocked so far"
        />
      </div>

      {/* Virtual Trading CTA */}
      <div className="rounded-xl border border-accent/20 bg-accent-subtle p-5">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-[14px] font-semibold text-tx-primary">
              {hasTrades
                ? 'Review your virtual trades'
                : 'Start practicing with virtual trading'}
            </h3>
            <p className="mt-1 text-[12.5px] text-tx-secondary">
              {hasTrades
                ? `You've made ${transactions.length} trade${transactions.length > 1 ? 's' : ''} so far. Review your portfolio performance.`
                : 'Apply what you learn by trading with ₹10,00,000 in virtual cash. No real money at risk.'}
            </p>
          </div>
          <button
            onClick={() => navigate(hasTrades ? '/portfolio' : '/market')}
            className="shrink-0 rounded-lg bg-accent px-5 py-2.5 text-[13px] font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
          >
            {hasTrades ? 'View Portfolio' : 'Go to Market'}
          </button>
        </div>
      </div>

      {/* Continue Learning / Current Module */}
      {nextLesson && (
        <div className="rounded-xl border border-border bg-surface-1 p-5">
          <div className="mb-3 flex items-center gap-2 text-[12px] text-tx-muted">
            <Circle className="h-3 w-3 fill-accent text-accent" />
            <span>Continue where you left off</span>
          </div>
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              {currentModule && (
                <p className="text-[12px] text-tx-muted">
                  {currentModule.title}
                </p>
              )}
              <p className="text-[15px] font-semibold text-tx-primary">
                {nextLesson.title}
              </p>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/learning/${nextLesson.moduleId}/${nextLesson.lessonId}`,
                )
              }
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-accent-subtle px-4 py-2 text-[13px] font-semibold text-accent transition-colors hover:bg-accent-subtle-hover"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* AI Coaching Tip — optional, graceful degradation */}
      <AISectionLoader
        isLoading={tipLoading}
        isError={tipError}
        onRetry={handleRetryAI}
        hasData={!!coachingTip}
        showWhenEmpty={false}
      >
        {coachingTip && (
          <div className="rounded-xl border border-accent/20 bg-accent-subtle/50 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h3 className="text-[14px] font-semibold text-tx-primary">
                AI Coaching Tip
              </h3>
              <span className="rounded px-1.5 py-0.5 text-[10.5px] font-medium text-accent bg-accent-subtle">
                Connected to: {coachingTip.lessonTitle}
              </span>
            </div>
            <div className="text-[13px] leading-relaxed text-tx-secondary">
              <MarkdownContent content={coachingTip.tip} />
            </div>
            {coachingTip.connectionToPortfolio && (
              <div className="mt-3 rounded-lg border border-border bg-surface-1/80 p-3">
                <p className="text-[12px] font-medium text-tx-muted mb-1">
                  Connection to Your Portfolio
                </p>
                <p className="text-[12.5px] leading-relaxed text-tx-secondary">
                  {coachingTip.connectionToPortfolio}
                </p>
              </div>
            )}
            <div className="mt-3 border-t border-border/30 pt-2.5">
              <p className="text-[11px] text-tx-muted">
                {coachingTip.provenance.reason}
              </p>
              <p className="mt-0.5 text-[11px] text-tx-muted/70">
                Data sources: {coachingTip.provenance.dataSources.join(', ')}
              </p>
            </div>
          </div>
        )}
      </AISectionLoader>

      {/* AI Lesson Recommendation — optional, graceful degradation */}
      <AISectionLoader
        isLoading={recLoading}
        isError={recError}
        onRetry={handleRetryAI}
        hasData={!!lessonRec}
        showWhenEmpty={false}
      >
        {lessonRec && (
          <div className="rounded-xl border border-border bg-surface-1 p-5">
            <div className="mb-3 flex items-center gap-2">
              <Compass className="h-4 w-4 text-violet-400" />
              <h3 className="text-[14px] font-semibold text-tx-primary">
                Suggested Next Lesson
              </h3>
            </div>
            <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-[14px] font-medium text-tx-primary">
                  {lessonRec.recommendedLessonTitle}
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-tx-secondary">
                  {lessonRec.reason}
                </p>
                <p className="mt-1.5 text-[11px] text-tx-muted">
                  {lessonRec.provenance.reason}
                </p>
              </div>
              <button
                onClick={() => navigate(`/learning/${lessonRec.recommendedLessonId.split('-')[1]}/${lessonRec.recommendedLessonId}`)}
                className="shrink-0 rounded-lg bg-surface-2 px-4 py-2 text-[13px] font-medium text-accent transition-colors hover:bg-surface-3"
              >
                View Lesson
              </button>
            </div>
          </div>
        )}
      </AISectionLoader>

      {/* Module Grid */}
      <div>
        <h2 className="mb-3 text-[14.5px] font-semibold text-tx-primary">
          Modules
        </h2>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules?.map((mod) => {
              const stat = moduleStats.find(
                (s) => s.moduleId === mod.id,
              )
              return (
                <ModuleCard
                  key={mod.id}
                  moduleId={mod.id}
                  title={mod.title}
                  description={mod.description}
                  category={mod.category}
                  icon={mod.icon}
                  totalLessons={stat?.total ?? mod.lessons.length}
                  completedLessons={stat?.completed ?? 0}
                  inProgressLessons={stat?.inProgress ?? 0}
                  progressPercent={
                    stat?.progressPercent ?? 0
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      {/* AI Learning Reflection — optional, graceful degradation */}
      <AISectionLoader
        isLoading={reflectionLoading}
        isError={reflectionError}
        onRetry={handleRetryAI}
        hasData={!!reflection}
        showWhenEmpty={false}
      >
        {reflection && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookMarked className="h-4 w-4 text-accent" />
              <h2 className="text-[14px] font-semibold text-tx-primary">
                Learning Reflection
              </h2>
            </div>

            {/* Observations */}
            {reflection.observations.length > 0 && (
              <AIInsightCard
                heading="Trading Pattern Observations"
                body={reflection.observations.map((o) => `- ${o}`).join('\n')}
                provenance={reflection.provenance}
                category="learning"
              />
            )}

            {/* Strengths */}
            {reflection.strengths.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <h3 className="mb-2.5 text-[13px] font-semibold text-tx-primary">
                  Areas of Good Understanding
                </h3>
                <ul className="space-y-2">
                  {reflection.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tx-success" />
                      <p className="text-[12.5px] leading-relaxed text-tx-secondary">{s}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Areas for improvement */}
            {reflection.areasForImprovement.length > 0 && (
              <div className="rounded-xl border border-border bg-surface-1 p-4">
                <h3 className="mb-2.5 text-[13px] font-semibold text-tx-primary">
                  Topics for Further Study
                </h3>
                <ul className="space-y-2">
                  {reflection.areasForImprovement.map((a, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <p className="text-[12.5px] leading-relaxed text-tx-secondary">{a}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Connected lessons */}
            {reflection.connectedLessons.length > 0 && (
              <div className="rounded-xl border border-border-subtle bg-surface-1/50 p-4">
                <p className="mb-1.5 text-[12px] font-medium text-tx-muted">
                  Connected Lesson Concepts
                </p>
                <ul className="space-y-1.5">
                  {reflection.connectedLessons.map((l, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <p className="text-[12px] text-tx-secondary">{l}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </AISectionLoader>

      {/* Learning Reflection Timeline — replaces the old Decision Timeline */}
      <div className="rounded-xl border border-border bg-surface-1">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-semibold text-tx-primary">
            Decision Reflection Timeline
          </h3>
          {transactions.length > 5 && (
            <button
              onClick={() => navigate('/portfolio/transactions')}
              className="text-[12px] font-medium text-accent transition-colors hover:text-accent-hover"
            >
              View All Transactions
            </button>
          )}
        </div>
        <div className="p-4">
          <LearningReflectionTimeline />
        </div>
      </div>

      {/* Portfolio Performance Chart (educational context) */}
      {hasTrades && (
        <div className="rounded-xl border border-border bg-surface-1">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-[13px] font-semibold text-tx-primary">
              Portfolio Performance
            </h3>
            <p className="mt-0.5 text-[11.5px] text-tx-muted">
              Track how your virtual portfolio has evolved with each trade decision.
            </p>
          </div>
          <div className="p-4">
            <PerformanceAreaChart data={performanceData} height={240} />
          </div>
        </div>
      )}
    </div>
  )
}