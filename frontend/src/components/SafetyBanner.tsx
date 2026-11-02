import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

interface SafetyBannerProps {
  contrastMode?: 'dark-navy' | 'high-contrast-yellow';
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({ contrastMode }) => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  return (
    <aside
      aria-label="Safety and Operational Disclaimer"
      style={{
        backgroundColor: isHighContrast ? '#000000' : '#1a1003',
        border: isHighContrast ? '2px solid #facc15' : '1px solid #78350f',
        borderRadius: '8px',
        color: isHighContrast ? '#facc15' : '#fef3c7',
        padding: '10px 16px',
        margin: '12px 0 16px 0',
        fontSize: '0.875rem',
        lineHeight: 1.5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle
            size={18}
            style={{ color: isHighContrast ? '#facc15' : '#fbbf24', flexShrink: 0 }}
            aria-hidden="true"
          />
          <span style={{ fontWeight: 600 }}>
            Assistive Research Prototype — Strictly Not a White Cane or Mobility Aid Substitute.
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: isHighContrast ? '#facc15' : '#fde68a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            padding: '6px 8px',
            minHeight: '44px',
            textDecoration: 'underline',
          }}
          aria-expanded={expanded}
          aria-controls="safety-details"
        >
          {expanded ? 'Hide Safety Details' : 'View Safety Rules'}
          {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
        </button>
      </div>

      {expanded && (
        <div id="safety-details" style={{ marginTop: '10px', paddingTop: '8px', borderTop: isHighContrast ? '1px solid #facc15' : '1px solid #78350f', fontSize: '0.825rem' }}>
          <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <li>
              <strong>Sensory Advisory Only:</strong> Computer vision predictions represent visual frame observations, not verified depth or guaranteed physical collision avoidance.
            </li>
            <li>
              <strong>Primary Mobility Aids:</strong> Users must always rely on their primary mobility tools (cane, trained guide dog, or personal assistant) for physical path clearance.
            </li>
            <li>
              <strong>Separate Hazard Reporting:</strong> Visual detection objects are distinguished from confirmed physical pathway obstacles and maintenance detours.
            </li>
          </ul>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', color: isHighContrast ? '#ffffff' : '#94a3b8' }}>
            <ShieldCheck size={14} aria-hidden="true" />
            <span>PathSight Responsible AI Architecture — Complies with PS-15 Hackathon Evaluation Criteria.</span>
          </div>
        </div>
      )}
    </aside>
  );
};

