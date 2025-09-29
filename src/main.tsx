import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { ThemeManager } from "./utils/theme";
import { ThemeManager as ColorThemeManager } from "./utils/themeManager";
import { store } from "./store";
import { setColorTheme } from "./store/slices/appSlice";

import "./index.css";
import "./styles/themes.css"; // Import theme styles

import "./demos/ipc";
import "./utils/speechRecognition"; // Initialize speech recognition on startup
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

// Initialize theme before rendering
ThemeManager.initialize();

// Initialize color theme system
const savedColorTheme = ColorThemeManager.initialize();
store.dispatch(setColorTheme(savedColorTheme));

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
