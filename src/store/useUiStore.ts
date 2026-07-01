import { create } from 'zustand'
import type { EdgeAnchor, EdgeRef } from '../lib/dimensions'

export const GRID_STEPS = [1, 8, 16, 32] as const

interface UiStore {
  gridStep: number // шаг привязки к сетке, мм
  snapGrid: boolean // привязка к сетке вкл/выкл
  faceSnap: boolean // прилипание к граням соседних деталей
  gap: number // зазор для прилипания и точной расстановки, мм
  showDims: boolean // показывать редактируемые размеры в 3D
  dimMode: 'clear' | 'center' // тип размеров: в свету / по осям
  measureEdges: boolean // режим выбора кромок и размера между ними
  edgeA: EdgeRef | null
  edgeB: EdgeRef | null
  set: (patch: Partial<Omit<UiStore, 'set'>>) => void
  pickEdge: (ref: EdgeRef) => void
  setEdgeAnchor: (which: 'A' | 'B', ref: EdgeAnchor) => void
  clearEdges: () => void
}

function sameEdge(a: EdgeRef | null, b: EdgeRef): boolean {
  return !!a && a.partId === b.partId && a.axis === b.axis && a.ref === b.ref
}

export const useUiStore = create<UiStore>((set) => ({
  gridStep: 16,
  snapGrid: true,
  faceSnap: true,
  gap: 0,
  showDims: true,
  dimMode: 'clear',
  measureEdges: false,
  edgeA: null,
  edgeB: null,
  set: (patch) => set(patch),
  clearEdges: () => set({ edgeA: null, edgeB: null }),
  pickEdge: (ref) =>
    set((s) => {
      if (!s.edgeA) return { edgeA: ref, edgeB: null }
      if (sameEdge(s.edgeA, ref)) return { edgeA: null, edgeB: null } // повторный клик снимает
      if (!s.edgeB) {
        // вторая кромка должна быть по той же оси (параллельные грани)
        if (ref.axis !== s.edgeA.axis) return { edgeA: ref, edgeB: null }
        return { edgeB: ref }
      }
      return { edgeA: ref, edgeB: null } // начинаем новую пару
    }),
  setEdgeAnchor: (which, ref) =>
    set((s) => {
      const cur = which === 'A' ? s.edgeA : s.edgeB
      if (!cur) return {}
      return which === 'A' ? { edgeA: { ...cur, ref } } : { edgeB: { ...cur, ref } }
    }),
}))
