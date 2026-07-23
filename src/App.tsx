import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider } from "./utils/themeContext";
import { Welcome } from "./components/welcome/Welcome";
import { Dashboard } from "./components/dashboard/Dashboard";
import { AppSplash } from "./components/splash/AppSplash";
import { ProjectionLayout } from "./components/dashboard/projection/ProjectionLayout";
import { PublishedLayoutLoadingScreen } from "./components/dashboard/projection/PublishedLayoutLoadingScreen";
import { type WindowInfo } from "./components/dashboard/picker/WindowPicker";
import { useAppDispatch } from "./store/hooks";
import {
  setPublishedQuality,
  setCaptureQuality,
  setBlackout,
  setFrozen,
  setOverlayText,
  setOverlayVisible,
} from "./store/slices/appSlice";

import { systemLogger } from "./hooks/useSystemLogger";

type AppScreen = "welcome" | "dashboard" | "settings" | "published";

const SCREEN_ORDER: Record<AppScreen, number> = {
  welcome: 0,
  dashboard: 1,
  settings: 2,
  published: 3,
};

const slideVariants = {
  enter: (direction: number) => ({
    x: direction >= 0 ? "100%" : "-100%",
    opacity: 1,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction >= 0 ? "-100%" : "100%",
    opacity: 1,
  }),
};

function App() {
  const dispatch = useAppDispatch();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("dashboard");
  const [showSplash, setShowSplash] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(1);
  const [isPublishedLayoutLoading, setIsPublishedLayoutLoading] =
    useState(false);
  const [publishedLayoutData, setPublishedLayoutData] = useState<{
    windows: WindowInfo[];
    layout: string;
    focusedWindowId: string | null;
    layoutId?: string;
  } | null>(null);

  const navigateTo = (nextScreen: AppScreen) => {
    const nextOrder = SCREEN_ORDER[nextScreen];
    const currentOrder = SCREEN_ORDER[currentScreen];
    setNavigationDirection(nextOrder >= currentOrder ? 1 : -1);
    setCurrentScreen(nextScreen);
  };

  // Initialize theme on app start and check for published layout
  useEffect(() => {
    systemLogger.log("app", "info", "App", "🚀 Application starting up");

    // Check if this is a published layout window
    const urlParams = new URLSearchParams(window.location.search);
    const layoutId = urlParams.get("layoutId");

    if (layoutId) {
      navigateTo("published");
      setIsPublishedLayoutLoading(true);

      // Fetch layout data from main process using the ID
      (window.electronAPI as any)
        .getPublishedLayout(layoutId)
        .then((layoutData: any) => {
          if (layoutData && layoutData.isPublished && layoutData.windows) {
            setPublishedLayoutData({
              windows: layoutData.windows,
              layout: layoutData.layout,
              focusedWindowId: layoutData.focusedWindowId,
              layoutId,
            });
            setIsPublishedLayoutLoading(false);
            systemLogger.log(
              "app",
              "info",
              "Layout",
              `📊 Published layout loaded with ${layoutData.windows.length} windows`,
            );
          } else {
            setIsPublishedLayoutLoading(false);
            setPublishedLayoutData(null);
            navigateTo("welcome");
            systemLogger.log(
              "app",
              "error",
              "Layout",
              `❌ Failed to load published layout data for ID: ${layoutId}`,
            );
          }
        })
        .catch((error: any) => {
          setIsPublishedLayoutLoading(false);
          setPublishedLayoutData(null);
          navigateTo("welcome");
          systemLogger.log(
            "app",
            "error",
            "Layout",
            `❌ Error fetching published layout: ${error.message}`,
          );
        });
    }

    // Log app initialization complete
    systemLogger.log(
      "app",
      "success",
      "App",
      "✅ Application initialization complete",
    );

    // Listen for quality settings changes from main window (for published layouts)
    const isPublishedLayout = layoutId;

    if (isPublishedLayout) {
      const unsubscribe = (
        window.electronAPI as any
      )?.onQualitySettingsChanged?.((settings: any) => {
        console.log("📊 App received quality settings via IPC:", settings);
        if (settings.publishedQuality) {
          dispatch(setPublishedQuality(settings.publishedQuality));
        }
        if (settings.captureQuality !== undefined) {
          dispatch(setCaptureQuality(settings.captureQuality));
        }
      });

      // Listen for projection state changes (blackout / freeze / overlay)
      const unsubscribeProjection = (
        window.electronAPI as any
      )?.onProjectionStateChanged?.(
        (state: {
          isBlackout: boolean;
          isFrozen: boolean;
          overlayText: string;
          overlayVisible: boolean;
        }) => {
          dispatch(setBlackout(state.isBlackout));
          dispatch(setFrozen(state.isFrozen));
          dispatch(setOverlayText(state.overlayText ?? ""));
          dispatch(setOverlayVisible(state.overlayVisible ?? false));
        },
      );

      const unsubscribePublishedLayout = (
        window.electronAPI as any
      )?.onPublishedLayoutUpdated?.((layoutData: any) => {
        if (!layoutData?.layoutId || layoutData.layoutId !== layoutId) {
          return;
        }

        if (layoutData.windows && layoutData.layout) {
          setPublishedLayoutData({
            windows: layoutData.windows,
            layout: layoutData.layout,
            focusedWindowId: layoutData.focusedWindowId ?? null,
            layoutId,
          });
        }
      });

      return () => {
        if (typeof unsubscribe === "function") unsubscribe();
        if (typeof unsubscribeProjection === "function")
          unsubscribeProjection();
        if (typeof unsubscribePublishedLayout === "function")
          unsubscribePublishedLayout();
      };
    }
  }, [dispatch]);

  useEffect(() => {
    // TEMP: splashReady disabled so splash stays open for design review
    const timer = window.setTimeout(() => {
      (window as any).windowControls?.splashReady?.();
      setShowSplash(false);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    systemLogger.log(
      "app",
      "info",
      "Navigation",
      "🎯 User navigated to dashboard",
    );
    navigateTo("dashboard");
  };

  const handleBackToWelcome = () => {
    systemLogger.log(
      "app",
      "info",
      "Navigation",
      "🏠 User navigated back to welcome",
    );
    navigateTo("welcome");
  };

  const handleMinimizePublished = () => {
    systemLogger.log(
      "app",
      "info",
      "Published",
      "⬇️ Minimizing published layout window via ESC key",
    );
    // Minimize this window and focus main window
    if (window.windowControls) {
      window.windowControls.minimize();
    }
  };

  const handleClosePublished = () => {
    systemLogger.log(
      "app",
      "info",
      "Published",
      "❌ Closing published layout window via close button",
    );
    // This handler is called before the window closes
    // The actual window closing is handled by the useWindowControls hook in PublishedLayout
    // We could add cleanup logic here if needed
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <Welcome onGetStarted={handleGetStarted} />;
      case "dashboard":
        return <Dashboard onHomeClick={handleBackToWelcome} />;
      case "published":
        return isPublishedLayoutLoading || !publishedLayoutData ? (
          <PublishedLayoutLoadingScreen />
        ) : (
          <ProjectionLayout
            windows={publishedLayoutData.windows}
            layout={publishedLayoutData.layout}
            focusedWindowId={publishedLayoutData.focusedWindowId}
            onMinimize={handleMinimizePublished}
            onClose={handleClosePublished}
          />
        );
      case "settings":
        return (
          <div className="h-screen no-scrollbar bg-background-primary text-text-primary flex items-center justify-center">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-primary-600">Settings</h1>
              <p className="text-text-secondary">
                Settings screen coming soon...
              </p>
              <button
                onClick={handleBackToWelcome}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg transition-colors"
              >
                Back to Welcome
              </button>
            </div>
          </div>
        );
      default:
        return <Welcome onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="app relative h-screen w-screen overflow-hidden no-scrollbar bg-theme-primary-950">
        <AnimatePresence
          initial={false}
          mode="sync"
          custom={navigationDirection}
        >
          <motion.div
            key={currentScreen}
            custom={navigationDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.44,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="absolute inset-0"
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
        <AnimatePresence>{showSplash && <AppSplash />}</AnimatePresence>
      </div>
    </ThemeProvider>
  );
}

export default App;
