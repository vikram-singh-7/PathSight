# PathSight — Frontend Web Application

The accessible web client for **PathSight (PS-15: Assistive Navigation for Visually Impaired Students)**, built with React 19, TypeScript, and Vite.

## Features
- **Live Camera Stream**: Integrates with `navigator.mediaDevices.getUserMedia` and captures throttled JPEG frames for YOLO inference.
- **Accessible Interfaces**: WCAG AAA High-Contrast Yellow on Black mode, font scaling, tactile touch targets ($\ge 48\text{px}$), and keyboard navigation (`Space`, `M`, `Alt+1/2/3`).
- **Web Speech & Earcons**: Browser-native text-to-speech with scene hash deduplication and Web Audio synthesized earcon cues.
- **Campus Route Planning**: Interactive SVG campus graph map and manual waypoint arrival confirmation.

## Quick Start
```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Run unit tests
npm test

# Type-check and lint
npm run lint
npm run build
```
