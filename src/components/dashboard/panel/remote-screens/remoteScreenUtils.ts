export type RemoteScreenTab = "nearby" | "connected" | "sessions";

export const isLocalConnection = (url?: string | null) =>
  Boolean(url && /:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/i.test(url));

export const normalizeConnectionUrl = (url?: string | null) =>
  url?.trim().replace(/\/+$/, "").toLowerCase() ?? "";
