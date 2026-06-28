# Device Preview
See how any website looks across phone, tablet, and desktop — without opening DevTools or resizing the window.

---

## Live Demo
_Coming soon_

---

## Features
- Paste any URL — load it inside a real device-sized frame
- 3 categories with 10 ready-made devices (iPhone 15 Pro, iPad Pro, Full HD, and more)
- Rotate phones & tablets between portrait and landscape
- Smart auto-fit that always keeps the device visible
- Manual zoom slider (20% – 100%)
- One-click reload and open-in-new-tab
- Apple-style device chrome — phone notch, tablet camera, desktop traffic lights
- Subtle X-Frame-Options hint when a site blocks embedding
- 100% client-side — your URLs never leave the browser
- Keyboard-friendly (Enter to load, focus rings everywhere)

---

## Tech Stack
- React 19 (Vite 5)
- Pure CSS with custom properties — Apple-inspired dark UI, no framework
- Inline SVG icons (no icon library)
- Zero runtime dependencies beyond React

---

## How It Works
1. Paste a URL (we add `https://` automatically if you skip it)
2. Pick a device category — Mobile, Tablet, or Desktop
3. Choose a specific model from the dropdown
4. Rotate, zoom, or let auto-fit do the work
5. Hit Reload to refresh the embedded view

> Everything runs entirely in your browser. No proxy, no server, no logging.

---

## Installation
```bash
git clone https://github.com/berkinyilmaz/device-preview.git
cd device-preview
npm install
npm run dev
```

---

## Privacy
Everything runs **locally in your browser**. The website you preview is fetched directly by your browser inside a sandboxed iframe — nothing is routed through us.

---

## About The Build Log
This is **Part 1** of *The Build Log* series — small, focused web tools shipped one at a time.
