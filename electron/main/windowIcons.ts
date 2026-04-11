import { nativeImage, type NativeImage } from "electron";

/**
 * Best-effort native icon resolver for external windows.
 * Returns null when a direct icon lookup is unavailable.
 */
export async function getNativeWindowIcon(
  _windowHandle: number,
): Promise<NativeImage | null> {
  return null;
}
