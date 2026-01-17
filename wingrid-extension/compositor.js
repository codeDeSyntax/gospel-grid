// WinGrid Compositor - Matches desktop app workflow

class WindowCompositor {
  constructor() {
    this.capturedWindows = [];
    this.currentLayout = "2x2";
    this.publishedWindow = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSettings();
    this.updateUI();
  }

  setupEventListeners() {
    // Add window button
    document.getElementById("addWindowBtn").addEventListener("click", () => {
      this.captureWindow();
    });

    // Present mode button
    document.getElementById("presentModeBtn").addEventListener("click", () => {
      this.togglePresentMode();
    });

    // Clear button
    document.getElementById("clearBtn").addEventListener("click", () => {
      this.clearAllWindows();
    });

    // Settings button
    document.getElementById("settingsBtn").addEventListener("click", () => {
      this.toggleSettings();
    });

    document.getElementById("closeSettings").addEventListener("click", () => {
      this.toggleSettings();
    });

    // Layout selector
    document.getElementById("layoutSelect").addEventListener("change", (e) => {
      this.currentLayout = e.target.value;
      this.updatePreview();
      this.saveSettings();
    });

    // Theme buttons
    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.changeTheme(btn.dataset.theme);
      });
    });

    // Quality settings
    document
      .getElementById("frameRateSelect")
      .addEventListener("change", () => {
        this.saveSettings();
      });

    document
      .getElementById("resolutionSelect")
      .addEventListener("change", () => {
        this.saveSettings();
      });
  }

  async captureWindow() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "window",
          frameRate: parseInt(document.getElementById("frameRateSelect").value),
        },
        audio: false,
      });

      // Create video element
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      video.style.display = "none"; // Hide but keep playing

      // Wait for video to actually start playing
      await new Promise((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(resolve);
        };
      });

      // Wait a bit for first frame
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Capture thumbnail
      const thumbnail = await this.captureThumbnail(video);

      // Add to list
      const windowData = {
        id: Date.now().toString(),
        stream: stream,
        video: video,
        thumbnail: thumbnail,
        name: `Window ${this.capturedWindows.length + 1}`,
        active: true,
      };

      this.capturedWindows.push(windowData);

      // Append video to body (hidden) to keep it alive
      document.body.appendChild(video);

      this.addWindowToList(windowData);
      this.autoSelectLayout();
      this.updatePreview();
      this.updateStorage();

      // Handle stream end
      stream.getVideoTracks()[0].addEventListener("ended", () => {
        this.removeWindow(windowData.id);
      });
    } catch (error) {
      console.error("Failed to capture:", error);
      alert(
        "Failed to capture window. Please select a window and grant permissions."
      );
    }
  }

  async captureThumbnail(video) {
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = 320;
    tempCanvas.height = 180;

    // Ensure video has dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return "";
    }

    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

    return tempCanvas.toDataURL("image/jpeg", 0.8);
  }

  addWindowToList(windowData) {
    const list = document.getElementById("windowList");

    const item = document.createElement("div");
    item.className = "window-item";
    item.dataset.id = windowData.id;

    item.innerHTML = `
      <div class="window-thumbnail">
        <img src="${windowData.thumbnail}" alt="${windowData.name}">
      </div>
      <div class="window-info">
        <div class="window-name">${windowData.name}</div>
        <button class="remove-btn">Remove</button>
      </div>
    `;

    item.querySelector(".remove-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeWindow(windowData.id);
    });

    list.appendChild(item);
  }

  removeWindow(id) {
    const index = this.capturedWindows.findIndex((w) => w.id === id);
    if (index !== -1) {
      const window = this.capturedWindows[index];

      if (window.stream) {
        window.stream.getTracks().forEach((track) => track.stop());
      }

      if (window.video && window.video.parentNode) {
        window.video.parentNode.removeChild(window.video);
      }

      this.capturedWindows.splice(index, 1);

      const item = document.querySelector(`[data-id="${id}"]`);
      if (item) item.remove();

      this.autoSelectLayout();
      this.updatePreview();
      this.updateStorage();
    }
  }

  clearAllWindows() {
    if (this.capturedWindows.length === 0) return;

    if (confirm("Remove all captured windows?")) {
      this.capturedWindows.forEach((window) => {
        if (window.stream) {
          window.stream.getTracks().forEach((track) => track.stop());
        }
      });

      this.capturedWindows = [];
      document.getElementById("windowList").innerHTML = "";

      this.updatePreview();
      this.updateStorage();
    }
  }

  autoSelectLayout() {
    const count = this.capturedWindows.length;
    const layoutSelect = document.getElementById("layoutSelect");

    let newLayout = this.currentLayout;

    if (count === 1) {
      newLayout = "1x1";
    } else if (count === 2) {
      newLayout = "1x2"; // Stack vertically (column)
    } else if (count === 3) {
      newLayout = "3x1";
    } else if (count >= 4) {
      newLayout = "2x2";
    }

    if (newLayout !== this.currentLayout) {
      this.currentLayout = newLayout;
      layoutSelect.value = newLayout;
      this.saveSettings();
    }
  }

  updatePreview() {
    const preview = document.getElementById("windowLayoutPreview");
    const emptyState = document.getElementById("emptyState");

    if (this.capturedWindows.length === 0) {
      emptyState.style.display = "flex";
      preview
        .querySelectorAll(".preview-thumbnail")
        .forEach((el) => el.remove());
      return;
    }

    emptyState.style.display = "none";

    // Clear existing thumbnails
    preview.querySelectorAll(".preview-thumbnail").forEach((el) => el.remove());

    // Add live video thumbnails based on layout
    const layout = this.getLayoutConfig();
    const activeWindows = this.capturedWindows.filter((w) => w.active);

    activeWindows.forEach((window, index) => {
      if (index >= layout.positions.length) return;

      const pos = layout.positions[index];

      const thumb = document.createElement("div");
      thumb.className = "preview-thumbnail";
      thumb.dataset.windowId = window.id;
      thumb.style.cssText = `
        position: absolute;
        left: ${pos.x}%;
        top: ${pos.y}%;
        width: ${pos.width}%;
        height: ${pos.height}%;
        background: #000;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid rgba(var(--theme-primary-500), 0.5);
      `;

      // Clone the video element for this preview
      const previewVideo = document.createElement("video");
      previewVideo.srcObject = window.stream;
      previewVideo.autoplay = true;
      previewVideo.muted = true;
      previewVideo.playsInline = true;
      previewVideo.style.cssText =
        "width: 100%; height: 100%; object-fit: contain;";

      thumb.appendChild(previewVideo);
      preview.appendChild(thumb);
    });
  }

  getLayoutConfig() {
    const gap = 2; // 2% gap

    const layouts = {
      "1x1": {
        positions: [{ x: 0, y: 0, width: 100, height: 100 }],
      },
      "2x1": {
        positions: [
          { x: 0, y: 0, width: 50 - gap / 2, height: 100 },
          { x: 50 + gap / 2, y: 0, width: 50 - gap / 2, height: 100 },
        ],
      },
      "1x2": {
        positions: [
          { x: 0, y: 0, width: 100, height: 50 - gap / 2 },
          { x: 0, y: 50 + gap / 2, width: 100, height: 50 - gap / 2 },
        ],
      },
      "2x2": {
        positions: [
          { x: 0, y: 0, width: 50 - gap / 2, height: 50 - gap / 2 },
          { x: 50 + gap / 2, y: 0, width: 50 - gap / 2, height: 50 - gap / 2 },
          { x: 0, y: 50 + gap / 2, width: 50 - gap / 2, height: 50 - gap / 2 },
          {
            x: 50 + gap / 2,
            y: 50 + gap / 2,
            width: 50 - gap / 2,
            height: 50 - gap / 2,
          },
        ],
      },
      "3x1": {
        positions: [
          { x: 0, y: 0, width: 33.33 - gap, height: 100 },
          { x: 33.33, y: 0, width: 33.33 - gap, height: 100 },
          { x: 66.66, y: 0, width: 33.33 - gap, height: 100 },
        ],
      },
    };

    return layouts[this.currentLayout] || layouts["2x2"];
  }

  togglePresentMode() {
    if (this.capturedWindows.length === 0) {
      alert("Please capture at least one window first");
      return;
    }

    const body = document.body;
    const btn = document.getElementById("presentModeBtn");

    if (body.classList.contains("present-mode")) {
      // Exit present mode
      body.classList.remove("present-mode");
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3" />
        </svg>
        <span>Present Mode</span>
      `;
    } else {
      // Enter present mode
      body.classList.add("present-mode");
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
        <span>Exit Present</span>
      `;
    }
  }

  updateUI() {
    // UI updates handled by updatePreview
  }

  toggleSettings() {
    document.getElementById("settingsPanel").classList.toggle("visible");
  }

  changeTheme(theme) {
    document.body.dataset.theme = theme;

    document.querySelectorAll(".theme-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.theme === theme);
    });

    chrome.storage.local.set({ theme });
  }

  loadSettings() {
    chrome.storage.local.get(
      ["theme", "frameRate", "resolution", "layout"],
      (data) => {
        if (data.theme) {
          this.changeTheme(data.theme);
        }
        if (data.frameRate) {
          document.getElementById("frameRateSelect").value = data.frameRate;
        }
        if (data.resolution) {
          document.getElementById("resolutionSelect").value = data.resolution;
        }
        if (data.layout) {
          this.currentLayout = data.layout;
          document.getElementById("layoutSelect").value = data.layout;
        }
      }
    );
  }

  saveSettings() {
    const settings = {
      frameRate: document.getElementById("frameRateSelect").value,
      resolution: document.getElementById("resolutionSelect").value,
      layout: this.currentLayout,
    };
    chrome.storage.local.set(settings);
  }

  updateStorage() {
    chrome.storage.local.set({
      windowCount: this.capturedWindows.length,
      status: this.publishedWindow
        ? "Publishing"
        : this.capturedWindows.length > 0
        ? "Ready"
        : "Idle",
    });
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.compositor = new WindowCompositor();
});
