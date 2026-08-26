/**
 * contextIntelligenceService.ts
 *
 * Manages persistent storage, rolling transcript buffer, single-flight locking,
 * debouncing, and LLM call lifecycle for the AI Context Intelligence feature.
 *
 * Performance & Persistence guarantees:
 * - Cards persist in localStorage until the user explicitly deletes them
 * - Single-flight lock (no concurrent requests)
 * - Minimum 4s gap between consecutive API calls (debounced)
 * - Fires when ≥10 NEW words have accumulated since the last call
 * - Card deduplication to prevent duplicate cards and UI re-render spam
 */

import type { AiProvider, AiProducerCard } from "./types";

export type { AiProvider, AiProducerCard };

export type IntelligenceStatus =
  | "idle"
  | "analyzing"
  | "ready"
  | "error"
  | "no-key"
  | "circuit-open"
  | "disabled";

interface ServiceConfig {
  provider: AiProvider;
  debounceMs?: number; // Default: 4000ms
  minNewWords?: number; // Default: 10
  maxCards?: number; // Default: 50
  onCards: (cards: AiProducerCard[]) => void;
  onStatusChange: (status: IntelligenceStatus, detail?: string) => void;
}

interface ServiceState {
  buffer: string;
  wordCountAtLastCall: number;
  debounceTimer: ReturnType<typeof setTimeout> | null;
  status: IntelligenceStatus;
  cards: AiProducerCard[];
  config: ServiceConfig;
  isAnalyzing: boolean;
  lastAnalysisTimestampMs: number;
  mode: "auto" | "manual";
}

const CARDS_STORAGE_KEY = "wingrid:ai-context-cards";
const MODE_STORAGE_KEY = "wingrid:ai-extraction-mode";

function loadPersistedCards(): AiProducerCard[] {
  try {
    const raw = localStorage.getItem(CARDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function savePersistedCards(cards: AiProducerCard[]): void {
  try {
    localStorage.setItem(CARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch {}
}

// Module-level singleton
let _state: ServiceState | null = null;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function setStatus(status: IntelligenceStatus, detail?: string) {
  if (!_state) return;
  _state.status = status;
  _state.config.onStatusChange(status, detail);
}

function getCardKey(card: AiProducerCard): string {
  const primary = (card.headline || (card as any).quote || (card as any).reference || (card as any).item || "").toLowerCase().trim();
  return `${card.type}:${primary}`;
}

function deduplicateCards(existing: AiProducerCard[], incoming: AiProducerCard[], maxCards: number): AiProducerCard[] {
  const seen = new Set(existing.map(getCardKey));
  const newCards: AiProducerCard[] = [];

  for (const inc of incoming) {
    const key = getCardKey(inc);
    if (!seen.has(key)) {
      seen.add(key);
      newCards.push(inc);
    }
  }

  if (newCards.length === 0) return existing;
  // Prepend new cards to the front so the latest generated cards appear first
  return [...newCards, ...existing].slice(0, maxCards);
}

async function runAnalysis() {
  if (!_state || _state.status === "disabled" || _state.isAnalyzing) return;

  const { buffer, config } = _state;
  if (!buffer.trim()) return;

  _state.isAnalyzing = true;
  setStatus("analyzing");

  try {
    const result = await window.contextIntelligenceAPI.analyze({
      provider: config.provider,
      transcript: buffer.slice(-1500),
    });

    if (!_state) return;

    if (!result.success) {
      const errLower = (result.error ?? "").toLowerCase();
      if (errLower.includes("no api key") || errLower.includes("not configured")) {
        setStatus("no-key");
      } else if (errLower.includes("circuit open")) {
        setStatus("circuit-open", result.error);
      } else {
        setStatus("error", result.error);
      }
      return;
    }

    if (result.cards && result.cards.length > 0) {
      const maxCards = config.maxCards ?? 50;
      const merged = deduplicateCards(_state.cards, result.cards, maxCards);
      if (merged !== _state.cards) {
        _state.cards = merged;
        savePersistedCards(merged);
        config.onCards([...merged]);
      }
    }

    setStatus("ready");
  } catch (err) {
    console.error("🧠 [ContextIntelligence] Error during analysis:", err);
    setStatus("error", err instanceof Error ? err.message : String(err));
  } finally {
    if (_state) {
      _state.isAnalyzing = false;
      _state.lastAnalysisTimestampMs = Date.now();
      _state.wordCountAtLastCall = countWords(_state.buffer);
    }
  }
}

function scheduleAnalysis() {
  if (!_state || _state.status === "disabled" || _state.mode === "manual" || _state.isAnalyzing) return;
  const { config } = _state;

  if (_state.debounceTimer !== null) {
    clearTimeout(_state.debounceTimer);
  }

  const debounceMs = config.debounceMs ?? 4_000;
  const minWords = config.minNewWords ?? 10;

  _state.debounceTimer = setTimeout(() => {
    if (!_state || _state.mode === "manual" || _state.isAnalyzing) return;
    const currentWords = countWords(_state.buffer);
    const newWords = currentWords - _state.wordCountAtLastCall;

    if (newWords >= minWords) {
      void runAnalysis();
    }
  }, debounceMs);
}

/**
 * Initialize or reconfigure the intelligence service.
 */
export function initContextIntelligenceService(config: ServiceConfig): void {
  const existingCards = _state?.cards && _state.cards.length > 0 ? _state.cards : loadPersistedCards();
  const savedMode = (localStorage.getItem(MODE_STORAGE_KEY) as "auto" | "manual") || "auto";

  if (_state?.debounceTimer) {
    clearTimeout(_state.debounceTimer);
  }

  _state = {
    buffer: _state?.buffer ?? "",
    wordCountAtLastCall: 0,
    debounceTimer: null,
    status: "idle",
    cards: existingCards,
    config,
    isAnalyzing: false,
    lastAnalysisTimestampMs: 0,
    mode: savedMode,
  };
}

/**
 * Feed a new incoming transcript chunk into the service buffer.
 */
export function feedTranscript(incomingChunk: string): void {
  if (!_state || _state.status === "disabled") return;
  const trimmed = incomingChunk.trim();
  if (!trimmed) return;

  const current = _state.buffer;
  if (current.endsWith(trimmed)) {
    return;
  }

  _state.buffer = (current ? current + " " + trimmed : trimmed).slice(-2500);
  scheduleAnalysis();
}

/**
 * Get current in-memory cards.
 */
export function getCards(): AiProducerCard[] {
  return _state?.cards ? [..._state.cards] : loadPersistedCards();
}

/**
 * Get current status.
 */
export function getStatus(): IntelligenceStatus {
  return _state?.status ?? "idle";
}

/**
 * Get the current extraction mode.
 */
export function getExtractionMode(): "auto" | "manual" {
  if (_state?.mode) return _state.mode;
  try {
    return (localStorage.getItem(MODE_STORAGE_KEY) as "auto" | "manual") || "auto";
  } catch {
    return "auto";
  }
}

/**
 * Set extraction mode: "auto" (AI picks continuously) or "manual" (user controlled).
 */
export function setExtractionMode(mode: "auto" | "manual"): void {
  if (!_state) return;
  _state.mode = mode;
  try {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  } catch {}
  if (mode === "manual" && _state.debounceTimer) {
    clearTimeout(_state.debounceTimer);
    _state.debounceTimer = null;
  }
}

/**
 * Dismiss a single card by index and persist the deletion.
 */
export function dismissCard(index: number): AiProducerCard[] {
  if (!_state) return [];
  _state.cards = _state.cards.filter((_, i) => i !== index);
  savePersistedCards(_state.cards);
  return [..._state.cards];
}

/**
 * Clear all cards and remove them from persistent storage.
 */
export function clearAllCards(): void {
  if (!_state) return;
  _state.cards = [];
  savePersistedCards([]);
  _state.wordCountAtLastCall = countWords(_state.buffer);
}

/**
 * Enable or disable the service (pauses analysis).
 */
export function setDisabled(disabled: boolean): void {
  if (!_state) return;
  _state.status = disabled ? "disabled" : "idle";
}

/**
 * Immediately analyze any text (e.g. from the input field) and generate cards on demand.
 */
export async function generateFromCustomText(text: string): Promise<void> {
  if (!_state || !text.trim() || _state.isAnalyzing) return;
  _state.buffer = text.trim();
  await runAnalysis();
}

/**
 * Full teardown of the service singleton.
 */
export function destroyContextIntelligenceService(): void {
  if (_state?.debounceTimer) {
    clearTimeout(_state.debounceTimer);
  }
  _state = null;
}
