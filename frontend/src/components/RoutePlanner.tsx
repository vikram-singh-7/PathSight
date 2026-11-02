import React from 'react';
import {
  Compass,
  Navigation,
  Volume2,
  AlertTriangle,
  ArrowRight,
  Accessibility,
  Footprints,
  RotateCcw,
  CheckCircle2,
  Pause,
  Play,
  XCircle,
  Info,
} from 'lucide-react';
import type { CampusNode, CampusEdge, RouteResponse, ContrastMode } from '../types';

interface RoutePlannerProps {
  nodes: CampusNode[];
  edges: CampusEdge[];
  selectedSource: string;
  selectedDestination: string;
  routeData: RouteResponse | null;
  accessibleOnly: boolean;
  isLoadingRoute: boolean;
  isNavigating: boolean;
  isNavPaused: boolean;
  confirmedStepIndex: number;
  contrastMode: ContrastMode;
  onSelectSource: (id: string) => void;
  onSelectDestination: (id: string) => void;
  onToggleAccessibleOnly: (val: boolean) => void;
  onCalculateRoute: () => void;
  onStartNavigation: () => void;
  onPauseNavigation: () => void;
  onResumeNavigation: () => void;
  onConfirmWaypointArrival: () => void;
  onRepeatInstruction: () => void;
  onResetRoute: () => void;
  onToggleObstacle: (edgeId: string, isBlocked: boolean) => void;
}

export const RoutePlanner: React.FC<RoutePlannerProps> = ({
  nodes,
  edges,
  selectedSource,
  selectedDestination,
  routeData,
  accessibleOnly,
  isLoadingRoute,
  isNavigating,
  isNavPaused,
  confirmedStepIndex,
  contrastMode,
  onSelectSource,
  onSelectDestination,
  onToggleAccessibleOnly,
  onCalculateRoute,
  onStartNavigation,
  onPauseNavigation,
  onResumeNavigation,
  onConfirmWaypointArrival,
  onRepeatInstruction,
  onResetRoute,
  onToggleObstacle,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  const totalSteps = routeData?.steps?.length || 0;
  const currentStep = routeData && totalSteps > confirmedStepIndex ? routeData.steps[confirmedStepIndex] : null;
  const isIdentical = Boolean(selectedSource && selectedDestination && selectedSource === selectedDestination);
  const isFinalStep = Boolean(currentStep && confirmedStepIndex === totalSteps - 1);

  // Node name lookup
  const nodeMap = new Map<string, string>();
  nodes.forEach((n) => nodeMap.set(n.id, n.name));

  return (
    <section
      role="region"
      aria-label="Campus Route Navigation and Planning"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '780px',
        margin: '0 auto',
      }}
    >
      {/* Honest Positioning & Data Disclosure Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: '8px',
          backgroundColor: isHighContrast ? '#000000' : '#141e33',
          border: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
          color: isHighContrast ? '#facc15' : '#cbd5e1',
          fontSize: '0.82rem',
          lineHeight: 1.4,
        }}
        role="note"
      >
        <Info size={18} style={{ color: isHighContrast ? '#facc15' : '#38bdf8', flexShrink: 0 }} aria-hidden="true" />
        <span>
          <strong>Sample Campus Network:</strong> Locations, distances, and coordinates are simulated for demonstration.
          Waypoint progression is user-confirmed manually.
        </span>
      </div>

      {/* Route Selector Controls Card */}
      <div
        style={{
          backgroundColor: isHighContrast ? '#000000' : '#10192e',
          border: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
          borderRadius: '10px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Compass size={20} style={{ color: isHighContrast ? '#facc15' : '#14b8a6' }} aria-hidden="true" />
            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: isHighContrast ? '#facc15' : '#f8fafc' }}>
              Campus Waypoint Navigator
            </h2>
          </div>

          {routeData && (
            <button
              onClick={onResetRoute}
              style={{
                backgroundColor: 'transparent',
                border: isHighContrast ? '1px solid #facc15' : '1px solid #475569',
                borderRadius: '4px',
                color: isHighContrast ? '#facc15' : '#94a3b8',
                padding: '4px 10px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
              aria-label="Reset route and select different waypoints"
            >
              <XCircle size={14} aria-hidden="true" />
              <span>Reset Route</span>
            </button>
          )}
        </div>

        {/* Source & Destination Selectors */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Origin Picker */}
          <div>
            <label
              htmlFor="origin-select"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isHighContrast ? '#facc15' : '#94a3b8',
                marginBottom: '4px',
              }}
            >
              1. Starting Waypoint (Origin)
            </label>
            <select
              id="origin-select"
              value={selectedSource}
              disabled={isNavigating}
              onChange={(e) => onSelectSource(e.target.value)}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: isHighContrast ? '#111' : '#1e293b',
                color: isHighContrast ? '#fff' : '#f8fafc',
                border: isHighContrast ? '2px solid #facc15' : '1px solid #334155',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: isNavigating ? 'not-allowed' : 'pointer',
                opacity: isNavigating ? 0.7 : 1,
              }}
            >
              <option value="">-- Choose Starting Point --</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination Picker */}
          <div>
            <label
              htmlFor="destination-select"
              style={{
                display: 'block',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: isHighContrast ? '#facc15' : '#94a3b8',
                marginBottom: '4px',
              }}
            >
              2. Target Destination
            </label>
            <select
              id="destination-select"
              value={selectedDestination}
              disabled={isNavigating}
              onChange={(e) => onSelectDestination(e.target.value)}
              style={{
                width: '100%',
                minHeight: '48px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: isHighContrast ? '#111' : '#1e293b',
                color: isHighContrast ? '#fff' : '#f8fafc',
                border: isHighContrast ? '2px solid #facc15' : '1px solid #334155',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: isNavigating ? 'not-allowed' : 'pointer',
                opacity: isNavigating ? 0.7 : 1,
              }}
            >
              <option value="">-- Choose Destination --</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Identical Start/Destination Warning */}
        {isIdentical && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              backgroundColor: isHighContrast ? '#222' : '#331e07',
              border: isHighContrast ? '1px solid #facc15' : '1px solid #d97706',
              color: isHighContrast ? '#facc15' : '#fde68a',
              fontSize: '0.85rem',
            }}
            role="status"
          >
            <strong>Note:</strong> Starting location and destination are identical. You are already at this destination.
          </div>
        )}

        {/* Step-Free Accessible Filter Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: '6px',
            backgroundColor: isHighContrast ? '#111' : '#131f38',
            border: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Accessibility size={18} style={{ color: isHighContrast ? '#facc15' : '#2dd4bf' }} aria-hidden="true" />
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: isHighContrast ? '#fff' : '#f8fafc' }}>
                Require Step-Free / Graded Ramps Only
              </div>
              <div style={{ fontSize: '0.75rem', color: isHighContrast ? '#facc15' : '#94a3b8' }}>
                Avoids flights of stairs and prioritizes tactile paving
              </div>
            </div>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              cursor: isNavigating ? 'not-allowed' : 'pointer',
              minHeight: '44px',
            }}
          >
            <input
              type="checkbox"
              checked={accessibleOnly}
              disabled={isNavigating}
              onChange={(e) => onToggleAccessibleOnly(e.target.checked)}
              style={{
                width: '22px',
                height: '22px',
                accentColor: isHighContrast ? '#facc15' : '#0d9488',
                cursor: isNavigating ? 'not-allowed' : 'pointer',
              }}
              aria-label="Require step-free and tactile pathways"
            />
          </label>
        </div>

        {/* Action Button: Calculate or Re-Plan */}
        {!isNavigating && (
          <button
            onClick={onCalculateRoute}
            disabled={!selectedSource || !selectedDestination || isLoadingRoute || isIdentical}
            style={{
              minHeight: '48px',
              borderRadius: '6px',
              backgroundColor: isHighContrast ? '#facc15' : '#0d9488',
              color: isHighContrast ? '#000000' : '#ffffff',
              border: isHighContrast ? '2px solid #ffffff' : 'none',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: selectedSource && selectedDestination && !isIdentical ? 'pointer' : 'not-allowed',
              opacity: selectedSource && selectedDestination && !isIdentical ? 1 : 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            aria-label="Calculate shortest accessible campus route"
          >
            <Navigation size={18} aria-hidden="true" />
            <span>{isLoadingRoute ? 'Calculating Shortest Path...' : 'Plan Accessible Route'}</span>
          </button>
        )}
      </div>

      {/* ACTIVE NAVIGATION SESSION CARD */}
      {routeData && routeData.success && totalSteps > 0 && (
        <div
          role="region"
          aria-label="Turn-by-turn Navigation Session"
          style={{
            backgroundColor: isHighContrast ? '#000000' : isNavigating ? '#032322' : '#0e1d33',
            border: isHighContrast ? '3px solid #facc15' : isNavigating ? '2px solid #14b8a6' : '1px solid #1e3a5f',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Header Controls: Start / Pause / Resume / Repeat */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 700,
                  backgroundColor: isNavigating ? (isHighContrast ? '#facc15' : '#0d9488') : '#334155',
                  color: isNavigating && isHighContrast ? '#000' : '#fff',
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}
              >
                {isNavigating ? (isNavPaused ? 'GUIDANCE PAUSED' : 'NAVIGATION ACTIVE') : 'ROUTE READY'}
              </span>

              <span style={{ fontSize: '0.85rem', color: isHighContrast ? '#fff' : '#94a3b8' }}>
                Step {confirmedStepIndex + 1} of {totalSteps}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {/* Repeat Instruction */}
              {currentStep && (
                <button
                  onClick={onRepeatInstruction}
                  style={{
                    backgroundColor: 'transparent',
                    border: isHighContrast ? '1px solid #facc15' : '1px solid #2dd4bf',
                    color: isHighContrast ? '#facc15' : '#2dd4bf',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '40px',
                  }}
                  aria-label="Repeat current spoken navigation instruction"
                >
                  <Volume2 size={16} aria-hidden="true" />
                  <span>Repeat</span>
                </button>
              )}

              {/* Pause / Resume Guidance */}
              {isNavigating && (
                <button
                  onClick={isNavPaused ? onResumeNavigation : onPauseNavigation}
                  style={{
                    backgroundColor: isHighContrast ? '#222' : '#1e293b',
                    border: isHighContrast ? '1px solid #facc15' : '1px solid #475569',
                    color: isHighContrast ? '#facc15' : '#e2e8f0',
                    borderRadius: '4px',
                    padding: '6px 10px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '40px',
                  }}
                  aria-label={isNavPaused ? 'Resume navigation guidance' : 'Pause navigation guidance'}
                >
                  {isNavPaused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
                  <span>{isNavPaused ? 'Resume' : 'Pause'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Current & Next Waypoint Callout */}
          {currentStep && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '10px',
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: isHighContrast ? '#111' : 'rgba(0, 0, 0, 0.3)',
                border: isHighContrast ? '1px solid #333' : '1px solid #132d42',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                  Confirmed Current Waypoint
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: isHighContrast ? '#facc15' : '#34d399', marginTop: '2px' }}>
                  {currentStep.from_name}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
                  Next Target Waypoint
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: isHighContrast ? '#facc15' : '#38bdf8', marginTop: '2px' }}>
                  {currentStep.to_name} ({currentStep.distance_meters}m)
                </div>
              </div>
            </div>
          )}

          {/* Spoken Instruction Banner */}
          {currentStep && (
            <div
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                lineHeight: 1.45,
                color: isHighContrast ? '#facc15' : '#f0fdfa',
              }}
            >
              {currentStep.instructions}
            </div>
          )}

          {/* PRIMARY INTERACTION BUTTON: START OR CONFIRM ARRIVAL */}
          {!isNavigating ? (
            <button
              onClick={onStartNavigation}
              style={{
                minHeight: '56px',
                borderRadius: '8px',
                backgroundColor: isHighContrast ? '#facc15' : '#0d9488',
                color: isHighContrast ? '#000000' : '#ffffff',
                border: 'none',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              }}
              aria-label="Start interactive voice-guided navigation session"
            >
              <Play size={20} fill="currentColor" aria-hidden="true" />
              <span>START NAVIGATION SESSION</span>
            </button>
          ) : (
            <button
              onClick={onConfirmWaypointArrival}
              disabled={isNavPaused}
              style={{
                minHeight: '58px',
                borderRadius: '8px',
                backgroundColor: isHighContrast ? '#facc15' : isFinalStep ? '#059669' : '#0284c7',
                color: isHighContrast ? '#000000' : '#ffffff',
                border: isHighContrast ? '2px solid #ffffff' : 'none',
                fontSize: '1.1rem',
                fontWeight: 700,
                cursor: isNavPaused ? 'not-allowed' : 'pointer',
                opacity: isNavPaused ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
              }}
              aria-label={`Confirm reaching waypoint ${currentStep?.to_name}`}
            >
              <CheckCircle2 size={24} aria-hidden="true" />
              <span>
                {isFinalStep
                  ? `CONFIRM ARRIVAL AT DESTINATION (${currentStep?.to_name})`
                  : `CONFIRM ARRIVAL AT: ${currentStep?.to_name}`}
              </span>
            </button>
          )}

          {/* Segment details */}
          {currentStep && (
            <div
              style={{
                fontSize: '0.8rem',
                color: isHighContrast ? '#aaa' : '#94a3b8',
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: isHighContrast ? '1px solid #333' : '1px solid rgba(255,255,255,0.1)',
                paddingTop: '8px',
              }}
            >
              <span>Pathway Type: {currentStep.path_type.replace('_', ' ')}</span>
              <span>{currentStep.has_tactile_paving ? '✓ Tactile Paving' : 'Standard Paved'}</span>
            </div>
          )}
        </div>
      )}

      {/* Warnings & Rerouting Notice */}
      {routeData?.warnings && routeData.warnings.length > 0 && (
        <div
          style={{
            backgroundColor: isHighContrast ? '#111' : '#321008',
            border: isHighContrast ? '2px solid #facc15' : '1px solid #ea580c',
            borderRadius: '8px',
            padding: '12px 16px',
            color: isHighContrast ? '#facc15' : '#fed7aa',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="alert"
        >
          <AlertTriangle size={18} style={{ color: '#f97316', flexShrink: 0 }} aria-hidden="true" />
          <span>{routeData.warnings.join(' ')}</span>
        </div>
      )}

      {/* Complete Step-by-Step Waypoint Itinerary */}
      {routeData?.steps && routeData.steps.length > 0 && (
        <div
          style={{
            backgroundColor: isHighContrast ? '#000000' : '#10192e',
            border: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
            borderRadius: '10px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: isHighContrast ? '#facc15' : '#f8fafc' }}>
              Full Journey Waypoints ({routeData.steps.length} segments)
            </h3>
            <span style={{ fontSize: '0.825rem', color: isHighContrast ? '#fff' : '#94a3b8' }}>
              Total: <strong>{routeData.total_distance_meters}m</strong> (~{routeData.estimated_time_minutes} min walk)
            </span>
          </div>

          <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {routeData.steps.map((st, idx) => {
              const isCurrent = idx === confirmedStepIndex;
              const isPassed = idx < confirmedStepIndex;

              return (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    backgroundColor: isCurrent
                      ? (isHighContrast ? '#facc15' : '#11333e')
                      : isPassed
                      ? (isHighContrast ? '#111' : '#0d1527')
                      : (isHighContrast ? '#111' : '#142038'),
                    color: isCurrent
                      ? (isHighContrast ? '#000' : '#f8fafc')
                      : isPassed
                      ? '#64748b'
                      : (isHighContrast ? '#fff' : '#cbd5e1'),
                    border: isCurrent
                      ? (isHighContrast ? '2px solid #fff' : '1px solid #14b8a6')
                      : '1px solid transparent',
                    opacity: isPassed ? 0.75 : 1,
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: isPassed
                        ? '#059669'
                        : isCurrent
                        ? (isHighContrast ? '#000' : '#0d9488')
                        : '#334155',
                      color: isPassed
                        ? '#ffffff'
                        : isCurrent
                        ? (isHighContrast ? '#facc15' : '#fff')
                        : '#94a3b8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {isPassed ? '✓' : st.step_number}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {st.from_name} <ArrowRight size={12} style={{ display: 'inline', margin: '0 4px' }} /> {st.to_name}
                      {isCurrent && <span style={{ marginLeft: '8px', fontSize: '0.72rem', color: '#14b8a6' }}>[CURRENT TARGET]</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '2px', color: isCurrent ? (isHighContrast ? '#111' : '#99f6e4') : '#94a3b8' }}>
                      {st.instructions}
                    </div>
                  </div>

                  <div style={{ fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {st.distance_meters}m
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Dynamic Obstacle Simulation & Reroute Demonstration Box */}
      <div
        style={{
          backgroundColor: isHighContrast ? '#111' : '#131b2e',
          border: isHighContrast ? '1px dashed #facc15' : '1px dashed #475569',
          borderRadius: '10px',
          padding: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Footprints size={18} style={{ color: isHighContrast ? '#facc15' : '#f59e0b' }} aria-hidden="true" />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600, color: isHighContrast ? '#facc15' : '#e2e8f0' }}>
            Hackathon Demonstration: Dynamic Pathway Maintenance &amp; Detour
          </h4>
        </div>
        <p style={{ margin: '0 0 12px 0', fontSize: '0.8rem', color: isHighContrast ? '#fff' : '#94a3b8', lineHeight: 1.4 }}>
          PS-15 requires identifying temporary obstacles. Toggle a pathway blockage below to trigger real-time Dijkstra rerouting!
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {edges.slice(0, 5).map((edge) => (
            <button
              key={edge.id}
              onClick={() => onToggleObstacle(edge.id, !edge.is_blocked)}
              style={{
                backgroundColor: edge.is_blocked ? '#dc2626' : (isHighContrast ? '#222' : '#1e293b'),
                color: edge.is_blocked ? '#ffffff' : (isHighContrast ? '#facc15' : '#cbd5e1'),
                border: isHighContrast ? '1px solid #facc15' : '1px solid #334155',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '40px',
              }}
              aria-label={`Toggle temporary blockage for edge ${edge.id}`}
            >
              {edge.is_blocked ? (
                <>
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Clear: {edge.id} (BLOCKED)</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={14} aria-hidden="true" />
                  <span>Block: {edge.id}</span>
                </>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
