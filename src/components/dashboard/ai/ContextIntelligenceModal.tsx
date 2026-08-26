import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  X,
  Send,
  Trash2,
  Mic,
  ArrowUpRight,
  User,
  BarChart2,
  Quote,
  BookOpen,
  List,
  Loader2,
  AlertCircle,
  KeyRound,
  WifiOff,
  Copy,
  Check,
  CornerDownLeft,
} from "lucide-react";
import type { AiProducerCard } from "@/services/ai/types";
import type { IntelligenceStatus } from "@/services/ai/contextIntelligenceService";
import { useAppDispatch } from "@/store/hooks";
import { setOverlayText, setOverlayVisible } from "@/store/slices/appSlice";

// ─── Card Type Icons & Styles ───────────────────────────────────────────────

const CARD_STYLES: Record<
  AiProducerCard["type"],
  {
    icon: React.FC<{ className?: string }>;
    label: string;
    badge: string;
    border: string;
  }
> = {
  lower_third: {
    icon: User,
    label: "Speaker / Title",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    border: "border-l-blue-500",
  },
  key_metric: {
    icon: BarChart2,
    label: "Key Metric",
    badge: "bg-[#76cb01]/15 text-[#76cb01] border-[#76cb01]/30",
    border: "border-l-[#76cb01]",
  },
  quote: {
    icon: Quote,
    label: "Quote",
    badge: "bg-purple-500/15 text-purple-400 border-purple-500/30",
    border: "border-l-purple-500",
  },
  citation: {
    icon: BookOpen,
    label: "Citation",
    badge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    border: "border-l-amber-500",
  },
  agenda_item: {
    icon: List,
    label: "Topic / Agenda",
    badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    border: "border-l-emerald-500",
  },
  custom_ui: {
    icon: Sparkles,
    label: "UI Block",
    badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    border: "border-l-cyan-500",
  },
};

function getCardHeadline(card: AiProducerCard): string {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
    case "custom_ui":
      return card.headline || (card as any).item || "Highlight";
    case "quote":
      return card.quote ? `"${card.quote}"` : (card.headline || "");
    case "citation":
      return card.reference || card.headline || "";
    case "agenda_item":
      return card.item || card.headline || "";
    default:
      return (card as any).headline || "";
  }
}

function getCardSubline(card: AiProducerCard): string | null {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
    case "custom_ui":
      return card.subline ?? null;
    case "quote":
      return card.attribution ? `— ${card.attribution}` : null;
    case "citation":
      return card.body ?? null;
    case "agenda_item":
      return null;
    default:
      return null;
  }
}

export interface ContextIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AiProducerCard[];
  status: IntelligenceStatus;
  isDarkMode: boolean;
  provider: "groq" | "openai";
  onDismiss: (index: number) => void;
  onClear: () => void;
  onPush: (card: AiProducerCard) => void;
}

export const ContextIntelligenceModal: React.FC<ContextIntelligenceModalProps> = ({
  isOpen,
  onClose,
  cards,
  status,
  isDarkMode,
  provider,
  onDismiss,
  onClear,
  onPush,
}) => {
  const dispatch = useAppDispatch();
  const [inputText, setInputText] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync live captions transcript to the input box automatically when speaking
  useEffect(() => {
    const handleCaptionsUpdate = () => {
      try {
        const raw = localStorage.getItem("wingrid:feature-captions-state");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.text) {
            setInputText(parsed.text);
          }
        }
      } catch {}
    };

    window.addEventListener("wingrid:feature-captions-changed", handleCaptionsUpdate);
    window.addEventListener("storage", handleCaptionsUpdate);

    return () => {
      window.removeEventListener("wingrid:feature-captions-changed", handleCaptionsUpdate);
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

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const handlePushInputToOverlay = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;

    dispatch(setOverlayText(trimmed));
    dispatch(setOverlayVisible(true));

    const api = window.electronAPI as any;
    api?.updateProjectionState?.({ overlayText: trimmed, overlayVisible: true })?.catch(() => {});
  }, [inputText, dispatch]);

  const handleCopyCard = (card: AiProducerCard, index: number) => {
    const text = `${getCardHeadline(card)}${getCardSubline(card) ? " " + getCardSubline(card) : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleInsertCard = (card: AiProducerCard) => {
    const text = `${getCardHeadline(card)}${getCardSubline(card) ? " — " + getCardSubline(card) : ""}`;
    setInputText(text);
    inputRef.current?.focus();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/65 backdrop-blur-md"
          />

          {/* Centered Modern Chat / Command Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 14 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
              isDarkMode
                ? "bg-[#1d1d1d]/95 border-white/10 shadow-black/80 text-white"
                : "bg-white/95 border-neutral-200 shadow-neutral-400/50 text-neutral-900"
            }`}
            style={{ backdropFilter: "blur(20px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Modal Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#76cb01]/15 text-[#76cb01]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                    <span>Context Intelligence</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#76cb01]/15 text-[#76cb01] border border-[#76cb01]/30">
                      {provider === "groq" ? "Groq • Llama 3.1" : "ChatGPT • GPT-4o"}
                    </span>
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {status === "analyzing" && (
                  <span className="flex items-center gap-1 text-[11px] text-[#76cb01] animate-pulse font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" /> Analyzing speech...
                  </span>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ── Top Modern Chat Input Bar ────────────────────────────────── */}
            <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-black/20">
              <div
                className={`relative flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 transition-all ${
                  isDarkMode
                    ? "bg-[#141414] border-white/12 focus-within:border-[#76cb01]/60 focus-within:ring-1 focus-within:ring-[#76cb01]/30"
                    : "bg-neutral-50 border-neutral-300 focus-within:border-[#76cb01]"
                }`}
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-[#76cb01]">
                  <Mic className="h-3.5 w-3.5 animate-pulse" />
                </div>

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handlePushInputToOverlay();
                    }
                  }}
                  placeholder="Live speech appears here, or type overlay message..."
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/35 outline-none font-normal"
                />

                {inputText && (
                  <button
                    type="button"
                    onClick={() => setInputText("")}
                    className="p-1 text-white/40 hover:text-white transition-colors"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={handlePushInputToOverlay}
                  disabled={!inputText.trim()}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold bg-[#76cb01] text-black hover:bg-[#88e003] transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  title="Push to screen overlay (Enter)"
                >
                  <span>Push</span>
                  <CornerDownLeft className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* ── Suggestions Section Underneath ──────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 min-h-[220px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white/90">
                    AI Context Suggestions
                  </span>
                  {cards.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold text-white/80">
                      {cards.length}
                    </span>
                  )}
                </div>

                {cards.length > 0 && (
                  <button
                    type="button"
                    onClick={onClear}
                    className="inline-flex items-center gap-1 text-[10px] text-white/45 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                )}
              </div>

              {/* Cards List or Empty State */}
              {cards.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-white/40">
                  <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center mb-2.5 text-[#76cb01]/70">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-medium text-white/70">No context suggestions yet</p>
                  <p className="text-[11px] text-white/40 max-w-sm mt-1 leading-relaxed">
                    Speak into your microphone or type above to generate real-time lower thirds, key stats, quotes, and citations.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {cards.map((card, index) => {
                    const style = CARD_STYLES[card.type] ?? CARD_STYLES.agenda_item;
                    const IconComponent = style.icon;
                    const headline = getCardHeadline(card);
                    const subline = getCardSubline(card);

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative flex items-start gap-3 rounded-xl border border-l-4 p-3 transition-all ${style.border} ${
                          isDarkMode
                            ? "bg-white/[0.03] hover:bg-white/[0.06] border-white/8"
                            : "bg-neutral-50 hover:bg-neutral-100 border-neutral-200"
                        }`}
                      >
                        {/* Type Icon */}
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black/40 border border-white/10 text-white/80 mt-0.5">
                          <IconComponent className="h-3.5 w-3.5" />
                        </div>

                        {/* Card Content */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${style.badge}`}
                            >
                              {style.label}
                            </span>
                            <span className="text-[9px] text-white/35 font-mono">
                              {Math.round(card.confidence * 100)}% match
                            </span>
                          </div>

                          <p className="text-xs sm:text-[13px] font-bold text-white leading-snug">
                            {headline}
                          </p>

                          {subline && (
                            <p className="text-[11px] text-white/60 mt-0.5 leading-relaxed">
                              {subline}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-90 group-hover:opacity-100 transition-opacity">
                          {/* Push to live screen */}
                          <button
                            type="button"
                            onClick={() => onPush(card)}
                            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-bold bg-[#76cb01] text-black hover:bg-[#88e003] shadow-sm transition-all"
                            title="Push to screen overlay"
                          >
                            <span>Push</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>

                          {/* Copy to prompt input */}
                          <button
                            type="button"
                            onClick={() => handleInsertCard(card)}
                            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                            title="Insert into prompt input"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Dismiss */}
                          <button
                            type="button"
                            onClick={() => onDismiss(index)}
                            className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Dismiss card"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Modal Footer ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-2.5 border-t border-white/[0.08] text-[10.5px] text-white/40 bg-black/30">
              <div className="flex items-center gap-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9.5px]">Enter</kbd> to push overlay
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[9.5px]">Esc</kbd> to close
                </span>
              </div>
              <span className="text-[10px] text-[#76cb01]/80 font-medium">
                Wingrid Live AI
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
