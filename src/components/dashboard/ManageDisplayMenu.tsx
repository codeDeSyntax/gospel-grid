import React from "react";
import { EyeClosed, EyeOff } from "lucide-react";
import { FcDeleteRow } from "react-icons/fc";
import { type WindowInfo } from "./picker/WindowPicker";
import { getWindowFallbackIcon } from "@/utils/appIconMapping";

interface ManageDisplayMenuProps {
  open: boolean;
  menuRootId?: number | null;
  assignedWindowIds: string[];
  hiddenWindowIds: Set<string>;
  windowMap: Map<string, WindowInfo>;
  onClose: () => void;
  onToggleHidden: (windowId: string) => void;
  onRemove: (windowId: string) => void;
}

export const ManageDisplayMenu: React.FC<ManageDisplayMenuProps> = ({
  open,
  menuRootId,
  assignedWindowIds,
  hiddenWindowIds,
  windowMap,
  onClose,
  onToggleHidden,
  onRemove,
}) => {
  if (!open) return null;

  return (
    <div
      data-manage-menu-root={menuRootId ?? undefined}
      className="absolute inset-0 z-[9999] grid place-items-center bg-black/35 backdrop-blur-md pointer-events-none"
    >
      <div className="pointer-events-auto w-[min(19rem,calc(100%-1rem))] overflow-hidden rounded-3xl border border-slate-200 bg-transparent shadow-[0_22px_50px_rgba(15,23,42,0.24)]">
        <div className="border-b border-slate-200 px-4 py-1">
          <p className="mb-1 text-[11px] font-[impact] font-semibold uppercase tracking-[0.12em] text-theme-primary-100">
            Manage Windows on this Screen
          </p>
        </div>

        <div className="max-h-[min(18rem,calc(100%-7rem))] overflow-y-auto px-4 space-y-1.5">
          {assignedWindowIds.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300  px-3 py-3 text-center text-[10px] text-theme-primary-300 shadow-sm">
              No windows are assigned to this screen yet.
            </div>
          ) : (
            assignedWindowIds.map((windowId) => {
              const win = windowMap.get(windowId);
              if (!win) return null;
              const isHidden = hiddenWindowIds.has(windowId);

              return (
                <div
                  key={`${windowId}-manage`}
                  className="rounded-xl border border-slate-200 bg-theme-primary-500/40 p-0.5  transition-all hover:border-slate-300 hover:shadow-md"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-theme-primary-600/50 text-slate-700">
                      {win.icon ? (
                        <img
                          src={win.icon}
                          alt={`${win.app} icon`}
                          className="h-5 w-5 object-contain"
                          draggable={false}
                        />
                      ) : (
                        <div className="scale-90">
                          {getWindowFallbackIcon(win, 16)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[10px] font-semibold text-theme-primary-100 leading-tight">
                            {win.name}
                          </p>
                          <p className="truncate text-[9px] text-theme-primary-300 leading-tight">
                            {win.app}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => onToggleHidden(windowId)}
                            className="rounded-full border border-slate-200 p-1 text-[10px] font-semibold uppercase tracking-wide text-theme-primary-300 transition-colors hover:bg-theme-primary-600/30"
                            title={isHidden ? "Show window" : "Hide window"}
                          >
                            {isHidden ? (
                              <EyeClosed className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(windowId)}
                            className="rounded-full border border-rose-200 p-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 transition-colors hover:bg-theme-primary-600/30"
                            title="Remove window from this screen"
                          >
                            <FcDeleteRow className="h-5 w-5"  />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="border-t hidden border-slate-200 px-3 py-2  items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700 transition-colors hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
