import { useState, useCallback, useRef, useEffect } from 'react';
import { SignalData, AlertMessage, ProcessingResult } from '../types/telemedicine';
import { PPGWebSocket } from '../services/api';

const SEND_INTERVAL_MS = 100; // ~10 fps to backend

export function useTelemedicine() {
  const [isActive, setIsActive]           = useState(false);
  const [signalData, setSignalData]       = useState<SignalData[]>([]);
  const [alerts, setAlerts]               = useState<AlertMessage[]>([]);
  const [signalQuality, setSignalQuality] = useState(0);
  const [heartRate, setHeartRate]         = useState<number | null>(null);
  const [spo2, setSpo2]                   = useState<number | null>(null);
  const [fingerPresent, setFingerPresent] = useState(false);
  const [placementOk, setPlacementOk]     = useState(false);
  const [placementMsg, setPlacementMsg]   = useState<string>('');

  const ws            = useRef(PPGWebSocket.getInstance());
  const encodeCanvas  = useRef<HTMLCanvasElement | null>(null);
  const lastSendRef   = useRef<number>(0);
  const isActiveRef   = useRef(false);

  // keep ref in sync so the callback closure always sees latest value
  useEffect(() => { isActiveRef.current = isActive; }, [isActive]);

  // ── WebSocket lifecycle ──────────────────────────────────────────────
  useEffect(() => {
    if (!isActive) {
      ws.current.disconnect();
      return;
    }

    ws.current.connect((result: ProcessingResult) => {
      // PPG signal point
      if (result.ppgValue !== undefined) {
        setSignalData(prev => [
          ...prev,
          { timestamp: Date.now(), value: result.ppgValue! },
        ].slice(-300)); // keep last 300 points
      }

      setSignalQuality(result.signalQuality ?? 0);

      if (result.heartRate !== undefined && result.heartRate !== null) {
        setHeartRate(result.heartRate);
      }
      if (result.spo2 !== undefined && result.spo2 !== null) {
        setSpo2(result.spo2);
      }
      if (result.fingerPresent !== undefined) setFingerPresent(result.fingerPresent);
      if (result.placementOk   !== undefined) setPlacementOk(result.placementOk);
      if (result.placementMsg  !== undefined) setPlacementMsg(result.placementMsg ?? '');

      // Only forward non-success / non-info placement alerts to avoid flooding
      if (result.alerts && result.alerts.length > 0) {
        const filtered = result.alerts.filter(
          a => a.type === 'warning' || a.type === 'error'
        );
        if (filtered.length > 0) {
          setAlerts(prev => [...prev, ...filtered].slice(-20));
        }
      }
    });
  }, [isActive]);

  // ── frame handler (called by CameraCapture at ~30 fps) ──────────────
  const handleFrameCapture = useCallback((imageData: ImageData) => {
    if (!isActiveRef.current) return;

    const now = Date.now();
    if (now - lastSendRef.current < SEND_INTERVAL_MS) return;
    lastSendRef.current = now;

    // encode ImageData → JPEG base64 via a reused offscreen canvas
    if (!encodeCanvas.current) {
      encodeCanvas.current = document.createElement('canvas');
    }
    const canvas = encodeCanvas.current;
    canvas.width  = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.putImageData(imageData, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.7);
    ws.current.send(base64);
  }, []);

  // ── controls ─────────────────────────────────────────────────────────
  const startMonitoring = useCallback(() => {
    setSignalData([]);
    setAlerts([]);
    setSignalQuality(0);
    setHeartRate(null);
    setSpo2(null);
    setFingerPresent(false);
    setPlacementOk(false);
    setPlacementMsg('');
    setIsActive(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    signalData,
    alerts,
    signalQuality,
    heartRate,
    spo2,
    fingerPresent,
    placementOk,
    placementMsg,
    handleFrameCapture,
    startMonitoring,
    stopMonitoring,
  };
}
