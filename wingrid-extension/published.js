// Published window - Simple display showing instruction

const canvas = document.getElementById("publishedCanvas");
const ctx = canvas.getContext("2d");

// Close button
document.getElementById("closeBtn").addEventListener("click", () => {
  window.close();
});

// Set canvas size
chrome.storage.local.get(["resolution"], (data) => {
  if (data.resolution) {
    const [width, height] = data.resolution.split("x").map(Number);
    canvas.width = width;
    canvas.height = height;
  } else {
    canvas.width = 1920;
    canvas.height = 1080;
  }

  showInstructions();
});

function showInstructions() {
  // Dark background
  ctx.fillStyle = "#0a0a0f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "WinGrid Published Window",
    canvas.width / 2,
    canvas.height / 2 - 100
  );

  // Instructions
  ctx.font = "32px sans-serif";
  ctx.fillStyle = "#a0a0a0";
  ctx.fillText(
    "To share this composite in your meeting:",
    canvas.width / 2,
    canvas.height / 2
  );

  ctx.font = "28px sans-serif";
  ctx.fillStyle = "#808080";
  ctx.fillText(
    "1. Go to your video call (Zoom, Teams, Meet, etc.)",
    canvas.width / 2,
    canvas.height / 2 + 60
  );
  ctx.fillText(
    "2. Click 'Share Screen' or 'Share Window'",
    canvas.width / 2,
    canvas.height / 2 + 100
  );
  ctx.fillText(
    "3. Select this 'WinGrid Published Window'",
    canvas.width / 2,
    canvas.height / 2 + 140
  );

  // Footer
  ctx.font = "24px sans-serif";
  ctx.fillStyle = "#606060";
  ctx.fillText(
    "Your captured windows will be composited here",
    canvas.width / 2,
    canvas.height / 2 + 220
  );

  // Note about browser limitation
  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#ff6b6b";
  ctx.fillText(
    "⚠ Browser extensions cannot pass live video streams between windows",
    canvas.width / 2,
    canvas.height - 80
  );
  ctx.fillStyle = "#606060";
  ctx.fillText(
    "Use the desktop app for automatic live compositing",
    canvas.width / 2,
    canvas.height - 40
  );
}

// Clean up on close
window.addEventListener("beforeunload", () => {
  chrome.storage.local.set({ isPublishing: false });
});
window.addEventListener("beforeunload", () => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
});
