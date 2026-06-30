import { useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Edges, GizmoHelper, GizmoViewport, Grid, Html, OrbitControls, TransformControls } from '@react-three/drei'
import * as THREE from 'three'
import { useProjectStore } from '../store/useProjectStore'
import { useUiStore } from '../store/useUiStore'
import { MM, partSize, projectBounds, thicknessOf } from '../lib/geometry'
import { aabbOf, snapToFaces } from '../lib/snap'
import type { Material, Part } from '../types'

const FACE_SNAP_THRESHOLD = 25 // мм, радиус притяжения граней

function PartMesh({
  part,
  material,
  selected,
  onSelect,
}: {
  part: Part
  material?: Material
  selected: boolean
  onSelect: (id: string) => void
}) {
  const th = material?.thickness ?? 18
  const [sx, sy, sz] = partSize(part, th)
  const color = part.colorOverride ?? material?.color ?? '#cccccc'
  return (
    <mesh
      name={part.id}
      position={[part.position[0] * MM, part.position[1] * MM, part.position[2] * MM]}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect(part.id)
      }}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[sx * MM, sy * MM, sz * MM]} />
      <meshStandardMaterial
        color={color}
        roughness={0.7}
        metalness={0.05}
        emissive={selected ? '#2563eb' : '#000000'}
        emissiveIntensity={selected ? 0.35 : 0}
      />
      <Edges threshold={15} color={selected ? '#60a5fa' : '#5b6770'} />
    </mesh>
  )
}

function SelectionLabel({
  parts,
  materials,
  selectedId,
}: {
  parts: Part[]
  materials: Material[]
  selectedId: string | null
}) {
  const sel = selectedId ? parts.find((p) => p.id === selectedId) : undefined
  if (!sel) return null
  const th = thicknessOf(sel, materials)
  const sz = partSize(sel, th)
  const top: [number, number, number] = [
    sel.position[0] * MM,
    (sel.position[1] + sz[1] / 2) * MM + 0.03,
    sel.position[2] * MM,
  ]
  return (
    <Html position={top} center distanceFactor={undefined} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
      <div className="part3d-label">
        <b>{sel.name}</b>
        <span>{sel.length}×{sel.width}×{th}</span>
      </div>
    </Html>
  )
}

function SceneContent() {
  const { scene } = useThree()
  const project = useProjectStore((s) => s.project)
  const selectedId = useProjectStore((s) => s.selectedId)
  const select = useProjectStore((s) => s.select)
  const movePart = useProjectStore((s) => s.movePart)
  const beginInteraction = useProjectStore((s) => s.beginInteraction)
  const gridStep = useUiStore((s) => s.gridStep)
  const snapGrid = useUiStore((s) => s.snapGrid)
  const faceSnap = useUiStore((s) => s.faceSnap)
  const gap = useUiStore((s) => s.gap)
  const orbitRef = useRef<any>(null)
  const [target, setTarget] = useState<THREE.Object3D | null>(null)

  const parts = project.parts
  const materials = project.materials

  useEffect(() => {
    if (!selectedId) {
      setTarget(null)
      return
    }
    // Объект мог ещё не смонтироваться — ищем в следующем кадре.
    const obj = scene.getObjectByName(selectedId) ?? null
    setTarget(obj)
  }, [selectedId, scene, parts])

  // Фокусировка вида по габаритам проекта.
  useEffect(() => {
    const fit = () => {
      const { center, size } = projectBounds(parts, materials)
      const controls = orbitRef.current
      if (!controls) return
      const cx = center[0] * MM
      const cy = center[1] * MM
      const cz = center[2] * MM
      controls.target.set(cx, cy, cz)
      const radius = Math.max(0.5, Math.hypot(size[0], size[1], size[2]) * MM)
      const cam = controls.object as THREE.PerspectiveCamera
      cam.position.set(cx + radius * 1.3, cy + radius * 0.9, cz + radius * 1.7)
      controls.update()
    }
    window.addEventListener('fitView', fit)
    return () => window.removeEventListener('fitView', fit)
  }, [parts, materials])

  return (
    <>
      <color attach="background" args={['#0f1419']} />
      <hemisphereLight args={['#ffffff', '#3a4654', 0.9]} />
      <directionalLight
        position={[3, 6, 4]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.3} />

      <Grid
        args={[20, 20]}
        cellSize={0.1}
        cellThickness={0.6}
        cellColor="#2a3441"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#3c4a5a"
        infiniteGrid
        fadeDistance={25}
        position={[0, 0, 0]}
      />

      {parts.map((p) => (
        <PartMesh
          key={p.id}
          part={p}
          material={materials.find((m) => m.id === p.materialId)}
          selected={p.id === selectedId}
          onSelect={select}
        />
      ))}

      <SelectionLabel parts={parts} materials={materials} selectedId={selectedId} />

      {target && (
        <TransformControls
          object={target}
          mode="translate"
          translationSnap={snapGrid ? gridStep * MM : null}
          onMouseDown={() => beginInteraction()}
          onObjectChange={() => {
            if (!selectedId || !target) return
            const posMm: [number, number, number] = [
              target.position.x / MM,
              target.position.y / MM,
              target.position.z / MM,
            ]
            let finalMm = posMm
            if (faceSnap) {
              const sel = parts.find((x) => x.id === selectedId)
              if (sel) {
                const others = parts
                  .filter((x) => x.id !== selectedId)
                  .map((x) => aabbOf(x, materials))
                const sz = partSize(sel, thicknessOf(sel, materials))
                finalMm = snapToFaces(posMm, sz, others, gap, FACE_SNAP_THRESHOLD)
                // Возвращаем привязанную позицию в объект, чтобы картинка совпадала
                target.position.set(finalMm[0] * MM, finalMm[1] * MM, finalMm[2] * MM)
              }
            }
            movePart(selectedId, finalMm)
          }}
        />
      )}

      <OrbitControls
        ref={orbitRef}
        makeDefault
        enableDamping
        dampingFactor={0.12}
        minDistance={0.2}
        maxDistance={20}
      />

      <GizmoHelper alignment="bottom-right" margin={[60, 70]}>
        <GizmoViewport axisColors={['#ef4444', '#22c55e', '#3b82f6']} labelColor="white" />
      </GizmoHelper>
    </>
  )
}

export default function Scene3D() {
  const select = useProjectStore((s) => s.select)
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ logarithmicDepthBuffer: true }}
      camera={{ position: [1.2, 1, 1.4], fov: 45, near: 0.01, far: 100 }}
      onPointerMissed={() => select(null)}
      style={{ touchAction: 'none' }}
    >
      <SceneContent />
    </Canvas>
  )
}
