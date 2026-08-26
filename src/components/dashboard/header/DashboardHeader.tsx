import React from "react";
import { ExternalLink, BrushCleaning, Settings, X } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

interface DashboardHeaderProps {
  onRefreshWindows: () => void;
  onClearAll: () => void;
  onPublishLayout: () => void;
  selectedWindowsCount: number;
  onToggleSettings: () => void;
  isSettingsView: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onRefreshWindows,
  onClearAll,
  onPublishLayout,
  selectedWindowsCount,
  onToggleSettings,
  isSettingsView,
}) => {
  // Read projection state directly from the Redux store — no IPC polling needed.
  // AutoFitWindowLayoutOptimized already manages this value via checkPublishedWindows().
  const hasPublishedWindows = useAppSelector((state) => state.app.isProjectionOn);

  const handleCloseProjection = async () => {
    try {
      await (window.electronAPI as any).closePublishedWindows();
    } catch (error) {
      console.error("Error closing published windows:", error);
    }
  };
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex gap-2">
        <button
          onClick={onClearAll}
          className="flex items-center cursor-pointer gap-1.5 px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-all border border-red-700 shadow-sm whitespace-nowrap"
        >
          <BrushCleaning className="w-3 h-3 flex-shrink-0" />
          Clear All
        </button>

        <button
          onClick={onPublishLayout}
          disabled={selectedWindowsCount === 0}
          className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 bg-theme-primary-800 hover:bg-theme-primary-700 disabled:bg-theme-primary-900 disabled:cursor-not-allowed text-white rounded text-xs font-medium transition-all border border-theme-primary-700 border-solid disabled:border-gray-500 shadow-sm whitespace-nowrap"
          title="Publish layout to full-screen window"
        >
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
          Publish ({selectedWindowsCount})
        </button>

        {hasPublishedWindows && (
          <button
            onClick={handleCloseProjection}
            className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-medium transition-all border border-orange-700 shadow-sm whitespace-nowrap"
            title="Close projection window"
          >
            <X className="w-3 h-3 flex-shrink-0" />
            Close Projection
          </button>
        )}
      </div>

      {/* Right side - Settings toggle */}
      <div className="flex items-center">
        <button
          onClick={onToggleSettings}
          className={`flex items-center cursor-pointer gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all border shadow-sm whitespace-nowrap ${
            isSettingsView
              ? "bg-theme-primary-700 hover:bg-theme-primary-800 text-white border-theme-primary-800"
              : "bg-theme-primary-800 text-white border-theme-primary-900 hover:bg-theme-primary-900"
          }`}
          title={isSettingsView ? "Back to Window Layout" : "Open Settings"}
        >
          <Settings className="w-3 h-3 flex-shrink-0" />
          {isSettingsView ? "Back" : "Settings"}
        </button>
      </div>
    </div>
  );
};
