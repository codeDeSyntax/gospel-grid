import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { EyeOff, Check, Tv, X, Sparkles } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import type { AiProducerCard } from "@/services/ai/types";
import {
  CARD_VISUALS,
  getHeadline,
  getSubline,
  isCardLive,
} from "./cardVisuals";

export interface AiCardToastProps {
  isOpen: boolean;
  onClose: () => void;
  cards: AiProducerCard[];
  onDismiss: (index: number) => void;
  onPush: (card: AiProducerCard) => void;
  onHide: () => void;
}

export const AiCardToast: React.FC<AiCardToastProps> = ({
  isOpen,
  onClose,
  cards,
  onDismiss,
  onPush,
  onHide,
}) => {
  const overlayText = useAppSelector((s) => s.app.overlayText);
  const overlayVisible = useAppSelector((s) => s.app.overlayVisible);
  const [pushedIndex, setPushedIndex] = useState<number | null>(null);

  const recentCards = cards.slice(0, 6);

  const handlePushToggle = (card: AiProducerCard, idx: number) => {
    if (isCardLive(card, overlayText, overlayVisible)) {
      onHide();
    } else {
      onPush(card);
      setPushedIndex(idx);
      setTimeout(() => setPushedIndex(null), 1800);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-16 right-3 z-[99999] pointer-events-none select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-auto flex flex-col w-[310px] max-h-[470px] rounded-2xl border border-gray-200 bg-white text-gray-900 p-3 gap-2 overflow-hidden shadow-none"
          >
            {/* Header with Card Count and Close Button */}
            <div className="flex items-center justify-between pb-1.5 px-0.5 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Sparkles size={13} className="text-primary-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900">
                  Recent AI Cards
                </span>
                {cards.length > 0 && (
                  <span className="flex items-center justify-center h-3.5 min-w-3.5 px-1 rounded-full text-[8px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                    {Math.min(cards.length, 6)}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all cursor-pointer"
                title="Hide modal"
              >
                <span>Hide</span>
                <X size={10} />
              </button>
            </div>

            {cards.length === 0 ? (
              <div className="py-5 px-2 flex flex-col items-center justify-center text-center text-gray-500 gap-1.5">
                <div className="h-8 w-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-primary-600 mb-0.5">
                  <Sparkles size={14} />
                </div>
                <p className="text-[11px] font-semibold text-gray-900">No context cards yet</p>
                <p className="text-[9.5px] text-gray-500 leading-relaxed max-w-[220px]">
                  Speak into mic or type to generate live cards.
                </p>
              </div>
            ) : (
              <div className="flex flex-col overflow-y-auto max-h-[410px] pr-0.5 no-scrollbar">
                <AnimatePresence mode="popLayout">
                  {recentCards.map((card, index) => {
                    const idx = cards.indexOf(card) !== -1 ? cards.indexOf(card) : index;
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
                        initial={{ opacity: 0, y: 4, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.99 }}
                        transition={{ duration: 0.12, ease: "easeOut" }}
                        onClick={() => handlePushToggle(card, idx)}
                        className={`group relative flex items-center gap-2 w-full py-2 px-1.5 border-t-0 border-l-0 border-r-0 border-b border-solid border-gray-100 last:border-b-0 transition-all duration-150 cursor-pointer select-none active:scale-[0.99] ${
                          live
                            ? "bg-primary-50/70 hover:bg-primary-100/70"
                            : "hover:bg-gray-50/90 bg-transparent"
                        }`}
                        title={
                          live
                            ? "Currently Live (Click to hide)"
                            : "Click to push to screen"
                        }
                      >
                        {/* Left: wider image or icon thumbnail */}
                        {card.imageUrl ? (
                          <div className="relative w-12 h-9 min-w-12 max-w-12 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                            <img
                              src={card.imageUrl}
                              alt={headline}
                              className="w-full h-full object-cover block"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = "none";
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex w-12 h-9 min-w-12 max-w-12 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-primary-600">
                            <IconComponent className="h-3.5 w-3.5" />
                          </div>
                        )}

                        {/* Middle: text content */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[7px] font-bold uppercase px-1 py-0.2 rounded border leading-none tracking-wider truncate bg-gray-50 border-gray-200 text-gray-600">
                              {typeVisual.label}
                            </span>
                            {live && (
                              <span className="flex items-center gap-0.5 text-[7.5px] font-bold text-emerald-600">
                                <span className="h-1 w-1 rounded-full animate-pulse bg-emerald-500" />
                                Live
                              </span>
                            )}
                            {isPushed && !live && (
                              <span className="flex items-center gap-0.5 text-[7.5px] font-bold text-primary-600">
                                <Check size={8} />
                                Pushed
                              </span>
                            )}
                          </div>

                          <p
                            className="text-[11px] font-semibold leading-snug line-clamp-1 text-gray-900 group-hover:text-primary-700 transition-colors"
                            title={headline}
                          >
                            {headline}
                          </p>
                          {subline && (
                            <p
                              className="text-[8.5px] leading-tight line-clamp-1 text-gray-500 mt-0.2"
                              title={subline}
                            >
                              {subline}
                            </p>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {/* Live indicator badge */}
                          {live && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
                              <EyeOff size={8} />
                              <span>Live</span>
                            </span>
                          )}

                          {/* Dismiss Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDismiss(idx);
                            }}
                            className="opacity-0 group-hover:opacity-100 flex items-center justify-center h-5 w-5 rounded transition-all cursor-pointer text-gray-400 hover:text-red-500 hover:bg-gray-100"
                            title="Dismiss card"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body,
  );
};


