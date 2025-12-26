import React, { useState } from "react";
import { DashboardHeader } from "../DashboardHeader";
import {
  WindowLayoutCard,
  SettingsPanel,
  type RightPanelProps,
  type MainViewType,
} from "./index";

export const RightPanel: React.FC<RightPanelProps> = ({
  windows,
  currentLayout,
  focusedWindowId,
  onRefreshWindows,
  onClearAll,
  onLayoutChange,
  onWindowSelect,
  onWindowFocus,
  onWindowRemove,
  onWindowAdd,
  onPublishLayout,
}) => {
  const selectedWindows = windows.filter((w) => w.isSelected);
  const [mainView, setMainView] = useState<MainViewType>("windows");

  return (
    <div className="flex-1 h-full p-6 overflow-hidden no-scrollbar">
      {/* Bento Grid Layout */}
      <div className="h-full grid grid-cols-12 grid-rows-8 gap-4">
        {/* Header Card - Using imported component */}
        <DashboardHeader
          onRefreshWindows={onRefreshWindows}
          onClearAll={onClearAll}
          onPublishLayout={onPublishLayout}
          selectedWindowsCount={selectedWindows.length}
          onToggleSettings={() =>
            setMainView(mainView === "windows" ? "settings" : "windows")
          }
          isSettingsView={mainView === "settings"}
        />

        {/* Main Window Grid Card - Full right panel */}
        <div className="col-span-12 row-span-7 backdrop-blur-md bg-gradient-to-br from-transparent via-transparent to-stone-800/20 border border-stone-400 rounded-2xl py-4 px-2 shadow shadow-primary-500/30 flex flex-col">
          {/* Fixed height container that never overflows */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {mainView === "windows" ? (
              <WindowLayoutCard
                selectedWindows={selectedWindows}
                focusedWindowId={focusedWindowId}
                onWindowFocus={onWindowFocus}
                onWindowRemove={onWindowRemove}
                onWindowAdd={onWindowAdd}
              />
            ) : (
              <SettingsPanel />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
