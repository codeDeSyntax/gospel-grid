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
  Lightbulb,
  Loader2,
  Trash2,
  Square,
  Tv,
  Eye,
  EyeOff,
  Layout,
} from "lucide-react";
import type { AiProducerCard, AiProvider } from "@/services/ai/types";
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
    gradientDark: "bg-[#222226] hover:bg-[#2a2a2f]",
    gradientLight: "from-neutral-100 via-white to-white",
    borderDark: "border-neutral-700 hover:border-neutral-500",
    borderLight: "border-neutral-300 hover:border-neutral-400",
    badgeBgDark: "bg-neutral-700/80 border-neutral-600",
    badgeBgLight: "bg-neutral-200 border-neutral-300",
    badgeTextDark: "text-neutral-100",
    badgeTextLight: "text-neutral-800",
    dotColor: "bg-neutral-300",
  },
  rose: {
    gradientDark: "bg-[#281e22] hover:bg-[#322429]",
    gradientLight: "from-rose-50 via-white to-white",
    borderDark: "border-rose-500/40 hover:border-rose-400/70",
    borderLight: "border-rose-200 hover:border-rose-400",
    badgeBgDark: "bg-rose-500/25 border-rose-500/40",
    badgeBgLight: "bg-rose-100 border-rose-200",
    badgeTextDark: "text-rose-200",
    badgeTextLight: "text-rose-800",
    dotColor: "bg-rose-400",
  },
  purple: {
    gradientDark: "bg-[#251e2c] hover:bg-[#2f2538]",
    gradientLight: "from-purple-50 via-white to-white",
    borderDark: "border-purple-500/40 hover:border-purple-400/70",
    borderLight: "border-purple-200 hover:border-purple-400",
    badgeBgDark: "bg-purple-500/25 border-purple-500/40",
    badgeBgLight: "bg-purple-100 border-purple-200",
    badgeTextDark: "text-purple-200",
    badgeTextLight: "text-purple-800",
    dotColor: "bg-purple-400",
  },
  amber: {
    gradientDark: "bg-[#28211a] hover:bg-[#332920]",
    gradientLight: "from-amber-50 via-white to-white",
    borderDark: "border-amber-500/40 hover:border-amber-400/70",
    borderLight: "border-amber-200 hover:border-amber-400",
    badgeBgDark: "bg-amber-500/25 border-amber-500/40",
    badgeBgLight: "bg-amber-100 border-amber-200",
    badgeTextDark: "text-amber-200",
    badgeTextLight: "text-amber-800",
    dotColor: "bg-amber-400",
  },
  cyan: {
    gradientDark: "bg-[#1c262a] hover:bg-[#223035]",
    gradientLight: "from-cyan-50 via-white to-white",
    borderDark: "border-cyan-500/40 hover:border-cyan-400/70",
    borderLight: "border-cyan-200 hover:border-cyan-400",
    badgeBgDark: "bg-cyan-500/25 border-cyan-500/40",
    badgeBgLight: "bg-cyan-100 border-cyan-200",
    badgeTextDark: "text-cyan-200",
    badgeTextLight: "text-cyan-800",
    dotColor: "bg-cyan-400",
  },
  orange: {
    gradientDark: "bg-[#29201a] hover:bg-[#342820]",
    gradientLight: "from-orange-50 via-white to-white",
    borderDark: "border-orange-500/40 hover:border-orange-400/70",
    borderLight: "border-orange-200 hover:border-orange-400",
    badgeBgDark: "bg-orange-500/25 border-orange-500/40",
    badgeBgLight: "bg-orange-100 border-orange-200",
    badgeTextDark: "text-orange-200",
    badgeTextLight: "text-orange-800",
    dotColor: "bg-orange-400",
  },
  indigo: {
    gradientDark: "bg-[#202130] hover:bg-[#282a3c]",
    gradientLight: "from-indigo-50 via-white to-white",
    borderDark: "border-indigo-500/40 hover:border-indigo-400/70",
    borderLight: "border-indigo-200 hover:border-indigo-400",
    badgeBgDark: "bg-indigo-500/25 border-indigo-500/40",
    badgeBgLight: "bg-indigo-100 border-indigo-200",
    badgeTextDark: "text-indigo-200",
    badgeTextLight: "text-indigo-800",
    dotColor: "bg-indigo-400",
  },
  blue: {
    gradientDark: "bg-[#1d2330] hover:bg-[#242d3d]",
    gradientLight: "from-blue-50 via-white to-white",
    borderDark: "border-blue-500/40 hover:border-blue-400/70",
    borderLight: "border-blue-200 hover:border-blue-400",
    badgeBgDark: "bg-blue-500/25 border-blue-500/40",
    badgeBgLight: "bg-blue-100 border-blue-200",
    badgeTextDark: "text-blue-200",
    badgeTextLight: "text-blue-800",
    dotColor: "bg-blue-400",
  },
};

const CARD_VISUALS: Record<AiProducerCard["type"], CardVisualMeta> = {
  lower_third: {
    label: "Speaker / Title",
    category: "Speaker",
    gradientDark: "from-cyan-500/30 via-[#142226] to-[#10191c]",
    gradientLight: "from-cyan-50 to-white",
    borderDark: "border-cyan-500/40 hover:border-cyan-400/70",
    borderLight: "border-cyan-200 hover:border-cyan-400",
    badgeBgDark: "bg-cyan-500/25 border-cyan-500/40",
    badgeBgLight: "bg-cyan-100 border-cyan-200",
    badgeTextDark: "text-cyan-200",
    badgeTextLight: "text-cyan-700",
    icon: User,
  },
  key_metric: {
    label: "Key Metric",
    category: "Metric",
    gradientDark: "from-neutral-700/60 via-[#202020] to-[#161616]",
    gradientLight: "from-neutral-100 to-white",
    borderDark: "border-neutral-700 hover:border-neutral-500",
    borderLight: "border-neutral-300 hover:border-neutral-400",
    badgeBgDark: "bg-neutral-700/80 border-neutral-600",
    badgeBgLight: "bg-neutral-200 border-neutral-300",
    badgeTextDark: "text-neutral-100",
    badgeTextLight: "text-neutral-700",
    icon: BarChart2,
  },
  quote: {
    label: "Quote",
    category: "Highlight",
    gradientDark: "from-purple-500/30 via-[#22172b] to-[#181420]",
    gradientLight: "from-purple-50 to-white",
    borderDark: "border-purple-500/40 hover:border-purple-400/70",
    borderLight: "border-purple-200 hover:border-purple-400",
    badgeBgDark: "bg-purple-500/25 border-purple-500/40",
    badgeBgLight: "bg-purple-100 border-purple-200",
    badgeTextDark: "text-purple-200",
    badgeTextLight: "text-purple-700",
    icon: Quote,
  },
  citation: {
    label: "Citation",
    category: "Reference",
    gradientDark: "from-amber-500/30 via-[#261c14] to-[#1c1510]",
    gradientLight: "from-amber-50 to-white",
    borderDark: "border-amber-500/40 hover:border-amber-400/70",
    borderLight: "border-amber-200 hover:border-amber-400",
    badgeBgDark: "bg-amber-500/25 border-amber-500/40",
    badgeBgLight: "bg-amber-100 border-amber-200",
    badgeTextDark: "text-amber-200",
    badgeTextLight: "text-amber-700",
    icon: BookOpen,
  },
  agenda_item: {
    label: "Agenda",
    category: "Milestone",
    gradientDark: "from-indigo-500/30 via-[#1a192b] to-[#131220]",
    gradientLight: "from-indigo-50 to-white",
    borderDark: "border-indigo-500/40 hover:border-indigo-400/70",
    borderLight: "border-indigo-200 hover:border-indigo-400",
    badgeBgDark: "bg-indigo-500/25 border-indigo-500/40",
    badgeBgLight: "bg-indigo-100 border-indigo-200",
    badgeTextDark: "text-indigo-200",
    badgeTextLight: "text-indigo-700",
    icon: List,
  },
  custom_ui: {
    label: "UI Design Block",
    category: "Design",
    gradientDark: "from-rose-500/30 via-[#24171b] to-[#1a1417]",
    gradientLight: "from-rose-50 to-white",
    borderDark: "border-rose-500/40 hover:border-rose-400/70",
    borderLight: "border-rose-200 hover:border-rose-400",
    badgeBgDark: "bg-rose-500/25 border-rose-500/40",
    badgeBgLight: "bg-rose-100 border-rose-200",
    badgeTextDark: "text-rose-200",
    badgeTextLight: "text-rose-700",
    icon: Layout,
  },
  concept: {
    label: "Key Concept",
    category: "Knowledge",
    gradientDark: "from-blue-500/[0.14] via-[#0e0e0e] to-[#080808]",
    gradientLight: "from-blue-50 to-white",
    borderDark: "border-blue-500/30 hover:border-blue-500/50",
    borderLight: "border-blue-200 hover:border-blue-400",
    badgeBgDark: "bg-blue-500/15 border-blue-500/30",
    badgeBgLight: "bg-blue-100 border-blue-200",
    badgeTextDark: "text-blue-300",
    badgeTextLight: "text-blue-700",
    icon: Lightbulb,
  },
};

function getHeadline(card: AiProducerCard): string {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
    case "custom_ui":
    case "concept":
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

const isStructuredOrHtml = (text: string | null | undefined): boolean => {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {}
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return true;
  }
  return false;
};

export interface ContextIntelligenceFullModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AiProducerCard[];
  status: IntelligenceStatus;
  isDarkMode: boolean;
  provider: AiProvider;
  mode?: "auto" | "manual";
  onToggleMode?: () => void;
  onDismiss: (index: number) => void;
  onClear: () => void;
  onPush: (card: AiProducerCard) => void;
  onHide?: () => void;
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
  onHide,
  onGenerateFromText,
}) => {
  const dispatch = useAppDispatch();
  const overlayText = useAppSelector((s: RootState) => s.app.overlayText);
  const overlayVisible = useAppSelector((s: RootState) => s.app.overlayVisible);

  const [draftText, setDraftText] = useState(() => (isStructuredOrHtml(overlayText) ? "" : overlayText || ""));
  const [isMicStreaming, setIsMicStreaming] = useState(false);
  const [pushedIndex, setPushedIndex] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const micCaptureRef = useRef<{ stop: () => void } | null>(null);

  // Listen for speech recognition results & update captions + input only while modal is open
  useEffect(() => {
    if (!isOpen) return;

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

    return () => {
      offSpeech?.();
      window.removeEventListener(FEATURE_CAPTIONS_EVENT, handleCaptionsUpdate);
    };
  }, [isOpen]);

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

  const isCardLive = useCallback(
    (card: AiProducerCard) => {
      if (!overlayVisible || !overlayText) return false;
      if (overlayText.startsWith("{") && overlayText.endsWith("}")) {
        try {
          const parsed = JSON.parse(overlayText);
          if (parsed.headline && card.headline && parsed.headline === card.headline) return true;
          if (parsed.quote && card.quote && parsed.quote === card.quote) return true;
          if (parsed.reference && card.reference && parsed.reference === card.reference) return true;
          if (parsed.item && card.item && parsed.item === card.item) return true;
          if (parsed.body && card.body && parsed.body === card.body) return true;
          if (parsed.type && card.type && parsed.type === card.type && parsed.headline === card.headline) return true;
        } catch {}
      }
      if (card.htmlCode && overlayText.trim() === card.htmlCode.trim()) return true;
      const keyText = card.headline || card.quote || card.reference || card.item;
      if (keyText && overlayText === keyText) return true;
      return false;
    },
    [overlayText, overlayVisible],
  );

  const handleHideOverlay = useCallback(() => {
    if (onHide) {
      onHide();
    } else {
      dispatch(setOverlayVisible(false));
      const api = window.electronAPI as any;
      api?.updateProjectionState?.({ overlayVisible: false })?.catch(() => {});
    }
  }, [dispatch, onHide]);

  const handleCardPush = (card: AiProducerCard, index: number) => {
    if (isCardLive(card)) {
      // If currently live on screen, clicking it takes it down/hides it!
      handleHideOverlay();
    } else {
      onPush(card);
      setPushedIndex(index);
      setTimeout(() => setPushedIndex(null), 1800);
    }
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
            className={`pointer-events-auto relative w-[94vw] sm:w-[590px] max-w-2xl h-[420px] sm:h-[450px] flex flex-col justify-between rounded-[28px] border shadow-[0_24px_80px_rgba(0,0,0,0.95)] overflow-hidden origin-bottom-right transition-colors duration-200 backdrop-blur-xl ${
              isDarkMode
                ? "border-neutral-800 bg-black text-white"
                : "border-neutral-200 bg-white/95 text-neutral-900"
            }`}
          >
            {/* ── Top Header Bar ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 pt-4 pb-1 shrink-0">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-6.5 w-6.5 items-center justify-center rounded-lg p-0.5 shrink-0 ${
                    isDarkMode
                      ? "bg-neutral-900 border border-neutral-800"
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
                  className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[9.5px] border transition-all active:scale-95 shadow-sm ${
                    mode === "auto"
                      ? isDarkMode
                        ? "bg-primary-500/20 text-primary-300 border-primary-500/40 hover:bg-primary-500/30"
                        : "bg-primary-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                      : isDarkMode
                        ? "bg-neutral-900 text-neutral-300 border-neutral-800 hover:bg-neutral-800"
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
                      mode === "auto" ? "bg-primary-400 animate-pulse" : isDarkMode ? "bg-neutral-400" : "bg-neutral-500"
                    }`}
                  />
                  <span>{mode === "auto" ? "Auto Pick" : "User Controlled"}</span>
                </button>

                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold text-[9.5px] border ${
                    isDarkMode
                      ? "bg-neutral-900 text-neutral-200 border-neutral-800"
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
                      ? "text-neutral-400 hover:text-white hover:bg-neutral-900"
                      : "text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100"
                  }`}
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Center Section: OverlayTextPanel Composer Card ────────────── */}
            <div className="px-6 pt-2 pb-2 flex-1 flex flex-col justify-center min-h-[140px]">
              <div
                className={`relative w-full h-full rounded-[22px] p-4 flex flex-col justify-between min-h-[130px] transition-all duration-300 ${
                  isDarkMode
                    ? "bg-[#0c0c0c] shadow-[0_12px_36px_rgba(0,0,0,0.8)]"
                    : "bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                } ${
                  isMicStreaming
                    ? isDarkMode
                      ? "ring-2 ring-white/60 border border-white/70 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                      : "ring-2 ring-neutral-800 border border-neutral-900 shadow-[0_0_20px_rgba(0,0,0,0.1)]"
                    : isDarkMode
                      ? "ring-1 ring-neutral-800 border border-neutral-800 hover:ring-neutral-700 focus-within:ring-2 focus-within:ring-neutral-500 shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
                      : "ring-1.5 ring-black/10 border border-black/15 hover:ring-black/15 focus-within:ring-2 focus-within:ring-black/30 shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                }`}
              >
                {/* Top text input */}
                <div className="w-full px-0.5 pt-0.5 pb-2 flex-1">
                  <textarea
                    ref={inputRef as any}
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
                    className={`w-full h-full resize-none bg-transparent border-none outline-none text-xs sm:text-sm font-medium leading-relaxed ${
                      isDarkMode
                        ? "text-white placeholder-neutral-500"
                        : "text-neutral-900 placeholder-neutral-400"
                    }`}
                    maxLength={MAX_LENGTH}
                  />
                </div>

                {/* Bottom control pills row inside composer card */}
                <div
                  className={`flex items-center justify-between gap-1.5 pt-2 border-t ${
                    isDarkMode ? "border-neutral-800/90" : "border-neutral-200/60"
                  }`}
                >
                  {/* Left Action Controls */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Clear Button */}
                    <button
                      type="button"
                      onClick={handleClear}
                      className={`h-6.5 w-6.5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${
                        isDarkMode
                          ? "bg-[#181818] hover:bg-[#222222] border-neutral-800 text-neutral-300 hover:text-white"
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
                      className={`h-6.5 px-3 rounded-full flex items-center gap-1.5 text-[10.5px] font-semibold transition-all cursor-pointer border ${
                        isMicStreaming
                          ? "bg-primary-500 text-white font-bold border-primary-400 shadow-sm"
                          : isDarkMode
                            ? "bg-[#181818] hover:bg-[#222222] border-neutral-800 text-neutral-300 hover:text-white"
                            : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-900"
                      }`}
                      title={isMicStreaming ? "Stop Microphone Captions" : "Start Live Microphone Captions"}
                    >
                      {isMicStreaming ? (
                        <>
                          <Square size={9} className="fill-white" />
                          <span>Captions On</span>
                        </>
                      ) : (
                        <>
                          <Mic size={11} strokeWidth={2.2} />
                          <span>Start Mic</span>
                        </>
                      )}
                    </button>

                    {/* AI Extract from typed input button */}
                    <button
                      type="button"
                      onClick={handleGenerateFromCurrentInput}
                      disabled={!draftText.trim() || status === "analyzing"}
                      className={`h-6.5 px-3 rounded-full flex items-center gap-1.5 text-[10.5px] font-semibold transition-all cursor-pointer border disabled:opacity-35 disabled:cursor-not-allowed ${
                        isDarkMode
                          ? "bg-[#181818] hover:bg-[#222222] border-neutral-800 text-neutral-300 hover:text-white"
                          : "bg-white hover:bg-neutral-100 border-neutral-300 text-neutral-700 hover:text-neutral-900"
                      }`}
                      title="Extract AI Context Cards directly from the input text"
                    >
                      {status === "analyzing" ? (
                        <Loader2 size={11} className="animate-spin" />
                      ) : (
                        <Sparkles size={11} strokeWidth={2.2} />
                      )}
                      <span>AI Extract</span>
                    </button>
                  </div>

                  {/* Input draft field to quickly push custom overlay text */}
                  <div className="flex items-center gap-1.5 flex-1 max-w-xs sm:max-w-sm">
                    <input
                      ref={inputRef as any}
                      type="text"
                      value={draftText}
                      onChange={(e) => setDraftText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void commitMessage(draftText);
                      }}
                      placeholder="Type or edit message to push..."
                      className={`w-full px-2.5 py-1 text-xs rounded-lg outline-none transition-all ${
                        isDarkMode
                          ? "bg-neutral-900/90 border border-neutral-800 text-white placeholder:text-neutral-600 focus:border-neutral-500"
                          : "bg-white border border-neutral-300 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => commitMessage(draftText)}
                      disabled={!draftText.trim()}
                      className={`p-1.5 rounded-lg font-bold text-xs transition-all disabled:opacity-30 cursor-pointer ${
                        isDarkMode
                          ? "bg-white text-black hover:bg-neutral-200"
                          : "bg-neutral-900 text-white hover:bg-neutral-800"
                      }`}
                      title="Push to live audience screen (Enter)"
                    >
                      <ArrowUp size={13} strokeWidth={2.8} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Context Intelligence Suggestions Section Underneath (Horizontal Carousel: Latest 3 Cards) ─ */}
            <div className="px-6 pb-4 pt-1 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-[11.5px] font-bold tracking-wide ${
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
                      {Math.min(cards.length, 3)}
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

              {/* Suggestions Horizontal Carousel (Latest 3 Cards) */}
              {cards.length === 0 ? (
                <div
                  className={`w-full py-3 px-4 flex items-center justify-center gap-2 text-center border border-dashed rounded-2xl shrink-0 ${
                    isDarkMode
                      ? "text-neutral-500 border-neutral-800 bg-[#080808]/50"
                      : "text-neutral-400 border-neutral-200"
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 opacity-70" />
                  <p className="text-[11px] leading-tight font-medium">
                    Start microphone above to extract live speaker lower thirds, stats & quotes.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 shrink-0 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-800 hover:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {cards.slice(0, 3).map((card, index) => {
                    const typeVisual = CARD_VISUALS[card.type] ?? CARD_VISUALS.agenda_item;
                    const IconComponent = typeVisual.icon;
                    const headline = getHeadline(card);
                    const subline = getSubline(card);
                    const isPushed = pushedIndex === index;
                    const live = isCardLive(card);

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        className={`group relative flex flex-row items-stretch gap-2 w-[240px] sm:w-[255px] h-[108px] shrink-0 rounded-2xl border p-1.5 transition-all duration-200 shadow-sm ${
                          live
                            ? isDarkMode
                              ? "bg-neutral-800 border-neutral-600 ring-1 ring-white/20 text-white"
                              : "bg-neutral-200 border-neutral-400 ring-1 ring-neutral-400/40 text-neutral-900"
                            : isDarkMode
                              ? "bg-neutral-900 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700 text-neutral-100"
                              : "bg-neutral-100 border-neutral-200 hover:bg-neutral-200 hover:border-neutral-300 text-neutral-900"
                        }`}
                      >
                        {/* Tall Image / Visual taking almost full card height */}
                        {card.imageUrl ? (
                          <div
                            className={`relative w-[72px] sm:w-[78px] shrink-0 self-stretch overflow-hidden rounded-xl border shadow-sm ${
                              isDarkMode ? "border-neutral-800 bg-black/60" : "border-neutral-200 bg-white"
                            }`}
                          >
                            <img
                              src={card.imageUrl}
                              alt={headline}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className={`flex w-[72px] sm:w-[78px] shrink-0 self-stretch items-center justify-center rounded-xl border border-solid shadow-sm ${
                              isDarkMode
                                ? "bg-neutral-950 border-neutral-800 text-neutral-300"
                                : "bg-white border-neutral-200 text-neutral-700"
                            }`}
                          >
                            <IconComponent className="h-5 w-5" />
                          </div>
                        )}

                        {/* Content column */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 pr-0.5">
                          {/* Top: badge row + headline */}
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span
                                  className={`text-[8px] font-black px-1.5 py-0.5 rounded border leading-none uppercase tracking-wider truncate ${
                                    isDarkMode
                                      ? "bg-neutral-800 border-neutral-700 text-neutral-300"
                                      : "bg-white border-neutral-300 text-neutral-700"
                                  }`}
                                >
                                  {typeVisual.label}
                                </span>
                                {live && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 animate-pulse ${
                                      isDarkMode ? "bg-white" : "bg-neutral-900"
                                    }`}
                                  />
                                )}
                              </div>

                              {/* Dismiss */}
                              <button
                                type="button"
                                onClick={() => onDismiss(index)}
                                className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all cursor-pointer ${
                                  isDarkMode
                                    ? "text-neutral-400 hover:text-red-400 hover:bg-neutral-800"
                                    : "text-neutral-500 hover:text-red-600 hover:bg-neutral-200"
                                }`}
                                title="Dismiss suggestion"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <p
                              className={`text-[11.5px] font-bold leading-snug line-clamp-1 ${
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

                          {/* Bottom action row: Confidence + Actions */}
                          <div
                            className={`flex items-center justify-between pt-1 border-t mt-auto ${
                              isDarkMode ? "border-neutral-800" : "border-neutral-200"
                            }`}
                          >
                            <span
                              className={`text-[8px] font-bold ${
                                isDarkMode ? "text-neutral-400" : "text-neutral-500"
                              }`}
                            >
                              {Math.round((card.confidence ?? 0.95) * 100)}% Match
                            </span>

                            <div className="flex items-center gap-1">
                              {/* Copy */}
                              <button
                                type="button"
                                onClick={() => handleCardInsert(card)}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  isDarkMode
                                    ? "text-neutral-400 hover:text-white hover:bg-neutral-800"
                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200"
                                }`}
                                title="Copy to input"
                              >
                                <Copy className="w-3 h-3" />
                              </button>

                              {/* Push / Live */}
                              <button
                                type="button"
                                onClick={() => handleCardPush(card, index)}
                                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[9px] font-bold transition-all shadow-sm cursor-pointer active:scale-95 border ${
                                  live
                                    ? isDarkMode
                                      ? "bg-neutral-800 text-white border-neutral-600 hover:bg-red-500/20 hover:text-red-300"
                                      : "bg-neutral-800 text-white border-neutral-700 hover:bg-red-50 hover:text-red-600"
                                    : isPushed
                                      ? isDarkMode
                                        ? "bg-neutral-800 text-white border-neutral-600"
                                        : "bg-neutral-800 text-white border-neutral-700"
                                      : isDarkMode
                                        ? "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700"
                                        : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300"
                                }`}
                                title={live ? "Currently live on projection screen. Click to hide." : "Push to live overlay"}
                              >
                                {live ? (
                                  <>
                                    <EyeOff className="w-2.5 h-2.5" />
                                    <span>Hide</span>
                                  </>
                                ) : isPushed ? (
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
                  ? "border-neutral-800 bg-black text-neutral-400"
                  : "border-neutral-200 text-neutral-400"
              }`}
            >
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700">Enter</kbd> Push
                </span>
                <span>
                  <kbd className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700">Ctrl + K</kbd> Toggle
                </span>
                <span>
                  <kbd className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-neutral-800 text-neutral-300 border border-neutral-700">Esc</kbd> Close
                </span>
              </div>

              <div className="flex items-center gap-2">
                {overlayVisible && overlayText && (
                  <button
                    type="button"
                    onClick={handleHideOverlay}
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold text-[9.5px] transition-all cursor-pointer shadow-sm border active:scale-95 ${
                      isDarkMode
                        ? "bg-neutral-900 border-neutral-800 text-neutral-200 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-300"
                        : "bg-white border-neutral-300 text-neutral-800 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                    }`}
                    title="Projection overlay is currently live. Click to hide."
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <EyeOff className="w-3 h-3" />
                    <span>Hide Screen</span>
                  </button>
                )}

                <span
                  className={`text-[10px] font-bold ${
                    isDarkMode ? "text-white/60" : "text-neutral-600"
                  }`}
                >
                  Wingrid Live AI
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
