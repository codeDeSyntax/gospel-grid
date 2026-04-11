export const CAPTIONS_FEATURE_WINDOW_ID = "feature:captions-window";
export const FEATURE_CAPTIONS_STORAGE_KEY = "wingrid.featureCaptionsState";
export const FEATURE_CAPTIONS_EVENT = "wingrid:feature-captions-updated";
export const CAPTIONS_RECENT_WORD_LIMIT = 20;

export interface FeatureCaptionsState {
  text: string;
  isStreaming: boolean;
  isPaused: boolean;
  updatedAtMs: number;
  lastError: string | null;
}

export const createDefaultFeatureCaptionsState = (): FeatureCaptionsState => ({
  text: "",
  isStreaming: false,
  isPaused: false,
  updatedAtMs: Date.now(),
  lastError: null,
});

export function normalizeFeatureCaptionsState(
  value: Partial<FeatureCaptionsState> | null | undefined,
): FeatureCaptionsState {
  const base = createDefaultFeatureCaptionsState();

  return {
    text: typeof value?.text === "string" ? value.text : base.text,
    isStreaming:
      typeof value?.isStreaming === "boolean"
        ? value.isStreaming
        : base.isStreaming,
    isPaused:
      typeof value?.isPaused === "boolean" ? value.isPaused : base.isPaused,
    updatedAtMs:
      typeof value?.updatedAtMs === "number" &&
      Number.isFinite(value.updatedAtMs)
        ? value.updatedAtMs
        : Date.now(),
    lastError:
      typeof value?.lastError === "string"
        ? value.lastError
        : value?.lastError === null
          ? null
          : base.lastError,
  };
}

export function loadFeatureCaptionsState(): FeatureCaptionsState {
  try {
    const raw = localStorage.getItem(FEATURE_CAPTIONS_STORAGE_KEY);
    if (!raw) return createDefaultFeatureCaptionsState();
    return normalizeFeatureCaptionsState(JSON.parse(raw));
  } catch {
    return createDefaultFeatureCaptionsState();
  }
}

export function saveFeatureCaptionsState(next: FeatureCaptionsState): void {
  const normalized = normalizeFeatureCaptionsState(next);
  localStorage.setItem(
    FEATURE_CAPTIONS_STORAGE_KEY,
    JSON.stringify(normalized),
  );
  window.dispatchEvent(
    new CustomEvent(FEATURE_CAPTIONS_EVENT, {
      detail: normalized,
    }),
  );
}

function tokenizeWords(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function mergeRecentCaptionWords(
  currentText: string,
  incomingText: string,
  maxWords = CAPTIONS_RECENT_WORD_LIMIT,
): string {
  const currentWords = tokenizeWords(currentText);
  const incomingWords = tokenizeWords(incomingText);

  if (incomingWords.length === 0) {
    return currentWords.slice(-maxWords).join(" ");
  }

  const normalizedCurrent = currentWords.join(" ").toLowerCase();
  const normalizedIncoming = incomingWords.join(" ").toLowerCase();

  if (normalizedCurrent.endsWith(normalizedIncoming)) {
    return currentWords.slice(-maxWords).join(" ");
  }

  return [...currentWords, ...incomingWords].slice(-maxWords).join(" ");
}
