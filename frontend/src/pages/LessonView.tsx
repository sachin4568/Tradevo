import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
} from 'lucide-react'
import { useLesson } from '@/hooks/useLearning'
import { useLearningStore } from '@/stores/learningStore'
import MarkdownContent from '@/components/shared/MarkdownContent'

export default function LessonView() {
  const navigate = useNavigate()
  const { moduleId, lessonId } = useParams()
  const { data, isLoading, error } = useLesson(
    moduleId ?? '',
    lessonId ?? '',
  )
  const lessonProgress = useLearningStore((s) => s.lessonProgress)
  const startLesson = useLearningStore((s) => s.startLesson)
  const completeLesson = useLearningStore(
    (s) => s.completeLesson,
  )

  // Auto-mark as in_progress when lesson is opened
  useEffect(() => {
    if (lessonId) {
      startLesson(lessonId)
    }
  }, [lessonId, startLesson])

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-96 flex-col items-center justify-center">
        <p className="text-[14px] font-medium text-tx-danger">
          Lesson not found
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

  const { module: mod, lesson } = data
  const status =
    lessonProgress[lesson.id]?.status ?? 'not_started'
  const isCompleted = status === 'completed'

  // Find next lesson
  const sortedLessons = [...mod.lessons].sort(
    (a, b) => a.order - b.order,
  )
  const currentIdx = sortedLessons.findIndex(
    (l) => l.id === lesson.id,
  )
  const nextLesson = sortedLessons[currentIdx + 1]
  const prevLesson = sortedLessons[currentIdx - 1]

  function handleComplete() {
    completeLesson(lesson.id)
  }

  function handleNext() {
    if (nextLesson) {
      navigate(`/learning/${mod.id}/${nextLesson.id}`)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12.5px] text-tx-muted">
        <button
          onClick={() => navigate('/learning')}
          className="transition-colors hover:text-tx-secondary"
        >
          Learning
        </button>
        <ChevronRight className="h-3 w-3" />
        <button
          onClick={() => navigate(`/learning/${mod.id}`)}
          className="transition-colors hover:text-tx-secondary"
        >
          {mod.title}
        </button>
        <ChevronRight className="h-3 w-3" />
        <span className="text-tx-secondary">{lesson.title}</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[12px] text-tx-muted">
          <span>{mod.category}</span>
          <span>&middot;</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {lesson.durationMinutes} min
          </span>
          {isCompleted && (
            <>
              <span>&middot;</span>
              <span className="flex items-center gap-1 text-tx-success">
                <CheckCircle2 className="h-3 w-3" />
                Completed
              </span>
            </>
          )}
        </div>
        <h1 className="mt-1.5 text-xl font-semibold text-tx-primary">
          {lesson.order}. {lesson.title}
        </h1>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <MarkdownContent content={lesson.content} />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-surface-1 p-4">
        <div className="flex items-center gap-3">
          {prevLesson ? (
            <button
              onClick={() =>
                navigate(
                  `/learning/${mod.id}/${prevLesson.id}`,
                )
              }
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-tx-secondary transition-colors hover:bg-surface-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </button>
          ) : (
            <button
              onClick={() => navigate(`/learning/${mod.id}`)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-tx-secondary transition-colors hover:bg-surface-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Module
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isCompleted && (
            <button
              onClick={handleComplete}
              className="flex items-center gap-1.5 rounded-lg bg-tx-success px-4 py-2 text-[13px] font-semibold text-surface-0 transition-colors hover:bg-tx-success/90"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark Complete
            </button>
          )}
          {nextLesson && (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-semibold text-surface-0 transition-colors hover:bg-accent-hover"
            >
              Next Lesson
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}