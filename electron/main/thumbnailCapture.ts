import { desktopCapturer, NativeImage } from "electron";

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  scaleFactor?: number;
  quality?: number;
}

export interface WindowThumbnail {
  windowId: string;
  dataUrl: string;
  timestamp: number;
}

/**
 * Capture thumbnail for a specific window using desktopCapturer
 */
export async function captureWindowThumbnail(
  windowId: string,
  options: ThumbnailOptions = {}
): Promise<WindowThumbnail | null> {
  try {
    const {
      width = 1200,
      height = 900,
      scaleFactor = 2.0,
      quality = 95,
    } = options;

    console.log(`Capturing thumbnail for window: ${windowId}`);

    // Get all available window sources with high resolution and full content
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: {
        width: Math.min(width * scaleFactor, 3840), // Cap at 4K width
        height: Math.min(height * scaleFactor, 2160), // Cap at 4K height
      },
      fetchWindowIcons: false,
    });

    console.log(`Available sources: ${sources.length}`);

    let targetSource = null;

    // If windowId is in our new format (window-0, window-1, etc.)
    if (windowId.startsWith("window-")) {
      const index = parseInt(windowId.split("-")[1]);
      if (index >= 0 && index < sources.length) {
        targetSource = sources[index];
        console.log(`Using window at index ${index}: "${targetSource.name}"`);
      }
    }
    // For any other format, just use the first available window as a fallback
    else {
      targetSource = sources.find(
        (source) => source.thumbnail && !source.thumbnail.isEmpty()
      );
      if (targetSource) {
        console.log(`Using first available window: "${targetSource.name}"`);
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

    const dataUrl = targetSource.thumbnail.toDataURL({
      scaleFactor: scaleFactor,
    });

    console.log(`Successfully captured thumbnail for: "${targetSource.name}"`);

    return {
      windowId,
      dataUrl,
      timestamp: Date.now(),
    };
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
