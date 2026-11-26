import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * BACKEND ("request and response")
 * - Client box, API box, Database cylinder in a row
 * - Request packet moves Client -> API -> DB and back
 * - Response arrives with green tick
 * - Small code card types short JSON line (mono, status ok) + latency bar draws
 */
export const BackendScene: React.FC<CategorySceneProps> = ({
  categoryName,
  categorySlug,
  playbackMode = 'interactive',
  isActive = true,
  forcedState,
  showReplayButton = true,
  className = '',
}) => {
  return (
    <SceneStageFrame
      sceneKey={`backend-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-be-${categorySlug}`}
      className={className}
    >
      {/* Connector Lines */}
      <line x1="186" y1="138" x2="262" y2="138" stroke="#E5E7EB" strokeWidth="2.5" />
      <line x1="378" y1="138" x2="454" y2="138" stroke="#E5E7EB" strokeWidth="2.5" />
      <line x1="186" y1="138" x2="262" y2="138" stroke="#0047AB" strokeWidth="2.5" className="pl-anim pl-anim-draw-1 pl-final-visible" />
      <line x1="378" y1="138" x2="454" y2="138" stroke="#0047AB" strokeWidth="2.5" className="pl-anim pl-anim-draw-2 pl-final-visible" />

      {/* Node 1: Client Box */}
      <g>
        <rect x="76" y="96" width="110" height="84" rx="12" fill="#F5F6FA" stroke="#0B0B0F" strokeWidth="1.5" />
        <rect x="94" y="114" width="74" height="10" rx="3" fill="#0B0B0F" />
        <rect x="94" y="132" width="52" height="8" rx="3" fill="#B7BCC6" />
        <text x="131" y="164" textAnchor="middle" fill="#4B5563" fontSize="11" fontWeight="600">
          Client
        </text>
      </g>

      {/* Node 2: API Box */}
      <g>
        <rect x="262" y="90" width="116" height="96" rx="12" fill="#EAF1FB" stroke="#0047AB" strokeWidth="1.75" />
        <rect x="282" y="110" width="76" height="12" rx="4" fill="#0047AB" />
        <rect x="282" y="130" width="58" height="8" rx="3" fill="#7FA3DB" />
        <rect x="282" y="144" width="44" height="8" rx="3" fill="#A9C1E8" />
        <text x="320" y="172" textAnchor="middle" fill="#0047AB" fontSize="11.5" fontWeight="700">
          API Service
        </text>
      </g>

      {/* Node 3: Database Cylinder */}
      <g>
        <path
          d="M454 114 V166 C454 175.5 478.6 182 509 182 C539.4 182 564 175.5 564 166 V114"
          fill="#F5F6FA"
          stroke="#0B0B0F"
          strokeWidth="1.5"
        />
        <ellipse cx="509" cy="114" rx="55" ry="15" fill="#EAF1FB" stroke="#0B0B0F" strokeWidth="1.5" />
        <path d="M454 139 C454 148 478.6 154 509 154 C539.4 154 564 148 564 139" stroke="#C9DAF2" strokeWidth="1.5" fill="none" />
        <text x="509" y="170" textAnchor="middle" fill="#0B0B0F" fontSize="11" fontWeight="600">
          Postgres
        </text>
      </g>

      {/* Traveling Request/Response Packet */}
      <g className="pl-anim pl-anim-packet pl-final-hidden">
        <rect x="132" y="128" width="20" height="20" rx="6" fill="#0047AB" />
        <circle cx="142" cy="138" r="3.5" fill="#FFFFFF" />
      </g>

      {/* Response Verified Tick on Client */}
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '172px 104px' }}>
        <circle cx="172" cy="104" r="12" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.5" />
        <path d="M167 104 L170.5 107.5 L177 101" stroke="#0B7A55" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Code & Latency Card Below */}
      <rect x="76" y="218" width="488" height="122" rx="14" fill="#0B0B0F" />
      <text x="98" y="246" fill="#7FA3DB" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)">
        GET /api/escrow/status · Sample
      </text>

      {/* Typed JSON Line */}
      <text x="98" y="274" fill="#FFFFFF" fontSize="13" fontFamily="var(--font-mono)">
        <tspan className="pl-anim pl-anim-type-1 pl-final-visible">{'{'}"status": </tspan>
        <tspan className="pl-anim pl-anim-type-2 pl-final-visible" fill="#BFE6D3">"ok"</tspan>
        <tspan className="pl-anim pl-anim-type-3 pl-final-visible">, "verified": true{'}'}</tspan>
      </text>

      {/* Latency Bar */}
      <text x="98" y="308" fill="#B7BCC6" fontSize="11" fontFamily="var(--font-mono)">
        Latency
      </text>
      <rect x="160" y="298" width="320" height="12" rx="6" fill="#1F2937" />
      <rect
        x="160"
        y="298"
        width="180"
        height="12"
        rx="6"
        fill="#0047AB"
        style={{ transformOrigin: '160px 304px' }}
        className="pl-anim pl-anim-bar-x pl-final-scale1"
      />
      <text x="494" y="308" fill="#E8F7EF" fontSize="11" fontWeight="600" fontFamily="var(--font-mono)" className="pl-anim pl-anim-verified pl-final-visible">
        200 OK
      </text>
    </SceneStageFrame>
  );
};

export default BackendScene;
