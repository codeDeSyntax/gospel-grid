import React, { useState } from "react";
import { Eye, EyeOff, Trash2, X } from "lucide-react";
import { type WindowInfo } from "./picker/WindowPicker";
import { getWindowFallbackIcon } from "@/utils/appIconMapping";
import { useAppSelector } from "@/store/hooks";

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
  const isDarkMode = useAppSelector((state) => state.app.isDarkMode);
  const [isDragging, setIsDragging] = useState(false);
  const [draggingWindowId, setDraggingWindowId] = useState<string | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  if (!open) return null;

  const handleDragStart = (windowId: string) => {
    setIsDragging(true);
    setDraggingWindowId(windowId);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggingWindowId(null);
    setIsOverTrash(false);
  };

  const handleTrashDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(true);
  };

  const handleTrashDragLeave = () => {
    setIsOverTrash(false);
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggingWindowId) {
      onRemove(draggingWindowId);
    }
    setIsDragging(false);
    setDraggingWindowId(null);
    setIsOverTrash(false);
  };

  return (
    <div
      data-manage-menu-root={menuRootId ?? undefined}
      className="absolute inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black/55 backdrop-blur-[5px] pointer-events-none"
    >
      {/* Card */}
      <div
        className={`pointer-events-auto overflow-visible rounded-2xl border backdrop-blur-2xl flex flex-col animate-in fade-in zoom-in-95 duration-150 min-w-[14rem] max-w-[96%] ${
          isDarkMode
            ? "border-white/10 bg-[#161616]/95 shadow-[0_24px_60px_rgba(0,0,0,0.55)] text-white"
            : "border-neutral-200 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.15)] text-neutral-900"
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b ${
            isDarkMode ? "border-white/8" : "border-neutral-200"
          }`}
        >
          <div>
            <p
              className={`text-[10px] font-bold uppercase tracking-widest ${
                isDarkMode ? "text-white" : "text-neutral-900"
              }`}
            >
              Manage Layout
            </p>
            <p
              className={`text-[9px] mt-0.5 leading-none ${
                isDarkMode ? "text-white/50" : "text-neutral-500"
              }`}
            >
              {assignedWindowIds.length} window{assignedWindowIds.length !== 1 ? "s" : ""} assigned
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer ${
              isDarkMode
                ? "text-white/60 hover:text-white hover:bg-white/10"
                : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
            }`}
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Avatar Stack Row */}
        <div className="px-5 pt-4 pb-5">
          {assignedWindowIds.length === 0 ? (
            <div
              className={`rounded-xl border border-dashed px-4 py-5 text-center text-[10px] ${
                isDarkMode
                  ? "border-white/10 text-white/50"
                  : "border-neutral-300 text-neutral-500"
              }`}
            >
              No windows assigned yet.
            </div>
          ) : (
            <>
              <div className="flex items-end justify-center">
                {assignedWindowIds.map((windowId, i) => {
                  const win = windowMap.get(windowId);
                  if (!win) return null;
                  const isHidden = hiddenWindowIds.has(windowId);
                  const isBeingDragged = draggingWindowId === windowId;

                  return (
                    <div
                      key={windowId}
                      draggable
                      onDragStart={() => handleDragStart(windowId)}
                      onDragEnd={handleDragEnd}
                      className="group relative hover:z-[60] cursor-grab active:cursor-grabbing"
                      style={{ marginLeft: i === 0 ? 0 : -16, zIndex: i + 1 }}
                    >
                      {/* Avatar circle */}
                      <div
                        className={`relative rounded-full border-[2.5px] flex items-center justify-center transition-all duration-200 ease-out select-none overflow-hidden
                          group-hover:-translate-y-2 group-hover:scale-110 group-hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)]
                          ${isDarkMode ? "border-[#161616]" : "border-white"}
                          ${isBeingDragged ? "opacity-30 scale-95" : ""}
                          ${
                            isHidden
                              ? isDarkMode
                                ? "opacity-40 bg-[#252525]"
                                : "opacity-40 bg-neutral-200"
                              : isDarkMode
                                ? "bg-[#282828] shadow-sm"
                                : "bg-neutral-100 shadow-sm"
                          }
                        `}
                        style={{ width: 52, height: 52 }}
                      >
                        {/* Window icon */}
                        {win.icon ? (
                          <>
                            <img
                              src={win.icon}
                              alt={win.app}
                              className="w-8 h-8 object-contain"
                              draggable={false}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <span className="items-center justify-center" style={{ display: "none" }}>
                              {getWindowFallbackIcon(win, 26)}
                            </span>
                          </>
                        ) : (
                          <span className="flex items-center justify-center">
                            {getWindowFallbackIcon(win, 26)}
                          </span>
                        )}

                        {/* Eye toggle overlay — appears on hover */}
                        <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleHidden(windowId);
                            }}
                            className="w-full h-full rounded-full flex items-center justify-center border-none bg-transparent text-white cursor-pointer"
                            title={isHidden ? "Show on display/Drag to remove from display" : "Hide from display/Drag to remove from display"}
                          >
                            {isHidden
                              ? <Eye className="w-5 h-5 drop-shadow-lg" />
                              : <EyeOff className="w-5 h-5 drop-shadow-lg" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* App name label below avatar */}
                      <p
                        className={`text-center text-[8px] font-medium mt-1.5 truncate leading-none ${
                          isDarkMode ? "text-white/70" : "text-neutral-700"
                        }`}
                        style={{ maxWidth: 52 }}
                      >
                        {win.app || win.name}
                      </p>
                    </div>
                  );
                })}
              </div>

            
            </>
          )}
        </div>
      </div>

      {/* Trash drop zone — sleek gradient strip */}
      <div
        className={`pointer-events-none w-[90%] max-w-[16rem] transition-all duration-300 ease-out ${
          isDragging
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "opacity-0 translate-y-4"
        }`}
        onDragOver={handleTrashDragOver}
        onDragLeave={handleTrashDragLeave}
        onDrop={handleTrashDrop}
      >
        <div
          className={`relative w-full h-10 rounded-2xl flex items-center justify-center gap-2 overflow-hidden transition-all duration-250 ${
            isOverTrash
              ? "shadow-[0_0_40px_rgba(220,38,38,0.45)]"
              : ""
          }`}
        >
          {/* Gradient background */}
          <div className={`absolute inset-0 transition-all duration-250 ${
            isOverTrash
              ? "bg-gradient-to-r from-red-900/80 via-red-700/70 to-red-900/80"
              : "bg-gradient-to-r from-red-950/40 via-red-900/30 to-red-950/40"
          }`} />
          {/* Subtle top edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          {/* Bottom edge */}
          <div className={`absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-600/50 to-transparent transition-opacity duration-200 ${isOverTrash ? "opacity-100" : "opacity-40"}`} />

          <Trash2
            className={`relative z-10 w-3.5 h-3.5 transition-all duration-200 ${
              isOverTrash ? "text-red-300 scale-110" : "text-red-500/50"
            }`}
          />
          <p className={`relative z-10 text-[9px] font-semibold tracking-wide transition-colors duration-200 select-none ${
            isOverTrash ? "text-red-200" : "text-red-500/50"
          }`}>
            {isOverTrash ? "Release to remove" : "Drop here to remove"}
          </p>
        </div>
      </div>
    </div>
  );
};
