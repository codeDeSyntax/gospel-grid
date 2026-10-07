import React from "react";
import type { FeatureView } from "../RightPanel/types";
import { LayoutGrid } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { useGlobalSpeechStreaming } from "@/hooks/useGlobalSpeechStreaming";

interface FeatureRailProps {
  activeView: FeatureView;
  onSelectView: (view: FeatureView) => void;
  isImageMenuOpen: boolean;
  onToggleImageMenu: () => void;
  aiCardsCount?: number;
}

interface RailItem {
  id: FeatureView;
  title: string;
  iconSrc?: string;
  isCustomIcon?: boolean;
}

const railItems: RailItem[] = [
  { id: "autofit", title: "Main Layout", isCustomIcon: true },
  { id: "captions", title: "AI Speech & Smart Cards", iconSrc: "./caption.png" },
  { id: "overlay", title: "Text Overlay", iconSrc: "./sendmessage.png" },
  // { id: "timer", title: "Timer Feature", iconSrc: "./countdown.png" },
  { id: "remote", title: "Remote Screens", iconSrc: "./smart-tv.png" },
  { id: "image", title: "Images", iconSrc: "./gallery.png" },
];

export const FeatureRail: React.FC<FeatureRailProps> = ({
  activeView,
  onSelectView,
  isImageMenuOpen,
  onToggleImageMenu,
  aiCardsCount = 0,
}) => {
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);
  const { isStreaming: isSpeechStreaming } = useGlobalSpeechStreaming();

  return (
    <div className="pointer-events-auto ml-0 mr-0 self-stretch min-h-0 w-15 shrink-0 border-l border-theme-primary-800/40 bg-theme-primary-950/80 backdrop-blur-xl px-2 py-4 shadow-sm">
      <div className="flex h-full flex-col items-center gap-3.5">
        {railItems.map((item) => {
          const isActive =
            item.id === "image" ? isImageMenuOpen : activeView === item.id;
          const isCaptionsActiveListening = item.id === "captions" && isSpeechStreaming;

          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "image") {
                  onToggleImageMenu();
                  return;
                }
                if (item.id === "captions") {
                  onSelectView(activeView === "captions" ? "autofit" : "captions");
                  return;
                }
                onSelectView(item.id);
              }}
              title={
                item.id === "captions" && isSpeechStreaming
                  ? "AI Speech Listening Active"
                  : item.title
              }
              className={`group relative flex items-center justify-center h-11 w-11 rounded-full transition-all duration-200 ease-out cursor-pointer outline-none active:scale-95 ${
                isCaptionsActiveListening
                  ? "ring-2 ring-emerald-400 bg-emerald-950/40 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.4)] border border-emerald-400/50"
                  : isActive
                    ? isDarkMode
                      ? "bg-[#383838] hover:bg-[#424242] text-white shadow-md border border-white/30 scale-105"
                      : "bg-neutral-200 hover:bg-neutral-300 text-neutral-900 shadow-md border-2 border-neutral-400/90 scale-105"
                    : isDarkMode
                      ? "bg-[#202020] hover:bg-[#2a2a2a] border border-white/10 hover:border-white/20 text-neutral-400 hover:text-white"
                      : "bg-white hover:bg-neutral-100 border border-neutral-300 hover:border-neutral-400 text-neutral-600 hover:text-neutral-900 shadow-sm"
              }`}
            >
              {item.isCustomIcon ? (
                <LayoutGrid
                  size={24}
                  strokeWidth={1.9}
                  className={`transition-all duration-200 ${
                    isActive
                      ? isDarkMode
                        ? "text-white scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                        : "text-neutral-900 scale-105"
                      : isDarkMode
                        ? "text-neutral-400 group-hover:text-white group-hover:scale-105"
                        : "text-neutral-600 group-hover:text-neutral-900 group-hover:scale-105"
                  }`}
                />
              ) : (
                <img
                  src={item.iconSrc}
                  alt={item.title}
                  draggable={false}
                  className={`h-7 w-7 object-contain transition-all duration-200 pointer-events-none drop-shadow-sm ${
                    isCaptionsActiveListening
                      ? "opacity-100 scale-110 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                      : isActive
                        ? "opacity-100 scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                        : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                />
              )}

              {/* Listening beacon dot */}
              {isCaptionsActiveListening && (
                <span className="absolute -bottom-0.5 -right-0.5 z-20 flex h-3.5 w-3.5 items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 border border-black/40" />
                </span>
              )}

              {item.id === "captions" && aiCardsCount > 0 && (
                <span
                  className={`absolute -top-1 -right-1 z-20 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[9px] font-black shadow-md ${
                    isDarkMode ? "bg-white text-black" : "bg-neutral-900 text-white"
                  }`}
                >
                  {aiCardsCount}
                </span>
              )}
              {isActive && (
                <span
                  className={`absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full ${
                    isDarkMode
                      ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                      : "bg-neutral-500 shadow-sm"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
