/**
 * PNG-based character sprites from SkyOffice assets.
 *
 * Each character spritesheet is 1664×48 (52 frames of 32×48):
 *   idle (24 frames: 6 per direction) + run (24 frames: 6 per direction) + sit (4 frames: 1 per direction)
 *
 * Direction order in spritesheet: down(0-5), right(6-11), up(12-17), left(18-23)
 * Sit sprites are loaded from separate PNGs.
 */

import { Direction, CharacterState, TILE_SIZE } from '../types.js'

/** Source frame size in the spritesheet */
const PNG_SRC_W = 32
const PNG_SRC_H = 48

/** Rendered frame size — scale to match tile grid (1 tile wide, 1.5 tiles tall) */
export const PNG_CHAR_W = TILE_SIZE
export const PNG_CHAR_H = Math.round(TILE_SIZE * (PNG_SRC_H / PNG_SRC_W))

/** Character skin names matching PNG filenames */
const SKIN_NAMES = ['adam', 'ash', 'lucy', 'nancy'] as const
export type SkinName = (typeof SKIN_NAMES)[number]

/** Direction order as they appear in the spritesheet (verified from SkyOffice CharacterAnims.ts) */
const SHEET_DIR_ORDER: Direction[] = [Direction.RIGHT, Direction.UP, Direction.LEFT, Direction.DOWN]

/** Frames per direction in spritesheet animations */
const FRAMES_PER_DIR = 6

/** Loaded sprite frames per skin */
interface SkinFrames {
  /** Walk/run animation: [direction][frameIndex] */
  walk: Record<Direction, HTMLCanvasElement[]>
  /** Sitting: [direction] */
  sit: Record<Direction, HTMLCanvasElement>
  /** Idle animation: [direction][frameIndex] */
  idle: Record<Direction, HTMLCanvasElement[]>
}

const loadedSkins = new Map<SkinName, SkinFrames>()
let loadPromise: Promise<void> | null = null

/** Cut a horizontal spritesheet into individual frame canvases, scaled to render size */
function cutSheet(img: HTMLImageElement, startFrame: number, count: number): HTMLCanvasElement[] {
  const frames: HTMLCanvasElement[] = []
  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = PNG_CHAR_W
    canvas.height = PNG_CHAR_H
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(img, (startFrame + i) * PNG_SRC_W, 0, PNG_SRC_W, PNG_SRC_H, 0, 0, PNG_CHAR_W, PNG_CHAR_H)
    frames.push(canvas)
  }
  return frames
}

/** Load an image from a URL */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

/** Load all PNG character sprites */
export async function loadPngSprites(basePath: string): Promise<void> {
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    const dirNames: Array<{ dir: Direction; name: string }> = [
      { dir: Direction.DOWN, name: 'down' },
      { dir: Direction.LEFT, name: 'left' },
      { dir: Direction.RIGHT, name: 'right' },
      { dir: Direction.UP, name: 'up' },
    ]

    for (const skinName of SKIN_NAMES) {
      try {
        // Load spritesheet
        const sheet = await loadImage(`${basePath}/characters/${skinName}.png`)

        // Cut idle frames (first 24 frames: 6 per direction)
        const idleAll = cutSheet(sheet, 0, 24)
        const idle: Record<number, HTMLCanvasElement[]> = {}
        for (let d = 0; d < 4; d++) {
          idle[SHEET_DIR_ORDER[d]] = idleAll.slice(d * FRAMES_PER_DIR, (d + 1) * FRAMES_PER_DIR)
        }

        // Cut run/walk frames (next 24 frames)
        const runAll = cutSheet(sheet, 24, 24)
        const walk: Record<number, HTMLCanvasElement[]> = {}
        for (let d = 0; d < 4; d++) {
          walk[SHEET_DIR_ORDER[d]] = runAll.slice(d * FRAMES_PER_DIR, (d + 1) * FRAMES_PER_DIR)
        }

        // Load sit sprites (scale from source to render size)
        const sit: Record<number, HTMLCanvasElement> = {}
        for (const { dir, name } of dirNames) {
          const sitImg = await loadImage(`${basePath}/characters/sit/${skinName}_sit_${name}.png`)
          const canvas = document.createElement('canvas')
          canvas.width = PNG_CHAR_W
          canvas.height = PNG_CHAR_H
          const ctx = canvas.getContext('2d')!
          ctx.imageSmoothingEnabled = false
          ctx.drawImage(sitImg, 0, 0, PNG_SRC_W, PNG_SRC_H, 0, 0, PNG_CHAR_W, PNG_CHAR_H)
          sit[dir] = canvas
        }

        loadedSkins.set(skinName, { walk, sit, idle })
      } catch (err) {
        console.warn(`[pngSprites] Failed to load skin "${skinName}":`, err)
      }
    }

    console.log(`[pngSprites] Loaded ${loadedSkins.size} character skins`)
  })()

  return loadPromise
}

/** Get a skin name for an agent index (round-robin across 4 skins) */
export function getSkinForAgent(agentIndex: number): SkinName {
  return SKIN_NAMES[agentIndex % SKIN_NAMES.length]
}

/** Get the number of available skins */
export function getSkinCount(): number {
  return SKIN_NAMES.length
}

/** Check if PNG sprites are loaded */
export function hasPngSprites(): boolean {
  return loadedSkins.size > 0
}

/** Zoom cache for PNG sprite frames */
const pngZoomCache = new Map<number, WeakMap<HTMLCanvasElement, HTMLCanvasElement>>()

/** Get a zoom-scaled version of a PNG frame canvas */
export function getZoomedPngFrame(frame: HTMLCanvasElement, zoom: number): HTMLCanvasElement {
  if (zoom === 1) return frame

  let cache = pngZoomCache.get(zoom)
  if (!cache) {
    cache = new WeakMap()
    pngZoomCache.set(zoom, cache)
  }

  const cached = cache.get(frame)
  if (cached) return cached

  const canvas = document.createElement('canvas')
  canvas.width = frame.width * zoom
  canvas.height = frame.height * zoom
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
  cache.set(frame, canvas)
  return canvas
}

/** Get the appropriate PNG frame for a character's current state */
export function getPngCharacterFrame(
  skinName: SkinName,
  state: CharacterState,
  dir: Direction,
  frame: number,
): HTMLCanvasElement | null {
  const skin = loadedSkins.get(skinName)
  if (!skin) return null

  switch (state) {
    case CharacterState.TYPE:
      return skin.sit[dir] ?? null

    case CharacterState.WALK: {
      const walkFrames = skin.walk[dir]
      if (!walkFrames || walkFrames.length === 0) return null
      return walkFrames[frame % walkFrames.length]
    }

    case CharacterState.IDLE: {
      const idleFrames = skin.idle[dir]
      if (!idleFrames || idleFrames.length === 0) return null
      return idleFrames[frame % idleFrames.length]
    }

    default:
      return null
  }
}

/** Generate a white outline canvas for a PNG frame (for selection highlight) */
const outlineCanvasCache = new WeakMap<HTMLCanvasElement, HTMLCanvasElement>()

export function getPngOutline(frame: HTMLCanvasElement): HTMLCanvasElement {
  const cached = outlineCanvasCache.get(frame)
  if (cached) return cached

  const w = frame.width + 2
  const h = frame.height + 2
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false

  // Draw the frame at offset (1,1)
  ctx.drawImage(frame, 1, 1)

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data

  // Create outline: for each opaque pixel, mark cardinal neighbors
  const outline = new Uint8Array(w * h) // 1 = outline pixel
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (data[idx + 3] > 0) { // opaque pixel
        // Mark neighbors
        if (x > 0 && data[(y * w + x - 1) * 4 + 3] === 0) outline[y * w + x - 1] = 1
        if (x < w - 1 && data[(y * w + x + 1) * 4 + 3] === 0) outline[y * w + x + 1] = 1
        if (y > 0 && data[((y - 1) * w + x) * 4 + 3] === 0) outline[(y - 1) * w + x] = 1
        if (y < h - 1 && data[((y + 1) * w + x) * 4 + 3] === 0) outline[(y + 1) * w + x] = 1
      }
    }
  }

  // Clear canvas and draw outline
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#FFFFFF'
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (outline[y * w + x]) {
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  outlineCanvasCache.set(frame, canvas)
  return canvas
}
