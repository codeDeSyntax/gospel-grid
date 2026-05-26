import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import type { RemoteScreenViewRequest } from "@/types/electron";

export const AccessPermissionDialog: React.FC<{
  request: RemoteScreenViewRequest | null;
  onDeny: (requestId: string) => void;
  onAllow: (request: RemoteScreenViewRequest) => void;
}> = ({ request, onDeny, onAllow }) => (
  <AnimatePresence>
    {request ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-theme-primary-950/75 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onDeny(request.request.id)}
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="remote-access-dialog-title"
          className="relative w-full max-w-md overflow-hidden rounded-xl border border-solid border-theme-primary-700 bg-theme-primary-900 shadow-2xl shadow-black/35"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          <div className="px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-solid border-emerald-300/50 bg-emerald-500 text-emerald-50">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p
                    id="remote-access-dialog-title"
                    className="text-base font-semibold text-theme-primary-50"
                  >
                    Screen sharing request
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-theme-primary-300">
                    Another Wingrid PC is asking to view one of your screens.
                  </p>
                </div>
              </div>
              <DepthButton
                onClick={() => onDeny(request.request.id)}
                title="Deny request"
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
                Requesting PC
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-theme-primary-50">
                {request.fromDevice?.name || "Unknown Wingrid device"}
              </p>
              <p className="mt-1 truncate text-[11px] text-theme-primary-300">
                {request.fromDevice?.id || request.request.fromDeviceId}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-theme-primary-950 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-theme-primary-300">
                  Status
                </p>
                <p className="mt-1 text-sm font-semibold text-emerald-100">
                  Approval needed
                </p>
              </div>
              <div className="rounded-2xl bg-theme-primary-950 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-theme-primary-300">
                  Expires
                </p>
                <p className="mt-1 text-sm font-semibold text-theme-primary-50">
                  {new Date(request.request.expiresAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-theme-primary-300">
              If you allow it, you will choose exactly which screen or window to
              share. Nothing is shown until you make that choice.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 px-5 py-4">
            <DepthButton
              onClick={() => onDeny(request.request.id)}
              sizeClassName="h-9 px-4 rounded-lg"
              inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Deny
              </span>
            </DepthButton>
            <DepthButton
              onClick={() => onAllow(request)}
              sizeClassName="h-9 px-4 rounded-lg"
              active
              activeClassName="text-emerald-50 border-solid border-emerald-300/60"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide">
                Allow
              </span>
            </DepthButton>
          </div>
        </motion.div>
      </div>
    ) : null}
  </AnimatePresence>
);
