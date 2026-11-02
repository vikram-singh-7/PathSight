import React from 'react';
import { Eye, Compass, Sliders } from 'lucide-react';
import type { ActiveTab, ContrastMode } from '../types';

interface NavigationSidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  contrastMode: ContrastMode;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeTab,
  onSelectTab,
  contrastMode,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  const navItems = [
    {
      id: 'assist' as ActiveTab,
      label: 'Assist & Vision',
      sublabel: 'Live camera & audio cues',
      icon: Eye,
      shortcut: 'Alt+1',
    },
    {
      id: 'navigate' as ActiveTab,
      label: 'Campus Route',
      sublabel: 'Accessible path guidance',
      icon: Compass,
      shortcut: 'Alt+2',
    },
    {
      id: 'settings' as ActiveTab,
      label: 'Preferences',
      sublabel: 'Audio, text & contrast',
      icon: Sliders,
      shortcut: 'Alt+3',
    },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main Application Destinations"
      className="nav-sidebar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '16px 12px',
        backgroundColor: isHighContrast ? '#000000' : '#0e172a',
        borderRight: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
        minWidth: '220px',
      }}
    >
      <div
        style={{
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: isHighContrast ? '#facc15' : '#94a3b8',
          padding: '4px 12px 8px 12px',
          fontWeight: 600,
        }}
      >
        Workspaces
      </div>

      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const IconComponent = item.icon;

        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              border: isActive
                ? (isHighContrast ? '2px solid #facc15' : '1px solid #14b8a6')
                : (isHighContrast ? '1px solid #333' : '1px solid transparent'),
              backgroundColor: isActive
                ? (isHighContrast ? '#facc15' : '#132e3b')
                : (isHighContrast ? '#111111' : 'transparent'),
              color: isActive
                ? (isHighContrast ? '#000000' : '#f8fafc')
                : (isHighContrast ? '#ffffff' : '#cbd5e1'),
              cursor: 'pointer',
              textAlign: 'left',
              minHeight: '52px',
              transition: 'background-color 0.15s ease',
              width: '100%',
            }}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`${item.label} workspace. Press ${item.shortcut} to switch.`}
          >
            <div
              style={{
                color: isActive
                  ? (isHighContrast ? '#000000' : '#2dd4bf')
                  : (isHighContrast ? '#facc15' : '#94a3b8'),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-hidden="true"
            >
              <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}>
                {item.label}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: isActive
                    ? (isHighContrast ? '#111' : '#94a3b8')
                    : (isHighContrast ? '#aaa' : '#64748b'),
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.sublabel}
              </div>
            </div>

            <span
              style={{
                fontSize: '0.65rem',
                padding: '2px 5px',
                borderRadius: '3px',
                backgroundColor: isHighContrast ? '#222' : '#1e293b',
                color: isHighContrast ? '#facc15' : '#64748b',
                border: isHighContrast ? '1px solid #555' : '1px solid #334155',
                fontFamily: 'monospace',
              }}
              aria-hidden="true"
            >
              {item.shortcut}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

