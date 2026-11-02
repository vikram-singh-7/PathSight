import React from 'react';
import type { CampusNode, CampusEdge, ContrastMode } from '../types';

interface CampusMapCanvasProps {
  nodes: CampusNode[];
  edges: CampusEdge[];
  selectedSource: string;
  selectedDestination: string;
  activePath: string[];
  currentConfirmedNodeId?: string | null;
  nextTargetNodeId?: string | null;
  contrastMode: ContrastMode;
  onSelectNode: (nodeId: string) => void;
}

export const CampusMapCanvas: React.FC<CampusMapCanvasProps> = ({
  nodes,
  edges,
  selectedSource,
  selectedDestination,
  activePath,
  currentConfirmedNodeId,
  nextTargetNodeId,
  contrastMode,
  onSelectNode,
}) => {
  const isHighContrast = contrastMode === 'high-contrast-yellow';

  // SVG dimensions
  const width = 760;
  const height = 500;

  // Build a lookup map for node coordinates
  const nodeMap = new Map<string, CampusNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <figure
      style={{
        margin: 0,
        backgroundColor: isHighContrast ? '#000000' : '#070f22',
        border: isHighContrast ? '2px solid #facc15' : '1px solid #1e293b',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
        position: 'relative',
      }}
      aria-label="Interactive Sample Campus Pathways Map"
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 16px',
          borderBottom: isHighContrast ? '1px solid #facc15' : '1px solid #1e293b',
          fontSize: '0.8rem',
          color: isHighContrast ? '#facc15' : '#94a3b8',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          <strong>Sample Campus Network:</strong> Select any two landmarks to calculate an accessible route.
        </span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            Confirmed Position
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8', display: 'inline-block' }} />
            Next Target
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#14b8a6', display: 'inline-block' }} />
            Planned Path
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            Blocked Detour
          </span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Campus map showing walkways, ramps, and building locations"
      >
        {/* Campus Background Grid */}
        <defs>
          <pattern id="campusGrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke={isHighContrast ? '#222' : '#0e1d3a'}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#campusGrid)" />

        {/* Pathways / Edges */}
        {edges.map((edge) => {
          const src = nodeMap.get(edge.source);
          const tgt = nodeMap.get(edge.target);
          if (!src || !tgt) return null;

          // Check if this edge is in the active path
          let isPathEdge = false;
          for (let i = 0; i < activePath.length - 1; i++) {
            if (
              (activePath[i] === edge.source && activePath[i + 1] === edge.target) ||
              (activePath[i] === edge.target && activePath[i + 1] === edge.source)
            ) {
              isPathEdge = true;
              break;
            }
          }

          const isBlocked = edge.is_blocked;
          const strokeColor = isBlocked
            ? '#ef4444'
            : isPathEdge
            ? (isHighContrast ? '#facc15' : '#14b8a6')
            : (isHighContrast ? '#444' : '#1e3a5f');

          const strokeWidth = isPathEdge ? 5 : isBlocked ? 3.5 : 2;
          const strokeDasharray = edge.has_stairs ? '6,6' : isBlocked ? '4,4' : undefined;

          return (
            <g key={edge.id}>
              <line
                x1={src.coordinates.x}
                y1={src.coordinates.y}
                x2={tgt.coordinates.x}
                y2={tgt.coordinates.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
              />
              {/* Distance label midway */}
              <text
                x={(src.coordinates.x + tgt.coordinates.x) / 2}
                y={(src.coordinates.y + tgt.coordinates.y) / 2 - 6}
                fill={isHighContrast ? '#aaa' : '#64748b'}
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {edge.distance_meters}m {edge.has_stairs ? '(Stairs)' : ''}
              </text>
            </g>
          );
        })}

        {/* Nodes / Campus Buildings */}
        {nodes.map((node) => {
          const isSource = node.id === selectedSource;
          const isDest = node.id === selectedDestination;
          const inPath = activePath.includes(node.id);
          const isConfirmedPos = currentConfirmedNodeId === node.id;
          const isNextTarget = nextTargetNodeId === node.id;

          const fillColor = isConfirmedPos
            ? '#059669'
            : isNextTarget
            ? '#0284c7'
            : isSource
            ? '#10b981'
            : isDest
            ? '#38bdf8'
            : inPath
            ? '#0d9488'
            : isHighContrast
            ? '#222222'
            : '#1e293b';

          const strokeColor = isConfirmedPos || isNextTarget || isSource || isDest || inPath
            ? (isHighContrast ? '#facc15' : '#ffffff')
            : (isHighContrast ? '#facc15' : '#475569');

          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              aria-label={`${node.name} (${node.category}): ${node.description}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectNode(node.id);
                }
              }}
            >
              {/* Confirmed Current Position Halo */}
              {isConfirmedPos && (
                <circle
                  cx={node.coordinates.x}
                  cy={node.coordinates.y}
                  r={26}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  strokeDasharray="4,4"
                  opacity={0.9}
                />
              )}

              {/* Next Target Pulsing Halo */}
              {isNextTarget && (
                <circle
                  cx={node.coordinates.x}
                  cy={node.coordinates.y}
                  r={24}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  opacity={0.8}
                />
              )}

              {/* Outer halo for origin / destination */}
              {!isConfirmedPos && !isNextTarget && (isSource || isDest) && (
                <circle
                  cx={node.coordinates.x}
                  cy={node.coordinates.y}
                  r={22}
                  fill="none"
                  stroke={isSource ? '#10b981' : '#38bdf8'}
                  strokeWidth="2.5"
                  opacity={0.7}
                />
              )}

              {/* Node Marker */}
              <circle
                cx={node.coordinates.x}
                cy={node.coordinates.y}
                r={15}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={2}
              />

              {/* Node Label Text */}
              <text
                x={node.coordinates.x}
                y={node.coordinates.y + 26}
                fill={isHighContrast ? '#facc15' : '#f8fafc'}
                fontSize="12"
                fontWeight={isConfirmedPos || isNextTarget || isSource || isDest ? '700' : '600'}
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {node.name.replace(' (Sample)', '')}
              </text>

              {/* Status / Category tag */}
              <text
                x={node.coordinates.x}
                y={node.coordinates.y + 38}
                fill={isHighContrast ? '#ffffff' : '#94a3b8'}
                fontSize="9"
                fontFamily="sans-serif"
                textAnchor="middle"
              >
                {isConfirmedPos
                  ? '📍 YOUR LOCATION'
                  : isNextTarget
                  ? '🎯 NEXT TARGET'
                  : isSource
                  ? 'START'
                  : isDest
                  ? 'GOAL'
                  : node.category}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="sr-only">
        Sample campus route map displaying walkways and accessible waypoints.
      </figcaption>
    </figure>
  );
};
