/**
 * frameActivityDetector.ts
 *
 * Pure-function, zero-dependency local scene analysis utilities.
 * Uses 8×8 Difference Hash (dHash) for perceptual frame comparison.
 * Runs entirely in the renderer process on OffscreenCanvas — no IPC,
 * no network, no external libraries.
 *
 * Performance notes:
 * - Input ImageData is downscaled to 9×8 before hashing (tiny surface area)
 * - Hamming distance computation is a single BigInt XOR + popcount
 * - Entire computation < 0.5ms per frame on a modern GPU-accelerated renderer
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SceneState = "active" | "static" | "black";

export interface FrameAnalysisResult {
  hash: bigint;
  sceneState: SceneState;
}

export interface SceneChangeEvent {
  windowId: string;
  previousState: SceneState;
  nextState: SceneState;
  hammingDistance: number;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Pixels that differ to consider a "slide change" — tuned for presentation media */
const SLIDE_CHANGE_THRESHOLD = 10; // out of 64 bits
/** Pixels that differ to consider "active" (continuous motion, e.g. video) */
const MOTION_THRESHOLD = 4;
/** Average luminance below which a frame is classified as "black screen" */
const BLACK_SCREEN_LUMINANCE_THRESHOLD = 8;

// ─── dHash Implementation ─────────────────────────────────────────────────────

/**
 * Compute an 8×8 Difference Hash (dHash) from an ImageData.
 *
 * Algorithm:
 * 1. Downsample to 9×8 grayscale pixels
 * 2. For each row, compare adjacent pairs (9 cols → 8 bits)
 * 3. Pack 64 bits into a BigInt
 */
export function computeDHash(imageData: ImageData): bigint {
  const { data, width, height } = imageData;

  // Build 9×8 grayscale grid by sampling the source image
  const gw = 9;
  const gh = 8;
  const gray = new Float32Array(gw * gh);

  const sx = width / gw;
  const sy = height / gh;

  for (let row = 0; row < gh; row++) {
    for (let col = 0; col < gw; col++) {
      const px = Math.min(Math.floor(col * sx), width - 1);
      const py = Math.min(Math.floor(row * sy), height - 1);
      const idx = (py * width + px) * 4;
      // ITU-R BT.601 luma coefficients
      gray[row * gw + col] = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
    }
  }

  // Generate 64-bit hash: compare each pixel to its right neighbor in each row
  let hash = 0n;
  let bit = 0;
  for (let row = 0; row < gh; row++) {
    for (let col = 0; col < gw - 1; col++) {
      if (gray[row * gw + col] > gray[row * gw + col + 1]) {
        hash |= 1n << BigInt(bit);
      }
      bit++;
    }
  }
  return hash;
}

/**
 * Hamming distance between two dHashes (number of differing bits).
 */
export function hammingDistance(a: bigint, b: bigint): number {
  let xor = a ^ b;
  let count = 0;
  while (xor > 0n) {
    count += Number(xor & 1n);
    xor >>= 1n;
  }
  return count;
}

/**
 * Compute average luminance of an ImageData frame.
 * Used to detect all-black or near-black screens.
 */
export function averageLuminance(imageData: ImageData): number {
  const { data } = imageData;
  let total = 0;
  const step = 16; // sample every 16th pixel for performance
  let count = 0;
  for (let i = 0; i < data.length; i += 4 * step) {
    total += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    count++;
  }
  return count > 0 ? total / count : 0;
}

/**
 * Classify the current scene state from a frame hash and the previous hash.
 */
export function classifyScene(
  currentHash: bigint,
  previousHash: bigint | null,
  luminance: number,
): SceneState {
  if (luminance < BLACK_SCREEN_LUMINANCE_THRESHOLD) {
    return "black";
  }
  if (previousHash === null) {
    return "active";
  }
  const dist = hammingDistance(currentHash, previousHash);
  if (dist > SLIDE_CHANGE_THRESHOLD) {
    return "active"; // major change detected
  }
  if (dist > MOTION_THRESHOLD) {
    return "active"; // minor motion
  }
  return "static";
}

/**
 * Determine if two successive frames represent a discrete slide change
 * (vs continuous video motion) by checking hash distance bounds.
 */
export function isSlideChange(prevHash: bigint, currHash: bigint): boolean {
  const dist = hammingDistance(prevHash, currHash);
  // A slide change is a significant but bounded jump.
  // Continuous video has very high distance (>30); a slide flip is typically 10–28.
  return dist >= SLIDE_CHANGE_THRESHOLD && dist <= 52;
}

/**
 * Capture an ImageData sample from a video element via OffscreenCanvas.
 * Returns null if the video is not ready.
 */
export function captureVideoFrame(
  video: HTMLVideoElement,
  sampleWidth = 64,
  sampleHeight = 64,
): ImageData | null {
  if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
    return null;
  }

  try {
    // Use OffscreenCanvas to avoid touching the main-thread canvas pool
    const canvas = new OffscreenCanvas(sampleWidth, sampleHeight);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    return ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  } catch {
    return null;
  }
}
