# PathSight — Final Hackathon Presentation & Demonstration Guide (PS-15)

## 1. Executive Summary & Problem Context
* **Project**: PathSight (PS-15: Assistive Navigation for Visually Impaired Students)
* **Target Audience**: College students and staff with visual impairments navigating university campuses.
* **Core Philosophy**: Honest assistive technology. PathSight does not fake indoor GPS or pretend to replace a white cane or guide dog. Instead, it pairs lightweight, local computer vision with a deterministic campus graph and acoustic voice assistance to offer situational awareness.

---

## 2. Timed 3-Minute Live Demo Script

| Time | Section | Action (What to Click / Show) | Spoken Script (Verbatim) |
| :--- | :--- | :--- | :--- |
| **0:00 - 0:25** | **The Problem** | Show landing screen with Header status. | *"Good morning judges. Navigating a college campus with visual impairment is fraught with sudden hurdles: temporary construction, misplaced chairs, or stairs that aren't marked on typical map apps. Standard GPS is useless indoors and cannot alert students to low-hanging or temporary physical obstacles in their immediate walkway."* |
| **0:25 - 0:50** | **PathSight Solution** | Point to brand logo and Safety Banner. | *"Meet PathSight: an accessible web prototype that bridges micro-level obstacle awareness with macro-level campus route planning. Before demonstrating, note our prominent safety disclosure: PathSight is strictly designed to augment sensory awareness—it is an assistive prototype that never replaces a student's white cane or guide dog."* |
| **0:50 - 1:15** | **Accessible Interface** | Click "High Contrast" button. Click "Preferences" (Alt+3). | *"We engineered this for accessibility first: one-click WCAG AAA yellow-on-black contrast, dynamic text scaling, oversized tactile touch targets exceeding 48px, and keyboard navigation shortcuts like Spacebar to scan, M to mute, and Alt+1, 2, 3 to switch workspaces."* |
| **1:15 - 1:45** | **Live AI Vision Detection** | Switch to Assist (Alt+1). Press Space to start camera. Hold a chair/backpack in center view. | *"I press Spacebar to activate vision. PathSight streams video frames to a local Python backend running a lightweight pretrained YOLOv8 model on CPU at 2 FPS. Notice the bounding box: it calculates the object's horizontal position—Left, Center, or Right—and visual proximity. Listen to the announcement."* [App speaks: 'Chair detected ahead.'] |
| **1:45 - 2:05** | **Voice Control & Debouncing** | Press 'M' to mute. Show bounding box still tracking. Unmute. | *"To prevent auditory fatigue, PathSight computes a unique scene signature and applies a 4.5-second debouncing window so the user isn't spammed every frame. Pressing 'M' mutes audio immediately while maintaining live visual tracking. Pressing 'Test Voice' triggers an instant audio check."* |
| **2:05 - 2:30** | **Campus Route Planning** | Switch to Navigate (Alt+2). Origin: Main Gate, Destination: Central Library. | *"Now let's plan a journey. PathSight stores a campus graph of 9 landmarks. We select Main Gate to Central Library with 'Require Step-Free / Graded Ramps Only' enabled. Clicking 'Plan Accessible Route' runs Dijkstra's algorithm. Notice it chooses the 195m accessible ramp, avoiding an 8-step flight of stairs."* |
| **2:30 - 2:50** | **Spoken Guidance & Progression** | Click 'Start Navigation Session'. Tap 'Confirm Arrival at Waypoint'. | *"We click Start Navigation. An acoustic earcon chimes, and Step 1 instructions are spoken. Rather than faking inaccurate indoor GPS, PathSight relies on student agency: tapping the large 'Confirm Arrival' button advances to Step 2 and updates the map target to Central Library."* |
| **2:50 - 3:00** | **Dynamic Obstacle Detour & Close** | Click 'Block: e_gate_admin'. | *"If a walkway undergoes emergency maintenance, a single report triggers instant dynamic Dijkstra rerouting around the blockage. PathSight demonstrates how modern AI and accessible design empower independent mobility. Thank you."* |

---

## 3. Technical Architecture Summary
* **Frontend**: React 19, TypeScript, Vite, Tailwind tokens, Web Audio API, Web Speech API (`SpeechSynthesis`).
* **Backend**: Python 3.13, FastAPI, Ultralytics YOLOv8n (CPU inference, ~40–75ms per frame).
* **Graph Routing**: Pure Python Dijkstra algorithm with preference weighting for tactile paving ($1.0\times$) vs non-tactile walkways ($1.15\times$) and boolean stair exclusion.
* **Testing**: 7 speech unit tests, 6 routing unit tests, 14 FastAPI integration test cases. Zero linter warnings, zero build errors.

