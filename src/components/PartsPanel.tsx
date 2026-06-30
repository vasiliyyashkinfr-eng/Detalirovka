import { useProjectStore } from '../store/useProjectStore'
import { thicknessOf } from '../lib/geometry'
import { PRESETS, presetPart } from '../lib/presets'
import PartEditor from './PartEditor'
import SnapSettings from './SnapSettings'

export default function PartsPanel() {
  const project = useProjectStore((s) => s.project)
  const selectedId = useProjectStore((s) => s.selectedId)
  const secondaryId = useProjectStore((s) => s.secondaryId)
  const select = useProjectStore((s) => s.select)
  const selectSecondary = useProjectStore((s) => s.selectSecondary)
  const addPart = useProjectStore((s) => s.addPart)
  const duplicatePart = useProjectStore((s) => s.duplicatePart)
  const clearParts = useProjectStore((s) => s.clearParts)

  const selected = project.parts.find((p) => p.id === selectedId)

  return (
    <div className="panel-body">
      <SnapSettings />

      <div className="add-row">
        {PRESETS.map((preset) => (
          <button
            key={preset.kind}
            className={'btn' + (preset.kind === 'custom' ? ' primary' : '')}
            onClick={() => addPart(presetPart(preset.kind, project.cabinet, project.materials))}
          >
            {preset.label}
          </button>
        ))}
        {project.parts.length > 0 && (
          <button className="btn danger" onClick={() => { if (confirm('Удалить все детали?')) clearParts() }}>
            Очистить
          </button>
        )}
      </div>

      <div className="parts-list">
        {project.parts.length === 0 && (
          <p className="muted center">Деталей пока нет. Создай корпус или добавь деталь кнопками выше.</p>
        )}
        {project.parts.map((p) => {
          const th = thicknessOf(p, project.materials)
          return (
            <div
              key={p.id}
              className={
                'part-item' +
                (p.id === selectedId ? ' active' : '') +
                (p.id === secondaryId ? ' secondary' : '')
              }
              onClick={() => select(p.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') select(p.id) }}
            >
              <span className="part-name">{p.name}</span>
              <span className="part-dims">{p.length}×{p.width}×{th}{p.qty > 1 ? ` · ${p.qty}шт` : ''}</span>
              {selectedId && p.id !== selectedId && (
                <button
                  className={'part-measure' + (p.id === secondaryId ? ' on' : '')}
                  title="Измерить до этой детали"
                  onClick={(e) => {
                    e.stopPropagation()
                    selectSecondary(p.id === secondaryId ? null : p.id)
                  }}
                >
                  ↔
                </button>
              )}
              <button
                className="part-copy"
                title="Дублировать деталь"
                onClick={(e) => { e.stopPropagation(); duplicatePart(p.id) }}
              >
                ⧉
              </button>
            </div>
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
