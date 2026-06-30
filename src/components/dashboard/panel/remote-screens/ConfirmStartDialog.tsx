import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import type { RemoteScreenViewRequest } from "@/types/electron";

/**
 * Shown on PC A (the requester) after PC B has accepted the view request.
 * PC A must explicitly confirm they still want to proceed before the server
 * allows PC B to begin sharing. This is the second-step security confirmation.
 */
export const ConfirmStartDialog: React.FC<{
  request: RemoteScreenViewRequest | null;
  onConfirm: (request: RemoteScreenViewRequest) => void;
  onCancel: (requestId: string) => void;
}> = ({ request, onConfirm, onCancel }) => (
  <AnimatePresence>
    {request ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-theme-primary-950/75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onCancel(request.request.id)}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-start-dialog-title"
          className="relative w-full max-w-md overflow-hidden rounded-xl border border-solid border-theme-primary-700 bg-theme-primary-900 shadow-2xl shadow-black/35"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-solid border-sky-300/50 bg-sky-500 text-sky-50">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p
                    id="confirm-start-dialog-title"
                    className="text-base font-semibold text-theme-primary-50"
                  >
                    Access approved — confirm to start
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-theme-primary-300">
                    The remote PC accepted your request. Confirm below to begin
                    viewing their screen.
                  </p>
                </div>
              </div>
              <DepthButton
                onClick={() => onCancel(request.request.id)}
                title="Cancel"
                sizeClassName="h-8 w-8 rounded-lg"
                inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
              >
                <X className="h-3.5 w-3.5" />
              </DepthButton>
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="rounded-2xl bg-theme-primary-950 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-theme-primary-300">
                Sharing PC
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-theme-primary-50">
                {request.fromDevice?.name || "Unknown Wingrid device"}
              </p>
              <p className="mt-1 truncate text-[11px] text-theme-primary-300">
                {request.fromDevice?.id || request.request.toDeviceId}
              </p>
            </div>

            <div className="mt-3 rounded-2xl border border-solid border-sky-500/25 bg-sky-500/10 px-4 py-3">
              <p className="text-xs leading-relaxed text-sky-100">
                This is a second confirmation to verify your intent. Your session
                token has been validated by the server. Pressing{" "}
                <span className="font-semibold">Start Viewing</span> will begin
                the live screen stream.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4">
            <DepthButton
              onClick={() => onCancel(request.request.id)}
              sizeClassName="h-9 px-4 rounded-lg"
              inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Cancel
              </span>
            </DepthButton>
            <DepthButton
              onClick={() => onConfirm(request)}
              sizeClassName="h-9 px-4 rounded-lg"
              active
              activeClassName="text-sky-50 border-solid border-sky-300/60"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Start Viewing
              </span>
            </DepthButton>
          </div>
        </motion.div>
      </div>
    ) : null}
  </AnimatePresence>
);
