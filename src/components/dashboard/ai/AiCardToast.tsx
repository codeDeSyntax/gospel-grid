import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, Check, Tv, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import type { AiProducerCard } from "@/services/ai/types";
import {
  CARD_VISUALS,
  getHeadline,
  getSubline,
  isCardLive,
} from "./cardVisuals";

interface AiCardToastProps {
  cards: AiProducerCard[];
  isDarkMode: boolean;
  onDismiss: (index: number) => void;
  onClearAll?: () => void;
  onPush: (card: AiProducerCard) => void;
  onHide: () => void;
}

export const AiCardToast: React.FC<AiCardToastProps> = ({
  cards,
  onDismiss,
  onPush,
  onHide,
}) => {
  const overlayText = useAppSelector((s) => s.app.overlayText);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);
  const [pushedIndex, setPushedIndex] = useState<number | null>(null);
  const [isToastHidden, setIsToastHidden] = useState(false);
  const [lastCardCount, setLastCardCount] = useState(cards.length);

  // If new cards arrive, automatically unhide the toast
  if (cards.length > lastCardCount) {
    setIsToastHidden(false);
    setLastCardCount(cards.length);
  } else if (cards.length < lastCardCount) {
    setLastCardCount(cards.length);
  }

  const lastThree = cards.slice(-3).reverse();

  const handlePushToggle = (card: AiProducerCard, idx: number) => {
    if (isCardLive(card, overlayText, overlayVisible)) {
      onHide();
    } else {
      onPush(card);
      setPushedIndex(idx);
      setTimeout(() => setPushedIndex(null), 1800);
    }
  };

  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);

  if (typeof document === "undefined" || cards.length === 0 || isToastHidden) return null;

  return createPortal(
    <div className="fixed bottom-16 right-3 z-[99999] pointer-events-none">
      <AnimatePresence>
        {cards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex flex-col w-[310px] rounded-2xl border border-neutral-200/80 bg-white/95 text-neutral-900 p-3.5 gap-2 overflow-hidden backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.16)]"
          >
            {/* Header with Card Count and Hide All Button */}
            <div className="flex items-center justify-between pb-1.5 px-0.5 border-b border-neutral-200/80">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700">
                  AI Context Cards
                </span>
                <span className="flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full text-[8px] font-bold bg-neutral-200 text-neutral-700">
                  {cards.length}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsToastHidden(true)}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-all cursor-pointer"
                title="Hide toast (cards remain saved)"
              >
                <span>Hide all</span>
                <X size={10} />
              </button>
            </div>
            <AnimatePresence mode="popLayout">
              {lastThree.map((card) => {
                const idx = cards.lastIndexOf(card);
                const typeVisual =
                  CARD_VISUALS[card.type] ?? CARD_VISUALS.agenda_item;
                const IconComponent = typeVisual.icon;
                const headline = getHeadline(card);
                const subline = getSubline(card);
                const live = isCardLive(card, overlayText, overlayVisible);
                const isPushed = pushedIndex === idx;

                return (
                  <motion.div
                    key={`${idx}-${headline}`}
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className={`group relative flex items-center gap-2.5 w-full h-[54px] rounded-xl px-2.5 py-1.5 border transition-all duration-150 overflow-hidden ${
                      live
                        ? "bg-neutral-200/80 border-neutral-400 ring-1 ring-neutral-400/40 shadow-sm"
                        : "bg-neutral-100/60 border-neutral-200/70 hover:bg-neutral-100 hover:border-neutral-300"
                    }`}
                  >
                    {/* Left: image or icon thumbnail */}
                    {card.imageUrl ? (
                      <div className="relative w-9 h-9 shrink-0 overflow-hidden rounded-lg border bg-white border-neutral-200/80">
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
                      <div className="flex w-9 h-9 shrink-0 items-center justify-center rounded-lg border bg-white border-neutral-200/80 text-neutral-700">
                        <IconComponent className="h-4 w-4" />
                      </div>
                    )}

                    {/* Middle: text content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[7.5px] font-bold uppercase px-1.5 py-0.2 rounded border leading-none tracking-wider truncate bg-white text-neutral-700 border-neutral-200/80">
                          {typeVisual.label}
                        </span>
                        {live && (
                          <span className="flex items-center gap-0.5 text-[8px] font-bold text-neutral-900">
                            <span className="h-1 w-1 rounded-full animate-pulse bg-neutral-900" />
                            Live
                          </span>
                        )}
                      </div>

                      <p
                        className="text-[11px] font-bold leading-tight truncate text-neutral-900"
                        title={headline}
                      >
                        {headline}
                      </p>
                      {subline && (
                        <p
                          className={`text-[8.5px] leading-tight truncate mt-0.5 font-medium ${
                            live ? "text-neutral-700" : "text-neutral-600"
                          }`}
                          title={subline}
                        >
                          {subline}
                        </p>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Push Button */}
                      <button
                        type="button"
                        onClick={() => handlePushToggle(card, idx)}
                        className={`flex items-center gap-1 h-6.5 px-2.5 rounded-lg text-[9px] font-bold transition-all duration-150 cursor-pointer active:scale-95 border ${
                          live
                            ? "bg-neutral-800 border-neutral-700 text-white hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                            : isPushed
                              ? "bg-neutral-800 border-neutral-700 text-white"
                              : "bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-300 shadow-sm"
                        }`}
                        title={
                          live
                            ? "Currently Live (Click to hide)"
                            : "Push to Screen"
                        }
                      >
                        {live ? (
                          <>
                            <EyeOff size={10} className="shrink-0" />
                            <span>Live</span>
                          </>
                        ) : isPushed ? (
                          <>
                            <Check size={10} className="shrink-0" />
                            <span>Pushed</span>
                          </>
                        ) : (
                          <>
                            <Tv size={10} className="shrink-0" />
                            <span>Push</span>
                          </>
                        )}
                      </button>

                      {/* Dismiss Button */}
                      <button
                        type="button"
                        onClick={() => onDismiss(idx)}
                        className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-5.5 w-5.5 rounded-md transition-all cursor-pointer text-neutral-500 hover:text-red-600 hover:bg-neutral-200"
                        title="Dismiss card"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};
