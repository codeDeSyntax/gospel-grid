import React, { useState } from "react";
import {
  WindowLayoutCard,
  SettingsPanel,
  type RightPanelProps,
  type MainViewType,
} from "./index";
import { MdCleanHands, MdSettingsApplications } from "react-icons/md";
import { BrushCleaningIcon } from "lucide-react";
import { GiSettingsKnobs } from "react-icons/gi";
import { FcSettings } from "react-icons/fc";

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
  showSettings = false,
  onToggleSettings,
  isProjectionOn = false,
  onCloseProjection,
}) => {
  const selectedWindows = windows.filter((w) => w.isSelected);

  React.useEffect(() => {
    console.log(
      "🔵 RightPanel - windows:",
      windows.length,
      "selected:",
      selectedWindows.length
    );
    console.log(
      "🔵 RightPanel - selectedWindows:",
      selectedWindows.map((w) => ({
        id: w.id,
        name: w.name,
        isSelected: w.isSelected,
      }))
    );
  }, [windows, selectedWindows]);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden">
      {/* Fixed Top Bar with Controls */} 
      <div className="shrink-0 h-10   bg-theme-primary-200 border-b-2 border-theme-primary-700/60 px-6 flex items-center justify-between shadow-xl">
        {/* Left side - Projection Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-theme-primary-950 text-sm font-bold font-[impact] tracking-wide uppercase">
            Projection
          </span>

          {/* Radio Button Group */}
          <div className="flex items-center gap-">
            {/* ON Radio */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <span
                className={`text-base font-extrabold transition-colors ${
                  isProjectionOn
                    ? "text-theme-primary-600"
                    : "text-theme-primary-800"
                }`}
              >
                ON
              </span>
              <input
                type="radio"
                name="projection"
                checked={isProjectionOn}
                onChange={() => {
                  if (!isProjectionOn && selectedWindows.length > 0) {
                    onPublishLayout();
                  }
                }}
                disabled={!isProjectionOn && selectedWindows.length === 0}
                className="appearance-none w-8 h-8 rounded-full border-solid border-3 border-theme-primary-600 cursor-pointer
                  checked:bg-theme-primary-500 checked:border-theme-primary-600 checked:shadow-[0_0_15px_var(--theme-primary-500)]
                  unchecked:bg-theme-primary-100 transition-all duration-300
                  disabled:opacity-40 disabled:cursor-not-allowed
                  relative
                  before:content-[''] before:absolute before:inset-0 before:rounded-full 
                  checked:before:bg-theme-primary-400 checked:before:animate-ping checked:before:opacity-75"
              />
            </label>

            {/* OFF Radio */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="projection"
                checked={!isProjectionOn}
                onChange={() => {
                  if (isProjectionOn) {
                    onCloseProjection?.();
                  }
                }}
                className="appearance-none w-8 h-8 rounded-full border-solid border-3 border-theme-primary-700 cursor-pointer
                  checked:bg-theme-primary-700 checked:border-theme-primary-800 checked:shadow-[0_0_10px_var(--theme-primary-700)]
                  unchecked:bg-theme-primary-100 transition-all duration-300
                  relative"
              />
              <span
                className={`text-base font-extrabold transition-colors ${
                  !isProjectionOn
                    ? "text-theme-primary-800"
                    : "text-theme-primary-700"
                }`}
              >
                OFF
              </span>
            </label>
          </div>
        </div>

        {/* Right side - Action Icons */}
        <div className="flex items-center gap-2">
          {/* Clear All Icon */}
          <button
            onClick={onClearAll}
            className=" cursor-pointer bg-transparent rounded-full hover:bg-theme-primary-300/60 transition-all flex items-center justify-center group shadow-sm hover:shadow-md"
            title="Clear all selected windows"
          >
            <BrushCleaningIcon className="w-6 h-6 text-theme-primary-800 group-hover:text-theme-primary-950 transition-all" />
          </button>

          {/* Settings Icon */}
          <button
            onClick={onToggleSettings}
            className={` cursor-pointer  bg-transparent rounded-full hover:bg-theme-primary-300/60 transition-all flex items-center justify-center group shadow-sm hover:shadow-md ${
              showSettings ? "bg-theme-primary-300/80 shadow-md" : ""
            }`}
            title="Settings"
          >
            <FcSettings className="w-6 h-6 text-theme-primary-800 group-hover:text-theme-primary-950 transition-all" />
          </button>
        </div>
      </div>

      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-auto flex items-center justify-center w-full">
        {showSettings ? (
          <SettingsPanel />
        ) : (
          <WindowLayoutCard
            selectedWindows={selectedWindows}
            focusedWindowId={focusedWindowId}
            onWindowFocus={onWindowFocus}
            onWindowRemove={onWindowRemove}
            onWindowAdd={onWindowAdd}
          />
        )}
      </div>
    </div>
  );
};
