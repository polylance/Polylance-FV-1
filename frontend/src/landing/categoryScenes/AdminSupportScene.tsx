import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 3800;

/**
 * ADMIN & SUPPORT
 * - Operations sprint board & SLA resolution tickets ticking
 * - Clean calendar / milestone alignment
 */
export const AdminSupportScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`admin-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-adm-${categorySlug}`}
      className={className}
    >
      {/* Operations Board */}
      <rect x="76" y="56" width="488" height="288" rx="16" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      <rect x="76" y="56" width="488" height="44" rx="16" fill="#F5F6FA" />
      <line x1="76" y1="100" x2="564" y2="100" stroke="#E5E7EB" strokeWidth="1.5" />
      <text x="100" y="83" fill="#0B0B0F" fontSize="12.5" fontWeight="700">
        Operations Queue · Sample
      </text>

      {/* Task Row 1 */}
      <g className="pl-anim pl-anim-step-1 pl-final-visible" style={{ transformOrigin: '320px 142px' }}>
        <rect x="100" y="118" width="440" height="48" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="128" cy="142" r="10" fill="#0047AB" />
        <path d="M123.5 142 L127 145.5 L133 139.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="150" y="146" fill="#0B0B0F" fontSize="12" fontWeight="600">Sprint Milestones Synced</text>
        <rect x="446" y="130" width="76" height="24" rx="12" fill="#EAF1FB" />
        <text x="484" y="146" textAnchor="middle" fill="#0047AB" fontSize="10.5" fontWeight="700">Synced</text>
      </g>

      {/* Task Row 2 */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '320px 202px' }}>
        <rect x="100" y="178" width="440" height="48" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="128" cy="202" r="10" fill="#0047AB" />
        <path d="M123.5 202 L127 205.5 L133 199.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="150" y="206" fill="#0B0B0F" fontSize="12" fontWeight="600">Inbox &amp; Ticket Triage</text>
        <rect x="446" y="190" width="76" height="24" rx="12" fill="#EAF1FB" />
        <text x="484" y="206" textAnchor="middle" fill="#0047AB" fontSize="10.5" fontWeight="700">Active</text>
      </g>

      {/* Task Row 3: Verified Resolved */}
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '320px 266px' }}>
        <rect x="100" y="238" width="440" height="54" rx="10" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.2" />
        <circle cx="128" cy="265" r="11" fill="#0B7A55" />
        <path d="M123 265 L126.5 268.5 L133 262" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="150" y="269" fill="#0B7A55" fontSize="12.5" fontWeight="700">Weekly Delivery Confirmed</text>
        <text x="520" y="269" textAnchor="end" fill="#0B7A55" fontSize="11" fontWeight="700">Done</text>
      </g>
    </SceneStageFrame>
  );
};

export default AdminSupportScene;
