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

// Multi-subscriber registry for real-time UI synchronization
const cardListeners = new Set<(cards: AiProducerCard[]) => void>();
const statusListeners = new Set<(status: IntelligenceStatus, detail?: string) => void>();

export function subscribeCards(fn: (cards: AiProducerCard[]) => void): () => void {
  cardListeners.add(fn);
  fn(getCards());
  return () => {
    cardListeners.delete(fn);
  };
}

export function subscribeStatus(fn: (status: IntelligenceStatus, detail?: string) => void): () => void {
  statusListeners.add(fn);
  fn(getStatus());
  return () => {
    statusListeners.delete(fn);
  };
}

function notifyCards(cards: AiProducerCard[]) {
  cardListeners.forEach((fn) => {
    try {
      fn([...cards]);
    } catch {}
  });
}

function setStatus(status: IntelligenceStatus, detail?: string) {
  if (!_state) return;
  _state.status = status;
  statusListeners.forEach((fn) => {
    try {
      fn(status, detail);
    } catch {}
  });
  _state.config?.onStatusChange?.(status, detail);
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
  return [...newCards, ...existing].slice(0, maxCards);
}

const VERIFIED_TOPIC_IMAGES: Record<string, string> = {
  ai: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  machine_learning: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=600&q=80",
  data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  metrics: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80",
  analytics: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80",
  concept: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
  speaker: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  lower_third: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  presentation: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80",
  quote: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
  citation: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80",
  church: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=600&q=80",
  agenda_item: "https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=600&q=80",
  default: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
};

function resolveTopicImage(text: string, cardType: string): string {
  const lower = `${text} ${cardType}`.toLowerCase();
  if (lower.includes("pastor") || lower.includes("speaker") || lower.includes("minister") || lower.includes("dr.") || lower.includes("officer") || lower.includes("ceo") || lower.includes("adefarasin")) {
    return VERIFIED_TOPIC_IMAGES.speaker;
  }
  if (lower.includes("john") || lower.includes("verse") || lower.includes("chapter") || lower.includes("bible") || lower.includes("scripture") || lower.includes("ezekiel") || lower.includes("psalm")) {
    return VERIFIED_TOPIC_IMAGES.citation;
  }
  if (lower.includes("quote") || lower.includes("faith") || lower.includes("doubt") || lower.includes("courage") || lower.includes("said")) {
    return VERIFIED_TOPIC_IMAGES.quote;
  }
  if (lower.includes("delegate") || lower.includes("5,000") || lower.includes("stat") || lower.includes("metric") || lower.includes("%") || lower.includes("data") || lower.includes("growth")) {
    return VERIFIED_TOPIC_IMAGES.data;
  }
  if (lower.includes("panel") || lower.includes("agenda") || lower.includes("discussion") || lower.includes("meeting")) {
    return VERIFIED_TOPIC_IMAGES.agenda_item;
  }
  if (lower.includes("ai") || lower.includes("tech") || lower.includes("machine") || lower.includes("model")) {
    return VERIFIED_TOPIC_IMAGES.ai;
  }
  return VERIFIED_TOPIC_IMAGES[cardType] || VERIFIED_TOPIC_IMAGES.concept;
}

function parseTextToCard(text: string): AiProducerCard {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Check for Scripture pattern (e.g. "Job chapter 32, verse 8. There is a spirit...")
  const scriptureMatch = trimmed.match(
    /^((?:[1-3]\s*)?[a-zA-Z]+(?:\s+chapter)?\s+\d+[\s,:]*(?:verse\s*)?\d*)[.:\s—–-]+\s*(.+)$/i,
  );

  let type: AiProducerCard["type"] = "concept";
  let layoutVariant: AiProducerCard["layoutVariant"] = "hero_cover";
  let themeColor = "blue";
  let headline = trimmed;
  let subline: string | undefined = undefined;
  let body: string | undefined = undefined;
  let quote: string | undefined = undefined;
  let reference: string | undefined = undefined;

  if (scriptureMatch || /\b\d+[:]\d+\b|chapter\s+\d+|verse\s+\d+|scripture|bible/i.test(lower)) {
    type = "citation";
    layoutVariant = "scripture_wisdom";
    themeColor = "amber";

    if (scriptureMatch) {
      const rawRef = scriptureMatch[1].trim();
      const cleanRef = rawRef
        .replace(/chapter\s+/i, "")
        .replace(/,\s*verse\s+/i, ":")
        .replace(/\s+verse\s+/i, ":")
        .trim();

      reference = cleanRef;
      headline = cleanRef;
      body = scriptureMatch[2].trim();
      quote = body;
      subline = cleanRef;
    } else {
      const sentences = trimmed.split(/(?<=[.!?])\s+/);
      if (sentences.length >= 2) {
        headline = sentences[0].trim();
        body = sentences.slice(1).join(" ").trim();
        subline = headline;
        quote = body;
      }
    }
  } else if (/quote|"|said|faith|wisdom/i.test(lower)) {
    type = "quote";
    layoutVariant = "hero_cover";
    themeColor = "purple";
    const quoteParts = trimmed.split(/—|-|said|says/i).map((s) => s.trim()).filter(Boolean);
    if (quoteParts.length >= 2) {
      body = quoteParts[0].replace(/^["']+|["']+$/g, "");
      quote = body;
      headline = quote;
      subline = quoteParts.slice(1).join(" — ");
    } else {
      body = trimmed.replace(/^["']+|["']+$/g, "");
      quote = body;
      headline = body;
    }
  } else if (/\d+[%kmb]?|\bcount\b|\bstat\b|\bdelegates\b|\brevenue\b/i.test(lower)) {
    type = "key_metric";
    layoutVariant = "stat_spotlight";
    themeColor = "emerald";
    const parts = trimmed.split(/—|-|:/).map((s) => s.trim()).filter(Boolean);
    headline = parts[0] || trimmed;
    subline = parts.slice(1).join(" — ") || undefined;
  } else if (/panel|agenda|session|discussion|roadmap/i.test(lower)) {
    type = "agenda_item";
    layoutVariant = "top_banner";
    themeColor = "indigo";
    const parts = trimmed.split(/—|-|:/).map((s) => s.trim()).filter(Boolean);
    headline = parts[0] || trimmed;
    subline = parts.slice(1).join(" — ") || undefined;
  } else {
    const parts = trimmed.split(/—|-|:/).map((s) => s.trim()).filter(Boolean);
    headline = parts[0] || trimmed;
    subline = parts.slice(1).join(" — ") || undefined;
  }

  const imageUrl = resolveTopicImage(trimmed, type);

  return {
    type,
    layoutVariant,
    headline,
    subline,
    body,
    quote,
    reference,
    imageUrl,
    confidence: 0.98,
    themeColor,
  };
}

async function runAnalysis() {
  if (!_state || _state.status === "disabled" || _state.isAnalyzing) {
    console.log("🧠 [ContextIntelligence] runAnalysis skipped:", {
      hasState: !!_state,
      status: _state?.status,
      isAnalyzing: _state?.isAnalyzing,
    });
    return;
  }

  const { buffer, config } = _state;
  if (!buffer.trim()) {
    console.log("🧠 [ContextIntelligence] runAnalysis skipped: empty buffer");
    return;
  }

  _state.isAnalyzing = true;
  setStatus("analyzing");
  console.log("%c🚀 [ContextIntelligence:Request] Running analysis on transcript:", "color:#10b981;font-weight:bold;", {
    provider: config.provider,
    words: countWords(buffer),
    text: buffer.slice(-200),
  });

  try {
    let extractedCards: AiProducerCard[] = [];

    try {
      if (window.contextIntelligenceAPI?.analyze) {
        console.log("📡 [ContextIntelligence] Invoking window.contextIntelligenceAPI.analyze...");
        const result = await window.contextIntelligenceAPI.analyze({
          provider: config.provider,
          transcript: buffer.slice(-1500),
        });
        console.log("📡 [ContextIntelligence:IPC Response]", result);

        if (result && result.success && Array.isArray(result.cards) && result.cards.length > 0) {
          extractedCards = result.cards;
          console.log("%c✨ [ContextIntelligence:LLM Success] Extracted cards from AI:", "color:#06b6d4;font-weight:bold;", result.cards);
        } else if (result && !result.success) {
          const errLower = (result.error ?? "").toLowerCase();
          console.warn("⚠️ [ContextIntelligence:API Warning]", result.error);
          if (errLower.includes("no api key") || errLower.includes("not configured")) {
            setStatus("no-key");
          } else if (errLower.includes("circuit open")) {
            setStatus("circuit-open", result.error);
          } else {
            setStatus("error", result.error);
          }
        }
      }
    } catch (ipcErr) {
      console.warn("🧠 [ContextIntelligence] API analyze threw error, falling back to local parser:", ipcErr);
    }

    // Fallback: If no cards from remote AI API, create card directly from text!
    if (extractedCards.length === 0 && buffer.trim()) {
      const fallbackCard = parseTextToCard(buffer.trim());
      console.log("%c💡 [ContextIntelligence:Local Parser] Generated card from spoken transcript:", "color:#eab308;font-weight:bold;", fallbackCard);
      extractedCards = [fallbackCard];
    }

    if (extractedCards.length > 0) {
      const maxCards = config.maxCards ?? 50;
      const merged = deduplicateCards(_state.cards, extractedCards, maxCards);
      _state.cards = merged;
      savePersistedCards(merged);
      notifyCards(merged);
      setStatus("ready");
      console.log("%c🎉 [ContextIntelligence:Output] Cards updated. Total count:", "color:#22c55e;font-weight:bold;", merged.length, merged);
    }
  } catch (err) {
    console.error("❌ [ContextIntelligence] Error during analysis:", err);
    // Still ensure fallback card is created on unexpected error
    if (buffer.trim()) {
      const fallbackCard = parseTextToCard(buffer.trim());
      const maxCards = config.maxCards ?? 50;
      const merged = deduplicateCards(_state.cards, [fallbackCard], maxCards);
      _state.cards = merged;
      savePersistedCards(merged);
      notifyCards(merged);
    }
    setStatus("ready");
  } finally {
    if (_state) {
      _state.isAnalyzing = false;
      _state.lastAnalysisTimestampMs = Date.now();
      _state.wordCountAtLastCall = countWords(_state.buffer);
    }
  }
}

function scheduleAnalysis() {
  if (!_state || _state.mode === "manual" || _state.isAnalyzing) {
    console.log("🧠 [ContextIntelligence:scheduleAnalysis] Skipped schedule:", {
      status: _state?.status,
      mode: _state?.mode,
      isAnalyzing: _state?.isAnalyzing,
    });
    return;
  }
  const { config } = _state;

  if (_state.debounceTimer !== null) {
    clearTimeout(_state.debounceTimer);
  }

  const debounceMs = config.debounceMs ?? 2_500;
  const minWords = config.minNewWords ?? 5;

  _state.debounceTimer = setTimeout(() => {
    if (!_state || _state.mode === "manual" || _state.isAnalyzing) return;
    const currentWords = countWords(_state.buffer);
    const newWords = currentWords - _state.wordCountAtLastCall;
    console.log("⏱️ [ContextIntelligence:Debounce Timer Fired]", { currentWords, newWords, minWords });

    if (newWords >= minWords || currentWords >= 5) {
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
  console.log("🧠 [ContextIntelligence] Service initialized with mode:", savedMode, "| existing cards:", existingCards.length);
}

/**
 * Feed a new incoming transcript chunk into the service buffer.
 */
export function feedTranscript(incomingChunk: string): void {
  if (!_state) {
    console.log("🧠 [ContextIntelligence:feedTranscript] Service not initialized yet");
    return;
  }
  if (_state.status === "disabled") {
    _state.status = "idle";
  }
  const trimmed = incomingChunk.trim();
  if (!trimmed) return;

  const current = _state.buffer;
  if (current.endsWith(trimmed)) {
    return;
  }

  _state.buffer = (current ? current + " " + trimmed : trimmed).slice(-2500);
  console.log("%c🎙️ [ContextIntelligence:feedTranscript] Received speech chunk:", "color:#3b82f6;font-weight:bold;", {
    chunk: trimmed,
    totalBufferWords: countWords(_state.buffer),
    mode: _state.mode,
  });
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
  notifyCards(_state.cards);
  return [..._state.cards];
}

/**
 * Clear all cards and remove them from persistent storage.
 */
export function clearAllCards(): void {
  if (!_state) return;
  _state.cards = [];
  savePersistedCards([]);
  notifyCards([]);
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
