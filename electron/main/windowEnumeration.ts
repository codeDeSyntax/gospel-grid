import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// NOTE: Window enumeration is now handled by windowMapper.ts using desktopCapturer
// This file only contains window control functions (focus, minimize, move, etc.)

/**
 * Focus a window by its handle
 */
export async function focusWindow(handle: number): Promise<boolean> {
  try {
    const script = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        
        public class WindowFocuser {
            [DllImport("user32.dll")]
            public static extern bool SetForegroundWindow(IntPtr hWnd);
            
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            
            public static bool FocusWindow(IntPtr handle) {
                ShowWindow(handle, 9); // SW_RESTORE
                return SetForegroundWindow(handle);
            }
        }
"@
      
      [WindowFocuser]::FocusWindow([IntPtr]${handle})
    `;

    const { stdout } = await execAsync(`powershell -Command "${script}"`);
    return stdout.trim() === "True";
  } catch (error) {
    console.error("Error focusing window:", error);
    return false;
  }
}

/**
 * Minimize a window by its handle
 */
export async function minimizeWindow(handle: number): Promise<boolean> {
  try {
    const script = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        
        public class WindowMinimizer {
            [DllImport("user32.dll")]
            public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            
            public static bool MinimizeWindow(IntPtr handle) {
                return ShowWindow(handle, 6); // SW_MINIMIZE
            }
        }
"@
      
      [WindowMinimizer]::MinimizeWindow([IntPtr]${handle})
    `;

    const { stdout } = await execAsync(`powershell -Command "${script}"`);
    return stdout.trim() === "True";
  } catch (error) {
    console.error("Error minimizing window:", error);
    return false;
  }
}

/**
 * Get window icon as base64 string
 */
export async function getWindowIcon(handle: number): Promise<string | null> {
  try {
    // This is a simplified implementation
    // In a real app, you'd extract the actual icon from the executable
    return null;
  } catch (error) {
    console.error("Error getting window icon:", error);
    return null;
  }
}

/**
 * Move and resize a window
 */
export async function moveWindow(
  handle: number,
  bounds: { x: number; y: number; width: number; height: number }
): Promise<boolean> {
  try {
    const script = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        
        public class WindowMover {
            [DllImport("user32.dll")]
            public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
            
            public static bool MoveWindowTo(IntPtr handle, int x, int y, int width, int height) {
                return MoveWindow(handle, x, y, width, height, true);
            }
        }
"@
      
      [WindowMover]::MoveWindowTo([IntPtr]${handle}, ${bounds.x}, ${bounds.y}, ${bounds.width}, ${bounds.height})
    `;

    const { stdout } = await execAsync(`powershell -Command "${script}"`);
    return stdout.trim() === "True";
  } catch (error) {
    console.error("Error moving window:", error);
    return false;
  }
}
