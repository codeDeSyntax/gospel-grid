import React from "react";
import { useDispatch } from "react-redux";
import { Trash2, AlertTriangle } from "lucide-react";
import { showNotification } from "../../../store/slices/notificationSlice";
import { getAppIcon } from "../../../utils/appIconMapping";
import type { PresetsCardProps } from "./types";

export const PresetsCard: React.FC<PresetsCardProps> = ({
  presets,
  selectedPreset,
  availableWindows = [],
  onPresetSelect,
  onPresetDelete,
}) => {
  const dispatch = useDispatch();

  // Component for rendering window icons with fallback
  const WindowIcon: React.FC<{
    window: {
      name: string;
      app: string;
      icon?: string;
      hasNativeIcon?: boolean;
    };
    size?: number;
    className?: string;
  }> = ({ window, size = 14, className = "" }) => {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {window.icon ? (
          <img
            src={window.icon}
            alt={`${window.app} icon`}
            className="w-full h-full object-contain"
            style={{
              filter: "contrast(1.1) brightness(1.05)",
            }}
            onError={(e) => {
              // Fallback to React icon if image fails to load
              e.currentTarget.style.display = "none";
              const fallback = e.currentTarget
                .nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = "flex";
            }}
          />
        ) : null}
        {/* Fallback React icon */}
        <div
          style={{ display: window.icon ? "none" : "flex" }}
          className="w-full h-full items-center justify-center"
        >
          {getAppIcon(window.app, size)}
        </div>
      </div>
    );
  };

  const handlePresetClick = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId);

    if (preset && preset.windows && preset.windows.length > 0) {
      // Use actual stored window data for checking availability
      const availableWindowNames = availableWindows.map((w) =>
        w.name.toLowerCase()
      );
      const availableAppNames = availableWindows.map((w) =>
        w.app.toLowerCase()
      );

      const missingWindows = preset.windows.filter((presetWindow) => {
        const nameLower = presetWindow.name.toLowerCase();
        const appLower = presetWindow.app.toLowerCase();

        return (
          !availableWindowNames.some(
            (name) => name.includes(nameLower) || nameLower.includes(name)
          ) &&
          !availableAppNames.some(
            (app) => app.includes(appLower) || appLower.includes(app)
          )
        );
      });

      if (missingWindows.length > 0) {
        dispatch(
          showNotification({
            type: "warning",
            title: "Required Windows Missing",
            message: `The preset "${
              preset.name
            }" requires the following windows that are not currently available: ${missingWindows
              .map((w) => w.name)
              .join(", ")}. Please open these applications and try again.`,
            autoClose: 3000,
          })
        );
        return;
      }

      // Show success message when all windows are available
      dispatch(
        showNotification({
          type: "success",
          title: "Preset Applied",
          message: `"${preset.name}" preset has been applied successfully with ${preset.windowCount} windows.`,
          autoClose: 3000,
        })
      );
    } else if (
      preset &&
      preset.requiredWindows &&
      preset.requiredWindows.length > 0
    ) {
      // Fallback to mock data for backward compatibility
      const availableWindowNames = availableWindows.map((w) =>
        w.name.toLowerCase()
      );
      const availableAppNames = availableWindows.map((w) =>
        w.app.toLowerCase()
      );

      const missingWindows = preset.requiredWindows.filter((requiredWindow) => {
        const reqLower = requiredWindow.toLowerCase();
        return (
          !availableWindowNames.some(
            (name) => name.includes(reqLower) || reqLower.includes(name)
          ) &&
          !availableAppNames.some(
            (app) => app.includes(reqLower) || reqLower.includes(app)
          )
        );
      });

      if (missingWindows.length > 0) {
        dispatch(
          showNotification({
            type: "warning",
            title: "Required Windows Missing",
            message: `The preset "${
              preset.name
            }" requires the following windows that are not currently available: ${missingWindows.join(
              ", "
            )}. Please open these applications and try again.`,
            autoClose: 8000,
          })
        );
        return;
      }

      dispatch(
        showNotification({
          type: "success",
          title: "Preset Applied",
          message: `"${preset.name}" preset has been applied successfully with ${preset.windowCount} windows.`,
          autoClose: 3000,
        })
      );
    }

    onPresetSelect(presetId);
  };

  const handleDeleteClick = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation(); // Prevent preset selection when clicking delete

    if (onPresetDelete) {
      const preset = presets.find((p) => p.id === presetId);
      dispatch(
        showNotification({
          type: "question",
          title: "Delete Preset",
          message: `Are you sure you want to delete "${preset?.name}"? This action cannot be undone.`,
          persistent: true,
          buttons: [
            {
              text: "Cancel",
              action: "cancel",
              variant: "secondary",
            },
            {
              text: "Delete",
              action: "confirm",
              variant: "danger",
            },
          ],
          onAction: (action) => {
            if (action === "confirm") {
              onPresetDelete(presetId);
              dispatch(
                showNotification({
                  type: "success",
                  title: "Preset Deleted",
                  message: `"${preset?.name}" has been deleted successfully.`,
                  autoClose: 3000,
                })
              );
            }
          },
        })
      );
    }
  };
  return (
    <div className="col-span-5 row-span-4 backdrop-blur-2xl bg-gradient-to-b from-transparent via-transparent to-theme-primary-800/20 border border-solid border-theme-primary-400/50 rounded-2xl px-4 shadowlg shadow-theme-primary-500/30 flex flex-col relative">
      {/* Warning indicator - positioned absolutely within the main card */}
      <div className="absolute top-3 right-4 opacity-60 hover:opacity-80 transition-opacity duration-200">
        <div className="flex items-center gap-1 text-stone-400 text-[10px] bg-black/20 px-2 py-1 rounded-md backdrop-blur-sm">
          <AlertTriangle className="w-3 h-3" />
          <span>Requires apps</span>
        </div>
      </div>

      <div className="flex items-center justify-between  flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-theme-primary-400">📋</span>
          <h3 className="text-lg font-semibold text-white">Saved Presets</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="space-y-3 pr-2">
          {presets.length === 0 ? (
            <div className="text-stone-400 text-sm text-center py-2">
              No saved presets yet. Select windows and save your first preset!
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handlePresetClick(preset.id)}
                className={`relative backdrop-blur-xl border rounded-2xl p-2 cursor-pointer transition-all duration-300 group overflow-hidden ${
                  selectedPreset === preset.id
                    ? "bg-gradient-to-br from-theme-primary-500/20 via-theme-primary-600/10 to-theme-primary-700/20 border-theme-primary-400/60 shadow-2xl shadow-theme-primary-500/20 ring-1 ring-theme-primary-400/30"
                    : "bg-gradient-to-br from-theme-primary-800/40 via-theme-primary-900/30 to-theme-primary-800/40 border-gray-600/40 hover:border-theme-primary-500/50 hover:shadow-xl hover:shadow-theme-primary-500/10"
                }   transform`}
              >
                {/* Gradient overlay for selected state */}
                {selectedPreset === preset.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-theme-primary-500/5 via-transparent to-theme-primary-400/5 rounded-2xl"></div>
                )}

                <div className="relative z-10">
                  {/* Main content area */}
                  <div className="flex items-center justify-between mb-3">
                    {/* Left side: Overlapping app icons */}
                    <div className="flex items-center">
                      {preset.windows && preset.windows.length > 0 ? (
                        <div className="flex -space-x-3">
                          {preset.windows.slice(0, 4).map((window, index) => (
                            <div
                              key={index}
                              className={`relative w-12 h-12 shadow-inner shadow-theme-primary-900 rounded-full border-olid border-3 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:z-20 hover:-translate-y-1 ${
                                selectedPreset === preset.id
                                  ? "border-theme-primary-400/70 bg-gradient-to-br from-theme-primary-500/90 to-theme-primary-600/90 shadow-theme-primary-500/30"
                                  : "border-theme-primary-600/50 bg-gradient-to-br from-theme-primary-700/80 to-theme-primary-800/80 group-hover:border-theme-primary-500/70 group-hover:shadow-theme-primary-500/20"
                              }`}
                              style={{
                                zIndex:
                                  (preset.windows?.length || 0) - index + 10,
                              }}
                              title={`${window.app} - ${window.name}`}
                            >
                              <WindowIcon
                                window={window}
                                size={40}
                                className="w-8 h-8"
                              />
                            </div>
                          ))}

                          {/* Show +N indicator if more than 4 apps */}
                          {preset.windows.length > 4 && (
                            <div
                              className={`relative w-12 h-12 rounded-full border-3 flex items-center justify-center text-sm font-bold shadow-xl ${
                                selectedPreset === preset.id
                                  ? "border-theme-primary-400/70 bg-gradient-to-br from-theme-primary-500/90 to-theme-primary-600/90 text-theme-primary-50 shadow-theme-primary-500/30"
                                  : "border-theme-primary-600/50 bg-gradient-to-br from-theme-primary-700/80 to-theme-primary-800/80 text-theme-primary-200 group-hover:border-theme-primary-500/70"
                              }`}
                            >
                              +{preset.windows.length - 4}
                            </div>
                          )}
                        </div>
                      ) : preset.requiredWindows &&
                        preset.requiredWindows.length > 0 ? (
                        // Fallback to mock data for backward compatibility
                        <div className="flex -space-x-3">
                          {preset.requiredWindows
                            .slice(0, 4)
                            .map((windowName, index) => (
                              <div
                                key={index}
                                className={`relative w-12 h-12 rounded-full border-3 flex items-center justify-center text-white shadow-xl transition-all duration-300 hover:scale-110 hover:z-20 hover:-translate-y-1 ${
                                  selectedPreset === preset.id
                                    ? "border-theme-primary-400/70 bg-gradient-to-br from-theme-primary-500/90 to-theme-primary-600/90 shadow-theme-primary-500/30"
                                    : "border-theme-primary-600/50 bg-gradient-to-br from-theme-primary-700/80 to-theme-primary-800/80 group-hover:border-theme-primary-500/70 group-hover:shadow-theme-primary-500/20"
                                }`}
                                style={{
                                  zIndex:
                                    (preset.requiredWindows?.length || 0) -
                                    index +
                                    10,
                                }}
                                title={windowName}
                              >
                                <div className="text-lg">
                                  {getAppIcon(windowName, 20)}
                                </div>
                              </div>
                            ))}

                          {preset.requiredWindows.length > 4 && (
                            <div
                              className={`relative w-12 h-12 rounded-full border-3 flex items-center justify-center text-sm font-bold shadow-xl ${
                                selectedPreset === preset.id
                                  ? "border-theme-primary-400/70 bg-gradient-to-br from-theme-primary-500/90 to-theme-primary-600/90 text-theme-primary-50 shadow-theme-primary-500/30"
                                  : "border-theme-primary-600/50 bg-gradient-to-br from-theme-primary-700/80 to-theme-primary-800/80 text-theme-primary-200 group-hover:border-theme-primary-500/70"
                              }`}
                            >
                              +{preset.requiredWindows.length - 4}
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Right side: Actions and indicators */}
                    <div className="flex items-center gap-3">
                      {/* Delete button */}
                      {onPresetDelete && (
                        <button
                          onClick={(e) => handleDeleteClick(e, preset.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-2 hover:bg-red-500/20 rounded-xl hover:scale-110 transform"
                          title="Delete preset"
                        >
                          <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                        </button>
                      )}

                      {/* Active indicator */}
                      {selectedPreset === preset.id && (
                        <div className="w-2.5 h-2.5 bg-theme-primary-400 rounded-full animate-pulse shadow-lg shadow-theme-primary-400/50"></div>
                      )}
                    </div>
                  </div>

                  {/* Preset name tag - positioned below avatars */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all duration-200 ${
                        selectedPreset === preset.id
                          ? "bg-theme-primary-500/25 text-theme-primary-100 border border-theme-primary-400/30"
                          : "bg-theme-primary-800/40 text-theme-primary-300 border border-theme-primary-700/30 group-hover:bg-theme-primary-600/30 group-hover:text-theme-primary-200"
                      }`}
                    >
                      {preset.name}
                    </div>

                    {selectedPreset === preset.id && (
                      <span className="text-theme-primary-300 font-medium text-[10px]">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
