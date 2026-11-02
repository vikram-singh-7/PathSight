import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Square,
  SwitchCamera,
  AlertOctagon,
  Eye,
  CameraOff,
  Sparkles,
  ShieldAlert,
  WifiOff,
  RefreshCw,
  CheckCircle,
  Volume2,
  VolumeX,
  Volume1,
  AlertCircle,
} from 'lucide-react';
import type { DetectionItem, ContrastMode } from '../types';
import type { VoiceStatus } from '../hooks/useSpeech';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraStatus: 'idle' | 'requesting' | 'active' | 'denied' | 'error';
  errorMessage: string | null;
  isAssistanceActive: boolean;
  detections: DetectionItem[];
  primaryHazard: string | null;
  speechSummary: string;
  isDetecting: boolean;
  modelReady: boolean;
  backendError: string | null;
  lastProcessingMs: number;
  voiceStatus: VoiceStatus;
  contrastMode: ContrastMode;
  onToggleAssistance: () => void;
  onToggleFacingMode: () => void;
  onRetryBackend: () => void;
  onToggleMute: () => void;
  onTestVoice: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  videoRef,
  cameraStatus,
  errorMessage,
  isAssistanceActive,
  detections,
  primaryHazard,
  speechSummary,
  isDetecting,
  modelReady,
  backendError,
  lastProcessingMs,
  voiceStatus,
  contrastMode,
  onToggleAssistance,
  onToggleFacingMode,
  onRetryBackend,
  onToggleMute,
  onTestVoice,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [videoAspect, setVideoAspect] = useState<number>(4 / 3);

  // Focus trap / keyboard accessibility reminder
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        onToggleAssistance();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggleAssistance]);

  // Adjust aspect ratio when video stream dimensions are known
  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.videoWidth && video.videoHeight) {
      setVideoAspect(video.videoWidth / video.videoHeight);
    }
  };

  const isMuted = voiceStatus === 'muted';
  const isSpeaking = voiceStatus === 'speaking';
  const isUnavailable = voiceStatus === 'unavailable';

  return (
    <section
      role="region"
      aria-label="Real-Time Computer Vision and Voice Assistance View"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
      }}
    >
      {/* Backend Disconnection Banner */}
      {backendError && (
        <div
          role="alert"
          style={{
            backgroundColor: isHighContrast ? '#000' : '#450a0a',
            border: isHighContrast ? '2px solid #ef4444' : '1px solid #b91c1c',
            borderRadius: '8px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            color: '#fecaca',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <WifiOff size={18} style={{ color: '#ef4444', flexShrink: 0 }} aria-hidden="true" />
            <span>
              <strong>Vision Backend Disconnected:</strong> {backendError}
            </span>
          </div>
          <button
            onClick={onRetryBackend}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              minHeight: '36px',
            }}
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Primary Action Button (Tactile, large, >=56px height) */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
        <button
          onClick={onToggleAssistance}
          style={{
            flex: 1,
            minHeight: '56px',
            borderRadius: '10px',
            border: isHighContrast ? '3px solid #facc15' : 'none',
            backgroundColor: isAssistanceActive
              ? (isHighContrast ? '#000000' : '#e11d48')
              : (isHighContrast ? '#facc15' : '#0d9488'),
            color: isAssistanceActive
              ? (isHighContrast ? '#facc15' : '#ffffff')
              : (isHighContrast ? '#000000' : '#ffffff'),
            fontSize: '1.15rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            transition: 'transform 0.1s ease',
          }}
          aria-label={
            isAssistanceActive
              ? 'Pause camera detection and voice assistance (or press Spacebar)'
              : 'Start camera detection and voice assistance (or press Spacebar)'
          }
        >
          {isAssistanceActive ? (
            <>
              <Square size={22} fill="currentColor" aria-hidden="true" />
              <span>PAUSE VISION &amp; VOICE (SPACE)</span>
            </>
          ) : (
            <>
              <Play size={22} fill="currentColor" aria-hidden="true" />
              <span>START VISION &amp; VOICE (SPACE)</span>
            </>
          )}
        </button>

        {/* Switch Camera Button (Mobile orientation) */}
        <button
          onClick={onToggleFacingMode}
          disabled={cameraStatus !== 'active'}
          style={{
            minWidth: '56px',
            minHeight: '56px',
            padding: '0 16px',
            borderRadius: '10px',
            border: isHighContrast ? '2px solid #facc15' : '1px solid #334155',
            backgroundColor: isHighContrast ? '#111' : '#1e293b',
            color: isHighContrast ? '#facc15' : '#e2e8f0',
            cursor: cameraStatus === 'active' ? 'pointer' : 'not-allowed',
            opacity: cameraStatus === 'active' ? 1 : 0.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
          aria-label="Switch camera between front and environment lens"
          title="Switch camera device"
        >
          <SwitchCamera size={20} aria-hidden="true" />
          <span style={{ display: 'none' }}>Flip Camera</span>
        </button>
      </div>

      {/* Voice Control Bar (Immediate accessible controls right on the main screen) */}
      <div
        role="region"
        aria-label="Voice Assistance Controls"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: isHighContrast ? '#111111' : '#131e36',
          border: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isUnavailable ? (
            <AlertCircle size={18} style={{ color: '#ef4444' }} aria-hidden="true" />
          ) : isMuted ? (
            <VolumeX size={18} style={{ color: '#94a3b8' }} aria-hidden="true" />
          ) : (
            <Volume2 size={18} style={{ color: isSpeaking ? '#2dd4bf' : '#14b8a6' }} aria-hidden="true" />
          )}

          <div style={{ fontSize: '0.85rem' }}>
            <span style={{ color: isHighContrast ? '#aaa' : '#94a3b8' }}>Voice Status: </span>
            <strong
              style={{
                color: isUnavailable
                  ? '#ef4444'
                  : isMuted
                  ? '#94a3b8'
                  : isSpeaking
                  ? '#2dd4bf'
                  : '#10b981',
              }}
            >
              {isUnavailable
                ? 'Speech Unsupported'
                : isMuted
                ? 'Muted (Audio Off)'
                : isSpeaking
                ? 'Speaking Announcement...'
                : 'Active & Listening'}
            </strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mute Toggle Button */}
          <button
            onClick={onToggleMute}
            disabled={isUnavailable}
            style={{
              backgroundColor: isMuted
                ? (isHighContrast ? '#facc15' : '#0d9488')
                : (isHighContrast ? '#222' : '#1e293b'),
              color: isMuted
                ? (isHighContrast ? '#000' : '#fff')
                : (isHighContrast ? '#facc15' : '#cbd5e1'),
              border: isHighContrast ? '1px solid #facc15' : '1px solid #334155',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: isUnavailable ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            aria-label={isMuted ? 'Unmute voice assistance' : 'Mute voice assistance'}
          >
            {isMuted ? <Volume2 size={15} aria-hidden="true" /> : <VolumeX size={15} aria-hidden="true" />}
            <span>{isMuted ? 'Unmute Speech' : 'Mute Speech (M)'}</span>
          </button>

          {/* Test Voice Button (Dedicated test phrase) */}
          <button
            onClick={onTestVoice}
            disabled={isUnavailable}
            style={{
              backgroundColor: isHighContrast ? '#222' : '#0f766e',
              color: isHighContrast ? '#facc15' : '#ffffff',
              border: isHighContrast ? '1px solid #facc15' : '1px solid #14b8a6',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: isUnavailable ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '40px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            aria-label="Play test voice announcement to check volume and speech output"
            title="Speak test phrase"
          >
            <Volume1 size={15} aria-hidden="true" />
            <span>Test Voice</span>
          </button>
        </div>
      </div>

      {/* Camera Viewport Container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: `${videoAspect}`,
          maxHeight: '460px',
          backgroundColor: '#020617',
          borderRadius: '12px',
          overflow: 'hidden',
          border: isHighContrast
            ? '3px solid #facc15'
            : isAssistanceActive
            ? '2px solid #14b8a6'
            : '1px solid #334155',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Real Live Video Feed */}
        <video
          ref={videoRef as React.LegacyRef<HTMLVideoElement>}
          playsInline
          muted
          onLoadedMetadata={handleLoadedMetadata}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: cameraStatus === 'active' ? 'block' : 'none',
          }}
          aria-label="Live camera feed for object detection"
        />

        {/* Inference Status Watermark & Latency */}
        {cameraStatus === 'active' && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              border: isHighContrast ? '1px solid #facc15' : '1px solid #14b8a6',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.72rem',
              color: isHighContrast ? '#facc15' : '#2dd4bf',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 600,
              zIndex: 10,
            }}
          >
            {isDetecting ? (
              <>
                <Sparkles size={12} className="animate-spin" aria-hidden="true" />
                <span>Running YOLOv8n...</span>
              </>
            ) : modelReady ? (
              <>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
                <span>YOLOv8 Ready ({lastProcessingMs > 0 ? `${lastProcessingMs}ms` : 'online'})</span>
              </>
            ) : (
              <>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
                <span>Model Initializing...</span>
              </>
            )}
          </div>
        )}

        {/* Spatial Zone Guides (3 Column Accessibility Division) */}
        {cameraStatus === 'active' && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1fr',
              pointerEvents: 'none',
              zIndex: 2,
            }}
            aria-hidden="true"
          >
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.12)', padding: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
              LEFT
            </div>
            <div style={{ borderRight: '1px dashed rgba(255, 255, 255, 0.12)', padding: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textAlign: 'center' }}>
              CENTER (AHEAD)
            </div>
            <div style={{ padding: '6px', color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', textAlign: 'right' }}>
              RIGHT
            </div>
          </div>
        )}

        {/* Real Bounding Boxes Overlay (Accurately scaled) */}
        {cameraStatus === 'active' &&
          detections.map((item, idx) => {
            const [ymin, xmin, ymax, xmax] = item.box;
            const top = `${ymin * 100}%`;
            const left = `${xmin * 100}%`;
            const width = `${(xmax - xmin) * 100}%`;
            const height = `${(ymax - ymin) * 100}%`;

            const isHazard = item.is_obstacle && item.visual_proximity !== 'distant';
            const borderColor = isHighContrast
              ? '#facc15'
              : isHazard
              ? '#f43f5e'
              : '#14b8a6';

            const badgeBg = isHighContrast
              ? '#000000'
              : isHazard
              ? '#e11d48'
              : '#0d9488';

            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  top,
                  left,
                  width,
                  height,
                  border: `2.5px solid ${borderColor}`,
                  borderRadius: '6px',
                  backgroundColor: isHazard ? 'rgba(225, 29, 72, 0.16)' : 'rgba(20, 184, 166, 0.12)',
                  pointerEvents: 'none',
                  zIndex: 5,
                  boxSizing: 'border-box',
                }}
                role="note"
                aria-label={item.advisory_text}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-24px',
                    left: 0,
                    backgroundColor: badgeBg,
                    color: isHighContrast ? '#facc15' : '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    border: isHighContrast ? '1px solid #facc15' : 'none',
                  }}
                >
                  {item.label.toUpperCase()} {Math.round(item.confidence * 100)}% · {item.position.toUpperCase()} ({item.visual_proximity.toUpperCase()})
                </div>
              </div>
            );
          })}

        {/* Active Scene Clear Indicator (When no objects detected) */}
        {cameraStatus === 'active' && detections.length === 0 && (
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              backgroundColor: 'rgba(6, 78, 59, 0.85)',
              border: '1px solid #10b981',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#d1fae5',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 6,
            }}
          >
            <CheckCircle size={14} style={{ color: '#34d399' }} aria-hidden="true" />
            <span>Path clear ahead · Scanning active</span>
          </div>
        )}

        {/* State 1: Camera Idle */}
        {cameraStatus === 'idle' && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: isHighContrast ? '#facc15' : '#94a3b8',
              maxWidth: '380px',
            }}
          >
            <Eye size={48} strokeWidth={1.5} style={{ margin: '0 auto 12px auto', color: isHighContrast ? '#facc15' : '#38bdf8' }} aria-hidden="true" />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', color: isHighContrast ? '#fff' : '#f8fafc' }}>
              Camera is in Standby
            </h3>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5 }}>
              Tap <strong>Start Vision &amp; Voice</strong> above or press <strong>Spacebar</strong> to activate the camera and real-time voice guidance.
            </p>
          </div>
        )}

        {/* State 2: Requesting Permission */}
        {cameraStatus === 'requesting' && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: isHighContrast ? '#facc15' : '#94a3b8',
            }}
            role="status"
            aria-live="polite"
          >
            <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
              Requesting Camera Access...
            </div>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Please grant camera permission when prompted by your browser.
            </p>
          </div>
        )}

        {/* State 3: Permission Denied */}
        {cameraStatus === 'denied' && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#f87171',
              maxWidth: '400px',
            }}
            role="alert"
          >
            <CameraOff size={44} style={{ margin: '0 auto 12px auto' }} aria-hidden="true" />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#fca5a5' }}>
              Camera Permission Denied
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
              PathSight requires camera access to detect obstacles. Please click the camera/lock icon in your browser address bar and select &quot;Allow&quot;.
            </p>
            <button
              onClick={onToggleAssistance}
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                minHeight: '44px',
              }}
            >
              Retry Camera Permission
            </button>
          </div>
        )}

        {/* State 4: Camera Hardware Error */}
        {cameraStatus === 'error' && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#f87171',
              maxWidth: '380px',
            }}
            role="alert"
          >
            <AlertOctagon size={44} style={{ margin: '0 auto 12px auto' }} aria-hidden="true" />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem' }}>
              Camera Hardware Unavailable
            </h3>
            <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#e2e8f0' }}>
              {errorMessage || 'Unable to open camera stream. Ensure no other application (Zoom, Teams) is using the webcam.'}
            </p>
            <button
              onClick={onToggleAssistance}
              style={{
                backgroundColor: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontWeight: 600,
                minHeight: '44px',
              }}
            >
              Retry Camera
            </button>
          </div>
        )}
      </div>

      {/* Observation Summary Banner (Immediate audio feedback card) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: isHighContrast
            ? '#000000'
            : primaryHazard
            ? '#330c17'
            : '#0b1e2e',
          border: isHighContrast
            ? '2px solid #facc15'
            : primaryHazard
            ? '1px solid #9f1239'
            : '1px solid #0284c7',
          color: isHighContrast ? '#facc15' : '#f8fafc',
        }}
        role="status"
        aria-live="polite"
      >
        <div
          style={{
            color: isHighContrast
              ? '#facc15'
              : primaryHazard
              ? '#f43f5e'
              : '#38bdf8',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {primaryHazard ? <ShieldAlert size={22} /> : <Eye size={22} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
            {primaryHazard ? 'Obstacle Notice' : 'Current Observation'}
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '2px' }}>
            {speechSummary || 'Ready. Start vision assistance to receive live verbal guidance.'}
          </div>
        </div>
      </div>
    </section>
  );
};
