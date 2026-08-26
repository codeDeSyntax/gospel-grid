import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setOverlayText, setOverlayVisible } from "@/store/slices/appSlice";
import type { AiProducerCard } from "@/services/ai/types";
import type { AiProvider } from "@/services/ai/types";
import type { IntelligenceStatus } from "@/services/ai/contextIntelligenceService";
import {
  initContextIntelligenceService,
  feedTranscript,
  getCards,
  getStatus,
  getExtractionMode,
  setExtractionMode,
  dismissCard as dismissCardFromService,
  clearAllCards as clearAllFromService,
  generateFromCustomText,
  setDisabled,
  destroyContextIntelligenceService,
} from "@/services/ai/contextIntelligenceService";

export interface UseContextIntelligenceOptions {
  provider: AiProvider;
  enabled?: boolean;
}

export interface UseContextIntelligenceReturn {
  cards: AiProducerCard[];
  status: IntelligenceStatus;
  mode: "auto" | "manual";
  setMode: (mode: "auto" | "manual") => void;
  dismissCard: (index: number) => void;
  clearCards: () => void;
  pushCardToOverlay: (card: AiProducerCard) => void;
  generateFromText: (text: string) => Promise<void>;
}

export function useContextIntelligence({
  provider,
  enabled = true,
}: UseContextIntelligenceOptions): UseContextIntelligenceReturn {
  const dispatch = useAppDispatch();
  const [cards, setCards] = useState<AiProducerCard[]>([]);
  const [status, setStatus] = useState<IntelligenceStatus>("idle");
  const [mode, setModeState] = useState<"auto" | "manual">(() => getExtractionMode());

  const setMode = useCallback((nextMode: "auto" | "manual") => {
    setExtractionMode(nextMode);
    setModeState(nextMode);
  }, []);

  // Keep provider ref fresh for service config
  const providerRef = useRef<AiProvider>(provider);
  providerRef.current = provider;

  // ── Initialize service ─────────────────────────────────────────────────────
  useEffect(() => {
    initContextIntelligenceService({
      provider: providerRef.current,
      debounceMs: 4_000,
      minNewWords: 10,
      maxCards: 50,
      onCards: (updated) => setCards(updated),
      onStatusChange: (s) => setStatus(s),
    });

    // Sync initial state
    setCards(getCards());
    setStatus(getStatus());

    return () => {
      destroyContextIntelligenceService();
    };
  }, []); // Only on mount/unmount — provider changes handled below

  // ── React to provider changes ──────────────────────────────────────────────
  useEffect(() => {
    initContextIntelligenceService({
      provider,
      debounceMs: 4_000,
      minNewWords: 10,
      maxCards: 50,
      onCards: (updated) => setCards(updated),
      onStatusChange: (s) => setStatus(s),
    });
  }, [provider]);

  // ── React to enabled toggle ────────────────────────────────────────────────
  useEffect(() => {
    setDisabled(!enabled);
  }, [enabled]);

  // ── Subscribe to live speech results ───────────────────────────────────────
  useEffect(() => {
    const offSpeech = window.speechToTextAPI?.onSpeechResult?.((result) => {
      if (result?.success && result?.text?.trim()) {
        feedTranscript(result.text.trim());
      }
    });

    return () => {
      offSpeech?.();
    };
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const dismissCard = useCallback((index: number) => {
    const updated = dismissCardFromService(index);
    setCards(updated);
  }, []);

  const clearCards = useCallback(() => {
    clearAllFromService();
    setCards([]);
  }, []);

  const pushCardToOverlay = useCallback((card: AiProducerCard) => {
    // Build overlay text/html/json from card content
    let text = "";
    if (card.layoutVariant || (card.blocks && card.blocks.length > 0)) {
      text = JSON.stringify(card);
    } else if (card.htmlCode && card.htmlCode.trim().length > 0) {
      text = card.htmlCode.trim();
    } else {
      switch (card.type) {
        case "lower_third":
        case "key_metric":
        case "custom_ui":
          text = `${card.headline || ""}${card.subline ? `\n${card.subline}` : ""}`;
          break;
        case "quote":
          text = card.attribution
            ? `"${card.quote || card.headline || ""}"\n— ${card.attribution}`
            : `"${card.quote || card.headline || ""}"`;
          break;
        case "citation":
          text = card.body
            ? `${card.reference || card.headline || ""}\n${card.body}`
            : (card.reference || card.headline || "");
          break;
        case "agenda_item":
          text = `▶ ${card.item || card.headline || ""}`;
          break;
        default:
          text = card.headline || "";
      }
    }

    // Push to Redux store
    dispatch(setOverlayText(text));
    dispatch(setOverlayVisible(true));

    // Also notify main process overlay state
    const api = window.electronAPI as any;
    api?.updateProjectionState?.({ overlayText: text, overlayVisible: true })
      ?.catch(() => {});
  }, [dispatch]);

  const generateFromText = useCallback(async (text: string) => {
    await generateFromCustomText(text);
  }, []);

  return { cards, status, mode, setMode, dismissCard, clearCards, pushCardToOverlay, generateFromText };
}
