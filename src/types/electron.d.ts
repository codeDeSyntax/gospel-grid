// Window control API types
export interface WindowControls {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  isMinimized: () => Promise<boolean>;
  relaunch: () => Promise<void>;
}

// Window enumeration API types
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectedDisplay {
  id: number;
  label: string;
  isPrimary: boolean;
  internal: boolean;
  bounds: WindowBounds;
  scaleFactor: number;
  rotation: number;
}

export interface RemoteScreenDevice {
  id: string;
  name: string;
  appVersion: string;
  connectedAt: string;
  lastSeenAt: string;
}

export interface RemoteScreenNearbyDevice {
  deviceId: string;
  name: string;
  appVersion: string;
  address: string;
  signalingPort: number;
  connectUrl: string;
  lastSeenAt: string;
}

export interface RemoteScreenStatus {
  isRunning: boolean;
  host: string;
  port: number;
  devices: RemoteScreenDevice[];
  nearbyDevices?: RemoteScreenNearbyDevice[];
  client?: {
    isConnected: boolean;
    isConnecting: boolean;
    serverUrl: string | null;
    localDevice: RemoteScreenDevice | null;
    devices: RemoteScreenDevice[];
    lastError: string | null;
  };
}

export interface RemoteScreenViewRequest {
  request: {
    id: string;
    fromDeviceId: string;
    toDeviceId: string;
    status: "pending" | "accepted" | "denied" | "expired" | "confirmed" | "ready";
    /** One-time token included when status === 'accepted'; PC A must echo it back to confirm. */
    confirmationToken: string;
    createdAt: string;
    expiresAt: string;
    resolvedAt?: string;
  };
  fromDevice: RemoteScreenDevice | null;
}

export interface RemoteScreenResult<T = unknown> {
  success: boolean;
  error?: string;
  status?: RemoteScreenStatus;
  devices?: RemoteScreenDevice[];
  data?: T;
}

export interface RemoteScreenAPI {
  getStatus: () => Promise<RemoteScreenResult>;
  startSignaling: (options?: {
    host?: string;
    port?: number;
  }) => Promise<RemoteScreenResult>;
  stopSignaling: () => Promise<RemoteScreenResult>;
  connectClient: (serverUrl: string) => Promise<RemoteScreenResult>;
  disconnectClient: () => Promise<RemoteScreenResult>;
  listDevices: () => Promise<RemoteScreenResult>;
  listNearbyDevices: () => Promise<RemoteScreenResult & { devices?: RemoteScreenNearbyDevice[] }>;
  requestView: (deviceId: string) => Promise<RemoteScreenResult>;
  acceptViewRequest: (requestId: string) => Promise<RemoteScreenResult>;
  denyViewRequest: (requestId: string) => Promise<RemoteScreenResult>;
  confirmView: (requestId: string, confirmationToken: string) => Promise<RemoteScreenResult>;
  sendSignal: (deviceId: string, signal: unknown) => Promise<RemoteScreenResult>;
  endSession: (deviceId: string, reason?: string) => Promise<RemoteScreenResult>;
  onStatusChanged: (callback: (status: RemoteScreenStatus) => void) => () => void;
  onDevicesChanged: (callback: (devices: RemoteScreenDevice[]) => void) => () => void;
  onNearbyDevicesChanged: (callback: (devices: RemoteScreenNearbyDevice[]) => void) => () => void;
  onDiscoveryError: (callback: (payload: { error: string }) => void) => () => void;
  onIncomingRequest: (callback: (request: RemoteScreenViewRequest) => void) => () => void;
  onRequestAccepted: (callback: (request: RemoteScreenViewRequest) => void) => () => void;
  onRequestDenied: (callback: (request: RemoteScreenViewRequest) => void) => () => void;
  onRequestReady: (callback: (request: RemoteScreenViewRequest) => void) => () => void;
  onSignal: (callback: (signal: unknown) => void) => () => void;
  onSessionEnded: (callback: (event: unknown) => void) => () => void;
}

export interface EnumerateWindowsOptions {
  includeMinimized?: boolean;
  includeSystemWindows?: boolean;
  captureThumbnails?: boolean;
}

export interface WindowEnumerationResult {
  success: boolean;
  windows?: Array<{
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
    bounds: WindowBounds;
    icon?: string;
    parentHandle?: number;
    hasChildren?: boolean;
    zOrder?: number;
    thumbnail?: string;
  }>;
  error?: string;
}

export interface WindowOperationResult {
  success: boolean;
  error?: string;
  icon?: string;
  thumbnail?: string;
}

export interface DesktopCaptureSource {
  id: string;
  name: string;
  display_id?: string;
  thumbnail?: string | null;
  appIcon?: string | null;
}

export interface ElectronAPI {
  enumerateWindows: (
    options: EnumerateWindowsOptions,
  ) => Promise<WindowEnumerationResult>;
  getWindowIcon: (handle: number) => Promise<WindowOperationResult>;
  getWindowThumbnail: (handle: number) => Promise<WindowOperationResult>;
  getDesktopSources: (options: {
    types: Array<"screen" | "window">;
    thumbnailSize?: { width: number; height: number };
    fetchWindowIcons?: boolean;
  }) => Promise<DesktopCaptureSource[]>;
  focusWindow: (handle: number) => Promise<WindowOperationResult>;
  minimizeWindow: (handle: number) => Promise<WindowOperationResult>;
  maximizeWindow: (handle: number) => Promise<WindowOperationResult>;
  closeWindow: (handle: number) => Promise<WindowOperationResult>;
  showWindow: (handle: number) => Promise<WindowOperationResult>;
  hideWindow: (handle: number) => Promise<WindowOperationResult>;
  moveWindow: (
    handle: number,
    bounds: WindowBounds,
  ) => Promise<WindowOperationResult>;
  getConnectedDisplays: () => Promise<{
    success: boolean;
    displays: ConnectedDisplay[];
    error?: string;
  }>;
  publishLayout: (layoutData: {
    windows: any[];
    layout: string;
    focusedWindowId: string | null;
    publishedQuality?: { contrast: number; brightness: number };
    captureQuality?: number;
    displayId?: number;
  }) => Promise<{ success: boolean; windowId?: number; error?: string }>;
  updatePublishedLayout: (layoutData: {
    windows: any[];
    layout: string;
    focusedWindowId: string | null;
    publishedQuality?: { contrast: number; brightness: number };
    captureQuality?: number;
    displayId?: number;
    layoutId?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  getPublishedLayout: (layoutId: string) => Promise<any | null>;
  checkPublishedWindows: () => Promise<{
    hasActivePublications: boolean;
    count: number;
    publications: Array<{
      layoutId: string;
      displayId: number | null;
      windowId: number | null;
      isPublished: boolean;
    }>;
  }>;
  closePublishedWindows: (displayId?: number) => Promise<{
    success: boolean;
    closedCount?: number;
    error?: string;
  }>;

  // capturePage — snapshot projection window
  captureProjectionPage: () => Promise<{
    success: boolean;
    dataUrl?: string;
    width?: number;
    height?: number;
    error?: string;
  }>;

  // Tray action events
  onTrayAction: (callback: (action: string) => void) => () => void;
  onPublishedLayoutUpdated: (callback: (payload: any) => void) => () => void;
  updateProjectionState?: (state: {
    isBlackout?: boolean;
    isFrozen?: boolean;
    overlayText?: string;
    overlayVisible?: boolean;
    targetDisplayId?: number | null;
  }) => Promise<any>;
  batchCaptureThumbnails?: (
    windowIds: string[],
    options?: any,
  ) => Promise<{
    success: boolean;
    thumbnails?: Array<{ windowId: string; dataUrl: string; title?: string }>;
    error?: string;
  }>;

  remoteScreen: RemoteScreenAPI;
}

// Extend the global Window interface to include our APIs
// Speech to Text API types
export interface TranscriptionOptions {
  language?: string;
  task?: "transcribe" | "translate";
  isLast?: boolean; // For streaming transcription
}

export interface TranscriptionResult {
  success: boolean;
  text?: string;
  processingTime?: number;
  error?: string;
}

export interface WhisperStatus {
  isConnected: boolean;
  isConnecting: boolean;
  sessionId?: string;
}

export interface WhisperStatusResult {
  success: boolean;
  status?: WhisperStatus;
  error?: string;
}

export interface SpeechToTextAPI {
  transcribe: (
    audioBuffer: ArrayBuffer,
    options?: TranscriptionOptions,
  ) => Promise<TranscriptionResult>;
  transcribeStream: (
    audioBuffer: ArrayBuffer,
    options?: TranscriptionOptions,
  ) => Promise<TranscriptionResult>;

  // AssemblyAI streaming controls
  startStreaming: (options?: {
    sampleRate?: number;
  }) => Promise<{ success: boolean; error?: string }>;
  sendStreamingAudio: (
    audioBuffer: ArrayBuffer,
  ) => Promise<{ success: boolean; error?: string }>;
  stopStreaming: () => Promise<{ success: boolean; error?: string }>;

  getSupportedLanguages: () => Promise<{
    success: boolean;
    languages?: Array<{ code: string; name: string }>;
    error?: string;
  }>;
  getStatus: () => Promise<WhisperStatusResult>;
  restart: () => Promise<{ success: boolean; error?: string }>;
  setApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  clearApiKey: () => Promise<{ success: boolean; error?: string }>;
  getApiKeyStatus: () => Promise<{
    success: boolean;
    hasKey?: boolean;
    source?: "env" | "secure-storage" | "none";
    safeStorageAvailable?: boolean;
    error?: string;
  }>;
  onWhisperStatus: (callback: (status: any) => void) => () => void;

  // Real-time speech result callback (for AssemblyAI streaming)
  onSpeechResult?: (
    callback: (result: {
      success: boolean;
      text?: string;
      confidence?: number;
      isFinal?: boolean;
      error?: string;
    }) => void,
  ) => () => void;
}

export interface ContextIntelligenceKeyStatus {
  success: boolean;
  openai?: boolean;
  groq?: boolean;
  gemini?: boolean;
  safeStorageAvailable?: boolean;
  error?: string;
}

export interface ContextIntelligenceAnalyzeResult {
  success: boolean;
  cards?: any[];
  error?: string;
}

export interface ContextIntelligenceAPI {
  setKey: (provider: string, apiKey: string) => Promise<{ success: boolean; error?: string }>;
  clearKey: (provider: string) => Promise<{ success: boolean; error?: string }>;
  getKeyStatus: () => Promise<ContextIntelligenceKeyStatus>;
  analyze: (payload: { provider: string; transcript: string }) => Promise<ContextIntelligenceAnalyzeResult>;
  test: (provider: string) => Promise<ContextIntelligenceAnalyzeResult>;
}

declare global {
  interface Window {
    windowControls: WindowControls;
    electronAPI: ElectronAPI;
    speechToTextAPI: SpeechToTextAPI;
    contextIntelligenceAPI: ContextIntelligenceAPI;
    ipcRenderer: {
      on: (
        channel: string,
        listener: (event: any, ...args: any[]) => void,
      ) => void;
      off: (channel: string, ...args: any[]) => void;
      send: (channel: string, ...args: any[]) => void;
      invoke: (channel: string, ...args: any[]) => Promise<any>;
    };
  }
}

export {};
