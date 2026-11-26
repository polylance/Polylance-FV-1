import React from 'react';
import { SceneStageFrame } from './SceneStageFrame';
import type { CategorySceneProps } from './types';

export const SCENE_DURATION_MS = 4200;

/**
 * MOBILE ("app flow")
 * - Phone outline whose screen starts as skeleton bars and resolves into an app screen
 * - Tap ripple lands on a button
 * - Screen transitions to a success card
 * - Notification banner slides in labeled "Sample"
 */
export const MobileScene: React.FC<CategorySceneProps> = ({
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
      sceneKey={`mobile-${categorySlug}`}
      title={categoryName}
      durationMs={SCENE_DURATION_MS}
      playbackMode={playbackMode}
      isActive={isActive}
      forcedState={forcedState}
      showReplayButton={showReplayButton}
      patternId={`hex-mob-${categorySlug}`}
      className={className}
    >
      {/* Supporting Left/Right Context Pills */}
      <g className="pl-anim pl-anim-step-2 pl-final-visible" style={{ transformOrigin: '130px 148px' }}>
        <rect x="64" y="130" width="132" height="36" rx="18" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="84" cy="148" r="4" fill="#0047AB" />
        <text x="96" y="152" fill="#0B0B0F" fontSize="11.5" fontWeight="600">iOS &amp; Android</text>
      </g>

      <g className="pl-anim pl-anim-step-3 pl-final-visible" style={{ transformOrigin: '510px 236px' }}>
        <rect x="444" y="218" width="132" height="36" rx="18" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="464" cy="236" r="4" fill="#2F6BC9" />
        <text x="476" y="240" fill="#0B0B0F" fontSize="11.5" fontWeight="600">60fps Native</text>
      </g>

      {/* Phone Outer Shell */}
      <rect x="228" y="34" width="184" height="332" rx="28" fill="#FFFFFF" stroke="#0B0B0F" strokeWidth="2" />
      <rect x="238" y="46" width="164" height="308" rx="20" fill="#F5F6FA" stroke="#E5E7EB" strokeWidth="1" />
      {/* Top Speaker Notch */}
      <rect x="296" y="54" width="48" height="6" rx="3" fill="#0B0B0F" />

      {/* STAGE A: Skeleton Bars inside Phone (fades out) */}
      <g className="pl-anim pl-anim-skel-out pl-final-hidden">
        <rect x="254" y="82" width="90" height="12" rx="4" fill="#0B0B0F" />
        <line x1="254" y1="104" x2="386" y2="104" stroke="#0047AB" strokeWidth="2" />
        <rect x="254" y="120" width="132" height="58" rx="10" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
        <rect x="254" y="190" width="132" height="58" rx="10" fill="#EEF4FD" stroke="#C9DAF2" strokeWidth="1" />
        <rect x="254" y="294" width="132" height="34" rx="17" fill="#B7BCC6" />
      </g>

      {/* STAGE B: Active App Screen before Tap */}
      <g className="pl-anim pl-anim-ui-in pl-final-hidden">
        <g className="pl-anim pl-anim-screen-out pl-final-hidden">
          <rect x="252" y="84" width="136" height="168" rx="12" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
          <circle cx="276" cy="110" r="12" fill="#EAF1FB" />
          <rect x="296" y="102" width="74" height="10" rx="3" fill="#0B0B0F" />
          <rect x="296" y="118" width="52" height="7" rx="3" fill="#6B7280" />
          <rect x="266" y="142" width="108" height="64" rx="8" fill="#F5F6FA" />
          {/* Tap Target Button */}
          <rect x="252" y="274" width="136" height="38" rx="19" fill="#0047AB" />
          <text x="320" y="297" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontWeight="600">
            Approve Step
          </text>
          {/* Tap Ripple */}
          <circle
            cx="320"
            cy="293"
            r="18"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            style={{ transformOrigin: '320px 293px' }}
            className="pl-anim pl-anim-ripple pl-final-hidden"
          />
        </g>
      </g>

      {/* STAGE C: Success Card Final Screen */}
      <g className="pl-anim pl-anim-step-4 pl-final-visible" style={{ transformOrigin: '320px 210px' }}>
        <rect x="252" y="128" width="136" height="172" rx="14" fill="#FFFFFF" stroke="#BFE6D3" strokeWidth="1.5" />
        <circle cx="320" cy="176" r="24" fill="#E8F7EF" stroke="#BFE6D3" strokeWidth="1.5" />
        <path d="M309 176 L316.5 183.5 L331 169" stroke="#0B7A55" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="276" y="216" width="88" height="10" rx="4" fill="#0B0B0F" />
        <rect x="288" y="234" width="64" height="8" rx="3" fill="#6B7280" />
        <rect x="272" y="258" width="96" height="24" rx="12" fill="#E8F7EF" />
        <text x="320" y="274" textAnchor="middle" fill="#0B7A55" fontSize="11" fontWeight="700">
          Completed
        </text>
      </g>

      {/* Top Slide-In Notification Banner labeled Sample */}
      <g className="pl-anim pl-anim-banner pl-final-visible" style={{ transformOrigin: '320px 84px' }}>
        <rect x="246" y="68" width="148" height="38" rx="10" fill="#0B0B0F" />
        <circle cx="264" cy="87" r="7" fill="#0047AB" />
        <text x="278" y="84" fill="#FFFFFF" fontSize="10" fontWeight="700">
          Milestone Paid
        </text>
        <text x="278" y="96" fill="#A9C1E8" fontSize="8.5" fontFamily="var(--font-mono)">
          Sample Notification
        </text>
      </g>

      {/* Bottom Home Indicator */}
      <rect x="294" y="340" width="52" height="4" rx="2" fill="#0B0B0F" />
    </SceneStageFrame>
  );
};

export default MobileScene;
