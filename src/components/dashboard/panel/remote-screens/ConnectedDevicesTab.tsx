import React from "react";
import { MonitorUp, RefreshCw, WifiOff, X } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import type { RemoteScreenDevice } from "@/types/electron";
import { EmptyTableState, Panel, TableHeader } from "./RemoteScreenShared";

const ConnectedDeviceRow: React.FC<{
  device: RemoteScreenDevice;
  canRequest: boolean;
  isRequestPending: boolean;
  hasActiveSession: boolean;
  onRequestView: (device: RemoteScreenDevice) => void;
  onCancelRequest: (device: RemoteScreenDevice) => void;
  onEndSession: (device: RemoteScreenDevice) => void;
}> = ({
  device,
  canRequest,
  isRequestPending,
  hasActiveSession,
  onRequestView,
  onCancelRequest,
  onEndSession,
}) => (
  <div className="grid min-h-[76px] gap-3 border-b border-solid border-theme-primary-700 bg-theme-primary-900 px-4 py-3 last:border-b-0 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto] md:items-center">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-solid border-theme-primary-600 bg-theme-primary-800 text-theme-primary-100">
        <MonitorUp className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-theme-primary-50">
          {device.name}
        </p>
        <p className="mt-1 truncate text-[11px] text-theme-primary-300">
          {device.id}
        </p>
      </div>
    </div>
    <p className="truncate text-xs text-theme-primary-200 md:text-sm">
      {device.appVersion}
    </p>
    <span
      className={`w-fit rounded-full border border-solid px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
        hasActiveSession
          ? "border-red-300/45 bg-red-500 text-red-50"
          : isRequestPending
            ? "border-amber-300/45 bg-amber-500/20 text-amber-100"
            : "border-emerald-300/35 bg-emerald-500 text-emerald-50"
      }`}
    >
      {hasActiveSession ? "Streaming" : isRequestPending ? "Requested" : "Online"}
    </span>

    <DepthButton
      onClick={() => {
        if (hasActiveSession) {
          onEndSession(device);
          return;
        }

        if (isRequestPending) {
          onCancelRequest(device);
          return;
        }

        onRequestView(device);
      }}
      disabled={!canRequest}
      title={
        hasActiveSession
          ? "Stop viewing this screen"
          : isRequestPending
            ? "Cancel this screen viewing request"
            : canRequest
              ? "Ask this PC to share its screen"
              : "Turn on sharing before requesting access"
      }
      sizeClassName="h-9 px-3 rounded-lg"
      active={hasActiveSession || isRequestPending}
      inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
      activeClassName={
        hasActiveSession
          ? "text-red-50 border-solid border-red-300/60"
          : "text-amber-100 border-solid border-amber-300/50"
      }
      
    >
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
        {hasActiveSession || isRequestPending ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          <MonitorUp className="h-3.5 w-3.5" />
        )}
        {hasActiveSession ? "End Session" : isRequestPending ? "Cancel" : "Request"}
      </span>
    </DepthButton>
  </div>
);

export const ConnectedDevicesTab: React.FC<{
  devices: RemoteScreenDevice[];
  canRequest: boolean;
  isLoading: boolean;
  pendingDeviceIds: Set<string>;
  activeSessionDeviceIds: Set<string>;
  onRefresh: () => void;
  onRequestView: (device: RemoteScreenDevice) => void;
  onCancelRequest: (device: RemoteScreenDevice) => void;
  onEndSession: (device: RemoteScreenDevice) => void;
}> = ({
  devices,
  canRequest,
  isLoading,
  pendingDeviceIds,
  activeSessionDeviceIds,
  onRefresh,
  onRequestView,
  onCancelRequest,
  onEndSession,
}) => (
  <Panel
    title="Connected Devices"
    description="Wingrid PCs currently linked with this machine."
    action={
      <DepthButton
        onClick={onRefresh}
        disabled={isLoading || !canRequest}
        title="Refresh connected PCs"
        sizeClassName="h-9 px-3 rounded-lg"
        inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </span>
      </DepthButton>
    }
  >
    <TableHeader
      columns="md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_minmax(0,0.9fr)_auto]"
      labels={["Device", "Version", "Status", "Action"]}
    />
    <div>
      {devices.length > 0 ? (
        devices.map((device) => (
          <ConnectedDeviceRow
            key={device.id}
            device={device}
            canRequest={canRequest}
            isRequestPending={pendingDeviceIds.has(device.id)}
            hasActiveSession={activeSessionDeviceIds.has(device.id)}
            onRequestView={onRequestView}
            onCancelRequest={onCancelRequest}
            onEndSession={onEndSession}
          />
        ))
      ) : (
        <EmptyTableState
          title="No connected PCs yet"
          description="Connect to a nearby Wingrid PC first. If it does not appear, make sure Remote Screens is turned on there, then refresh."
          icon={<WifiOff className="h-5 w-5" />}
        />
      )}
    </div>
  </Panel>
);
