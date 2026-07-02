import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
} from 'lucide-react'
import { useModule } from '@/hooks/useLearning'
import { useLearningStore } from '@/stores/learningStore'
import { useLearningProgress } from '@/hooks/useLearning'
import type { LessonStatus } from '@/types/learning'

function StatusIcon({ status }: { status: LessonStatus }) {
  if (status === 'completed') {
    return <CheckCircle2 className="h-4 w-4 text-tx-success" />
  }
  if (status === 'in_progress') {
    return <Circle className="h-4 w-4 fill-accent text-accent" />
  }
  return <Circle className="h-4 w-4 text-tx-muted/40" />
}

export default function ModuleDetails() {
  const navigate = useNavigate()
  const { moduleId } = useParams()
  const { data: mod, isLoading, error } = useModule(moduleId ?? '')
  const lessonProgress = useLearningStore((s) => s.lessonProgress)
  const { moduleStats } = useLearningProgress()

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (error || !mod) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-tx-danger">
          Module not found
        </p>
        <button
          onClick={() => navigate('/learning')}
          className="mt-2 text-[13px] font-medium text-accent hover:text-accent-hover"
        >
          Back to Learning
        </button>
      </div>
    )
  }

  const modStat = moduleStats.find((s) => s.moduleId === mod.id)
  const sortedLessons = [...mod.lessons].sort(
    (a, b) => a.order - b.order,
  )
  const totalDuration = mod.lessons.reduce(
    (sum, l) => sum + l.durationMinutes,
    0,
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/learning')}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-tx-secondary transition-colors hover:bg-surface-2 hover:text-tx-primary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-semibold text-tx-primary">
              {mod.title}
            </h1>
            <span className="shrink-0 rounded bg-surface-2 px-2 py-0.5 text-[11.5px] font-medium text-tx-muted">
              {mod.category}
            </span>
          </div>
          <p className="mt-0.5 text-[13px] text-tx-muted">
            {mod.description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${modStat?.progressPercent ?? 0}%`,
            }}
          />
        </div>
        <span className="text-[12px] font-medium text-tx-secondary">
          {modStat?.completed ?? 0}/{modStat?.total ?? 0} completed
        </span>
        <span className="flex items-center gap-1 text-[12px] text-tx-muted">
          <Clock className="h-3 w-3" />
          {totalDuration} min
        </span>
      </div>

      {/* Lesson list */}
      <div className="space-y-2">
        {sortedLessons.map((lesson) => {
          const progress = lessonProgress[lesson.id]
          const status: LessonStatus =
            progress?.status ?? 'not_started'

          return (
            <button
              key={lesson.id}
              onClick={() =>
                navigate(
                  `/learning/${mod.id}/${lesson.id}`,
                )
              }
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-1 p-4 text-left transition-colors hover:border-border hover:bg-surface-2"
            >
              <StatusIcon status={status} />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-[13.5px] font-medium ${status === 'completed' ? 'text-tx-muted line-through' : 'text-tx-primary'}`}
                >
                  {lesson.order}. {lesson.title}
                </p>
                <p className="mt-0.5 text-[12px] text-tx-muted">
                  {lesson.durationMinutes} min
                  {status === 'in_progress' && ' · In progress'}
                  {status === 'completed' && ' · Completed'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-tx-muted" />
            </button>
          )
        })}
      </div>
    </div>
  )
}