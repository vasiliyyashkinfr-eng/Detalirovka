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

/** Направление расположения детали относительно опорной (куда смещаем). */
export type Direction = 'up' | 'down' | 'right' | 'left' | 'front' | 'back'

/**
 * Тип измерения расстояния:
 *  - center — между осями (середина толщины ↔ середина толщины);
 *  - clear  — в свету (между обращёнными друг к другу гранями/кромками);
 *  - outer  — по внешним кромкам (общий габарит от внешней грани до внешней).
 */
export type Measure = 'center' | 'clear' | 'outer'

export const DIRECTIONS: { value: Direction; label: string }[] = [
  { value: 'up', label: 'Выше (Y+)' },
  { value: 'down', label: 'Ниже (Y−)' },
  { value: 'right', label: 'Правее (X+)' },
  { value: 'left', label: 'Левее (X−)' },
  { value: 'front', label: 'Спереди (Z+)' },
  { value: 'back', label: 'Сзади (Z−)' },
]

export const MEASURES: { value: Measure; label: string }[] = [
  { value: 'clear', label: 'В свету (между кромками)' },
  { value: 'center', label: 'По осям (центр–центр)' },
  { value: 'outer', label: 'По внешним кромкам' },
]

const DIR: Record<Direction, { axis: 0 | 1 | 2; sign: 1 | -1 }> = {
  right: { axis: 0, sign: 1 },
  left: { axis: 0, sign: -1 },
  up: { axis: 1, sign: 1 },
  down: { axis: 1, sign: -1 },
  front: { axis: 2, sign: 1 },
  back: { axis: 2, sign: -1 },
}

/** Текущее расстояние между деталями в заданном направлении и типе измерения, мм. */
export function measureDistance(
  mover: AABB,
  target: AABB,
  direction: Direction,
  measure: Measure,
): number {
  const { axis, sign } = DIR[direction]
  const mc = mover.center[axis]
  const hm = mover.size[axis] / 2
  const tc = target.center[axis]
  const th = target.size[axis] / 2
  switch (measure) {
    case 'center':
      return sign * (mc - tc)
    case 'clear':
      return sign * (mc - sign * hm - (tc + sign * th))
    case 'outer':
      return sign * (mc + sign * hm - (tc - sign * th))
  }
}

/**
 * Позиция центра mover, поставленного на расстоянии value от target
 * в направлении direction по выбранному типу измерения. Меняется только
 * координата вдоль оси направления, остальные сохраняются.
 */
export function positionByDistance(
  mover: AABB,
  target: AABB,
  direction: Direction,
  measure: Measure,
  value: number,
): Vec3 {
  const { axis, sign } = DIR[direction]
  const c: Vec3 = [...mover.center] as Vec3
  const hm = mover.size[axis] / 2
  const tc = target.center[axis]
  const th = target.size[axis] / 2
  switch (measure) {
    case 'center':
      c[axis] = tc + sign * value
      break
    case 'clear':
      c[axis] = tc + sign * (th + value + hm)
      break
    case 'outer':
      c[axis] = tc + sign * (value - th - hm)
      break
  }
  return c
}
