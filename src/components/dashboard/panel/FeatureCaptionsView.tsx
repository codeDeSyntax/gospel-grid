import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Sparkles,
  Send,
  EyeOff,
  Copy,
  Check,
  CornerDownLeft,
  Loader2,
  Trash2,
  Radio,
  ArrowUp,
  X,
  Tv,
  Square,
  Plus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { replaceCaptionsState } from "@/store/slices/captionsSlice";
import { setOverlayText, setOverlayVisible } from "@/store/slices/appSlice";
import { startRendererMicStreaming } from "@/components/dashboard/audio/micCapture";
import {
  CAPTIONS_FEATURE_WINDOW_ID,
  FEATURE_CAPTIONS_EVENT,
  loadFeatureCaptionsState,
  mergeRecentCaptionWords,
  saveFeatureCaptionsState,
  type FeatureCaptionsState,
} from "../RightPanel/featureCaptionsState";
import type { ContextIntelligenceProps } from "../RightPanel/types";
import { useContextIntelligence } from "@/hooks/useContextIntelligence";
import { feedTranscript } from "@/services/ai/contextIntelligenceService";
import type { AiProducerCard } from "@/services/ai/types";
import {
  THEME_PALETTES,
  CARD_VISUALS,
  getHeadline,
  getSubline,
  isCardLive,
} from "../ai/cardVisuals";

const TARGET_SAMPLE_RATE = 16000;

interface FeatureCaptionsViewProps {
  contextIntelligence?: ContextIntelligenceProps;
}

export const FeatureCaptionsView: React.FC<FeatureCaptionsViewProps> = ({
  contextIntelligence: externalCi,
}) => {
  const dispatch = useAppDispatch();
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
  const displayAssignments = useAppSelector((s) => s.grid.displayAssignments);
  const captionsState = useAppSelector((s) => s.captions.state);
  const overlayText = useAppSelector((s) => s.app.overlayText);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);

  const fallbackCi = useContextIntelligence({
    provider: "groq",
    enabled: true,
  });

  const ci = externalCi || fallbackCi;
  const {
    cards,
    status: aiStatus,
    mode: aiMode,
    setMode: setAiMode,
    dismissCard,
    clearCards,
    pushCardToOverlay,
    hideOverlay,
    generateFromText,
  } = ci;

  const activeProvider = externalCi?.provider || "groq";

  const [draftText, setDraftText] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [pushedIndex, setPushedIndex] = useState<number | null>(null);
  const [isMicStreaming, setIsMicStreaming] = useState(false);

  const micCaptureRef = useRef<{ stop: () => void } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAssigned = useMemo(
    () =>
      Object.values(displayAssignments).some((ids) =>
        ids.includes(CAPTIONS_FEATURE_WINDOW_ID),
      ),
    [displayAssignments],
  );

  const applyState = useCallback(
    (next: FeatureCaptionsState) => {
      saveFeatureCaptionsState(next);
      dispatch(replaceCaptionsState(next));
    },
    [dispatch],
  );

  // Sync speech to draft
  useEffect(() => {
    const syncFromStorage = () => {
      const state = loadFeatureCaptionsState();
      dispatch(replaceCaptionsState(state));
      if (state.text) setDraftText(state.text);
    };
    window.addEventListener(FEATURE_CAPTIONS_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, [dispatch]);

  // Speech API listeners
  useEffect(() => {
    const offSpeech = window.speechToTextAPI?.onSpeechResult?.(
      (result: { success?: boolean; text?: string; error?: string }) => {
        const current = loadFeatureCaptionsState();
        if (!result?.success) {
          if (result?.error) {
            console.warn("🎙️ [FeatureCaptionsView] Speech event error/status:", result.error);
          }
          return;
        }
        const incoming = result?.text?.trim();
        if (incoming) {
          console.log("%c🗣️ [FeatureCaptionsView] Spoken text received:", "color:#ec4899;font-weight:bold;", incoming);
          const nextText = mergeRecentCaptionWords(current.text, incoming);
          applyState({ ...current, text: nextText, lastError: null, updatedAtMs: Date.now() });
          setDraftText(nextText);
          feedTranscript(incoming);
        }
      },
    );

    const offStatus = window.speechToTextAPI?.onWhisperStatus?.(
      (status: { isConnected?: boolean; isConnecting?: boolean }) => {
        const streaming = Boolean(status?.isConnected || status?.isConnecting);
        setIsMicStreaming(streaming);
        applyState({ ...loadFeatureCaptionsState(), isStreaming: streaming, isPaused: !streaming, updatedAtMs: Date.now() });
      },
    );

    return () => { offSpeech?.(); offStatus?.(); };
  }, [applyState]);

  const handleToggleMic = async () => {
    console.log("🎙️ [FeatureCaptionsView:handleToggleMic] isMicStreaming current state:", isMicStreaming);
    if (isMicStreaming) {
      console.log("🛑 [FeatureCaptionsView] Stopping mic capture and speech streaming...");
      micCaptureRef.current?.stop();
      micCaptureRef.current = null;
      await window.speechToTextAPI?.stopStreaming?.();
      setIsMicStreaming(false);
      applyState({ ...captionsState, isStreaming: false, isPaused: false, updatedAtMs: Date.now() });
    } else {
      console.log("🚀 [FeatureCaptionsView] Requesting startStreaming from speech API...");
      const result = await window.speechToTextAPI?.startStreaming?.({ sampleRate: TARGET_SAMPLE_RATE });
      console.log("📡 [FeatureCaptionsView] speechToTextAPI.startStreaming result:", result);

      if (!result?.success) {
        console.warn("⚠️ [FeatureCaptionsView] startStreaming failed:", result?.error);
        applyState({ ...captionsState, isStreaming: false, lastError: result?.error || "Failed to start", updatedAtMs: Date.now() });
        return;
      }
      try {
        console.log("🎤 [FeatureCaptionsView] Starting renderer mic streaming (AudioContext)...");
        const capture = await startRendererMicStreaming({ targetSampleRate: TARGET_SAMPLE_RATE });
        micCaptureRef.current?.stop();
        micCaptureRef.current = capture;
        setIsMicStreaming(true);
        applyState({ ...captionsState, isStreaming: true, isPaused: false, lastError: null, updatedAtMs: Date.now() });
        console.log("%c✅ [FeatureCaptionsView] Mic listening active & streaming audio frames!", "color:#22c55e;font-weight:bold;");
      } catch (micErr) {
        console.error("❌ [FeatureCaptionsView] Renderer mic capture failed:", micErr);
        await window.speechToTextAPI?.stopStreaming?.();
        applyState({ ...captionsState, isStreaming: false, lastError: micErr instanceof Error ? micErr.message : "Mic access denied", updatedAtMs: Date.now() });
      }
    }
  };

  const handleSubmit = async () => {
    const trimmed = draftText.trim();
    if (!trimmed) return;
    if (aiStatus !== "analyzing") {
      await generateFromText(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCardPushToggle = (card: AiProducerCard, index: number) => {
    if (isCardLive(card, overlayText, overlayVisible)) {
      hideOverlay();
    } else {
      pushCardToOverlay(card);
      setPushedIndex(index);
      setTimeout(() => setPushedIndex(null), 1800);
    }
  };

  const handleCopyCard = (card: AiProducerCard, index: number) => {
    const text = `${getHeadline(card)}${getSubline(card) ? " — " + getSubline(card) : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const handleInsert = (card: AiProducerCard) => {
    setDraftText(getHeadline(card) + (getSubline(card) ? " — " + getSubline(card) : ""));
    inputRef.current?.focus();
  };

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar bg-theme-primary-900 px-8 py-8 text-theme-primary-50">
      <div className="mx-auto max-w-2xl space-y-8">

        {/* ── Page Title ───────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-semibold text-theme-primary-100 tracking-tight">
            AI Context Cards
          </h1>
          {captionsState.lastError && (
            <p className="mt-1 text-xs text-red-400">{captionsState.lastError}</p>
          )}
        </div>

        {/* ── Composer Card (modal-style) ───────────────────────────────────────── */}
        <div
          className={`relative w-full rounded-[22px] p-4 flex flex-col justify-between min-h-[120px] transition-all duration-300 ${
            isDarkMode
              ? "bg-[#0c0c0c] shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
              : "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
          }`}
        >
          {/* Textarea */}
          <div className="w-full px-0.5 pt-0.5 pb-2 flex-1">
            <textarea
              ref={inputRef as any}
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                isMicStreaming
                  ? "Listening... spoken words stream here automatically..."
                  : "Type a sermon note, scripture, speaker title..."
              }
              rows={2}
              className={`w-full resize-none bg-transparent border-none outline-none text-sm font-medium leading-relaxed ${
                isDarkMode
                  ? "text-white placeholder-neutral-500"
                  : "text-neutral-900 placeholder-neutral-400"
              }`}
            />
          </div>

          {/* Bottom control row */}
          <div className="flex items-center justify-between gap-1.5 pt-2">
            {/* Left pills */}
            <div className="flex items-center gap-1.5">
              {/* Clear */}
              <button
                type="button"
                onClick={() => { setDraftText(""); inputRef.current?.focus(); }}
                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  isDarkMode
                    ? "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900"
                }`}
                title="Clear text"
              >
                <Plus size={12} strokeWidth={2.4} />
              </button>

              {/* Mic toggle */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`h-6 px-3 rounded-full flex items-center gap-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                  isMicStreaming
                    ? "bg-primary-500 text-white shadow-sm"
                    : isDarkMode
                      ? "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900"
                }`}
                title={isMicStreaming ? "Stop mic" : "Start mic captions"}
              >
                {isMicStreaming ? (
                  <><Square size={9} className="fill-white" /><span>Captions On</span></>
                ) : (
                  <><Mic size={11} strokeWidth={2.2} /><span>Start Mic</span></>
                )}
              </button>

              {/* AI Extract */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!draftText.trim() || aiStatus === "analyzing"}
                className={`h-6 px-3 rounded-full flex items-center gap-1.5 text-[10.5px] font-semibold transition-all cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900"
                }`}
                title="Extract AI context cards from text"
              >
                {aiStatus === "analyzing" ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} strokeWidth={2.2} />
                )}
                <span>AI Extract</span>
              </button>

              {/* Auto / Manual */}
              <button
                type="button"
                onClick={() => setAiMode(aiMode === "auto" ? "manual" : "auto")}
                className={`h-6 px-3 rounded-full flex items-center gap-1.5 text-[10.5px] font-semibold transition-all cursor-pointer ${
                  aiMode === "auto"
                    ? "bg-primary-500/15 text-primary-400"
                    : isDarkMode
                      ? "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900"
                }`}
                title={aiMode === "auto" ? "Auto Pick — click to switch to manual" : "Manual — click for Auto Pick"}
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${aiMode === "auto" ? "bg-primary-400 animate-pulse" : "bg-neutral-400"}`} />
                <span>{aiMode === "auto" ? "Auto" : "Manual"}</span>
              </button>
            </div>

            {/* Right: char count + send */}
            <div className="flex items-center gap-2">
              <span className={`text-[9.5px] font-mono ${isDarkMode ? "text-neutral-500" : "text-neutral-400"}`}>
                {draftText.length}/300
              </span>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!draftText.trim()}
                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm cursor-pointer ${
                  isDarkMode
                    ? "bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95"
                    : "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105 active:scale-95"
                }`}
                title="Extract AI cards (Enter)"
              >
                <ArrowUp size={13} strokeWidth={2.8} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Live overlay status strip ─────────────────────────────────────────── */}
        {overlayVisible && overlayText && (() => {
          let displayText = overlayText.trim();
          if (displayText.startsWith("{") && displayText.endsWith("}")) {
            try {
              const parsed = JSON.parse(displayText);
              displayText =
                parsed.headline ||
                parsed.quote ||
                parsed.reference ||
                parsed.item ||
                parsed.body ||
                parsed.title ||
                "Live Context Card";
            } catch {}
          } else if (/<[a-z][\s\S]*>/i.test(displayText)) {
            displayText = "Live UI Design Card";
          }

          return (
            <div className="flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-sm border border-theme-primary-700 bg-theme-primary-800 transition-all">
              <div className="flex items-center gap-2.5 text-sm min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500" />
                </span>
                <Radio
                  size={14}
                  className="shrink-0 text-primary-500 animate-pulse"
                />
                <span className="font-semibold shrink-0 text-theme-primary-50">
                  Currently live on screen
                </span>
                <span className="text-xs truncate max-w-xs sm:max-w-sm font-medium text-theme-primary-400">
                  "{displayText.slice(0, 60)}{displayText.length > 60 ? "..." : ""}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => hideOverlay()}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border bg-theme-primary-700 hover:bg-theme-primary-600 text-theme-primary-100 border-theme-primary-600 shadow-sm"
              >
                <EyeOff size={13} />
                <span>Take down</span>
              </button>
            </div>
          );
        })()}

        {/* ── Cards Section ─────────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-theme-primary-300 tracking-wide">
              {cards.length > 0 ? `Generated Cards · ${Math.min(cards.length, 3)}` : "Generate a card"}
            </h2>
            {cards.length > 0 && (
              <button
                type="button"
                onClick={clearCards}
                className="text-xs text-theme-primary-400 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear all
              </button>
            )}
          </div>

          {cards.length === 0 ? (
            /* ── Empty State ── */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: "Scripture", sample: "John 3:16 — For God so loved the world that He gave His only Son" },
                { label: "Speaker title", sample: "Pastor Paul Adefarasin — Senior Pastor, House on the Rock" },
                { label: "Key stat", sample: "Over 5,000 delegates gathered across 24 nations" },
                { label: "Quote", sample: "Faith is not the absence of doubt, but the courage to act despite it" },
                { label: "Agenda item", sample: "Panel Discussion — The role of AI in modern ministry" },
                { label: "Concept", sample: "Grace — unmerited favor from God, freely given to all" },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setDraftText(item.sample);
                    generateFromText(item.sample);
                  }}
                  className="group relative overflow-hidden rounded-2xl border text-left p-4 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] border-theme-primary-700 bg-theme-primary-900 hover:border-black/50 hover:bg-theme-primary-800"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-theme-primary-400 mb-2">
                    {item.label}
                  </p>
                  <p className="text-xs text-theme-primary-200 leading-relaxed line-clamp-3">
                    {item.sample}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            /* ── Cards Grid — horizontal scrolling cards (Latest 3 Cards) ── */
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-3 pt-1">
              <AnimatePresence>
                {cards.slice(0, 3).map((card, index) => {
                  const typeVisual = CARD_VISUALS[card.type] ?? CARD_VISUALS.agenda_item;
                  const IconComponent = typeVisual.icon;
                  const headline = getHeadline(card);
                  const subline = getSubline(card);
                  const isLive = isCardLive(card, overlayText, overlayVisible);
                  const isCopied = copiedIndex === index;
                  const isPushed = pushedIndex === index;

                  return (
                    <motion.div
                      key={(card as any).id || index}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.16 }}
                      className={`group relative flex flex-row items-stretch gap-2.5 w-[270px] h-[112px] shrink-0 rounded-2xl border p-2 transition-all duration-200 shadow-sm ${
                        isLive
                          ? "ring-1 ring-black/50 border-black/60 bg-theme-primary-850"
                          : "border-theme-primary-700 bg-theme-primary-800 hover:border-theme-primary-600 hover:bg-theme-primary-750"
                      }`}
                    >
                      {/* Left: icon panel or image */}
                      {card.imageUrl ? (
                        <div className="relative w-[84px] shrink-0 self-stretch overflow-hidden rounded-xl border border-theme-primary-700 shadow-sm bg-theme-primary-900">
                          <img
                            src={card.imageUrl}
                            alt={headline}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div className="flex w-[84px] shrink-0 self-stretch items-center justify-center rounded-xl border border-solid border-theme-primary-700 bg-theme-primary-900 text-theme-primary-200">
                          <IconComponent className="h-5 w-5" />
                        </div>
                      )}

                      {/* Right: content column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-0.5">
                        {/* Top: badge row + headline + subline */}
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="text-[8px] font-black px-1.5 py-0.5 rounded border border-theme-primary-600 bg-theme-primary-700 text-theme-primary-200 leading-none uppercase tracking-wider truncate">
                                {typeVisual.label}
                              </span>
                              {isLive && (
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-white animate-pulse" />
                              )}
                            </div>

                            {/* Dismiss */}
                            <button
                              type="button"
                              onClick={() => dismissCard(index)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-theme-primary-400 hover:text-red-400 hover:bg-theme-primary-700 transition-all cursor-pointer"
                              title="Dismiss card"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>

                          <p
                            className="text-[12px] font-bold leading-snug line-clamp-1 text-theme-primary-50"
                            title={headline}
                          >
                            {headline}
                          </p>
                          {subline && (
                            <p
                              className="text-[9.5px] mt-0.5 line-clamp-2 leading-tight text-theme-primary-400"
                              title={subline}
                            >
                              {subline}
                            </p>
                          )}
                        </div>

                        {/* Footer: confidence + copy + push */}
                        <div className="flex items-center justify-between pt-1 border-t border-theme-primary-700/60">
                          <span className="text-[8.5px] font-mono font-semibold text-theme-primary-400">
                            {Math.round(card.confidence * 100)}% match
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => handleCopyCard(card, index)}
                              className="p-1 rounded text-theme-primary-400 hover:text-theme-primary-100 hover:bg-theme-primary-700 transition-colors cursor-pointer"
                              title="Copy to clipboard"
                            >
                              {isCopied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3" />}
                            </button>

                              {/* Push / Hide */}
                              <button
                                type="button"
                                onClick={() => handleCardPushToggle(card, index)}
                                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border ${
                                  isLive
                                    ? isDarkMode
                                      ? "bg-neutral-800 text-white border-neutral-600 hover:bg-red-500/20 hover:text-red-300"
                                      : "bg-neutral-800 text-white border-neutral-700 hover:bg-red-50 hover:text-red-600"
                                    : isPushed
                                      ? isDarkMode
                                        ? "bg-neutral-800 text-white border-neutral-600"
                                        : "bg-neutral-800 text-white border-neutral-700"
                                      : isDarkMode
                                        ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                                        : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300 shadow-sm"
                                }`}
                                title={isLive ? "Currently live. Click to hide." : "Push to live overlay"}
                              >
                              {isLive ? (
                                <><EyeOff className="w-2.5 h-2.5" /><span>Hide</span></>
                              ) : isPushed ? (
                                <><Check className="w-2.5 h-2.5" /><span>Live</span></>
                              ) : (
                                <><Tv className="w-2.5 h-2.5" /><span>Push</span></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* ── Mic transcript strip (when streaming) ───────────────────────────── */}
        {isMicStreaming && captionsState.text && (
          <div className="rounded-2xl border border-black/40 bg-black/25 px-5 py-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-widest text-theme-primary-300 mb-2">
              Live Transcript
            </p>
            <p className="text-sm text-theme-primary-100 leading-relaxed">
              {captionsState.text}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
