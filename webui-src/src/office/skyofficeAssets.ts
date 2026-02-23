/**
 * SkyOffice furniture asset loader.
 *
 * Loads item spritesheets and tileset images, extracts frames,
 * converts them to SpriteData at 0.5× scale (32px → 16px tiles),
 * and replaces placeholder sprites in the furniture catalog.
 *
 * Sources:
 *  - items/chair.png      → Office chair (32×64 per frame)
 *  - items/computer.png   → Computer desk (96×64 per frame)
 *  - items/whiteboard.png → Whiteboard (64×64 per frame)
 *  - items/vendingmachine.png → Vending machine (48×72)
 *  - Generic.png          → Plant (tiles col4-5, row13-14 → 64×64)
 *  - office_tileset.png   → Bookshelf (tiles col6, row7-8 → 32×64)
 */

import { TILE_SIZE } from '../constants.js'
import type { SpriteData } from './types.js'
import {
  FURNITURE_CATALOG,
  SKY_DESK,
  SKY_CHAIR,
  SKY_PLANT,
  SKY_BOOKSHELF,
  SKY_WHITEBOARD,
  SKY_VENDINGMACHINE,
} from './layout/furnitureCatalog.js'

/** Scale factor: our tile size vs SkyOffice tile size (16/32 = 0.5) */
const SCALE = TILE_SIZE / 32

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Extract a rectangular region from an image, scale to target size,
 * and convert to SpriteData (string[][] of hex colors).
 */
function extractToSpriteData(
  img: HTMLImageElement,
  sx: number, sy: number, sw: number, sh: number,
  tw: number, th: number,
): SpriteData {
  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, tw, th)

  const imageData = ctx.getImageData(0, 0, tw, th)
  const d = imageData.data
  const sprite: SpriteData = []
  for (let y = 0; y < th; y++) {
    const row: string[] = []
    for (let x = 0; x < tw; x++) {
      const i = (y * tw + x) * 4
      if (d[i + 3] < 128) {
        row.push('')
      } else {
        row.push(
          '#' +
          d[i].toString(16).padStart(2, '0') +
          d[i + 1].toString(16).padStart(2, '0') +
          d[i + 2].toString(16).padStart(2, '0'),
        )
      }
    }
    sprite.push(row)
  }
  return sprite
}

/**
 * Load ALL SkyOffice assets (item spritesheets + tilesets),
 * convert to SpriteData, and replace placeholder sprites in the catalog.
 * Calls onLoaded callback after sprites are replaced so furniture instances
 * can be rebuilt with real sprites.
 */
export async function loadSkyOfficeItems(basePath: string, onLoaded?: () => void): Promise<void> {
  try {
    const [chairImg, compImg, whiteboardImg, vendingImg, genericImg, officeImg] = await Promise.all([
      loadImage(`${basePath}/items/chair.png`),
      loadImage(`${basePath}/items/computer.png`),
      loadImage(`${basePath}/items/whiteboard.png`),
      loadImage(`${basePath}/items/vendingmachine.png`),
      loadImage(`${basePath}/Generic.png`),
      loadImage(`${basePath}/office_tileset.png`),
    ])
    console.log('[skyoffice] All asset images loaded')

    // ── Computer desk: 96×64 → 48×32 at 0.5× ──────────────
    const deskSprite = extractToSpriteData(compImg, 0, 0, 96, 64,
      Math.round(96 * SCALE), Math.round(64 * SCALE))

    // ── Office chair: 32×64 → 16×32 at 0.5× ───────────────
    const chairSprite = extractToSpriteData(chairImg, 0, 0, 32, 64,
      Math.round(32 * SCALE), Math.round(64 * SCALE))

    // ── Plant from Generic.png: tiles (col4,row13)-(col5,row14) = 64×64 → 32×32 ──
    const plantSprite = extractToSpriteData(genericImg, 4 * 32, 13 * 32, 64, 64,
      Math.round(64 * SCALE), Math.round(64 * SCALE))

    // ── Bookshelf from office_tileset.png (Modern_Office): tiles (col6,row7)-(col6,row8) = 32×64 → 16×32 ──
    const bookshelfSprite = extractToSpriteData(officeImg, 6 * 32, 7 * 32, 32, 64,
      Math.round(32 * SCALE), Math.round(64 * SCALE))

    // ── Whiteboard: first frame 64×64 → 32×32 ──────────────
    const whiteboardSprite = extractToSpriteData(whiteboardImg, 0, 0, 64, 64,
      Math.round(64 * SCALE), Math.round(64 * SCALE))

    // ── Vending machine: 48×72 → 24×36 ─────────────────────
    const vendingSprite = extractToSpriteData(vendingImg, 0, 0, 48, 72,
      Math.round(48 * SCALE), Math.round(72 * SCALE))

    // ── Replace placeholder sprites in catalog ─────────────
    for (const entry of FURNITURE_CATALOG) {
      switch (entry.type) {
        case SKY_DESK:
          entry.sprite = deskSprite
          break
        case SKY_CHAIR:
          entry.sprite = chairSprite
          break
        case SKY_PLANT:
          entry.sprite = plantSprite
          break
        case SKY_BOOKSHELF:
          entry.sprite = bookshelfSprite
          break
        case SKY_WHITEBOARD:
          entry.sprite = whiteboardSprite
          break
        case SKY_VENDINGMACHINE:
          entry.sprite = vendingSprite
          break
        case 'chair':
          // Upgrade old chair type for backward-compatible layouts
          entry.sprite = chairSprite
          break
      }
    }

    console.log('[skyoffice] All furniture sprites replaced')
    onLoaded?.()
  } catch (err) {
    console.warn('[skyoffice] Failed to load item assets:', err)
  }
}
