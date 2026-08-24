import React from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import type { RemoteScreenNearbyDevice } from "@/types/electron";
import { EmptyTableState, Panel, TableHeader } from "./RemoteScreenShared";
import { normalizeConnectionUrl } from "./remoteScreenUtils";

type NearbyConnectionState = "available" | "direct" | "linked";

const NearbyDeviceRow: React.FC<{
  device: RemoteScreenNearbyDevice;
  isLoading: boolean;
  connectionState: NearbyConnectionState;
  onConnect: (device: RemoteScreenNearbyDevice) => void;
  onDisconnect: () => void;
}> = ({ device, isLoading, connectionState, onConnect, onDisconnect }) => {
  const isLinked = connectionState !== "available";
  const isDirectConnection = connectionState === "direct";
  const actionLabel =
    connectionState === "direct"
      ? "Disconnect"
      : connectionState === "linked"
        ? "Linked"
        : "Connect";

  return (
    <div
      className={`grid  gap-3 px-4 py-2 m-3 w-[98%] rounded-2xl border border-solid mx-auto  md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto] md:items-center ${
        isLinked ? " " : "border-theme-primary-700 bg-theme-primary-900"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-solid ${
            isLinked
              ? "border-emerald-300/70 bg-emerald-500 text-emerald-50"
              : "border-theme-primary-600 bg-theme-primary-800 text-theme-primary-100"
          }`}
        >
          <Wifi className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-theme-primary-50">
            {device.name}
          </p>
          <p className="mt-1 truncate text-[11px] text-theme-primary-300">
            {device.deviceId}
          </p>
        </div>
      </div>
      <p className="truncate text-xs text-theme-primary-200 md:text-sm">
        {device.address}:{device.signalingPort}
      </p>
      <span
        className={`w-fit rounded-full border border-solid px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
          isLinked
            ? "border-emerald-300/60 bg-emerald-500 text-emerald-50"
            : "border-theme-primary-600 bg-theme-primary-800 text-theme-primary-100"
        }`}
      >
        {isLinked ? "Linked" : "Available"}
      </span>

      <DepthButton
        onClick={() =>
          isDirectConnection
            ? onDisconnect()
            : connectionState === "available"
              ? onConnect(device)
              : undefined
        }
        disabled={isLoading || connectionState === "linked"}
        title={
          connectionState === "direct"
            ? "Disconnect from this PC"
            : connectionState === "linked"
              ? "This PC is already connected to your Remote Screens"
              : "Connect to this Wingrid PC"
        }
        sizeClassName="h-9 px-3 rounded-lg"
        active={isLinked}
        inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
        activeClassName="text-emerald-50 border-solid border-emerald-300/60"
        
      >
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
          {isDirectConnection ? (
            <WifiOff className="h-3.5 w-3.5" />
          ) : (
            <Wifi className="h-3.5 w-3.5" />
          )}
          {actionLabel}
        </span>
      </DepthButton>
    </div>
  );
};

export const NearbyDevicesTab: React.FC<{
  devices: RemoteScreenNearbyDevice[];
  linkedDeviceIds: Set<string>;
  activeServerUrl: string;
  serverUrl: string;
  isManualUrlActive: boolean;
  isLoading: boolean;
  isRunning: boolean;
  onServerUrlChange: (value: string) => void;
  onConnect: (url: string) => void;
  onDisconnect: () => void;
  onRefresh: () => void;
}> = ({
  devices,
  linkedDeviceIds,
  activeServerUrl,
  serverUrl,
  isManualUrlActive,
  isLoading,
  isRunning,
  onServerUrlChange,
  onConnect,
  onDisconnect,
  onRefresh,
}) => (
  <Panel
    title="Nearby Wingrid Devices"
    description="Wingrid PCs found on your local network."
    action={
      <div className="flex flex-wrap items-center justify-end gap-2">
        <input
          value={serverUrl}
          onChange={(event) => onServerUrlChange(event.target.value)}
          className="h-9 w-[min(280px,52vw)] rounded-lg border border-solid border-theme-primary-700 bg-theme-primary-950 px-3 text-xs text-theme-primary-50 outline-none placeholder:text-theme-primary-300 focus:border-theme-primary-500"
          placeholder="ws://192.168.1.20:3011"
        />
        <DepthButton
          onClick={() =>
            isManualUrlActive ? onDisconnect() : onConnect(serverUrl)
          }
          disabled={isLoading}
          title={
            isManualUrlActive
              ? "Disconnect from this address"
              : "Connect by entering an address"
          }
          sizeClassName="h-9 px-3 rounded-lg"
          inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
          active={isManualUrlActive}
          activeClassName="text-emerald-50 border-solid border-emerald-300/60"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
            {isManualUrlActive ? (
              <WifiOff className="h-3.5 w-3.5" />
            ) : (
              <Wifi className="h-3.5 w-3.5" />
            )}
            {isLoading
              ? "Working"
              : isManualUrlActive
                ? "Disconnect"
                : "Connect"}
          </span>
        </DepthButton>
        <DepthButton
          onClick={onRefresh}
          disabled={isLoading || !isRunning}
          title="Look for nearby Wingrid PCs"
          sizeClassName="h-9 w-9 rounded-lg"
          inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </DepthButton>
      </div>
    }
  >
    <TableHeader
      columns="md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.8fr)_auto]"
      labels={["Device", "Address", "Status", "Action"]}
    />
    <div>
      {devices.length > 0 ? (
        devices.map((device) => {
          const isDirectConnection =
            activeServerUrl === normalizeConnectionUrl(device.connectUrl);
          const connectionState: NearbyConnectionState = isDirectConnection
            ? "direct"
            : linkedDeviceIds.has(device.deviceId)
              ? "linked"
              : "available";

          return (
            <NearbyDeviceRow
              key={device.deviceId}
              device={device}
              isLoading={isLoading}
              connectionState={connectionState}
              onConnect={(target) => onConnect(target.connectUrl)}
              onDisconnect={onDisconnect}
            />
          );
        })
      ) : (
        <EmptyTableState
          title="No nearby devices found"
          description="Open Remote Screens on the other PC and turn on sharing. You can still enter an address manually if automatic discovery is blocked."
          icon={<WifiOff className="h-5 w-5" />}
        />
      )}
    </div>
  </Panel>
);
