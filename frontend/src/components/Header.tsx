import React from 'react';
import { Eye, Volume2, VolumeX, Camera, Cpu, SunMoon, Radio, AlertCircle } from 'lucide-react';
import type { ContrastMode } from '../types';
import type { VoiceStatus } from '../hooks/useSpeech';

interface HeaderProps {
  isAssistanceActive: boolean;
  cameraStatus: string;
  modelReady: boolean;
  voiceStatus: VoiceStatus;
  speechSupported: boolean;
  contrastMode: ContrastMode;
  onToggleMute: () => void;
  onToggleContrast: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAssistanceActive,
  cameraStatus,
  modelReady,
  voiceStatus,
  speechSupported,
  contrastMode,
  onToggleMute,
  onToggleContrast,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  const isMuted = voiceStatus === 'muted';
  const isSpeaking = voiceStatus === 'speaking';
  const isUnavailable = voiceStatus === 'unavailable' || !speechSupported;

  return (
    <header
      role="banner"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
        backgroundColor: isHighContrast ? '#000000' : '#0b1329',
        color: isHighContrast ? '#facc15' : '#f8fafc',
        gap: '12px',
      }}
    >
      {/* Brand Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            backgroundColor: isHighContrast ? '#facc15' : '#0d9488',
            color: isHighContrast ? '#000000' : '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
          aria-hidden="true"
        >
          <Eye size={24} strokeWidth={2.4} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: '1.35rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: isHighContrast ? '#facc15' : '#ffffff',
              }}
            >
              PathSight
            </h1>
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                backgroundColor: isAssistanceActive
                  ? (isHighContrast ? '#facc15' : '#14b8a6')
                  : (isHighContrast ? '#222' : '#334155'),
                color: isAssistanceActive && isHighContrast ? '#000' : '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Radio size={10} className={isAssistanceActive ? 'animate-pulse' : ''} />
              {isAssistanceActive ? 'LIVE ACTIVE' : 'STANDBY'}
            </span>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: '0.78rem',
              color: isHighContrast ? '#ffffff' : '#94a3b8',
            }}
          >
            Campus Assistive Vision &amp; Navigation
          </p>
        </div>
      </div>

      {/* System Status Indicators (Not relying on color alone) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
        }}
        role="region"
        aria-label="System Components Status"
      >
        {/* Camera Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: isHighContrast ? '#111' : '#131d31',
            border: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
            fontSize: '0.78rem',
            color: isHighContrast ? '#fff' : '#cbd5e1',
          }}
          title={`Camera status: ${cameraStatus}`}
        >
          <Camera
            size={14}
            style={{
              color: cameraStatus === 'active' ? '#10b981' : cameraStatus === 'denied' ? '#ef4444' : '#94a3b8',
            }}
            aria-hidden="true"
          />
          <span>Camera: <strong>{cameraStatus.toUpperCase()}</strong></span>
        </div>

        {/* Model Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: isHighContrast ? '#111' : '#131d31',
            border: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
            fontSize: '0.78rem',
            color: isHighContrast ? '#fff' : '#cbd5e1',
          }}
          title={`Vision Engine: ${modelReady ? 'YOLOv8 Online' : 'Connecting'}`}
        >
          <Cpu
            size={14}
            style={{ color: modelReady ? '#10b981' : '#f59e0b' }}
            aria-hidden="true"
          />
          <span>AI Vision: <strong>{modelReady ? 'YOLOv8 READY' : 'CONNECTING'}</strong></span>
        </div>

        {/* Voice Control Button with Clear Status Text */}
        <button
          onClick={onToggleMute}
          disabled={isUnavailable}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: isHighContrast
              ? '2px solid #facc15'
              : isUnavailable
              ? '1px solid #7f1d1d'
              : '1px solid #334155',
            backgroundColor: isUnavailable
              ? (isHighContrast ? '#222' : '#2d1518')
              : isMuted
              ? (isHighContrast ? '#222' : '#334155')
              : isSpeaking
              ? (isHighContrast ? '#facc15' : '#0d9488')
              : (isHighContrast ? '#facc15' : '#0f766e'),
            color: isUnavailable
              ? '#fca5a5'
              : isMuted
              ? (isHighContrast ? '#facc15' : '#94a3b8')
              : (isHighContrast ? '#000000' : '#ffffff'),
            cursor: isUnavailable ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
          aria-label={
            isUnavailable
              ? 'Speech synthesis is unsupported by this browser.'
              : isMuted
              ? 'Voice assistance is muted. Press to unmute.'
              : isSpeaking
              ? 'Voice is currently speaking. Press to mute.'
              : 'Voice assistance is active. Press to mute.'
          }
        >
          {isUnavailable ? (
            <AlertCircle size={16} aria-hidden="true" />
          ) : isMuted ? (
            <VolumeX size={16} aria-hidden="true" />
          ) : (
            <Volume2 size={16} className={isSpeaking ? 'animate-pulse' : ''} aria-hidden="true" />
          )}
          <span>
            {isUnavailable
              ? 'Voice: N/A'
              : isMuted
              ? 'Voice: Muted'
              : isSpeaking
              ? 'Speaking...'
              : 'Voice: Ready'}
          </span>
        </button>

        {/* High Contrast Mode Quick Toggle (44px target) */}
        <button
          onClick={onToggleContrast}
          style={{
            minWidth: '44px',
            minHeight: '44px',
            padding: '8px 12px',
            borderRadius: '6px',
            border: isHighContrast ? '2px solid #facc15' : '1px solid #334155',
            backgroundColor: isHighContrast ? '#facc15' : '#1e293b',
            color: isHighContrast ? '#000000' : '#ffffff',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
          aria-label={isHighContrast ? 'Switch to Dark Navy Theme' : 'Switch to High Contrast Yellow on Black Theme'}
        >
          <SunMoon size={16} aria-hidden="true" />
          <span>{isHighContrast ? 'High Contrast' : 'Standard'}</span>
        </button>
      </div>
    </header>
  );
};
