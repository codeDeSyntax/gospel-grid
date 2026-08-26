import React from "react";
import type { FeatureView } from "../RightPanel/types";
import { LayoutGrid } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

interface FeatureRailProps {
  activeView: FeatureView;
  onSelectView: (view: FeatureView) => void;
  isImageMenuOpen: boolean;
  onToggleImageMenu: () => void;
}

interface RailItem {
  id: FeatureView;
  title: string;
  iconSrc?: string;
  isCustomIcon?: boolean;
}

const railItems: RailItem[] = [
  { id: "autofit", title: "Main Layout", isCustomIcon: true },
  { id: "overlay", title: "Text Overlay", iconSrc: "./sendmessage.png" },
  { id: "timer", title: "Timer Feature", iconSrc: "./countdown.png" },
  { id: "remote", title: "Remote Screens", iconSrc: "./smart-tv.png" },
  { id: "image", title: "Images", iconSrc: "./gallery.png" },
];

export const FeatureRail: React.FC<FeatureRailProps> = ({
  activeView,
  onSelectView,
  isImageMenuOpen,
  onToggleImageMenu,
}) => {
  const isDarkMode = useAppSelector((s) => s.app.isDarkMode);

  return (
    <div className="pointer-events-auto ml-0 mr-0 self-stretch min-h-0 w-15 shrink-0 border-l border-theme-primary-800/40 bg-theme-primary-950/80 backdrop-blur-xl px-2 py-4 shadow-sm">
      <div className="flex h-full flex-col items-center gap-3.5">
        {railItems.map((item) => {
          const isActive =
            item.id === "image" ? isImageMenuOpen : activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "image") {
                  onToggleImageMenu();
                  return;
                }
                onSelectView(item.id);
              }}
              title={item.title}
              className={`group relative flex items-center justify-center h-11 w-11 rounded-full transition-all duration-200 ease-out cursor-pointer outline-none active:scale-95 ${
                isActive
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
                    isActive
                      ? "opacity-100 scale-105 drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                      : "opacity-80 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                />
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
