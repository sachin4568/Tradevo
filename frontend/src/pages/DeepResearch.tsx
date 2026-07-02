import { useEffect, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
  BarChart3,
  Shield,
  Brain,
  PieChart,
  Dna,
  Gauge,
  AlertCircle,
  Bot,
  RefreshCw,
  Info,
  Database,
} from 'lucide-react'
import { useResearchReport } from '@/hooks/useResearch'
import { useAIReportSections, useRegenerateSection } from '@/hooks/useAIResearch'
import { useResearchStore } from '@/stores/researchStore'
import { AISectionLoader } from '@/components/shared/AISectionLoader'
import MarkdownContent from '@/components/shared/MarkdownContent'
import type { Outlook, ReportSection } from '@/types/research'
import type { AIResearchSectionKey } from '@/types/aiResearch'

// ─── Config ───

const outlookConfig: Record<
  Outlook,
  { color: string; bg: string; label: string; icon: React.ElementType }
> = {
  bullish: {
    color: 'text-tx-success',
    bg: 'bg-tx-success/10',
    label: 'Bullish',
    icon: TrendingUp,
  },
  bearish: {
    color: 'text-tx-danger',
    bg: 'bg-tx-danger/10',
    label: 'Bearish',
    icon: TrendingDown,
  },
  neutral: {
    color: 'text-tx-warning',
    bg: 'bg-tx-warning/10',
    label: 'Neutral',
    icon: Minus,
  },
}

const sectionIcons: Record<string, React.ElementType> = {
  executiveSummary: FileText,
  companyOverview: FileText,
  financialHealth: BarChart3,
  technicalAnalysis: BarChart3,
  marketEnvironment: TrendingUp,
  newsIntelligence: FileText,
  riskIntelligence: Shield,
  portfolioImpact: PieChart,
  investmentDNA: Dna,
  aiExplanation: Brain,
  confidenceAndLimitations: Gauge,
}

const sectionOrder = [
  'executiveSummary',
  'companyOverview',
  'financialHealth',
  'technicalAnalysis',
  'marketEnvironment',
  'newsIntelligence',
  'riskIntelligence',
  'portfolioImpact',
  'investmentDNA',
  'aiExplanation',
  'confidenceAndLimitations',
] as const

const aiSectionKeys: AIResearchSectionKey[] = [
  'portfolioImpact',
  'investmentDNA',
  'aiExplanation',
  'confidenceAndLimitations',
]

const aiPlaceholderSections = new Set<string>(aiSectionKeys)

const sectionLabels: Record<string, string> = {
  executiveSummary: 'Executive Summary',
  companyOverview: 'Company Overview',
  financialHealth: 'Financial Health',
  technicalAnalysis: 'Technical Analysis',
  marketEnvironment: 'Market Environment',
  newsIntelligence: 'News Intelligence',
  riskIntelligence: 'Risk Intelligence',
  portfolioImpact: 'Portfolio Impact',
  investmentDNA: 'Investment Style Reflection',
  aiExplanation: 'Understanding This Research',
  confidenceAndLimitations: 'Analysis Context and Limitations',
}

// ─── Components ───

function GeneratedByBadge({ generatedBy }: { generatedBy: string }) {
  if (generatedBy === 'ai') {
    return (
      <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium text-accent bg-accent-subtle">
        <Bot className="h-3 w-3" />
        AI Generated
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-medium text-tx-muted bg-surface-3">
      <FileText className="h-3 w-3" />
      Static Analysis
    </span>
  )
}

/** Provenance footer shown on AI-generated sections */
function ProvenanceFooter({ provenance }: { provenance: { reason: string; dataSources: string[] } }) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-border/50 pt-2.5">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-3 w-3 shrink-0 text-tx-muted" />
        <p className="text-[11.5px] leading-relaxed text-tx-muted">{provenance.reason}</p>
      </div>
      <div className="flex items-start gap-2">
        <Database className="mt-0.5 h-3 w-3 shrink-0 text-tx-muted" />
        <p className="text-[11.5px] leading-relaxed text-tx-muted">
          Data sources: {provenance.dataSources.join(', ')}
        </p>
      </div>
    </div>
  )
}

function StaticSectionBlock({
  sectionKey,
  section,
}: {
  sectionKey: string
  section: ReportSection
}) {
  const Icon = sectionIcons[sectionKey] ?? FileText

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-tx-muted" />
          <h4 className="text-[13.5px] font-semibold text-tx-primary">
            {section.title}
          </h4>
        </div>
        <GeneratedByBadge generatedBy={section.generatedBy} />
      </div>
      <div className="text-[13px] leading-relaxed text-tx-secondary">
        <MarkdownContent content={section.content} />
      </div>
    </div>
  )
}

function AISectionBlock({
  sectionKey,
  section,
  isRefetching,
  onRefresh,
}: {
  sectionKey: string
  section: ReportSection | null
  isRefetching?: boolean
  onRefresh?: () => void
}) {
  const Icon = sectionIcons[sectionKey] ?? Brain
  const label = sectionLabels[sectionKey] ?? sectionKey

  if (isRefetching) {
    return <AISkeleton />
  }

  if (!section) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-1/50 p-6">
        <div className="flex items-center gap-2 text-tx-muted">
          <Icon className="h-4 w-4" />
          <h4 className="text-[13px] font-semibold">{label}</h4>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-surface-2 px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-tx-warning" />
          <div>
            <p className="text-[12.5px] font-medium text-tx-secondary">
              AI-Generated Section
            </p>
            <p className="mt-0.5 text-[12px] text-tx-muted">
              This section uses AI-generated content and is currently unavailable. The rest of the report remains fully accessible.
            </p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-tx-secondary transition-colors hover:bg-surface-3 hover:text-tx-primary"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Analysis
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" />
          <h4 className="text-[13.5px] font-semibold text-tx-primary">
            {section.title}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <GeneratedByBadge generatedBy="ai" />
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="flex items-center gap-1 rounded-lg border border-border px-2 py-0.5 text-[11px] font-medium text-tx-muted transition-colors hover:bg-surface-2 hover:text-tx-secondary"
              title="Refresh Analysis"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Analysis
            </button>
          )}
        </div>
      </div>
      <div className="text-[13px] leading-relaxed text-tx-secondary">
        <MarkdownContent content={section.content} />
      </div>
      {section.provenance && <ProvenanceFooter provenance={section.provenance} />}
    </div>
  )
}

// ─── Main Page ───

export default function DeepResearch() {
  const navigate = useNavigate()
  const { companyId } = useParams()
  const queryClient = useQueryClient()
  const { data: report, isLoading, error } = useResearchReport(companyId ?? '')
  const viewReport = useResearchStore((s) => s.viewReport)

  // AI hooks — optional, graceful degradation
  const {
    data: aiData,
    isLoading: aiLoading,
    isError: aiError,
    isRefetching: aiRefetching,
  } = useAIReportSections(companyId ?? '', aiSectionKeys)

  const regenerateMutation = useRegenerateSection(companyId ?? '')

  // Track view in history
  useEffect(() => {
    if (companyId && report) {
      viewReport(companyId)
    }
  }, [companyId, report, viewReport])

  // Merge AI sections into the report's section data
  const mergedSections = useMemo(() => {
    if (!report) return null

    const sections = { ...report.sections }
    if (aiData?.sections) {
      for (const [key, section] of Object.entries(aiData.sections)) {
        if (section && key in sections) {
          (sections as Record<string, ReportSection | null>)[key] = section
        }
      }
    }
    return sections
  }, [report, aiData])

  // Compute total coverage including AI boost
  const totalCoverage = useMemo(() => {
    if (!report) return 0
    const base = report.analysisCoverage
    const boost = aiData?.coverageBoost ?? 0
    // Only add boost if AI sections were actually loaded
    const aiSectionsLoaded = aiData?.sections
      ? Object.keys(aiData.sections).length
      : 0
    const effectiveBoost = aiSectionsLoaded > 0 ? boost : 0
    return Math.min(base + effectiveBoost, 100)
  }, [report, aiData])

  const handleRefreshSection = (sectionKey: AIResearchSectionKey) => {
    regenerateMutation.mutate(
      { sectionKey },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ['ai-research', companyId],
          })
        },
      },
    )
  }

  const handleRefreshAll = () => {
    queryClient.invalidateQueries({
      queryKey: ['ai-research', companyId],
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-tx-danger">
          Research report not available
        </p>
        <p className="mt-1 text-[13px] text-tx-muted">
          Reports are available for Reliance Industries, TCS, and HDFC Bank.
        </p>
        <button
          onClick={() => navigate('/research')}
          className="mt-3 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Back to Research
        </button>
      </div>
    )
  }

  const cfg = outlookConfig[report.outlook]
  const OutlookIcon = cfg.icon

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-tx-muted">
        <button
          onClick={() => navigate('/research')}
          className="transition-colors hover:text-tx-secondary"
        >
          Research
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-tx-secondary">{report.companyName}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/research')}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold text-tx-primary">
                {report.companyName}
              </h1>
              <span
                className={`flex items-center gap-1 shrink-0 rounded px-2 py-0.5 text-[11.5px] font-medium ${cfg.color} ${cfg.bg}`}
              >
                <OutlookIcon className="h-3.5 w-3.5" />
                {cfg.label}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-tx-muted">
              {report.symbol} &middot; {report.sector}
            </p>
          </div>
        </div>

        {/* Meta bar */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-surface-1 px-4 py-3 text-[12px] text-tx-muted">
          <span>
            Generated:{' '}
            {new Date(report.generatedAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span>&middot;</span>
          <span>
            Analysis Coverage:{' '}
            <span className="font-medium text-tx-secondary">
              {totalCoverage}%
            </span>
          </span>
          <span>&middot;</span>
          <GeneratedByBadge generatedBy="static" />
          {aiData && Object.keys(aiData.sections).length > 0 && (
            <>
              <span>&middot;</span>
              <GeneratedByBadge generatedBy="ai" />
            </>
          )}
        </div>

        {/* Analysis Coverage bar */}
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-3">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${totalCoverage}%` }}
            />
          </div>
          <span className="text-[12px] font-semibold text-tx-secondary">
            {totalCoverage}%
          </span>
        </div>
      </div>

      {/* Report Sections */}
      <div className="space-y-4">
        {sectionOrder.map((key) => {
          const isAI = aiPlaceholderSections.has(key)
          const section = mergedSections
            ? (mergedSections as Record<string, ReportSection | null>)[key] ?? null
            : report.sections[key]

          if (isAI) {
            return (
              <AISectionBlock
                key={key}
                sectionKey={key}
                section={section as ReportSection | null}
                isRefetching={aiRefetching && !aiLoading}
                onRefresh={() => handleRefreshSection(key as AIResearchSectionKey)}
              />
            )
          }

          return (
            <StaticSectionBlock
              key={key}
              sectionKey={key}
              section={section as ReportSection}
            />
          )
        })}
      </div>

      {/* AI Status + Refresh All */}
      {aiError && !aiData && (
        <div className="rounded-xl border border-dashed border-border bg-surface-1/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-tx-muted" />
            <div className="flex-1">
              <p className="text-[12.5px] font-medium text-tx-secondary">
                AI-generated sections are temporarily unavailable
              </p>
              <p className="mt-1 text-[12px] text-tx-muted">
                The AI service could not be reached. The static research sections above remain fully functional. You can try refreshing the AI sections.
              </p>
              <button
                onClick={handleRefreshAll}
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-[12px] font-medium text-tx-secondary transition-colors hover:bg-surface-3 hover:text-tx-primary"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl border border-dashed border-border bg-surface-1/50 p-4">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-tx-warning" />
          <div>
            <p className="text-[12.5px] font-medium text-tx-secondary">
              Educational Disclaimer
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-tx-muted">
              This research report is generated for educational and informational
              purposes only. It does not constitute investment advice, a
              recommendation, or an offer to buy or sell any securities. AI-generated
              sections provide context and frameworks for thinking about a company —
              they are not predictions or instructions. Always conduct your own due
              diligence before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}