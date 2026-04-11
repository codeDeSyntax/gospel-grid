import React, { useMemo, useState, memo, useCallback, useEffect } from "react";
import { DepthButton } from "@/shared/DepthButton";
import {
  addImagesToCollection,
  loadFeatureImageCollection,
  removeImageFromCollection,
  saveFeatureImageCollection,
  setActiveImageId,
  getImageFeatureWindowId,
  type FeatureImageCollection,
  type FeatureImageItem,
  type FeatureImageSource,
} from "./featureImageState";

const buildDragPayload = memo(
  (image: FeatureImageItem) => {
    const windowInfo = {
      id: getImageFeatureWindowId(image.id),
      name: image.name,
      app: "Image Feature",
      isSelected: false,
      isPinned: true,
      thumbnail: image.url,
      icon: "/fileexp.png",
      isVisible: true,
      isMinimized: false,
    };

    return {
      windowId: windowInfo.id,
      windowInfo: JSON.stringify(windowInfo),
    };
  },
  (prev, next) => prev.id === next.id,
);

interface LazyImageItemProps {
  image: FeatureImageItem;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
}

const LazyImageItem = memo<LazyImageItemProps>({
  image,
  isActive,
  onSelect,
  onDelete,
  onDragStart,
}: LazyImageItemProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      draggable
      onDragStart={onDragStart}
      className={`relative overflow-hidden transition-all duration-200 flex items-center gap-2 pl-2.5 pr-8 py-1 rounded-xl group cursor-grab active:cursor-grabbing ${
        isActive
          ? "bg-theme-primary-700/20 ring-1 ring-theme-primary-300/55"
          : "bg-theme-primary-900 hover:bg-theme-primary-800/15"
      }`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent -skew-x-12 transition-opacity duration-700 pointer-events-none" />

      <button
        type="button"
        onClick={() => onSelect(image.id)}
        className="w-full text-left min-w-0 z-10 flex items-center gap-2"
        title={image.name}
      >
        {isVisible && (
          <img
            src={image.url}
            alt={image.name}
            className="h-8 w-8 rounded object-cover border border-theme-primary-400/20"
            draggable={false}
            loading="lazy"
          />
        )}
        {!isVisible && (
          <div className="h-8 w-8 rounded border border-theme-primary-400/20 bg-theme-primary-800/40" />
        )}
        <span className="min-w-0 flex-1 flex flex-col">
          <span className="text-[11px] font-semibold text-theme-primary-100 truncate leading-tight">
            {image.name}
          </span>
          <span className="text-[10px] text-theme-primary-300/75 leading-tight">
            Drag to any display
          </span>
        </span>
      </button>

      <button
        type="button"
        onClick={() => onDelete(image.id)}
        className="absolute right-1.5 top-1 z-20 h-5 w-5 rounded-md text-theme-primary-200/70 text-[10px] leading-none hover:text-theme-primary-50"
        title="Remove image"
      >
        x
      </button>
    </div>
  );
}, (prev, next) => {
  return (
    prev.image.id === next.image.id &&
    prev.isActive === next.isActive &&
    prev.onSelect === next.onSelect &&
    prev.onDelete === next.onDelete &&
    prev.onDragStart === next.onDragStart
  );
});

export const FeatureImageView: React.FC = () => {
  const [imageCollection, setImageCollection] =
    useState<FeatureImageCollection>(() => loadFeatureImageCollection());
  const [isLoading, setIsLoading] = useState(false);

  const applyCollection = (next: FeatureImageCollection) => {
    setImageCollection(next);
    saveFeatureImageCollection(next);
  };

  const handlePickDirectory = async () => {
    setIsLoading(true);
    try {
      const dirPath = await window.electronAPI.selectDirectory();
      if (!dirPath) return;

      const images = (await window.electronAPI.getImages(
        dirPath,
      )) as FeatureImageSource[];
      const next = addImagesToCollection(
        imageCollection,
        dirPath,
        images ?? [],
      );
      applyCollection(next);
    } finally {
      setIsLoading(false);
    }
  };

  const activeImageId = imageCollection.activeImageId;

  const countLabel = useMemo(() => {
    const count = imageCollection.images.length;
    return `${count} image${count === 1 ? "" : "s"}`;
  }, [imageCollection.images.length]);

  const handleImageSelect = useCallback(
    (id: string) =>
      applyCollection(setActiveImageId(imageCollection, id)),
    [imageCollection],
  );

  const handleImageDelete = useCallback(
    (id: string) =>
      applyCollection(removeImageFromCollection(imageCollection, id)),
    [imageCollection],
  );

  const handleImageDragStart = useCallback(
    (image: FeatureImageItem) => (e: React.DragEvent<HTMLDivElement>) => {
      const payload = buildDragPayload(image);
      e.dataTransfer.setData("text/plain", JSON.stringify(payload));
      e.dataTransfer.effectAllowed = "copy";
    },
    [],
  );

  return (
    <div className="h-full w-full rounded-2xl px-4 py-4 overflow-auto no-scrollbar bg-black text-white">
      <div className="mx-auto flex h-full w-full max-w-7xl gap-4 min-h-0">
        <aside className="w-[280px] shrink-0 rounded-2xl border border-theme-primary-500/30 bg-theme-primary-900/22 p-3 overflow-auto">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-theme-primary-300">
              Image Sources
            </p>
            <span className="text-[10px] text-theme-primary-300/75">
              {countLabel}
            </span>
          </div>

          <DepthButton
            onClick={handlePickDirectory}
            disabled={isLoading}
            sizeClassName="h-9 w-full rounded-xl"
            inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
          >
            <span className="text-xs font-semibold uppercase tracking-wide">
              {isLoading ? "Loading..." : "Choose Folder"}
            </span>
          </DepthButton>

          {imageCollection.directoryPath && (
            <p className="mt-2 text-[10px] text-theme-primary-300/75 break-all">
              {imageCollection.directoryPath}
            </p>
          )}

          <div className="mt-3 space-y-1.5">
            {imageCollection.images.map((image) => (
              <LazyImageItem
                key={image.id}
                image={image}
                isActive={image.id === activeImageId}
                onSelect={handleImageSelect}
                onDelete={handleImageDelete}
                onDragStart={handleImageDragStart(image)}
              />
            ))}

            {imageCollection.images.length === 0 && (
              <div className="rounded-xl border border-theme-primary-500/25 bg-theme-primary-900/15 px-3 py-4 text-center text-[11px] text-theme-primary-300/75">
                Pick a folder to load images, then drag an image card to a
                display.
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 flex-1 flex items-center justify-center rounded-2xl border border-theme-primary-500/30 bg-theme-primary-900/20 px-5 py-5">
          <div className="max-w-xl text-center">
            <img
              src="/fileexp.png"
              alt="Image feature"
              className="mx-auto h-16 w-16 object-contain opacity-90"
              draggable={false}
            />
            <p className="mt-3 font-[impact] text-[30px] tracking-[0.08em] uppercase text-theme-primary-200">
              Image View
            </p>
            <p className="mt-2 text-sm text-theme-primary-300/80">
              Choose a folder, then drag image cards from the side menu to a
              routed screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
