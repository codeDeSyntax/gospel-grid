import React from "react";
import { AiProducerCard } from "../../../services/ai/types";

interface DynamicBroadcastCardProps {
  card: AiProducerCard;
  className?: string;
}

const THEME_ACCENTS: Record<
  string,
  {
    dot: string;
    badgeBg: string;
    badgeText: string;
    blockBg: string;
    blockBorder: string;
    titleText: string;
    quoteColor: string;
  }
> = {
  blue: {
    dot: "bg-blue-600",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-800",
    blockBg: "bg-blue-50/90",
    blockBorder: "border-blue-200/80",
    titleText: "text-blue-900",
    quoteColor: "text-blue-600",
  },
  emerald: {
    dot: "bg-neutral-700",
    badgeBg: "bg-neutral-200",
    badgeText: "text-neutral-900",
    blockBg: "bg-neutral-100/90",
    blockBorder: "border-neutral-300/80",
    titleText: "text-neutral-900",
    quoteColor: "text-neutral-700",
  },
  purple: {
    dot: "bg-purple-600",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-800",
    blockBg: "bg-purple-50/90",
    blockBorder: "border-purple-200/80",
    titleText: "text-purple-900",
    quoteColor: "text-purple-600",
  },
  amber: {
    dot: "bg-amber-500",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-900",
    blockBg: "bg-amber-50/90",
    blockBorder: "border-amber-200/80",
    titleText: "text-amber-950",
    quoteColor: "text-amber-600",
  },
  rose: {
    dot: "bg-rose-600",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-800",
    blockBg: "bg-rose-50/90",
    blockBorder: "border-rose-200/80",
    titleText: "text-rose-900",
    quoteColor: "text-rose-600",
  },
  cyan: {
    dot: "bg-cyan-600",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-900",
    blockBg: "bg-cyan-50/90",
    blockBorder: "border-cyan-200/80",
    titleText: "text-cyan-950",
    quoteColor: "text-cyan-600",
  },
  indigo: {
    dot: "bg-indigo-600",
    badgeBg: "bg-indigo-100",
    badgeText: "text-indigo-900",
    blockBg: "bg-indigo-50/90",
    blockBorder: "border-indigo-200/80",
    titleText: "text-indigo-950",
    quoteColor: "text-indigo-600",
  },
};

export const DynamicBroadcastCard: React.FC<DynamicBroadcastCardProps> = ({
  card,
  className = "",
}) => {
  const themeKey = (card.themeColor as string)?.toLowerCase() || "blue";
  const theme = THEME_ACCENTS[themeKey] || THEME_ACCENTS.blue;

  const headline =
    card.headline || card.quote || card.reference || card.item || "Context Intelligence";
  const subline = card.subline || card.attribution || card.body || "";
  const variant = card.layoutVariant || inferVariant(card);

  return (
    <div
      className={`bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[36px] p-8 sm:p-10 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.35)] max-w-4xl w-full mx-auto flex flex-col gap-5 text-neutral-900 drop-shadow-2xl ${className}`}
    >
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-neutral-200/80 pb-4 mb-1">
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${theme.dot} animate-pulse`} />
          <span
            className={`text-xs sm:text-sm font-black uppercase tracking-widest ${theme.badgeText}`}
          >
            {getCategoryLabel(card, variant)}
          </span>
        </div>

        {(card.metadata?.category || card.metadata?.reference || subline) && (
          <span className="text-xs sm:text-sm font-bold text-neutral-600 bg-neutral-100 px-3.5 py-1 rounded-full border border-neutral-200 truncate max-w-[240px]">
            {card.metadata?.reference || card.metadata?.category || headline}
          </span>
        )}
      </div>

      {/* ── Layout Archetype Renderer ─────────────────────────────── */}
      {renderVariantBody(variant, card, theme, headline, subline)}
    </div>
  );
};

function inferVariant(card: AiProducerCard): string {
  if (card.blocks && card.blocks.length >= 2) return "split_comparison";
  if (card.type === "citation" || card.reference) return "scripture_wisdom";
  if (card.type === "quote" || card.quote) return "hero_cover";
  if (card.type === "key_metric") return "stat_spotlight";
  if (card.type === "lower_third") return "speaker_profile";
  if (card.type === "agenda_item") return "top_banner";
  return "hero_cover";
}

function getCategoryLabel(card: AiProducerCard, variant: string): string {
  switch (variant) {
    case "split_comparison":
      return "Core Concept";
    case "scripture_wisdom":
      return "Scripture";
    case "hero_cover":
      return "Quote";
    case "stat_spotlight":
      return "Key Metric";
    case "top_banner":
      return "Agenda & Roadmap";
    case "speaker_profile":
      return "Speaker";
    default:
      return card.type?.toUpperCase() || "Highlight";
  }
}

function renderVariantBody(
  variant: string,
  card: AiProducerCard,
  theme: (typeof THEME_ACCENTS)["blue"],
  headline: string,
  subline: string,
) {
  switch (variant) {
    case "split_comparison":
      return (
        <div className="flex flex-col sm:flex-row items-stretch gap-6">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt={headline}
              className="w-40 sm:w-52 self-stretch min-h-[160px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}

          <div className="flex-1 flex flex-col justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">
              {headline}
            </h2>

            {card.blocks && card.blocks.length > 0 ? (
              <div
                className={`grid gap-3.5 ${
                  card.blocks.length === 1
                    ? "grid-cols-1"
                    : "grid-cols-1 sm:grid-cols-2"
                }`}
              >
                {card.blocks.map((block, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 flex flex-col gap-1.5 border ${
                      idx % 2 === 0
                        ? `${theme.blockBg} ${theme.blockBorder}`
                        : "bg-emerald-50/90 border-emerald-200/80"
                    }`}
                  >
                    <div
                      className={`text-base font-black uppercase tracking-wider flex items-center gap-2 ${
                        idx % 2 === 0 ? theme.titleText : "text-emerald-900"
                      }`}
                    >
                      {block.icon && <span>{block.icon}</span>}
                      <span>{block.title || block.label}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-700 font-medium leading-relaxed">
                      {block.description || block.value}
                    </p>
                  </div>
                ))}
              </div>
            ) : subline ? (
              <div className="bg-neutral-50 border border-neutral-200/80 rounded-2xl p-4 text-sm sm:text-base text-neutral-700 font-medium leading-relaxed">
                {subline}
              </div>
            ) : null}
          </div>
        </div>
      );

    case "scripture_wisdom":
    case "hero_cover": {
      // Prioritize full quotation/verse body text
      let verseText = card.body || card.quote;

      // If missing, check if htmlCode has the full verse in a paragraph
      if (!verseText && card.htmlCode) {
        const pMatch = card.htmlCode.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        if (pMatch && pMatch[1]) {
          verseText = pMatch[1].replace(/^[“"']+|[”"']+$/g, "").trim();
        }
      }

      // If still missing, fallback to headline
      if (!verseText) {
        verseText = headline;
      }

      const referenceText = card.reference || card.subline || (headline !== verseText ? headline : "") || "";

      return (
        <div className="flex flex-col sm:flex-row items-stretch gap-6">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt="Visual"
              className="w-44 sm:w-52 self-stretch min-h-[160px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="flex flex-col justify-center gap-3.5 flex-1 min-w-0">
            {headline && headline !== verseText && (
              <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-800">
                {headline}
              </div>
            )}
            <p className="text-xl sm:text-2xl md:text-[26px] font-bold text-neutral-900 leading-snug tracking-tight">
              “{verseText}”
            </p>
            {referenceText && (
              <div className="text-xs sm:text-sm font-bold text-neutral-600">
                — {referenceText}
              </div>
            )}
          </div>
        </div>
      );
    }

    case "stat_spotlight":
      return (
        <div className="flex flex-col sm:flex-row items-stretch gap-6">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt="Stats"
              className="w-36 sm:w-44 self-stretch min-h-[140px] rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="flex flex-col justify-center text-center sm:text-left flex-1">
            <span
              className={`px-3 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} text-xs font-black tracking-wider uppercase border w-fit mb-2`}
            >
              Key Metric
            </span>
            <div className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-neutral-950">
              {headline}
            </div>
            {subline && (
              <p className="text-sm sm:text-base text-neutral-600 font-medium mt-1">
                {subline}
              </p>
            )}
          </div>
        </div>
      );

    case "top_banner":
      return (
        <div className="flex flex-col gap-4">
          {card.imageUrl && (
            <div className="w-full h-36 sm:h-44 rounded-2xl overflow-hidden shadow-md border border-neutral-200/80">
              <img
                src={card.imageUrl}
                alt="Banner"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">
              {headline}
            </h2>
            {subline && (
              <p className="text-sm sm:text-base text-neutral-700 font-medium leading-relaxed">
                {subline}
              </p>
            )}
          </div>
        </div>
      );

    case "speaker_profile":
      return (
        <div className="flex items-center gap-5">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt={headline}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-blue-700">
                Speaker
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-950 leading-tight">
              {headline}
            </h2>
            {subline && (
              <p className="text-sm sm:text-base text-neutral-600 font-medium mt-1">
                {subline}
              </p>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center gap-5">
          {card.imageUrl && (
            <img
              src={card.imageUrl}
              alt={headline}
              className="w-24 h-24 rounded-2xl object-cover shadow-md border border-neutral-200/80 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          )}
          <div className="flex-1">
            <h3 className="text-2xl font-black text-neutral-950">{headline}</h3>
            {subline && (
              <p className="text-sm sm:text-base text-neutral-600 mt-1 font-medium">
                {subline}
              </p>
            )}
          </div>
        </div>
      );
  }
}
