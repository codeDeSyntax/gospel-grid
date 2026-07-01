import React from "react";
import { MonitorUp, Wifi, WifiOff } from "lucide-react";
import type { RemoteScreenTab } from "./remoteScreenUtils";

export const StatusPill: React.FC<{
  isRunning: boolean;
}> = ({ isRunning }) => (
  <span
    className={`inline-flex h-7 items-center gap-2 rounded-full border-1 border-t border-solid px-5 text-[11px] font-semibold uppercase tracking-[0.14em] ${
      isRunning
        ? "border-primary-300/35 bg-primary-400 text-emerald-100"
        : "border-theme-primary-600 bg-theme-primary-900 text-theme-primary-200"
    }`}
  >
    {isRunning ? (
      <Wifi className="h-3.5 w-3.5" />
    ) : (
      <WifiOff className="h-3.5 w-3.5" />
    )}
    {isRunning ? "Listening" : "Stopped"}
  </span>
);

export const InfoCell: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
}> = ({ label, value, icon }) => (
  <div className="flex min-h-[54px] min-w-0 items-center gap-2 border-l-0 border-y border-r border-solid border-theme-primary-600 px-3 py-2 last:border-x-0">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-theme-primary-800 text-theme-primary-100">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-theme-primary-300">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-semibold text-theme-primary-50">
        {value}
      </p>
    </div>
  </div>
);

export const Panel: React.FC<{
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, description, action, children }) => (
  <section className="overflow-hidden rounded-lg -theme-primary-700 bg-theme-primary-800">
    <div className="flex min-h-[64px] items-center justify-between gap-3 bg-theme-primary-800 px-4 py-3">
      <div className="min-w-0 ">
        <p className="text-sm font-semibold text-theme-primary-50">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-theme-primary-300">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
    {children}
  </section>
);

export const TableHeader: React.FC<{
  columns: string;
  labels: string[];
}> = ({ columns, labels }) => (
  <div
    className={`hidden ${columns}  bg-theme-primary-900 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-theme-primary-300 md:grid`}
  >
    {labels.map((label) => (
      <span key={label}>{label}</span>
    ))}
  </div>
);

export const EmptyTableState: React.FC<{
  title: string;
  description: string;
  icon?: React.ReactNode;
}> = ({ title, description, icon }) => (
  <div className="flex min-h-[180px] flex-col items-center justify-center text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-solid border-theme-primary-600 bg-theme-primary-800 text-theme-primary-100">
      {icon || <WifiOff className="h-5 w-5" />}
    </div>
    <p className="mt-4 text-sm font-semibold text-theme-primary-50">{title}</p>
    <p className="mt-2 max-w-sm text-xs leading-relaxed text-theme-primary-300">
      {description}
    </p>
  </div>
);

const tabLabels: Record<RemoteScreenTab, string> = {
  nearby: "Nearby",
  connected: "Connected",
  sessions: "Screen Shares",
};

export const RemoteScreenTabs: React.FC<{
  activeTab: RemoteScreenTab;
  counts: Record<RemoteScreenTab, number>;
  onChange: (tab: RemoteScreenTab) => void;
}> = ({ activeTab, counts, onChange }) => {
  const tabs: RemoteScreenTab[] = ["nearby", "connected", "sessions"];

  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg bg-theme-primary-950 p-1">
      {tabs.map((tab) => {
        const active = activeTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
              active
                ? "bg-theme-primary-700 text-theme-primary-50"
                : "text-theme-primary-300 hover:bg-theme-primary-800 hover:text-theme-primary-100"
            }`}
          >
            <MonitorUp className="h-3.5 w-3.5" />
            <span className="truncate">{tabLabels[tab]}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                active
                  ? "bg-theme-primary-900 text-theme-primary-100"
                  : "bg-theme-primary-800 text-theme-primary-300"
              }`}
            >
              {counts[tab]}
            </span>
          </button>
        );
      })}
    </div>
  );
};
