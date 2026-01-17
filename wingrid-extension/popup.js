// Popup script for WinGrid extension

document.addEventListener("DOMContentLoaded", () => {
  const openCompositorBtn = document.getElementById("openCompositor");
  const openSettingsBtn = document.getElementById("openSettings");
  const helpLink = document.getElementById("help");
  const statusEl = document.getElementById("status");
  const windowCountEl = document.getElementById("windowCount");

  // Open compositor in new tab
  openCompositorBtn.addEventListener("click", () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("compositor.html"),
    });
  });

  // Open settings (placeholder)
  openSettingsBtn.addEventListener("click", () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("settings.html"),
    });
  });

  // Help action
  helpLink.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.tabs.create({
      url: "https://github.com/yourusername/wingrid#readme",
    });
  });

  // Load stored data
  chrome.storage.local.get(["windowCount", "status"], (data) => {
    if (data.windowCount !== undefined) {
      windowCountEl.textContent = data.windowCount;
    }
    if (data.status) {
      statusEl.textContent = data.status;
    }
  });

  // Listen for updates from compositor
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local") {
      if (changes.windowCount) {
        windowCountEl.textContent = changes.windowCount.newValue;
      }
      if (changes.status) {
        statusEl.textContent = changes.status.newValue;
      }
    }
  });
});
