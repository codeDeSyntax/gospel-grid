import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  RemoteScreenDevice,
  RemoteScreenNearbyDevice,
  RemoteScreenStatus,
  RemoteScreenViewRequest,
} from "@/types/electron";

type RemoteScreenActionResult = {
  success: boolean;
  error?: string;
};

const defaultStatus: RemoteScreenStatus = {
  isRunning: false,
  host: "0.0.0.0",
  port: 3011,
  devices: [],
  nearbyDevices: [],
  client: {
    isConnected: false,
    isConnecting: false,
    serverUrl: null,
    localDevice: null,
    devices: [],
    lastError: null,
  },
};

export function useRemoteScreen() {
  const [status, setStatus] = useState<RemoteScreenStatus>(defaultStatus);
  const [incomingRequests, setIncomingRequests] = useState<
    RemoteScreenViewRequest[]
  >([]);
  const [nearbyDevices, setNearbyDevices] = useState<RemoteScreenNearbyDevice[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const remoteScreenApi = window.electronAPI?.remoteScreen;

  const refresh = useCallback(async (): Promise<RemoteScreenActionResult> => {
    if (!remoteScreenApi) {
      const message = "Remote screen API is not available.";
      setError(message);
      return { success: false, error: message };
    }

    setIsLoading(true);
    setActiveOperation("Refreshing remote screen status...");
    try {
      const result = await remoteScreenApi.getStatus();
      if (!result.success || !result.status) {
        const message = result.error || "Failed to load remote screen status.";
        setError(message);
        return { success: false, error: message };
      }

      setStatus(result.status);
      setError(null);
      return { success: true };
    } finally {
      setIsLoading(false);
      setActiveOperation(null);
    }
  }, [remoteScreenApi]);

  const startSignaling = useCallback(
    async (options?: { host?: string; port?: number }): Promise<RemoteScreenActionResult> => {
      if (!remoteScreenApi) {
        const message = "Remote screen API is not available.";
        setError(message);
        return { success: false, error: message };
      }

      setIsLoading(true);
      setActiveOperation("Starting listener and discovery...");
      try {
        const result = await remoteScreenApi.startSignaling(options);
        if (!result.success || !result.status) {
          const message = result.error || "Failed to start remote screen signaling.";
          setError(message);
          return { success: false, error: message };
        }

        setStatus(result.status);
        setError(null);
        return { success: true };
      } finally {
        setIsLoading(false);
        setActiveOperation(null);
      }
    },
    [remoteScreenApi],
  );

  const stopSignaling = useCallback(async (): Promise<RemoteScreenActionResult> => {
    if (!remoteScreenApi) {
      const message = "Remote screen API is not available.";
      setError(message);
      return { success: false, error: message };
    }

    setIsLoading(true);
    setActiveOperation("Stopping listener...");
    try {
      const result = await remoteScreenApi.stopSignaling();
      if (!result.success || !result.status) {
        const message = result.error || "Failed to stop remote screen signaling.";
        setError(message);
        return { success: false, error: message };
      }

      setStatus(result.status);
      setError(null);
      return { success: true };
    } finally {
      setIsLoading(false);
      setActiveOperation(null);
    }
  }, [remoteScreenApi]);

  const connectClient = useCallback(
    async (serverUrl: string): Promise<RemoteScreenActionResult> => {
      if (!remoteScreenApi) {
        const message = "Remote screen API is not available.";
        setError(message);
        return { success: false, error: message };
      }

      setIsLoading(true);
      setActiveOperation(`Connecting to ${serverUrl}...`);
      try {
        const result = await remoteScreenApi.connectClient(serverUrl);
        if (!result.success || !result.status) {
          const message = result.error || "Failed to connect remote screen client.";
          setError(message);
          return { success: false, error: message };
        }

        setStatus(result.status);
        setError(null);
        return { success: true };
      } finally {
        setIsLoading(false);
        setActiveOperation(null);
      }
    },
    [remoteScreenApi],
  );

  const disconnectClient = useCallback(async (): Promise<RemoteScreenActionResult> => {
    if (!remoteScreenApi) {
      const message = "Remote screen API is not available.";
      setError(message);
      return { success: false, error: message };
    }

    const result = await remoteScreenApi.disconnectClient();
    if (!result.success || !result.status) {
      const message = result.error || "Failed to disconnect remote screen client.";
      setError(message);
      return { success: false, error: message };
    }

    setStatus(result.status);
    setError(null);
    return { success: true };
  }, [remoteScreenApi]);

  const refreshNearbyDevices = useCallback(async (): Promise<RemoteScreenActionResult> => {
    if (!remoteScreenApi) {
      const message = "Remote screen API is not available.";
      setError(message);
      return { success: false, error: message };
    }

    const result = await remoteScreenApi.listNearbyDevices();
    if (!result.success) {
      const message = result.error || "Failed to refresh nearby Wingrid devices.";
      setError(message);
      return { success: false, error: message };
    }

    setNearbyDevices(result.devices ?? []);
    setError(null);
    return { success: true };
  }, [remoteScreenApi]);

  const refreshDevices = useCallback(async (): Promise<RemoteScreenActionResult> => {
    if (!remoteScreenApi) {
      const message = "Remote screen API is not available.";
      setError(message);
      return { success: false, error: message };
    }

    const result = await remoteScreenApi.listDevices();
    if (!result.success) {
      const message = result.error || "Failed to refresh connected Wingrid devices.";
      setError(message);
      return { success: false, error: message };
    }

    const devices = result.devices ?? [];
    setStatus((current) => ({
      ...current,
      devices,
      client: current.client ? { ...current.client, devices } : current.client,
    }));
    setError(null);
    return { success: true };
  }, [remoteScreenApi]);

  const requestView = useCallback(
    async (device: RemoteScreenDevice): Promise<RemoteScreenActionResult> => {
      if (!remoteScreenApi) {
        const message = "Remote screen API is not available.";
        setError(message);
        return { success: false, error: message };
      }

      setIsLoading(true);
      setActiveOperation(`Sending request to ${device.name}...`);
      try {
        const result = await remoteScreenApi.requestView(device.id);
        if (!result.success) {
          const message = result.error || "Failed to request remote screen access.";
          setError(message);
          return { success: false, error: message };
        }

        setError(null);
        return { success: true };
      } finally {
        setIsLoading(false);
        setActiveOperation(null);
      }
    },
    [remoteScreenApi],
  );

  const acceptViewRequest = useCallback(
    async (requestId: string): Promise<RemoteScreenActionResult> => {
      if (!remoteScreenApi) {
        const message = "Remote screen API is not available.";
        setError(message);
        return { success: false, error: message };
      }

      const result = await remoteScreenApi.acceptViewRequest(requestId);
      if (!result.success) {
        const message = result.error || "Failed to accept remote screen request.";
        setError(message);
        return { success: false, error: message };
      }

      setIncomingRequests((current) =>
        current.filter((entry) => entry.request.id !== requestId),
      );
      setError(null);
      return { success: true };
    },
    [remoteScreenApi],
  );

  const denyViewRequest = useCallback(
    async (requestId: string): Promise<RemoteScreenActionResult> => {
      if (!remoteScreenApi) {
        const message = "Remote screen API is not available.";
        setError(message);
        return { success: false, error: message };
      }

      const result = await remoteScreenApi.denyViewRequest(requestId);
      if (!result.success) {
        const message = result.error || "Failed to deny remote screen request.";
        setError(message);
        return { success: false, error: message };
      }

      setIncomingRequests((current) =>
        current.filter((entry) => entry.request.id !== requestId),
      );
      setError(null);
      return { success: true };
    },
    [remoteScreenApi],
  );

  const endSession = useCallback(
    async (
      deviceId: string,
      reason = "ended",
    ): Promise<RemoteScreenActionResult> => {
      if (!remoteScreenApi) {
        const message = "Remote screen API is not available.";
        setError(message);
        return { success: false, error: message };
      }

      const result = await remoteScreenApi.endSession(deviceId, reason);
      if (!result.success) {
        const message = result.error || "Failed to end remote screen session.";
        setError(message);
        return { success: false, error: message };
      }

      setIncomingRequests((current) =>
        current.filter(
          (entry) =>
            entry.request.fromDeviceId !== deviceId &&
            entry.request.toDeviceId !== deviceId,
        ),
      );
      setError(null);
      return { success: true };
    },
    [remoteScreenApi],
  );

  useEffect(() => {
    void refresh();

    if (!remoteScreenApi?.onStatusChanged) {
      return;
    }

    return remoteScreenApi.onStatusChanged((nextStatus) => {
      setStatus(nextStatus);
      setError(null);
    });
  }, [refresh, remoteScreenApi]);

  useEffect(() => {
    if (!remoteScreenApi?.onDevicesChanged) {
      return;
    }

    return remoteScreenApi.onDevicesChanged((devices) => {
      setStatus((current) => ({
        ...current,
        devices,
        client: current.client ? { ...current.client, devices } : current.client,
      }));
    });
  }, [remoteScreenApi]);

  useEffect(() => {
    if (!remoteScreenApi?.onIncomingRequest) {
      return;
    }

    return remoteScreenApi.onIncomingRequest((request) => {
      setIncomingRequests((current) => {
        const withoutDuplicate = current.filter(
          (entry) => entry.request.id !== request.request.id,
        );
        return [request, ...withoutDuplicate].slice(0, 5);
      });
    });
  }, [remoteScreenApi]);

  useEffect(() => {
    if (!remoteScreenApi?.onNearbyDevicesChanged) {
      return;
    }

    return remoteScreenApi.onNearbyDevicesChanged((devices) => {
      setNearbyDevices(devices);
      setStatus((current) => ({
        ...current,
        nearbyDevices: devices,
      }));
    });
  }, [remoteScreenApi]);

  useEffect(() => {
    if (!remoteScreenApi?.onDiscoveryError) {
      return;
    }

    return remoteScreenApi.onDiscoveryError((payload) => {
      setError(payload.error);
    });
  }, [remoteScreenApi]);

  useEffect(() => {
    if (!remoteScreenApi?.onSessionEnded) {
      return;
    }

    return remoteScreenApi.onSessionEnded((event) => {
      const payload = event as { fromDeviceId?: string; toDeviceId?: string };
      setIncomingRequests((current) =>
        current.filter(
          (entry) =>
            entry.request.fromDeviceId !== payload.fromDeviceId &&
            entry.request.toDeviceId !== payload.fromDeviceId &&
            entry.request.fromDeviceId !== payload.toDeviceId &&
            entry.request.toDeviceId !== payload.toDeviceId,
        ),
      );
    });
  }, [remoteScreenApi]);

  return useMemo(
    () => ({
      status,
      devices: status.devices,
      nearbyDevices,
      incomingRequests,
      isRunning: status.isRunning,
      isClientConnected: Boolean(status.client?.isConnected),
      localDevice: status.client?.localDevice ?? null,
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
      acceptViewRequest,
      denyViewRequest,
      endSession,
    }),
    [
      status,
      nearbyDevices,
      incomingRequests,
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
      acceptViewRequest,
      denyViewRequest,
      endSession,
    ],
  );
}
