import type { CabinetParams, EdgeBanding, Part } from '../types'
import { emptyEdges } from './factory'
import { uid } from './id'

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
  topMode: 'inset',
  bottomMode: 'inset',
  facade: false,
  facadeThickness: 18,
  facadeGap: 2,
  materialId: 'mat_ldsp_18',
  backMaterialId: 'mat_hdf_3',
  facadeMaterialId: 'mat_ldsp_18',
  frontEdge: 2,
}

function edges(partial: Partial<EdgeBanding>): EdgeBanding {
  return { ...emptyEdges(), ...partial }
}

type PartDraft = Omit<Part, 'id' | 'qty' | 'holes' | 'generated'>

function part(o: PartDraft): Part {
  return { id: uid('part'), qty: 1, holes: [], generated: true, ...o }
}

/**
 * Генерирует детали корпуса по параметрам с учётом конструктива:
 *  - крыша вкладная между боковинами или накладная сверху;
 *  - дно вкладное или боковины стоят на дне;
 *  - опциональный фасад (его толщина и зазор входят в общую глубину).
 * Корпус стоит на полу (Y = 0..H), центр в X/Z.
 */
export function generateCabinet(p: CabinetParams): Part[] {
  const { width: W, height: H, thickness: t, backThickness: tb } = p
  const front = p.frontEdge
  const tf = p.facadeThickness
  const fgap = p.facadeGap

  // Глубина корпуса: при фасаде из габарита вычитается толщина фасада и зазор.
  const Dc = p.facade ? Math.max(50, p.depth - tf - fgap) : p.depth

  const parts: Part[] = []

  // Вертикальные границы боковин зависят от конструктива дна/крыши.
  const sideBottomY = p.bottomMode === 'sides-on-bottom' ? t : 0
  const sideTopY = p.hasTop && p.topMode === 'overlay' ? H - t : H
  const sideHeight = Math.max(50, sideTopY - sideBottomY)
  const sideCenterY = (sideBottomY + sideTopY) / 2

  // Боковины
  for (const [side, x] of [
    ['левая', -W / 2 + t / 2],
    ['правая', W / 2 - t / 2],
  ] as const) {
    parts.push(
      part({
        name: `Боковина ${side}`,
        role: 'side',
        materialId: p.materialId,
        length: sideHeight,
        width: Dc,
        orientation: 'left-right',
        edges: edges({ L1: front }),
        grain: 'length',
        position: [x, sideCenterY, 0],
      }),
    )
  }

  // Дно: вкладное (между боковинами) или сплошное (боковины на дне)
  const bottomLen = p.bottomMode === 'sides-on-bottom' ? W : W - 2 * t
  parts.push(
    part({
      name: 'Дно',
      role: 'bottom',
      materialId: p.materialId,
      length: bottomLen,
      width: Dc,
      orientation: 'flat',
      edges: edges({ W1: front }),
      grain: 'length',
      position: [0, t / 2, 0],
    }),
  )

  // Крыша: вкладная или накладная сверху
  if (p.hasTop) {
    const topLen = p.topMode === 'overlay' ? W : W - 2 * t
    parts.push(
      part({
        name: 'Крыша',
        role: 'top',
        materialId: p.materialId,
        length: topLen,
        width: Dc,
        orientation: 'flat',
        edges: edges({ W1: front }),
        grain: 'length',
        position: [0, H - t / 2, 0],
      }),
    )
  }

  // Полки (с отступом 20 мм от фасада)
  const shelfDepth = Math.max(50, Dc - 20)
  const shelfZ = -(Dc - shelfDepth) / 2
  const n = Math.max(0, Math.floor(p.shelves))
  for (let k = 1; k <= n; k++) {
    const y = t + ((H - 2 * t) * k) / (n + 1)
    parts.push(
      part({
        name: `Полка ${k}`,
        role: 'shelf',
        materialId: p.materialId,
        length: W - 2 * t,
        width: shelfDepth,
        orientation: 'flat',
        edges: edges({ W1: front }),
        grain: 'length',
        position: [0, y, shelfZ],
      }),
    )
  }

  // Задняя стенка (накладная сзади)
  if (p.hasBack) {
    parts.push(
      part({
        name: 'Задняя стенка',
        role: 'back',
        materialId: p.backMaterialId,
        length: W,
        width: H,
        orientation: 'front-back',
        edges: emptyEdges(),
        grain: 'none',
        position: [0, H / 2, -Dc / 2 + tb / 2],
      }),
    )
  }

  // Фасад (накладной спереди, с зазором)
  if (p.facade) {
    const fz = Dc / 2 + fgap + tf / 2
    parts.push(
      part({
        name: 'Фасад',
        role: 'facade',
        materialId: p.facadeMaterialId,
        length: W,
        width: H,
        orientation: 'front-back',
        edges: edges({ L1: front, L2: front, W1: front, W2: front }),
        grain: 'length',
        position: [0, H / 2, fz],
      }),
    )
  }

  return parts
}
