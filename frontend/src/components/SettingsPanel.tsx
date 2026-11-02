import React from 'react';
import { Sliders, Volume2, Type, SunMoon, Bell } from 'lucide-react';
import type { UserSettings, TextSize, ContrastMode } from '../types';

interface SettingsPanelProps {
  settings: UserSettings;
  contrastMode: ContrastMode;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onTestVoice: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  contrastMode,
  onUpdateSettings,
  onTestVoice,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  return (
    <section
      role="region"
      aria-label="User Accessibility and Assistance Preferences"
      style={{
        backgroundColor: isHighContrast ? '#000000' : '#10192e',
        border: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sliders size={22} style={{ color: isHighContrast ? '#facc15' : '#14b8a6' }} aria-hidden="true" />
        <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: isHighContrast ? '#facc15' : '#f8fafc' }}>
          Accessibility &amp; Voice Preferences
        </h2>
      </div>

      {/* 1. Text Size Scaling */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderBottom: isHighContrast ? '1px solid #333' : '1px solid #1e293b',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Type size={18} style={{ color: isHighContrast ? '#facc15' : '#38bdf8' }} aria-hidden="true" />
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: isHighContrast ? '#fff' : '#f1f5f9' }}>
            Typography Scaling
          </label>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: isHighContrast ? '#aaa' : '#94a3b8' }}>
          Adjust font sizing across all directions, observation badges, and buttons.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          {(['standard', 'large', 'xlarge'] as TextSize[]).map((size) => (
            <button
              key={size}
              onClick={() => onUpdateSettings({ textSize: size })}
              style={{
                flex: 1,
                minHeight: '48px',
                borderRadius: '6px',
                border: settings.textSize === size
                  ? (isHighContrast ? '2px solid #facc15' : '2px solid #14b8a6')
                  : (isHighContrast ? '1px solid #444' : '1px solid #334155'),
                backgroundColor: settings.textSize === size
                  ? (isHighContrast ? '#facc15' : '#133543')
                  : (isHighContrast ? '#111' : '#1e293b'),
                color: settings.textSize === size
                  ? (isHighContrast ? '#000' : '#fff')
                  : (isHighContrast ? '#fff' : '#cbd5e1'),
                cursor: 'pointer',
                fontWeight: settings.textSize === size ? 700 : 500,
                fontSize: size === 'xlarge' ? '1.05rem' : size === 'large' ? '0.95rem' : '0.85rem',
              }}
              aria-pressed={settings.textSize === size}
            >
              {size === 'standard' ? 'Standard (100%)' : size === 'large' ? 'Large (120%)' : 'Extra Large (140%)'}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Voice Speech Rate */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          borderBottom: isHighContrast ? '1px solid #333' : '1px solid #1e293b',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={18} style={{ color: isHighContrast ? '#facc15' : '#38bdf8' }} aria-hidden="true" />
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: isHighContrast ? '#fff' : '#f1f5f9' }}>
              Voice Instruction Speed ({settings.speechRate}x)
            </label>
          </div>

          <button
            onClick={onTestVoice}
            style={{
              backgroundColor: isHighContrast ? '#facc15' : '#0d9488',
              color: isHighContrast ? '#000' : '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600,
              minHeight: '40px',
            }}
            aria-label="Test current voice speed"
          >
            Test Audio Announcement
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          {[0.8, 1.0, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => onUpdateSettings({ speechRate: rate })}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: '6px',
                border: settings.speechRate === rate
                  ? (isHighContrast ? '2px solid #facc15' : '2px solid #14b8a6')
                  : (isHighContrast ? '1px solid #444' : '1px solid #334155'),
                backgroundColor: settings.speechRate === rate
                  ? (isHighContrast ? '#facc15' : '#133543')
                  : (isHighContrast ? '#111' : '#1e293b'),
                color: settings.speechRate === rate
                  ? (isHighContrast ? '#000' : '#fff')
                  : (isHighContrast ? '#fff' : '#cbd5e1'),
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
              aria-pressed={settings.speechRate === rate}
            >
              {rate}x Speed
            </button>
          ))}
        </div>
      </div>

      {/* 3. Contrast Mode */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: isHighContrast ? '1px solid #333' : '1px solid #1e293b',
          paddingBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SunMoon size={18} style={{ color: isHighContrast ? '#facc15' : '#38bdf8' }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isHighContrast ? '#fff' : '#f1f5f9' }}>
              High-Contrast Color Theme
            </div>
            <div style={{ fontSize: '0.8rem', color: isHighContrast ? '#aaa' : '#94a3b8' }}>
              Pure black background with bold yellow text (WCAG AAA compliant)
            </div>
          </div>
        </div>

        <button
          onClick={() =>
            onUpdateSettings({
              contrastMode: isHighContrast ? 'dark-navy' : 'high-contrast-yellow',
            })
          }
          style={{
            minHeight: '44px',
            padding: '8px 16px',
            borderRadius: '6px',
            backgroundColor: isHighContrast ? '#facc15' : '#1e293b',
            color: isHighContrast ? '#000' : '#fff',
            border: isHighContrast ? '2px solid #fff' : '1px solid #334155',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '0.85rem',
          }}
        >
          {isHighContrast ? 'Enabled (Yellow/Black)' : 'Standard (Navy)'}
        </button>
      </div>

      {/* 4. Audio Earcons Tones */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bell size={18} style={{ color: isHighContrast ? '#facc15' : '#38bdf8' }} aria-hidden="true" />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isHighContrast ? '#fff' : '#f1f5f9' }}>
              Synthesized Audio Earcons
            </div>
            <div style={{ fontSize: '0.8rem', color: isHighContrast ? '#aaa' : '#94a3b8' }}>
              Plays gentle acoustic frequency chimes for turn alerts and obstacle proximity
            </div>
          </div>
        </div>

        <input
          type="checkbox"
          checked={settings.soundEarcons}
          onChange={(e) => onUpdateSettings({ soundEarcons: e.target.checked })}
          style={{
            width: '24px',
            height: '24px',
            accentColor: isHighContrast ? '#facc15' : '#0d9488',
            cursor: 'pointer',
          }}
          aria-label="Toggle synthesized audio earcon chimes"
        />
      </div>
    </section>
  );
};
