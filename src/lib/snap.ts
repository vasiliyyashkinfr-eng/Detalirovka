import type { Material, Part, Vec3 } from '../types'
import { partSize, thicknessOf } from './geometry'

export interface AABB {
  min: Vec3
  max: Vec3
  size: Vec3
  center: Vec3
}

export function aabbOf(part: Part, materials: Material[]): AABB {
  const s = partSize(part, thicknessOf(part, materials))
  const c = part.position
  return {
    min: [c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2],
    max: [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2],
    size: [...s] as Vec3,
    center: [...c] as Vec3,
  }
}

function overlap1d(a0: number, a1: number, b0: number, b1: number, tol: number): boolean {
  return a1 >= b0 - tol && b1 >= a0 - tol
}

/**
 * Корректирует позицию центра перетаскиваемой детали, привязывая её грани
 * к граням соседних деталей: вплотную / с зазором gap, либо заподлицо.
 * Привязка по каждой оси независима и срабатывает только если детали
 * перекрываются по двум другим осям. threshold — радиус притяжения (мм).
 */
export function snapToFaces(
  draggedPos: Vec3,
  draggedSize: Vec3,
  others: AABB[],
  gap: number,
  threshold: number,
): Vec3 {
  const result: Vec3 = [...draggedPos] as Vec3
  const half: Vec3 = [draggedSize[0] / 2, draggedSize[1] / 2, draggedSize[2] / 2]

  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3
    const c = (a + 2) % 3
    let best: number | null = null
    let bestDelta = threshold

    for (const o of others) {
      // нужно перекрытие по двум другим осям, иначе притяжение бессмысленно
      if (!overlap1d(draggedPos[b] - half[b], draggedPos[b] + half[b], o.min[b], o.max[b], 0)) continue
      if (!overlap1d(draggedPos[c] - half[c], draggedPos[c] + half[c], o.min[c], o.max[c], 0)) continue

      const candidates = [
        o.min[a] - gap - half[a], // правый торец детали к левой грани соседа (с зазором)
        o.max[a] + gap + half[a], // левый торец детали к правой грани соседа (с зазором)
        o.min[a] + half[a], // заподлицо: min-грань детали к min-грани соседа
        o.max[a] - half[a], // заподлицо: max-грань детали к max-грани соседа
      ]
      for (const cand of candidates) {
        const delta = Math.abs(draggedPos[a] - cand)
        if (delta < bestDelta) {
          bestDelta = delta
          best = cand
        }
      }
    }
    if (best != null) result[a] = best
  }
  return result
}

export type Relation =
  | 'left'
  | 'right'
  | 'below'
  | 'above'
  | 'front'
  | 'back'
  | 'alignX'
  | 'alignY'
  | 'alignZ'

export const RELATION_LABELS: { value: Relation; label: string }[] = [
  { value: 'left', label: 'Слева (X−)' },
  { value: 'right', label: 'Справа (X+)' },
  { value: 'below', label: 'Снизу (Y−)' },
  { value: 'above', label: 'Сверху (Y+)' },
  { value: 'front', label: 'Спереди (Z+)' },
  { value: 'back', label: 'Сзади (Z−)' },
  { value: 'alignX', label: 'Центр по X' },
  { value: 'alignY', label: 'Центр по Y' },
  { value: 'alignZ', label: 'Центр по Z' },
]

/** Позиция центра mover, поставленного относительно target с зазором gap. */
export function placeRelative(mover: AABB, target: AABB, relation: Relation, gap: number): Vec3 {
  const c: Vec3 = [...mover.center] as Vec3
  const h = mover.size
  switch (relation) {
    case 'left':
      c[0] = target.min[0] - gap - h[0] / 2
      break
    case 'right':
      c[0] = target.max[0] + gap + h[0] / 2
      break
    case 'below':
      c[1] = target.min[1] - gap - h[1] / 2
      break
    case 'above':
      c[1] = target.max[1] + gap + h[1] / 2
      break
    case 'front':
      c[2] = target.max[2] + gap + h[2] / 2
      break
    case 'back':
      c[2] = target.min[2] - gap - h[2] / 2
      break
    case 'alignX':
      c[0] = target.center[0]
      break
    case 'alignY':
      c[1] = target.center[1]
      break
    case 'alignZ':
      c[2] = target.center[2]
      break
  }
  return c
}
