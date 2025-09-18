import React, { useEffect, useState, useRef } from "react";
import { WindowInfo } from "./WindowList";
import { OptimizedThumbnailGrid } from "./OptimizedThumbnailGrid";

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

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black text-white z-50 overflow-hidden"
    >
      <OptimizedThumbnailGrid
        windows={windows}
        className="w-full h-full"
        itemClassName="min-h-[150px]"
        enableLazyLoading={false} // Disable for published view - load all immediately
        enableHighQuality={true} // Enable high-quality thumbnails
        onWindowFocus={(windowId) => setCurrentFocusedId(windowId)}
      />
    </div>
  );
};
