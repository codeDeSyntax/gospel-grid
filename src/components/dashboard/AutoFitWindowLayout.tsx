import React, { useMemo, useRef, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cleanWindowTitle, calculateGridLayout, calculateWindowCardSize } from '../../utils/windowUtils';
import { WindowInfo } from '../dashboard/WindowList';

interface AutoFitWindowLayoutProps {
  selectedWindows: WindowInfo[];
  focusedWindowId: string | null;
  onWindowFocus: (windowId: string) => void;
  onWindowRemove: (windowId: string) => void;
  maxDisplayWindows?: number;
}

export const AutoFitWindowLayout: React.FC<AutoFitWindowLayoutProps> = ({
  selectedWindows,
  focusedWindowId,
  onWindowFocus,
  onWindowRemove,
  maxDisplayWindows = 25 // Allow up to 25 windows
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 400, height: 300 });

  // Update container size when component mounts or resizes
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

  // Calculate layout and sizing
  const layoutInfo = useMemo(() => {
    const displayWindows = selectedWindows.slice(0, maxDisplayWindows);
    const windowCount = displayWindows.length;
    
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
      windows: displayWindows,
      gridLayout,
      cardSize
    };
  }, [selectedWindows, containerSize, maxDisplayWindows]);

  // Clean window titles
  const cleanedWindows = useMemo(() => {
    if (!layoutInfo) return [];
    
    return layoutInfo.windows.map(window => ({
      ...window,
      cleanName: cleanWindowTitle(window.name, window.app)
    }));
  }, [layoutInfo]);

  if (!layoutInfo || selectedWindows.length === 0) {
    return (
      <div 
        ref={containerRef}
        className="flex items-center justify-center h-full text-slate-400 text-center"
      >
        <div>
          <div className="text-4xl mb-2">📱</div>
          <div>No windows selected</div>
          <div className="text-sm">
            Click on windows in the sidebar to add them to the layout
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="h-full w-full p-2 overflow-hidden"
    >
      <div 
        className={`grid gap-2 h-full ${layoutInfo.gridLayout.className}`}
        style={{
          gridTemplateRows: `repeat(${layoutInfo.gridLayout.rows}, 1fr)`
        }}
      >
        {cleanedWindows.map((window) => (
          <div
            key={window.id}
            className={`backdrop-blur-xl bg-gradient-to-br from-primary-800/70 via-slate-800/80 to-primary-900/70 border border-primary-400/40 rounded-lg p-2 flex flex-col justify-between cursor-pointer transition-all hover:from-primary-700/80 hover:to-primary-800/80 shadow-md shadow-primary-500/20 relative group ${
              focusedWindowId === window.id
                ? "ring-2 ring-primary-400/80 shadow-lg shadow-primary-400/30"
                : ""
            }`}
            onClick={() => onWindowFocus(window.id)}
            style={{
              minWidth: `${layoutInfo.cardSize.width}px`,
              minHeight: `${layoutInfo.cardSize.height}px`
            }}
          >
            {/* Remove button - only visible on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onWindowRemove(window.id);
              }}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-600/90 text-white rounded-full p-1 text-xs z-10"
              title="Remove from layout"
            >
              <X size={10} />
            </button>

            {/* Window content */}
            <div className="flex-1 flex flex-col justify-center text-center">
              <div 
                className={`text-white font-medium ${layoutInfo.cardSize.fontSize} mb-1 leading-tight`}
                title={window.name} // Show full title on hover
              >
                {window.cleanName}
              </div>
              
              {/* Show app name only if different from cleaned name */}
              {window.app !== window.cleanName.toLowerCase() && (
                <div className="text-slate-400 text-xs opacity-80">
                  {window.app}
                </div>
              )}
            </div>

            {/* Window state indicators */}
            <div className="flex justify-center gap-1 mt-1">
              {window.isMinimized && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-1 rounded">
                  MIN
                </span>
              )}
              {window.isMaximized && (
                <span className="text-xs bg-green-500/20 text-green-400 px-1 rounded">
                  MAX
                </span>
              )}
              {!window.isVisible && (
                <span className="text-xs bg-gray-500/20 text-gray-400 px-1 rounded">
                  HIDDEN
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Show overflow indicator if there are more windows */}
      {selectedWindows.length > maxDisplayWindows && (
        <div className="absolute bottom-2 right-2 bg-primary-600/80 text-white text-xs px-2 py-1 rounded-full">
          +{selectedWindows.length - maxDisplayWindows} more
        </div>
      )}
    </div>
  );
};