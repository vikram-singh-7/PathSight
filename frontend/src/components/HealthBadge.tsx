import React from 'react';
import type { HealthStatus } from '../types';

interface HealthBadgeProps {
  health: HealthStatus | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({
  health,
  loading,
  error,
  onRefresh,
}) => {
  return (
    <div style={cardStyle} role="region" aria-label="System Health Status">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Backend Service Status</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={buttonStyle}
          aria-label="Refresh backend health status"
        >
          {loading ? 'Checking...' : 'Refresh Status'}
        </button>
      </div>

      {loading && <p style={{ margin: 0, color: '#94a3b8' }}>Checking backend health at /health...</p>}

      {!loading && health && (
        <div style={{ color: '#22c55e', lineHeight: 1.5 }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Status:</strong> {health.status.toUpperCase()} (Online)
          </p>
          <p style={{ margin: '4px 0' }}>
            <strong>Service:</strong> {health.service} (v{health.version})
          </p>
          <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#94a3b8' }}>
            Verified at: {new Date(health.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}

      {!loading && error && (
        <div style={{ color: '#ef4444', lineHeight: 1.5 }}>
          <p style={{ margin: '4px 0' }}>
            <strong>Status:</strong> Offline / Connection Error
          </p>
          <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>{error}</p>
          <p style={{ margin: '4px 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Ensure the FastAPI server is running at port 8000.
          </p>
        </div>
      )}
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: '8px',
  padding: '16px',
  color: '#f8fafc',
  textAlign: 'left',
  maxWidth: '520px',
  margin: '16px auto',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
};

const buttonStyle: React.CSSProperties = {
  background: '#2563eb',
  color: '#ffffff',
  border: 'none',
  borderRadius: '4px',
  padding: '6px 12px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  fontWeight: 500,
};
