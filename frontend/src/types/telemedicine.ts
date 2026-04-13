export interface SignalData {
  timestamp: number;
  value: number;
  rawValues?: number[];
}

export interface AlertMessage {
  type: 'warning' | 'error' | 'info' | 'success';
  message: string;
  timestamp: number;
}

export interface ProcessingResult {
  alerts: AlertMessage[];
  signalQuality: number;
  ppgValue?: number;
  heartRate?: number | null;
  spo2?: number | null;
  fingerPresent?: boolean;
  placementOk?: boolean;
  placementMsg?: string;
  bufferSize?: number;
}

export interface VideoFrame {
  imageData: ImageData;
  timestamp: number;
}
