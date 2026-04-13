import { ProcessingResult } from '../types/telemedicine';

// In dev, Vite proxies /ws → ws://localhost:8000, so no CORS issues.
// Override with VITE_BACKEND_WS_URL env var if backend runs elsewhere.
const WS_URL =
  (import.meta.env.VITE_BACKEND_WS_URL as string | undefined) ??
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/ppg`;

type MessageHandler = (result: ProcessingResult) => void;

export class PPGWebSocket {
  private static instance: PPGWebSocket;
  private ws: WebSocket | null = null;
  private handler: MessageHandler | null = null;

  private constructor() {}

  static getInstance(): PPGWebSocket {
    if (!PPGWebSocket.instance) {
      PPGWebSocket.instance = new PPGWebSocket();
    }
    return PPGWebSocket.instance;
  }

  connect(onMessage: MessageHandler): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.handler = onMessage;
    this.ws = new WebSocket(WS_URL);

    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as ProcessingResult;
        this.handler?.(data);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onerror = (e) => console.error('[PPGWebSocket] error', e);
  }

  send(frame: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ frame }));
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handler = null;
  }

  get isOpen(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
