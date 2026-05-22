import { desktopCapturer } from "electron";
import { getNativeWindowIcon } from "./windowIcons";

/**
 * PERFORMANCE OPTIMIZATION:
 * Window enumeration now separates listing windows from capturing thumbnails.
 * This prevents system drain when enumerating all windows.
 *
 * Strategy:
 * 1. List all windows WITHOUT thumbnails (captureThumbnails=false by default)
 * 2. Capture thumbnails on-demand only for selected/published windows
 * 3. Use batch capture for published layouts via LiveWindowGrid
 */

/**
 * Get a mapping of desktop capturer sources to process information
 * @param captureThumbnails - Whether to capture thumbnails (default: false for performance)
 */
export async function getWindowSourceMapping(
  captureThumbnails: boolean = false,
) {
  try {
    // Get all window sources from desktopCapturer
    // Only capture thumbnails if explicitly requested to save system resources
    const sources = await desktopCapturer.getSources({
      types: ["window"],
      thumbnailSize: captureThumbnails
        ? { width: 1280, height: 720 }
        : { width: 1, height: 1 }, // Minimal size when not capturing
      fetchWindowIcons: true, // Enable fetching window icons!
    });

    // console.log(`Found ${sources.length} window sources from desktopCapturer`);

    // Log detailed information about what desktopCapturer provides
    console.log("=== DESKTOP CAPTURER SOURCES DETAILS ===");
    sources.forEach((source, index) => {
      // Extract window handle from ID format: window:XX:YY
      const handleMatch = source.id.match(/window:(\d+):/);
      const windowHandle = handleMatch ? parseInt(handleMatch[1]) : null;

      console.log(`📱 Source ${index + 1}:`);
      console.log(`   ID: ${source.id}`);
      console.log(`   Extracted Handle: ${windowHandle || "N/A"}`);
      console.log(`   Name: ${source.name}`);
      console.log(`   Display ID: ${source.display_id || "undefined"}`);
      console.log(`   Has App Icon: ${source.appIcon ? "YES" : "NO"}`);
      console.log(
        `   App Icon Size: ${
          source.appIcon
            ? `${source.appIcon.getSize().width}x${
                source.appIcon.getSize().height
              }`
            : "N/A"
        }`,
      );
      console.log(
        `   Thumbnail size: ${source.thumbnail?.getSize().width}x${
          source.thumbnail?.getSize().height
        }`,
      );
      console.log(`   All properties:`, Object.keys(source));
      console.log(`   ---`);
    });
    console.log("=== END DESKTOP CAPTURER DETAILS ===");

    return Promise.all(
      sources.map(async (source, index) => {
        // Extract window handle from ID format: window:XX:YY
        const handleMatch = source.id.match(/window:(\d+):/);
        const windowHandle = handleMatch ? parseInt(handleMatch[1]) : null;
        const nativeIcon =
          source.appIcon ||
          (windowHandle ? await getNativeWindowIcon(windowHandle) : null);

        return {
          sourceId: source.id, // Native desktopCapturer ID (e.g., "window:853982:0")
          title: source.name,
          index: index,
          windowHandle: windowHandle, // Add the actual window handle!
          hasIcon: !!nativeIcon, // Whether app icon is available
          // Use the native source ID as the primary identifier instead of index
          mappingId: source.id, // Use Electron's native ID for true uniqueness
          thumbnail: captureThumbnails ? source.thumbnail : null, // Only include thumbnail if requested
          appIcon: nativeIcon, // Include the app icon
        };
      }),
    );
  } catch (error) {
    console.error("Failed to get window source mapping:", error);
    return [];
  }
}

/**
 * Get windows in a format that matches what our UI expects
 * but uses actual desktopCapturer source IDs
 * @param captureThumbnails - Whether to capture thumbnails (default: false for performance)
 */
export async function getWindowsWithThumbnails(
  captureThumbnails: boolean = false,
) {
  try {
    const sources = await getWindowSourceMapping(captureThumbnails);

    return sources.map((source) => ({
      id: source.sourceId, // Use Electron's native source ID for true uniqueness
      name: source.title, // UI expects 'name' property
      app: extractProcessName(source.title), // UI expects 'app' property
      handle: source.windowHandle, // Add the actual window handle
      x: 0, // Desktop capturer doesn't provide position
      y: 0,
      width: 800, // Default size
      height: 600,
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      sourceId: source.sourceId, // Keep the original source ID for thumbnail capture
      icon: source.appIcon ? source.appIcon.toDataURL() : null, // Convert app icon to base64 data URL
      hasNativeIcon: source.hasIcon, // Flag to indicate if native icon is available
      thumbnail: source.thumbnail ? source.thumbnail.toDataURL() : null,
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
