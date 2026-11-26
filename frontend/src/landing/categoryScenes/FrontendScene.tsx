import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * FRONTEND ("interface build")
 * - Browser frame starts as skeleton bars (app skeleton style)
 * - Blocks slide and resolve into layout (nav, hero, three cards)
 * - Cursor moves, clicks button -> pressed state -> small green checkmark
 * - Two small chips (real skill names from category) pop in beside browser
 */
export const FrontendScene: React.FC<CategorySceneProps> = ({
  categoryName,
  categorySlug,
  skills = [],
  playbackMode = 'interactive',
  isActive = true,
  forcedState,
  showReplayButton = true,
  className = '',
}) => {
  const skill1 = (skills[0] || 'React').slice(0, 14);
  const skill2 = (skills[1] || 'TypeScript').slice(0, 14);

  return (
    <SceneStageFrame
      sceneKey={`frontend-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-fe-${categorySlug}`}
      className={className}
    >
      {/* Browser Frame */}
      <rect x="64" y="54" width="396" height="292" rx="14" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="1.5" />
      {/* Browser Top Chrome */}
      <path d="M64 68C64 60.268 70.268 54 78 54H446C453.732 54 460 60.268 460 68V84H64V68Z" fill="#F5F6FA" />
      <line x1="64" y1="84" x2="460" y2="84" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="84" cy="69" r="3.5" fill="#B7BCC6" />
      <circle cx="96" cy="69" r="3.5" fill="#B7BCC6" />
      <circle cx="108" cy="69" r="3.5" fill="#B7BCC6" />
      <rect x="132" y="63" width="160" height="12" rx="6" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />

      {/* STAGE A: Skeleton Placeholder State (fades out) */}
      <g className="pl-anim pl-anim-skel-out pl-final-hidden">
        <rect x="86" y="102" width="120" height="14" rx="4" fill="#0B0B0F" />
        <line x1="86" y1="126" x2="438" y2="126" stroke="#0047AB" strokeWidth="2" />
        <rect x="86" y="142" width="352" height="58" rx="10" fill="#EEF4FD" stroke="#C9DAF2" strokeWidth="1.2" />
        <rect x="102" y="156" width="180" height="12" rx="4" fill="#7FA3DB" />
        <rect x="102" y="176" width="120" height="9" rx="3" fill="#A9C1E8" />
        <rect x="86" y="216" width="108" height="98" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <rect x="208" y="216" width="108" height="98" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <rect x="330" y="216" width="108" height="98" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
      </g>

      {/* STAGE B: Resolved UI Layout (Nav + Hero + 3 Cards) */}
      <g className="pl-anim pl-anim-ui-in pl-final-visible">
        {/* Nav row */}
        <rect x="86" y="100" width="24" height="14" rx="4" fill="#0047AB" />
        <rect x="118" y="103" width="54" height="8" rx="3" fill="#0B0B0F" />
        <rect x="324" y="103" width="38" height="8" rx="3" fill="#B7BCC6" />
        <rect x="372" y="103" width="38" height="8" rx="3" fill="#B7BCC6" />

        {/* Hero block */}
        <rect x="86" y="128" width="352" height="78" rx="10" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.2" />
        <rect x="104" y="144" width="170" height="12" rx="4" fill="#0B0B0F" />
        <rect x="104" y="164" width="130" height="8" rx="3" fill="#6B7280" />

        {/* Interactive CTA Button inside Hero */}
        <g className="pl-anim pl-anim-btn pl-final-scale1" style={{ transformOrigin: '374px 167px' }}>
          <rect x="326" y="151" width="94" height="32" rx="16" fill="#0047AB" />
          <text x="364" y="171" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="600">
            Deploy
          </text>
          {/* Green checkmark badge appears after click */}
          <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '414px 153px' }}>
            <circle cx="414" cy="153" r="9" fill="#0B7A55" stroke="#FFFFFF" strokeWidth="1.5" />
            <path d="M410 153 L413 156 L418 150.5" stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </g>
        </g>

        {/* Three Cards */}
        <rect x="86" y="220" width="108" height="104" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="108" cy="242" r="10" fill="#EAF1FB" />
        <rect x="98" y="262" width="76" height="9" rx="3" fill="#0B0B0F" />
        <rect x="98" y="278" width="58" height="7" rx="3" fill="#B7BCC6" />
        <rect x="98" y="298" width="44" height="12" rx="6" fill="#EAF1FB" />

        <rect x="208" y="220" width="108" height="104" rx="10" fill="#FFFFFF" stroke="#0047AB" strokeWidth="1.5" />
        <circle cx="230" cy="242" r="10" fill="#0047AB" />
        <rect x="220" y="262" width="76" height="9" rx="3" fill="#0B0B0F" />
        <rect x="220" y="278" width="64" height="7" rx="3" fill="#7FA3DB" />
        <rect x="220" y="298" width="48" height="12" rx="6" fill="#EEF4FD" />

        <rect x="330" y="220" width="108" height="104" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
        <circle cx="352" cy="242" r="10" fill="#EAF1FB" />
        <rect x="342" y="262" width="76" height="9" rx="3" fill="#0B0B0F" />
        <rect x="342" y="278" width="52" height="7" rx="3" fill="#B7BCC6" />
        <rect x="342" y="298" width="44" height="12" rx="6" fill="#F5F6FA" />
      </g>

      {/* Pointer Cursor clicking CTA button */}
      <g className="pl-anim pl-anim-cursor pl-final-hidden" style={{ transformOrigin: '382px 176px' }}>
        <path
          d="M380 172 L380 192 L385.5 187.5 L390 196 L393 194.5 L388.5 186 L395 185 Z"
          fill="#0B0B0F"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>

      {/* Two Real Skill Chips beside browser */}
      <g className="pl-anim pl-anim-step-4 pl-final-visible" style={{ transformOrigin: '532px 144px' }}>
        <rect x="478" y="126" width="110" height="36" rx="18" fill="#EAF1FB" stroke="#C9DAF2" strokeWidth="1.5" />
        <circle cx="496" cy="144" r="4" fill="#0047AB" />
        <text x="506" y="148" fill="#0047AB" fontSize="11.5" fontWeight="700">
          {skill1}
        </text>
      </g>

      <g className="pl-anim pl-anim-step-5 pl-final-visible" style={{ transformOrigin: '532px 198px' }}>
        <rect x="478" y="180" width="110" height="36" rx="18" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="496" cy="198" r="4" fill="#2F6BC9" />
        <text x="506" y="202" fill="#0B0B0F" fontSize="11.5" fontWeight="600">
          {skill2}
        </text>
      </g>

      {/* Shipped chip */}
      <g className="pl-anim pl-anim-verified pl-final-visible" style={{ transformOrigin: '532px 252px' }}>
        <rect x="478" y="234" width="110" height="34" rx="17" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.2" />
        <path d="M494 251 L497.5 254.5 L503 248" stroke="#0B7A55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <text x="510" y="255" fill="#0B7A55" fontSize="11.5" fontWeight="700">
          UI Ready
        </text>
      </g>
    </SceneStageFrame>
  );
};

export default FrontendScene;
