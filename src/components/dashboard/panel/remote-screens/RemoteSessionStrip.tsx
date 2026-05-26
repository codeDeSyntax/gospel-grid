import React from "react";
import { MonitorUp, X } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import { VideoWindow } from "@/components/dashboard/media/VideoWindow";
import type { RemoteSession } from "@/hooks/useRemoteWebRtc";

const getSessionStateClasses = (state: RemoteSession["state"]) => {
  if (state === "connected") {
    return "border-emerald-300/55 bg-emerald-500 text-emerald-50";
  }

  if (state === "failed" || state === "disconnected" || state === "ended") {
    return "border-red-300/45 bg-red-500 text-red-50";
  }

  return "border-theme-primary-500 bg-theme-primary-700 text-theme-primary-50";
};

export const RemoteSessionStrip: React.FC<{
  sessions: RemoteSession[];
  onClosePeer: (deviceId: string) => void;
  onOpenSessions: () => void;
}> = ({ sessions, onClosePeer, onOpenSessions }) => {
  if (!sessions.length) {
    return null;
  }

  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto">
      {sessions.map((session) => (
        <div
          key={session.deviceId}
          className="group relative aspect-video w-[260px] shrink-0 overflow-hidden rounded-lg bg-black"
        >
          {session.remoteStream ? (
            <VideoWindow
              stream={session.remoteStream}
              status="active"
              objectFit="cover"
              windowName={session.deviceName}
            />
          ) : session.localStream ? (
            <VideoWindow
              stream={session.localStream}
              status="active"
              objectFit="cover"
              windowName={session.deviceName}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-theme-primary-950 text-theme-primary-200">
              <MonitorUp className="h-7 w-7" />
            </div>
          )}

          <button
            type="button"
            onClick={onOpenSessions}
            className="absolute inset-0 cursor-pointer bg-gradient-to-t from-black/85 via-black/10 to-transparent text-left"
            title="Open active screen shares"
          >
            <span className="absolute bottom-2 left-2 right-11 min-w-0">
              <span className="block truncate text-xs font-semibold text-white">
                {session.deviceName}
              </span>
              <span className="mt-1 flex min-w-0 items-center gap-2">
                <span
                  className={`rounded-full border border-solid px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${getSessionStateClasses(
                    session.state,
                  )}`}
                >
                  {session.state}
                </span>
                <span className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  {session.role}
                </span>
              </span>
            </span>
          </button>

          <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100">
            <DepthButton
              onClick={() => onClosePeer(session.deviceId)}
              title="Stop this screen share"
              sizeClassName="h-8 w-8 rounded-lg"
              inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
            >
              <X className="h-3.5 w-3.5" />
            </DepthButton>
          </div>
        </div>
      ))}
    </div>
  );
};
