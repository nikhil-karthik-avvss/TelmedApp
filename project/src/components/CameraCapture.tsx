import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff } from 'lucide-react';

interface CameraCaptureProps {
  onFrameCapture: (imageData: ImageData) => void;
  isActive: boolean;
}

export function CameraCapture({ onFrameCapture, isActive }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [started, setStarted] = useState(false); // 🔴 USER GESTURE FLAG

  /**
   * Camera initialization — ONLY after user click
   */
  useEffect(() => {
    if (!started) return;

    let cancelled = false;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) return;

        streamRef.current = stream;
        setHasPermission(true);

        const video = videoRef.current!;
        video.srcObject = stream;

        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => resolve();
        });

        await video.play();
      } catch (err) {
        setHasPermission(false);
        setError('Failed to access camera.');
      }
    };

    initCamera();

    return () => {
      cancelled = true;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [started]);

  /**
   * Frame capture loop
   */
  useEffect(() => {
    if (!started || !isActive) return;

    const capture = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(capture);
        return;
      }

      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const w = video.videoWidth;
      const h = video.videoHeight;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.drawImage(video, 0, 0, w, h);
      onFrameCapture(ctx.getImageData(0, 0, w, h));

      rafRef.current = requestAnimationFrame(capture);
    };

    rafRef.current = requestAnimationFrame(capture);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started, isActive, onFrameCapture]);

  /**
   * UI STATES
   */
  if (error) {
    return (
      <div className="aspect-video flex items-center justify-center bg-black text-white">
        <CameraOff className="w-10 h-10 mr-3" />
        {error}
      </div>
    );
  }

  if (!started) {
    return (
      <div className="aspect-video flex flex-col items-center justify-center bg-black">
        <button
          onClick={() => setStarted(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg"
        >
          Start Camera
        </button>
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black">
      <video
        ref={videoRef}
        muted
        playsInline
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
