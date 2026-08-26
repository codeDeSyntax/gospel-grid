import { desktopCapturer, NativeImage, type DesktopCapturerSource } from "electron";
import { createHash } from "node:crypto";
import { thumbnailCache } from "./thumbnailCache";

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  scaleFactor?: number;
  quality?: number;
  forceRefresh?: boolean;
}

export interface WindowThumbnail {
  windowId: string;
  dataUrl: string;
  timestamp: number;
  title?: string;
}

/**
 * Capture thumbnail for a specific window using desktopCapturer with caching
 */
export async function captureWindowThumbnail(
  windowId: string,
  options: ThumbnailOptions = {},
): Promise<WindowThumbnail | null> {
  try {
    // console.log(`Capturing thumbnail for window: ${windowId}`, { options });

    const {
      width = 300,
      height = 200,
      scaleFactor = 1.0,
      quality = 85,
      forceRefresh = false,
    } = options;

    // Validate and sanitize dimensions
    const validWidth = Math.max(Math.floor(Number(width) || 300), 50);
    const validHeight = Math.max(Math.floor(Number(height) || 200), 50);
    const validScaleFactor = Math.max(
      Math.min(Number(scaleFactor) || 1.0, 3.0),
      0.1,
    );

    // console.log(
    //   `Validated dimensions: ${validWidth}x${validHeight}, scale: ${validScaleFactor}`
    // );

    // Get all available window sources with optimized resolution
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: {
        width: Math.min(Math.floor(validWidth * validScaleFactor), 3840), // Cap at 4K for high-quality captures
        height: Math.min(Math.floor(validHeight * validScaleFactor), 2160), // Cap at 4K for high-quality captures
      },
      fetchWindowIcons: true, // Enable fetching window icons for consistent icon availability
    });

    // console.log(`Available sources: ${sources.length}`);

    let targetSource = null;
    let windowTitle = "";

    // Find the window source by matching the native source ID directly
    targetSource = sources.find((source) => source.id === windowId);

    if (targetSource) {
      windowTitle = targetSource.name;
      // console.log(`Found window source for ID ${windowId}: "${windowTitle}"`);
    } else {
      // Fallback: if no exact match, log available sources for debugging
      console.warn(`No window source found for ID: ${windowId}`);
      console.warn(
        `Available source IDs:`,
        sources.map((s) => s.id).slice(0, 5),
      ); // Show first 5 for debugging
      return null;
    }

    if (!targetSource.thumbnail || targetSource.thumbnail.isEmpty()) {
      console.warn(`No thumbnail available for window: ${windowId}`);
      return null;
    }

    // Check cache first (unless force refresh). If we have a thumbnail
    // available from the source, compute a light hash and use that to
    // validate cache freshness so we don't return stale images when window
    // content has changed.
    let imageHash: string | undefined;
    if (
      !forceRefresh &&
      targetSource &&
      targetSource.thumbnail &&
      !targetSource.thumbnail.isEmpty()
    ) {
      try {
        const png = targetSource.thumbnail.toPNG();
        imageHash = createHash("sha1").update(png).digest("hex");
      } catch (err) {
        // hashing failed, fall back to cache without hash
        imageHash = undefined;
      }
    }

    if (!forceRefresh) {
      const cachedThumbnail = thumbnailCache.get(
        windowId,
        windowTitle,
        options,
        undefined,
        imageHash,
      );

      if (cachedThumbnail) {
        return cachedThumbnail;
      }
    }

    const dataUrl = targetSource.thumbnail.toDataURL({
      scaleFactor: scaleFactor,
    });

    const thumbnail: WindowThumbnail = {
      windowId,
      dataUrl,
      timestamp: Date.now(),
      title: windowTitle,
    };

    // Cache the thumbnail using the computed image hash if available
    thumbnailCache.set(
      windowId,
      windowTitle,
      thumbnail,
      options,
      undefined,
      imageHash,
    );

    // console.log(`Successfully captured thumbnail for: "${windowTitle}"`);
    return thumbnail;
  } catch (error) {
    console.error(`Failed to capture thumbnail for window ${windowId}:`, error);
    return null;
  }
}

/**
 * Capture thumbnails for multiple windows at once
 */
export async function captureMultipleWindowThumbnails(
  windowIds: string[],
  options: ThumbnailOptions = {},
): Promise<WindowThumbnail[]> {
  try {
    console.log(
      `Capturing thumbnails for ${windowIds.length} windows:`,
      windowIds,
    );

    // Use the single window capture function for each window
    // This ensures consistent matching logic
    const thumbnailPromises = windowIds.map((windowId) =>
      captureWindowThumbnail(windowId, options),
    );

    const results = await Promise.allSettled(thumbnailPromises);
    const thumbnails: WindowThumbnail[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        thumbnails.push(result.value);
      } else {
        console.warn(
          `Failed to capture thumbnail for window ${windowIds[index]}:`,
          result.status === "rejected"
            ? result.reason
            : "No thumbnail returned",
        );
      }
    });

    console.log(
      `Successfully captured ${thumbnails.length} out of ${windowIds.length} thumbnails`,
    );
    return thumbnails;
  } catch (error) {
    console.error("Failed to capture multiple window thumbnails:", error);
    return [];
  }
}

/**
 * Get all available window sources with thumbnails
 */
export async function getAllWindowThumbnails(
  options: ThumbnailOptions = {},
): Promise<
  Array<{ source: Electron.DesktopCapturerSource; thumbnail: WindowThumbnail }>
> {
  try {
    const { width = 300, height = 200 } = options;

    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: { width, height },
      fetchWindowIcons: true, // Enable fetching window icons for consistent icon availability
    });

    const results = [];

    for (const source of sources) {
      if (source.thumbnail && !source.thumbnail.isEmpty()) {
        const dataUrl = source.thumbnail.toDataURL({
          scaleFactor: 1.0,
        });

        results.push({
          source,
          thumbnail: {
            windowId: source.id,
            dataUrl,
            timestamp: Date.now(),
          },
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Failed to get all window thumbnails:", error);
    return [];
  }
}

/**
 * Capture high-quality thumbnail for published layouts
 */
export async function captureHighQualityThumbnail(
  windowId: string,
): Promise<WindowThumbnail | null> {
  return captureWindowThumbnail(windowId, {
    width: 1200,
    height: 900,
    scaleFactor: 2.0,
    quality: 95,
    forceRefresh: true, // Always fresh for published layouts
  });
}

/**
 * Batch capture thumbnails using a SINGLE desktopCapturer.getSources() call.
 *
 * The old implementation called captureWindowThumbnail() per window, each of
 * which triggered its own getSources() — creating N separate WGC capture
 * sessions. This caused massive contention with any live getUserMedia streams,
 * flooding the console with "ProcessFrame failed" errors.
 *
 * This version does ONE getSources() call and extracts all needed thumbnails
 * from the result set in-memory. One WGC session batch instead of N.
 *
 * REQUEST COALESCING: If a getSources() call is already in-flight, all
 * concurrent callers share the same promise instead of spawning duplicate
 * WGC sessions. This is critical during projection startup where multiple
 * effects may fire simultaneously.
 */

// ── In-flight coalescing state ────────────────────────────────────────────────
let _batchSourcesInFlight: Promise<DesktopCapturerSource[]> | null = null;
let _batchSourcesKey = "";

export async function batchCaptureThumbnails(
  windowIds: string[],
  options: ThumbnailOptions = {},
  _maxConcurrent = 3,
  _delayMs = 100,
): Promise<(WindowThumbnail | null)[]> {
  if (windowIds.length === 0) return [];

  const {
    width = 300,
    height = 200,
    scaleFactor = 1.0,
    quality = 85,
    forceRefresh = false,
  } = options;

  const validWidth = Math.max(Math.floor(Number(width) || 300), 50);
  const validHeight = Math.max(Math.floor(Number(height) || 200), 50);
  const validScaleFactor = Math.max(
    Math.min(Number(scaleFactor) || 1.0, 3.0),
    0.1,
  );

  // ── Cap resolution for batch mode ───────────────────────────────────────
  // Slide-change detection only needs modest resolution. Capping at 640×360
  // drastically reduces GPU readback time vs. full 1920×1080 per window.
  const captureWidth = Math.min(Math.floor(validWidth * validScaleFactor), 640);
  const captureHeight = Math.min(Math.floor(validHeight * validScaleFactor), 360);

  // ── Request coalescing ────────────────────────────────────────────────────
  // If a getSources() call is already running for the same resolution,
  // share its promise instead of spawning a second concurrent WGC session.
  const coalescingKey = `${captureWidth}x${captureHeight}`;

  if (!_batchSourcesInFlight || _batchSourcesKey !== coalescingKey) {
    _batchSourcesKey = coalescingKey;
    _batchSourcesInFlight = desktopCapturer
      .getSources({
        types: ["window"],
        thumbnailSize: { width: captureWidth, height: captureHeight },
        // fetchWindowIcons intentionally omitted — icons are already captured
        // during window enumeration and don't need to be re-fetched on every
        // thumbnail batch. Omitting this saves a GPU readback per window.
        fetchWindowIcons: false,
      })
      .finally(() => {
        // Release so the next call gets a fresh snapshot
        _batchSourcesInFlight = null;
      });
  }

  // Hold a local reference so TypeScript knows it's non-null and we're
  // immune to the module-level variable being cleared by the .finally() of
  // a concurrent call that finishes before our await resolves.
  const pendingSources = _batchSourcesInFlight!;

  // ── Single getSources() call for ALL requested windows ──────────────
  const sources = await pendingSources;


  // Build a lookup map for O(1) access
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // ── Extract thumbnails from the single snapshot ─────────────────────
  const results: (WindowThumbnail | null)[] = windowIds.map((windowId) => {
    // Check cache first (unless force refresh). If a source exists for this
    // window, compute a quick image hash and use it to validate the cache.
    const src = sourceMap.get(windowId);
    let imageHash: string | undefined;
    if (src && src.thumbnail && !src.thumbnail.isEmpty()) {
      try {
        const png = src.thumbnail.toPNG();
        imageHash = createHash("sha1").update(png).digest("hex");
      } catch (err) {
        imageHash = undefined;
      }
    }

    if (!forceRefresh) {
      const cached = thumbnailCache.get(
        windowId,
        src?.name ?? "",
        options,
        undefined,
        imageHash,
      );
      if (cached) return cached;
    }

    const source = sourceMap.get(windowId);
    if (!source || !source.thumbnail || source.thumbnail.isEmpty()) {
      return null;
    }

    const dataUrl = source.thumbnail.toDataURL({ scaleFactor });
    const thumbnail: WindowThumbnail = {
      windowId,
      dataUrl,
      timestamp: Date.now(),
      title: source.name,
    };

    // Cache it (include image hash if we computed one)
    thumbnailCache.set(
      windowId,
      source.name,
      thumbnail,
      options,
      undefined,
      imageHash,
    );
    return thumbnail;
  });

  return results;
}

/**
 * Clear thumbnail cache - useful for memory management
 */
export function clearThumbnailCache(): void {
  thumbnailCache.clear();
}

/**
 * Get cache statistics for monitoring
 */
export function getThumbnailCacheStats() {
  return {
    ...thumbnailCache.getStats(),
    size: thumbnailCache.getSize(),
  };
}
