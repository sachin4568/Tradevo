export type LessonStatus = 'not_started' | 'in_progress' | 'completed'
export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Lesson {
  id: string
  moduleId: string
  title: string
  content: string
  order: number
  durationMinutes: number
}

export interface LearningModule {
  id: string
  title: string
  description: string
  category: Difficulty
  lessons: Lesson[]
  icon: string
}

export interface LessonProgress {
  status: LessonStatus
  startedAt: string | null
  completedAt: string | null
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked?: boolean
}