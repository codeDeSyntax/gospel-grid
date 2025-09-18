import React, { useEffect, useState, useMemo, useRef } from "react";
import { X } from "lucide-react";
import { WindowInfo } from "./WindowList";
import { useThumbnails } from "../../hooks/useThumbnails";
import {
  calculateGridLayout,
  calculateWindowCardSize,
  cleanWindowTitle,
} from "../../utils/windowUtils";

interface PublishedLayoutProps {
  windows: WindowInfo[];
  layout: string;
  focusedWindowId: string | null;
  onClose: () => void;
}

export const PublishedLayout: React.FC<PublishedLayoutProps> = ({
  windows,
  layout,
  focusedWindowId,
  onClose,
}) => {
  const [currentFocusedId, setCurrentFocusedId] = useState<string | null>(
    focusedWindowId
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({
    width: 1920,
    height: 1080,
  });

  // Handle escape key to close
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onClose]);

  // Update container size for full-screen optimization
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Get window IDs for thumbnail capture with high-quality settings
  const windowIds = useMemo(() => {
    return windows.map((window) => window.id);
  }, [windows]);

  // Use high-quality thumbnails for published view
  const { thumbnails, loading: thumbnailsLoading } = useThumbnails(windowIds, {
    width: 1920, // Full HD width
    height: 1080, // Full HD height
    scaleFactor: 1.0, // Use 1.0 to capture actual window size
    quality: 100, // Maximum quality
    refreshInterval: 5000, // Slower refresh for published view
    autoRefresh: true,
  });

  // Calculate optimal layout for full-screen
  const layoutInfo = useMemo(() => {
    const windowCount = windows.length;

    if (windowCount === 0) {
      return null;
    }

    const gridLayout = calculateGridLayout(windowCount);
    const cardSize = calculateWindowCardSize(
      containerSize.width,
      containerSize.height,
      windowCount
    );

    return {
      windows,
      gridLayout,
      cardSize,
    };
  }, [windows, containerSize]);

  // Clean window titles for display
  const cleanedWindows = useMemo(() => {
    if (!layoutInfo) return [];

    const maxTitleLength = 30; // Longer titles for published view

    return layoutInfo.windows.map((window) => ({
      ...window,
      cleanName: cleanWindowTitle(window.name, window.app, maxTitleLength),
    }));
  }, [layoutInfo]);

  const handleWindowFocus = (windowId: string) => {
    setCurrentFocusedId(currentFocusedId === windowId ? null : windowId);
  };

  const handleWindowRemove = (windowId: string) => {
    // In published view, we don't actually remove windows
    console.log("Cannot remove windows in published view");
  };

  return (
    <div className="h-screen w-screen bg-black overflow-hidden">
      {/* Full-screen layout with no UI elements - just windows */}
      <div ref={containerRef} className="h-full w-full overflow-hidden">
        {!layoutInfo || windows.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white text-center">
            <div>
              <div className="text-6xl mb-4">📱</div>
              <div className="text-2xl">No windows to display</div>
            </div>
          </div>
        ) : (
          <div
            className={`grid gap-1 h-full w-full ${layoutInfo.gridLayout.className}`}
            style={{
              gridTemplateRows: `repeat(${layoutInfo.gridLayout.rows}, minmax(200px, 1fr))`,
              gridTemplateColumns: `repeat(${layoutInfo.gridLayout.cols}, 1fr)`,
              maxHeight: "100%",
              maxWidth: "100%",
              alignContent: "start",
            }}
          >
            {cleanedWindows.map((window) => (
              <div
                key={window.id}
                className="relative overflow-hidden"
                style={{
                  minHeight: "200px",
                  maxHeight: "100%",
                  minWidth: "200px",
                  maxWidth: "100%",
                }}
              >
                {/* Live thumbnail preview - completely clean, no overlays */}
                {thumbnails[window.id] ? (
                  <img
                    src={thumbnails[window.id].dataUrl}
                    alt={`${window.name} preview`}
                    className="w-full h-full object-cover"
                    style={{
                      imageRendering: "auto",
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <div className="text-center text-white">
                      <div className="text-white text-lg">
                        {thumbnailsLoading ? "Loading..." : "No preview"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
