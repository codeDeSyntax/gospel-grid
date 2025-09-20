import { exec } from "child_process";
import { log } from "console";
import { promisify } from "util";

const execAsync = promisify(exec);

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

// Method 1: Simple tasklist command - WORKING METHOD
async function enumerateTasklistWindows(): Promise<WindowInfo[]> {
  console.log("🔍 Enumerating windows via tasklist...");
  console.log("=== STARTING WINDOW ENUMERATION ===");

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
      "Telegram.exe",
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
              case "chrome":
                displayName = "Google Chrome";
                break;
              case "firefox":
                displayName = "Mozilla Firefox";
                break;
              case "msedge":
                displayName = "Microsoft Edge";
                break;
              case "vscode":
                displayName = "Visual Studio Code";
                break;
              case "teams":
                displayName = "Microsoft Teams";
                break;
              case "explorer":
                displayName = "File Explorer";
                break;
              case "calc":
                displayName = "Calculator";
                break;
              case "notepad":
                displayName = "Notepad";
                break;
            }

            // Try to get real window bounds for this process
            let bounds = {
              x: 100 + windows.length * 25,
              y: 100 + windows.length * 25,
              width: 800,
              height: 600,
            };

            // Try to get executable path for this process
            let executablePath = "";
            console.log(
              `🔍 Getting executable path for PID ${pid} (${processName})`
            );
            try {
              const pathScript = `Get-Process -Id ${pid} | Select-Object -ExpandProperty Path`;
              console.log(`📝 PowerShell script: ${pathScript}`);
              const { stdout: pathOutput } = await execAsync(
                `powershell -Command "${pathScript}"`,
                { timeout: 2000 }
              );
              console.log(`📤 PowerShell output: "${pathOutput}"`);
              if (pathOutput.trim()) {
                executablePath = pathOutput.trim();
                console.log(
                  `✅ SUCCESS: Executable path for ${processName}: ${executablePath}`
                );
              } else {
                console.log(
                  `❌ No executable path returned for ${processName}`
                );
              }
            } catch (pathError) {
              console.log(
                `❌ ERROR getting executable path for ${processName}:`,
                (pathError as Error).message
              );
            }

            // Attempt to get real window bounds using a simple PowerShell call
            try {
              const boundsScript = `Get-Process -Id ${pid} | Where-Object { $_.MainWindowHandle -ne 0 } | ForEach-Object { 
                Add-Type -AssemblyName System.Windows.Forms; 
                $handle = $_.MainWindowHandle; 
                $rect = New-Object System.Drawing.Rectangle; 
                [System.Windows.Forms.Screen]::FromHandle($handle).Bounds | Select-Object X,Y,Width,Height | ConvertTo-Json 
              }`;

              const { stdout: boundsOutput } = await execAsync(
                `powershell -Command "${boundsScript}"`,
                {
                  timeout: 2000,
                }
              );

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
              console.log(
                `Could not get bounds for ${processName}:`,
                (boundsError as Error).message
              );
            }

            windows.push({
              id: `task-${processName}-${pid}`,
              name: displayName,
              app: processName,
              handle: parseInt(pid),
              processId: parseInt(pid),
              executablePath: executablePath,
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

    console.log(`🎯 Found ${windows.length} unique applications via tasklist`);
    console.log("=== ALL FETCHED WINDOWS ===");
    windows.forEach((window, index) => {
      console.log(`📱 Window ${index + 1}:`);
      console.log(`   ID: ${window.id}`);
      console.log(`   Name: ${window.name}`);
      console.log(`   App: ${window.app}`);
      console.log(`   PID: ${window.processId}`);
      console.log(`   Executable: ${window.executablePath || "NOT_FOUND"}`);
      console.log(
        `   Bounds: ${window.bounds.x}, ${window.bounds.y}, ${window.bounds.width}x${window.bounds.height}`
      );
      console.log(`   ---`);
    });
    console.log("=== END WINDOW LIST ===");
    return windows;
  } catch (error) {
    console.error("Tasklist enumeration failed:", error);
    return [];
  }
}

// Main window enumeration function using tasklist method
export async function enumerateWindows(
  options: EnumerateWindowsOptions = {}
): Promise<WindowInfo[]> {
  const { includeMinimized = false, includeSystemWindows = false } = options;

  // Use tasklist enumeration (currently the only working method)
  try {
    console.log("Attempting tasklist enumeration...");
    const tasklistWindows = await enumerateTasklistWindows();
    if (tasklistWindows.length > 0) {
      console.log(
        `✅ Successfully enumerated ${tasklistWindows.length} windows via tasklist`
      );
      return tasklistWindows;
    } else {
      console.warn("❌ Tasklist enumeration returned no windows");
      return [];
    }
  } catch (error) {
    console.error("❌ Tasklist enumeration failed:", error);
    return [];
  }
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
