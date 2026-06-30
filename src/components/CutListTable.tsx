import { useMemo } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { buildCutList, cutListToCsv, cutListTotals, projectToJson } from '../lib/cutlist'
import { downloadText } from '../lib/persistence'

export default function CutListTable() {
  const project = useProjectStore((s) => s.project)
  const select = useProjectStore((s) => s.select)

  const rows = useMemo(
    () => buildCutList(project.parts, project.materials),
    [project.parts, project.materials],
  )
  const totals = useMemo(() => cutListTotals(rows), [rows])

  const safeName = project.name.replace(/[^\wа-яё\- ]/gi, '').trim() || 'project'

  return (
    <div className="panel-body">
      <div className="row gap wrap">
        <button
          className="btn"
          disabled={rows.length === 0}
          onClick={() => downloadText(`${safeName}.csv`, cutListToCsv(rows), 'text/csv')}
        >
          Экспорт CSV
        </button>
        <button
          className="btn"
          onClick={() => downloadText(`${safeName}.json`, projectToJson(project), 'application/json')}
        >
          Экспорт проекта
        </button>
        <button className="btn" disabled={rows.length === 0} onClick={() => window.print()}>
          Печать
        </button>
      </div>

      <div className="totals">
        <span>Деталей: <b>{totals.parts}</b></span>
        <span>Площадь: <b>{totals.area.toFixed(2)} м²</b></span>
        <span>Кромка: <b>{totals.edge.toFixed(2)} м.п.</b></span>
      </div>

      <div className="table-wrap">
        <table className="cutlist">
          <thead>
            <tr>
              <th>№</th>
              <th>Деталь</th>
              <th>Материал</th>
              <th>Д×Ш×Т</th>
              <th>Кол</th>
              <th>Кромка</th>
              <th>Текст.</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={7} className="muted center">Нет деталей</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={r.key} onClick={() => select(r.partIds[0])} className="clickable">
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.material}</td>
                <td className="nowrap">{r.length}×{r.width}×{r.thickness}</td>
                <td>{r.qty}</td>
                <td className="nowrap">{r.edges}</td>
                <td>{r.grain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
