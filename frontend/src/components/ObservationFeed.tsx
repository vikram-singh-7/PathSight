import React from 'react';
import { Volume2, AlertCircle, Compass, Info, BellRing } from 'lucide-react';
import type { Observation, ContrastMode } from '../types';

interface ObservationFeedProps {
  observations: Observation[];
  contrastMode: ContrastMode;
  onReplay: (text: string) => void;
}

export const ObservationFeed: React.FC<ObservationFeedProps> = ({
  observations,
  contrastMode,
  onReplay,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  return (
    <section
      role="region"
      aria-label="Recent Audio and Vision Observations"
      style={{
        backgroundColor: isHighContrast ? '#000000' : '#10192e',
        border: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
        borderRadius: '10px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BellRing size={18} style={{ color: isHighContrast ? '#facc15' : '#14b8a6' }} aria-hidden="true" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: isHighContrast ? '#facc15' : '#f8fafc' }}>
            Observation Feed ({observations.length})
          </h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: isHighContrast ? '#ffffff' : '#94a3b8' }}>
          Real-time chronological log
        </span>
      </div>

      <div
        role="log"
        aria-live="polite"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxHeight: '220px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {observations.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: isHighContrast ? '#facc15' : '#64748b',
              fontSize: '0.85rem',
            }}
          >
            No observations recorded yet. Start camera assistance or pick a route to hear guidance.
          </div>
        ) : (
          observations.slice(0, 15).map((obs) => {
            const isHazard = obs.isHazard;
            const itemBg = isHighContrast
              ? '#111'
              : isHazard
              ? '#260a12'
              : '#16233b';
            const itemBorder = isHighContrast
              ? (isHazard ? '1px solid #ef4444' : '1px solid #facc15')
              : isHazard
              ? '1px solid #881337'
              : '1px solid #1e293b';

            return (
              <div
                key={obs.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: itemBg,
                  border: itemBorder,
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {obs.type === 'obstacle' ? (
                    <AlertCircle size={16} style={{ color: isHazard ? '#f43f5e' : '#f59e0b', flexShrink: 0 }} aria-hidden="true" />
                  ) : obs.type === 'route' ? (
                    <Compass size={16} style={{ color: '#2dd4bf', flexShrink: 0 }} aria-hidden="true" />
                  ) : (
                    <Info size={16} style={{ color: '#94a3b8', flexShrink: 0 }} aria-hidden="true" />
                  )}

                  <span
                    style={{
                      fontSize: '0.875rem',
                      color: isHighContrast ? '#ffffff' : '#f1f5f9',
                      fontWeight: isHazard ? 600 : 400,
                      wordBreak: 'break-word',
                    }}
                  >
                    {obs.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <time
                    dateTime={obs.timestamp.toISOString()}
                    style={{ fontSize: '0.7rem', color: isHighContrast ? '#facc15' : '#94a3b8' }}
                  >
                    {obs.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </time>
                  <button
                    onClick={() => onReplay(obs.text)}
                    style={{
                      backgroundColor: 'transparent',
                      border: isHighContrast ? '1px solid #facc15' : '1px solid #334155',
                      borderRadius: '4px',
                      color: isHighContrast ? '#facc15' : '#cbd5e1',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.75rem',
                      minHeight: '36px',
                    }}
                    aria-label={`Replay audio: ${obs.text}`}
                    title="Repeat speech"
                  >
                    <Volume2 size={14} aria-hidden="true" />
                    <span>Repeat</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};

