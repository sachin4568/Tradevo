import { create } from 'zustand'
import type { LessonProgress } from '@/types/learning'

interface LearningState {
  lessonProgress: Record<string, LessonProgress>
  achievements: string[]
  startLesson: (lessonId: string) => void
  completeLesson: (lessonId: string) => void
  unlockAchievement: (achievementId: string) => void
}

export const useLearningStore = create<LearningState>((set, get) => ({
  lessonProgress: {},
  achievements: [],

  startLesson: (lessonId) => {
    const { lessonProgress } = get()
    const existing = lessonProgress[lessonId]

    if (!existing || existing.status === 'not_started') {
      set({
        lessonProgress: {
          ...lessonProgress,
          [lessonId]: {
            status: 'in_progress',
            startedAt: new Date().toISOString(),
            completedAt: null,
          },
        },
      })
    }
  },

  completeLesson: (lessonId) => {
    const { lessonProgress } = get()
    const existing = lessonProgress[lessonId]

    set({
      lessonProgress: {
        ...lessonProgress,
        [lessonId]: {
          status: 'completed',
          startedAt: existing?.startedAt ?? new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      },
    })
  },

  unlockAchievement: (achievementId) => {
    const { achievements } = get()
    if (!achievements.includes(achievementId)) {
      set({ achievements: [...achievements, achievementId] })
    }
  },
}))