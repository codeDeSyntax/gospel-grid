import React from "react";
import { MonitorUp, Power, RefreshCw, Server, ShieldCheck } from "lucide-react";
import { DepthButton } from "@/shared/DepthButton";
import type { RemoteScreenDevice } from "@/types/electron";
import { InfoCell, StatusPill } from "./RemoteScreenShared";

export const RemoteScreenHeader: React.FC<{
  isRunning: boolean;
  isLoading: boolean;
  host: string;
  port: number;
  nearbyCount: number;
  localDevice: RemoteScreenDevice | null;
  onRefresh: () => void;
  onToggleListener: () => void;
}> = ({
  isRunning,
  isLoading,
  host,
  port,
  nearbyCount,
  localDevice,
  onRefresh,
  onToggleListener,
}) => (
  <section className="overflow-hidden bg-transparent ">
    <div className="flex flex-wrap items-start justify-between gap-4 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-theme-primary-300">
            Remote Screens
          </p>
          <StatusPill isRunning={isRunning} />
        </div>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-theme-primary-50">
          Share screens with nearby Wingrid PCs
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-theme-primary-200">
          Turn on sharing to find nearby PCs, ask to view their screen, or
          approve requests from them.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <DepthButton
          onClick={onRefresh}
          disabled={isLoading}
          title="Refresh remote screen sharing"
          sizeClassName="h-9 w-9 rounded-lg"
          inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </DepthButton>

        <DepthButton
          onClick={onToggleListener}
          disabled={isLoading}
          active={isRunning}
          title={isRunning ? "Stop sharing access" : "Start sharing access"}
          sizeClassName="h-9 px-4 rounded-lg"
          inactiveClassName="text-theme-primary-100 border-solid border-theme-primary-500/35"
          activeClassName="text-theme-primary-50 border-solid border-emerald-300/60"
        >
          <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide">
            <Power className="h-3.5 w-3.5" />
            {isRunning ? "Stop" : "Start"}
          </span>
        </DepthButton>
      </div>
    </div>

    <div className="grid grid-cols-4 ">
      <InfoCell
        label="Address"
        value={`${host}:${port}`}
        icon={<Server className="h-5 w-5" />}
      />
      <InfoCell
        label="Nearby"
        value={nearbyCount}
        icon={<MonitorUp className="h-5 w-5" />}
      />
      <InfoCell
        label="Identity"
        value={localDevice?.name || "Not connected"}
        icon={<ShieldCheck className="h-5 w-5" />}
      />
      <InfoCell
        label="Listener"
        value={isRunning ? "Ready" : "Off"}
        icon={<Power className="h-5 w-5" />}
      />
    </div>
  </section>
);
