import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SwitchCamera, Wifi, CheckCircle2, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import { postMobileCameraFrame } from '../services/api';

interface MobileCameraTransmitterProps {
  onExit: () => void;
}

export const MobileCameraTransmitter: React.FC<MobileCameraTransmitterProps> = ({ onExit }) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [status, setStatus] = useState<'starting' | 'active' | 'error'>('starting');
  const [retryKey, setRetryKey] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [framesSent, setFramesSent] = useState<number>(0);
  const [lastSummary, setLastSummary] = useState<string>('Initializing stream...');
  const [latencyMs, setLatencyMs] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isTransmittingRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);

  // Start and synchronize mobile camera stream
  useEffect(() => {
    let active = true;
    const initCam = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (active) {
          setStatus('error');
          setErrorMessage('Camera access is not supported by this browser.');
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setStatus('active');
        setErrorMessage(null);
      } catch (err: unknown) {
        if (active) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Camera access denied or unavailable.');
        }
      }
    };

    initCam();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [facingMode, retryKey]);

  // Capture frame and send to backend
  const sendFrame = useCallback(async () => {
    if (isTransmittingRef.current || status !== 'active') return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = 480;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.65);

    isTransmittingRef.current = true;
    const t0 = performance.now();
    try {
      const res = await postMobileCameraFrame(b64, 0.35, 'Mobile Phone');
      const dt = Math.round(performance.now() - t0);
      setLatencyMs(dt);
      setFramesSent((prev) => prev + 1);
      if (res.summary) {
        setLastSummary(res.summary);
      }
    } catch {
      // transient network drop
    } finally {
      isTransmittingRef.current = false;
    }
  }, [status]);

  // Transmitter loop at ~2.5 FPS (every 400ms)
  useEffect(() => {
    if (status === 'active') {
      timerRef.current = window.setInterval(sendFrame, 400);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sendFrame, status]);

  const toggleLens = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#000000',
        color: '#ffffff',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <button
          onClick={onExit}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            fontWeight: 600,
            padding: '4px 8px',
          }}
        >
          <ArrowLeft size={18} />
          <span>Exit to Full App</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Wifi size={16} style={{ color: status === 'active' ? '#10b981' : '#f59e0b' }} />
          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>
            {status === 'active' ? 'Transmitting' : 'Connecting'}
          </span>
        </div>
      </header>

      {/* Main Video Viewport */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          backgroundColor: '#050b14',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: status === 'active' ? 'block' : 'none',
          }}
        />

        {status === 'starting' && (
          <div style={{ textAlign: 'center', padding: '24px' }}>
            <RefreshCw size={36} className="animate-spin" style={{ color: '#38bdf8', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Starting Phone Camera...</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Please allow camera access when prompted.</p>
          </div>
        )}

        {status === 'error' && (
          <div style={{ textAlign: 'center', padding: '24px', maxWidth: '320px' }}>
            <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#f87171' }}>Camera Error</h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginBottom: '16px' }}>{errorMessage}</p>
            <button
              onClick={() => setRetryKey((k) => k + 1)}
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry Camera
            </button>
          </div>
        )}

        {/* Live Watermark on Video */}
        {status === 'active' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.75rem',
            }}
          >
            <CheckCircle2 size={14} style={{ color: '#10b981' }} />
            <span>Streaming: {framesSent} frames ({latencyMs}ms)</span>
          </div>
        )}
      </div>

      {/* Observation Summary and Controls */}
      <div
        style={{
          padding: '16px',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
          <strong style={{ color: '#facc15' }}>YOLOv8 Detection: </strong>
          <span>{lastSummary}</span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={toggleLens}
            style={{
              flex: 1,
              minHeight: '48px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
          >
            <SwitchCamera size={18} />
            <span>{facingMode === 'environment' ? 'Lens: Rear (World)' : 'Lens: Front (Selfie)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
