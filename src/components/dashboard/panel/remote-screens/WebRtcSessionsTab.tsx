import React from "react";
import { Radio, X } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import { VideoWindow } from "@/components/dashboard/media/VideoWindow";
import type { RemoteSession } from "@/hooks/useRemoteWebRtc";
import { EmptyTableState, Panel, TableHeader } from "./RemoteScreenShared";

export const WebRtcSessionsTab: React.FC<{
  sessions: RemoteSession[];
  activeRemoteStream: MediaStream | null;
  onClosePeer: (deviceId: string) => void;
}> = ({ sessions, activeRemoteStream, onClosePeer }) => (
  <Panel
    title="Active Screen Shares"
    description="Screens you are currently viewing or sharing appear here."
  >
    {activeRemoteStream ? (
      <div className="m-4 overflow-hidden rounded-lg border border-solid border-theme-primary-700 bg-black">
        <div className="aspect-video w-full">
          <VideoWindow
            stream={activeRemoteStream}
            status="active"
            objectFit="contain"
            windowName="Remote Wingrid screen"
          />
        </div>
      </div>
    ) : null}

    <TableHeader
      columns="md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto]"
      labels={["Device", "Session", "Action"]}
    />
    <div>
      {sessions.length > 0 ? (
        sessions.map((session) => (
          <div
            key={session.deviceId}
            className="grid min-h-[64px] gap-3 bg-theme-primary-900 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] md:items-center"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-theme-primary-50">
                {session.deviceName}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-theme-primary-300">
                {session.role} / {session.state}
              </p>
            </div>
            <span className="w-fit rounded-full border border-solid border-theme-primary-600 bg-theme-primary-800 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-theme-primary-100">
              {session.role}
            </span>
            <DepthButton
              onClick={() => onClosePeer(session.deviceId)}
              title="Stop this screen share"
              sizeClassName="h-8 w-8 rounded-lg"
              inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
            >
              <X className="h-3.5 w-3.5" />
            </DepthButton>
          </div>
        ))
      ) : (
        <EmptyTableState
          title="No active screen shares"
          description="When a request is approved, the shared screen will appear here."
          icon={<Radio className="h-5 w-5" />}
        />
      )}
    </div>
  </Panel>
);
