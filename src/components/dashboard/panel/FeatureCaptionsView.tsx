import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic,
  Sparkles,
  EyeOff,
  Copy,
  Check,
  CornerDownLeft,
  Loader2,
  Trash2,
  Radio,
  ArrowUp,
  Tv,
  Square,
  Plus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { replaceCaptionsState } from "@/store/slices/captionsSlice";
import { setOverlayText, setOverlayVisible } from "@/store/slices/appSlice";
import { globalSpeechService } from "@/services/ai/globalSpeechService";
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
  const [isMicStreaming, setIsMicStreaming] = useState(() => globalSpeechService.getIsStreaming());
  const [viewMode, setViewMode] = useState<"recent" | "all">("recent");

  const inputRef = useRef<HTMLInputElement>(null);

  // Synchronize mic streaming state with global speech service
  useEffect(() => {
    return globalSpeechService.subscribe((streaming) => {
      setIsMicStreaming(streaming);
    });
  }, []);

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

    return () => { offSpeech?.(); };
  }, [applyState]);

  const handleToggleMic = async () => {
    console.log("🎙️ [FeatureCaptionsView:handleToggleMic] Toggling global speech streaming...");
    await globalSpeechService.toggle();
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
    <div className="h-full w-full overflow-y-auto no-scrollbar bg-theme-primary-900 px-6 sm:px-8 py-8 pb-16 text-theme-primary-50">
      <div className="mx-auto max-w-2xl space-y-8 pb-16">

        {/* ── Page Title ───────────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-theme-primary-100">
            AI Context Cards
          </h1>
          {captionsState.lastError && (
            <p className="mt-1 text-xs text-red-400">{captionsState.lastError}</p>
          )}
        </div>

        {/* ── Composer Card (modal-style) ───────────────────────────────────────── */}
        <div
          className={`relative w-full rounded-[22px] p-4 flex flex-col justify-between min-h-[120px] transition-all duration-300 shadow-none ${
            isDarkMode
              ? "bg-[#141414] border border-white/10"
              : "bg-white border border-neutral-300"
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
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-900 border border-neutral-200"
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
                    ? "bg-primary-500 text-white"
                    : isDarkMode
                      ? "bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border border-neutral-200"
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
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border border-neutral-200"
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
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700 hover:text-neutral-950 border border-neutral-200"
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
                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${
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
            <div
              className={`flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-sm border transition-all ${
                isDarkMode
                  ? "border-neutral-800 bg-neutral-900/90 text-neutral-100"
                  : "border-neutral-200 bg-white text-neutral-900 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2.5 text-sm min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <Radio
                  size={14}
                  className="shrink-0 text-emerald-500 animate-pulse"
                />
                <span className={`font-semibold shrink-0 ${isDarkMode ? "text-neutral-100" : "text-neutral-900"}`}>
                  Currently live on screen
                </span>
                <span
                  className={`text-xs truncate max-w-xs sm:max-w-sm font-medium ${
                    isDarkMode ? "text-neutral-400" : "text-neutral-500"
                  }`}
                >
                  "{displayText.slice(0, 60)}{displayText.length > 60 ? "..." : ""}"
                </span>
              </div>
              <button
                type="button"
                onClick={() => hideOverlay()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isDarkMode
                    ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300 shadow-sm"
                }`}
              >
                <EyeOff size={13} />
                <span>Take down</span>
              </button>
            </div>
          );
        })()}

        {/* ── Cards Section ─────────────────────────────────────────────────────── */}
        <div>
          {/* Header with View Mode Switcher and Clear All */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <h2
                className={`text-sm font-semibold tracking-wide flex items-center gap-2 ${
                  isDarkMode ? "text-neutral-300" : "text-neutral-700"
                }`}
              >
                <span>Generated Cards</span>
                {cards.length > 0 && (
                  <span
                    className={`h-5 px-2 rounded-full text-[10px] font-bold flex items-center justify-center ${
                      isDarkMode
                        ? "bg-white/10 text-white"
                        : "bg-neutral-200 text-neutral-800"
                    }`}
                  >
                    {cards.length}
                  </span>
                )}
              </h2>

              {/* View Switcher: Carousel vs All Cards */}
              {cards.length > 0 && (
                <div
                  className={`flex items-center rounded-lg p-0.5 border ${
                    isDarkMode
                      ? "border-neutral-800 bg-neutral-900"
                      : "border-neutral-300 bg-neutral-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setViewMode("recent")}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-medium transition-all cursor-pointer ${
                      viewMode === "recent"
                        ? isDarkMode
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-neutral-900 text-white font-bold shadow-sm"
                        : isDarkMode
                          ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    Carousel (Top 3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("all")}
                    className={`px-2.5 py-1 rounded-md text-[10.5px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                      viewMode === "all"
                        ? isDarkMode
                          ? "bg-white text-black font-bold shadow-sm"
                          : "bg-neutral-900 text-white font-bold shadow-sm"
                        : isDarkMode
                          ? "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                          : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200"
                    }`}
                  >
                    <span>All Cards ({cards.length})</span>
                  </button>
                </div>
              )}
            </div>

            {cards.length > 0 && (
              <button
                type="button"
                onClick={clearCards}
                className={`text-xs transition-colors cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-md ${
                  isDarkMode
                    ? "text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
                    : "text-neutral-500 hover:text-red-600 hover:bg-red-50"
                }`}
                title="Delete all generated cards"
              >
                <Trash2 size={13} />
                <span>Clear all</span>
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
                  className={`group relative overflow-hidden rounded-2xl border text-left p-4 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                    isDarkMode
                      ? "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 hover:border-neutral-700"
                      : "border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 shadow-sm"
                  }`}
                >
                  <p
                    className={`text-[11px] font-semibold uppercase tracking-widest mb-2 ${
                      isDarkMode ? "text-neutral-400" : "text-neutral-500"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p
                    className={`text-xs leading-relaxed line-clamp-3 ${
                      isDarkMode ? "text-neutral-200" : "text-neutral-700"
                    }`}
                  >
                    {item.sample}
                  </p>
                </button>
              ))}
            </div>
          ) : viewMode === "recent" ? (
            /* ── Carousel View (Top 3 Cards with quick access to All) ── */
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
                          ? isDarkMode
                            ? "bg-neutral-800 border-neutral-600 ring-1 ring-white/20 text-white"
                            : "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400/40 text-emerald-950"
                          : isDarkMode
                            ? "border-neutral-800 bg-neutral-900 hover:border-neutral-700 hover:bg-neutral-800/80 text-neutral-100"
                            : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/90 text-neutral-900"
                      }`}
                    >
                      {/* Left: icon panel or image */}
                      {card.imageUrl ? (
                        <div
                          className={`relative w-[84px] shrink-0 self-stretch overflow-hidden rounded-xl border shadow-sm ${
                            isDarkMode
                              ? "border-neutral-800 bg-black/60"
                              : "border-neutral-200 bg-neutral-100"
                          }`}
                        >
                          <img
                            src={card.imageUrl}
                            alt={headline}
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                          />
                        </div>
                      ) : (
                        <div
                          className={`flex w-[84px] shrink-0 self-stretch items-center justify-center rounded-xl border ${
                            isDarkMode
                              ? "border-neutral-800 bg-neutral-950 text-neutral-300"
                              : "border-neutral-200 bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          <IconComponent className="h-5 w-5" />
                        </div>
                      )}

                      {/* Right: content column */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-0.5">
                        {/* Top: badge row + headline + subline */}
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1 min-w-0">
                              <span
                                className={`text-[8px] font-black px-1.5 py-0.5 rounded border leading-none uppercase tracking-wider truncate ${
                                  isDarkMode
                                    ? "bg-neutral-800 border-neutral-700 text-neutral-300"
                                    : "bg-neutral-100 border-neutral-200 text-neutral-700"
                                }`}
                              >
                                {typeVisual.label}
                              </span>
                              {isLive && (
                                <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-emerald-400 animate-pulse" />
                              )}
                            </div>

                            {/* Delete / Dismiss - only appears on hover */}
                            <button
                              type="button"
                              onClick={() => dismissCard(index)}
                              className={`p-1 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${
                                isDarkMode
                                  ? "text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                                  : "text-neutral-400 hover:text-red-600 hover:bg-neutral-100"
                              }`}
                              title="Delete card"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <p
                            className={`text-[12px] font-bold leading-snug line-clamp-1 ${
                              isDarkMode ? "text-neutral-100" : "text-neutral-900"
                            }`}
                            title={headline}
                          >
                            {headline}
                          </p>
                          {subline && (
                            <p
                              className={`text-[9.5px] mt-0.5 line-clamp-2 leading-tight ${
                                isDarkMode ? "text-neutral-400" : "text-neutral-600"
                              }`}
                              title={subline}
                            >
                              {subline}
                            </p>
                          )}
                        </div>

                        {/* Footer: confidence + copy + push */}
                        <div
                          className={`flex items-center justify-between pt-1 border-t ${
                            isDarkMode ? "border-neutral-800" : "border-neutral-200"
                          }`}
                        >
                          <span
                            className={`text-[8.5px] font-mono font-semibold ${
                              isDarkMode ? "text-neutral-400" : "text-neutral-500"
                            }`}
                          >
                            {Math.round(card.confidence * 100)}% match
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Copy */}
                            <button
                              type="button"
                              onClick={() => handleCopyCard(card, index)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                isDarkMode
                                  ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                                  : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                              }`}
                              title="Copy to clipboard"
                            >
                              {isCopied ? (
                                <Check className={`w-3 h-3 ${isDarkMode ? "text-white" : "text-neutral-900"}`} />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
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

                {/* Quick card to switch to All Cards view if > 3 cards */}
                {cards.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setViewMode("all")}
                    className={`flex flex-col items-center justify-center gap-1.5 w-[110px] h-[112px] shrink-0 rounded-2xl border border-dashed transition-all cursor-pointer group ${
                      isDarkMode
                        ? "border-neutral-700 bg-neutral-900/60 hover:bg-neutral-800 hover:border-neutral-600 text-neutral-300 hover:text-white"
                        : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900"
                    }`}
                    title="View all cards"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isDarkMode
                          ? "bg-neutral-800 group-hover:bg-neutral-700 text-neutral-100"
                          : "bg-neutral-200 group-hover:bg-neutral-300 text-neutral-800"
                      }`}
                    >
                      +{cards.length - 3}
                    </div>
                    <span className="text-[10px] font-semibold tracking-wide text-center">
                      All ({cards.length})
                    </span>
                  </button>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* ── All Cards View (Compact Modal-style List with Bottom Border Only) ── */
            <div className="flex flex-col overflow-y-auto no-scrollbar pb-10">
              <AnimatePresence>
                {cards.map((card, originalIndex) => {
                  const typeVisual = CARD_VISUALS[card.type] ?? CARD_VISUALS.agenda_item;
                  const IconComponent = typeVisual.icon;
                  const headline = getHeadline(card);
                  const subline = getSubline(card);
                  const isLive = isCardLive(card, overlayText, overlayVisible);
                  const isCopied = copiedIndex === originalIndex;
                  const isPushed = pushedIndex === originalIndex;

                  return (
                    <motion.div
                      key={(card as any).id || originalIndex}
                      initial={{ opacity: 0, y: 2 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.12 }}
                      className={`group relative flex items-center justify-between gap-3 py-2 px-1 border-0 border-b border-solid transition-colors ${
                        isDarkMode
                          ? "border-neutral-800 hover:bg-neutral-900/60"
                          : "border-neutral-200 hover:bg-neutral-50"
                      }`}
                    >
                      {/* Left: Thumbnail/Icon + Text Details */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Thumbnail / Icon */}
                        {card.imageUrl ? (
                          <div
                            className={`w-7 h-7 shrink-0 rounded-md overflow-hidden border ${
                              isDarkMode
                                ? "border-neutral-800 bg-neutral-950"
                                : "border-neutral-200 bg-neutral-100"
                            }`}
                          >
                            <img
                              src={card.imageUrl}
                              alt={headline}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-7 h-7 shrink-0 rounded-md border flex items-center justify-center ${
                              isDarkMode
                                ? "border-neutral-800 bg-neutral-900 text-neutral-300"
                                : "border-neutral-200 bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                        )}

                        {/* Content info */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span
                              className={`text-[8px] font-bold px-1 py-0.2 rounded border leading-none uppercase tracking-wider ${
                                isDarkMode
                                  ? "bg-neutral-800 border-neutral-700 text-neutral-300"
                                  : "bg-neutral-100 border-neutral-200 text-neutral-600"
                              }`}
                            >
                              {typeVisual.label}
                            </span>
                            {isLive && (
                              <span className="flex items-center gap-1 text-[8.5px] text-emerald-500 font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                              </span>
                            )}
                            <span
                              className={`text-[9px] font-mono ${
                                isDarkMode ? "text-neutral-500" : "text-neutral-400"
                              }`}
                            >
                              {Math.round(card.confidence * 100)}%
                            </span>
                          </div>

                          <p
                            className={`text-xs font-semibold truncate leading-snug ${
                              isDarkMode ? "text-neutral-100" : "text-neutral-900"
                            }`}
                            title={headline}
                          >
                            {headline}
                          </p>
                          {subline && (
                            <p
                              className={`text-[10px] truncate leading-tight ${
                                isDarkMode ? "text-neutral-400" : "text-neutral-500"
                              }`}
                              title={subline}
                            >
                              {subline}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Insert / Copy to composer */}
                        <button
                          type="button"
                          onClick={() => handleInsert(card)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDarkMode
                              ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
                          }`}
                          title="Edit in composer"
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </button>

                        {/* Copy text */}
                        <button
                          type="button"
                          onClick={() => handleCopyCard(card, originalIndex)}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            isDarkMode
                              ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                              : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
                          }`}
                          title="Copy to clipboard"
                        >
                          {isCopied ? (
                            <Check className={`w-3 h-3 ${isDarkMode ? "text-white" : "text-neutral-900"}`} />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Push / Live Toggle */}
                        <button
                          type="button"
                          onClick={() => handleCardPushToggle(card, originalIndex)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9.5px] font-bold transition-all shadow-none cursor-pointer active:scale-95 border ${
                            isLive
                              ? isDarkMode
                                ? "bg-neutral-800 text-white border-neutral-600 hover:bg-red-500/20 hover:text-red-300"
                                : "bg-neutral-900 text-white border-neutral-800 hover:bg-red-50 hover:text-red-600"
                              : isPushed
                                ? isDarkMode
                                  ? "bg-neutral-800 text-white border-neutral-600"
                                  : "bg-neutral-900 text-white border-neutral-800"
                                : isDarkMode
                                  ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                                  : "bg-white hover:bg-neutral-100 text-neutral-800 border-neutral-300"
                          }`}
                          title={isLive ? "Hide from screen" : "Push to screen"}
                        >
                          {isLive ? (
                            <><EyeOff className="w-2.5 h-2.5" /><span>Hide</span></>
                          ) : isPushed ? (
                            <><Check className="w-2.5 h-2.5" /><span>Live</span></>
                          ) : (
                            <><Tv className="w-2.5 h-2.5" /><span>Push</span></>
                          )}
                        </button>

                        {/* Delete button only appears on hover */}
                        <button
                          type="button"
                          onClick={() => dismissCard(originalIndex)}
                          className={`p-1 rounded transition-all cursor-pointer opacity-0 group-hover:opacity-100 ${
                            isDarkMode
                              ? "text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                              : "text-neutral-400 hover:text-red-600 hover:bg-neutral-200"
                          }`}
                          title="Delete card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
          <div
            className={`rounded-2xl border px-5 py-4 ${
              isDarkMode
                ? "border-neutral-800 bg-neutral-900/60 text-neutral-100"
                : "border-neutral-200 bg-neutral-100 text-neutral-900"
            }`}
          >
            <p
              className={`text-[10.5px] font-semibold uppercase tracking-widest mb-2 ${
                isDarkMode ? "text-neutral-400" : "text-neutral-500"
              }`}
            >
              Live Transcript
            </p>
            <p
              className={`text-sm leading-relaxed ${
                isDarkMode ? "text-neutral-200" : "text-neutral-800"
              }`}
            >
              {captionsState.text}
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
