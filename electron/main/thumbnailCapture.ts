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
  options: ThumbnailOptions = {}
): Promise<WindowThumbnail | null> {
  try {
    const {
      width = 300,
      height = 200,
      scaleFactor = 1.0,
      quality = 85,
      forceRefresh = false,
    } = options;

    console.log(`Capturing thumbnail for window: ${windowId}`);

    // Get all available window sources with optimized resolution
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: {
        width: Math.min(width * scaleFactor, 1920), // Cap at 1920 for performance
        height: Math.min(height * scaleFactor, 1080), // Cap at 1080 for performance
      },
      fetchWindowIcons: false,
    });

    console.log(`Available sources: ${sources.length}`);

    let targetSource = null;
    let windowTitle = "";

    // If windowId is in our new format (window-0, window-1, etc.)
    if (windowId.startsWith("window-")) {
      const index = parseInt(windowId.split("-")[1]);
      if (index >= 0 && index < sources.length) {
        targetSource = sources[index];
        windowTitle = targetSource.name;
        console.log(`Using window at index ${index}: "${windowTitle}"`);
      }
    }
    // For any other format, just use the first available window as a fallback
    else {
      targetSource = sources.find(
        (source) => source.thumbnail && !source.thumbnail.isEmpty()
      );
      if (targetSource) {
        windowTitle = targetSource.name;
        console.log(`Using first available window: "${windowTitle}"`);
      }
    }

    if (!targetSource) {
      console.warn(`No window source found for ID: ${windowId}`);
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
        options
      );

      if (cachedThumbnail) {
        console.log(`Using cached thumbnail for: "${windowTitle}"`);
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

    console.log(`Successfully captured thumbnail for: "${windowTitle}"`);
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
  options: ThumbnailOptions = {}
): Promise<WindowThumbnail[]> {
  try {
    console.log(
      `Capturing thumbnails for ${windowIds.length} windows:`,
      windowIds
    );

    // Use the single window capture function for each window
    // This ensures consistent matching logic
    const thumbnailPromises = windowIds.map((windowId) =>
      captureWindowThumbnail(windowId, options)
    );

    const results = await Promise.allSettled(thumbnailPromises);
    const thumbnails: WindowThumbnail[] = [];

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value) {
        thumbnails.push(result.value);
      } else {
        console.warn(
          `Failed to capture thumbnail for window ${windowIds[index]}:`,
          result.status === "rejected" ? result.reason : "No thumbnail returned"
        );
      }
    });

    console.log(
      `Successfully captured ${thumbnails.length} out of ${windowIds.length} thumbnails`
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
  options: ThumbnailOptions = {}
): Promise<
  Array<{ source: Electron.DesktopCapturerSource; thumbnail: WindowThumbnail }>
> {
  try {
    const { width = 300, height = 200 } = options;

    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: { width, height },
      fetchWindowIcons: false,
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
  windowId: string
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
 * Batch capture thumbnails with throttling to prevent system overload
 */
export async function batchCaptureThumbnails(
  windowIds: string[],
  options: ThumbnailOptions = {},
  maxConcurrent = 3,
  delayMs = 100
): Promise<(WindowThumbnail | null)[]> {
  const results: (WindowThumbnail | null)[] = [];

  for (let i = 0; i < windowIds.length; i += maxConcurrent) {
    const batch = windowIds.slice(i, i + maxConcurrent);

    const batchPromises = batch.map(async (windowId, index) => {
      // Add slight delay to prevent overwhelming the system
      if (index > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * index));
      }
      return captureWindowThumbnail(windowId, options);
    });

    const batchResults = await Promise.allSettled(batchPromises);
    const batchThumbnails = batchResults.map((result) =>
      result.status === "fulfilled" ? result.value : null
    );

    results.push(...batchThumbnails);

    // Small delay between batches
    if (i + maxConcurrent < windowIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

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
