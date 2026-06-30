import { create } from 'zustand'
import type { Material, Part, Project, Vec3 } from '../types'
import { createPart, createProject } from '../lib/factory'
import { generateCabinet, type CabinetParams } from '../lib/cabinet'
import { saveProject } from '../lib/persistence'
import { partSize, projectBounds, thicknessOf } from '../lib/geometry'

interface HistoryState {
  past: Project[]
  future: Project[]
}

interface ProjectStore {
  project: Project
  selectedId: string | null
  history: HistoryState
  // selection
  select: (id: string | null) => void
  // project
  setProject: (project: Project) => void
  newProject: (name?: string) => void
  renameProject: (name: string) => void
  // parts
  addPart: (partial?: Partial<Part>) => string
  updatePart: (id: string, patch: Partial<Part>) => void
  movePart: (id: string, position: Vec3) => void
  nudgeSelected: (axis: 0 | 1 | 2, delta: number) => void
  arrayDuplicate: (id: string, count: number, axis: 0 | 1 | 2, step: number) => void
  duplicatePart: (id: string) => void
  removePart: (id: string) => void
  clearParts: () => void
  // materials
  addMaterial: (m: Material) => void
  updateMaterial: (id: string, patch: Partial<Material>) => void
  removeMaterial: (id: string) => void
  // cabinet generator
  generate: (params: CabinetParams, mode: 'replace' | 'append') => void
  // history
  beginInteraction: () => void
  undo: () => void
  redo: () => void
}

const HISTORY_LIMIT = 50

function touch(project: Project): Project {
  return { ...project, updatedAt: Date.now() }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
function scheduleSave(project: Project) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    void saveProject(project)
  }, 400)
}

export const useProjectStore = create<ProjectStore>((set, get) => {
  /** Применяет мутацию к проекту с записью в историю и автосохранением. */
  const commit = (mutator: (p: Project) => Project, recordHistory = true) => {
    set((state) => {
      const next = touch(mutator(state.project))
      scheduleSave(next)
      if (!recordHistory) return { project: next }
      const past = [...state.history.past, state.project].slice(-HISTORY_LIMIT)
      return { project: next, history: { past, future: [] } }
    })
  }

  return {
    project: createProject(),
    selectedId: null,
    history: { past: [], future: [] },

    select: (id) => set({ selectedId: id }),

    setProject: (project) =>
      set({ project, selectedId: null, history: { past: [], future: [] } }),

    newProject: (name) =>
      set({ project: createProject(name), selectedId: null, history: { past: [], future: [] } }),

    renameProject: (name) => commit((p) => ({ ...p, name })),

    addPart: (partial) => {
      const state = get()
      const base = createPart(partial)
      // Умное размещение: новая деталь становится рядом со сборкой (справа,
      // на полу), а не в куче в центре. Явная позиция в partial имеет приоритет.
      let position = base.position
      if (!partial?.position) {
        const sz = partSize(base, thicknessOf(base, state.project.materials))
        if (state.project.parts.length > 0) {
          const b = projectBounds(state.project.parts, state.project.materials)
          position = [b.max[0] + 100 + sz[0] / 2, sz[1] / 2, b.center[2]]
        } else {
          position = [0, sz[1] / 2, 0]
        }
      }
      const part = { ...base, position }
      commit((p) => ({ ...p, parts: [...p.parts, part] }))
      set({ selectedId: part.id })
      return part.id
    },

    updatePart: (id, patch) =>
      commit((p) => ({
        ...p,
        parts: p.parts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),

    // Перемещение при drag — без записи каждого кадра в историю.
    movePart: (id, position) =>
      commit(
        (p) => ({
          ...p,
          parts: p.parts.map((x) => (x.id === id ? { ...x, position } : x)),
        }),
        false,
      ),

    // Сдвиг выделенной детали на шаг (стрелки клавиатуры). Один undo на нажатие.
    nudgeSelected: (axis, delta) => {
      const id = get().selectedId
      if (!id) return
      get().beginInteraction()
      commit(
        (p) => ({
          ...p,
          parts: p.parts.map((x) =>
            x.id === id
              ? { ...x, position: x.position.map((v, i) => (i === axis ? v + delta : v)) as Vec3 }
              : x,
          ),
        }),
        false,
      )
    },

    // Дублирование массивом: count копий со смещением step по оси axis.
    arrayDuplicate: (id, count, axis, step) =>
      commit((p) => {
        const src = p.parts.find((x) => x.id === id)
        if (!src || count < 1) return p
        const copies: Part[] = []
        for (let k = 1; k <= count; k++) {
          const position = [...src.position] as Vec3
          position[axis] += step * k
          copies.push(createPart({ ...src, position }))
        }
        return { ...p, parts: [...p.parts, ...copies] }
      }),

    duplicatePart: (id) =>
      commit((p) => {
        const src = p.parts.find((x) => x.id === id)
        if (!src) return p
        const copy = createPart({
          ...src,
          name: src.name + ' (копия)',
          position: [src.position[0] + 50, src.position[1], src.position[2] + 50],
        })
        return { ...p, parts: [...p.parts, copy] }
      }),

    removePart: (id) => {
      commit((p) => ({ ...p, parts: p.parts.filter((x) => x.id !== id) }))
      if (get().selectedId === id) set({ selectedId: null })
    },

    clearParts: () => {
      commit((p) => ({ ...p, parts: [] }))
      set({ selectedId: null })
    },

    addMaterial: (m) => commit((p) => ({ ...p, materials: [...p.materials, m] })),

    updateMaterial: (id, patch) =>
      commit((p) => ({
        ...p,
        materials: p.materials.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      })),

    removeMaterial: (id) =>
      commit((p) => {
        if (p.materials.length <= 1) return p
        return { ...p, materials: p.materials.filter((x) => x.id !== id) }
      }),

    generate: (params, mode) =>
      commit((p) => {
        const generated = generateCabinet(params)
        return {
          ...p,
          parts: mode === 'replace' ? generated : [...p.parts, ...generated],
        }
      }),

    // Снимок состояния перед началом интерактивного действия (drag),
    // чтобы вся серия движений откатывалась одним undo.
    beginInteraction: () =>
      set((state) => ({
        history: {
          past: [...state.history.past, state.project].slice(-HISTORY_LIMIT),
          future: [],
        },
      })),

    undo: () =>
      set((state) => {
        const past = state.history.past
        if (past.length === 0) return state
        const previous = past[past.length - 1]
        scheduleSave(previous)
        return {
          project: previous,
          history: {
            past: past.slice(0, -1),
            future: [state.project, ...state.history.future].slice(0, HISTORY_LIMIT),
          },
        }
      }),

    redo: () =>
      set((state) => {
        const future = state.history.future
        if (future.length === 0) return state
        const next = future[0]
        scheduleSave(next)
        return {
          project: next,
          history: {
            past: [...state.history.past, state.project].slice(-HISTORY_LIMIT),
            future: future.slice(1),
          },
        }
      }),
  }
})
