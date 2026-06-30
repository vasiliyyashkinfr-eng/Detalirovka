import type { Material, Part, Vec3 } from '../types'
import { aabbOf, type AABB } from './snap'

export type DimMode = 'clear' | 'center'

export interface DimChip {
  axis: 0 | 1 | 2
  side: 1 | -1 // сосед с + или − стороны вдоль оси
  neighborId: string
  value: number // текущее значение по выбранному типу, мм
  anchor: Vec3 // точка размещения подписи (мм)
}

function overlap1(a0: number, a1: number, b0: number, b1: number): number {
  return Math.min(a1, b1) - Math.max(a0, b0)
}

/**
 * Размеры от выделенной детали до ближайших соседей по каждой оси/стороне.
 * Сосед учитывается, только если перекрывается с деталью по двум другим осям
 * (т.е. они реально «смотрят» друг на друга).
 */
export function computeDims(
  sel: Part,
  others: Part[],
  materials: Material[],
  mode: DimMode,
): DimChip[] {
  const S = aabbOf(sel, materials)
  const chips: DimChip[] = []

  for (let a = 0 as 0 | 1 | 2; a < 3; a = (a + 1) as 0 | 1 | 2) {
    const b = ((a + 1) % 3) as 0 | 1 | 2
    const c = ((a + 2) % 3) as 0 | 1 | 2

    for (const side of [1, -1] as const) {
      let best: { p: Part; N: AABB; facing: number } | null = null

      for (const p of others) {
        const N = aabbOf(p, materials)
        if (overlap1(S.min[b], S.max[b], N.min[b], N.max[b]) <= 1) continue
        if (overlap1(S.min[c], S.max[c], N.min[c], N.max[c]) <= 1) continue
        // сосед должен быть с нужной стороны
        if (side === 1 && N.center[a] <= S.center[a]) continue
        if (side === -1 && N.center[a] >= S.center[a]) continue
        const facing = side === 1 ? N.min[a] - S.max[a] : S.min[a] - N.max[a]
        if (best === null || Math.abs(facing) < Math.abs(best.facing)) {
          best = { p, N, facing }
        }
      }

      if (!best) continue
      const N = best.N
      const value =
        mode === 'clear'
          ? side === 1
            ? N.min[a] - S.max[a]
            : S.min[a] - N.max[a]
          : side * (N.center[a] - S.center[a])

      const aPos = side === 1 ? (S.max[a] + N.min[a]) / 2 : (S.min[a] + N.max[a]) / 2
      const bPos = (Math.max(S.min[b], N.min[b]) + Math.min(S.max[b], N.max[b])) / 2
      const cPos = (Math.max(S.min[c], N.min[c]) + Math.min(S.max[c], N.max[c])) / 2
      const anchor: Vec3 = [0, 0, 0]
      anchor[a] = aPos
      anchor[b] = bPos
      anchor[c] = cPos

      chips.push({ axis: a, side, neighborId: best.p.id, value: Math.round(value), anchor })
    }
  }
  return chips
}

/** Новая позиция выделенной детали, чтобы размер chip стал равен newValue. */
export function applyDim(
  sel: Part,
  neighbor: Part,
  materials: Material[],
  chip: DimChip,
  mode: DimMode,
  newValue: number,
): Vec3 {
  const S = aabbOf(sel, materials)
  const N = aabbOf(neighbor, materials)
  const a = chip.axis
  const half = S.size[a] / 2
  const pos: Vec3 = [...sel.position] as Vec3
  if (mode === 'clear') {
    pos[a] = chip.side === 1 ? N.min[a] - newValue - half : N.max[a] + newValue + half
  } else {
    pos[a] = chip.side === 1 ? N.center[a] - newValue : N.center[a] + newValue
  }
  return pos
}
