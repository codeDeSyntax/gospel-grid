import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowInfo } from "../WindowList";

interface TripleWindowLayoutProps {
  windows: [WindowInfo, WindowInfo, WindowInfo];
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties
  ) => React.ReactNode;
}

export const TripleWindowLayout: React.FC<TripleWindowLayoutProps> = ({
  windows,
  renderWindow,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({
    width: 380,
    height: 240,
  });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const availableWidth = container.clientWidth - 48; // padding + gap
        const availableHeight = container.clientHeight - 60; // padding + gap

        // Calculate responsive dimensions for 2x2 layout (3 windows)
        const width = Math.max(Math.min(availableWidth / 2.2, 450), 280); // responsive with min/max
        const height = Math.max(Math.min(availableHeight / 2.2, 300), 180); // responsive with min/max

        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  const windowStyle: React.CSSProperties = {
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col justify-center items-center gap-3 p-4"
    >
      <AnimatePresence>
        {/* Top row - 2 windows */}
        <div className="flex gap-3">
          {windows[0] && renderWindow(windows[0], windowStyle)}
          {windows[1] && renderWindow(windows[1], windowStyle)}
        </div>
        {/* Bottom row - 1 window positioned left */}
        <div
          className="flex"
          style={{ width: `${dimensions.width * 2 + 12}px` }}
        >
          {windows[2] && renderWindow(windows[2], windowStyle)}
        </div>
      </AnimatePresence>
    </div>
  );
};
