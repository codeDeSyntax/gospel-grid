import React, { useState, useEffect, useCallback } from "react";
import {
  Save,
  Trash2,
  Play,
  FolderOpen,
  Plus,
  Download,
  Upload,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setScenePresets,
  addScenePreset,
  removeScenePreset,
  type ScenePreset,
} from "@/store/slices/appSlice";

interface PresetsPanelProps {
  /** Currently selected windows in the Dashboard */
  selectedWindows: Array<{
    id: string;
    name: string;
    app: string;
    sourceId?: string;
    handle?: number;
  }>;
  /** Load a preset by applying its window selections */
  onLoadPreset: (preset: ScenePreset) => void;
}

export const PresetsPanel: React.FC<PresetsPanelProps> = ({
  selectedWindows,
  onLoadPreset,
}) => {
  const dispatch = useAppDispatch();
  const presets = useAppSelector((s) => s.app.scenePresets);
  const [newName, setNewName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Load presets from disk on mount
  useEffect(() => {
    loadPresetsFromDisk();
  }, []);

  const loadPresetsFromDisk = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await (window.electronAPI as any).loadPresets();
      if (result.success && result.presets) {
        dispatch(setScenePresets(result.presets));
      }
    } catch (err) {
      console.error("Failed to load presets:", err);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  const handleSavePreset = useCallback(async () => {
    if (!newName.trim() || selectedWindows.length === 0) return;

    const preset: ScenePreset = {
      id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: newName.trim(),
      windowCount: selectedWindows.length,
      createdAt: new Date().toISOString(),
      windows: selectedWindows.map((w) => ({
        id: w.id,
        name: w.name,
        app: w.app,
        sourceId: w.sourceId,
        handle: w.handle,
      })),
    };

    try {
      const result = await (window.electronAPI as any).savePreset(preset);
      if (result.success) {
        dispatch(addScenePreset(preset));
        setNewName("");
      }
    } catch (err) {
      console.error("Failed to save preset:", err);
    }
  }, [newName, selectedWindows, dispatch]);

  const handleDeletePreset = useCallback(
    async (presetId: string) => {
      try {
        const result = await (window.electronAPI as any).deletePreset(presetId);
        if (result.success) {
          dispatch(removeScenePreset(presetId));
        }
      } catch (err) {
        console.error("Failed to delete preset:", err);
      }
    },
    [dispatch],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSavePreset();
      }
    },
    [handleSavePreset],
  );

  // ── Import / Export ─────────────────────────────────────────────────────
  const handleExportPresets = useCallback(() => {
    if (presets.length === 0) return;
    const json = JSON.stringify(presets, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wingrid-presets-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [presets]);

  const handleImportPresets = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported: ScenePreset[] = JSON.parse(text);
        if (!Array.isArray(imported)) return;
        // Merge with existing presets (skip duplicates by id)
        const existingIds = new Set(presets.map((p) => p.id));
        for (const preset of imported) {
          if (preset.id && preset.name && preset.windows) {
            if (!existingIds.has(preset.id)) {
              dispatch(addScenePreset(preset));
              // Also save to disk
              await (window.electronAPI as any).savePreset(preset);
            }
          }
        }
      } catch (err) {
        console.error("Failed to import presets:", err);
      }
    };
    input.click();
  }, [presets, dispatch]);

  return (
    <div className="h-full w-full overflow-y-auto no-scrollbar text-white">
      <div className="px-5 pt-5 pb-10 max-w-2xl">
        {/* Title */}
        <h2 className="text-lg font-bold text-white tracking-tight mb-6">
          Scene Presets
        </h2>

        {/* Save Current Selection */}
        <h3 className="text-[10px] font-semibold text-theme-primary-400/50 uppercase tracking-[0.16em] mb-1">
          Save Current Selection
        </h3>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5 py-4 mb-4">
          {selectedWindows.length === 0 ? (
            <p className="text-[12px] text-white/30">
              Select windows first, then save them as a preset.
            </p>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preset name…"
                className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-[12px] text-white placeholder-white/25 focus:outline-none focus:border-theme-primary-400/40 transition-colors"
                maxLength={40}
              />
              <button
                onClick={handleSavePreset}
                disabled={!newName.trim()}
                className="flex items-center gap-1.5 bg-theme-primary-500/15 hover:bg-theme-primary-500/25 text-theme-primary-300 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          )}
          {selectedWindows.length > 0 && (
            <div className="mt-2 text-[11px] text-white/20">
              {selectedWindows.length} window
              {selectedWindows.length > 1 ? "s" : ""} selected:{" "}
              {selectedWindows.map((w) => w.app || w.name).join(", ")}
            </div>
          )}
        </div>

        {/* Saved Presets */}
        <h3 className="text-[10px] font-semibold text-theme-primary-400/50 uppercase tracking-[0.16em] mb-1 mt-2">
          Saved Presets
        </h3>

        {isLoading ? (
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5 py-8 text-center text-[12px] text-white/30">
            Loading presets…
          </div>
        ) : presets.length === 0 ? (
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5 py-8 text-center">
            <FolderOpen className="w-8 h-8 text-white/10 mx-auto mb-2" />
            <p className="text-[12px] text-white/30">No presets saved yet.</p>
            <p className="text-[11px] text-white/15 mt-1">
              Select windows and save them as a preset above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="group rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] px-4 py-3 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold text-white truncate">
                      {preset.name}
                    </div>
                    <div className="text-[11px] text-white/25 mt-0.5">
                      {preset.windowCount} window
                      {preset.windowCount > 1 ? "s" : ""} &middot;{" "}
                      {new Date(preset.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-white/15 mt-0.5 truncate">
                      {preset.windows.map((w) => w.app || w.name).join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3">
                    <button
                      onClick={() => onLoadPreset(preset)}
                      className="p-1.5 rounded-lg text-theme-primary-300/60 hover:text-theme-primary-300 hover:bg-theme-primary-500/10 transition-all"
                      title="Load this preset"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                      title="Delete this preset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Import / Export */}
        <h3 className="text-[10px] font-semibold text-theme-primary-400/50 uppercase tracking-[0.16em] mb-1 mt-4">
          Import / Export
        </h3>
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] px-5 py-4 flex gap-2">
          <button
            onClick={handleExportPresets}
            disabled={presets.length === 0}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white/70 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded-lg text-[12px] font-medium transition-all border border-white/[0.04]"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handleImportPresets}
            className="flex-1 flex items-center justify-center gap-1.5 bg-white/[0.03] hover:bg-white/[0.06] text-white/40 hover:text-white/70 px-3 py-2 rounded-lg text-[12px] font-medium transition-all border border-white/[0.04]"
          >
            <Upload className="w-3.5 h-3.5" />
            Import JSON
          </button>
        </div>

        {/* Hotkey reminder */}
        <div className="mt-6 rounded-xl bg-white/[0.01] border border-white/[0.03] px-5 py-4">
          <h3 className="text-[10px] font-semibold text-theme-primary-400/50 uppercase tracking-[0.16em] mb-2">
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 gap-y-1.5 text-[11px]">
            {[
              ["F5", "Toggle Projection"],
              ["F6", "Toggle Blackout"],
              ["F7", "Toggle Freeze"],
              ["F8", "Clear Selection"],
              ["Ctrl+Z", "Undo"],
              ["Ctrl+Y", "Redo"],
            ].map(([key, desc]) => (
              <React.Fragment key={key}>
                <span className="text-white/25 font-mono">{key}</span>
                <span className="text-white/40">{desc}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
