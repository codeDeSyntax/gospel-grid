import { useState, useEffect } from "react";
import { ThemeManager } from "./utils/theme";
import { Welcome } from "./components/welcome/Welcome";
import { Dashboard } from "./components/dashboard/Dashboard";
import { PublishedLayout } from "./components/dashboard/PublishedLayout";
import { WindowInfo } from "./components/dashboard/WindowList";

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
    ThemeManager.initialize();

    // Check if this is a published layout window
    const urlParams = new URLSearchParams(window.location.search);
    const layoutParam = urlParams.get("layout");

    if (layoutParam) {
      try {
        const layoutData = JSON.parse(decodeURIComponent(layoutParam));
        if (layoutData.isPublished && layoutData.windows) {
          setPublishedLayoutData({
            windows: layoutData.windows,
            layout: layoutData.layout,
            focusedWindowId: layoutData.focusedWindowId,
          });
          setCurrentScreen("published");
        }
      } catch (error) {
        console.error("Failed to parse layout data:", error);
      }
    }
  }, []);

  const handleGetStarted = () => {
    setCurrentScreen("dashboard");
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
  };

  const handleClosePublished = () => {
    // Close this window - it's a published layout window
    if (window.electronAPI) {
      window.close();
    }
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

  return <div className="app no-scrollbar">{renderScreen()}</div>;
}

export default App;
