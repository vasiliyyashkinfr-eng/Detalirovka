import { useRef } from 'react'
import { useProjectStore } from '../store/useProjectStore'
import { migrateProject, validateProject } from '../lib/persistence'

export default function TopBar({ onOpenGenerator }: { onOpenGenerator: () => void }) {
  const project = useProjectStore((s) => s.project)
  const renameProject = useProjectStore((s) => s.renameProject)
  const newProject = useProjectStore((s) => s.newProject)
  const setProject = useProjectStore((s) => s.setProject)
  const undo = useProjectStore((s) => s.undo)
  const redo = useProjectStore((s) => s.redo)
  const canUndo = useProjectStore((s) => s.history.past.length > 0)
  const canRedo = useProjectStore((s) => s.history.future.length > 0)
  const fileRef = useRef<HTMLInputElement>(null)

  const onImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result))
        if (validateProject(data)) {
          setProject(migrateProject(data))
          window.dispatchEvent(new Event('fitView'))
        } else {
          alert('Файл не похож на проект деталировки.')
        }
      } catch {
        alert('Не удалось прочитать файл.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <header className="topbar">
      <div className="brand">📐 Деталировка<span>3D</span></div>
      <input
        className="project-name"
        value={project.name}
        onChange={(e) => renameProject(e.target.value)}
        spellCheck={false}
      />
      <div className="topbar-actions">
        <button className="btn primary" onClick={onOpenGenerator}>Корпус</button>
        <button className="btn" title="Вписать вид" onClick={() => window.dispatchEvent(new Event('fitView'))}>⤢</button>
        <button className="btn" disabled={!canUndo} onClick={undo} title="Отменить">↶</button>
        <button className="btn" disabled={!canRedo} onClick={redo} title="Повторить">↷</button>
        <button className="btn" onClick={() => fileRef.current?.click()} title="Импорт проекта">Импорт</button>
        <button className="btn" onClick={() => { if (confirm('Создать новый пустой проект?')) newProject() }} title="Новый проект">Новый</button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
      </div>
    </header>
  )
}
