import { useProjectStore } from '../store/useProjectStore'
import { useUiStore } from '../store/useUiStore'
import { aabbOf } from '../lib/snap'
import { anchorLabel, applyEdgePair, facePos, type EdgeAnchor, type EdgeRef } from '../lib/dimensions'
import NumberField from './NumberField'

// Порядок сверху вниз: верхняя/дальняя кромка → середина → нижняя/ближняя,
// чтобы кнопки соответствовали физическому положению кромок.
const ANCHORS: EdgeAnchor[] = ['max', 'center', 'min']

function AnchorPicker({
  edge,
  color,
  onPick,
}: {
  edge: EdgeRef
  color: string
  onPick: (ref: EdgeAnchor) => void
}) {
  return (
    <div className="seg">
      {ANCHORS.map((a) => (
        <button
          key={a}
          className={'seg-btn' + (edge.ref === a ? ' active' : '')}
          style={edge.ref === a ? { background: color, borderColor: color, color: '#0b1220' } : undefined}
          onClick={() => onPick(a)}
        >
          {anchorLabel(edge.axis, a)}
        </button>
      ))}
    </div>
  )
}

export default function EdgeMeasurePanel() {
  const project = useProjectStore((s) => s.project)
  const updatePart = useProjectStore((s) => s.updatePart)
  const beginInteraction = useProjectStore((s) => s.beginInteraction)
  const { edgeA, edgeB, setEdgeAnchor, clearEdges } = useUiStore()

  const partA = edgeA && project.parts.find((p) => p.id === edgeA.partId)
  const partB = edgeB && project.parts.find((p) => p.id === edgeB.partId)

  return (
    <div className="editor-wrap">
      <div className="editor-title row gap">
        <span className="grow">📏 Размер по кромкам</span>
        {(edgeA || edgeB) && (
          <button className="btn small" title="Сбросить выбор" onClick={() => clearEdges()}>✕</button>
        )}
      </div>

      {!edgeA && <p className="muted tiny">Кликни грань детали в 3D — выберется первая кромка (голубая).</p>}

      {edgeA && partA && (
        <div className="edge-pick">
          <div className="edge-pick-head">
            <span className="dot" style={{ background: '#22d3ee' }} /> «{partA.name}»
          </div>
          <AnchorPicker edge={edgeA} color="#22d3ee" onPick={(r) => setEdgeAnchor('A', r)} />
        </div>
      )}

      {edgeA && !edgeB && <p className="muted tiny">Теперь кликни вторую параллельную грань (розовая).</p>}

      {edgeB && partB && (
        <div className="edge-pick">
          <div className="edge-pick-head">
            <span className="dot" style={{ background: '#e879f9' }} /> «{partB.name}»
          </div>
          <AnchorPicker edge={edgeB} color="#e879f9" onPick={(r) => setEdgeAnchor('B', r)} />
        </div>
      )}

      {edgeA && edgeB && partA && partB && (() => {
        const axis = edgeA.axis
        const A = aabbOf(partA, project.materials)
        const B = aabbOf(partB, project.materials)
        const posA = facePos(A, axis, edgeA.ref)
        const posB = facePos(B, axis, edgeB.ref)
        const value = Math.abs(posB - posA)
        const dir = posB - posA >= 0 ? 1 : -1
        const samePart = partA.id === partB.id
        return (
          <label className="row gap">
            <span className="grow">Расстояние, мм</span>
            {samePart ? (
              <b>{Math.round(value)}</b>
            ) : (
              <NumberField
                value={Math.round(value)}
                min={0}
                onChange={(v) => {
                  beginInteraction()
                  updatePart(partB.id, {
                    position: applyEdgePair(partB, project.materials, edgeB.ref, axis, posA, dir, v),
                  })
                }}
              />
            )}
          </label>
        )
      })()}
    </div>
  )
}
