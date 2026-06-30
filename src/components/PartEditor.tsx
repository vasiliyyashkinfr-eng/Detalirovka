import { useProjectStore } from '../store/useProjectStore'
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

export default function PartEditor({ part }: { part: Part }) {
  const project = useProjectStore((s) => s.project)
  const updatePart = useProjectStore((s) => s.updatePart)
  const duplicatePart = useProjectStore((s) => s.duplicatePart)
  const removePart = useProjectStore((s) => s.removePart)

  const set = (patch: Partial<Part>) => updatePart(part.id, patch)
  const setPos = (i: number, v: number) => {
    const pos: [number, number, number] = [...part.position]
    pos[i] = v
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

      <label>Ориентация
        <select value={part.orientation} onChange={(e) => set({ orientation: e.target.value as Orientation })}>
          {ORIENTATIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </label>

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
