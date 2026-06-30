import { useState } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { DEFAULT_CABINET } from '../lib/cabinet'
import type { BottomMode, CabinetParams, EdgeThickness, TopMode } from '../types'
import NumberField from './NumberField'

export default function CabinetPanel() {
  const project = useProjectStore((s) => s.project)
  const setCabinet = useProjectStore((s) => s.setCabinet)
  const removeCabinet = useProjectStore((s) => s.removeCabinet)
  const clearParts = useProjectStore((s) => s.clearParts)
  const mats = project.materials
  const [replaceExisting, setReplaceExisting] = useState(true)

  const exists = !!project.cabinet
  // Черновик нужен только пока корпуса нет (форма «Создать корпус»).
  // Когда корпус существует — источник истины это project.cabinet,
  // поэтому форма всегда отражает актуальные параметры (в т.ч. после загрузки/undo).
  const [draft, setDraft] = useState<CabinetParams>(() => ({
    ...DEFAULT_CABINET,
    materialId: mats[0]?.id ?? DEFAULT_CABINET.materialId,
    backMaterialId: mats[mats.length - 1]?.id ?? DEFAULT_CABINET.backMaterialId,
    facadeMaterialId: mats[0]?.id ?? DEFAULT_CABINET.facadeMaterialId,
  }))

  const p = project.cabinet ?? draft

  // Правка параметра: есть корпус — сразу пересобираем; нет — копим в черновик.
  const upd = (patch: Partial<CabinetParams>) => {
    if (project.cabinet) setCabinet({ ...project.cabinet, ...patch })
    else setDraft((d) => ({ ...d, ...patch }))
  }

  const create = () => {
    // Если в проекте уже есть детали (напр. корпус из старой версии) —
    // по умолчанию заменяем их новым параметрическим корпусом.
    if (replaceExisting && project.parts.length > 0) clearParts()
    setCabinet(draft)
    window.dispatchEvent(new Event('fitView'))
  }

  return (
    <div className="panel-body">
      {!exists && (
        <p className="muted">
          Задай габариты и конструктив — детали корпуса раскинутся автоматически.
          Дальше их можно двигать и дополнять вручную.
        </p>
      )}

      <div className="grid2">
        <label>Название
          <input value={p.name} onChange={(e) => upd({ name: e.target.value })} />
        </label>
        <label>Толщина ЛДСП, мм
          <NumberField value={p.thickness} onChange={(n) => upd({ thickness: n })} min={1} />
        </label>
        <label>Ширина (Ш), мм
          <NumberField value={p.width} onChange={(n) => upd({ width: n })} min={1} />
        </label>
        <label>Высота (В), мм
          <NumberField value={p.height} onChange={(n) => upd({ height: n })} min={1} />
        </label>
        <label>Глубина (Г), мм
          <NumberField value={p.depth} onChange={(n) => upd({ depth: n })} min={1} />
        </label>
        <label>Полок, шт
          <NumberField value={p.shelves} onChange={(n) => upd({ shelves: n })} min={0} />
        </label>
      </div>

      <div className="field-group">
        <div className="field-label">Конструктив</div>
        <div className="grid2">
          <label>Крыша
            <select value={p.hasTop ? p.topMode : 'none'} onChange={(e) => {
              const v = e.target.value
              if (v === 'none') upd({ hasTop: false })
              else upd({ hasTop: true, topMode: v as TopMode })
            }}>
              <option value="inset">Между боковинами</option>
              <option value="overlay">Накладная сверху</option>
              <option value="none">Без крыши</option>
            </select>
          </label>
          <label>Дно
            <select value={p.bottomMode} onChange={(e) => upd({ bottomMode: e.target.value as BottomMode })}>
              <option value="inset">Между боковинами</option>
              <option value="sides-on-bottom">Боковины на дно</option>
            </select>
          </label>
        </div>
      </div>

      <div className="field-group">
        <div className="row gap wrap">
          <label className="check">
            <input type="checkbox" checked={p.hasBack} onChange={(e) => upd({ hasBack: e.target.checked })} />
            Задняя стенка
          </label>
          <label className="check">
            <input type="checkbox" checked={p.facade} onChange={(e) => upd({ facade: e.target.checked })} />
            Фасад
          </label>
        </div>
        {p.facade && (
          <>
            <p className="muted tiny">В глубину (Г) входит фасад и зазор; глубина корпуса = Г − {p.facadeThickness} − {p.facadeGap} мм.</p>
            <div className="grid2">
              <label>Толщина фасада, мм
                <NumberField value={p.facadeThickness} onChange={(n) => upd({ facadeThickness: n })} min={1} />
              </label>
              <label>Зазор фасада, мм
                <NumberField value={p.facadeGap} onChange={(n) => upd({ facadeGap: n })} min={0} />
              </label>
            </div>
          </>
        )}
      </div>

      <div className="field-group">
        <div className="field-label">Материалы и кромка</div>
        <div className="grid2">
          <label>Материал корпуса
            <select value={p.materialId} onChange={(e) => upd({ materialId: e.target.value })}>
              {mats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </label>
          {p.hasBack && (
            <label>Материал задней
              <select value={p.backMaterialId} onChange={(e) => upd({ backMaterialId: e.target.value })}>
                {mats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          )}
          {p.facade && (
            <label>Материал фасада
              <select value={p.facadeMaterialId} onChange={(e) => upd({ facadeMaterialId: e.target.value })}>
                {mats.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          )}
          <label>Кромка фасадного торца
            <select value={p.frontEdge} onChange={(e) => upd({ frontEdge: Number(e.target.value) as EdgeThickness })}>
              <option value={0}>нет</option>
              <option value={0.4}>0.4 мм</option>
              <option value={1}>1 мм</option>
              <option value={2}>2 мм</option>
            </select>
          </label>
        </div>
      </div>

      {exists ? (
        <div className="row gap">
          <span className="muted tiny grow">Изменения сразу пересобирают корпус. Ручные детали сохраняются.</span>
          <button className="btn danger" onClick={() => { if (confirm('Удалить корпус (его детали)?')) removeCabinet() }}>
            Удалить корпус
          </button>
        </div>
      ) : (
        <div className="field-group">
          {project.parts.length > 0 && (
            <label className="check">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
              />
              Заменить текущие детали ({project.parts.length} шт) новым корпусом
            </label>
          )}
          <button className="btn primary" onClick={create}>Создать корпус</button>
        </div>
      )}
    </div>
  )
}
