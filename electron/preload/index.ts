import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args)
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

// --------- Window Control APIs ---------
contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.invoke("window-minimize"),
  maximize: () => ipcRenderer.invoke("window-maximize"),
  close: () => ipcRenderer.invoke("window-close"),
  isMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  isMinimized: () => ipcRenderer.invoke("window-is-minimized"),
});

// --------- Window Enumeration APIs ---------
contextBridge.exposeInMainWorld("electronAPI", {
  enumerateWindows: (options: any) =>
    ipcRenderer.invoke("enumerate-windows", options),
  getWindowIcon: (handle: number) =>
    ipcRenderer.invoke("get-window-icon", handle),
  getWindowThumbnail: (windowId: string, options?: any) =>
    ipcRenderer.invoke("get-window-thumbnail", windowId, options),
  getMultipleWindowThumbnails: (windowIds: string[], options?: any) =>
    ipcRenderer.invoke("get-multiple-window-thumbnails", windowIds, options),
  getAllWindowThumbnails: (options?: any) =>
    ipcRenderer.invoke("get-all-window-thumbnails", options),
  focusWindow: (handle: number) => ipcRenderer.invoke("focus-window", handle),
  minimizeWindow: (handle: number) =>
    ipcRenderer.invoke("minimize-window-external", handle),
  maximizeWindow: (handle: number) =>
    ipcRenderer.invoke("maximize-window-external", handle),
  closeWindow: (handle: number) =>
    ipcRenderer.invoke("close-window-external", handle),
  showWindow: (handle: number) =>
    ipcRenderer.invoke("show-window-external", handle),
  hideWindow: (handle: number) =>
    ipcRenderer.invoke("hide-window-external", handle),
  moveWindow: (handle: number, bounds: any) =>
    ipcRenderer.invoke("move-window-external", handle, bounds),
  publishLayout: (layoutData: any) =>
    ipcRenderer.invoke("publish-layout", layoutData),
  getPublishedLayout: (layoutId: string) =>
    ipcRenderer.invoke("get-published-layout", layoutId),
  checkPublishedWindows: () => ipcRenderer.invoke("check-published-windows"),
  closePublishedWindows: () => ipcRenderer.invoke("close-published-windows"),

  // Preset management
  savePreset: (preset: any) => ipcRenderer.invoke("save-preset", preset),
  loadPresets: () => ipcRenderer.invoke("load-presets"),
  deletePreset: (presetId: string) =>
    ipcRenderer.invoke("delete-preset", presetId),

  // Cache management
  clearThumbnailCache: () => ipcRenderer.invoke("clear-thumbnail-cache"),
  getCacheStats: () => ipcRenderer.invoke("get-cache-stats"),

  // High-quality and batch thumbnail capture
  captureHighQualityThumbnail: (windowId: string) =>
    ipcRenderer.invoke("capture-high-quality-thumbnail", windowId),
  batchCaptureThumbnails: (windowIds: string[], options?: any) =>
    ipcRenderer.invoke("batch-capture-thumbnails", windowIds, options),

  // Desktop capturer sources for video streaming
  getDesktopSources: (options: any) =>
    ipcRenderer.invoke("get-desktop-sources", options),

  // Subscribe to published thumbnails broadcast from main
  onPublishedThumbnails: (callback: (payload: any) => void) => {
    const listener = (_: any, payload: any) => callback(payload);
    ipcRenderer.on("published-thumbnails", listener);
    return () => ipcRenderer.off("published-thumbnails", listener);
  },

  // Subscribe to main window thumbnails broadcast (synchronized with published window)
  onMainWindowThumbnails: (callback: (payload: any) => void) => {
    const listener = (_: any, payload: any) => callback(payload);
    ipcRenderer.on("main-window-thumbnails", listener);
    return () => ipcRenderer.off("main-window-thumbnails", listener);
  },

  // Subscribe to quality settings changes
  onQualitySettingsChanged: (callback: (settings: any) => void) => {
    const listener = (_: any, settings: any) => callback(settings);
    ipcRenderer.on("quality-settings-changed", listener);
    return () => ipcRenderer.off("quality-settings-changed", listener);
  },

  // Update quality settings (from settings panel)
  updateQualitySettings: (settings: any) =>
    ipcRenderer.invoke("update-quality-settings", settings),

  // Wrapper for compatibility
  captureWindowThumbnail: (windowId: string, options?: any) =>
    ipcRenderer.invoke("get-window-thumbnail", windowId, options),
});

// --------- Whisper Speech-to-Text API (Now using AssemblyAI) ---------
contextBridge.exposeInMainWorld("speechToTextAPI", {
  // Transcribe audio buffer (for file upload or recorded audio)
  transcribe: (
    audioBuffer: ArrayBuffer,
    options?: {
      language?: string;
      task?: "transcribe" | "translate";
    }
  ) => {
    const buffer = Buffer.from(audioBuffer);
    return ipcRenderer.invoke("whisper-transcribe", buffer, options || {});
  },

  // Stream transcription (for real-time audio chunks)
  transcribeStream: (
    audioBuffer: ArrayBuffer,
    options?: {
      language?: string;
      isLast?: boolean;
    }
  ) => {
    const buffer = Buffer.from(audioBuffer);
    return ipcRenderer.invoke(
      "whisper-transcribe-stream",
      buffer,
      options || {}
    );
  },

  // AssemblyAI streaming controls
  startStreaming: (options?: { sampleRate?: number }) =>
    ipcRenderer.invoke("assembly-start-streaming", options || {}),

  stopStreaming: () => ipcRenderer.invoke("assembly-stop-streaming"),

  // Get supported languages
  getSupportedLanguages: () => ipcRenderer.invoke("whisper-get-languages"),

  // Get AssemblyAI service status
  getStatus: () => ipcRenderer.invoke("whisper-get-status"),

  // Restart AssemblyAI service
  restart: () => ipcRenderer.invoke("whisper-restart"),

  // Event listeners for status updates
  onWhisperStatus: (callback: (status: any) => void) => {
    const listener = (_: any, status: any) => callback(status);
    ipcRenderer.on("whisper-status", listener);
    return () => ipcRenderer.off("whisper-status", listener);
  },

  // Real-time speech result callback (for AssemblyAI streaming)
  onSpeechResult: (callback: (result: any) => void) => {
    const listener = (_: any, result: any) => callback(result);
    ipcRenderer.on("speech-result", listener);
    return () => ipcRenderer.off("speech-result", listener);
  },

  // Legacy API for compatibility with existing components
  startRecognition: (options: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }) => {
    console.warn(
      "startRecognition is deprecated. Use audio recording + transcribe instead."
    );
    return Promise.resolve({
      success: false,
      error: "Use audio recording + transcribe instead",
    });
  },

  stopRecognition: () => {
    console.warn(
      "stopRecognition is deprecated. Use audio recording + transcribe instead."
    );
    return Promise.resolve({
      success: false,
      error: "Use audio recording + transcribe instead",
    });
  },

  // Legacy event listeners for compatibility
  onTranscriptionResult: (callback: (result: any) => void) => {
    console.warn(
      "onTranscriptionResult is deprecated. Use transcribe method directly."
    );
    return () => {}; // No-op
  },

  onTranscriptionError: (callback: (error: any) => void) => {
    console.warn(
      "onTranscriptionError is deprecated. Use transcribe method directly."
    );
    return () => {}; // No-op
  },

  onRecognitionStateChange: (callback: (state: string) => void) => {
    console.warn(
      "onRecognitionStateChange is deprecated. Use transcribe method directly."
    );
    return () => {}; // No-op
  },
});

// --------- Speech Recognition & Translation APIs ---------
contextBridge.exposeInMainWorld("speechAPI", {
  // Speech Recognition using Web Speech API
  startRecognition: (options: {
    language?: string;
    continuous?: boolean;
    interimResults?: boolean;
  }) => ipcRenderer.invoke("start-speech-recognition", options),

  stopRecognition: () => ipcRenderer.invoke("stop-speech-recognition"),

  // Translation using free APIs
  translateText: (
    text: string,
    options: {
      targetLanguage: string;
      sourceLanguage?: string;
    }
  ) => ipcRenderer.invoke("translate-text", text, options),

  // Language utilities
  getSupportedLanguages: () => ipcRenderer.invoke("get-supported-languages"),
  detectLanguage: (text: string) => ipcRenderer.invoke("detect-language", text),

  // Event listeners for real-time updates
  onSpeechResult: (callback: (result: any) => void) => {
    const listener = (_: any, result: any) => callback(result);
    ipcRenderer.on("speech-result", listener);
    return () => ipcRenderer.off("speech-result", listener);
  },

  onSpeechError: (callback: (error: any) => void) => {
    const listener = (_: any, error: any) => callback(error);
    ipcRenderer.on("speech-error", listener);
    return () => ipcRenderer.off("speech-error", listener);
  },

  onTranslationResult: (callback: (result: any) => void) => {
    const listener = (_: any, result: any) => callback(result);
    ipcRenderer.on("translation-result", listener);
    return () => ipcRenderer.off("translation-result", listener);
  },
});

// --------- Preload scripts loading ---------
function domReady(
  condition: DocumentReadyState[] = ["complete", "interactive"]
) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}

const safeDOM = {
  append(parent: HTMLElement, child: HTMLElement) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent: HTMLElement, child: HTMLElement) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  },
};

/**
 * wingrid Loading Screen - Theme-Aware with Centered SVG
 * Features: Theme-aware colors with system preference detection and zoom in/out animated logo
 */
function useLoading() {
  const className = `wingrid-loading`;

  // Theme configurations matching the main app
  const THEME_CONFIGS = {
    "cosmic-blue": {
      primary: {
        400: "#60a5fa",
        500: "#3b82f6",
        600: "#2563eb",
        700: "#1d4ed8",
      },
    },
    "matrix-green": {
      primary: {
        400: "#4ade80",
        500: "#22c55e",
        600: "#16a34a",
        700: "#15803d",
      },
    },
    "fire-red": {
      primary: {
        400: "#f87171",
        500: "#ef4444",
        600: "#dc2626",
        700: "#b91c1c",
      },
    },
    "steel-gray": {
      primary: {
        400: "#9ca3af",
        500: "#6b7280",
        600: "#4b5563",
        700: "#374151",
      },
    },
    "earth-brown": {
      primary: {
        400: "#a3a3a3",
        500: "#737373",
        600: "#525252",
        700: "#404040",
      },
    },
  } as const;

  type ThemeKey = keyof typeof THEME_CONFIGS;

  // Read saved theme from localStorage or default to cosmic-blue
  let currentTheme: ThemeKey = "cosmic-blue";
  try {
    const savedTheme = localStorage.getItem("wingrid-theme") as ThemeKey;
    if (savedTheme && THEME_CONFIGS[savedTheme]) {
      currentTheme = savedTheme;
    }
  } catch (error) {
    console.log("Could not read theme from localStorage, using default");
  }

  // Get theme colors for current theme
  const themeColors = THEME_CONFIGS[currentTheme];

  // Debug logging
  console.log("Current theme:", currentTheme);
  console.log("Theme colors:", themeColors);

  // Convert hex to RGB for CSS variables
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(
        result[2],
        16
      )}, ${parseInt(result[3], 16)}`;
    }
    return "0, 0, 0";
  };

  const defaultTheme = {
    primary400: hexToRgb(themeColors.primary[400]),
    primary500: hexToRgb(themeColors.primary[500]),
    primary600: hexToRgb(themeColors.primary[600]),
    primary700: hexToRgb(themeColors.primary[700]),
  };

  // Debug logging for converted colors
  console.log("Converted theme colors:", defaultTheme);
  const styleContent = `
/* Theme-aware CSS variables */
:root {
  --theme-primary-400: ${defaultTheme.primary400};
  --theme-primary-500: ${defaultTheme.primary500};
  --theme-primary-600: ${defaultTheme.primary600};
  --theme-primary-700: ${defaultTheme.primary700};
}

/* wingrid Loading Animations */
@keyframes logoZoom {
  0%, 100% { 
    transform: scale(1);
    opacity: 0.8;
  }
  50% { 
    transform: scale(1.15);
    opacity: 1;
  }
}

@keyframes logoSpin {
  0% { 
    transform: rotate(0deg); 
  }
  100% { 
    transform: rotate(360deg); 
  }
}

.${className} {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #121212;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  overflow: hidden;
}

.${className}::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(ellipse 50% 35% at 15% 85%, 
         rgb(var(--theme-primary-400) / 0.6) 0%, 
         rgb(var(--theme-primary-500) / 0.4) 30%, 
         rgb(var(--theme-primary-600) / 0.3) 60%, 
         rgb(var(--theme-primary-700) / 0.2) 80%, 
         transparent 100%),
    radial-gradient(ellipse 30% 20% at 10% 60%, 
         rgb(var(--theme-primary-400) / 0.3) 0%, 
         rgb(var(--theme-primary-500) / 0.2) 50%, 
         transparent 100%);
  opacity: 0.8;
}

.wingrid-mesh {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.15;
  pointer-events: none;
}

.wingrid-logo-container {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wingrid-logo {
  width: 180px;
  height: 180px;
  animation: logoZoom 3s ease-in-out infinite;
  filter: drop-shadow(0 0 20px rgb(var(--theme-primary-500) / 0.6));
}

.wingrid-logo-inner {
  animation: logoSpin 20s linear infinite;
  transform-origin: center;
}
    `;

  // Generate theme-aware SVG colors
  const generateThemeAwareSVG = () => {
    const primary400 = themeColors.primary[400];
    const primary500 = themeColors.primary[500];
    const primary600 = themeColors.primary[600];
    const primary700 = themeColors.primary[700];

    return `
      <svg class="wingrid-logo" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${primary500};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${primary400};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${primary500};stop-opacity:0.8" />
          </linearGradient>
          <!-- Individual gradients for grid cards -->
          <linearGradient id="cardGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(34, 197, 94);stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${primary500};stop-opacity:0.7" />
          </linearGradient>
          <linearGradient id="cardGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(168, 85, 247);stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${primary400};stop-opacity:0.7" />
          </linearGradient>
          <linearGradient id="cardGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(245, 101, 101);stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${primary500};stop-opacity:0.7" />
          </linearGradient>
          <linearGradient id="cardGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(251, 191, 36);stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:${primary400};stop-opacity:0.7" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <g class="wingrid-logo-inner">
          <!-- Outer ring representing window capture -->
          <circle cx="100" cy="100" r="85" fill="none" stroke="white" stroke-width="3" opacity="0.6" filter="url(#glow)"/>
          
          <!-- Inner rings for window organization -->
          <circle cx="100" cy="100" r="65" fill="none" stroke="white" stroke-width="2" opacity="0.4"/>
          <circle cx="100" cy="100" r="45" fill="none" stroke="white" stroke-width="2" opacity="0.3"/>
          
          <!-- Central window grid pattern with varying colors -->
          <rect x="70" y="70" width="25" height="20" rx="3" fill="url(#cardGradient1)" opacity="0.8"/>
          <rect x="105" y="70" width="25" height="20" rx="3" fill="url(#cardGradient2)" opacity="0.8"/>
          <rect x="70" y="100" width="25" height="20" rx="3" fill="url(#cardGradient3)" opacity="0.8"/>
          <rect x="105" y="100" width="25" height="20" rx="3" fill="url(#cardGradient4)" opacity="0.8"/>
          
          <!-- Streaming arrows/flow indicators -->
          <path d="M 40 100 L 60 90 L 60 95 L 55 100 L 60 105 L 60 110 Z" fill="white" opacity="0.7"/>
          <path d="M 160 100 L 140 110 L 140 105 L 145 100 L 140 95 L 140 90 Z" fill="white" opacity="0.7"/>
          <path d="M 100 40 L 90 60 L 95 60 L 100 55 L 105 60 L 110 60 Z" fill="white" opacity="0.7"/>
          <path d="M 100 160 L 110 140 L 105 140 L 100 145 L 95 140 L 90 140 Z" fill="white" opacity="0.7"/>
          
          <!-- Central core - representing the main app -->
          <circle cx="100" cy="100" r="15" fill="white" opacity="0.8" filter="url(#glow)"/>
          <circle cx="100" cy="100" r="8" fill="rgba(255,255,255,0.9)"/>
        </g>
      </svg>
    `;
  };

  const generateThemeAwareMeshPattern = () => {
    const primary400 = themeColors.primary[400];
    const primary500 = themeColors.primary[500];
    const primary600 = themeColors.primary[600];
    const primary700 = themeColors.primary[700];

    return `
      <pattern id="meshPattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
        <!-- Nodes with gray colors for universal visibility -->
        <circle cx="30" cy="30" r="1.5" fill="#9ca3af" opacity="0.7" />
        <circle cx="90" cy="30" r="1.2" fill="#6b7280" opacity="0.6" />
        <circle cx="30" cy="60" r="1.3" fill="#4b5563" opacity="0.65" />
        <circle cx="60" cy="60" r="1.8" fill="#374151" opacity="0.6" />
        <circle cx="90" cy="60" r="1.1" fill="#9ca3af" opacity="0.6" />
        <circle cx="30" cy="90" r="1" fill="#6b7280" opacity="0.65" />
        <circle cx="90" cy="90" r="1.4" fill="#4b5563" opacity="0.6" />
        
        <!-- Connection lines with gray colors -->
        <line x1="30" y1="30" x2="90" y2="30" stroke="#9ca3af" stroke-width="0.6" opacity="0.4" />
        <line x1="30" y1="60" x2="90" y2="60" stroke="#6b7280" stroke-width="0.6" opacity="0.35" />
        <line x1="30" y1="90" x2="90" y2="90" stroke="#4b5563" stroke-width="0.6" opacity="0.35" />
        <line x1="30" y1="30" x2="30" y2="90" stroke="#374151" stroke-width="0.6" opacity="0.35" />
        <line x1="60" y1="30" x2="60" y2="90" stroke="#9ca3af" stroke-width="0.6" opacity="0.4" />
        <line x1="90" y1="30" x2="90" y2="90" stroke="#6b7280" stroke-width="0.6" opacity="0.35" />
        <line x1="30" y1="30" x2="60" y2="60" stroke="#4b5563" stroke-width="0.5" opacity="0.3" />
        <line x1="60" y1="60" x2="90" y2="90" stroke="#9ca3af" stroke-width="0.5" opacity="0.3" />
        <line x1="90" y1="30" x2="60" y2="60" stroke="#6b7280" stroke-width="0.5" opacity="0.3" />
        <line x1="60" y1="60" x2="30" y2="90" stroke="#374151" stroke-width="0.5" opacity="0.3" />
      </pattern>
      
      <pattern id="denseMesh" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
        <circle cx="20" cy="20" r="0.8" fill="#9ca3af" opacity="0.5" />
        <circle cx="60" cy="20" r="0.6" fill="#6b7280" opacity="0.45" />
        <circle cx="40" cy="40" r="1" fill="#4b5563" opacity="0.5" />
        <circle cx="20" cy="60" r="0.7" fill="#374151" opacity="0.45" />
        <circle cx="60" cy="60" r="0.9" fill="#9ca3af" opacity="0.5" />
        <line x1="20" y1="20" x2="60" y2="20" stroke="#9ca3af" stroke-width="0.4" opacity="0.25" />
        <line x1="20" y1="60" x2="60" y2="60" stroke="#6b7280" stroke-width="0.4" opacity="0.25" />
        <line x1="40" y1="0" x2="40" y2="80" stroke="#4b5563" stroke-width="0.4" opacity="0.25" />
        <line x1="20" y1="20" x2="40" y2="40" stroke="#374151" stroke-width="0.3" opacity="0.2" />
        <line x1="40" y1="40" x2="60" y2="60" stroke="#9ca3af" stroke-width="0.3" opacity="0.2" />
      </pattern>
    `;
  };

  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "wingrid-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = `${className}`;
  oDiv.innerHTML = `
    <!-- Theme-aware mesh pattern background -->
    <div class="wingrid-mesh">
      <svg width="100%" height="100%">
        <defs>
          ${generateThemeAwareMeshPattern()}
        </defs>
        <rect width="100%" height="100%" fill="url(#meshPattern)" />
        <rect width="100%" height="100%" fill="url(#denseMesh)" style="opacity: 0.1;" />
      </svg>
    </div>
    
    <div class="wingrid-logo-container">
      ${generateThemeAwareSVG()}
    </div>
  `;

  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    },
  };
}

// ----------------------------------------------------------------------

const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);

window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};

setTimeout(removeLoading, 9999);
