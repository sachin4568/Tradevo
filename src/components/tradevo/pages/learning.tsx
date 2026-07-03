'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  PlayCircle,
  CheckCircle2,
  BarChart3,
  GraduationCap,
  Shield,
  Layers,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/tradevo/shared/page-header'
import { Button } from '@/components/ui/button'
import { mockLearningModules } from '@/lib/mock-data'

/* ───────────────────────────── Types ───────────────────────────── */

type CategoryFilter = 'All' | 'Fundamentals' | 'Technical' | 'Portfolio' | 'Risk'
type Difficulty = 'beginner' | 'intermediate' | 'advanced'

/* ───────────────────────────── Helpers ───────────────────────────── */

const CATEGORY_TABS: CategoryFilter[] = [
  'All',
  'Fundamentals',
  'Technical',
  'Portfolio',
  'Risk',
]

const DIFFICULTY_CONFIG: Record<Difficulty, { bg: string; text: string; label: string }> = {
  beginner: { bg: 'bg-tv-emerald-muted', text: 'text-tv-emerald', label: 'Beginner' },
  intermediate: { bg: 'bg-tv-amber-muted', text: 'text-tv-amber', label: 'Intermediate' },
  advanced: { bg: 'bg-tv-coral-muted', text: 'text-tv-coral', label: 'Advanced' },
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Fundamentals: { bg: 'bg-tv-cyan-muted', text: 'text-tv-cyan' },
  'Technical Analysis': { bg: 'bg-tv-blue-muted', text: 'text-tv-blue' },
  'Portfolio Management': { bg: 'bg-tv-emerald-muted', text: 'text-tv-emerald' },
  Derivatives: { bg: 'bg-tv-amber-muted', text: 'text-tv-amber' },
  'Fundamental Analysis': { bg: 'bg-tv-cyan-muted', text: 'text-tv-cyan' },
}

function getModuleStatus(
  module: (typeof mockLearningModules)[number]
): 'completed' | 'in-progress' | 'not-started' {
  if (module.progress === 100) return 'completed'
  if (module.progress > 0) return 'in-progress'
  return 'not-started'
}

/* ───────────────────────────── Stats Row ───────────────────────────── */

function StatsRow({ modules }: { modules: typeof mockLearningModules }) {
  const completed = modules.filter((m) => m.progress === 100).length
  const inProgress = modules.filter((m) => m.progress > 0 && m.progress < 100).length

  const totalMinutes = modules.reduce((acc, m) => {
    const parts = m.duration.match(/(\d+)h\s*(\d+)m/)
    if (parts) return acc + parseInt(parts[1]) * 60 + parseInt(parts[2])
    return acc
  }, 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10

  const stats = [
    { label: 'Total Modules', value: modules.length, icon: BookOpen, color: 'text-tv-cyan' },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-tv-emerald' },
    { label: 'In Progress', value: inProgress, icon: PlayCircle, color: 'text-tv-amber' },
    { label: 'Total Hours', value: `${totalHours}h`, icon: Clock, color: 'text-tv-blue' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            className="surface-card-static p-4 flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 shrink-0">
              <Icon className={cn('size-4.5', stat.color)} />
            </div>
            <div>
              <p className="text-lg font-semibold text-text-primary">{stat.value}</p>
              <p className="text-xs text-text-tertiary">{stat.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ───────────────────────────── Module Card ───────────────────────────── */

function ModuleCard({
  module,
  index,
}: {
  module: (typeof mockLearningModules)[number]
  index: number
}) {
  const status = getModuleStatus(module)
  const diff = DIFFICULTY_CONFIG[module.difficulty as Difficulty]
  const catColor = CATEGORY_COLORS[module.category] ?? CATEGORY_COLORS['Fundamentals']

  const getProgressColor = () => {
    if (module.progress === 100) return 'bg-tv-emerald'
    if (module.progress > 0) return 'bg-tv-amber'
    return 'bg-text-tertiary/30'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card p-5 flex flex-col"
    >
      {/* Top row: category badge + difficulty */}
      <div className="flex items-center justify-between mb-3">
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            catColor.bg,
            catColor.text
          )}
        >
          {module.category}
        </span>
        <span
          className={cn(
            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
            diff.bg,
            diff.text
          )}
        >
          {diff.label}
        </span>
      </div>

      {/* Title + Description */}
      <div className="flex-1 mb-4">
        <h3 className="text-base font-medium text-text-primary mb-1.5 leading-snug">
          {module.title}
        </h3>
        <p className="text-sm text-text-secondary line-clamp-2 leading-relaxed">
          {module.description}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-text-tertiary">Progress</span>
          <span className="text-text-secondary font-medium">{module.progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${module.progress}%` }}
            transition={{ duration: 0.6, delay: 0.3 + index * 0.05, ease: 'easeOut' }}
            className={cn('h-full rounded-full transition-colors', getProgressColor())}
          />
        </div>
      </div>

      {/* Footer: lessons + duration + button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-text-tertiary">
          <span className="flex items-center gap-1">
            <BookOpen className="size-3" />
            {module.completedLessons}/{module.lessons} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {module.duration}
          </span>
        </div>

        {status === 'in-progress' && (
          <Button size="sm" className="h-7 text-xs px-3">
            <PlayCircle className="size-3" />
            Continue
          </Button>
        )}
        {status === 'not-started' && (
          <Button size="sm" variant="outline" className="h-7 text-xs px-3">
            <PlayCircle className="size-3" />
            Start
          </Button>
        )}
        {status === 'completed' && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs px-3 text-tv-emerald hover:text-tv-emerald hover:bg-tv-emerald-muted"
          >
            <CheckCircle2 className="size-3" />
            Review
          </Button>
        )}
      </div>
    </motion.div>
  )
}

/* ───────────────────────────── Learning Page ───────────────────────────── */

export function LearningPage() {
  const [category, setCategory] = useState<CategoryFilter>('All')

  const filteredModules =
    category === 'All'
      ? mockLearningModules
      : mockLearningModules.filter((m) => {
          if (category === 'Risk') return m.category === 'Derivatives'
          if (category === 'Technical') return m.category === 'Technical Analysis'
          if (category === 'Portfolio') return m.category === 'Portfolio Management'
          return m.category.includes(category)
        })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Learning"
        subtitle="Master investing with AI-guided lessons"
      />

      {/* Stats Row */}
      <StatsRow modules={mockLearningModules} />

      {/* Category pills */}
      <div className="flex items-center gap-1.5 p-1 bg-surface-1 rounded-lg w-fit">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setCategory(tab)}
            className={cn(
              'px-3.5 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
              category === tab
                ? 'bg-surface-3 text-text-primary shadow-sm'
                : 'text-text-tertiary hover:text-text-secondary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredModules.length > 0 ? (
          filteredModules.map((module, i) => (
            <ModuleCard key={module.id} module={module} index={i} />
          ))
        ) : (
          <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 mb-4">
              <GraduationCap className="size-6 text-text-tertiary" />
            </div>
            <p className="text-sm font-medium text-text-secondary">
              No modules in this category
            </p>
            <p className="text-xs text-text-tertiary mt-1">
              Check back soon for new content
            </p>
          </div>
        )}
      </div>
    </div>
  )
}