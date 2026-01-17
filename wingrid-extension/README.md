# WinGrid Browser Extension

A browser extension for capturing and compositing multiple windows into a shareable grid layout for streaming and presentations.

## Features

✅ **Multi-Window Capture** - Capture any application window using native screen share API
✅ **Grid Layouts** - 1x1, 2x1, 1x2, 2x2, 3x1 layout options
✅ **Live Compositing** - Real-time canvas rendering at 30-60 FPS
✅ **Theme System** - 5 beautiful themes (Cosmic Blue, Matrix Green, Violet Purple, Sunset Orange, Midnight Black)
✅ **Quality Controls** - Adjustable frame rate and resolution
✅ **Share-Ready** - Composite stream can be shared to Zoom, Teams, Google Meet
✅ **Clean UI** - Inspired by SpaceDesk and modern design principles

## Installation

### Chrome/Edge (Developer Mode)

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `wingrid-extension` folder
5. The extension icon will appear in your toolbar

### Usage

1. **Click the extension icon** to open the popup
2. **Click "Open Compositor"** to launch the main interface
3. **Click "Add Window"** to capture windows:
   - Browser will show OS window picker
   - Select any application window
   - Window will be added to your grid
4. **Toggle "ON"** to start compositing
5. **Click "Share Composite"** for instructions on sharing

### Sharing to Meeting Apps

When you want to share your composite:

1. In Zoom/Meet/Teams, click "Share Screen"
2. Select the **"WinGrid Compositor" tab**
3. Your composite grid will be shared

## File Structure

```
wingrid-extension/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.css             # Popup styles
├── popup.js              # Popup logic
├── compositor.html       # Main compositor page
├── compositor.css        # Compositor styles
├── compositor.js         # Core compositing logic
├── icons/                # Extension icons
└── README.md            # This file
```

## Key Technologies

- **Screen Capture API** (`navigator.mediaDevices.getDisplayMedia`)
- **Canvas API** (for video compositing)
- **Chrome Storage API** (for settings persistence)
- **Canvas Stream API** (`canvas.captureStream`)

## Layouts

- **Single (1x1)** - Full screen single window
- **Side by Side (2x1)** - Two windows horizontally
- **Top & Bottom (1x2)** - Two windows vertically
- **Quad (2x2)** - Four window grid (default)
- **Triple (3x1)** - Three windows horizontally

## Settings

### Video Quality

- **Frame Rate**: 30 FPS or 60 FPS
- **Resolution**: 720p, 1080p, or 1440p

### Themes

- Cosmic Blue
- Matrix Green
- Violet Purple
- Sunset Orange
- Midnight Black

## Limitations

- User must manually select each window (browser security)
- Maximum 4 windows recommended for performance
- Requires user permission for each capture
- Cannot enumerate windows automatically

## Browser Compatibility

- ✅ Chrome 91+
- ✅ Edge 91+
- ✅ Opera 77+
- ⚠️ Firefox (limited - some features may not work)
- ❌ Safari (Screen Capture API not supported)

## Development

To modify the extension:

1. Edit files in the extension folder
2. Go to `chrome://extensions/`
3. Click the refresh icon on the WinGrid extension
4. Reload the compositor tab to see changes

## Comparison to Electron App

| Feature       | Extension  | Electron App |
| ------------- | ---------- | ------------ |
| Installation  | ⭐⭐⭐⭐⭐ | ⭐⭐         |
| Window Access | Manual     | Automatic    |
| Performance   | ⭐⭐⭐     | ⭐⭐⭐⭐     |
| Sharing       | Native     | Custom       |

## License

MIT License - Feel free to use and modify!

## Contributing

Contributions welcome! Please feel free to submit pull requests.

---

Built with ❤️ for streamers, educators, and remote workers
