import React, { useState, useCallback } from "react";
import {
  User,
  BarChart2,
  Quote,
  BookOpen,
  List,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Loader2,
  WifiOff,
  KeyRound,
} from "lucide-react";
import type { AiProducerCard } from "@/services/ai/types";
import type { IntelligenceStatus } from "@/services/ai/contextIntelligenceService";

// ─── Card Config ──────────────────────────────────────────────────────────────

interface CardConfig {
  icon: React.FC<{ className?: string }>;
  label: string;
  accentLight: string;
  accentDark: string;
  badgeLight: string;
  badgeDark: string;
}

const CARD_CONFIG: Record<AiProducerCard["type"], CardConfig> = {
  lower_third: {
    icon: User,
    label: "Lower Third",
    accentLight: "border-l-blue-500",
    accentDark: "border-l-blue-400",
    badgeLight: "bg-blue-50 text-blue-700 border-blue-200",
    badgeDark: "bg-blue-900/40 text-blue-300 border-blue-700/50",
  },
  key_metric: {
    icon: BarChart2,
    label: "Key Metric",
    accentLight: "border-l-emerald-500",
    accentDark: "border-l-emerald-400",
    badgeLight: "bg-emerald-50 text-emerald-700 border-emerald-200",
    badgeDark: "bg-emerald-900/40 text-emerald-300 border-emerald-700/50",
  },
  quote: {
    icon: Quote,
    label: "Quote",
    accentLight: "border-l-violet-500",
    accentDark: "border-l-violet-400",
    badgeLight: "bg-violet-50 text-violet-700 border-violet-200",
    badgeDark: "bg-violet-900/40 text-violet-300 border-violet-700/50",
  },
  citation: {
    icon: BookOpen,
    label: "Citation",
    accentLight: "border-l-amber-500",
    accentDark: "border-l-amber-400",
    badgeLight: "bg-amber-50 text-amber-700 border-amber-200",
    badgeDark: "bg-amber-900/40 text-amber-300 border-amber-700/50",
  },
  agenda_item: {
    icon: List,
    label: "Agenda",
    accentLight: "border-l-primary-500",
    accentDark: "border-l-primary-400",
    badgeLight: "bg-primary-50 text-primary-700 border-primary-200",
    badgeDark: "bg-primary-900/40 text-primary-300 border-primary-700/50",
  },
};

// ─── Card Primary Text Helpers ────────────────────────────────────────────────

function getCardHeadline(card: AiProducerCard): string {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
      return card.headline;
    case "quote":
      return `"${card.quote}"`;
    case "citation":
      return card.reference;
    case "agenda_item":
      return card.item;
  }
}

function getCardSubline(card: AiProducerCard): string | null {
  switch (card.type) {
    case "lower_third":
    case "key_metric":
      return card.subline;
    case "quote":
      return card.attribution ? `— ${card.attribution}` : null;
    case "citation":
      return card.body ?? null;
    case "agenda_item":
      return null;
  }
}

// ─── Status Display ───────────────────────────────────────────────────────────

function StatusIndicator({
  status,
  isDarkMode,
}: {
  status: IntelligenceStatus;
  isDarkMode: boolean;
}) {
  if (status === "idle" || status === "ready" || status === "disabled") return null;

  const configs: Record<
    string,
    { icon: React.FC<{ className?: string }>; text: string; cls: string }
  > = {
    analyzing: {
      icon: Loader2,
      text: "Analyzing speech...",
      cls: isDarkMode ? "text-primary-300" : "text-primary-600",
    },
    error: {
      icon: AlertCircle,
      text: "Analysis error — will retry",
      cls: isDarkMode ? "text-red-400" : "text-red-600",
    },
    "no-key": {
      icon: KeyRound,
      text: "Configure AI key in Settings",
      cls: isDarkMode ? "text-amber-400" : "text-amber-600",
    },
    "circuit-open": {
      icon: WifiOff,
      text: "Paused after failures — will retry",
      cls: isDarkMode ? "text-orange-400" : "text-orange-600",
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;
  const Icon = cfg.icon;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-2 text-[10px] ${cfg.cls}`}>
      <Icon
        className={`h-3 w-3 shrink-0 ${status === "analyzing" ? "animate-spin" : ""}`}
      />
      <span>{cfg.text}</span>
    </div>
  );
}

// ─── Individual Card ──────────────────────────────────────────────────────────

interface ProducerCardProps {
  card: AiProducerCard;
  index: number;
  isDarkMode: boolean;
  onDismiss: (i: number) => void;
  onPush: (card: AiProducerCard) => void;
}

const ProducerCard: React.FC<ProducerCardProps> = ({
  card,
  index,
  isDarkMode,
  onDismiss,
  onPush,
}) => {
  const cfg = CARD_CONFIG[card.type];
  const Icon = cfg.icon;
  const headline = getCardHeadline(card);
  const subline = getCardSubline(card);
  const confidencePct = Math.round(card.confidence * 100);

  return (
    <div
      className={`group relative flex flex-col gap-1.5 rounded-lg border-l-4 p-3 transition-all ${
        isDarkMode
          ? `bg-theme-primary-850/70 border border-white/[0.06] ${cfg.accentDark}`
          : `bg-white border border-gray-200 ${cfg.accentLight}`
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Icon
            className={`h-3 w-3 shrink-0 ${isDarkMode ? "text-white/50" : "text-gray-400"}`}
          />
          <span
            className={`text-[9px] font-semibold uppercase tracking-widest border rounded px-1.5 py-0.5 ${
              isDarkMode ? cfg.badgeDark : cfg.badgeLight
            }`}
          >
            {cfg.label}
          </span>
          {/* Confidence ring */}
          <span
            className={`text-[9px] font-mono ml-auto ${
              confidencePct >= 90
                ? isDarkMode
                  ? "text-emerald-400"
                  : "text-emerald-600"
                : isDarkMode
                  ? "text-white/35"
                  : "text-gray-400"
            }`}
          >
            {confidencePct}%
          </span>
        </div>

        {/* Dismiss */}
        <button
          type="button"
          onClick={() => onDismiss(index)}
          className={`shrink-0 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity ${
            isDarkMode
              ? "hover:bg-white/10 text-white/40 hover:text-white/70"
              : "hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          }`}
          title="Dismiss"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Content */}
      <p
        className={`text-[12px] font-semibold leading-snug ${
          isDarkMode ? "text-white/90" : "text-gray-800"
        } ${card.type === "quote" ? "italic" : ""}`}
      >
        {headline}
      </p>
      {subline && (
        <p
          className={`text-[10px] leading-snug ${
            isDarkMode ? "text-white/45" : "text-gray-500"
          }`}
        >
          {subline}
        </p>
      )}

      {/* Push action */}
      <button
        type="button"
        onClick={() => onPush(card)}
        className={`mt-1 flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-semibold transition-all ${
          isDarkMode
            ? "bg-primary-500/15 text-primary-300 hover:bg-primary-500/25 border border-primary-500/20"
            : "bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200"
        }`}
      >
        <ExternalLink className="h-3 w-3" />
        Push to Overlay
      </button>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export interface AiProducerDeckProps {
  cards: AiProducerCard[];
  status: IntelligenceStatus;
  isDarkMode: boolean;
  onDismiss: (index: number) => void;
  onClear: () => void;
  onPush: (card: AiProducerCard) => void;
}

export const AiProducerDeck: React.FC<AiProducerDeckProps> = ({
  cards,
  status,
  isDarkMode,
  onDismiss,
  onClear,
  onPush,
}) => {
  const [expanded, setExpanded] = useState(true);

  const handleToggle = useCallback(() => setExpanded((p) => !p), []);

  const isActive = status !== "disabled" && status !== "idle";
  const hasCards = cards.length > 0;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border shadow-lg transition-all ${
        isDarkMode
          ? "bg-theme-primary-900/90 border-white/[0.08] shadow-black/40 backdrop-blur-sm"
          : "bg-white/95 border-gray-200 shadow-gray-200/60 backdrop-blur-sm"
      }`}
      style={{ width: 280 }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
          isDarkMode ? "hover:bg-white/[0.04]" : "hover:bg-gray-50"
        }`}
      >
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-md ${
            isActive || hasCards
              ? "bg-primary-500/20"
              : isDarkMode
                ? "bg-white/8"
                : "bg-gray-100"
          }`}
        >
          <Sparkles
            className={`h-3 w-3 ${
              isActive || hasCards
                ? "text-primary-400"
                : isDarkMode
                  ? "text-white/30"
                  : "text-gray-400"
            }`}
          />
        </div>

        <span
          className={`flex-1 text-[11px] font-semibold tracking-wide ${
            isDarkMode ? "text-white/80" : "text-gray-700"
          }`}
        >
          AI Producer Deck
        </span>

        {/* Card count badge */}
        {hasCards && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
              isDarkMode
                ? "bg-primary-500/20 text-primary-300"
                : "bg-primary-100 text-primary-700"
            }`}
          >
            {cards.length}
          </span>
        )}

        {/* Status dot */}
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            status === "analyzing"
              ? "bg-primary-400 animate-pulse"
              : status === "error" || status === "circuit-open"
                ? "bg-red-400"
                : status === "no-key"
                  ? "bg-amber-400"
                  : status === "ready" && hasCards
                    ? "bg-emerald-400"
                    : isDarkMode
                      ? "bg-white/15"
                      : "bg-gray-300"
          }`}
        />

        {expanded ? (
          <ChevronUp className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-gray-400"}`} />
        ) : (
          <ChevronDown className={`h-3.5 w-3.5 ${isDarkMode ? "text-white/30" : "text-gray-400"}`} />
        )}
      </button>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      {expanded && (
        <div className={`border-t ${isDarkMode ? "border-white/[0.06]" : "border-gray-100"}`}>
          {/* Status bar */}
          <StatusIndicator status={status} isDarkMode={isDarkMode} />

          {/* Empty state */}
          {!hasCards && status !== "analyzing" && (
            <div
              className={`flex flex-col items-center justify-center gap-1.5 px-4 py-6 text-center ${
                isDarkMode ? "text-white/25" : "text-gray-400"
              }`}
            >
              <Sparkles className="h-6 w-6 opacity-40" />
              <p className="text-[11px] font-medium">
                {status === "no-key"
                  ? "Set an AI key in Settings → System & Keys"
                  : "Cards appear here as you speak"}
              </p>
            </div>
          )}

          {/* Cards list */}
          {hasCards && (
            <div className="flex flex-col gap-2 max-h-[320px] overflow-y-auto p-3 thin-scrollbar">
              {cards.map((card, i) => (
                <ProducerCard
                  key={`${card.type}-${i}`}
                  card={card}
                  index={i}
                  isDarkMode={isDarkMode}
                  onDismiss={onDismiss}
                  onPush={onPush}
                />
              ))}
            </div>
          )}

          {/* Footer clear action */}
          {hasCards && (
            <div
              className={`border-t px-3 py-2 ${
                isDarkMode ? "border-white/[0.06]" : "border-gray-100"
              }`}
            >
              <button
                type="button"
                onClick={onClear}
                className={`text-[10px] font-medium transition-colors ${
                  isDarkMode
                    ? "text-white/30 hover:text-white/60"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Clear all cards
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
