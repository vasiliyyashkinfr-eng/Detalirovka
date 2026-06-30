import { useProjectStore } from '../store/useProjectStore'
import { createMaterial } from '../lib/factory'
import type { MaterialKind } from '../types'
import NumberField from './NumberField'

const KINDS: MaterialKind[] = ['LDSP', 'MDF', 'HDF', 'DSP', 'PLY', 'OTHER']

export default function MaterialsPanel() {
  const project = useProjectStore((s) => s.project)
  const addMaterial = useProjectStore((s) => s.addMaterial)
  const updateMaterial = useProjectStore((s) => s.updateMaterial)
  const removeMaterial = useProjectStore((s) => s.removeMaterial)

  const usedCount = (id: string) => project.parts.filter((p) => p.materialId === id).length

  return (
    <div className="panel-body">
      <div className="row gap">
        <button className="btn primary" onClick={() => addMaterial(createMaterial())}>+ Материал</button>
      </div>
      <div className="materials-list">
        {project.materials.map((m) => {
          const used = usedCount(m.id)
          return (
            <div key={m.id} className="material-card">
              <div className="row gap">
                <input
                  type="color"
                  value={m.color}
                  onChange={(e) => updateMaterial(m.id, { color: e.target.value })}
                />
                <input
                  className="grow"
                  value={m.name}
                  onChange={(e) => updateMaterial(m.id, { name: e.target.value })}
                />
              </div>
              <div className="grid3">
                <label className="tiny">Тип
                  <select value={m.kind} onChange={(e) => updateMaterial(m.id, { kind: e.target.value as MaterialKind })}>
                    {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <label className="tiny">Толщ., мм
                  <NumberField value={m.thickness} onChange={(n) => updateMaterial(m.id, { thickness: n })} min={1} />
                </label>
                <div className="tiny end">
                  <span className="muted">{used > 0 ? `${used} дет.` : 'не исп.'}</span>
                  <button
                    className="btn small danger"
                    disabled={used > 0 || project.materials.length <= 1}
                    title={used > 0 ? 'Используется деталями' : 'Удалить'}
                    onClick={() => removeMaterial(m.id)}
                  >✕</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
