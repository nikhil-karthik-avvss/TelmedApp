# Telemedicine PPG Monitor

A full-stack telemedicine application for real-time photoplethysmography (PPG) monitoring using camera-based signal detection.

## Features

### Frontend (React - Mobile-First)
- **Live Camera Feed**: Real-time video capture with permission handling
- **PPG Signal Visualization**: Real-time waveform graph with quality metrics
- **Intelligent Alerts**: Context-aware status messages including:
  - Over-illumination detection
  - Under-illumination detection
  - Finger misplacement warnings
  - Motion detection alerts
- **Responsive Design**: Optimized for mobile devices and clinical settings
- **Touch-Friendly UI**: Large buttons and clear visual feedback

### Backend (Supabase Edge Functions)
- **Signal Processing API**: Processes video-derived metrics
- **Heuristic Analysis**: Illumination and motion quality checks
- **Real-time Feedback**: Returns alerts and signal quality scores

### Signal Processing Architecture
- **PPG Extraction**: Extracts green channel intensity from video frames
- **Signal Smoothing**: Moving average filter for noise reduction
- **Motion Detection**: Frame-to-frame difference analysis
- **Quality Metrics**: Real-time signal quality assessment

## Architecture

```
┌─────────────────┐
│   React App     │
│   (Frontend)    │
└────────┬────────┘
         │
         │ Camera Frames
         ▼
┌─────────────────┐
│ Signal Processor│
│   (Client-side) │
└────────┬────────┘
         │
         │ Raw Metrics
         ▼
┌─────────────────┐
│  Edge Function  │
│   (Backend)     │
└────────┬────────┘
         │
         │ Alerts & Quality
         ▼
┌─────────────────┐
│  UI Components  │
└─────────────────┘
```

## Component Structure

### Core Components

1. **CameraCapture** (`src/components/CameraCapture.tsx`)
   - Handles camera permission requests
   - Displays live video feed
   - Captures frames for analysis
   - Error handling for camera issues

2. **SignalVisualization** (`src/components/SignalVisualization.tsx`)
   - Real-time PPG waveform chart
   - Signal quality indicator
   - Statistical metrics display

3. **AlertDisplay** (`src/components/AlertDisplay.tsx`)
   - Color-coded alert messages
   - Timestamp tracking
   - Alert history

### Signal Processing

**SignalProcessor** (`src/utils/signalProcessing.ts`)

Placeholder functions for future implementation:
- `extractRawMetrics()`: Analyzes video frame RGB channels
- `extractPPGSignal()`: Isolates PPG signal from green channel
- `smoothSignal()`: Applies moving average filter
- `filterSignal()`: Placeholder for advanced filtering
- `calculateMotion()`: Detects frame-to-frame changes
- `detectHeartRate()`: Placeholder for heart rate calculation

### Backend API

**Edge Function** (`supabase/functions/process-signal/index.ts`)

Processes signal metrics and generates alerts based on:
- Illumination levels (50-200 optimal range)
- Motion score thresholds
- Green channel finger placement detection

## Usage

### Starting the Application

1. Click the **Start** button to begin monitoring
2. Allow camera access when prompted
3. Position your finger over the camera lens
4. Monitor the real-time PPG signal and alerts

### Reading the Interface

**Live Video Feed**
- Shows real-time camera output
- Red "LIVE" indicator when monitoring is active

**PPG Signal Graph**
- Red waveform shows real-time signal
- Quality indicator (Excellent/Fair/Poor)
- Current value and statistics

**Status Alerts**
- Color-coded messages (red=error, yellow=warning, green=success)
- Timestamped for tracking
- Shows most recent 5 alerts

**Footer Metrics**
- Status: Active/Inactive
- Data Points: Total samples collected
- Alerts: Total alert count
- Quality: Overall signal quality percentage

## Future Enhancement Opportunities

### Signal Processing
- Implement advanced filtering (bandpass, Butterworth, etc.)
- Add heart rate detection algorithm
- Implement SpO2 estimation
- Add respiratory rate detection

### Machine Learning
- Train models for improved motion detection
- Automated finger placement detection
- Arrhythmia detection

### Clinical Features
- Session recording and playback
- Export data for analysis
- Integration with EMR systems
- Multi-patient monitoring dashboard

### Performance Optimization
- WebAssembly for signal processing
- GPU acceleration for video analysis
- Adaptive frame rate based on device capability

## Technical Details

### Dependencies
- React 18.3.1
- Chart.js & react-chartjs-2 for visualization
- Lucide React for icons
- Tailwind CSS for styling
- Supabase for backend

### Browser Requirements
- Modern browser with WebRTC support
- Camera access permission
- Recommended: Chrome, Safari, or Edge (latest versions)

### Mobile Optimization
- Touch-friendly buttons (min 44x44px)
- Responsive breakpoints
- Optimized for portrait orientation
- Reduced motion for accessibility

## Development

### Local Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run typecheck
```

## Security & Privacy

- All processing happens locally or through secure edge functions
- No video data is stored
- Camera stream is only active when monitoring
- Camera permission can be revoked at any time

## License

MIT
