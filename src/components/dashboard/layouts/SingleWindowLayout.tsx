import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { type WindowInfo } from "../picker/WindowPicker";

interface SingleWindowLayoutProps {
  window: WindowInfo;
  renderWindow: (
    window: WindowInfo,
    style: React.CSSProperties,
  ) => React.ReactNode;
}

export const SingleWindowLayout: React.FC<SingleWindowLayoutProps> = ({
  window,
  renderWindow,
}) => {
  const windowStyle: React.CSSProperties = {
    width: "80%",
    height: "70%",
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <AnimatePresence mode="wait">
        {renderWindow(window, windowStyle)}
      </AnimatePresence>
    </div>
  );
};
