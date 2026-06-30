import type { Material, Orientation, Part, Vec3 } from '../types'

/** Масштаб сцены: 1 единица Three.js = 1 метр. Размеры в мм делим на 1000. */
export const MM = 0.001

export const NO_EDGES = { L1: 0, L2: 0, W1: 0, W2: 0 } as const

export function thicknessOf(part: Part, materials: Material[]): number {
  const m = materials.find((x) => x.id === part.materialId)
  return m ? m.thickness : 18
}

/**
 * Габаритный размер детали по осям сцены (мм) c учётом ориентации.
 * Возвращает [sx, sy, sz].
 */
export function partSize(part: Part, thickness: number): Vec3 {
  return sizeFor(part.orientation, part.length, part.width, thickness)
}

export function sizeFor(
  orientation: Orientation,
  length: number,
  width: number,
  thickness: number,
): Vec3 {
  switch (orientation) {
    case 'flat':
      return [length, thickness, width]
    case 'left-right':
      return [thickness, length, width]
    case 'front-back':
      return [length, width, thickness]
  }
}

/** Площадь одной детали, м². */
export function partArea(part: Part): number {
  return (part.length * MM) * (part.width * MM)
}

/** Суммарная длина кромки одной детали, мм. */
export function edgeLength(part: Part): number {
  const { edges, length, width } = part
  let total = 0
  if (edges.L1 > 0) total += length
  if (edges.L2 > 0) total += length
  if (edges.W1 > 0) total += width
  if (edges.W2 > 0) total += width
  return total
}

/** Округление до шага сетки (мм). */
export function snap(value: number, step: number): number {
  if (step <= 0) return value
  return Math.round(value / step) * step
}

/** Bounding box всех деталей проекта (мм). */
export function projectBounds(parts: Part[], materials: Material[]) {
  if (parts.length === 0) {
    return { min: [0, 0, 0] as Vec3, max: [0, 0, 0] as Vec3, size: [0, 0, 0] as Vec3, center: [0, 0, 0] as Vec3 }
  }
  const min: Vec3 = [Infinity, Infinity, Infinity]
  const max: Vec3 = [-Infinity, -Infinity, -Infinity]
  for (const p of parts) {
    const s = partSize(p, thicknessOf(p, materials))
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], p.position[i] - s[i] / 2)
      max[i] = Math.max(max[i], p.position[i] + s[i] / 2)
    }
  }
  const size: Vec3 = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
  const center: Vec3 = [(max[0] + min[0]) / 2, (max[1] + min[1]) / 2, (max[2] + min[2]) / 2]
  return { min, max, size, center }
}
