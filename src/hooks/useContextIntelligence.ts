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
  subscribeCards,
  subscribeStatus,
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
  hideOverlay: () => void;
  generateFromText: (text: string) => Promise<void>;
}

export function useContextIntelligence({
  provider,
  enabled = true,
}: UseContextIntelligenceOptions): UseContextIntelligenceReturn {
  const dispatch = useAppDispatch();
  const [cards, setCards] = useState<AiProducerCard[]>(() => getCards());
  const [status, setStatus] = useState<IntelligenceStatus>(() => getStatus());
  const [mode, setModeState] = useState<"auto" | "manual">(() => getExtractionMode());

  const setMode = useCallback((nextMode: "auto" | "manual") => {
    setExtractionMode(nextMode);
    setModeState(nextMode);
  }, []);

  // Keep provider ref fresh for service config
  const providerRef = useRef<AiProvider>(provider);
  providerRef.current = provider;

  // ── Multi-subscriber Card & Status Sync ─────────────────────────────────────
  useEffect(() => {
    const unsubCards = subscribeCards((updated) => setCards(updated));
    const unsubStatus = subscribeStatus((s) => setStatus(s));
    return () => {
      unsubCards();
      unsubStatus();
    };
  }, []);

  // ── Initialize service ─────────────────────────────────────────────────────
  useEffect(() => {
    initContextIntelligenceService({
      provider: providerRef.current,
      debounceMs: 2_500,
      minNewWords: 5,
      maxCards: 50,
      onCards: (updated) => setCards(updated),
      onStatusChange: (s) => setStatus(s),
    });
  }, []); // Only on mount

  // ── React to provider changes ──────────────────────────────────────────────
  useEffect(() => {
    initContextIntelligenceService({
      provider,
      debounceMs: 2_500,
      minNewWords: 5,
      maxCards: 50,
      onCards: (updated) => setCards(updated),
      onStatusChange: (s) => setStatus(s),
    });
  }, [provider]);

  // ── React to enabled toggle ────────────────────────────────────────────────
  useEffect(() => {
    if (enabled) {
      setDisabled(false);
    }
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
    dismissCardFromService(index);
  }, []);

  const clearCards = useCallback(() => {
    clearAllFromService();
  }, []);

  const pushCardToOverlay = useCallback((card: AiProducerCard) => {
    // Push the full card as JSON so DynamicBroadcastCard renders with rich verified styling
    const text = JSON.stringify(card);

    // Push to Redux store
    dispatch(setOverlayText(text));
    dispatch(setOverlayVisible(true));

    // Also notify main process overlay state
    const api = window.electronAPI as any;
    api?.updateProjectionState?.({ overlayText: text, overlayVisible: true })
      ?.catch(() => {});
  }, [dispatch]);

  const hideOverlay = useCallback(() => {
    dispatch(setOverlayVisible(false));
    const api = window.electronAPI as any;
    api?.updateProjectionState?.({ overlayVisible: false })?.catch(() => {});
  }, [dispatch]);

  const generateFromText = useCallback(async (text: string) => {
    await generateFromCustomText(text);
  }, []);

  return { cards, status, mode, setMode, dismissCard, clearCards, pushCardToOverlay, hideOverlay, generateFromText };
}
