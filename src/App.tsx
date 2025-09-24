import { useState, useEffect } from "react";
import { ThemeManager } from "./utils/theme";
import { ThemeProvider } from "./utils/themeContext";
import { Welcome } from "./components/welcome/Welcome";
import { Dashboard } from "./components/dashboard/Dashboard";
import { PublishedLayout } from "./components/dashboard/PublishedLayout";
import { WindowInfo } from "./components/dashboard/WindowList";
import SecretTerminal from "./components/SecretTerminal";
import { systemLogger } from "./hooks/useSystemLogger";

type AppScreen = "welcome" | "dashboard" | "settings" | "published";

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("welcome");
  const [publishedLayoutData, setPublishedLayoutData] = useState<{
    windows: WindowInfo[];
    layout: string;
    focusedWindowId: string | null;
  } | null>(null);

  // Initialize theme on app start and check for published layout
  useEffect(() => {
    systemLogger.log("app", "info", "App", "🚀 Application starting up");

    ThemeManager.initialize();
    systemLogger.log("app", "info", "Theme", "🎨 Theme manager initialized");

    // Check if this is a published layout window
    const urlParams = new URLSearchParams(window.location.search);
    const layoutId = urlParams.get("layoutId");

    if (layoutId) {
      // Fetch layout data from main process using the ID
      (window.electronAPI as any)
        .getPublishedLayout(layoutId)
        .then((layoutData: any) => {
          if (layoutData && layoutData.isPublished && layoutData.windows) {
            setPublishedLayoutData({
              windows: layoutData.windows,
              layout: layoutData.layout,
              focusedWindowId: layoutData.focusedWindowId,
            });
            setCurrentScreen("published");
            systemLogger.log(
              "app",
              "info",
              "Layout",
              `📊 Published layout loaded with ${layoutData.windows.length} windows`
            );
          } else {
            systemLogger.log(
              "app",
              "error",
              "Layout",
              `❌ Failed to load published layout data for ID: ${layoutId}`
            );
          }
        })
        .catch((error: any) => {
          systemLogger.log(
            "app",
            "error",
            "Layout",
            `❌ Error fetching published layout: ${error.message}`
          );
        });
    }

    // Log app initialization complete
    systemLogger.log(
      "app",
      "success",
      "App",
      "✅ Application initialization complete"
    );
  }, []);

  const handleGetStarted = () => {
    systemLogger.log(
      "app",
      "info",
      "Navigation",
      "🎯 User navigated to dashboard"
    );
    setCurrentScreen("dashboard");
  };

  const handleBackToWelcome = () => {
    systemLogger.log(
      "app",
      "info",
      "Navigation",
      "🏠 User navigated back to welcome"
    );
    setCurrentScreen("welcome");
  };

  const handleMinimizePublished = () => {
    systemLogger.log(
      "app",
      "info",
      "Published",
      "⬇️ Minimizing published layout window via ESC key"
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
      "❌ Closing published layout window via close button"
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
        return <Dashboard />;
      case "published":
        return publishedLayoutData ? (
          <PublishedLayout
            windows={publishedLayoutData.windows}
            layout={publishedLayoutData.layout}
            focusedWindowId={publishedLayoutData.focusedWindowId}
            onMinimize={handleMinimizePublished}
            onClose={handleClosePublished}
          />
        ) : null;
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
      <div className="app no-scrollbar">
        {renderScreen()}
        <SecretTerminal />
      </div>
    </ThemeProvider>
  );
}

export default App;
