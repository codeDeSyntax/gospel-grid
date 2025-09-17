import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { BrowserWindow } from "electron";

const execAsync = promisify(exec);

// Try to import ffi-napi for direct Win32 API calls
let ffi: any = null;
let ref: any = null;
try {
  ffi = require("ffi-napi");
  ref = require("ref-napi");
  console.log("✅ FFI-NAPI loaded successfully");
} catch (error: any) {
  console.log("⚠️ FFI-NAPI not available:", error?.message || error);
}

export interface WindowInfo {
  id: string;
  name: string;
  app: string;
  handle: number;
  processId: number;
  executablePath?: string;
  className?: string;
  isVisible: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  icon?: string;
  parentHandle?: number;
  hasChildren?: boolean;
  zOrder?: number;
}

export interface EnumerateWindowsOptions {
  includeMinimized?: boolean;
  includeSystemWindows?: boolean;
}

// Method 1: BrowserWindow.getAllWindows() - Only detects Electron windows
async function enumerateElectronWindows(): Promise<WindowInfo[]> {
  console.log("Enumerating Electron windows...");

  const electronWindows: WindowInfo[] = [];
  const allWindows = BrowserWindow.getAllWindows();

  for (let i = 0; i < allWindows.length; i++) {
    const window = allWindows[i];
    if (!window.isDestroyed()) {
      const bounds = window.getBounds();
      electronWindows.push({
        id: `electron-${window.id}`,
        name: window.getTitle() || "Electron Window",
        app: "StreamSpire",
        handle: window.id,
        processId: process.pid,
        bounds: {
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
        },
        isVisible: window.isVisible(),
        isMinimized: window.isMinimized(),
        isMaximized: window.isMaximized(),
        className: "Chrome_WidgetWin_1",
        executablePath: process.execPath,
        parentHandle: 0,
        hasChildren: false,
        zOrder: i + 1,
      });
    }
  }

  console.log(`Found ${electronWindows.length} Electron windows`);
  return electronWindows;
}

// Method 2: PowerShell - Simple approach using Get-Process
async function enumeratePowerShellWindows(): Promise<WindowInfo[]> {
  console.log("Enumerating windows via PowerShell...");

  try {
    // Use single quotes for PowerShell to avoid escaping issues
    const script = `Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | Select-Object Id, ProcessName, MainWindowTitle, @{Name='MainWindowHandle';Expression={$_.MainWindowHandle.ToInt64()}} | ConvertTo-Json`;

    console.log("Running PowerShell script...");
    const { stdout } = await execAsync(`powershell -Command "${script}"`, {
      timeout: 5000,
    });

    console.log("PowerShell raw output length:", stdout.length);
    console.log("PowerShell raw output preview:", stdout.substring(0, 200));

    if (!stdout.trim()) {
      console.log("PowerShell returned empty output");
      return [];
    }

    const windowsData = JSON.parse(stdout.trim());
    const windows: WindowInfo[] = [];

    // Handle both single window and array of windows
    const windowArray = Array.isArray(windowsData)
      ? windowsData
      : [windowsData];

    for (let i = 0; i < windowArray.length; i++) {
      const win = windowArray[i];
      if (win.MainWindowTitle && win.MainWindowTitle.trim().length > 0) {
        windows.push({
          id: `ps-${win.Id}`,
          name: win.MainWindowTitle,
          app: win.ProcessName,
          handle: win.MainWindowHandle || win.Id,
          processId: win.Id,
          executablePath: "",
          className: "Unknown",
          isVisible: true,
          isMinimized: false,
          isMaximized: false,
          bounds: { x: 100 + i * 20, y: 100 + i * 20, width: 800, height: 600 },
          parentHandle: 0,
          hasChildren: false,
          zOrder: i + 1,
        });
      }
    }

    console.log(`Found ${windows.length} windows via PowerShell`);
    return windows;
  } catch (error) {
    console.error("PowerShell enumeration failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
    return [];
  }
}

// Method 3: Simple tasklist command
async function enumerateTasklistWindows(): Promise<WindowInfo[]> {
  console.log("Enumerating windows via tasklist...");

  try {
    // Use tasklist to get running processes, then filter for GUI apps
    const { stdout } = await execAsync("tasklist /fo csv /nh", {
      timeout: 5000,
    });

    const lines = stdout.trim().split("\n");
    const windows: WindowInfo[] = [];
    const seenApps = new Set<string>(); // Track seen applications to avoid duplicates

    // Filter for common GUI applications
    const guiApps = [
      "chrome.exe",
      "firefox.exe", 
      "msedge.exe",
      "Code.exe",
      "notepad.exe",
      "explorer.exe",
      "calc.exe",
      "Teams.exe",
      "ms-teams.exe",
      "Discord.exe",
      "Slack.exe",
      "WhatsApp.exe",
      "Telegram.exe"
    ];

    for (const line of lines) {
      if (line && windows.length < 20) {
        // Parse CSV line: "Image Name","PID","Session Name","Session#","Mem Usage"
        const match = line.match(
          /"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/
        );
        if (match) {
          const [, imageName, pid] = match;

          if (
            guiApps.some((app) =>
              imageName.toLowerCase().includes(app.toLowerCase())
            ) ||
            imageName.toLowerCase().includes("electron")
          ) {
            // Normalize app name to avoid duplicates (e.g., chrome.exe -> chrome)
            let processName = imageName.replace(/\.exe$/i, "").toLowerCase();
            
            // Handle special cases for better naming
            if (processName === "ms-teams") processName = "teams";
            if (processName === "code") processName = "vscode";
            
            // Skip if we've already seen this app type
            if (seenApps.has(processName)) {
              continue;
            }
            seenApps.add(processName);

            // Create a more descriptive title
            let displayName = processName;
            switch (processName) {
              case "chrome": displayName = "Google Chrome"; break;
              case "firefox": displayName = "Mozilla Firefox"; break;
              case "msedge": displayName = "Microsoft Edge"; break;
              case "vscode": displayName = "Visual Studio Code"; break;
              case "teams": displayName = "Microsoft Teams"; break;
              case "explorer": displayName = "File Explorer"; break;
              case "calc": displayName = "Calculator"; break;
              case "notepad": displayName = "Notepad"; break;
            }

            // Try to get real window bounds for this process
            let bounds = {
              x: 100 + windows.length * 25,
              y: 100 + windows.length * 25,
              width: 800,
              height: 600,
            };

            // Attempt to get real window bounds using a simple PowerShell call
            try {
              const boundsScript = `Get-Process -Id ${pid} | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { 
                Add-Type -AssemblyName System.Windows.Forms; 
                $handle = $_.MainWindowHandle; 
                $rect = New-Object System.Drawing.Rectangle; 
                [System.Windows.Forms.Screen]::FromHandle($handle).Bounds | Select-Object X,Y,Width,Height | ConvertTo-Json 
              }`;
              
              const { stdout: boundsOutput } = await execAsync(`powershell -Command "${boundsScript}"`, {
                timeout: 2000,
              });
              
              if (boundsOutput.trim()) {
                const boundsData = JSON.parse(boundsOutput.trim());
                if (boundsData.X !== undefined) {
                  bounds = {
                    x: boundsData.X || 0,
                    y: boundsData.Y || 0,
                    width: boundsData.Width || 800,
                    height: boundsData.Height || 600,
                  };
                }
              }
            } catch (boundsError) {
              // If bounds detection fails, use default mock bounds
              console.log(`Could not get bounds for ${processName}:`, (boundsError as Error).message);
            }

            windows.push({
              id: `task-${processName}-${pid}`,
              name: displayName,
              app: processName,
              handle: parseInt(pid),
              processId: parseInt(pid),
              executablePath: "",
              className: "Unknown",
              isVisible: true,
              isMinimized: false,
              isMaximized: false,
              bounds: bounds,
              parentHandle: 0,
              hasChildren: false,
              zOrder: windows.length + 1,
            });
          }
        }
      }
    }

    console.log(`Found ${windows.length} unique applications via tasklist`);
    return windows;
  } catch (error) {
    console.error("Tasklist enumeration failed:", error);
    return [];
  }
}

// Method 4: FFI-NAPI - Direct Win32 API calls
async function enumerateFFIWindows(): Promise<WindowInfo[]> {
  if (!ffi || !ref) {
    console.log("FFI-NAPI not available, skipping...");
    return [];
  }

  console.log("Enumerating windows via FFI-NAPI...");

  try {
    // Define Windows API types
    const voidPtr = ref.refType(ref.types.void);
    const stringPtr = ref.refType(ref.types.CString);

    // Load user32.dll
    const user32 = ffi.Library("user32", {
      EnumWindows: ["bool", ["pointer", "long"]],
      GetWindowTextA: ["int", ["long", "pointer", "int"]],
      GetWindowTextLengthA: ["int", ["long"]],
      IsWindowVisible: ["bool", ["long"]],
      GetWindowThreadProcessId: ["uint32", ["long", "pointer"]],
      GetWindowRect: ["bool", ["long", "pointer"]],
      IsIconic: ["bool", ["long"]],
      IsZoomed: ["bool", ["long"]],
    });

    const windows: WindowInfo[] = [];

    // Create callback function for EnumWindows
    const enumCallback = ffi.Callback(
      "bool",
      ["long", "long"],
      function (hwnd: number, lParam: number) {
        try {
          // Check if window is visible
          if (!user32.IsWindowVisible(hwnd)) {
            return true; // Continue enumeration
          }

          // Get window title length
          const titleLength = user32.GetWindowTextLengthA(hwnd);
          if (titleLength <= 0) {
            return true; // Continue enumeration
          }

          // Get window title
          const titleBuffer = Buffer.alloc(titleLength + 1);
          const actualLength = user32.GetWindowTextA(
            hwnd,
            titleBuffer,
            titleLength + 1
          );
          if (actualLength <= 0) {
            return true; // Continue enumeration
          }

          const title = titleBuffer.toString("ascii", 0, actualLength);

          // Get process ID
          const pidBuffer = Buffer.alloc(4);
          user32.GetWindowThreadProcessId(hwnd, pidBuffer);
          const processId = pidBuffer.readUInt32LE(0);

          // Get window rectangle
          const rectBuffer = Buffer.alloc(16); // RECT structure: left, top, right, bottom (4 * 4 bytes)
          const rectSuccess = user32.GetWindowRect(hwnd, rectBuffer);

          let bounds = { x: 0, y: 0, width: 800, height: 600 };
          if (rectSuccess) {
            const left = rectBuffer.readInt32LE(0);
            const top = rectBuffer.readInt32LE(4);
            const right = rectBuffer.readInt32LE(8);
            const bottom = rectBuffer.readInt32LE(12);

            bounds = {
              x: left,
              y: top,
              width: right - left,
              height: bottom - top,
            };
          }

          // Check window state
          const isMinimized = user32.IsIconic(hwnd);
          const isMaximized = user32.IsZoomed(hwnd);

          // Try to get process name (simplified)
          let processName = "Unknown";
          try {
            const { execSync } = require("child_process");
            const result = execSync(
              `tasklist /FI "PID eq ${processId}" /FO CSV /NH`,
              { encoding: "utf8" }
            );
            const lines = result.trim().split("\n");
            if (lines.length > 0) {
              const columns = lines[0].split(",");
              if (columns.length > 0) {
                processName = columns[0].replace(/"/g, "").replace(".exe", "");
              }
            }
          } catch (e) {
            // Ignore process name lookup errors
          }

          windows.push({
            id: `ffi-${hwnd}`,
            name: title,
            app: processName,
            handle: hwnd,
            processId: processId,
            bounds: bounds,
            isVisible: true,
            isMinimized: isMinimized,
            isMaximized: isMaximized,
            className: "Unknown",
            executablePath: "",
            parentHandle: 0,
            hasChildren: false,
            zOrder: windows.length + 1,
          });
        } catch (error) {
          console.warn("Error processing window in FFI callback:", error);
        }

        return true; // Continue enumeration
      }
    );

    // Call EnumWindows
    const success = user32.EnumWindows(enumCallback, 0);

    if (success) {
      console.log(`Found ${windows.length} windows via FFI-NAPI`);
      return windows;
    } else {
      console.error("EnumWindows failed");
      return [];
    }
  } catch (error) {
    console.error("FFI-NAPI enumeration failed:", error);
    return [];
  }
}

// Method 5: Mock data for testing (fallback)
async function enumerateMockWindows(): Promise<WindowInfo[]> {
  console.log("Using mock window data...");

  const mockWindows: WindowInfo[] = [
    {
      id: "window-1",
      name: "Visual Studio Code",
      app: "Code",
      handle: 123456,
      processId: 1234,
      executablePath:
        "C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
      className: "Chrome_WidgetWin_1",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      bounds: { x: 100, y: 100, width: 1200, height: 800 },
      parentHandle: 0,
      hasChildren: false,
      zOrder: 1,
    },
    {
      id: "window-2",
      name: "Google Chrome",
      app: "chrome",
      handle: 123457,
      processId: 5678,
      executablePath:
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      className: "Chrome_WidgetWin_1",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      bounds: { x: 200, y: 200, width: 1000, height: 700 },
      parentHandle: 0,
      hasChildren: false,
      zOrder: 2,
    },
    {
      id: "window-3",
      name: "File Explorer",
      app: "explorer",
      handle: 123458,
      processId: 9012,
      executablePath: "C:\\Windows\\explorer.exe",
      className: "CabinetWClass",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      bounds: { x: 300, y: 300, width: 800, height: 600 },
      parentHandle: 0,
      hasChildren: false,
      zOrder: 3,
    },
    {
      id: "window-4",
      name: "StreamSpire",
      app: "StreamSpire",
      handle: 123459,
      processId: 3456,
      executablePath:
        "J:\\electron\\streamspire\\dist-electron\\main\\index.js",
      className: "Chrome_WidgetWin_1",
      isVisible: true,
      isMinimized: false,
      isMaximized: false,
      bounds: { x: 400, y: 400, width: 1400, height: 900 },
      parentHandle: 0,
      hasChildren: false,
      zOrder: 4,
    },
  ];

  console.log("Returning mock windows:", mockWindows.length);
  return mockWindows;
}

/**
 * Enumerates all windows using multiple methods
 * Tries PowerShell first, then Electron windows, then falls back to mock data
 */
export async function enumerateWindows(
  options: EnumerateWindowsOptions = {}
): Promise<WindowInfo[]> {
  const { includeMinimized = false, includeSystemWindows = false } = options;
  console.log("Starting window enumeration with options:", options);

  // Try different enumeration methods in order of preference
  try {
    // Method 1: Try PowerShell for system-wide windows
    console.log("Attempting PowerShell enumeration...");
    const powerShellWindows = await enumeratePowerShellWindows();
    if (powerShellWindows.length > 0) {
      console.log(
        `✅ Successfully enumerated ${powerShellWindows.length} windows via PowerShell`
      );
      return powerShellWindows;
    }
  } catch (error) {
    console.warn(
      "❌ PowerShell enumeration failed, trying next method:",
      error
    );
  }

  try {
    // Method 2: Try tasklist enumeration
    console.log("Attempting tasklist enumeration...");
    const tasklistWindows = await enumerateTasklistWindows();
    if (tasklistWindows.length > 0) {
      console.log(
        `✅ Successfully enumerated ${tasklistWindows.length} windows via tasklist`
      );
      return tasklistWindows;
    }
  } catch (error) {
    console.warn("❌ Tasklist enumeration failed, trying next method:", error);
  }

  try {
    // Method 3: Try FFI-NAPI for direct Win32 API access
    console.log("Attempting FFI-NAPI enumeration...");
    const ffiWindows = await enumerateFFIWindows();
    if (ffiWindows.length > 0) {
      console.log(
        `✅ Successfully enumerated ${ffiWindows.length} windows via FFI-NAPI`
      );
      return ffiWindows;
    }
  } catch (error) {
    console.warn("❌ FFI-NAPI enumeration failed, trying next method:", error);
  }

  try {
    // Method 4: Try Electron windows as fallback
    console.log("Attempting Electron window enumeration...");
    const electronWindows = await enumerateElectronWindows();
    if (electronWindows.length > 0) {
      console.log(
        `✅ Successfully enumerated ${electronWindows.length} Electron windows`
      );
      return electronWindows;
    }
  } catch (error) {
    console.warn("❌ Electron enumeration failed, using mock data:", error);
  }

  // Method 5: Use mock data as final fallback
  console.log("🔄 Using mock data as fallback");
  return await enumerateMockWindows();
}

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
