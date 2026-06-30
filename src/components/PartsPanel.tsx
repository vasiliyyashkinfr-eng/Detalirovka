import { useProjectStore } from '../store/useProjectStore'
import { thicknessOf } from '../lib/geometry'
import PartEditor from './PartEditor'
import SnapSettings from './SnapSettings'

export default function PartsPanel() {
  const project = useProjectStore((s) => s.project)
  const selectedId = useProjectStore((s) => s.selectedId)
  const select = useProjectStore((s) => s.select)
  const addPart = useProjectStore((s) => s.addPart)
  const clearParts = useProjectStore((s) => s.clearParts)

  const selected = project.parts.find((p) => p.id === selectedId)

  return (
    <div className="panel-body">
      <SnapSettings />
      <div className="row gap wrap">
        <button className="btn primary" onClick={() => addPart()}>+ Деталь</button>
        {project.parts.length > 0 && (
          <button className="btn danger" onClick={() => { if (confirm('Удалить все детали?')) clearParts() }}>
            Очистить
          </button>
        )}
      </div>

      <div className="parts-list">
        {project.parts.length === 0 && (
          <p className="muted center">Деталей пока нет. Сгенерируй корпус или добавь деталь вручную.</p>
        )}
        {project.parts.map((p) => {
          const th = thicknessOf(p, project.materials)
          return (
            <button
              key={p.id}
              className={'part-item' + (p.id === selectedId ? ' active' : '')}
              onClick={() => select(p.id)}
            >
              <span className="part-name">{p.name}</span>
              <span className="part-dims">{p.length}×{p.width}×{th}{p.qty > 1 ? ` · ${p.qty}шт` : ''}</span>
            </button>
          )
        })}
      </div>

      {selected && (
        <div className="editor-wrap">
          <div className="editor-title">Параметры детали</div>
          <PartEditor part={selected} />
        </div>
      )}
    </div>
  )
}
