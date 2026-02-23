import { TileType, TILE_SIZE, Direction } from '../types.js'
import { SKY_DESK, SKY_CHAIR, SKY_PLANT, SKY_BOOKSHELF, SKY_WHITEBOARD, SKY_VENDINGMACHINE } from './furnitureCatalog.js'
import type { TileType as TileTypeVal, OfficeLayout, PlacedFurniture, Seat, FurnitureInstance, FloorColor } from '../types.js'
import { getCatalogEntry } from './furnitureCatalog.js'
import { getColorizedSprite } from '../colorize.js'

/** Convert flat tile array from layout into 2D grid */
export function layoutToTileMap(layout: OfficeLayout): TileTypeVal[][] {
  const map: TileTypeVal[][] = []
  for (let r = 0; r < layout.rows; r++) {
    const row: TileTypeVal[] = []
    for (let c = 0; c < layout.cols; c++) {
      row.push(layout.tiles[r * layout.cols + c])
    }
    map.push(row)
  }
  return map
}

/** Convert placed furniture into renderable FurnitureInstance[] */
export function layoutToFurnitureInstances(furniture: PlacedFurniture[]): FurnitureInstance[] {
  // Pre-compute desk zY per tile so surface items can sort in front of desks
  const deskZByTile = new Map<string, number>()
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type)
    if (!entry || !entry.isDesk) continue
    const deskZY = item.row * TILE_SIZE + entry.sprite.length
    for (let dr = 0; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        const key = `${item.col + dc},${item.row + dr}`
        const prev = deskZByTile.get(key)
        if (prev === undefined || deskZY > prev) deskZByTile.set(key, deskZY)
      }
    }
  }

  const instances: FurnitureInstance[] = []
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type)
    if (!entry) continue
    const x = item.col * TILE_SIZE
    const y = item.row * TILE_SIZE
    const spriteH = entry.sprite.length
    let zY = y + spriteH

    // Chair z-sorting: ensure characters sitting on chairs render correctly
    if (entry.category === 'chairs') {
      if (entry.orientation === 'back') {
        // Back-facing chairs render IN FRONT of the seated character
        // (the chair back visually occludes the character behind it)
        zY = (item.row + 1) * TILE_SIZE + 1
      } else {
        // All other chairs: cap zY to first row bottom so characters
        // at any seat tile render in front of the chair
        zY = (item.row + 1) * TILE_SIZE
      }
    }

    // Surface items render in front of the desk they sit on
    if (entry.canPlaceOnSurfaces) {
      for (let dr = 0; dr < entry.footprintH; dr++) {
        for (let dc = 0; dc < entry.footprintW; dc++) {
          const deskZ = deskZByTile.get(`${item.col + dc},${item.row + dr}`)
          if (deskZ !== undefined && deskZ + 0.5 > zY) zY = deskZ + 0.5
        }
      }
    }

    // Colorize sprite if this furniture has a color override
    let sprite = entry.sprite
    if (item.color) {
      const { h, s, b: bv, c: cv } = item.color
      sprite = getColorizedSprite(`furn-${item.type}-${h}-${s}-${bv}-${cv}-${item.color.colorize ? 1 : 0}`, entry.sprite, item.color)
    }

    instances.push({ sprite, x, y, zY })
  }
  return instances
}

/** Get all tiles blocked by furniture footprints, optionally excluding a set of tiles.
 *  Skips top backgroundTiles rows so characters can walk through them. */
export function getBlockedTiles(furniture: PlacedFurniture[], excludeTiles?: Set<string>): Set<string> {
  const tiles = new Set<string>()
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type)
    if (!entry) continue
    const bgRows = entry.backgroundTiles || 0
    for (let dr = 0; dr < entry.footprintH; dr++) {
      if (dr < bgRows) continue // skip background rows — characters can walk through
      for (let dc = 0; dc < entry.footprintW; dc++) {
        const key = `${item.col + dc},${item.row + dr}`
        if (excludeTiles && excludeTiles.has(key)) continue
        tiles.add(key)
      }
    }
  }
  return tiles
}

/** Get tiles blocked for placement purposes — skips top backgroundTiles rows per item */
export function getPlacementBlockedTiles(furniture: PlacedFurniture[], excludeUid?: string): Set<string> {
  const tiles = new Set<string>()
  for (const item of furniture) {
    if (item.uid === excludeUid) continue
    const entry = getCatalogEntry(item.type)
    if (!entry) continue
    const bgRows = entry.backgroundTiles || 0
    for (let dr = 0; dr < entry.footprintH; dr++) {
      if (dr < bgRows) continue // skip background rows
      for (let dc = 0; dc < entry.footprintW; dc++) {
        tiles.add(`${item.col + dc},${item.row + dr}`)
      }
    }
  }
  return tiles
}

/** Map chair orientation to character facing direction */
function orientationToFacing(orientation: string): Direction {
  switch (orientation) {
    case 'front': return Direction.DOWN
    case 'back': return Direction.UP
    case 'left': return Direction.LEFT
    case 'right': return Direction.RIGHT
    default: return Direction.DOWN
  }
}

/** Generate seats from chair furniture.
 *  Facing priority: 1) chair orientation, 2) adjacent desk, 3) forward (DOWN). */
export function layoutToSeats(furniture: PlacedFurniture[]): Map<string, Seat> {
  const seats = new Map<string, Seat>()

  // Build set of all desk tiles
  const deskTiles = new Set<string>()
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type)
    if (!entry || !entry.isDesk) continue
    for (let dr = 0; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        deskTiles.add(`${item.col + dc},${item.row + dr}`)
      }
    }
  }

  const dirs: Array<{ dc: number; dr: number; facing: Direction }> = [
    { dc: 0, dr: -1, facing: Direction.UP },    // desk is above chair → face UP
    { dc: 0, dr: 1, facing: Direction.DOWN },   // desk is below chair → face DOWN
    { dc: -1, dr: 0, facing: Direction.LEFT },   // desk is left of chair → face LEFT
    { dc: 1, dr: 0, facing: Direction.RIGHT },   // desk is right of chair → face RIGHT
  ]

  // For each chair, every footprint tile becomes a seat.
  // Multi-tile chairs (e.g. 2-tile couches) produce multiple seats.
  for (const item of furniture) {
    const entry = getCatalogEntry(item.type)
    if (!entry || entry.category !== 'chairs') continue

    let seatCount = 0
    for (let dr = 0; dr < entry.footprintH; dr++) {
      for (let dc = 0; dc < entry.footprintW; dc++) {
        const tileCol = item.col + dc
        const tileRow = item.row + dr

        // Determine facing direction:
        // 1) Chair orientation takes priority
        // 2) Adjacent desk direction
        // 3) Default forward (DOWN)
        let facingDir: Direction = Direction.DOWN
        if (entry.orientation) {
          facingDir = orientationToFacing(entry.orientation)
        } else {
          for (const d of dirs) {
            if (deskTiles.has(`${tileCol + d.dc},${tileRow + d.dr}`)) {
              facingDir = d.facing
              break
            }
          }
        }

        // First seat uses chair uid (backward compat), subsequent use uid:N
        const seatUid = seatCount === 0 ? item.uid : `${item.uid}:${seatCount}`
        seats.set(seatUid, {
          uid: seatUid,
          seatCol: tileCol,
          seatRow: tileRow,
          facingDir,
          assigned: false,
        })
        seatCount++
      }
    }
  }

  return seats
}

/** Get the set of tiles occupied by seats (so they can be excluded from blocked tiles) */
export function getSeatTiles(seats: Map<string, Seat>): Set<string> {
  const tiles = new Set<string>()
  for (const seat of seats.values()) {
    tiles.add(`${seat.seatCol},${seat.seatRow}`)
  }
  return tiles
}

/** Default floor colors (used for fallback when tileset is unavailable) */
const ROOM_A_COLOR: FloorColor = { h: 35, s: 30, b: 15, c: 0 }   // warm beige
const ROOM_B_COLOR: FloorColor = { h: 25, s: 45, b: 5, c: 10 }   // warm brown
const ROOM_C_COLOR: FloorColor = { h: 200, s: 30, b: 5, c: 0 }   // cool blue-gray
const ROOM_D_COLOR: FloorColor = { h: 140, s: 25, b: 5, c: 0 }   // soft green
const DOORWAY_COLOR: FloorColor = { h: 35, s: 25, b: 10, c: 0 }  // tan

/**
 * Create a 4-room office layout with SkyOffice furniture.
 * Grid: 28×20. Each room has 2 computer desks (3×2) and 4 chairs.
 * Total: 8 desks, 16 seats — supports up to 16 agents.
 */
export function createDefaultLayout(): OfficeLayout {
  const COLS = 28
  const ROWS = 20
  const W = TileType.WALL
  const F1 = TileType.FLOOR_1
  const F2 = TileType.FLOOR_2
  const F3 = TileType.FLOOR_3
  const F4 = TileType.FLOOR_4
  const F5 = TileType.FLOOR_5  // doorway

  const tiles: TileTypeVal[] = []
  const tileColors: Array<FloorColor | null> = []

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      // Outer walls
      if (r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1) {
        tiles.push(W); tileColors.push(null); continue
      }
      // Vertical divider at col 14
      if (c === 14) {
        // Doorways at rows 4-5 and rows 13-14
        if ((r >= 4 && r <= 5) || (r >= 13 && r <= 14)) {
          tiles.push(F5); tileColors.push(DOORWAY_COLOR)
        } else {
          tiles.push(W); tileColors.push(null)
        }
        continue
      }
      // Horizontal divider at row 10
      if (r === 10) {
        // Doorways at cols 6-7 and cols 20-21
        if ((c >= 6 && c <= 7) || (c >= 20 && c <= 21)) {
          tiles.push(F5); tileColors.push(DOORWAY_COLOR)
        } else {
          tiles.push(W); tileColors.push(null)
        }
        continue
      }
      // Room assignment
      if (c < 14 && r < 10) {
        tiles.push(F1); tileColors.push(ROOM_A_COLOR)
      } else if (c > 14 && r < 10) {
        tiles.push(F2); tileColors.push(ROOM_B_COLOR)
      } else if (c < 14 && r > 10) {
        tiles.push(F3); tileColors.push(ROOM_C_COLOR)
      } else {
        tiles.push(F4); tileColors.push(ROOM_D_COLOR)
      }
    }
  }

  // Helper: generate furniture for one room
  // Each room gets 2 sky_desks and 4 sky_chairs (one above + one below each desk)
  function roomFurniture(
    prefix: string, deskCol1: number, deskCol2: number, deskRow: number,
  ): PlacedFurniture[] {
    return [
      // Desks (3×2)
      { uid: `${prefix}-desk-a`, type: SKY_DESK, col: deskCol1, row: deskRow },
      { uid: `${prefix}-desk-b`, type: SKY_DESK, col: deskCol2, row: deskRow },
      // Chairs above desks (face DOWN toward desk)
      { uid: `${prefix}-ch-a-top`, type: SKY_CHAIR, col: deskCol1 + 1, row: deskRow - 1 },
      { uid: `${prefix}-ch-b-top`, type: SKY_CHAIR, col: deskCol2 + 1, row: deskRow - 1 },
      // Chairs below desks (face UP toward desk)
      { uid: `${prefix}-ch-a-bot`, type: SKY_CHAIR, col: deskCol1 + 1, row: deskRow + 2 },
      { uid: `${prefix}-ch-b-bot`, type: SKY_CHAIR, col: deskCol2 + 1, row: deskRow + 2 },
    ]
  }

  const furniture: PlacedFurniture[] = [
    // Room 1 (top-left): desks at cols 2 and 8, row 3
    ...roomFurniture('r1', 2, 8, 3),
    // Room 2 (top-right): desks at cols 16 and 22, row 3
    ...roomFurniture('r2', 16, 22, 3),
    // Room 3 (bottom-left): desks at cols 2 and 8, row 13
    ...roomFurniture('r3', 2, 8, 13),
    // Room 4 (bottom-right): desks at cols 16 and 22, row 13
    ...roomFurniture('r4', 16, 22, 13),
    // Plants (2×2 footprint, backgroundTiles:1) — corners of each room
    { uid: 'plant-1', type: SKY_PLANT, col: 1, row: 1 },
    { uid: 'plant-2', type: SKY_PLANT, col: 12, row: 1 },
    { uid: 'plant-3', type: SKY_PLANT, col: 15, row: 1 },
    { uid: 'plant-4', type: SKY_PLANT, col: 25, row: 1 },
    { uid: 'plant-5', type: SKY_PLANT, col: 1, row: 17 },
    { uid: 'plant-6', type: SKY_PLANT, col: 12, row: 17 },
    { uid: 'plant-7', type: SKY_PLANT, col: 15, row: 17 },
    { uid: 'plant-8', type: SKY_PLANT, col: 25, row: 17 },
    // Bookshelves (1×2, backgroundTiles:1) — along walls
    { uid: 'shelf-1', type: SKY_BOOKSHELF, col: 6, row: 1 },
    { uid: 'shelf-2', type: SKY_BOOKSHELF, col: 7, row: 1 },
    { uid: 'shelf-3', type: SKY_BOOKSHELF, col: 20, row: 1 },
    { uid: 'shelf-4', type: SKY_BOOKSHELF, col: 21, row: 1 },
    // Whiteboards (2×2, backgroundTiles:1)
    { uid: 'wb-1', type: SKY_WHITEBOARD, col: 4, row: 7 },
    { uid: 'wb-2', type: SKY_WHITEBOARD, col: 18, row: 7 },
    // Vending machines (2×2)
    { uid: 'vm-1', type: SKY_VENDINGMACHINE, col: 1, row: 11 },
    { uid: 'vm-2', type: SKY_VENDINGMACHINE, col: 25, row: 11 },
  ]

  return { version: 1, cols: COLS, rows: ROWS, tiles, tileColors, furniture }
}

/** Serialize layout to JSON string */
export function serializeLayout(layout: OfficeLayout): string {
  return JSON.stringify(layout)
}

/** Deserialize layout from JSON string, migrating old tile types if needed */
export function deserializeLayout(json: string): OfficeLayout | null {
  try {
    const obj = JSON.parse(json)
    if (obj && obj.version === 1 && Array.isArray(obj.tiles) && Array.isArray(obj.furniture)) {
      return migrateLayout(obj as OfficeLayout)
    }
  } catch { /* ignore parse errors */ }
  return null
}

/** Old pixel-art furniture types that should trigger a full layout reset */
const LEGACY_FURNITURE_TYPES = new Set(['desk', 'bookshelf', 'plant', 'cooler', 'whiteboard', 'pc', 'lamp'])

/**
 * Migrate layout. If it contains old pixel-art furniture types, returns null
 * to signal the caller to use the new SkyOffice default layout instead.
 * Otherwise ensures tileColors are present.
 */
export function migrateLayoutColors(layout: OfficeLayout): OfficeLayout | null {
  // Detect legacy furniture → discard saved layout, use new default
  const hasLegacy = layout.furniture.some(f => LEGACY_FURNITURE_TYPES.has(f.type))
  if (hasLegacy) {
    console.log('[layout] Legacy furniture detected — resetting to SkyOffice default layout')
    return null
  }
  return migrateLayout(layout)
}

/**
 * Migrate old layouts that use legacy tile types (TILE_FLOOR=1, WOOD_FLOOR=2, CARPET=3, DOORWAY=4)
 * to the new pattern-based system. If tileColors is already present, no migration needed.
 */
function migrateLayout(layout: OfficeLayout): OfficeLayout {
  if (layout.tileColors && layout.tileColors.length === layout.tiles.length) {
    return layout // Already migrated
  }

  // Check if any tiles use old values (1-4) — these map directly to FLOOR_1-4
  // but need color assignments
  const tileColors: Array<FloorColor | null> = []
  for (const tile of layout.tiles) {
    switch (tile) {
      case 0: // WALL
        tileColors.push(null)
        break
      case 1: // was TILE_FLOOR → FLOOR_1 beige
        tileColors.push(ROOM_A_COLOR)
        break
      case 2: // was WOOD_FLOOR → FLOOR_2 brown
        tileColors.push(ROOM_B_COLOR)
        break
      case 3: // was CARPET → FLOOR_3 purple
        tileColors.push(ROOM_C_COLOR)
        break
      case 4: // was DOORWAY → FLOOR_4 tan
        tileColors.push(DOORWAY_COLOR)
        break
      default:
        // New tile types (5-7) without colors — use neutral gray
        tileColors.push(tile > 0 ? { h: 0, s: 0, b: 0, c: 0 } : null)
    }
  }

  return { ...layout, tileColors }
}
