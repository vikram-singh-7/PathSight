import React from 'react';
import { useBackendHealth } from '../hooks/useBackendHealth';
import { HealthBadge } from '../components/HealthBadge';
import { APP_NAME, APP_DESCRIPTION } from '../utils/constants';

export const HomePage: React.FC = () => {
  const { health, loading, error, refetch } = useBackendHealth();

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '32px 16px',
        textAlign: 'center',
      }}
    >
      <header style={{ maxWidth: '680px', margin: '0 auto 24px auto' }}>
        <div
          style={{
            display: 'inline-block',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            padding: '4px 12px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '12px',
          }}
        >
          Hackathon Project PS-15
        </div>
        <h1 style={{ fontSize: '2.2rem', margin: '8px 0', fontWeight: 700 }}>
          {APP_NAME}
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', margin: 0 }}>
          {APP_DESCRIPTION}
        </p>
      </header>

      {/* Safety Notice Banner */}
      <section
        style={{
          maxWidth: '680px',
          margin: '0 auto 24px auto',
          backgroundColor: '#451a03',
          border: '1px solid #b45309',
          borderRadius: '8px',
          padding: '12px 16px',
          textAlign: 'left',
          fontSize: '0.9rem',
          color: '#fef3c7',
        }}
        aria-label="Safety and Responsible AI Notice"
      >
        <strong>⚠️ Safety &amp; Ethics Notice:</strong> This software is an assistive research
        prototype for campus navigation. It is strictly <em>not</em> a substitute for a white cane,
        guide dog, or trained human mobility assistance. Object detection estimates are advisory only.
      </section>

      {/* Stage 1 Health & Architecture Verification Card */}
      <HealthBadge
        health={health}
        loading={loading}
        error={error}
        onRefresh={refetch}
      />

      <section
        style={{
          maxWidth: '520px',
          margin: '24px auto',
          textAlign: 'left',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem', color: '#e2e8f0' }}>
          Stage 1 Architecture Verification
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
          <li>Frontend: React 19 + TypeScript + Vite (Port 5173)</li>
          <li>Backend: Python 3.13 + FastAPI + Uvicorn (Port 8000)</li>
          <li>Separation: Pages, Components, Hooks, Services, Types, Utils</li>
          <li>Environment: Separated configs with .env.example</li>
        </ul>
      </section>
    </main>
  );
};

