import React from "react";
import { GridTile } from "./GridTile";
import type { WindowInfo } from "./WindowList";

interface MainGridProps {
  windows: WindowInfo[];
  layout: string;
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
}

export const MainGrid: React.FC<MainGridProps> = ({
  windows,
  layout,
  focusedWindowId,
  onWindowFocus,
  onWindowRemove,
}) => {
  const selectedWindows = windows.filter((w) => w.isSelected);
  const tileCount = selectedWindows.length;

  const getGridClasses = (): string => {
    const baseClasses = "grid gap-4 h-full";

    if (layout === "2x2") {
      return `${baseClasses} grid-cols-2 grid-rows-2`;
    } else if (layout === "3x2") {
      return `${baseClasses} grid-cols-3 grid-rows-2`;
    } else if (layout === "focus") {
      return `${baseClasses} grid-cols-3 grid-rows-3`;
    } else {
      // Auto layout based on tile count
      if (tileCount === 0) {
        return `${baseClasses} grid-cols-1`;
      } else if (tileCount === 1) {
        return `${baseClasses} grid-cols-1`;
      } else if (tileCount === 2) {
        return `${baseClasses} grid-cols-2`;
      } else if (tileCount === 3) {
        return `${baseClasses} grid-cols-3`;
      } else if (tileCount === 4) {
        return `${baseClasses} grid-cols-2 grid-rows-2`;
      } else if (tileCount <= 6) {
        return `${baseClasses} grid-cols-3 grid-rows-2`;
      } else {
        return `${baseClasses} grid-cols-4 auto-rows-fr`;
      }
    }
  };

  const getFocusLayout = () => {
    if (layout !== "focus" || !focusedWindowId) {
      return {};
    }

    // Create focus layout styles
    const focusedIndex = selectedWindows.findIndex(
      (w) => w.id === focusedWindowId
    );
    if (focusedIndex === -1) return {};

    return {
      gridTemplateAreas: `
        "main main side1"
        "main main side2" 
        "bottom1 bottom2 side3"
      `,
      gridTemplateColumns: "2fr 2fr 1fr",
      gridTemplateRows: "2fr 2fr 1fr",
    };
  };

  const getTileStyle = (index: number, windowId: string) => {
    if (layout === "focus" && focusedWindowId) {
      if (windowId === focusedWindowId) {
        return { gridArea: "main" };
      } else {
        const nonFocusedIndex = selectedWindows
          .filter((w) => w.id !== focusedWindowId)
          .findIndex((w) => w.id === windowId);

        const areas = ["side1", "side2", "side3", "bottom1", "bottom2"];
        return { gridArea: areas[nonFocusedIndex] || "auto" };
      }
    }
    return {};
  };

  if (selectedWindows.length === 0) {
    return (
      <div className="flex-1 p-6 relative">
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <div className="text-8xl mb-8 opacity-20">📺</div>
            <div className="text-2xl font-semibold text-white mb-4">
              No Windows Selected
            </div>
            <div className="text-blue-200/70 text-lg">
              Click on windows in the sidebar to add them to the grid
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 relative overflow-hidden no-scrollbar">
      <div
        className={getGridClasses()}
        style={layout === "focus" ? getFocusLayout() : {}}
      >
        {selectedWindows.map((window, index) => (
          <div
            key={window.id}
            style={getTileStyle(index, window.id)}
            className="min-h-0"
          >
            <GridTile
              window={window}
              isFocused={focusedWindowId === window.id}
              onFocus={() => onWindowFocus(window.id)}
              onRemove={() => onWindowRemove(window.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
