import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./store";
import {
  setPublishedQuality,
  setCaptureQuality,
} from "./store/slices/appSlice";

import "./index.css";
import "./styles/themes.css"; // Import theme styles

import "./demos/ipc";
import "./utils/speechRecognition"; // Initialize speech recognition on startup
// If you want use Node.js, the`nodeIntegration` needs to be enabled in the Main process.
// import './demos/node'

// Check if this is a published layout window and initialize quality settings
const urlParams = new URLSearchParams(window.location.search);
const layoutId = urlParams.get("layoutId");
if (layoutId) {
  // Fetch layout data to initialize quality settings
  (window.electronAPI as any)
    ?.getPublishedLayout?.(layoutId)
    .then((layoutData: any) => {
      if (layoutData?.publishedQuality) {
        console.log(
          "Initializing published quality from layout data:",
          layoutData.publishedQuality,
        );
        store.dispatch(setPublishedQuality(layoutData.publishedQuality));
      }
      if (layoutData?.captureQuality) {
        console.log(
          "Initializing capture quality from layout data:",
          layoutData.captureQuality,
        );
        store.dispatch(setCaptureQuality(layoutData.captureQuality));
      }
    })
    .catch((err: any) =>
      console.error("Failed to load layout quality settings:", err),
    );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);

postMessage({ payload: "removeLoading" }, "*");
