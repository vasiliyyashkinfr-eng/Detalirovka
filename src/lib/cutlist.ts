import type { Material, Part, Project } from '../types'
import { edgeLength, partArea, thicknessOf } from './geometry'

export interface CutRow {
  key: string
  name: string
  material: string
  length: number
  width: number
  thickness: number
  qty: number
  edges: string // компактная запись кромки, напр. "2/2/0.4/0"
  grain: string
  area: number // м² на всё количество
  edgeTotal: number // мм кромки на всё количество
  partIds: string[]
}

function edgesLabel(p: Part): string {
  return `${p.edges.L1}/${p.edges.L2}/${p.edges.W1}/${p.edges.W2}`
}

function grainLabel(p: Part): string {
  return p.grain === 'length' ? '↕ вдоль длины' : p.grain === 'width' ? '↔ вдоль ширины' : '—'
}

/** Агрегирует одинаковые детали в строки деталировки. */
export function buildCutList(parts: Part[], materials: Material[]): CutRow[] {
  const map = new Map<string, CutRow>()
  for (const p of parts) {
    const th = thicknessOf(p, materials)
    const mat = materials.find((m) => m.id === p.materialId)
    const matName = mat ? mat.name : '—'
    const key = [
      p.materialId,
      p.length,
      p.width,
      th,
      edgesLabel(p),
      p.grain,
      p.name,
    ].join('|')
    const existing = map.get(key)
    if (existing) {
      existing.qty += p.qty
      existing.area += partArea(p) * p.qty
      existing.edgeTotal += edgeLength(p) * p.qty
      existing.partIds.push(p.id)
    } else {
      map.set(key, {
        key,
        name: p.name,
        material: matName,
        length: p.length,
        width: p.width,
        thickness: th,
        qty: p.qty,
        edges: edgesLabel(p),
        grain: grainLabel(p),
        area: partArea(p) * p.qty,
        edgeTotal: edgeLength(p) * p.qty,
        partIds: [p.id],
      })
    }
  }
  return [...map.values()].sort(
    (a, b) => a.material.localeCompare(b.material) || b.length - a.length || b.width - a.width,
  )
}

export interface CutListTotals {
  parts: number
  area: number // м²
  edge: number // м.п. кромки
}

export function cutListTotals(rows: CutRow[]): CutListTotals {
  return rows.reduce(
    (acc, r) => {
      acc.parts += r.qty
      acc.area += r.area
      acc.edge += r.edgeTotal / 1000
      return acc
    },
    { parts: 0, area: 0, edge: 0 },
  )
}

/** Экспорт деталировки в CSV (разделитель ; для совместимости с Excel RU). */
export function cutListToCsv(rows: CutRow[]): string {
  const header = [
    '№',
    'Деталь',
    'Материал',
    'Длина, мм',
    'Ширина, мм',
    'Толщина, мм',
    'Кол-во',
    'Кромка L1/L2/W1/W2',
    'Текстура',
    'Площадь, м²',
    'Кромка, м.п.',
  ]
  const lines = [header.join(';')]
  rows.forEach((r, i) => {
    lines.push(
      [
        i + 1,
        r.name,
        r.material,
        r.length,
        r.width,
        r.thickness,
        r.qty,
        r.edges,
        r.grain,
        r.area.toFixed(3),
        (r.edgeTotal / 1000).toFixed(2),
      ]
        .map((c) => String(c).replace(/;/g, ','))
        .join(';'),
    )
  })
  return '﻿' + lines.join('\r\n')
}

export function projectToJson(project: Project): string {
  return JSON.stringify(project, null, 2)
}
