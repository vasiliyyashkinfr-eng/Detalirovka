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

export type DimKind = 'gap' | 'min' | 'max'

/** Ссылка на конкретную кромку (грань) детали. */
export interface EdgeRef {
  partId: string
  axis: 0 | 1 | 2
  side: 'min' | 'max'
}

/** Положение грани детали вдоль её оси, мм. */
export function facePos(box: AABB, axis: 0 | 1 | 2, side: 'min' | 'max'): number {
  return side === 'max' ? box.max[axis] : box.min[axis]
}

/** 4 угла грани (для подсветки), мм. */
export function faceCorners(box: AABB, axis: 0 | 1 | 2, side: 'min' | 'max'): Vec3[] {
  const b = ((axis + 1) % 3) as 0 | 1 | 2
  const c = ((axis + 2) % 3) as 0 | 1 | 2
  const a = facePos(box, axis, side)
  const mk = (sb: number, sc: number): Vec3 => {
    const p: Vec3 = [0, 0, 0]
    p[axis] = a
    p[b] = sb
    p[c] = sc
    return p
  }
  return [
    mk(box.min[b], box.min[c]),
    mk(box.max[b], box.min[c]),
    mk(box.max[b], box.max[c]),
    mk(box.min[b], box.max[c]),
  ]
}

/**
 * Новая позиция центра детали mover, чтобы её грань (moverSide по оси axis)
 * встала на расстоянии value от неподвижной грани anchorPos (в текущем
 * направлении dir).
 */
export function applyEdgePair(
  mover: Part,
  materials: Material[],
  moverSide: 'min' | 'max',
  axis: 0 | 1 | 2,
  anchorPos: number,
  dir: 1 | -1,
  value: number,
): Vec3 {
  const M = aabbOf(mover, materials)
  const half = M.size[axis] / 2
  const sideOffset = moverSide === 'max' ? half : -half
  const newFace = anchorPos + dir * value
  const pos: Vec3 = [...mover.position] as Vec3
  pos[axis] = newFace - sideOffset
  return pos
}

export interface PairDim {
  axis: 0 | 1 | 2
  start: Vec3 // измеряемая точка 1 (на грани), мм
  end: Vec3 // измеряемая точка 2 (на грани), мм — отличается от start только по [axis]
  offsetAxis: 0 | 1 | 2 // ось, вдоль которой размерная линия вынесена наружу
  offset: number // смещение размерной линии от измеряемых точек, мм (со знаком)
  value: number // показываемое значение (модуль), мм
  kind: DimKind
  sign: 1 | -1 // направление текущей разницы (для редактирования)
}

export interface EdgeDiff {
  axis: 0 | 1 | 2
  kind: 'min' | 'max'
  value: number // модуль разницы кромок, мм
  sign: 1 | -1
}

const AXIS_LABEL = ['X (ширина)', 'Y (высота)', 'Z (глубина)'] as const

export function axisLabel(a: 0 | 1 | 2): string {
  return AXIS_LABEL[a]
}

/** Разницы всех кромок выделенной детали A относительно опорной B (6 значений). */
export function edgeDiffs(A: AABB, B: AABB): EdgeDiff[] {
  const out: EdgeDiff[] = []
  for (let a = 0 as 0 | 1 | 2; a < 3; a = (a + 1) as 0 | 1 | 2) {
    for (const kind of ['min', 'max'] as const) {
      const d = A[kind][a] - B[kind][a]
      out.push({ axis: a, kind, value: Math.abs(d), sign: d >= 0 ? 1 : -1 })
    }
  }
  return out
}

/** Новая позиция детали primary, чтобы размер/разница kind стали равны newValue. */
export function applyPairDim(
  primary: Part,
  secondary: Part,
  materials: Material[],
  axis: 0 | 1 | 2,
  kind: DimKind,
  sign: 1 | -1,
  newValue: number,
): Vec3 {
  const A = aabbOf(primary, materials)
  const B = aabbOf(secondary, materials)
  const half = A.size[axis] / 2
  const pos: Vec3 = [...primary.position] as Vec3
  if (kind === 'gap') {
    pos[axis] = sign < 0 ? B.min[axis] - newValue - half : B.max[axis] + newValue + half
  } else if (kind === 'min') {
    pos[axis] = B.min[axis] + sign * newValue + half
  } else {
    pos[axis] = B.max[axis] + sign * newValue - half
  }
  return pos
}

/**
 * Чертёжные размеры между двумя деталями:
 *  - gap  — расстояние между обращёнными гранями по оси наибольшего расхождения;
 *  - edge — разница соответствующих кромок (min/max) по остальным осям.
 */
export function computePairDims(A: AABB, B: AABB): PairDim[] {
  const dims: PairDim[] = []

  // ось наибольшего расхождения = наименьшее перекрытие
  let sep: 0 | 1 | 2 = 0
  let minOv = Infinity
  for (let a = 0; a < 3; a++) {
    const ov = Math.min(A.max[a], B.max[a]) - Math.max(A.min[a], B.min[a])
    if (ov < minOv) {
      minOv = ov
      sep = a as 0 | 1 | 2
    }
  }

  // dir: +1 — выносим линию за верхнюю/правую сторону, -1 — за нижнюю/левую.
  const pushDim = (
    axis: 0 | 1 | 2,
    p1: number,
    p2: number,
    rb: number,
    rc: number,
    offsetBase: number,
    dir: 1 | -1,
    kind: DimKind,
    value: number,
    sign: 1 | -1,
  ) => {
    const b = ((axis + 1) % 3) as 0 | 1 | 2
    const c = ((axis + 2) % 3) as 0 | 1 | 2
    const start: Vec3 = [0, 0, 0]
    const end: Vec3 = [0, 0, 0]
    start[axis] = p1
    end[axis] = p2
    start[b] = rb
    end[b] = rb
    start[c] = rc
    end[c] = rc
    const offsetAxis = (axis === 1 ? 0 : 1) as 0 | 1 | 2
    const edgePos =
      dir > 0 ? Math.max(A.max[offsetAxis], B.max[offsetAxis]) : Math.min(A.min[offsetAxis], B.min[offsetAxis])
    const offset = edgePos + dir * offsetBase - start[offsetAxis]
    dims.push({ axis, start, end, offsetAxis, offset, value, kind, sign })
  }

  // gap по оси расхождения — между обращёнными гранями
  {
    const a = sep
    const b = ((a + 1) % 3) as 0 | 1 | 2
    const c = ((a + 2) % 3) as 0 | 1 | 2
    const aLeft = A.center[a] <= B.center[a]
    const p1 = aLeft ? A.max[a] : B.max[a]
    const p2 = aLeft ? B.min[a] : A.min[a]
    const rb = (Math.max(A.min[b], B.min[b]) + Math.min(A.max[b], B.max[b])) / 2
    const rc = (Math.max(A.min[c], B.min[c]) + Math.min(A.max[c], B.max[c])) / 2
    pushDim(a, p1, p2, rb, rc, 40, 1, 'gap', Math.abs(p2 - p1), aLeft ? -1 : 1)
  }

  // edge — разница ВСЕХ кромок по остальным осям (в т.ч. нулевые = заподлицо).
  // min-кромки выносим в одну сторону, max — в другую, чтобы не наезжали.
  let stMin = 40
  let stMax = 40
  for (let a = 0 as 0 | 1 | 2; a < 3; a = (a + 1) as 0 | 1 | 2) {
    if (a === sep) continue
    const b = ((a + 1) % 3) as 0 | 1 | 2
    const c = ((a + 2) % 3) as 0 | 1 | 2
    const rb = (A.center[b] + B.center[b]) / 2
    const rc = (A.center[c] + B.center[c]) / 2
    for (const edge of ['min', 'max'] as const) {
      const p1 = A[edge][a]
      const p2 = B[edge][a]
      const d = p1 - p2
      const dir = edge === 'min' ? -1 : 1
      const base = edge === 'min' ? (stMin += 55) : (stMax += 55)
      pushDim(a, p1, p2, rb, rc, base, dir, edge, Math.abs(d), d >= 0 ? 1 : -1)
    }
  }

  return dims
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
