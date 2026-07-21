import { ipcRenderer, contextBridge } from "electron";

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
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
  splashReady: () => ipcRenderer.invoke("splash-ready"),
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
  updatePublishedLayout: (layoutData: any) =>
    ipcRenderer.invoke("update-published-layout", layoutData),
  checkPublishedWindows: () => ipcRenderer.invoke("check-published-windows"),
  closePublishedWindows: (displayId?: number) =>
    ipcRenderer.invoke("close-published-windows", displayId),

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

  // Connected display inventory (for multi-monitor routing setup)
  getConnectedDisplays: () => ipcRenderer.invoke("get-connected-displays"),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
  getImages: (dirPath: string) => ipcRenderer.invoke("get-images", dirPath),

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

  // Projection state control (blackout / freeze / overlay)
  updateProjectionState: (state: {
    isBlackout?: boolean;
    isFrozen?: boolean;
    overlayText?: string;
    overlayVisible?: boolean;
    targetDisplayId?: number | null;
  }) => ipcRenderer.invoke("update-projection-state", state),

  onProjectionStateChanged: (
    callback: (state: {
      isBlackout: boolean;
      isFrozen: boolean;
      overlayText: string;
      overlayVisible: boolean;
    }) => void,
  ) => {
    const listener = (_: any, state: any) => callback(state);
    ipcRenderer.on("projection-state-changed", listener);
    return () => ipcRenderer.off("projection-state-changed", listener);
  },

  onPublishedLayoutUpdated: (callback: (payload: any) => void) => {
    const listener = (_: any, payload: any) => callback(payload);
    ipcRenderer.on("published-layout-updated", listener);
    return () => ipcRenderer.off("published-layout-updated", listener);
  },

  // Global hotkey events forwarded from main process
  onGlobalHotkey: (callback: (action: string) => void) => {
    const listener = (_: any, action: string) => callback(action);
    ipcRenderer.on("global-hotkey", listener);
    return () => ipcRenderer.off("global-hotkey", listener);
  },

  // Capture a screenshot of the first active projection window
  captureProjectionPage: () => ipcRenderer.invoke("capture-projection-page"),

  // Tray action events (e.g. "stop-projection" when user clicks tray)
  onTrayAction: (callback: (action: string) => void) => {
    const listener = (_: any, action: string) => callback(action);
    ipcRenderer.on("tray-action", listener);
    return () => ipcRenderer.off("tray-action", listener);
  },

  // Wrapper for compatibility
  captureWindowThumbnail: (windowId: string, options?: any) =>
    ipcRenderer.invoke("get-window-thumbnail", windowId, options),

  // Signal the main process that the splash screen is done → expand window
  splashReady: () => ipcRenderer.invoke("splash-ready"),

  remoteScreen: {
    getStatus: () => ipcRenderer.invoke("remote-screen:get-status"),
    startSignaling: (options?: { host?: string; port?: number }) =>
      ipcRenderer.invoke("remote-screen:start-signaling", options),
    stopSignaling: () => ipcRenderer.invoke("remote-screen:stop-signaling"),
    connectClient: (serverUrl: string) =>
      ipcRenderer.invoke("remote-screen:connect-client", { serverUrl }),
    disconnectClient: () => ipcRenderer.invoke("remote-screen:disconnect-client"),
    listDevices: () => ipcRenderer.invoke("remote-screen:list-devices"),
    listNearbyDevices: () =>
      ipcRenderer.invoke("remote-screen:list-nearby-devices"),
    requestView: (deviceId: string) =>
      ipcRenderer.invoke("remote-screen:request-view", { deviceId }),
    acceptViewRequest: (requestId: string) =>
      ipcRenderer.invoke("remote-screen:accept-view-request", { requestId }),
    denyViewRequest: (requestId: string) =>
      ipcRenderer.invoke("remote-screen:deny-view-request", { requestId }),
    confirmView: (requestId: string, confirmationToken: string) =>
      ipcRenderer.invoke("remote-screen:confirm-view", { requestId, confirmationToken }),
    sendSignal: (deviceId: string, signal: unknown) =>
      ipcRenderer.invoke("remote-screen:send-signal", { deviceId, signal }),
    endSession: (deviceId: string, reason?: string) =>
      ipcRenderer.invoke("remote-screen:end-session", { deviceId, reason }),
    onStatusChanged: (callback: (status: any) => void) => {
      const listener = (_: any, status: any) => callback(status);
      ipcRenderer.on("remote-screen:status-changed", listener);
      return () => ipcRenderer.off("remote-screen:status-changed", listener);
    },
    onDevicesChanged: (callback: (devices: any[]) => void) => {
      const listener = (_: any, devices: any[]) => callback(devices);
      ipcRenderer.on("remote-screen:devices-changed", listener);
      return () => ipcRenderer.off("remote-screen:devices-changed", listener);
    },
    onNearbyDevicesChanged: (callback: (devices: any[]) => void) => {
      const listener = (_: any, devices: any[]) => callback(devices);
      ipcRenderer.on("remote-screen:nearby-devices-changed", listener);
      return () => ipcRenderer.off("remote-screen:nearby-devices-changed", listener);
    },
    onDiscoveryError: (callback: (payload: any) => void) => {
      const listener = (_: any, payload: any) => callback(payload);
      ipcRenderer.on("remote-screen:discovery-error", listener);
      return () => ipcRenderer.off("remote-screen:discovery-error", listener);
    },
    onIncomingRequest: (callback: (request: any) => void) => {
      const listener = (_: any, request: any) => callback(request);
      ipcRenderer.on("remote-screen:incoming-request", listener);
      return () => ipcRenderer.off("remote-screen:incoming-request", listener);
    },
    onRequestAccepted: (callback: (request: any) => void) => {
      const listener = (_: any, request: any) => callback(request);
      ipcRenderer.on("remote-screen:request-accepted", listener);
      return () => ipcRenderer.off("remote-screen:request-accepted", listener);
    },
    onRequestDenied: (callback: (request: any) => void) => {
      const listener = (_: any, request: any) => callback(request);
      ipcRenderer.on("remote-screen:request-denied", listener);
      return () => ipcRenderer.off("remote-screen:request-denied", listener);
    },
    onRequestReady: (callback: (request: any) => void) => {
      const listener = (_: any, request: any) => callback(request);
      ipcRenderer.on("remote-screen:request-ready", listener);
      return () => ipcRenderer.off("remote-screen:request-ready", listener);
    },
    onSignal: (callback: (signal: any) => void) => {
      const listener = (_: any, signal: any) => callback(signal);
      ipcRenderer.on("remote-screen:signal", listener);
      return () => ipcRenderer.off("remote-screen:signal", listener);
    },
    onSessionEnded: (callback: (event: any) => void) => {
      const listener = (_: any, event: any) => callback(event);
      ipcRenderer.on("remote-screen:session-ended", listener);
      return () => ipcRenderer.off("remote-screen:session-ended", listener);
    },
  },
});

// --------- Whisper Speech-to-Text API (Now using AssemblyAI) ---------
contextBridge.exposeInMainWorld("speechToTextAPI", {
  // Transcribe audio buffer (for file upload or recorded audio)
  transcribe: (
    audioBuffer: ArrayBuffer,
    options?: {
      language?: string;
      task?: "transcribe" | "translate";
    },
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
    },
  ) => {
    const buffer = Buffer.from(audioBuffer);
    return ipcRenderer.invoke(
      "whisper-transcribe-stream",
      buffer,
      options || {},
    );
  },

  // AssemblyAI streaming controls
  startStreaming: (options?: { sampleRate?: number }) =>
    ipcRenderer.invoke("assembly-start-streaming", options || {}),

  sendStreamingAudio: (audioBuffer: ArrayBuffer) => {
    const buffer = Buffer.from(audioBuffer);
    ipcRenderer.send("assembly-send-audio-chunk", buffer);
    return Promise.resolve({ success: true });
  },

  stopStreaming: () => ipcRenderer.invoke("assembly-stop-streaming"),

  // Get supported languages
  getSupportedLanguages: () => ipcRenderer.invoke("whisper-get-languages"),

  // Get AssemblyAI service status
  getStatus: () => ipcRenderer.invoke("whisper-get-status"),

  // Restart AssemblyAI service
  restart: () => ipcRenderer.invoke("whisper-restart"),

  // Secure key management (Electron safeStorage in main process)
  setApiKey: (apiKey: string) =>
    ipcRenderer.invoke("assembly-set-api-key", apiKey),
  clearApiKey: () => ipcRenderer.invoke("assembly-clear-api-key"),
  getApiKeyStatus: () => ipcRenderer.invoke("assembly-get-api-key-status"),

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
      "startRecognition is deprecated. Use audio recording + transcribe instead.",
    );
    return Promise.resolve({
      success: false,
      error: "Use audio recording + transcribe instead",
    });
  },

  stopRecognition: () => {
    console.warn(
      "stopRecognition is deprecated. Use audio recording + transcribe instead.",
    );
    return Promise.resolve({
      success: false,
      error: "Use audio recording + transcribe instead",
    });
  },

  // Legacy event listeners for compatibility
  onTranscriptionResult: (callback: (result: any) => void) => {
    console.warn(
      "onTranscriptionResult is deprecated. Use transcribe method directly.",
    );
    return () => {}; // No-op
  },

  onTranscriptionError: (callback: (error: any) => void) => {
    console.warn(
      "onTranscriptionError is deprecated. Use transcribe method directly.",
    );
    return () => {}; // No-op
  },

  onRecognitionStateChange: (callback: (state: string) => void) => {
    console.warn(
      "onRecognitionStateChange is deprecated. Use transcribe method directly.",
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
    },
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
  condition: DocumentReadyState[] = ["complete", "interactive"],
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

function useLoading() {
  const className = `wingrid-loading`;

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

  let currentTheme: ThemeKey = "cosmic-blue";
  try {
    const savedTheme = (localStorage.getItem("wingrid-color-theme") ||
      localStorage.getItem("wingrid-theme")) as ThemeKey;
    if (savedTheme && THEME_CONFIGS[savedTheme]) {
      currentTheme = savedTheme;
    }
  } catch (error) {
    console.log("Could not read theme from localStorage, using default", error);
  }

  const themeColors = THEME_CONFIGS[currentTheme];

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (result) {
      return `${parseInt(result[1], 16)}, ${parseInt(
        result[2],
        16,
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

  const styleContent = `
:root {
  --theme-primary-400: ${defaultTheme.primary400};
  --theme-primary-500: ${defaultTheme.primary500};
  --theme-primary-600: ${defaultTheme.primary600};
  --theme-primary-700: ${defaultTheme.primary700};
}

.${className} {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #050607;
}
`;

  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");

  oStyle.id = "wingrid-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = `${className}`;
  oDiv.innerHTML = "";

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
