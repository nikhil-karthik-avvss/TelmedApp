# TelmedApp — Real-Time PPG Telemedicine Monitor

A mobile-first telemedicine app that measures **heart rate** and **SpO2** in real time using your phone's rear camera and flashlight — no external hardware needed.

---

## How it works

The app uses **Photoplethysmography (PPG)**: when a finger is pressed over the camera lens with the torch on, the camera detects tiny colour changes caused by blood pulsing through the capillaries. The backend extracts these signals and computes vitals.

- **Heart rate** — FFT peak detection on the red channel signal (42–210 BPM range)
- **SpO2** — Ratio-of-Ratios method using red and green channels
- **Finger placement guidance** — real-time feedback if the finger is off-centre or not covering the lens fully
- **Signal quality** — scored live based on finger coverage and motion

---

## Project structure

```
TelmedApp/
├── backend/               # Python FastAPI WebSocket server
│   ├── main.py            # WebSocket endpoint + alert builder
│   ├── ppg_processor.py   # Finger detection, placement check, PPG computation
│   └── requirements.txt
├── frontend/              # React + TypeScript + Vite app
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraCapture.tsx       # Camera feed + torch toggle
│   │   │   ├── SignalVisualization.tsx  # Live PPG chart
│   │   │   └── AlertDisplay.tsx         # Status alerts
│   │   ├── hooks/
│   │   │   └── useTelemedicine.ts       # WebSocket state management
│   │   ├── services/
│   │   │   └── api.ts                   # WebSocket client
│   │   └── types/
│   │       └── telemedicine.ts
│   └── package.json
└── finger-placement.ipynb  # Original finger placement prototype
```

---

## Getting started

### Requirements

- Python 3.9+
- Node.js 18+
- A smartphone on the same Wi-Fi network as your computer

---

### 1. Start the backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

### 2. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The dev server starts on **HTTPS** (port 5173) with a self-signed certificate so mobile browsers allow camera access.

---

### 3. Open on your phone

1. Find your computer's local IP (e.g. `192.168.1.10`)
2. Open `https://192.168.1.10:5173` in your phone's browser
3. Tap **Advanced → Proceed** to accept the self-signed certificate
4. Tap **Start Camera**, then **Start**

---

## Using the app

1. **Turn on the torch** — tap the ⚡ button (top-right of camera view)
2. **Cover the lens** — press your fingertip firmly over the rear camera
3. **Follow the guidance banner** — it tells you exactly how to adjust placement
4. **Wait ~5 seconds** — heart rate and SpO2 appear in the footer once enough signal is collected
5. The live PPG waveform shows the pulse signal in real time

---

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, Chart.js |
| Backend | Python, FastAPI, WebSocket, OpenCV, NumPy, SciPy |
| Signal processing | FFT (heart rate), Ratio-of-Ratios (SpO2), edge/corner analysis (placement) |
| Camera | `getUserMedia` API with `torch` constraint for flashlight control |

---

## Notes

- SpO2 values are **estimates** — camera-based PPG lacks an IR channel, so accuracy is lower than a medical pulse oximeter
- Works best in a dimly lit room with torch on
- Requires a browser that supports `getUserMedia` and the `torch` media constraint (Chrome on Android works well)
