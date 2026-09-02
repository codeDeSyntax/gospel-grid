import React, { useEffect, useMemo, useState } from "react";
import { FolderOpen, X, Image as ImageIcon, Loader2 } from "lucide-react";
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
} from "../RightPanel/featureImageState";

interface FeatureImageMenuProps {
  isOpen: boolean;
  onClose?: () => void;
}

const buildDragPayload = (image: FeatureImageItem) => {
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
};

export const FeatureImageMenu: React.FC<FeatureImageMenuProps> = ({
  isOpen,
  onClose,
}) => {
  const [imageCollection, setImageCollection] =
    useState<FeatureImageCollection>(() => loadFeatureImageCollection());
  const [isLoading, setIsLoading] = useState(false);
  const [failedPreviewIds, setFailedPreviewIds] = useState<
    Record<string, boolean>
  >({});

  const applyCollection = (next: FeatureImageCollection) => {
    setImageCollection(next);
    setFailedPreviewIds({});
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

  const countLabel = useMemo(() => {
    const count = imageCollection.images.length;
    return `${count} image${count === 1 ? "" : "s"}`;
  }, [imageCollection.images.length]);

  const folderName = useMemo(() => {
    if (!imageCollection.directoryPath) return "Select Folder";
    const parts = imageCollection.directoryPath.split(/[/\\]/);
    return parts[parts.length - 1] || imageCollection.directoryPath;
  }, [imageCollection.directoryPath]);

  useEffect(() => {
    let cancelled = false;

    const refreshUrls = async () => {
      if (!isOpen || !imageCollection.directoryPath) return;
      try {
        const images = (await window.electronAPI.getImages(
          imageCollection.directoryPath,
        )) as FeatureImageSource[];
        if (cancelled || !images?.length) return;

        const next = addImagesToCollection(
          imageCollection,
          imageCollection.directoryPath,
          images,
        );
        applyCollection(next);
      } catch {
        // Keep existing collection if refresh fails.
      }
    };

    refreshUrls();
    return () => {
      cancelled = true;
    };
  }, [isOpen, imageCollection.directoryPath]);

  return (
    <div
      className={`absolute left-0 right-0 top-0 z-30 overflow-hidden rounded-2xl border-2 border-dotted border-theme-primary-500 bg-theme-primary-950 transition-all duration-200 ${
        isOpen
          ? "h-[80px] opacity-100 translate-y-0 pointer-events-auto"
          : "h-0 opacity-0 -translate-y-2 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <div className="flex h-full min-h-0 items-center px-3 py-2 gap-3">
        {/* Left: Folder selection button */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handlePickDirectory}
            disabled={isLoading}
            className="flex items-center gap-2 h-9 px-3 rounded-xl border border-theme-primary-600 bg-theme-primary-800 hover:bg-theme-primary-700 text-theme-primary-100 hover:text-white transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
            title={imageCollection.directoryPath || "Select image directory"}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-400" />
            ) : (
              <FolderOpen className="w-3.5 h-3.5 text-primary-400" />
            )}
            <span className="text-[11px] font-bold max-w-[110px] truncate">
              {isLoading ? "Loading..." : folderName}
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-theme-primary-700 text-theme-primary-300 font-semibold">
              {countLabel}
            </span>
          </button>
        </div>

        {/* Center: Image thumbnails strip */}
        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar">
          <div className="flex items-center gap-2 py-0.5 pr-1">
            {imageCollection.images.map((image) => {
              const isActive = image.id === imageCollection.activeImageId;
              return (
                <div
                  key={image.id}
                  draggable
                  onDragStart={(e) => {
                    const payload = buildDragPayload(image);
                    e.dataTransfer.setData(
                      "text/plain",
                      JSON.stringify(payload),
                    );
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  className={`group relative overflow-hidden h-14 w-20 shrink-0 rounded-xl border transition-all duration-200 cursor-grab active:cursor-grabbing shadow-sm ${
                    isActive
                      ? "border-primary-400 ring-2 ring-primary-500/40"
                      : "border-theme-primary-700 hover:border-theme-primary-500 bg-theme-primary-950"
                  }`}
                  title={`${image.name} — Drag to any display screen`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      applyCollection(
                        setActiveImageId(imageCollection, image.id),
                      )
                    }
                    className="h-full w-full text-left min-w-0 z-10 block"
                  >
                    <img
                      src={
                        failedPreviewIds[image.id]
                          ? "/fileexp.png"
                          : image.url
                      }
                      alt={image.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                      onError={() =>
                        setFailedPreviewIds((prev) => ({
                          ...prev,
                          [image.id]: true,
                        }))
                      }
                    />
                  </button>

                  {/* Remove button (revealed on hover) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      applyCollection(
                        removeImageFromCollection(imageCollection, image.id),
                      );
                    }}
                    className="opacity-0 group-hover:opacity-100 absolute right-1 top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white/90 hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                    title="Remove from workspace"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}

            {imageCollection.images.length === 0 && (
              <div className="flex h-14 items-center gap-2 rounded-xl border border-dashed border-theme-primary-700 bg-theme-primary-950/60 px-4 text-xs text-theme-primary-300">
                <ImageIcon className="w-4 h-4 text-theme-primary-400 opacity-70 shrink-0" />
                <span>Select a folder to load and drag images onto displays.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Close button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-theme-primary-400 hover:text-white hover:bg-theme-primary-750 transition-all cursor-pointer"
            title="Close image bar"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
