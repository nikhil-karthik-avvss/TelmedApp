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
  metrics?: {
    illumination: number;
    motion: number;
    fingerPlacement: number;
  };
}

export interface VideoFrame {
  imageData: ImageData;
  timestamp: number;
}
