import type { CabinetParams, Material, Part } from '../types'
import { emptyEdges } from './factory'

export type PresetKind = 'shelf' | 'divider' | 'facade' | 'custom'

export const PRESETS: { kind: PresetKind; label: string }[] = [
  { kind: 'shelf', label: '+ Полка' },
  { kind: 'divider', label: '+ Перегородка' },
  { kind: 'facade', label: '+ Фасад' },
  { kind: 'custom', label: '+ Деталь' },
]

/**
 * Формирует заготовку детали под текущий корпус (если он есть).
 * Возвращает Partial<Part> для store.addPart — деталь остаётся ручной
 * (без флага generated) и переживает пересборку корпуса.
 */
export function presetPart(
  kind: PresetKind,
  cabinet: CabinetParams | undefined,
  materials: Material[],
): Partial<Part> {
  const t = cabinet?.thickness ?? 18
  const W = cabinet?.width ?? 600
  const H = cabinet?.height ?? 720
  const D = cabinet?.depth ?? 320
  const facadeReduce = cabinet?.facade ? cabinet.facadeThickness + cabinet.facadeGap : 0
  const Dc = Math.max(50, D - facadeReduce)
  const matId = cabinet?.materialId ?? materials[0]?.id
  const front = cabinet?.frontEdge ?? 2

  switch (kind) {
    case 'shelf':
      return {
        name: 'Полка',
        role: 'shelf',
        materialId: matId,
        orientation: 'flat',
        length: Math.max(50, W - 2 * t),
        width: Math.max(50, Dc - 20),
        grain: 'length',
        edges: { ...emptyEdges(), W1: front },
        position: [0, H / 2, -10],
      }
    case 'divider':
      return {
        name: 'Перегородка',
        role: 'divider',
        materialId: matId,
        orientation: 'left-right',
        length: Math.max(50, H - 2 * t),
        width: Dc,
        grain: 'length',
        edges: { ...emptyEdges(), L1: front },
        position: [0, H / 2, 0],
      }
    case 'facade':
      return {
        name: 'Фасад',
        role: 'facade',
        materialId: cabinet?.facadeMaterialId ?? matId,
        orientation: 'front-back',
        length: W,
        width: H,
        grain: 'length',
        edges: { ...emptyEdges(), L1: front, L2: front, W1: front, W2: front },
        position: [0, H / 2, Dc / 2 + 20],
      }
    case 'custom':
    default:
      // без position — сработает умное размещение рядом со сборкой
      return { name: 'Деталь' }
  }
}
