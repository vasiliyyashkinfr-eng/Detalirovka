import { useProjectStore } from '../store/useProjectStore'
import { aabbOf } from '../lib/snap'
import { applyPairDim, edgeDiffs } from '../lib/dimensions'
import NumberField from './NumberField'

const AX = ['X · ширина', 'Y · высота', 'Z · глубина']

export default function PairEdgeTable() {
  const project = useProjectStore((s) => s.project)
  const selectedId = useProjectStore((s) => s.selectedId)
  const secondaryId = useProjectStore((s) => s.secondaryId)
  const updatePart = useProjectStore((s) => s.updatePart)
  const beginInteraction = useProjectStore((s) => s.beginInteraction)
  const selectSecondary = useProjectStore((s) => s.selectSecondary)

  const A = project.parts.find((p) => p.id === selectedId)
  const B = project.parts.find((p) => p.id === secondaryId)
  if (!A || !B) return null

  const diffs = edgeDiffs(aabbOf(A, project.materials), aabbOf(B, project.materials))
  const get = (axis: 0 | 1 | 2, kind: 'min' | 'max') =>
    diffs.find((d) => d.axis === axis && d.kind === kind)!

  const apply = (axis: 0 | 1 | 2, kind: 'min' | 'max', sign: 1 | -1, v: number) => {
    beginInteraction()
    updatePart(A.id, { position: applyPairDim(A, B, project.materials, axis, kind, sign, v) })
  }

  return (
    <div className="editor-wrap">
      <div className="editor-title row gap">
        <span className="grow">Разница кромок: «{A.name}» ↔ «{B.name}»</span>
        <button className="btn small" title="Снять вторую деталь" onClick={() => selectSecondary(null)}>
          ✕
        </button>
      </div>
      <table className="edge-table">
        <thead>
          <tr>
            <th>Ось</th>
            <th>мин. кромка</th>
            <th>макс. кромка</th>
          </tr>
        </thead>
        <tbody>
          {([0, 1, 2] as const).map((axis) => (
            <tr key={axis}>
              <td className="muted">{AX[axis]}</td>
              {(['min', 'max'] as const).map((kind) => {
                const d = get(axis, kind)
                return (
                  <td key={kind}>
                    <NumberField value={d.value} onChange={(v) => apply(axis, kind, d.sign, v)} min={0} />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted tiny">
        Двигается выделенная деталь «{A.name}». Значение — расстояние между одноимёнными кромками; 0 — кромки совпадают.
      </p>
    </div>
  )
}
