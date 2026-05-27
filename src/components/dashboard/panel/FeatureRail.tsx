import React from "react";
import type { FeatureView } from "../RightPanel/types";
import { DepthButton } from "@/shared/DepthButton";

interface FeatureRailProps {
  activeView: FeatureView;
  onSelectView: (view: FeatureView) => void;
  isImageMenuOpen: boolean;
  onToggleImageMenu: () => void;
}

interface RailItem {
  id: FeatureView;
  title: string;
  iconSrc: string;
}

const railItems: RailItem[] = [
  { id: "autofit", title: "Main Layout", iconSrc: "./wingrid.png" },
  { id: "overlay", title: "Text Overlay", iconSrc: "./messages.png" },
  { id: "timer", title: "Timer Feature", iconSrc: "./countdown.png" },
  { id: "captions", title: "Live Captions", iconSrc: "./caption.png" },
  { id: "remote", title: "Remote Screens", iconSrc: "./extend.svg" },
  { id: "image", title: "Images", iconSrc: "./images.png" },
];

export const FeatureRail: React.FC<FeatureRailProps> = ({
  activeView,
  onSelectView,
  isImageMenuOpen,
  onToggleImageMenu,
}) => {
  return (
    <div className="pointer-events-auto ml-0 mr-0 self-stretch min-h-0 w-14 shrink-0 border-r-0 border-t-0 border-y-0 border-l border-solid border-theme-primary-400/35 backdrop-blur-md px-2.5 py-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.45),0_8px_18px">
      <div className="flex h-full flex-col items-center gap-4 px-2 py-4">
        {railItems.map((item) => {
          const isActive =
            item.id === "image" ? isImageMenuOpen : activeView === item.id;
          return (
            <DepthButton
              key={item.id}
              onClick={() => {
                if (item.id === "image") {
                  onToggleImageMenu();
                  return;
                }
                onSelectView(item.id);
              }}
              active={isActive}
              title={item.title}
              sizeClassName="h-10 w-10 "
              activeClassName="text-theme-primary-50 border-theme-primary-300/70"
              inactiveClassName="text-theme-primary-200/85 border-theme-primary-500/35 hover:text-theme-primary-100"
              activeSurfaceClassName="depth-active-surface"
              inactiveSurfaceClassName="depth-inactive-surface "
              className="transition-all duration-200 hover:scale-105 active:scale-95 rounded-xl"
            >
              <img
                src={item.iconSrc}
                alt={item.title}
                draggable={false}
                className={`h-7 w-7 object-contain transition-opacity duration-200 ${
                  isActive ? "opacity-100" : "opacity-80"
                }`}
                style={{ filter: "grayscale(1) contrast(1.2)" }}
              />
            </DepthButton>
          );
        })}
      </div>
    </div>
  );
};
