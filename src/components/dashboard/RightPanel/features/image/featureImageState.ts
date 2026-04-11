export interface FeatureImageItem {
  id: string;
  name: string;
  path: string;
  url: string;
  createdAtMs: number;
  showInWindowList: boolean;
}

export interface FeatureImageCollection {
  images: FeatureImageItem[];
  activeImageId: string | null;
  directoryPath: string | null;
  updatedAtMs: number;
}

export interface FeatureImageSource {
  name: string;
  path: string;
  url: string;
}

export const IMAGE_FEATURE_WINDOW_PREFIX = "feature:image-window:";
export const getImageFeatureWindowId = (imageId: string): string =>
  `${IMAGE_FEATURE_WINDOW_PREFIX}${imageId}`;

export const FEATURE_IMAGE_STORAGE_KEY = "wingrid.featureImageState";
export const FEATURE_IMAGE_EVENT = "wingrid:feature-image-updated";

const buildImageId = (): string => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const createDefaultFeatureImageCollection =
  (): FeatureImageCollection => ({
    images: [],
    activeImageId: null,
    directoryPath: null,
    updatedAtMs: Date.now(),
  });

function sanitizePositiveInt(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.floor(value));
}

export function normalizeFeatureImageCollection(
  value: Partial<FeatureImageCollection> | null | undefined,
): FeatureImageCollection {
  const candidateImages = Array.isArray(value?.images)
    ? (value?.images as Array<Partial<FeatureImageItem>>)
    : [];

  const images = candidateImages
    .filter((item) => typeof item?.url === "string" && item.url)
    .map((item, index) => {
      const name =
        typeof item?.name === "string" && item.name.trim()
          ? item.name
          : `Image ${index + 1}`;
      const path = typeof item?.path === "string" ? item.path : "";
      const id =
        typeof item?.id === "string" && item.id ? item.id : buildImageId();
      return {
        id,
        name,
        path,
        url: item?.url as string,
        createdAtMs: sanitizePositiveInt(item?.createdAtMs, Date.now()),
        showInWindowList:
          typeof item?.showInWindowList === "boolean"
            ? item.showInWindowList
            : true,
      };
    });

  const activeImageIdRaw = value?.activeImageId;
  const activeImageId =
    typeof activeImageIdRaw === "string" &&
    images.some((img) => img.id === activeImageIdRaw)
      ? activeImageIdRaw
      : (images[0]?.id ?? null);

  return {
    images,
    activeImageId,
    directoryPath:
      typeof value?.directoryPath === "string" && value.directoryPath.trim()
        ? value.directoryPath
        : null,
    updatedAtMs: sanitizePositiveInt(value?.updatedAtMs, Date.now()),
  };
}

export function loadFeatureImageCollection(): FeatureImageCollection {
  try {
    const raw = localStorage.getItem(FEATURE_IMAGE_STORAGE_KEY);
    if (!raw) return createDefaultFeatureImageCollection();
    const parsed = JSON.parse(raw) as Partial<FeatureImageCollection>;
    return normalizeFeatureImageCollection(parsed);
  } catch {
    return createDefaultFeatureImageCollection();
  }
}

export function saveFeatureImageCollection(next: FeatureImageCollection): void {
  const normalized = normalizeFeatureImageCollection(next);
  localStorage.setItem(FEATURE_IMAGE_STORAGE_KEY, JSON.stringify(normalized));
  window.dispatchEvent(
    new CustomEvent(FEATURE_IMAGE_EVENT, {
      detail: normalized,
    }),
  );
}

export function setActiveImageId(
  collection: FeatureImageCollection,
  imageId: string,
): FeatureImageCollection {
  if (!collection.images.some((img) => img.id === imageId)) return collection;
  return {
    ...collection,
    activeImageId: imageId,
    updatedAtMs: Date.now(),
  };
}

export function removeImageFromCollection(
  collection: FeatureImageCollection,
  imageId: string,
): FeatureImageCollection {
  const filtered = collection.images.filter((img) => img.id !== imageId);
  const nextActiveId =
    collection.activeImageId === imageId
      ? (filtered[0]?.id ?? null)
      : collection.activeImageId &&
          filtered.some((img) => img.id === collection.activeImageId)
        ? collection.activeImageId
        : (filtered[0]?.id ?? null);

  return {
    ...collection,
    images: filtered,
    activeImageId: nextActiveId,
    updatedAtMs: Date.now(),
  };
}

export function addImagesToCollection(
  collection: FeatureImageCollection,
  directoryPath: string,
  sources: FeatureImageSource[],
): FeatureImageCollection {
  const existingByPath = new Map(
    collection.images.map((img) => [img.path, img]),
  );

  const incoming = sources.map((source) => {
    const existing = existingByPath.get(source.path);
    if (existing) {
      return {
        ...existing,
        name: source.name,
        url: source.url,
        showInWindowList: true,
      };
    }

    return {
      id: buildImageId(),
      name: source.name,
      path: source.path,
      url: source.url,
      createdAtMs: Date.now(),
      showInWindowList: true,
    } as FeatureImageItem;
  });

  return {
    images: incoming,
    activeImageId: incoming[0]?.id ?? null,
    directoryPath,
    updatedAtMs: Date.now(),
  };
}
