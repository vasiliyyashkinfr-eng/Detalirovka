import { useRef, useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { DEFAULT_CABINET, type CabinetParams } from '../lib/cabinet'
import type { EdgeThickness } from '../types'
import NumberField from './NumberField'

export default function CabinetDialog({ onClose }: { onClose: () => void }) {
  const project = useProjectStore((s) => s.project)
  const generate = useProjectStore((s) => s.generate)
  const carcassMats = project.materials
  const [p, setP] = useState<CabinetParams>({
    ...DEFAULT_CABINET,
    materialId: carcassMats[0]?.id ?? DEFAULT_CABINET.materialId,
    backMaterialId: carcassMats[carcassMats.length - 1]?.id ?? DEFAULT_CABINET.backMaterialId,
  })

  const setNum = (k: keyof CabinetParams) => (n: number) =>
    setP((s) => ({ ...s, [k]: n }))

  // Закрываем только если нажатие И отпускание произошли на самом фоне.
  // Иначе выделение текста в поле с отпусканием за модалкой ложно закрывает её.
  const downOnBackdrop = useRef(false)

  const submit = (mode: 'replace' | 'append') => {
    generate(p, mode)
    window.dispatchEvent(new Event('fitView'))
    onClose()
  }

  return (
    <div
      className="modal-backdrop"
      onPointerDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget
      }}
      onPointerUp={(e) => {
        if (downOnBackdrop.current && e.target === e.currentTarget) onClose()
        downOnBackdrop.current = false
      }}
    >
      <div className="modal">
        <h2>Генератор корпуса</h2>
        <p className="muted">Задай габариты — детали раскинутся автоматически, потом их можно двигать и править.</p>

        <div className="grid2">
          <label>Название
            <input value={p.name} onChange={(e) => setP((s) => ({ ...s, name: e.target.value }))} />
          </label>
          <label>Толщина ЛДСП, мм
            <NumberField value={p.thickness} onChange={setNum('thickness')} min={1} />
          </label>
          <label>Ширина (Ш), мм
            <NumberField value={p.width} onChange={setNum('width')} min={1} />
          </label>
          <label>Высота (В), мм
            <NumberField value={p.height} onChange={setNum('height')} min={1} />
          </label>
          <label>Глубина (Г), мм
            <NumberField value={p.depth} onChange={setNum('depth')} min={1} />
          </label>
          <label>Полок, шт
            <NumberField value={p.shelves} onChange={setNum('shelves')} min={0} />
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
