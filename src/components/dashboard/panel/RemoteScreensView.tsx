import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRemoteScreen } from "@/hooks/useRemoteScreen";
import type { RemoteWebRtcController } from "@/hooks/useRemoteWebRtc";
import type { AppDispatch } from "@/store";
import { useAppSelector } from "@/store/hooks";
import { showNotification } from "@/store/slices/notificationSlice";
import type {
  DesktopCaptureSource,
  RemoteScreenDevice,
  RemoteScreenViewRequest,
} from "@/types/electron";
import { AccessPermissionDialog } from "./remote-screens/AccessPermissionDialog";
import { ConnectedDevicesTab } from "./remote-screens/ConnectedDevicesTab";
import { RemoteScreenTabs } from "./remote-screens/RemoteScreenShared";
import { RemoteScreenHeader } from "./remote-screens/RemoteScreenHeader";
import { NearbyDevicesTab } from "./remote-screens/NearbyDevicesTab";
import { RemoteSessionStrip } from "./remote-screens/RemoteSessionStrip";
import { ShareSourceDialog } from "./remote-screens/ShareSourceDialog";
import { WebRtcSessionsTab } from "./remote-screens/WebRtcSessionsTab";
import {
  isLocalConnection,
  normalizeConnectionUrl,
  type RemoteScreenTab,
} from "./remote-screens/remoteScreenUtils";

type RemoteScreensViewProps = {
  webRtc: RemoteWebRtcController;
};

export const RemoteScreensView: React.FC<RemoteScreensViewProps> = ({
  webRtc,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const remoteScreensAutoStart = useAppSelector(
    (state) => state.app.remoteScreensAutoStart,
  );
  const {
    status,
    devices,
    nearbyDevices,
    incomingRequests,
    isRunning,
    isClientConnected,
    localDevice,
    isLoading,
    activeOperation,
    error,
    refresh,
    startSignaling,
    stopSignaling,
    connectClient,
    disconnectClient,
    refreshNearbyDevices,
    refreshDevices,
    requestView,
    denyViewRequest,
    endSession,
  } = useRemoteScreen();
  const [activeTab, setActiveTab] = useState<RemoteScreenTab>("nearby");
  const [serverUrl, setServerUrl] = useState("ws://127.0.0.1:3011");
  const [lastUiAction, setLastUiAction] = useState<string | null>(null);
  const [dismissedRequestIds, setDismissedRequestIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [pendingShareRequest, setPendingShareRequest] =
    useState<RemoteScreenViewRequest | null>(null);
  const [pendingOutgoingDeviceIds, setPendingOutgoingDeviceIds] = useState<
    Set<string>
  >(() => new Set());
  const autoStartAttemptedRef = useRef(false);
  const {
    sessions,
    activeRemoteStream,
    lastError: webRtcError,
    startSharingForRequest,
    closePeer,
  } = webRtc;

  const handleToggle = () => {
    if (isRunning) {
      setLastUiAction("Turning off screen sharing...");
      void stopSignaling();
      return;
    }

    setLastUiAction("Turning on screen sharing...");
    void startSignaling();
  };

  const handleConnect = (url: string) => {
    setLastUiAction("Connecting to Wingrid PC...");
    void connectClient(url);
  };

  const activeSessionDeviceIds = useMemo(
    () => new Set(sessions.map((session) => session.deviceId)),
    [sessions],
  );
  const linkedNearbyDeviceIds = useMemo(
    () => new Set(devices.map((device) => device.id)),
    [devices],
  );

  const handleDisconnect = async () => {
    setLastUiAction("Disconnecting...");
    const linkedDeviceIds = Array.from(
      new Set([
        ...sessions.map((session) => session.deviceId),
        ...pendingOutgoingDeviceIds,
      ]),
    );

    sessions.forEach((session) => closePeer(session.deviceId, false));
    await Promise.all(
      linkedDeviceIds.map((deviceId) =>
        endSession(deviceId, "connection-closed"),
      ),
    );
    setPendingOutgoingDeviceIds(new Set());
    setPendingShareRequest(null);
    void disconnectClient();
  };

  const handleRequestView = async (device: RemoteScreenDevice) => {
    setLastUiAction(`Request sent to ${device.name}`);
    const result = await requestView(device);
    if (result.success) {
      setPendingOutgoingDeviceIds((current) => new Set(current).add(device.id));
    }
  };

  const handleCancelOutgoingRequest = (device: RemoteScreenDevice) => {
    setLastUiAction(`Request cancelled for ${device.name}`);
    setPendingOutgoingDeviceIds((current) => {
      const next = new Set(current);
      next.delete(device.id);
      return next;
    });
    void endSession(device.id, "request-cancelled");
  };

  const handleEndDeviceSession = (device: RemoteScreenDevice) => {
    setLastUiAction(`Stopping screen share with ${device.name}`);
    setPendingOutgoingDeviceIds((current) => {
      const next = new Set(current);
      next.delete(device.id);
      return next;
    });
    closePeer(device.id);
  };

  const handleDenyAccessRequest = (requestId: string) => {
    setLastUiAction("Access request denied");
    void denyViewRequest(requestId);
  };

  const handleAllowAccessRequest = (request: RemoteScreenViewRequest) => {
    setLastUiAction("Choose a screen or window to share");
    setDismissedRequestIds((current) =>
      new Set(current).add(request.request.id),
    );
    setPendingShareRequest(request);
  };

  const handleCancelShareSource = (requestId: string) => {
    setLastUiAction("Screen sharing cancelled");
    setPendingShareRequest(null);
    setDismissedRequestIds((current) => new Set(current).add(requestId));
    void denyViewRequest(requestId);
  };

  const handleShareSource = (
    request: RemoteScreenViewRequest,
    source: DesktopCaptureSource,
  ) => {
    setLastUiAction(`Sharing ${source.name}`);
    setPendingShareRequest(null);
    setDismissedRequestIds((current) =>
      new Set(current).add(request.request.id),
    );
    void startSharingForRequest(request, source);
  };

  const clientLabel = status.client?.isConnecting
    ? "connecting"
    : isLocalConnection(status.client?.serverUrl)
      ? "ready on this PC"
      : isClientConnected
        ? "connected to another PC"
        : isLoading
          ? "busy"
          : "not linked";
  const activeServerUrl = normalizeConnectionUrl(status.client?.serverUrl);
  const isManualUrlActive =
    activeServerUrl === normalizeConnectionUrl(serverUrl) &&
    !isLocalConnection(serverUrl);
  const activeIncomingRequest =
    incomingRequests.find(
      (entry) => !dismissedRequestIds.has(entry.request.id),
    ) ?? null;

  useEffect(() => {
    if (
      !remoteScreensAutoStart ||
      autoStartAttemptedRef.current ||
      isRunning ||
      isLoading
    ) {
      return;
    }

    autoStartAttemptedRef.current = true;
    setLastUiAction("Preparing Remote Screens...");
    void startSignaling().then((result) => {
      if (!result.success) {
        autoStartAttemptedRef.current = false;
        return;
      }

      void refreshNearbyDevices();
    });
  }, [
    remoteScreensAutoStart,
    isRunning,
    isLoading,
    startSignaling,
    refreshNearbyDevices,
  ]);

  useEffect(() => {
    if (activeTab !== "connected" || !isClientConnected) {
      return;
    }

    void refreshDevices();
  }, [activeTab, activeServerUrl, isClientConnected, refreshDevices]);

  useEffect(() => {
    const remoteScreenApi = window.electronAPI?.remoteScreen;
    if (
      !remoteScreenApi?.onRequestAccepted ||
      !remoteScreenApi?.onRequestDenied
    ) {
      return;
    }

    const offAccepted = remoteScreenApi.onRequestAccepted((request) => {
      if (request.fromDevice?.id) {
        setPendingOutgoingDeviceIds((current) => {
          const next = new Set(current);
          next.delete(request.fromDevice!.id);
          return next;
        });
      }

      dispatch(
        showNotification({
          type: "success",
          title: "Remote Access Approved",
          message: `${
            request.fromDevice?.name || "The remote device"
          } accepted your screen viewing request.`,
          autoClose: 4500,
        }),
      );
    });

    const offDenied = remoteScreenApi.onRequestDenied((request) => {
      if (request.fromDevice?.id) {
        setPendingOutgoingDeviceIds((current) => {
          const next = new Set(current);
          next.delete(request.fromDevice!.id);
          return next;
        });
      }

      dispatch(
        showNotification({
          type: "warning",
          title: "Remote Access Denied",
          message: `${
            request.fromDevice?.name || "The remote device"
          } denied your screen viewing request.`,
          autoClose: 5000,
        }),
      );
    });

    return () => {
      offAccepted();
      offDenied();
    };
  }, [dispatch]);

  useEffect(() => {
    const remoteScreenApi = window.electronAPI?.remoteScreen;
    if (!remoteScreenApi?.onSessionEnded) {
      return;
    }

    return remoteScreenApi.onSessionEnded((event) => {
      const payload = event as { fromDeviceId?: string; toDeviceId?: string };
      setPendingOutgoingDeviceIds((current) => {
        const next = new Set(current);
        if (payload.fromDeviceId) next.delete(payload.fromDeviceId);
        if (payload.toDeviceId) next.delete(payload.toDeviceId);
        return next;
      });
      setPendingShareRequest((current) => {
        if (
          !current ||
          current.request.fromDeviceId === payload.fromDeviceId ||
          current.request.toDeviceId === payload.fromDeviceId ||
          current.request.fromDeviceId === payload.toDeviceId ||
          current.request.toDeviceId === payload.toDeviceId
        ) {
          return null;
        }

        return current;
      });
    });
  }, []);

  return (
    <div className="h-full w-full overflow-auto no-scrollbar px-5 py-5 text-theme-primary-50">
      <AccessPermissionDialog
        request={activeIncomingRequest}
        onDeny={handleDenyAccessRequest}
        onAllow={handleAllowAccessRequest}
      />
      <ShareSourceDialog
        request={pendingShareRequest}
        onCancel={handleCancelShareSource}
        onShare={handleShareSource}
      />

      <div className="mx-auto flex max-w-5xl flex-col gap-4">
        <RemoteScreenHeader
          isRunning={isRunning}
          isLoading={isLoading}
          host={status.host}
          port={status.port}
          nearbyCount={nearbyDevices.length}
          localDevice={localDevice}
          onRefresh={() => void refresh()}
          onToggleListener={handleToggle}
        />

        {activeTab !== "sessions" ? (
          <RemoteSessionStrip
            sessions={sessions}
            onClosePeer={closePeer}
            onOpenSessions={() => setActiveTab("sessions")}
          />
        ) : null}

        <RemoteScreenTabs
          activeTab={activeTab}
          counts={{
            nearby: nearbyDevices.length,
            connected: devices.length,
            sessions: sessions.length,
          }}
          onChange={setActiveTab}
        />

        {activeTab === "nearby" ? (
          <NearbyDevicesTab
            devices={nearbyDevices}
            linkedDeviceIds={linkedNearbyDeviceIds}
            activeServerUrl={activeServerUrl}
            serverUrl={serverUrl}
            isManualUrlActive={isManualUrlActive}
            isLoading={isLoading}
            isRunning={isRunning}
            onServerUrlChange={setServerUrl}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onRefresh={() => void refreshNearbyDevices()}
          />
        ) : null}

        {activeTab === "connected" ? (
          <ConnectedDevicesTab
            devices={devices}
            canRequest={isClientConnected}
            isLoading={isLoading}
            pendingDeviceIds={pendingOutgoingDeviceIds}
            activeSessionDeviceIds={activeSessionDeviceIds}
            onRefresh={() => void refreshDevices()}
            onRequestView={handleRequestView}
            onCancelRequest={handleCancelOutgoingRequest}
            onEndSession={handleEndDeviceSession}
          />
        ) : null}

        {activeTab === "sessions" ? (
          <WebRtcSessionsTab
            sessions={sessions}
            activeRemoteStream={activeRemoteStream}
            onClosePeer={closePeer}
          />
        ) : null}

        <div className="rounded-lg  bg-theme-primary-900 px-4 py-3 text-xs text-theme-primary-200">
          Connection:{" "}
          <span className="font-semibold text-theme-primary-50">
            {clientLabel}
          </span>
          {status.client?.serverUrl ? (
            <span className="ml-2 text-theme-primary-300/70">
              {status.client.serverUrl}
            </span>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-solid border-red-300/25 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {error}
          </div>
        ) : null}

        {activeOperation || lastUiAction ? (
          <div className="rounded-lg border border-solid border-theme-primary-700 bg-theme-primary-800 px-4 py-3 text-xs text-theme-primary-100">
            {activeOperation || lastUiAction}
          </div>
        ) : null}

        {webRtcError ? (
          <div className="rounded-lg border border-solid border-red-300/25 bg-red-500/10 px-4 py-3 text-xs text-red-100">
            {webRtcError}
          </div>
        ) : null}
      </div>
    </div>
  );
};
