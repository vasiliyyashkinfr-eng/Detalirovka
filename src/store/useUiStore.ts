import { create } from 'zustand'

export const GRID_STEPS = [1, 8, 16, 32] as const

interface UiStore {
  gridStep: number // шаг привязки к сетке, мм
  snapGrid: boolean // привязка к сетке вкл/выкл
  faceSnap: boolean // прилипание к граням соседних деталей
  gap: number // зазор для прилипания и точной расстановки, мм
  showDims: boolean // показывать редактируемые размеры в 3D
  dimMode: 'clear' | 'center' // тип размеров: в свету / по осям
  set: (patch: Partial<Omit<UiStore, 'set'>>) => void
}

export const useUiStore = create<UiStore>((set) => ({
  gridStep: 16,
  snapGrid: true,
  faceSnap: true,
  gap: 0,
  showDims: true,
  dimMode: 'clear',
  set: (patch) => set(patch),
}))
