/**
 * SkyOffice FloorAndGround tileset renderer.
 *
 * Loads the FloorAndGround.png composite tileset (64 columns × 40 rows, 32×32 per tile)
 * and provides per-tile canvases for floor rendering.
 * Tile IDs are 1-based (matching Tiled/SkyOffice convention; 0 = empty).
 */

import { TILE_SIZE } from '../constants.js'

let tilesetImage: HTMLImageElement | null = null

const TILESET_COLS = 64
const TILESET_TILE_SIZE = 32

/**
 * Map our floor types (1-7) to FloorAndGround.png tile IDs.
 * These are confirmed fill/center tiles from the SkyOffice map ground layer.
 */
const FLOOR_TILE_MAP: Record<number, number> = {
  1: 1607,  // Warm wood office floor (left office area)
  2: 668,   // Textured room floor (upper-right room)
  3: 412,   // Office floor variant (right large office)
  4: 415,   // Hallway/corridor floor
  5: 2383,  // Bottom office floor variant
  6: 658,   // Decorative upper floor
  7: 1,     // Basic floor tile
}

/** Cache: "tileId-zoom" → canvas */
const tileCache = new Map<string, HTMLCanvasElement>()

export async function loadOfficeTileset(basePath: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      tilesetImage = img
      console.log(`[officeTileset] FloorAndGround loaded (${img.width}×${img.height})`)
      resolve()
    }
    img.onerror = (err) => {
      console.warn('[officeTileset] Failed to load FloorAndGround.png:', err)
      resolve() // Don't block startup on failure
    }
    img.src = `${basePath}/FloorAndGround.png`
  })
}

export function hasOfficeTileset(): boolean {
  return tilesetImage !== null
}

/**
 * Get a cached canvas containing a single floor tile from the tileset,
 * scaled to the current game tile size × zoom.
 */
export function getFloorTileCanvas(floorType: number, zoom: number): HTMLCanvasElement | null {
  const tileId = FLOOR_TILE_MAP[floorType]
  if (!tileId || !tilesetImage) return null

  const key = `${tileId}-${zoom}`
  const cached = tileCache.get(key)
  if (cached) return cached

  // 1-based tile ID → 0-based index for pixel calculation
  const idx = tileId - 1
  const col = idx % TILESET_COLS
  const row = Math.floor(idx / TILESET_COLS)
  const sx = col * TILESET_TILE_SIZE
  const sy = row * TILESET_TILE_SIZE

  // Destination: game TILE_SIZE × zoom
  const destSize = TILE_SIZE * zoom
  const canvas = document.createElement('canvas')
  canvas.width = destSize
  canvas.height = destSize
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(
    tilesetImage,
    sx, sy, TILESET_TILE_SIZE, TILESET_TILE_SIZE,
    0, 0, destSize, destSize,
  )

  tileCache.set(key, canvas)
  return canvas
}
