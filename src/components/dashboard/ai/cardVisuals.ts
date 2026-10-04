import React from "react";
import {
  User,
  BarChart2,
  Quote,
  BookOpen,
  List,
  Sparkles,
  Lightbulb,
  Layout,
} from "lucide-react";
import type { AiProducerCard } from "@/services/ai/types";

export interface CardVisualMeta {
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

export interface ThemeVisual {
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

export const THEME_PALETTES: Record<string, ThemeVisual> = {
  emerald: {
    gradientDark: "from-neutral-700/60 via-[#202020] to-[#161616]",
    gradientLight: "from-neutral-200/90 via-[#f0f2f5] to-[#e8ebef]",
    borderDark: "border-neutral-700 hover:border-neutral-500",
    borderLight: "border-neutral-300 hover:border-neutral-400",
    badgeBgDark: "bg-neutral-700/80 border-neutral-600",
    badgeBgLight: "bg-neutral-200 border-neutral-300",
    badgeTextDark: "text-neutral-100",
    badgeTextLight: "text-neutral-800",
    dotColor: "bg-neutral-400",
  },
  rose: {
    gradientDark: "from-rose-500/30 via-[#24171b] to-[#1a1417]",
    gradientLight: "from-rose-100/70 via-[#f5f0f2] to-[#e8ebef]",
    borderDark: "border-rose-500/40 hover:border-rose-400/70",
    borderLight: "border-rose-200 hover:border-rose-300",
    badgeBgDark: "bg-rose-500/25 border-rose-500/40",
    badgeBgLight: "bg-rose-100 border-rose-200",
    badgeTextDark: "text-rose-200",
    badgeTextLight: "text-rose-800",
    dotColor: "bg-rose-400",
  },
  purple: {
    gradientDark: "from-purple-500/30 via-[#22172b] to-[#181420]",
    gradientLight: "from-purple-100/70 via-[#f3f0f6] to-[#e8ebef]",
    borderDark: "border-purple-500/40 hover:border-purple-400/70",
    borderLight: "border-purple-200 hover:border-purple-300",
    badgeBgDark: "bg-purple-500/25 border-purple-500/40",
    badgeBgLight: "bg-purple-100 border-purple-200",
    badgeTextDark: "text-purple-200",
    badgeTextLight: "text-purple-800",
    dotColor: "bg-purple-400",
  },
  amber: {
    gradientDark: "from-amber-500/30 via-[#261c14] to-[#1c1510]",
    gradientLight: "from-amber-100/70 via-[#f6f2ee] to-[#e8ebef]",
    borderDark: "border-amber-500/40 hover:border-amber-400/70",
    borderLight: "border-amber-200 hover:border-amber-300",
    badgeBgDark: "bg-amber-500/25 border-amber-500/40",
    badgeBgLight: "bg-amber-100 border-amber-200",
    badgeTextDark: "text-amber-200",
    badgeTextLight: "text-amber-800",
    dotColor: "bg-amber-400",
  },
  cyan: {
    gradientDark: "from-cyan-500/30 via-[#142226] to-[#10191c]",
    gradientLight: "from-cyan-100/70 via-[#eef4f6] to-[#e8ebef]",
    borderDark: "border-cyan-500/40 hover:border-cyan-400/70",
    borderLight: "border-cyan-200 hover:border-cyan-300",
    badgeBgDark: "bg-cyan-500/25 border-cyan-500/40",
    badgeBgLight: "bg-cyan-100 border-cyan-200",
    badgeTextDark: "text-cyan-200",
    badgeTextLight: "text-cyan-800",
    dotColor: "bg-cyan-400",
  },
  orange: {
    gradientDark: "from-orange-500/30 via-[#261914] to-[#1c1310]",
    gradientLight: "from-orange-100/70 via-[#f6f1ee] to-[#e8ebef]",
    borderDark: "border-orange-500/40 hover:border-orange-400/70",
    borderLight: "border-orange-200 hover:border-orange-300",
    badgeBgDark: "bg-orange-500/25 border-orange-500/40",
    badgeBgLight: "bg-orange-100 border-orange-200",
    badgeTextDark: "text-orange-200",
    badgeTextLight: "text-orange-800",
    dotColor: "bg-orange-400",
  },
  indigo: {
    gradientDark: "from-indigo-500/30 via-[#1a192b] to-[#131220]",
    gradientLight: "from-indigo-100/70 via-[#f1f1f7] to-[#e8ebef]",
    borderDark: "border-indigo-500/40 hover:border-indigo-400/70",
    borderLight: "border-indigo-200 hover:border-indigo-300",
    badgeBgDark: "bg-indigo-500/25 border-indigo-500/40",
    badgeBgLight: "bg-indigo-100 border-indigo-200",
    badgeTextDark: "text-indigo-200",
    badgeTextLight: "text-indigo-800",
    dotColor: "bg-indigo-400",
  },
  blue: {
    gradientDark: "from-blue-500/30 via-[#151e2b] to-[#101720]",
    gradientLight: "from-blue-100/70 via-[#eff3f8] to-[#e8ebef]",
    borderDark: "border-blue-500/40 hover:border-blue-400/70",
    borderLight: "border-blue-200 hover:border-blue-300",
    badgeBgDark: "bg-blue-500/25 border-blue-500/40",
    badgeBgLight: "bg-blue-100 border-blue-200",
    badgeTextDark: "text-blue-200",
    badgeTextLight: "text-blue-800",
    dotColor: "bg-blue-400",
  },
};

export const CARD_VISUALS: Record<AiProducerCard["type"], CardVisualMeta> = {
  lower_third: {
    label: "Speaker / Title",
    category: "Speaker",
    gradientDark: "from-cyan-500/30 via-[#142226] to-[#10191c]",
    gradientLight: "from-cyan-100/70 via-[#eef4f6] to-[#e8ebef]",
    borderDark: "border-cyan-500/40 hover:border-cyan-400/70",
    borderLight: "border-cyan-200 hover:border-cyan-400",
    badgeBgDark: "bg-cyan-500/25 border-cyan-500/40",
    badgeBgLight: "bg-cyan-100 border-cyan-200",
    badgeTextDark: "text-cyan-200",
    badgeTextLight: "text-cyan-800",
    icon: User,
  },
  key_metric: {
    label: "Key Metric",
    category: "Metric",
    gradientDark: "from-neutral-700/60 via-[#202020] to-[#161616]",
    gradientLight: "from-neutral-200/90 via-[#f0f2f5] to-[#e8ebef]",
    borderDark: "border-neutral-700 hover:border-neutral-500",
    borderLight: "border-neutral-300 hover:border-neutral-400",
    badgeBgDark: "bg-neutral-700/80 border-neutral-600",
    badgeBgLight: "bg-neutral-200 border-neutral-300",
    badgeTextDark: "text-neutral-100",
    badgeTextLight: "text-neutral-800",
    icon: BarChart2,
  },
  quote: {
    label: "Quote",
    category: "Highlight",
    gradientDark: "from-purple-500/30 via-[#22172b] to-[#181420]",
    gradientLight: "from-purple-100/70 via-[#f3f0f6] to-[#e8ebef]",
    borderDark: "border-purple-500/40 hover:border-purple-400/70",
    borderLight: "border-purple-200 hover:border-purple-400",
    badgeBgDark: "bg-purple-500/25 border-purple-500/40",
    badgeBgLight: "bg-purple-100 border-purple-200",
    badgeTextDark: "text-purple-200",
    badgeTextLight: "text-purple-800",
    icon: Quote,
  },
  citation: {
    label: "Citation",
    category: "Reference",
    gradientDark: "from-amber-500/30 via-[#261c14] to-[#1c1510]",
    gradientLight: "from-amber-100/70 via-[#f6f2ee] to-[#e8ebef]",
    borderDark: "border-amber-500/40 hover:border-amber-400/70",
    borderLight: "border-amber-200 hover:border-amber-400",
    badgeBgDark: "bg-amber-500/25 border-amber-500/40",
    badgeBgLight: "bg-amber-100 border-amber-200",
    badgeTextDark: "text-amber-200",
    badgeTextLight: "text-amber-800",
    icon: BookOpen,
  },
  agenda_item: {
    label: "Agenda",
    category: "Milestone",
    gradientDark: "from-indigo-500/30 via-[#1a192b] to-[#131220]",
    gradientLight: "from-indigo-100/70 via-[#f1f1f7] to-[#e8ebef]",
    borderDark: "border-indigo-500/40 hover:border-indigo-400/70",
    borderLight: "border-indigo-200 hover:border-indigo-400",
    badgeBgDark: "bg-indigo-500/25 border-indigo-500/40",
    badgeBgLight: "bg-indigo-100 border-indigo-200",
    badgeTextDark: "text-indigo-200",
    badgeTextLight: "text-indigo-800",
    icon: List,
  },
  custom_ui: {
    label: "UI Design Block",
    category: "Design",
    gradientDark: "from-rose-500/30 via-[#24171b] to-[#1a1417]",
    gradientLight: "from-rose-100/70 via-[#f5f0f2] to-[#e8ebef]",
    borderDark: "border-rose-500/40 hover:border-rose-400/70",
    borderLight: "border-rose-200 hover:border-rose-400",
    badgeBgDark: "bg-rose-500/25 border-rose-500/40",
    badgeBgLight: "bg-rose-100 border-rose-200",
    badgeTextDark: "text-rose-200",
    badgeTextLight: "text-rose-800",
    icon: Layout,
  },
  concept: {
    label: "Key Concept",
    category: "Knowledge",
    gradientDark: "from-blue-500/[0.14] via-[#0e0e0e] to-[#080808]",
    gradientLight: "from-blue-100/70 via-[#eff3f8] to-[#e8ebef]",
    borderDark: "border-blue-500/30 hover:border-blue-500/50",
    borderLight: "border-blue-200 hover:border-blue-400",
    badgeBgDark: "bg-blue-500/15 border-blue-500/30",
    badgeBgLight: "bg-blue-100 border-blue-200",
    badgeTextDark: "text-blue-300",
    badgeTextLight: "text-blue-800",
    icon: Lightbulb,
  },
};

export function getHeadline(card: AiProducerCard): string {
  if (card.headline && card.headline.trim()) {
    return card.headline.trim();
  }
  switch (card.type) {
    case "quote":
      return card.quote ? `"${card.quote}"` : "Quote";
    case "citation":
      return card.reference || "Scripture";
    case "agenda_item":
      return card.item || "Agenda";
    default:
      return (card as any).title || "Context Card";
  }
}

export function getSubline(card: AiProducerCard): string | null {
  if (card.subline && card.subline.trim()) {
    return card.subline.trim();
  }
  switch (card.type) {
    case "quote":
      return card.attribution ? `— ${card.attribution}` : (card.body ?? null);
    case "citation":
      return card.reference || card.body || null;
    default:
      return card.body ?? null;
  }
}

export function isCardLive(
  card: AiProducerCard,
  overlayText: string,
  overlayVisible: boolean,
): boolean {
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
}
