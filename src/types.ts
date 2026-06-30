// Доменная модель приложения "Деталировка 3D".
// Все линейные размеры хранятся в миллиметрах.

export type Vec3 = [number, number, number]

export type MaterialKind = 'LDSP' | 'MDF' | 'HDF' | 'DSP' | 'PLY' | 'OTHER'

export interface Material {
  id: string
  name: string // напр. "ЛДСП Egger Белый U104"
  kind: MaterialKind
  thickness: number // мм
  color: string // hex для 3D
}

/**
 * Толщина кромки в мм. 0 — кромки нет.
 * Стандартные значения: 0.4, 1, 2 мм.
 */
export type EdgeThickness = 0 | 0.4 | 1 | 2

/**
 * Кромкование по 4 сторонам панели.
 * L — стороны вдоль длины (length), W — вдоль ширины (width).
 */
export interface EdgeBanding {
  L1: EdgeThickness
  L2: EdgeThickness
  W1: EdgeThickness
  W2: EdgeThickness
}

/**
 * Ориентация панели в корпусе. Определяет, как длина/ширина/толщина
 * детали проецируются на оси сцены (X, Y, Z).
 *  - flat        — лежит плашмя (дно, крыша, полка): X=length, Y=thickness, Z=width
 *  - left-right  — стоит вертикально вдоль глубины (боковина): X=thickness, Y=length, Z=width
 *  - front-back  — стоит вертикально лицом вперёд (задняя стенка, фасад): X=length, Y=width, Z=thickness
 */
export type Orientation = 'flat' | 'left-right' | 'front-back'

export type PartRole =
  | 'side'
  | 'bottom'
  | 'top'
  | 'shelf'
  | 'back'
  | 'facade'
  | 'divider'
  | 'custom'

/** Точка присадки (для будущей карты присадок, фаза 2). */
export interface DrillHole {
  id: string
  // Координаты на плоскости панели от угла, мм.
  x: number
  y: number
  diameter: number // мм
  depth: number // мм
  through: boolean // сквозное
  type: 'confirmat' | 'dowel' | 'minifix' | 'shelf-pin' | 'hinge' | 'custom'
  // Сторона панели: 'face' лицевая, 'back' тыльная, либо торец.
  face: 'face' | 'back' | 'edge-L1' | 'edge-L2' | 'edge-W1' | 'edge-W2'
}

export interface Part {
  id: string
  name: string
  role: PartRole
  materialId: string
  // Габариты детали (две большие стороны панели), мм. Толщина берётся из материала.
  length: number
  width: number
  orientation: Orientation
  edges: EdgeBanding
  // Текстура: вдоль длины / вдоль ширины / без направления.
  grain: 'length' | 'width' | 'none'
  qty: number
  // Положение центра детали в сцене, мм.
  position: Vec3
  colorOverride?: string
  holes?: DrillHole[]
  // true — деталь сгенерирована параметрическим корпусом (пересобирается при
  // изменении габаритов). Ручные детали этот флаг не имеют.
  generated?: boolean
}

/** Конструктив крыши: вкладная между боковинами / накладная сверху. */
export type TopMode = 'inset' | 'overlay'
/** Конструктив дна: вкладное между боковинами / боковины стоят на дне. */
export type BottomMode = 'inset' | 'sides-on-bottom'

export interface CabinetParams {
  name: string
  width: number // Ш, мм (X)
  height: number // В, мм (Y)
  depth: number // Г, мм (Z); при наличии фасада включает его толщину и зазор
  thickness: number // толщина ЛДСП корпуса, мм
  backThickness: number // толщина задней стенки, мм
  shelves: number // количество полок
  hasBack: boolean
  hasTop: boolean
  topMode: TopMode
  bottomMode: BottomMode
  facade: boolean // учитывать фасад
  facadeThickness: number // толщина фасада, мм
  facadeGap: number // зазор между фасадом и корпусом, мм
  materialId: string
  backMaterialId: string
  facadeMaterialId: string
  frontEdge: EdgeThickness
}

export interface Project {
  id: string
  name: string
  schemaVersion: number
  createdAt: number
  updatedAt: number
  materials: Material[]
  parts: Part[]
  // Параметры параметрического корпуса (если создан).
  cabinet?: CabinetParams
}

export const SCHEMA_VERSION = 1
