import React from "react";
import { Layers3, X } from "lucide-react";

interface WindowLimitModalProps {
  isOpen: boolean;
  maxWindows: number;
  windowName?: string | null;
  onClose: () => void;
}

export const WindowLimitModal: React.FC<WindowLimitModalProps> = ({
  isOpen,
  maxWindows,
  windowName,
  onClose,
}) => {
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default border-0 bg-transparent"
        onClick={onClose}
        aria-label="Close window limit message"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-2xl border border-solid border-theme-primary-700 bg-theme-primary-950 shadow-2xl shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary-500" />

        <div className="flex items-start gap-4 px-5 pb-4 pt-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-500/14 text-primary-200">
            <Layers3 className="h-5 w-5" strokeWidth={2.4} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-theme-primary-50">
              This screen is full
            </p>
            <p className="mt-2 text-xs leading-relaxed text-theme-primary-200">
              Wingrid can place up to {maxWindows} windows on one screen. Remove
              one window first, then add another.
            </p>
            {windowName ? (
              <div className="mt-4 rounded-xl bg-theme-primary-900 px-3 py-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-theme-primary-300">
                  Not added
                </p>
                <p className="mt-1 truncate text-xs text-theme-primary-100">
                  {windowName}
                </p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-0 bg-transparent text-theme-primary-300 transition-colors hover:bg-theme-primary-800 hover:text-theme-primary-50"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-end bg-theme-primary-900/70 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="h-8 rounded-lg border-0 bg-primary-500 px-4 text-xs font-semibold text-white transition-colors hover:bg-primary-600"
          >
            Got it
          </button>
        </div>
      </section>
    </div>
  );
};
