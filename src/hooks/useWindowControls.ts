import { useState, useEffect } from "react";

export const useWindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check initial window state
    const checkWindowState = async () => {
      if (window.windowControls) {
        const maximized = await window.windowControls.isMaximized();
        const minimized = await window.windowControls.isMinimized();
        setIsMaximized(maximized);
        setIsMinimized(minimized);
      }
    };

    checkWindowState();
  }, []);

  const handleMinimize = async () => {
    if (window.windowControls) {
      await window.windowControls.minimize();
      setIsMinimized(true);
    }
  };

  const handleMaximize = async () => {
    if (window.windowControls) {
      await window.windowControls.maximize();
      const newMaximizedState = await window.windowControls.isMaximized();
      setIsMaximized(newMaximizedState);
    }
  };

  const handleClose = async () => {
    if (window.windowControls) {
      await window.windowControls.close();
    }
  };

  const handleRelaunch = async () => {
    if (window.windowControls?.relaunch) {
      await window.windowControls.relaunch();
    } else if (window.ipcRenderer) {
      await window.ipcRenderer.invoke("app-relaunch");
    }
  };

  return {
    isMaximized,
    isMinimized,
    minimize: handleMinimize,
    maximize: handleMaximize,
    close: handleClose,
    relaunch: handleRelaunch,
  };
};
