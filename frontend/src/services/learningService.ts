import type { ApiResponse } from '@/types/api'
import type { LearningModule, Lesson } from '@/types/learning'
import { getModules, getModuleById, getLessonById } from '@/data/learning'

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function fetchModules(): Promise<ApiResponse<LearningModule[]>> {
  await delay(200)
  return {
    success: true,
    message: 'Operation successful',
    data: getModules(),
  }
}

export async function fetchModuleById(
  id: string,
): Promise<ApiResponse<LearningModule>> {
  await delay(150)
  const module = getModuleById(id)
  if (!module) throw new Error('Module not found')
  return {
    success: true,
    message: 'Operation successful',
    data: module,
  }
}

export async function fetchLessonById(
  moduleId: string,
  lessonId: string,
): Promise<ApiResponse<{ module: LearningModule; lesson: Lesson }>> {
  await delay(100)
  const module = getModuleById(moduleId)
  if (!module) throw new Error('Module not found')
  const lesson = getLessonById(moduleId, lessonId)
  if (!lesson) throw new Error('Lesson not found')
  return {
    success: true,
    message: 'Operation successful',
    data: { module, lesson },
  }
}