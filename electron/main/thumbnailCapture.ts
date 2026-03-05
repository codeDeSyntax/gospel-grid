import { desktopCapturer, NativeImage } from "electron";
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

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedThumbnail = thumbnailCache.get(
        windowId,
        windowTitle,
        options,
      );

      if (cachedThumbnail) {
        // console.log(`Using cached thumbnail for: "${windowTitle}"`);
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
    };

    // Cache the thumbnail
    thumbnailCache.set(windowId, windowTitle, thumbnail, options);

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
 */
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

  // ── Single getSources() call for ALL requested windows ──────────────
  const sources = await desktopCapturer.getSources({
    types: ["window"],
    thumbnailSize: {
      width: Math.min(Math.floor(validWidth * validScaleFactor), 3840),
      height: Math.min(Math.floor(validHeight * validScaleFactor), 2160),
    },
    fetchWindowIcons: true,
  });

  // Build a lookup map for O(1) access
  const sourceMap = new Map(sources.map((s) => [s.id, s]));

  // ── Extract thumbnails from the single snapshot ─────────────────────
  const results: (WindowThumbnail | null)[] = windowIds.map((windowId) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const src = sourceMap.get(windowId);
      const cached = thumbnailCache.get(windowId, src?.name ?? "", options);
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
    };

    // Cache it
    thumbnailCache.set(windowId, source.name, thumbnail, options);
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
