'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Eye,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'
import { useTradevoStore } from '@/store/tradevo-store'
import { mockResearchReports } from '@/lib/mock-data'

/* ───────────────────────────── Types ───────────────────────────── */

type FilterTab = 'all' | 'bullish' | 'bearish' | 'neutral'

/* ───────────────────────────── Helpers ───────────────────────────── */

function ScoreCircle({ score }: { score: number }) {
  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-tv-emerald'
    if (s >= 60) return 'text-tv-amber'
    return 'text-tv-coral'
  }
  const getRingColor = (s: number) => {
    if (s >= 80) return 'stroke-tv-emerald/30'
    if (s >= 60) return 'stroke-tv-amber/30'
    return 'stroke-tv-coral/30'
  }
  const getTrackColor = (s: number) => {
    if (s >= 80) return 'stroke-tv-emerald'
    if (s >= 60) return 'stroke-tv-amber'
    return 'stroke-tv-coral'
  }
  const circumference = 2 * Math.PI * 22
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative flex items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle
          cx="28" cy="28" r="22"
          fill="none"
          strokeWidth="3"
          className={getRingColor(score)}
        />
        <circle
          cx="28" cy="28" r="22"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-700', getTrackColor(score))}
        />
      </svg>
      <span className={cn('absolute text-sm font-bold', getScoreColor(score))}>
        {score}
      </span>
    </div>
  )
}

function BullBearBadge({ bullBear }: { bullBear: string }) {
  const config = {
    bullish: {
      bg: 'bg-tv-emerald-muted',
      text: 'text-tv-emerald',
      icon: TrendingUp,
      label: 'Bullish',
    },
    bearish: {
      bg: 'bg-tv-coral-muted',
      text: 'text-tv-coral',
      icon: TrendingDown,
      label: 'Bearish',
    },
    neutral: {
      bg: 'bg-tv-amber-muted',
      text: 'text-tv-amber',
      icon: Minus,
      label: 'Neutral',
    },
  } as const

  const c = config[bullBear as keyof typeof config] ?? config.neutral
  const Icon = c.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        c.bg,
        c.text
      )}
    >
      <Icon className="size-3" />
      {c.label}
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: string }) {
  const config = {
    high: { bg: 'bg-tv-emerald-muted', text: 'text-tv-emerald' },
    medium: { bg: 'bg-tv-amber-muted', text: 'text-tv-amber' },
    low: { bg: 'bg-tv-coral-muted', text: 'text-tv-coral' },
  } as const
  const c = config[confidence as keyof typeof config] ?? config.medium
  const label = confidence.charAt(0).toUpperCase() + confidence.slice(1)

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        c.bg,
        c.text
      )}
    >
      {label} Confidence
    </span>
  )
}

function RiskBadge({ risk }: { risk: string }) {
  const config = {
    low: { bg: 'bg-tv-emerald-muted', text: 'text-tv-emerald', icon: ShieldCheck },
    medium: { bg: 'bg-tv-amber-muted', text: 'text-tv-amber', icon: AlertTriangle },
    high: { bg: 'bg-tv-coral-muted', text: 'text-tv-coral', icon: ShieldAlert },
  } as const
  const c = config[risk as keyof typeof config] ?? config.medium
  const Icon = c.icon
  const label = risk.charAt(0).toUpperCase() + risk.slice(1)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        c.bg,
        c.text
      )}
    >
      <Icon className="size-3" />
      {label} Risk
    </span>
  )
}

/* ───────────────────────────── Filter Tabs ───────────────────────────── */

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'bullish', label: 'Bullish' },
  { value: 'bearish', label: 'Bearish' },
  { value: 'neutral', label: 'Neutral' },
]

/* ───────────────────────────── Report Card ───────────────────────────── */

function ReportCard({
  report,
  index,
}: {
  report: (typeof mockResearchReports)[number]
  index: number
}) {
  const { setSelectedCompany, navigate } = useTradevoStore()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card-static p-5 space-y-4"
    >
      {/* Header: Company + Score + Badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-text-primary">
              {report.companyName}
            </h3>
            <span className="text-sm text-text-tertiary font-mono">
              {report.ticker}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <BullBearBadge bullBear={report.bullBear} />
            <ConfidenceBadge confidence={report.confidence} />
            <RiskBadge risk={report.riskLevel} />
          </div>
        </div>
        <ScoreCircle score={report.overallScore} />
      </div>

      {/* Summary */}
      <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">
        {report.summary}
      </p>

      {/* AI Verdict */}
      <div className="accent-border-cyan rounded-lg bg-surface-1 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="ai-badge">AI Verdict</span>
          <Sparkles className="size-3.5 text-tv-cyan" />
        </div>
        <p className="text-sm text-text-secondary leading-relaxed">
          {report.verdict}
        </p>
      </div>

      {/* View Full Report Button */}
      <Button
        variant="outline"
        size="sm"
        className="text-tv-cyan border-tv-cyan/30 hover:bg-tv-cyan-muted hover:text-tv-cyan"
        onClick={() => {
          setSelectedCompany(report.companyId)
          navigate('company')
        }}
      >
        <Eye className="size-3.5" />
        View Full Report
      </Button>

      <Separator className="!bg-border-subtle" />

      {/* Expandable Sections */}
      <Accordion type="multiple" className="w-full">
        {report.sections.map((section, si) => (
          <AccordionItem
            key={si}
            value={`section-${si}`}
            className="border-border-subtle"
          >
            <AccordionTrigger className="text-sm font-medium text-text-primary hover:text-text-primary hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <span className="text-text-primary">{section.title}</span>
                {section.score !== null && (
                  <span
                    className={cn(
                      'text-xs font-semibold px-2 py-0.5 rounded-full',
                      section.score >= 80
                        ? 'bg-tv-emerald-muted text-tv-emerald'
                        : section.score >= 60
                          ? 'bg-tv-amber-muted text-tv-amber'
                          : 'bg-tv-coral-muted text-tv-coral'
                    )}
                  >
                    {section.score}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-sm text-text-secondary leading-relaxed">
              <p className="mb-3">{section.content}</p>
              {section.score !== null && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-text-tertiary">Section Score</span>
                    <span
                      className={cn(
                        'font-semibold',
                        section.score >= 80
                          ? 'text-tv-emerald'
                          : section.score >= 60
                            ? 'text-tv-amber'
                            : 'text-tv-coral'
                      )}
                    >
                      {section.score}/100
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${section.score}%` }}
                      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                      className={cn(
                        'h-full rounded-full',
                        section.score >= 80
                          ? 'bg-tv-emerald'
                          : section.score >= 60
                            ? 'bg-tv-amber'
                            : 'bg-tv-coral'
                      )}
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </motion.div>
  )
}

/* ───────────────────────────── Research Page ───────────────────────────── */

export function ResearchPage() {
  const [filter, setFilter] = useState<FilterTab>('all')

  const filteredReports =
    filter === 'all'
      ? mockResearchReports
      : mockResearchReports.filter((r) => r.bullBear === filter)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Research"
        badge="AI-Powered"
        subtitle="AI-generated investment analysis"
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-1 rounded-lg w-fit">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              filter === tab.value
                ? 'bg-surface-3 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {tab.label}
            {tab.value !== 'all' && (
              <span className="ml-1.5 text-xs text-text-tertiary">
                {mockResearchReports.filter((r) => r.bullBear === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="space-y-4 max-h-[calc(100vh-260px)] overflow-y-auto scrollbar-thin pr-1">
        <AnimatePresence mode="popLayout">
          {filteredReports.length > 0 ? (
            filteredReports.map((report, i) => (
              <ReportCard key={report.id} report={report} index={i} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 mb-4">
                <FileText className="size-6 text-text-tertiary" />
              </div>
              <p className="text-sm font-medium text-text-secondary">
                No reports found
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                Try selecting a different filter
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

