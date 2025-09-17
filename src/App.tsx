import { useState, useEffect } from "react";
import { ThemeManager } from "./utils/theme";
import { Welcome } from "./components/welcome/Welcome";
import { Dashboard } from "./components/dashboard/Dashboard";

type AppScreen = "welcome" | "dashboard" | "settings";

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>("welcome");

  // Initialize theme on app start
  useEffect(() => {
    ThemeManager.initialize();
  }, []);

  const handleGetStarted = () => {
    setCurrentScreen("dashboard");
  };

  const handleBackToWelcome = () => {
    setCurrentScreen("welcome");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "welcome":
        return <Welcome onGetStarted={handleGetStarted} />;
      case "dashboard":
        return <Dashboard />;
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
