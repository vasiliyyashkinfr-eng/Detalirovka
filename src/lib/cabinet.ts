import type { EdgeBanding, EdgeThickness, Part } from '../types'
import { emptyEdges } from './factory'
import { uid } from './id'

export interface CabinetParams {
  name: string
  width: number // Ш, мм (X)
  height: number // В, мм (Y)
  depth: number // Г, мм (Z)
  thickness: number // толщина ЛДСП корпуса, мм
  backThickness: number // толщина задней стенки, мм
  shelves: number // количество полок
  hasBack: boolean
  hasTop: boolean // сплошная крыша (иначе считаем как открытый верх)
  materialId: string
  backMaterialId: string
  frontEdge: EdgeThickness // кромка переднего торца
}

export const DEFAULT_CABINET: CabinetParams = {
  name: 'Корпус',
  width: 600,
  height: 720,
  depth: 320,
  thickness: 18,
  backThickness: 3,
  shelves: 2,
  hasBack: true,
  hasTop: true,
  materialId: 'mat_ldsp_18',
  backMaterialId: 'mat_hdf_3',
  frontEdge: 2,
}

function edges(parts: Partial<EdgeBanding>): EdgeBanding {
  return { ...emptyEdges(), ...parts }
}

/**
 * Генерирует детали корпуса по габаритам.
 * Конструктив: боковины во всю высоту, дно и крыша между ними,
 * задняя стенка накладная сзади. Корпус стоит на полу (y=0..H), центр в X/Z.
 */
export function generateCabinet(p: CabinetParams): Part[] {
  const { width: W, height: H, depth: D, thickness: t, backThickness: tb } = p
  const parts: Part[] = []
  const front = p.frontEdge

  // Боковины
  for (const [side, x] of [
    ['Левая', -W / 2 + t / 2],
    ['Правая', W / 2 - t / 2],
  ] as const) {
    parts.push({
      id: uid('part'),
      name: `Боковина ${side.toLowerCase()}`,
      role: 'side',
      materialId: p.materialId,
      length: H,
      width: D,
      orientation: 'left-right',
      edges: edges({ L1: front }),
      grain: 'length',
      qty: 1,
      position: [x, H / 2, 0],
      holes: [],
    })
  }

  const innerW = W - 2 * t

  // Дно
  parts.push({
    id: uid('part'),
    name: 'Дно',
    role: 'bottom',
    materialId: p.materialId,
    length: innerW,
    width: D,
    orientation: 'flat',
    edges: edges({ W1: front }),
    grain: 'length',
    qty: 1,
    position: [0, t / 2, 0],
    holes: [],
  })

  // Крыша
  if (p.hasTop) {
    parts.push({
      id: uid('part'),
      name: 'Крыша',
      role: 'top',
      materialId: p.materialId,
      length: innerW,
      width: D,
      orientation: 'flat',
      edges: edges({ W1: front }),
      grain: 'length',
      qty: 1,
      position: [0, H - t / 2, 0],
      holes: [],
    })
  }

  // Полки (с отступом 20 мм от фасада)
  const shelfDepth = Math.max(50, D - 20)
  const shelfZ = -(D - shelfDepth) / 2
  const n = Math.max(0, Math.floor(p.shelves))
  for (let k = 1; k <= n; k++) {
    const y = t + ((H - 2 * t) * k) / (n + 1)
    parts.push({
      id: uid('part'),
      name: `Полка ${k}`,
      role: 'shelf',
      materialId: p.materialId,
      length: innerW,
      width: shelfDepth,
      orientation: 'flat',
      edges: edges({ W1: front }),
      grain: 'length',
      qty: 1,
      position: [0, y, shelfZ],
      holes: [],
    })
  }

  // Задняя стенка (накладная)
  if (p.hasBack) {
    parts.push({
      id: uid('part'),
      name: 'Задняя стенка',
      role: 'back',
      materialId: p.backMaterialId,
      length: W,
      width: H,
      orientation: 'front-back',
      edges: emptyEdges(),
      grain: 'none',
      qty: 1,
      position: [0, H / 2, -D / 2 + tb / 2],
      holes: [],
    })
  }

  return parts
}
