import { desktopCapturer } from "electron";

/**
 * Get a mapping of desktop capturer sources to process information
 */
export async function getWindowSourceMapping() {
  try {
    // Get all window sources from desktopCapturer
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: { width: 300, height: 200 },
      fetchWindowIcons: false,
    });

    console.log(`Found ${sources.length} window sources from desktopCapturer`);

    return sources.map((source, index) => ({
      sourceId: source.id,
      title: source.name,
      index: index,
      // Create a simple mapping ID
      mappingId: `window-${index}`,
      thumbnail: source.thumbnail,
    }));
  } catch (error) {
    console.error("Failed to get window source mapping:", error);
    return [];
  }
}

/**
 * Get windows in a format that matches what our UI expects
 * but uses actual desktopCapturer source IDs
 */
export async function getWindowsWithThumbnails() {
  try {
    const sources = await getWindowSourceMapping();

    return sources.map((source) => ({
      id: source.mappingId, // Use our mapping ID instead of process ID
      name: source.title, // UI expects 'name' property
      app: extractProcessName(source.title), // UI expects 'app' property
      x: 0, // Desktop capturer doesn't provide position
      y: 0,
      width: 800, // Default size
      height: 600,
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      sourceId: source.sourceId, // Keep the original source ID for thumbnail capture
    }));
  } catch (error) {
    console.error("Failed to get windows with thumbnails:", error);
    return [];
  }
}

/**
 * Extract a process name from a window title
 */
function extractProcessName(title: string): string {
  // Simple heuristics to extract app name from window title
  if (title.includes("Visual Studio Code")) return "Code";
  if (title.includes("Google Chrome")) return "Chrome";
  if (title.includes("File Explorer")) return "Explorer";
  if (title.includes("Notepad")) return "Notepad";
  if (title.includes("Word")) return "Word";
  if (title.includes("Adobe Acrobat")) return "Acrobat";
  if (title.includes("Media Player")) return "Media Player";

  // If no match, take the first part before " - " or return first word
  const parts = title.split(" - ");
  if (parts.length > 1) {
    return parts[parts.length - 1]; // Usually the app name is at the end
  }

  return title.split(" ")[0] || title;
}
