# PathSight — Assistive Navigation for Visually Impaired Students

**Hackathon Problem Statement**: PS-15 (Assistive Navigation for Visually Impaired Students)  
**Project Name**: PathSight  
**System Architecture**: Standalone Hybrid (React 19 + TypeScript Frontend · FastAPI + YOLOv8n Python Backend)

---

## ⚠️ Important Safety & Ethical Disclosure

PathSight is an assistive technology prototype built for evaluation in a college hackathon.
- **Not a Primary Mobility Substitute**: PathSight does **not** replace a white cane, a trained guide dog, or personal mobility assistance. Visually impaired users must continue to rely on primary physical mobility tools for tactile path confirmation.
- **Visual Approximations**: Detected bounding boxes and spatial proximity labels represent 2D camera pixel coverage, **not** calibrated metric depth or guaranteed physical collision avoidance.
- **Sample Campus Data**: All campus landmarks, walkways, widths, and coordinates provided in this repository are simulated sample data for prototype demonstration. They have not been surveyed by geospatial authorities.
- **Manual Waypoint Progression**: The system does not claim automatic arrival detection or real-time indoor GPS tracking. Position advancement is confirmed manually by user agency.

---

## 1. Problem Statement & Project Overview

### The Problem
College campuses are dynamic and unpredictable environments. Visually impaired students frequently encounter:
1. **Micro-Level Obstacles**: Misplaced chairs, backpacks, pedestrians, low-hanging tree branches, and temporary maintenance barriers that standard white canes can only detect at ground level when already in close contact.
2. **Macro-Level Routing Barriers**: Commercial GPS services (e.g., Google Maps) fail indoors, cannot reliably detect multi-floor building transitions, and often route students across flights of stairs rather than step-free accessible ramps.
3. **Auditory Fatigue**: Existing computer vision tools frequently overwhelm users with nonstop, repetitive spoken feedback on every camera frame, degrading acoustic awareness of real-world ambient sounds.

### The PathSight Solution
PathSight unites micro-obstacle computer vision with macro-level campus pathfinding in a single accessible web application:
- **Real-Time Obstacle Detection**: A lightweight, pretrained YOLOv8 model runs locally on CPU, classifying object types, horizontal field-of-view sectors (Left, Ahead, Right), and visual proximity.
- **Intelligent Spoken Guidance**: Native browser speech synthesis converts verified detections into concise phrases, debounced by scene hashing to eliminate repetitive audio spam.
- **Step-Free Campus Routing**: A weighted graph routing engine powered by Dijkstra's algorithm favors tactile paving, excludes stairs when accessible mode is enabled, and dynamically detours around reported pathway blockages.

---

## 2. Implemented Features

### Computer Vision & Hazard Awareness
- **Live Video Streaming**: Direct browser webcam integration via the `MediaDevices.getUserMedia` API.
- **Normalized Bounding Boxes**: Visual overlays scaled to the camera aspect ratio with spatial sector dividers (Left, Center Ahead, Right).
- **Proximity Footprint Classification**: Categorizes detected objects as `approaching`, `nearby`, or `distant` based on bounding-box visual area and vertical coverage.
- **Hazard Prioritization**: High-priority obstruction classes (people, chairs, tables, bicycles, backpacks) are elevated above background objects.
- **Inference Throttling**: Frame transmission throttled to 2 FPS ($500\text{ms}$ interval) to prevent UI blocking and eliminate CPU thermal throttling.

### Voice & Acoustic Assistance
- **Zero-Cloud Text-to-Speech**: Uses the browser's native `window.speechSynthesis` API without external paid API keys or network latency.
- **Synthesized Audio Earcons**: Web Audio API generates three distinct acoustic cues:
  - *Turn Ping* ($520\text{Hz} \rightarrow 659\text{Hz}$) for navigation waypoint transitions.
  - *Warning Tone* ($440\text{Hz} \rightarrow 880\text{Hz}$) for urgent physical hazards.
  - *Arrival Melodic Triad* ($440\text{Hz} \rightarrow 554\text{Hz} \rightarrow 659\text{Hz}$) upon reaching destination.
- **Scene Signature Debouncing**: Computes a deterministic hash of visible objects. Suppresses identical audio for 4.5 seconds unless an urgent hazard is detected.
- **One-Touch Audio Controls**: Instant mute toggle (`M`), speech rate adjustment ($0.8\times - 1.5\times$), and a dedicated "Test Voice" diagnostic phrase.

### Campus Route Planning & Navigation
- **Small Campus Graph**: 9 configurable sample landmarks and 14 connecting walkways stored in a modular JSON file.
- **Dijkstra Shortest-Path Engine**: Pure Python algorithm with tactile paving preference weights ($1.0\times$ vs $1.15\times$ penalty for standard paths).
- **Accessible Step-Free Filter**: Option to strictly avoid stairs and favor graded ramps (e.g., selects a 195m accessible ramp over a 160m flight of 8 stairs).
- **Turn-by-Turn Spoken Itinerary**: Generates natural language instructions with directional orientation and landmarks.
- **Manual Waypoint Progression**: Large tactile button ($\ge 56\text{px}$) allowing students to confirm waypoint arrival at their own pace.
- **Dynamic Obstacle Detours**: Walkway blockage reporting (`POST /api/campus/obstacles`) immediately triggers Dijkstra rerouting.

### Accessibility & UX
- **Dual Visual Themes**: Standard dark-navy theme and a WCAG AAA compliant High-Contrast theme (Yellow `#facc15` on Pure Black `#000000`).
- **Typography Scaling**: Font size adjustable across Standard ($100\%$), Large ($120\%$), and Extra Large ($140\%$).
- **Keyboard Shortcuts**: Complete operation without mouse interaction (`Space`, `M`, `Alt+1`, `Alt+2`, `Alt+3`).
- **Screen Reader Support**: ARIA live regions (`role="status"`, `aria-live="polite"`), descriptive button labels, and semantic HTML5 landmark tags.

---

## 3. Technology Stack

| Layer | Technologies | Purpose |
| :--- | :--- | :--- |
| **Frontend UI** | React 19, TypeScript, Vite | Accessible UI components, state coordination, and rapid rendering |
| **Styling & Theme** | Custom CSS design tokens, Flexbox / Grid | WCAG AAA contrast modes, responsive desktop/tablet/mobile layouts |
| **Camera & Video** | Browser `MediaDevices` API, HTML5 Canvas | Camera capture, downscaling to $480\times 360$ JPEG |
| **Voice & Audio** | Web Speech API, Web Audio API | Speech synthesis, synthesized acoustic earcon frequencies |
| **Backend API** | Python 3.13, FastAPI, Uvicorn | REST endpoints for health checks, model status, vision, and routing |
| **Computer Vision** | Ultralytics YOLOv8n (`yolov8n.pt`), PyTorch | Local CPU object detection across 80 COCO classes |
| **Image Processing** | Pillow (PIL), OpenCV (headless) | Base64 frame decoding and array conversions |
| **Routing Algorithm** | Pure Python (`heapq`, Dijkstra) | Weighted shortest-path computation with accessibility constraints |

---

## 4. Project Directory Structure

```
d:\Test\
├── README.md                           # Main project documentation and setup guide
├── HACKATHON_DEMO_GUIDE.md             # 3-minute pitch script, slide outline, and judge Q&A
│
├── backend\                            # FastAPI Python Backend
│   ├── requirements.txt                # Python package dependencies
│   ├── .env.example                    # Sample environment variables
│   ├── .env                            # Local backend environment configuration
│   ├── yolov8n.pt                      # Pretrained YOLOv8 nano model weights (~6.2 MB)
│   ├── app\
│   │   ├── __init__.py
│   │   ├── config.py                   # Pydantic settings (host, port, CORS origins)
│   │   ├── main.py                     # FastAPI application setup and REST endpoint routes
│   │   ├── data\
│   │   │   └── campus_map.json         # Configurable campus graph (9 nodes, 14 edges)
│   │   ├── models\
│   │   │   ├── __init__.py
│   │   │   ├── schemas.py              # Pydantic request/response schemas
│   │   │   └── yolov8n.pt              # Cached weights for vision service
│   │   └── services\
│   │       ├── __init__.py
│   │       ├── graph_service.py        # Dijkstra algorithm, accessibility filtering, detours
│   │       └── vision_service.py       # YOLOv8 CPU inference, spatial FOV, proximity
│   └── tests\
│       ├── test_routing.py             # Unit tests for Dijkstra and accessibility rules
│       └── test_api_integration.py     # End-to-end integration tests for all 14 API endpoints
│
└── frontend\                           # React + TypeScript + Vite Frontend
    ├── package.json                    # Node dependencies and scripts
    ├── tsconfig.json                   # TypeScript project configuration
    ├── vite.config.ts                  # Vite build configuration
    ├── index.html                      # HTML entrypoint
    ├── .env.example                    # Frontend environment variable template
    ├── .env                            # Local frontend environment configuration
    ├── src\
    │   ├── main.tsx                    # React application root mount
    │   ├── App.tsx                     # Main state container coordinating vision, voice & route
    │   ├── App.css                     # Responsive layout and mobile tab styling
    │   ├── index.css                   # Accessibility focus rings, root typography, scrollbars
    │   ├── components\
    │   │   ├── CameraView.tsx          # Video viewport, bounding-box overlay, tactile controls
    │   │   ├── RoutePlanner.tsx        # Waypoint selector, accessibility filter, progression
    │   │   ├── CampusMapCanvas.tsx     # High-contrast interactive SVG campus map
    │   │   ├── Header.tsx              # System status badges (Camera, AI Vision, Voice)
    │   │   ├── NavigationSidebar.tsx   # Workspace switcher (Assist, Route, Preferences)
    │   │   ├── ObservationFeed.tsx     # Chronological log of spoken vision/route observations
    │   │   ├── SettingsPanel.tsx       # Text scaling, speech rate, and high-contrast toggle
    │   │   └── SafetyBanner.tsx        # Expandable responsible AI disclaimer banner
    │   ├── hooks\
    │   │   ├── useCamera.ts            # Camera lifecycle, stream cleanup, frame capture
    │   │   ├── useSpeech.ts            # Speech synthesis, queue cancellation, earcon audio
    │   │   └── useBackendHealth.ts     # Heartbeat polling for backend and model readiness
    │   ├── services\
    │   │   └── api.ts                  # Fetch API client with AbortController timeouts
    │   ├── types\
    │   │   └── index.ts                # TypeScript interfaces (Node, Edge, Route, Detection)
    │   └── utils\
    │       ├── constants.ts            # Default API URLs and thresholds
    │       ├── speechFormatter.ts      # Translates YOLO boxes into concise directional phrases
    │       └── theme.ts                # Color tokens for standard and high-contrast themes
    └── tests\
        └── speech.test.ts              # Unit tests for directional phrasing and deduplication
```

---

## 5. Subsystem Details

### 1. Computer Vision & Object Detection
1. **Frame Capture**: When Vision Assistance is started, `useCamera` captures the `<video>` element frame to an offscreen HTML5 canvas, downscaling it to $480\times 360$ pixels and encoding it as a JPEG data URL.
2. **Frame Transmission**: `detectFrame` transmits the base64 payload to `POST /api/detect` at a throttled rate of 2 FPS.
3. **Inference**: In `vision_service.py`, the image is decoded and passed to Ultralytics YOLOv8n running with `imgsz=416` on CPU.
4. **Spatial Mapping**:
   - $X_{\text{center}} < 0.36 \rightarrow$ `left`
   - $0.36 \le X_{\text{center}} \le 0.64 \rightarrow$ `center` (ahead)
   - $X_{\text{center}} > 0.64 \rightarrow$ `right`
5. **Visual Proximity**:
   - $\text{Box Area} > 0.22$ or $\text{Box Height} > 0.55 \rightarrow$ `approaching`
   - $\text{Box Area} > 0.08$ or $\text{Box Height} > 0.28 \rightarrow$ `nearby`
   - Otherwise $\rightarrow$ `distant`

### 2. Voice Assistance & Speech Synthesis
1. **Natural Language Formatting**: `speechFormatter.ts` prioritizes centered, approaching obstacles and outputs concise phrasing (e.g., *"Person detected ahead"* or *"Chair detected on the left"*).
2. **Deduplication Signature**: A string hash representing `label:position:proximity` is maintained. If the signature matches the previous utterance within a 4.5-second window, speech is suppressed to avoid repetition.
3. **Queue Management**: `window.speechSynthesis.cancel()` is called before each utterance to prevent audio queue lag.
4. **Earcons**: Web Audio API oscillators synthesize short acoustic cues without downloading audio files.

### 3. Campus Route Planning & Dijkstra Algorithm
1. **Graph Representation**: Landmarks are nodes with $(X, Y)$ coordinate metadata; walkways are edges with physical distance, surface type, tactile paving, and stair attributes.
2. **Cost Function**:
   $$\text{Weight} = \text{distance\_meters} \times (\text{tactile\_preference\_multiplier})$$
   *(Tactile paving $= 1.0\times$; standard non-tactile path $= 1.15\times$).*
3. **Accessibility Filtering**: When `accessible_only=True`, any edge with `has_stairs=True` is skipped. If no step-free path exists, it falls back to the standard path with a spoken caution.
4. **Dynamic Rerouting**: If a pathway is reported blocked, Dijkstra automatically computes an alternate detour around the obstruction.
5. **Distance Reporting**: The physical distance sum is computed independently of preference multipliers, ensuring true distance in meters is reported.

---

## 6. Fresh Machine Installation & Startup (Windows)

### Prerequisites
- **Node.js**: v18.0.0 or v22.0.0+ ([nodejs.org](https://nodejs.org/))
- **Python**: v3.10, v3.11, v3.12, or v3.13 ([python.org](https://www.python.org/))
- **Windows PowerShell**

---

### Step 1: Backend Setup
Open a new PowerShell terminal:

```powershell
# Navigate to the backend directory
Set-Location d:\Test\backend

# Create a virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Verify model weights:
# Pretrained yolov8n.pt is pre-cached in d:\Test\backend\app\models\yolov8n.pt
```

#### Launch the Backend Server:
```powershell
# Run Uvicorn server from the backend directory
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
*Verify: Open `http://127.0.0.1:8000/health` in your browser. It should return `{"status":"ok"}`.*

---

### Step 2: Frontend Setup
Open a second PowerShell terminal:

```powershell
# Navigate to the frontend directory
Set-Location d:\Test\frontend

# Install npm packages
npm install

# Launch Vite development server
npm run dev
```
*Verify: Open `http://localhost:5173/` in Google Chrome or Microsoft Edge.*

---

## 7. Running Automated Verification Tests

All test suites run locally without internet access:

### 1. Frontend Speech & Formatting Unit Tests
```powershell
Set-Location d:\Test\frontend
npm test
```
*Executes `frontend/tests/speech.test.ts` via Node.js with 7 assertions verifying spatial phrases, multi-object counts, urgent alerts, and deduplication signatures.*

### 2. Backend Dijkstra Routing Unit Tests
```powershell
Set-Location d:\Test\backend
.\venv\Scripts\python.exe tests/test_routing.py
```
*Verifies 6 test cases: valid accessible routes, step-free ramp selection over stairs, identical start/goal nodes, invalid node handling, dynamic detour calculation, and reverse path guidance.*

### 3. Backend Full API Integration Tests
```powershell
Set-Location d:\Test\backend
.\venv\Scripts\python.exe tests/test_api_integration.py
```
*Tests all 14 FastAPI REST endpoints end-to-end, including image detection payloads, missing image error handling (HTTP 400), node retrieval, edge retrieval, routing, and obstacle blocking (HTTP 404 for invalid edge).*

### 4. Code Quality & Build Checks
```powershell
Set-Location d:\Test\frontend
npm run lint    # Runs oxlint across all TypeScript files
npm run build   # Type checks with tsc -b and bundles with Vite
```

---

## 8. Keyboard Shortcuts

| Shortcut | Action | Description |
| :---: | :--- | :--- |
| **Spacebar** | **Toggle Vision Assistance** | Starts or pauses camera frame capture and voice detection |
| **M** | **Mute / Unmute Voice** | Toggles voice synthesis while keeping visual detection active |
| **Alt + 1** | **Assist Workspace** | Opens live camera preview, bounding boxes, and observation log |
| **Alt + 2** | **Campus Route Workspace** | Opens campus route planner, accessibility filters, and SVG map |
| **Alt + 3** | **Preferences Workspace** | Opens font scaling, speech rate, and high-contrast settings |

---

## 9. Known Limitations

1. **2D Bounding Boxes vs Calibrated Metric Depth**: Bounding boxes provide 2D pixel area and vertical visual coverage. They do not calculate millimeter-precise physical distance or guarantee safe clearance.
2. **Sample Campus Data**: The 9 landmarks and 14 walkways in `campus_map.json` are simulated sample coordinates for demonstration. They must be surveyed before real-world deployment.
3. **Manual Waypoint Progression**: The system does not pretend to have real-time indoor GPS. Position advancement relies on the user pressing the "Confirm Arrival at Waypoint" button.
4. **Lighting & Occlusion Inaccuracies**: Computer vision performance depends on ambient lighting. Severe backlighting or dark hallways can cause false negatives or misclassifications.
5. **Single-Floor Campus Topology**: The sample graph represents ground-level campus paths and graded ramps. Multi-story building navigation (elevators/stairwells) is not modeled.
6. **Browser Permission Requirements**: MediaDevices camera access and Web Speech API audio output require standard browser permission prompts.

---

## 10. Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **Camera Permission Denied** | Browser blocked camera access | Click the camera/lock icon in the browser address bar, set Camera to "Allow", and click "Retry Camera". |
| **Camera Hardware Error** | Another application (Zoom, Teams) is using the webcam | Close the conflicting app, refresh the page, and press Spacebar to reactivate. |
| **Vision Backend Disconnected** | FastAPI server is stopped or port 8000 is occupied | Verify Terminal 1 is running `uvicorn app.main:app`. Check `http://127.0.0.1:8000/health`. Click "Retry Connection" in the UI banner. |
| **Speech Audio is Silent** | System volume muted or browser autoplay policy blocked audio | Click anywhere on the webpage or click "Test Voice" in the header to activate browser audio. Ensure speech status in header does not say `Voice: Muted`. |
| **Vite Port Conflict** | Port 5173 is already in use by another instance | Vite will automatically suggest port 5174. Open the URL shown in your terminal. |
| **Model Weight Not Found** | Model file missing from models folder | Confirm `yolov8n.pt` is present in `d:\Test\backend\app\models\yolov8n.pt`. The backend automatically checks both `app/models/` and root `backend/`. |
