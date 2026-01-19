import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WindowInfo } from "../WindowList";

interface DualWindowLayoutProps {
  windows: [WindowInfo, WindowInfo];
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties
  ) => React.ReactNode;
}

export const DualWindowLayout: React.FC<DualWindowLayoutProps> = ({
  windows,
  renderWindow,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({
    width: 500,
    height: 393,
  });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const container = containerRef.current;
        const availableWidth = container.clientWidth - 32; // padding
        const availableHeight = container.clientHeight - 32; // padding + gaps

        // Calculate responsive dimensions maintaining 16:9 aspect ratio
        const maxWidth = Math.min(availableWidth * 0.45, 600); // 45% of width, max 600px
        const width = Math.max(maxWidth, 300); // minimum 300px
        const height = Math.min(width / 1.78, availableHeight - 20); // 16:9 ratio

        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Use ResizeObserver for container resize
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
      className="w-full h-full flex flex-col items-center justify-center gap-4 p-4"
    >
      <AnimatePresence mode="wait">
        {windows[0] && renderWindow(windows[0], windowStyle)}
        {windows[1] && renderWindow(windows[1], windowStyle)}
      </AnimatePresence>
    </div>
  );
};
