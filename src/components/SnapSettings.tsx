import { GRID_STEPS, useUiStore } from '../store/useUiStore'
import NumberField from './NumberField'

export default function SnapSettings() {
  const { gridStep, snapGrid, faceSnap, gap, showDims, dimMode, set } = useUiStore()

  return (
    <div className="snap-settings">
      <div className="snap-row">
        <label className="check">
          <input type="checkbox" checked={snapGrid} onChange={(e) => set({ snapGrid: e.target.checked })} />
          Сетка
        </label>
        <div className="seg">
          {GRID_STEPS.map((s) => (
            <button
              key={s}
              className={'seg-btn' + (gridStep === s ? ' active' : '')}
              onClick={() => set({ gridStep: s })}
              title={`Шаг ${s} мм`}
            >
              {s}
            </button>
          ))}
          <span className="seg-unit">мм</span>
        </div>
      </div>
      <div className="snap-row">
        <label className="check">
          <input type="checkbox" checked={faceSnap} onChange={(e) => set({ faceSnap: e.target.checked })} />
          Прилипание
        </label>
        <label className="gap-field">
          зазор
          <NumberField value={gap} onChange={(n) => set({ gap: n })} min={0} />
          <span className="muted">мм</span>
        </label>
      </div>
      <div className="snap-row">
        <label className="check">
          <input type="checkbox" checked={showDims} onChange={(e) => set({ showDims: e.target.checked })} />
          Размеры в 3D
        </label>
        <div className="seg">
          <button
            className={'seg-btn' + (dimMode === 'clear' ? ' active' : '')}
            onClick={() => set({ dimMode: 'clear' })}
            title="Расстояние между кромками"
          >
            в свету
          </button>
          <button
            className={'seg-btn' + (dimMode === 'center' ? ' active' : '')}
            onClick={() => set({ dimMode: 'center' })}
            title="Расстояние между осями (центр–центр)"
          >
            по осям
          </button>
        </div>
      </div>
    </div>
  )
}
