import { desktopCapturer, DesktopCapturerSource } from "electron";

export interface VideoStreamOptions {
  width?: number;
  height?: number;
  frameRate?: number;
}

export interface VideoStreamInfo {
  windowId: string;
  sourceId: string;
  name: string;
  streamUrl: string; // Will be a MediaStream sourceId that can be used by renderer
}

/**
 * Get video stream source for a window
 * This returns source information that the renderer process can use to create a MediaStream
 */
export async function getWindowVideoSource(
  windowId: string,
  options: VideoStreamOptions = {}
): Promise<DesktopCapturerSource | null> {
  try {
    const { width = 1920, height = 1080 } = options;

    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: {
        width: width,
        height: height,
      },
    });

    const targetSource = sources.find((source) => source.id === windowId);

    if (!targetSource) {
      console.warn(`No video source found for window ID: ${windowId}`);
      return null;
    }

    return targetSource;
  } catch (error) {
    console.error("Failed to get window video source:", error);
    return null;
  }
}

/**
 * Get video sources for multiple windows
 */
export async function getWindowVideoSources(
  windowIds: string[],
  options: VideoStreamOptions = {}
): Promise<DesktopCapturerSource[]> {
  try {
    const { width = 1920, height = 1080 } = options;

    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: {
        width: width,
        height: height,
      },
    });

    return windowIds
      .map((id) => sources.find((source) => source.id === id))
      .filter(
        (source): source is DesktopCapturerSource => source !== undefined
      );
  } catch (error) {
    console.error("Failed to get window video sources:", error);
    return [];
  }
}
