# WinGrid

**A Professional Multi-Window Aggregation and Projection Tool**

![Version](https://img.shields.io/badge/version-2.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)

English | [简体中文](README.zh-CN.md)

---

## 🎯 The Problem: Modern Multi-Tasking Complexity

In today's digital workspace, professionals face an increasingly complex challenge: **managing and presenting multiple application windows simultaneously**. Consider these real-world scenarios:

### **For Content Creators & Streamers**

You're live streaming a gaming session while monitoring chat, stream health metrics, and OBS controls across 4-6 different windows. Switching between them disrupts your flow, and your audience loses context when you're not showing the main content.

**The Pain**: Traditional screen sharing forces you to choose one window at a time or share your entire messy desktop, exposing personal information and creating an unprofessional viewing experience.

### **For Remote Educators & Trainers**

You're teaching a coding class and need to simultaneously display:

- Your code editor (VS Code)
- The running application output
- A terminal showing command execution
- Student questions in a chat window
- Your presentation slides

**The Pain**: Alt-tabbing between windows during live instruction creates confusion for students, breaks the teaching flow, and makes it nearly impossible to demonstrate real-time cause-and-effect relationships between different tools.

### **For Technical Presenters & Demonstrators**

You're demoing a complex system architecture that involves:

- A web application frontend
- API response logs
- Database query results
- System monitoring dashboards

**The Pain**: Your audience can't see the full picture. When you switch windows, they lose the context of how different components interact in real-time, making your demonstration less impactful and harder to follow.

### **For Workflow Monitoring & Dashboards**

You need to monitor multiple critical systems simultaneously:

- Server health metrics
- Application logs
- Customer support tickets
- Team communication channels

**The Pain**: Having to click through tabs and windows to check status creates monitoring blind spots and increases response time to critical issues.

---

## 💡 The Solution: WinGrid

**WinGrid solves the multi-window chaos by enabling you to aggregate, arrange, and project multiple windows in a single, coherent view.**

### What WinGrid Does

WinGrid is a desktop application that:

1. **Enumerates All Active Windows** - Automatically detects and lists all running application windows on your system with live thumbnails
2. **Flexible Layout Engine** - Arranges selected windows in professional layouts (Single, Dual, Triple, Quad grid)
3. **Real-Time Thumbnail Capture** - Displays live, high-quality previews of each window's content that update continuously
4. **One-Click Projection** - Publishes your multi-window layout to a dedicated projection window that you can share, present, or monitor
5. **Responsive & Adaptive** - Automatically adjusts window sizes and layouts to fit your presentation space optimally

### Key Features That Make It Work

- **🎨 Multiple Layout Modes**: Single focus, side-by-side dual, triple (2-top + 1-bottom), or quad grid (2×2)
- **🖼️ Live Window Thumbnails**: Real-time previews with high-quality capture (up to 1080p)
- **⚡ Smart Window Detection**: Automatically identifies and lists all capturable windows with app icons
- **🎬 Projection Mode**: Create a clean, dedicated projection window perfect for screen sharing or secondary displays
- **🎯 Drag & Drop Interface**: Intuitively arrange windows by dragging from the window list
- **🔄 Real-Time Updates**: Continuous thumbnail refreshes ensure your projected view always shows current content
- **🎨 Modern Theming**: Professional dark/light themes that look great in any presentation
- **⚙️ Responsive Design**: Layouts automatically adapt to sidebar width and container dimensions

---

## 🚀 Use Cases

### **1. Live Streaming & Content Creation**

Stream multiple game views, chat windows, and control panels simultaneously without desktop clutter.

### **2. Technical Training & Education**

Show code editor, terminal, running application, and reference materials side-by-side for seamless teaching flow.

### **3. Software Demonstrations**

Present complex multi-component systems with all parts visible simultaneously for maximum clarity.

### **4. System Monitoring & Operations**

Create custom monitoring dashboards combining windows from different applications.

### **5. Remote Collaboration**

Share a organized view of multiple work windows during video calls without exposing your entire desktop.

### **6. Multi-Application Workflows**

Keep related windows from different apps visible together for improved workflow efficiency.

---

## 🎓 Why WinGrid Matters

**Traditional screen sharing is a single-window trap.** Alt-tabbing breaks flow, confuses audiences, and hides critical context.

**WinGrid transforms multi-window management** from a chaotic juggling act into a professional, organized presentation. It's the difference between:

- ❌ "Wait, let me switch windows... where was that terminal again?"
- ✅ Seamlessly showing cause and effect across applications in real-time

- ❌ Choosing between showing your code OR the output
- ✅ Displaying both simultaneously in a clean, professional layout

- ❌ Exposing your messy desktop full of personal windows
- ✅ Projecting only the windows that matter in a curated layout

**For professionals who present, teach, stream, or monitor complex systems, WinGrid is not just convenient—it's essential.**

---

## 📦 Quick Setup

## 🛫 Quick Setup

```sh
# clone the project
git clone https://github.com/electron-vite/electron-vite-react.git

# enter the project directory
cd electron-vite-react

# install dependency
npm install

# develop
npm run dev
```

## 🐞 Debug

![electron-vite-react-debug.gif](/electron-vite-react-debug.gif)

## 📂 Directory structure

Familiar React application structure, just with `electron` folder on the top :wink:  
_Files in this folder will be separated from your React application and built into `dist-electron`_

```tree
├── electron                                 Electron-related code
│   ├── main                                 Main-process source code
│   └── preload                              Preload-scripts source code
│
├── release                                  Generated after production build, contains executables
│   └── {version}
│       ├── {os}-{os_arch}                   Contains unpacked application executable
│       └── {app_name}_{version}.{ext}       Installer for the application
│
├── public                                   Static assets
└── src                                      Renderer source code, your React application
```

<!--
## 🚨 Be aware

This template integrates Node.js API to the renderer process by default. If you want to follow **Electron Security Concerns** you might want to disable this feature. You will have to expose needed API by yourself.

To get started, remove the option as shown below. This will [modify the Vite configuration and disable this feature](https://github.com/electron-vite/vite-plugin-electron-renderer#config-presets-opinionated).

```diff
# vite.config.ts

export default {
  plugins: [
    ...
-   // Use Node.js API in the Renderer-process
-   renderer({
-     nodeIntegration: true,
-   }),
    ...
  ],
}
```
-->

## 🔧 Additional features

1. electron-updater 👉 [see docs](src/components/update/README.md)
1. playwright

## ❔ FAQ

- [C/C++ addons, Node.js modules - Pre-Bundling](https://github.com/electron-vite/vite-plugin-electron-renderer#dependency-pre-bundling)
- [dependencies vs devDependencies](https://github.com/electron-vite/vite-plugin-electron-renderer#dependencies-vs-devdependencies)
