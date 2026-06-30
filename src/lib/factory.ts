import type { EdgeBanding, Material, Part, PartRole, Project } from '../types'
import { SCHEMA_VERSION } from '../types'
import { uid } from './id'

export const DEFAULT_MATERIALS: Material[] = [
  { id: 'mat_ldsp_18', name: 'ЛДСП 18 мм', kind: 'LDSP', thickness: 18, color: '#d9c7a3' },
  { id: 'mat_ldsp_16', name: 'ЛДСП 16 мм', kind: 'LDSP', thickness: 16, color: '#cdb896' },
  { id: 'mat_hdf_3', name: 'ХДФ 3 мм (задняя)', kind: 'HDF', thickness: 3, color: '#b08d57' },
]

export function emptyEdges(): EdgeBanding {
  return { L1: 0, L2: 0, W1: 0, W2: 0 }
}

export function createMaterial(partial: Partial<Material> = {}): Material {
  return {
    id: uid('mat'),
    name: 'Новый материал',
    kind: 'LDSP',
    thickness: 18,
    color: '#d9c7a3',
    ...partial,
  }
}

export function createPart(partial: Partial<Part> = {}): Part {
  return {
    id: uid('part'),
    name: 'Деталь',
    role: 'custom' as PartRole,
    materialId: DEFAULT_MATERIALS[0].id,
    length: 600,
    width: 300,
    orientation: 'flat',
    edges: emptyEdges(),
    grain: 'none',
    qty: 1,
    position: [0, 0, 0],
    holes: [],
    ...partial,
  }
}

export function createProject(name = 'Новый проект'): Project {
  const now = Date.now()
  return {
    id: uid('proj'),
    name,
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    materials: DEFAULT_MATERIALS.map((m) => ({ ...m })),
    parts: [],
  }
}
