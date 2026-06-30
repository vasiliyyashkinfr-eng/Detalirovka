import { del, get, keys, set } from 'idb-keyval'
import type { Project } from '../types'
import { SCHEMA_VERSION } from '../types'

const PREFIX = 'detalirovka:project:'
const LAST_KEY = 'detalirovka:lastProjectId'

export async function saveProject(project: Project): Promise<void> {
  await set(PREFIX + project.id, project)
  await set(LAST_KEY, project.id)
}

export async function loadProject(id: string): Promise<Project | undefined> {
  return (await get(PREFIX + id)) as Project | undefined
}

export async function deleteProject(id: string): Promise<void> {
  await del(PREFIX + id)
}

export async function lastProjectId(): Promise<string | undefined> {
  return (await get(LAST_KEY)) as string | undefined
}

export interface ProjectSummary {
  id: string
  name: string
  updatedAt: number
  parts: number
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const allKeys = (await keys()) as string[]
  const out: ProjectSummary[] = []
  for (const k of allKeys) {
    if (typeof k === 'string' && k.startsWith(PREFIX)) {
      const p = (await get(k)) as Project | undefined
      if (p) out.push({ id: p.id, name: p.name, updatedAt: p.updatedAt, parts: p.parts.length })
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt)
}

/** Скачать произвольный текст как файл. */
export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Базовая валидация импортируемого проекта. */
export function validateProject(data: unknown): data is Project {
  if (!data || typeof data !== 'object') return false
  const p = data as Partial<Project>
  return (
    typeof p.id === 'string' &&
    typeof p.name === 'string' &&
    Array.isArray(p.materials) &&
    Array.isArray(p.parts)
  )
}

export function migrateProject(project: Project): Project {
  if (!project.schemaVersion) project.schemaVersion = SCHEMA_VERSION
  // Корпуса из ранней параметрической версии не имели backReduction.
  if (project.cabinet && project.cabinet.backReduction == null) {
    project.cabinet = { ...project.cabinet, backReduction: 5 }
  }
  return project
}
