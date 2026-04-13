import { useEffect, useRef, useState } from 'react';
import { CameraOff, Zap, ZapOff } from 'lucide-react';

interface CameraCaptureProps {
  onFrameCapture: (imageData: ImageData) => void;
  isActive: boolean;
}

export function CameraCapture({ onFrameCapture, isActive }: CameraCaptureProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef    = useRef<number | null>(null);

  const [error, setError]         = useState<string | null>(null);
  const [started, setStarted]     = useState(false);
  const [torchOn, setTorchOn]     = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);

  // ── Camera initialisation ──────────────────────────────────────────────
  useEffect(() => {
    if (!started) return;

    let cancelled = false;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (cancelled) return;

        streamRef.current = stream;

        // Check torch support
        const track = stream.getVideoTracks()[0];
        const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        setTorchSupported(!!caps.torch);

        const video = videoRef.current!;
        video.srcObject = stream;
        await new Promise<void>((resolve) => { video.onloadedmetadata = () => resolve(); });
        await video.play();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Permission') || msg.includes('NotAllowed')) {
          setError('Camera permission denied. Please allow camera access and reload.');
        } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
          setError('No camera found on this device.');
        } else if (msg.includes('Overconstrained') || msg.includes('ConstraintNotSatisfied')) {
          setError('Camera constraints not met. Try a different browser.');
        } else {
          setError(`Camera error: ${msg}`);
        }
      }
    };

    initCamera();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [started]);

  // ── Torch toggle ───────────────────────────────────────────────────────
  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // torch not supported on this device — hide button
      setTorchSupported(false);
    }
  };

  // ── Frame capture loop ─────────────────────────────────────────────────
  useEffect(() => {
    if (!started || !isActive) return;

    const capture = () => {
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      if (video.videoWidth === 0) {
        rafRef.current = requestAnimationFrame(capture);
        return;
      }

      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const w   = video.videoWidth;
      const h   = video.videoHeight;

      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(video, 0, 0, w, h);
      onFrameCapture(ctx.getImageData(0, 0, w, h));

      rafRef.current = requestAnimationFrame(capture);
    };

    rafRef.current = requestAnimationFrame(capture);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [started, isActive, onFrameCapture]);

  // ── Render ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="aspect-video flex items-center justify-center bg-black text-white text-center px-4">
        <CameraOff className="w-10 h-10 mr-3 flex-shrink-0" />
        <span>{error}</span>
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
      <video ref={videoRef} muted playsInline className="w-full h-full object-cover" />
      <canvas ref={canvasRef} className="hidden" />

      {/* Torch toggle button */}
      {torchSupported && (
        <button
          onClick={toggleTorch}
          title={torchOn ? 'Turn torch off' : 'Turn torch on'}
          className={`absolute top-3 right-3 p-2 rounded-full shadow-lg transition-colors ${
            torchOn
              ? 'bg-yellow-400 text-black'
              : 'bg-gray-800 bg-opacity-70 text-white hover:bg-gray-700'
          }`}
        >
          {torchOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}
