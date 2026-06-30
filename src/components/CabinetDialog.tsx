import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { DEFAULT_CABINET, type CabinetParams } from '../lib/cabinet'
import type { EdgeThickness } from '../types'

export default function CabinetDialog({ onClose }: { onClose: () => void }) {
  const project = useProjectStore((s) => s.project)
  const generate = useProjectStore((s) => s.generate)
  const carcassMats = project.materials
  const [p, setP] = useState<CabinetParams>({
    ...DEFAULT_CABINET,
    materialId: carcassMats[0]?.id ?? DEFAULT_CABINET.materialId,
    backMaterialId: carcassMats[carcassMats.length - 1]?.id ?? DEFAULT_CABINET.backMaterialId,
  })

  const num = (k: keyof CabinetParams) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP((s) => ({ ...s, [k]: Number(e.target.value) }))

  const submit = (mode: 'replace' | 'append') => {
    generate(p, mode)
    window.dispatchEvent(new Event('fitView'))
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Генератор корпуса</h2>
        <p className="muted">Задай габариты — детали раскинутся автоматически, потом их можно двигать и править.</p>

        <div className="grid2">
          <label>Название
            <input value={p.name} onChange={(e) => setP((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label>Толщина ЛДСП, мм
            <input type="number" value={p.thickness} onChange={num('thickness')} />
          </label>
          <label>Ширина (Ш), мм
            <input type="number" value={p.width} onChange={num('width')} />
          </label>
          <label>Высота (В), мм
            <input type="number" value={p.height} onChange={num('height')} />
          </label>
          <label>Глубина (Г), мм
            <input type="number" value={p.depth} onChange={num('depth')} />
          </label>
          <label>Полок, шт
            <input type="number" min={0} value={p.shelves} onChange={num('shelves')} />
          </label>
          <label>Материал корпуса
            <select value={p.materialId} onChange={(e) => setP((s) => ({ ...s, materialId: e.target.value }))}>
              {carcassMats.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </label>
          <label>Кромка фасадного торца
            <select
              value={p.frontEdge}
              onChange={(e) => setP((s) => ({ ...s, frontEdge: Number(e.target.value) as EdgeThickness }))}
            >
              <option value={0}>нет</option>
              <option value={0.4}>0.4 мм</option>
              <option value={1}>1 мм</option>
              <option value={2}>2 мм</option>
            </select>
          </label>
        </div>

        <div className="row gap">
          <label className="check">
            <input type="checkbox" checked={p.hasTop} onChange={(e) => setP((s) => ({ ...s, hasTop: e.target.checked }))} />
            Крыша
          </label>
          <label className="check">
            <input type="checkbox" checked={p.hasBack} onChange={(e) => setP((s) => ({ ...s, hasBack: e.target.checked }))} />
            Задняя стенка
          </label>
          {p.hasBack && (
            <label>Материал задней
              <select value={p.backMaterialId} onChange={(e) => setP((s) => ({ ...s, backMaterialId: e.target.value }))}>
                {carcassMats.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Отмена</button>
          <button className="btn" onClick={() => submit('append')}>Добавить к проекту</button>
          <button className="btn primary" onClick={() => submit('replace')}>Заменить проект</button>
        </div>
      </div>
    </div>
  )
}
