import { useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  fetchModules,
  fetchModuleById,
  fetchLessonById,
} from '@/services/learningService'
import { useLearningStore } from '@/stores/learningStore'
import { usePortfolioStore } from '@/stores/portfolioStore'
import { ACHIEVEMENTS, getModuleById } from '@/data/learning'
import type { LearningModule } from '@/types/learning'
import type { Achievement } from '@/types/learning'

// ─── TanStack Query hooks ───

export function useModules() {
  return useQuery<LearningModule[]>({
    queryKey: ['learning-modules'],
    queryFn: async () => {
      const res = await fetchModules()
      if (!res.success) throw new Error(res.message)
      return res.data
    },
  })
}

export function useModule(moduleId: string) {
  return useQuery<LearningModule>({
    queryKey: ['learning-module', moduleId],
    queryFn: async () => {
      const res = await fetchModuleById(moduleId)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    enabled: !!moduleId,
  })
}

export function useLesson(moduleId: string, lessonId: string) {
  return useQuery<{
    module: LearningModule
    lesson: LearningModule['lessons'][number]
  }>({
    queryKey: ['learning-lesson', moduleId, lessonId],
    queryFn: async () => {
      const res = await fetchLessonById(moduleId, lessonId)
      if (!res.success) throw new Error(res.message)
      return res.data
    },
    enabled: !!moduleId && !!lessonId,
  })
}

// ─── Computed progress hooks ───

export function useLearningProgress() {
  const lessonProgress = useLearningStore((s) => s.lessonProgress)
  const { data: modules } = useModules()

  const stats = useMemo(() => {
    if (!modules) {
      return {
        totalLessons: 0,
        completedCount: 0,
        inProgressCount: 0,
        notStartedCount: 0,
        progressPercent: 0,
        totalDurationMinutes: 0,
        completedDurationMinutes: 0,
      }
    }

    const allLessons = modules.flatMap((m) => m.lessons)
    const totalLessons = allLessons.length
    const totalDurationMinutes = allLessons.reduce(
      (sum, l) => sum + l.durationMinutes,
      0,
    )

    let completedCount = 0
    let inProgressCount = 0
    let completedDurationMinutes = 0

    for (const lesson of allLessons) {
      const progress = lessonProgress[lesson.id]
      if (progress?.status === 'completed') {
        completedCount++
        completedDurationMinutes += lesson.durationMinutes
      } else if (progress?.status === 'in_progress') {
        inProgressCount++
      }
    }

    const notStartedCount =
      totalLessons - completedCount - inProgressCount
    const progressPercent =
      totalLessons > 0
        ? Math.round((completedCount / totalLessons) * 100)
        : 0

    return {
      totalLessons,
      completedCount,
      inProgressCount,
      notStartedCount,
      progressPercent,
      totalDurationMinutes,
      completedDurationMinutes,
    }
  }, [modules, lessonProgress])

  const moduleStats = useMemo(() => {
    if (!modules) return []

    return modules.map((mod) => {
      const total = mod.lessons.length
      let completed = 0
      let inProgress = 0

      for (const lesson of mod.lessons) {
        const p = lessonProgress[lesson.id]
        if (p?.status === 'completed') completed++
        else if (p?.status === 'in_progress') inProgress++
      }

      return {
        moduleId: mod.id,
        total,
        completed,
        inProgress,
        notStarted: total - completed - inProgress,
        progressPercent:
          total > 0 ? Math.round((completed / total) * 100) : 0,
      }
    })
  }, [modules, lessonProgress])

  const nextLesson = useMemo(() => {
    if (!modules) return null
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        const p = lessonProgress[lesson.id]
        if (!p || p.status === 'in_progress') {
          return {
            moduleId: mod.id,
            lessonId: lesson.id,
            title: lesson.title,
            moduleTitle: mod.title,
          }
        }
      }
    }
    return null
  }, [modules, lessonProgress])

  const currentModule = useMemo(() => {
    if (!modules) return null
    for (const mod of modules) {
      for (const lesson of mod.lessons) {
        const p = lessonProgress[lesson.id]
        if (p?.status === 'in_progress') {
          return { moduleId: mod.id, title: mod.title }
        }
      }
    }
    return null
  }, [modules, lessonProgress])

  return { ...stats, moduleStats, nextLesson, currentModule }
}

// ─── Achievements ───

export function useAchievements() {
  const achievements = useLearningStore((s) => s.achievements)
  const unlockAchievement = useLearningStore((s) => s.unlockAchievement)
  const lessonProgress = useLearningStore((s) => s.lessonProgress)
  const transactions = usePortfolioStore((s) => s.transactions)

  useEffect(() => {
    const completedCount = Object.values(lessonProgress).filter(
      (p) => p.status === 'completed',
    ).length

    const marketBasicsModule = getModuleById('mod-001')
    const marketBasicsComplete =
      marketBasicsModule &&
      marketBasicsModule.lessons.every(
        (l) => lessonProgress[l.id]?.status === 'completed',
      )

    if (completedCount >= 1) unlockAchievement('ach-001')
    if (completedCount >= 5) unlockAchievement('ach-002')
    if (transactions.length >= 1) unlockAchievement('ach-003')
    if (marketBasicsComplete) unlockAchievement('ach-004')
  }, [lessonProgress, transactions, unlockAchievement])

  const all: Achievement[] = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: achievements.includes(a.id),
  }))

  const unlocked = all.filter((a) => a.unlocked)

  return { all, unlocked }
}