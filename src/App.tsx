import { useEffect, useState } from 'react'
import Scene3D from './components/Scene3D'
import TopBar from './components/TopBar'
import PartsPanel from './components/PartsPanel'
import CutListTable from './components/CutListTable'
import MaterialsPanel from './components/MaterialsPanel'
import CabinetPanel from './components/CabinetPanel'
import { useProjectStore } from './store/useProjectStore'
import { useUiStore } from './store/useUiStore'
import { lastProjectId, loadProject } from './lib/persistence'
import { migrateProject } from './lib/persistence'

type Tab = 'cabinet' | 'parts' | 'cutlist' | 'materials'

export default function App() {
  const [tab, setTab] = useState<Tab>('cabinet')
  const [loaded, setLoaded] = useState(false)
  const setProject = useProjectStore((s) => s.setProject)

  // Восстановление последнего проекта из IndexedDB.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const id = await lastProjectId()
        if (id && !cancelled) {
          const p = await loadProject(id)
          if (p && !cancelled) {
            setProject(migrateProject(p))
            setTimeout(() => window.dispatchEvent(new Event('fitView')), 100)
          }
        }
      } finally {
        if (!cancelled) setLoaded(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [setProject])

  // Горячие клавиши: undo/redo и сдвиг выделенной детали стрелками.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) useProjectStore.getState().redo()
        else useProjectStore.getState().undo()
        return
      }

      // Не перехватываем клавиши, когда фокус в поле ввода.
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return

      const store = useProjectStore.getState()
      const { selectedId, nudgeSelected } = store
      if (!selectedId) return

      // Ctrl/Cmd+D — дублировать; Delete/Backspace — удалить выделенную деталь.
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault(); store.duplicatePart(selectedId); return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault(); store.removePart(selectedId); return
      }

      const step = useUiStore.getState().gridStep || 1
      // ←/→ — ось X; ↑/↓ — глубина Z; Shift+↑/↓ — высота Y.
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault(); nudgeSelected(0, -step); break
        case 'ArrowRight':
          e.preventDefault(); nudgeSelected(0, step); break
        case 'ArrowUp':
          e.preventDefault(); nudgeSelected(e.shiftKey ? 1 : 2, e.shiftKey ? step : -step); break
        case 'ArrowDown':
          e.preventDefault(); nudgeSelected(e.shiftKey ? 1 : 2, e.shiftKey ? -step : step); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="app">
      <TopBar onOpenGenerator={() => setTab('cabinet')} />
      <div className="content">
        <div className="canvas-area">
          {loaded && <Scene3D />}
          <div className="canvas-hint">ЛКМ — выбрать · Shift+ЛКМ (или ↔ в списке) — вторая деталь для размеров · перетягивай за стрелки</div>
        </div>
        <aside className="side-panel">
          <nav className="tabs">
            <button className={tab === 'cabinet' ? 'active' : ''} onClick={() => setTab('cabinet')}>Корпус</button>
            <button className={tab === 'parts' ? 'active' : ''} onClick={() => setTab('parts')}>Детали</button>
            <button className={tab === 'cutlist' ? 'active' : ''} onClick={() => setTab('cutlist')}>Деталировка</button>
            <button className={tab === 'materials' ? 'active' : ''} onClick={() => setTab('materials')}>Материалы</button>
          </nav>
          <div className="tab-content">
            {tab === 'cabinet' && <CabinetPanel />}
            {tab === 'parts' && <PartsPanel />}
            {tab === 'cutlist' && <CutListTable />}
            {tab === 'materials' && <MaterialsPanel />}
          </div>
        </aside>
      </div>
    </div>
  )
}
