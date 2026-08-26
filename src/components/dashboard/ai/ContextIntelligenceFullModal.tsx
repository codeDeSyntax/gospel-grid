import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Plus,
  ArrowUp,
  Mic,
  Copy,
  Check,
  User,
  BarChart2,
  Quote,
  BookOpen,
  List,
  Loader2,
  Trash2,
  Square,
  Tv,
} from "lucide-react";
import type { AiProducerCard } from "@/services/ai/types";
import type { IntelligenceStatus } from "@/services/ai/contextIntelligenceService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { RootState } from "@/store";
import { setOverlayText, setOverlayVisible } from "@/store/slices/appSlice";
import { startRendererMicStreaming } from "@/components/dashboard/audio/micCapture";
import {
  loadFeatureCaptionsState,
  saveFeatureCaptionsState,
  FEATURE_CAPTIONS_EVENT,
} from "@/components/dashboard/RightPanel/featureCaptionsState";

const TARGET_SAMPLE_RATE = 16000;
const MAX_LENGTH = 140;

// ─── Visual Config for Suggestion Cards ─────────────────────────────────────

interface CardVisualMeta {
  label: string;
  category: string;
  gradientDark: string;
  gradientLight: string;
  borderDark: string;
  borderLight: string;
  badgeBgDark: string;
  badgeBgLight: string;
  badgeTextDark: string;
  badgeTextLight: string;
  icon: React.FC<{ className?: string }>;
}

interface ThemeVisual {
  gradientDark: string;
  gradientLight: string;
  borderDark: string;
  borderLight: string;
  badgeBgDark: string;
  badgeBgLight: string;
  badgeTextDark: string;
  badgeTextLight: string;
  dotColor: string;
}

const THEME_PALETTES: Record<string, ThemeVisual> = {
  emerald: {
    gradientDark: "from-emerald-500/[0.08] to-[#181818]",
    gradientLight: "from-emerald-50 via-white to-white",
    borderDark: "border-emerald-500/20 hover:border-emerald-500/35",
    borderLight: "border-emerald-200 hover:border-emerald-400",
    badgeBgDark: "bg-emerald-500/10 border-emerald-500/20",
    badgeBgLight: "bg-emerald-100 border-emerald-200",
    badgeTextDark: "text-emerald-300/90",
    badgeTextLight: "text-emerald-800",
    dotColor: "bg-emerald-400",
  },
  rose: {
    gradientDark: "from-rose-500/[0.08] to-[#181818]",
    gradientLight: "from-rose-50 via-white to-white",
    borderDark: "border-rose-500/20 hover:border-rose-500/35",
    borderLight: "border-rose-200 hover:border-rose-400",
    badgeBgDark: "bg-rose-500/10 border-rose-500/20",
    badgeBgLight: "bg-rose-100 border-rose-200",
    badgeTextDark: "text-rose-300/90",
    badgeTextLight: "text-rose-800",
    dotColor: "bg-rose-400",
  },
  purple: {
    gradientDark: "from-purple-500/[0.08] to-[#181818]",
    gradientLight: "from-purple-50 via-white to-white",
    borderDark: "border-purple-500/20 hover:border-purple-500/35",
    borderLight: "border-purple-200 hover:border-purple-400",
    badgeBgDark: "bg-purple-500/10 border-purple-500/20",
    badgeBgLight: "bg-purple-100 border-purple-200",
    badgeTextDark: "text-purple-300/90",
    badgeTextLight: "text-purple-800",
    dotColor: "bg-purple-400",
  },
  amber: {
    gradientDark: "from-amber-500/[0.08] to-[#181818]",
    gradientLight: "from-amber-50 via-white to-white",
    borderDark: "border-amber-500/20 hover:border-amber-500/35",
    borderLight: "border-amber-200 hover:border-amber-400",
    badgeBgDark: "bg-amber-500/10 border-amber-500/20",
    badgeBgLight: "bg-amber-100 border-amber-200",
    badgeTextDark: "text-amber-300/90",
    badgeTextLight: "text-amber-800",
    dotColor: "bg-amber-400",
  },
  cyan: {
    gradientDark: "from-cyan-500/[0.08] to-[#181818]",
    gradientLight: "from-cyan-50 via-white to-white",
    borderDark: "border-cyan-500/20 hover:border-cyan-500/35",
    borderLight: "border-cyan-200 hover:border-cyan-400",
    badgeBgDark: "bg-cyan-500/10 border-cyan-500/20",
    badgeBgLight: "bg-cyan-100 border-cyan-200",
    badgeTextDark: "text-cyan-300/90",
    badgeTextLight: "text-cyan-800",
    dotColor: "bg-cyan-400",
  },
  orange: {
    gradientDark: "from-orange-500/[0.08] to-[#181818]",
    gradientLight: "from-orange-50 via-white to-white",
    borderDark: "border-orange-500/20 hover:border-orange-500/35",
    borderLight: "border-orange-200 hover:border-orange-400",
    badgeBgDark: "bg-orange-500/10 border-orange-500/20",
    badgeBgLight: "bg-orange-100 border-orange-200",
    badgeTextDark: "text-orange-300/90",
    badgeTextLight: "text-orange-800",
    dotColor: "bg-orange-400",
  },
  blue: {
    gradientDark: "from-blue-500/[0.08] to-[#181818]",
    gradientLight: "from-blue-50 via-white to-white",
    borderDark: "border-blue-500/20 hover:border-blue-500/35",
    borderLight: "border-blue-200 hover:border-blue-400",
    badgeBgDark: "bg-blue-500/10 border-blue-500/20",
    badgeBgLight: "bg-blue-100 border-blue-200",
    badgeTextDark: "text-blue-300/90",
    badgeTextLight: "text-blue-800",
    dotColor: "bg-blue-400",
  },
  indigo: {
    gradientDark: "from-indigo-500/[0.08] to-[#181818]",
    gradientLight: "from-indigo-50 via-white to-white",
    borderDark: "border-indigo-500/20 hover:border-indigo-500/35",
    borderLight: "border-indigo-200 hover:border-indigo-400",
    badgeBgDark: "bg-indigo-500/10 border-indigo-500/20",
    badgeBgLight: "bg-indigo-100 border-indigo-200",
    badgeTextDark: "text-indigo-300/90",
    badgeTextLight: "text-indigo-800",
    dotColor: "bg-indigo-400",
  },
};

const CARD_VISUALS: Record<AiProducerCard["type"], CardVisualMeta> = {
  lower_third: {
    label: "Lower Third",
    category: "Speaker",
    gradientDark: "from-cyan-500/[0.08] to-[#181818]",
    gradientLight: "from-cyan-50 to-white",
    borderDark: "border-cyan-500/20 hover:border-cyan-500/35",
    borderLight: "border-cyan-200 hover:border-cyan-400",
    badgeBgDark: "bg-cyan-500/10 border-cyan-500/20",
    badgeBgLight: "bg-cyan-100 border-cyan-200",
    badgeTextDark: "text-cyan-300/90",
    badgeTextLight: "text-cyan-700",
    icon: User,
  },
  key_metric: {
    label: "Key Metric",
    category: "Data",
    gradientDark: "from-emerald-500/[0.08] to-[#181818]",
    gradientLight: "from-emerald-50 to-white",
    borderDark: "border-emerald-500/20 hover:border-emerald-500/35",
    borderLight: "border-emerald-200 hover:border-emerald-400",
    badgeBgDark: "bg-emerald-500/10 border-emerald-500/20",
    badgeBgLight: "bg-emerald-100 border-emerald-200",
    badgeTextDark: "text-emerald-300/90",
    badgeTextLight: "text-emerald-700",
    icon: BarChart2,
  },
  quote: {
    label: "Quote",
    category: "Highlight",
    gradientDark: "from-purple-500/[0.08] to-[#181818]",
    gradientLight: "from-purple-50 to-white",
    borderDark: "border-purple-500/20 hover:border-purple-500/35",
    borderLight: "border-purple-200 hover:border-purple-400",
    badgeBgDark: "bg-purple-500/10 border-purple-500/20",
    badgeBgLight: "bg-purple-100 border-purple-200",
    badgeTextDark: "text-purple-300/90",
    badgeTextLight: "text-purple-700",
    icon: Quote,
  },
  citation: {
    label: "Citation",
    category: "Reference",
    gradientDark: "from-amber-500/[0.08] to-[#181818]",
    gradientLight: "from-amber-50 to-white",
    borderDark: "border-amber-500/20 hover:border-amber-500/35",
    borderLight: "border-amber-200 hover:border-amber-400",
    badgeBgDark: "bg-amber-500/10 border-amber-500/20",
    badgeBgLight: "bg-amber-100 border-amber-200",
    badgeTextDark: "text-amber-300/90",
    badgeTextLight: "text-amber-700",
    icon: BookOpen,
  },
  agenda_item: {
    label: "Agenda",
    category: "Milestone",
    gradientDark: "from-indigo-500/[0.08] to-[#181818]",
    gradientLight: "from-indigo-50 to-white",
    borderDark: "border-indigo-500/20 hover:border-indigo-500/35",
    borderLight: "border-indigo-200 hover:border-indigo-400",
    badgeBgDark: "bg-indigo-500/10 border-indigo-500/20",
    badgeBgLight: "bg-indigo-100 border-indigo-200",
    badgeTextDark: "text-indigo-300/90",
    badgeTextLight: "text-indigo-700",
    icon: List,
  },
  custom_ui: {
    label: "UI Design Block",
    category: "Design",
    gradientDark: "from-rose-500/[0.08] to-[#181818]",
    gradientLight: "from-rose-50 to-white",
    borderDark: "border-rose-500/20 hover:border-rose-500/35",
    borderLight: "border-rose-200 hover:border-rose-400",
    badgeBgDark: "bg-rose-500/10 border-rose-500/20",
    badgeBgLight: "bg-rose-100 border-rose-200",
    badgeTextDark: "text-rose-300/90",
    badgeTextLight: "text-rose-700",
    icon: Sparkles,
  },
};

function getHeadline(card: AiProducerCard): string {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
    case "custom_ui":
      return card.headline || "Context Card";
    case "quote":
      return card.quote ? `"${card.quote}"` : (card.headline || "Quote");
    case "citation":
      return card.reference || card.headline || "Citation";
    case "agenda_item":
      return card.item || card.headline || "Agenda";
    default:
      return card.headline || "Context Card";
  }
}

function getSubline(card: AiProducerCard): string | null {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
    case "custom_ui":
      return card.subline ?? null;
    case "quote":
      return card.attribution ? `— ${card.attribution}` : (card.subline ?? null);
    case "citation":
      return card.body ?? card.subline ?? null;
    case "agenda_item":
      return card.subline ?? null;
    default:
      return card.subline ?? null;
  }
}

export interface ContextIntelligenceFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AiProducerCard[];
  status: IntelligenceStatus;
  isDarkMode: boolean;
  provider: "groq" | "openai";
  mode?: "auto" | "manual";
  onToggleMode?: () => void;
  onDismiss: (index: number) => void;
  onClear: () => void;
  onPush: (card: AiProducerCard) => void;
  onGenerateFromText?: (text: string) => Promise<void>;
}

export const ContextIntelligenceFullModal: React.FC<ContextIntelligenceFullModalProps> = ({
  isOpen,
  onClose,
  cards,
  status,
  isDarkMode,
  provider,
  mode = "auto",
  onToggleMode,
  onDismiss,
  onClear,
  onPush,
  onGenerateFromText,
}) => {
  const dispatch = useAppDispatch();
  const overlayText = useAppSelector((s: RootState) => s.app.overlayText);

  const [draftText, setDraftText] = useState(overlayText || "");
  const [isMicStreaming, setIsMicStreaming] = useState(false);
  const [pushedIndex, setPushedIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const micCaptureRef = useRef<{ stop: () => void } | null>(null);

  // Listen for speech recognition results & update captions + input instantly
  useEffect(() => {
    const handleCaptionsUpdate = () => {
      try {
        const state = loadFeatureCaptionsState();
        if (state.text) {
          setDraftText(state.text);
        }
        setIsMicStreaming(Boolean(state.isStreaming));
      } catch {}
    };

    const offSpeech = window.speechToTextAPI?.onSpeechResult?.((result: { success?: boolean; text?: string; error?: string }) => {
      if (result?.success && result.text) {
        const incoming = result.text.trim();
        if (incoming) {
          const current = loadFeatureCaptionsState();
          setDraftText(current.text || incoming);
        }
      }
    });

    handleCaptionsUpdate();
    window.addEventListener(FEATURE_CAPTIONS_EVENT, handleCaptionsUpdate);
    window.addEventListener("storage", handleCaptionsUpdate);

    return () => {
      offSpeech?.();
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, handleCaptionsUpdate);
      window.removeEventListener("storage", handleCaptionsUpdate);
    };
  }, []);

  // Keyboard shortcut listener (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  // ── Speech-to-Text Mic Streaming Controls ──────────────────────────────────

  const handleToggleMic = async () => {
    if (isMicStreaming) {
      micCaptureRef.current?.stop();
      micCaptureRef.current = null;
      await window.speechToTextAPI?.stopStreaming?.();
      const current = loadFeatureCaptionsState();
      saveFeatureCaptionsState({ ...current, isStreaming: false, isPaused: false });
      setIsMicStreaming(false);
    } else {
      const result = await window.speechToTextAPI?.startStreaming?.({
        sampleRate: TARGET_SAMPLE_RATE,
      });

      if (!result?.success) {
        console.error("Failed to start speech streaming:", result?.error);
        return;
      }

      try {
        const capture = await startRendererMicStreaming({
          targetSampleRate: TARGET_SAMPLE_RATE,
        });
        micCaptureRef.current?.stop();
        micCaptureRef.current = capture;
        const current = loadFeatureCaptionsState();
        saveFeatureCaptionsState({ ...current, isStreaming: true, isPaused: false });
        setIsMicStreaming(true);
      } catch (err) {
        console.error("Mic access error:", err);
        await window.speechToTextAPI?.stopStreaming?.();
      }
    }
  };

  const handleGenerateFromCurrentInput = async () => {
    const trimmed = draftText.trim();
    if (!trimmed || status === "analyzing") return;
    if (onGenerateFromText) {
      await onGenerateFromText(trimmed);
    }
  };

  const commitMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      dispatch(setOverlayText(trimmed));
      dispatch(setOverlayVisible(true));

      const api = window.electronAPI as any;
      api?.updateProjectionState?.({ overlayText: trimmed, overlayVisible: true })?.catch(() => {});
    },
    [dispatch],
  );

  const handleClear = () => {
    setDraftText("");
    const current = loadFeatureCaptionsState();
    saveFeatureCaptionsState({ ...current, text: "" });
    inputRef.current?.focus();
  };

  const handleCardPush = (card: AiProducerCard, index: number) => {
    onPush(card);
    setPushedIndex(index);
    setTimeout(() => setPushedIndex(null), 1800);
  };

  const handleCardInsert = (card: AiProducerCard) => {
    const text = `${getHeadline(card)}${getSubline(card) ? " — " + getSubline(card) : ""}`;
    setDraftText(text);
    inputRef.current?.focus();
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999999] flex items-end justify-end p-3 sm:p-4 pb-16 sm:pb-16 sm:pr-4 overflow-hidden select-none pointer-events-none">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/15 backdrop-blur-sm pointer-events-auto"
          />

          {/* Bottom-Right Modal: Docked & Attached to the Floating Toggler */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`pointer-events-auto relative w-[92vw] sm:w-[540px] max-w-xl max-h-[60vh] flex flex-col rounded-[24px] border shadow-[0_24px_70px_rgba(0,0,0,0.45)] overflow-hidden origin-bottom-right transition-colors duration-200 ${
              isDarkMode
                ? "border-white/[0.12] bg-[#141414]/95 text-white"
                : "border-neutral-200 bg-white/95 text-neutral-900"
            }`}
            style={{ backdropFilter: "blur(28px)" }}
          >
            {/* ── Top Header Bar ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 pt-3.5 pb-1 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-lg p-0.5 shrink-0 ${
                    isDarkMode
                      ? "bg-white/10"
                      : "bg-neutral-100 border border-neutral-200"
                  }`}
                >
                  <img
                    src="./caption.png"
                    alt="Captions"
                    className="h-4 w-4 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xs sm:text-sm font-bold tracking-tight flex items-center gap-1.5">
                    <span>Live Captions & Context AI</span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                        isDarkMode ? "bg-white" : "bg-neutral-900"
                      }`}
                    />
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Extraction Mode Setting Tag */}
                <button
                  type="button"
                  onClick={onToggleMode}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-bold text-[9.5px] border transition-all active:scale-95 shadow-sm ${
                    mode === "auto"
                      ? isDarkMode
                        ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-primary-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      : isDarkMode
                        ? "bg-white/10 text-white/80 border-white/20 hover:bg-white/15"
                        : "bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200"
                  }`}
                  title={
                    mode === "auto"
                      ? "Auto Pick: AI continuously extracts cards in background (Click to switch to User Controlled)"
                      : "User Controlled: AI only extracts when you click 'AI Extract' (Click to switch to Auto Pick)"
                  }
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      mode === "auto" ? "bg-primary-100 animate-pulse" : isDarkMode ? "bg-white/60" : "bg-neutral-500"
                    }`}
                  />
                  <span>{mode === "auto" ? "Auto Pick" : "User Controlled"}</span>
                </button>

                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[9.5px] border ${
                    isDarkMode
                      ? "bg-white/10 text-white/90 border-white/20"
                      : "bg-neutral-100 text-neutral-800 border-neutral-300"
                  }`}
                >
                  {provider === "groq" ? "Groq • Llama 3.1" : "ChatGPT • GPT-4o"}
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className={`p-1 rounded-lg transition-colors ${
                    isDarkMode
                      ? "text-white/40 hover:text-white hover:bg-white/10"
                      : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Center Section: OverlayTextPanel Composer Card ────────────── */}
            <div className="px-5 pt-2 pb-2 shrink-0">
              <div
                className={`relative w-full rounded-[20px] p-3 flex flex-col justify-between min-h-[96px] transition-all duration-200 ${
                  isDarkMode
                    ? "bg-[#1e1e1e] border border-white/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
                    : "bg-neutral-50 border border-neutral-200 shadow-sm"
                } ${
                  isMicStreaming
                    ? isDarkMode
                      ? "ring-1.5 ring-white/30 border-white/40"
                      : "ring-1.5 ring-neutral-400 border-neutral-500"
                    : ""
                }`}
              >
                {/* Top text input */}
                <div className="w-full px-0.5 pt-0.5 pb-2">
                  <input
                    ref={inputRef}
                    autoFocus
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        commitMessage(draftText);
                      }
                    }}
                    placeholder={
                      isMicStreaming
                        ? "Listening... spoken words stream here automatically..."
                        : "Type broadcast message or speak into mic..."
                    }
                    className={`w-full bg-transparent border-none outline-none text-xs sm:text-sm font-medium leading-normal ${
                      isDarkMode
                        ? "text-white placeholder-neutral-500"
                        : "text-neutral-900 placeholder-neutral-400"
                    }`}
                    maxLength={MAX_LENGTH}
                  />
                </div>

                {/* Bottom control pills row inside composer card */}
                <div
                  className={`flex items-center justify-between gap-1.5 pt-1.5 border-t ${
                    isDarkMode ? "border-white/[0.05]" : "border-neutral-200/60"
                  }`}
                >
                  {/* Left Action Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={handleClear}
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                        isDarkMode
                          ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/80 hover:text-white"
                          : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-900"
                      }`}
                      title="Clear text"
                    >
                      <Plus size={12} strokeWidth={2.4} />
                    </button>

                    {/* Mic Toggle Button */}
                    <button
                      type="button"
                      onClick={handleToggleMic}
                      className={`h-6 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-semibold transition-all cursor-pointer border ${
                        isMicStreaming
                          ? isDarkMode
                            ? "bg-white text-black font-bold border-white shadow-sm"
                            : "bg-neutral-900 text-white font-bold border-neutral-900 shadow-sm"
                          : isDarkMode
                            ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/80 hover:text-white"
                            : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-900"
                      }`}
                      title={isMicStreaming ? "Stop Microphone Captions" : "Start Live Microphone Captions"}
                    >
                      {isMicStreaming ? (
                        <>
                          <Square size={9} className={isDarkMode ? "fill-black" : "fill-white"} />
                          <span>Captions On</span>
                        </>
                      ) : (
                        <>
                          <Mic size={10} strokeWidth={2.2} />
                          <span>Start Mic</span>
                        </>
                      )}
                    </button>

                    {/* AI Extract from typed input button */}
                    <button
                      type="button"
                      onClick={handleGenerateFromCurrentInput}
                      disabled={!draftText.trim() || status === "analyzing"}
                      className={`h-6 px-2.5 rounded-full flex items-center gap-1 text-[10px] font-semibold transition-all cursor-pointer border disabled:opacity-35 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? "bg-[#282828] hover:bg-[#323232] border-white/10 text-white/80 hover:text-white"
                          : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-900"
                      }`}
                      title="Extract AI Context Cards directly from the input text"
                    >
                      {status === "analyzing" ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Sparkles size={10} strokeWidth={2.2} />
                      )}
                      <span>AI Extract</span>
                    </button>
                  </div>

                  {/* Right Action: Character Count & ArrowUp Send Button */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9.5px] font-mono ${
                        isDarkMode ? "text-white/40" : "text-neutral-400"
                      }`}
                    >
                      {draftText.length}/{MAX_LENGTH}
                    </span>

                    <button
                      type="button"
                      onClick={() => commitMessage(draftText)}
                      disabled={!draftText.trim()}
                      className={`h-6 w-6 rounded-full flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm ${
                        isDarkMode
                          ? "bg-white text-black hover:bg-neutral-200 hover:scale-105 active:scale-95"
                          : "bg-neutral-900 text-white hover:bg-neutral-800 hover:scale-105 active:scale-95"
                      }`}
                      title="Push to live audience screen (Enter)"
                    >
                      <ArrowUp size={13} strokeWidth={2.8} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Context Intelligence Suggestions Section Underneath (Horizontal Carousel) ─ */}
            <div className="px-5 pb-2.5 pt-0.5 flex flex-col gap-1.5 shrink-0">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-[11px] font-bold tracking-wide ${
                      isDarkMode ? "text-white/85" : "text-neutral-800"
                    }`}
                  >
                    AI Context Suggestions
                  </h3>
                  {cards.length > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                        isDarkMode
                          ? "bg-white/10 text-white"
                          : "bg-neutral-200 text-neutral-800"
                      }`}
                    >
                      {cards.length}
                    </span>
                  )}
                  {status === "analyzing" && (
                    <span
                      className={`flex items-center gap-1 text-[9.5px] animate-pulse font-medium ${
                        isDarkMode ? "text-white/70" : "text-neutral-600"
                      }`}
                    >
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      <span>Extracting...</span>
                    </span>
                  )}
                </div>

                {cards.length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className={`flex items-center gap-1 text-[9.5px] transition-colors ${
                      isDarkMode
                        ? "text-white/45 hover:text-red-400"
                        : "text-neutral-400 hover:text-red-600"
                    }`}
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Suggestions Horizontal Carousel */}
              {cards.length === 0 ? (
                <div
                  className={`w-full py-2 px-3 flex items-center justify-center gap-2 text-center border border-dashed rounded-xl shrink-0 ${
                    isDarkMode
                      ? "text-white/40 border-white/10"
                      : "text-neutral-400 border-neutral-200"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  <p className="text-[10.5px] leading-tight">
                    Start microphone above to extract live speaker lower thirds, stats & quotes.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 shrink-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {cards.map((card, index) => {
                    const typeVisual = CARD_VISUALS[card.type] ?? CARD_VISUALS.agenda_item;
                    const themeKey = (card.themeColor as string)?.toLowerCase();
                    const themePalette = (themeKey && THEME_PALETTES[themeKey]) || THEME_PALETTES.cyan;
                    const IconComponent = typeVisual.icon;
                    const headline = getHeadline(card);
                    const subline = getSubline(card);
                    const isPushed = pushedIndex === index;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        className={`group relative flex flex-col justify-between w-[215px] sm:w-[225px] h-[80px] shrink-0 rounded-xl border p-2 transition-all duration-200 shadow-sm ${
                          isDarkMode
                            ? `bg-gradient-to-b ${themePalette.gradientDark} ${themePalette.borderDark} bg-[#181818]`
                            : `bg-gradient-to-b ${themePalette.gradientLight} ${themePalette.borderLight} bg-white`
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <div
                                className={`flex h-4 w-4 items-center justify-center rounded ${
                                  isDarkMode
                                    ? "bg-white/10 text-white/90"
                                    : "bg-neutral-200 text-neutral-800"
                                }`}
                              >
                                <IconComponent className="h-2.5 w-2.5" />
                              </div>
                              <span
                                className={`text-[8px] font-bold px-1 py-0.2 rounded border leading-none ${
                                  isDarkMode
                                    ? `${themePalette.badgeBgDark} ${themePalette.badgeTextDark}`
                                    : `${themePalette.badgeBgLight} ${themePalette.badgeTextLight}`
                                }`}
                              >
                                {typeVisual.label}
                              </span>
                              {card.themeColor && (
                                <span className={`w-1.5 h-1.5 rounded-full ${themePalette.dotColor}`} />
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => onDismiss(index)}
                              className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all ${
                                isDarkMode
                                  ? "text-white/30 hover:text-red-400"
                                  : "text-neutral-400 hover:text-red-600"
                              }`}
                              title="Dismiss card"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>

                          <p
                            className={`text-[11px] font-bold leading-tight line-clamp-1 ${
                              isDarkMode ? "text-white" : "text-neutral-900"
                            }`}
                            title={headline}
                          >
                            {headline}
                          </p>

                          {subline && (
                            <p
                              className={`text-[9.5px] mt-0.5 truncate leading-none ${
                                isDarkMode ? "text-white/60" : "text-neutral-600"
                              }`}
                              title={subline}
                            >
                              {subline}
                            </p>
                          )}
                        </div>

                        <div
                          className={`flex items-center justify-between pt-1 border-t ${
                            isDarkMode ? "border-white/[0.06]" : "border-neutral-200/80"
                          }`}
                        >
                          <span
                            className={`text-[8.5px] font-mono ${
                              isDarkMode ? "text-white/40" : "text-neutral-400"
                            }`}
                          >
                            {Math.round(card.confidence * 100)}%
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCardInsert(card)}
                              className={`p-0.5 rounded transition-colors ${
                                isDarkMode
                                  ? "text-white/40 hover:text-white hover:bg-white/10"
                                  : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                              }`}
                              title="Copy into input"
                            >
                              <Copy className="w-2.5 h-2.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCardPush(card, index)}
                              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold transition-all shadow-sm ${
                                isPushed
                                  ? "bg-emerald-500 text-white"
                                  : isDarkMode
                                    ? "bg-white text-black hover:bg-neutral-200 active:scale-95"
                                    : "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95"
                              }`}
                              title="Push to live overlay"
                            >
                              {isPushed ? (
                                <>
                                  <Check className="w-2.5 h-2.5" />
                                  <span>Live</span>
                                </>
                              ) : (
                                <>
                                  <Tv className="w-2.5 h-2.5" />
                                  <span>Push</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Footer ────────────────────────────────────────────────────── */}
            <div
              className={`flex items-center justify-between px-5 py-2 border-t text-[10px] shrink-0 ${
                isDarkMode
                  ? "border-white/[0.08] text-white/40"
                  : "border-neutral-200 text-neutral-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>
                  <kbd
                    className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                      isDarkMode
                        ? "bg-white/10 text-white/70"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    Enter
                  </kbd>{" "}
                  Push
                </span>
                <span>
                  <kbd
                    className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                      isDarkMode
                        ? "bg-white/10 text-white/70"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    Ctrl + K
                  </kbd>{" "}
                  Toggle
                </span>
                <span>
                  <kbd
                    className={`px-1.5 py-0.2 rounded font-mono text-[9px] ${
                      isDarkMode
                        ? "bg-white/10 text-white/70"
                        : "bg-neutral-200 text-neutral-700"
                    }`}
                  >
                    Esc
                  </kbd>{" "}
                  Close
                </span>
              </div>

              <span
                className={`text-[10px] font-bold ${
                  isDarkMode ? "text-white/60" : "text-neutral-600"
                }`}
              >
                Wingrid Live AI
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
