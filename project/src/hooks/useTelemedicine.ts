import { useState, useCallback, useRef, useEffect } from 'react';
import { SignalData, AlertMessage } from '../types/telemedicine';
import { SignalProcessor } from '../utils/signalProcessing';
import { TelemedicineAPI } from '../services/api';

export function useTelemedicine() {
  const [isActive, setIsActive] = useState(false);
  const [signalData, setSignalData] = useState<SignalData[]>([]);
  const [alerts, setAlerts] = useState<AlertMessage[]>([]);
  const [signalQuality, setSignalQuality] = useState(0);

  const signalProcessor = useRef(new SignalProcessor());
  const api = useRef(TelemedicineAPI.getInstance());
  const processingIntervalRef = useRef<number | null>(null);
  const metricsQueueRef = useRef<ImageData[]>([]);

  const handleFrameCapture = useCallback((imageData: ImageData) => {
    metricsQueueRef.current.push(imageData);

    if (metricsQueueRef.current.length > 5) {
      metricsQueueRef.current.shift();
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
      return;
    }

    const processQueue = async () => {
      if (metricsQueueRef.current.length === 0) return;

      const frame = metricsQueueRef.current[metricsQueueRef.current.length - 1];

      const rawMetrics = signalProcessor.current.extractRawMetrics(frame);

      const ppgRaw = signalProcessor.current.extractPPGSignal(rawMetrics);
      const ppgSmoothed = signalProcessor.current.smoothSignal(ppgRaw);
      const ppgFiltered = signalProcessor.current.filterSignal(ppgSmoothed);

      const newSignalData: SignalData = {
        timestamp: Date.now(),
        value: ppgFiltered,
        rawValues: [ppgRaw, ppgSmoothed, ppgFiltered],
      };

      setSignalData((prev) => [...prev, newSignalData]);

      try {
        const result = await api.current.processSignal(rawMetrics);

        setSignalQuality(result.signalQuality);

        if (result.alerts.length > 0) {
          setAlerts((prev) => [...prev, ...result.alerts]);
        }
      } catch (error) {
        console.error('Failed to process signal:', error);
      }
    };

    processingIntervalRef.current = window.setInterval(processQueue, 100);

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isActive]);

  const startMonitoring = useCallback(() => {
    setIsActive(true);
    setSignalData([]);
    setAlerts([]);
    setSignalQuality(0);
    signalProcessor.current.clearBuffer();
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsActive(false);
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
  }, []);

  return {
    isActive,
    signalData,
    alerts,
    signalQuality,
    handleFrameCapture,
    startMonitoring,
    stopMonitoring,
  };
}
