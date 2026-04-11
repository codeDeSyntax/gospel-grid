import React, { useEffect, useMemo, useState } from "react";
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

interface FeatureImageMenuProps {
  isOpen: boolean;
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
      className={` f absolute left-0 right-0 top-0 overflow-hidden rounded-2xl border-dotted border-1 border-theme-primary-500 bg-theme-primary-950  transition-all duration-200 ${
        isOpen
          ? "h-[80px] opacity-100 pointer-events-auto"
          : "h-0 opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <aside className="h-full px-3 py-2 ">
        <div className="flex h-full min-h-0 items-center  rounded-2xl border-theme-primary-600 px-2 gap-2">
          <div className="flex shrink-0 items-center  gap-2 pt-0.5">
            <DepthButton
              onClick={handlePickDirectory}
              disabled={isLoading}
              sizeClassName="h-8 rounded-lg px-3"
              inactiveClassName="text-theme-primary-100 border-theme-primary-500/35"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {isLoading ? "Loading..." : "Select"}
              </span>
            </DepthButton>

            <span className="text-[10px] text-theme-primary-300/75 whitespace-nowrap">
              {countLabel}
            </span>
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden no-scrollbar">
            <div className="flex items-center gap-1.5 pr-1">
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
                    className={`relative overflow-hidden transition-all duration-200 h-14  shrink-0 rounded-lg border group cursor-grab active:cursor-grabbing ${
                      isActive
                        ? " border-theme-primary-300/55"
                        : " border-theme-primary-500/30 hover:bg-theme-primary-800/30"
                    }`}
                    title={image.name}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        applyCollection(
                          setActiveImageId(imageCollection, image.id),
                        )
                      }
                      className="h-full w-full text-left min-w-0 z-10"
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

                    <button
                      type="button"
                      onClick={() =>
                        applyCollection(
                          removeImageFromCollection(imageCollection, image.id),
                        )
                      }
                      className="absolute right-1 top-1 z-20 h-4 w-4 rounded bg-black/50 text-white/90 text-[9px] leading-none hover:bg-black/70"
                      title="Remove image"
                    >
                      x
                    </button>
                  </div>
                );
              })}

              {imageCollection.images.length === 0 && (
                <div className="flex h-16 items-center rounded-lg border border-theme-primary-500/25 bg-theme-primary-900/20 px-3 text-[10px] text-theme-primary-300/75 whitespace-nowrap">
                  Select a directory, then drag images to a display.
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};
