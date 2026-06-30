import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import {
  aabbOf,
  DIRECTIONS,
  MEASURES,
  measureDistance,
  positionByDistance,
  type Direction,
  type Measure,
} from '../lib/snap'
import type { EdgeThickness, Orientation, Part } from '../types'
import NumberField from './NumberField'

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: 'flat', label: 'Плашмя (дно/полка)' },
  { value: 'left-right', label: 'Вертикально (боковина)' },
  { value: 'front-back', label: 'Лицом вперёд (фасад/зад)' },
]

const EDGE_OPTIONS: EdgeThickness[] = [0, 0.4, 1, 2]

function EdgeSelect({
  value,
  onChange,
  label,
}: {
  value: EdgeThickness
  onChange: (v: EdgeThickness) => void
  label: string
}) {
  return (
    <label className="edge-select">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value) as EdgeThickness)}>
        {EDGE_OPTIONS.map((v) => (
          <option key={v} value={v}>{v === 0 ? '—' : v}</option>
        ))}
      </select>
    </label>
  )
}

const AXES: { value: 0 | 1 | 2; label: string }[] = [
  { value: 0, label: 'X (вправо)' },
  { value: 1, label: 'Y (вверх)' },
  { value: 2, label: 'Z (вглубь)' },
]

export default function PartEditor({ part }: { part: Part }) {
  const project = useProjectStore((s) => s.project)
  const updatePart = useProjectStore((s) => s.updatePart)
  const duplicatePart = useProjectStore((s) => s.duplicatePart)
  const removePart = useProjectStore((s) => s.removePart)
  const arrayDuplicate = useProjectStore((s) => s.arrayDuplicate)
  const beginInteraction = useProjectStore((s) => s.beginInteraction)

  const others = project.parts.filter((x) => x.id !== part.id)
  const [targetId, setTargetId] = useState<string>('')
  const [direction, setDirection] = useState<Direction>('up')
  const [measure, setMeasure] = useState<Measure>('clear')
  const [distance, setDistance] = useState(100)
  const [arrCount, setArrCount] = useState(2)
  const [arrAxis, setArrAxis] = useState<0 | 1 | 2>(0)
  const [arrStep, setArrStep] = useState(300)

  const set = (patch: Partial<Part>) => updatePart(part.id, patch)
  const setPos = (i: number, v: number) => {
    const pos: [number, number, number] = [...part.position]
    pos[i] = v
    set({ position: pos })
  }

  const effectiveTargetId = targetId || others[0]?.id || ''
  const targetPart = project.parts.find((x) => x.id === effectiveTargetId)

  // Текущее расстояние до опорной детали (для подсказки и кнопки «= текущее»).
  const currentDistance =
    targetPart != null
      ? measureDistance(
          aabbOf(part, project.materials),
          aabbOf(targetPart, project.materials),
          direction,
          measure,
        )
      : 0

  const applyDistance = () => {
    if (!targetPart) return
    beginInteraction()
    const pos = positionByDistance(
      aabbOf(part, project.materials),
      aabbOf(targetPart, project.materials),
      direction,
      measure,
      distance,
    )
    set({ position: pos })
  }

  return (
    <div className="editor">
      <label>Название
        <input value={part.name} onChange={(e) => set({ name: e.target.value })} />
      </label>

      <div className="grid2">
        <label>Длина, мм
          <NumberField value={part.length} onChange={(n) => set({ length: n })} min={1} />
        </label>
        <label>Ширина, мм
          <NumberField value={part.width} onChange={(n) => set({ width: n })} min={1} />
        </label>
        <label>Кол-во
          <NumberField value={part.qty} onChange={(n) => set({ qty: n })} min={1} />
        </label>
        <label>Материал
          <select value={part.materialId} onChange={(e) => set({ materialId: e.target.value })}>
            {project.materials.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="row gap">
        <label className="grow">Ориентация
          <select value={part.orientation} onChange={(e) => set({ orientation: e.target.value as Orientation })}>
            {ORIENTATIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
        <button
          className="btn"
          title="Повернуть деталь на 90° в плоскости (длина ↔ ширина)"
          onClick={() => set({ length: part.width, width: part.length })}
        >
          ⟳ 90°
        </button>
      </div>

      <label>Текстура
        <select value={part.grain} onChange={(e) => set({ grain: e.target.value as Part['grain'] })}>
          <option value="none">без направления</option>
          <option value="length">вдоль длины</option>
          <option value="width">вдоль ширины</option>
        </select>
      </label>

      <div className="field-group">
        <div className="field-label">Кромка (толщина, мм)</div>
        <div className="edges-grid">
          <EdgeSelect label="Длина 1" value={part.edges.L1} onChange={(v) => set({ edges: { ...part.edges, L1: v } })} />
          <EdgeSelect label="Длина 2" value={part.edges.L2} onChange={(v) => set({ edges: { ...part.edges, L2: v } })} />
          <EdgeSelect label="Ширина 1" value={part.edges.W1} onChange={(v) => set({ edges: { ...part.edges, W1: v } })} />
          <EdgeSelect label="Ширина 2" value={part.edges.W2} onChange={(v) => set({ edges: { ...part.edges, W2: v } })} />
        </div>
      </div>

      <div className="field-group">
        <div className="field-label">Позиция центра, мм (X / Y / Z)</div>
        <div className="grid3">
          <NumberField value={Math.round(part.position[0])} onChange={(n) => setPos(0, n)} />
          <NumberField value={Math.round(part.position[1])} onChange={(n) => setPos(1, n)} />
          <NumberField value={Math.round(part.position[2])} onChange={(n) => setPos(2, n)} />
        </div>
      </div>

      {others.length > 0 && (
        <div className="field-group">
          <div className="field-label">Расстояние до детали</div>
          <select value={effectiveTargetId} onChange={(e) => setTargetId(e.target.value)}>
            {others.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
          <div className="grid2">
            <label className="tiny">Направление
              <select value={direction} onChange={(e) => setDirection(e.target.value as Direction)}>
                {DIRECTIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </label>
            <label className="tiny">Измерять
              <select value={measure} onChange={(e) => setMeasure(e.target.value as Measure)}>
                {MEASURES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </label>
          </div>
          <div className="row gap">
            <label className="grow tiny">Расстояние, мм
              <NumberField value={distance} onChange={setDistance} />
            </label>
            <button
              className="btn small"
              title="Подставить текущее расстояние"
              onClick={() => setDistance(Math.round(currentDistance))}
            >
              = {Math.round(currentDistance)}
            </button>
          </div>
          <button className="btn primary" onClick={applyDistance}>Поставить на расстояние</button>
        </div>
      )}

      <div className="field-group">
        <div className="field-label">Массив (копии со смещением)</div>
        <div className="grid3">
          <label className="tiny">Копий
            <NumberField value={arrCount} onChange={setArrCount} min={1} max={50} />
          </label>
          <label className="tiny">Ось
            <select value={arrAxis} onChange={(e) => setArrAxis(Number(e.target.value) as 0 | 1 | 2)}>
              {AXES.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </label>
          <label className="tiny">Шаг, мм
            <NumberField value={arrStep} onChange={setArrStep} />
          </label>
        </div>
        <button className="btn" onClick={() => arrayDuplicate(part.id, arrCount, arrAxis, arrStep)}>
          Создать массив
        </button>
      </div>

      <label>Цвет (переопределение)
        <div className="row gap">
          <input
            type="color"
            value={part.colorOverride ?? '#cccccc'}
            onChange={(e) => set({ colorOverride: e.target.value })}
          />
          {part.colorOverride && (
            <button className="btn small" onClick={() => set({ colorOverride: undefined })}>Сбросить</button>
          )}
        </div>
      </label>

      <div className="row gap">
        <button className="btn" onClick={() => duplicatePart(part.id)}>Дублировать</button>
        <button className="btn danger" onClick={() => removePart(part.id)}>Удалить</button>
      </div>
    </div>
  )
}
