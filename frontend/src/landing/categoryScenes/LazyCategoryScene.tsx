import React, { Suspense } from 'react';
import type { CategorySceneDescriptor, CategorySceneProps, SceneKey } from './types';

const LAZY_SCENE_COMPONENTS: Record<
  SceneKey,
  React.LazyExoticComponent<React.ComponentType<CategorySceneProps>>
> = {
  web3: React.lazy(() => import('./Web3Scene')),
  frontend: React.lazy(() => import('./FrontendScene')),
  backend: React.lazy(() => import('./BackendScene')),
  mobile: React.lazy(() => import('./MobileScene')),
  design: React.lazy(() => import('./DesignScene')),
  'data-ai': React.lazy(() => import('./DataAiScene')),
  'data-analytics': React.lazy(() => import('./DataAnalyticsScene')),
  devops: React.lazy(() => import('./DevOpsScene')),
  security: React.lazy(() => import('./SecurityScene')),
  'content-writing': React.lazy(() => import('./ContentWritingScene')),
  marketing: React.lazy(() => import('./MarketingScene')),
  creators: React.lazy(() => import('./CreatorsScene')),
  'video-motion': React.lazy(() => import('./VideoMotionScene')),
  qa: React.lazy(() => import('./QaTestingScene')),
  'admin-support': React.lazy(() => import('./AdminSupportScene')),
  generic: React.lazy(() => import('./GenericScene')),
};

export interface LazyCategorySceneProps extends CategorySceneProps {
  descriptor: CategorySceneDescriptor;
}

const StageLoadingFallback: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-full aspect-[16/10] rounded-[14px] border border-[#E5E7EB] bg-[#FFFFFF] flex items-center justify-center ${className}`}
    aria-hidden="true"
  >
    <div className="w-3/4 space-y-3">
      <div className="h-4 w-1/3 rounded bg-[#F5F6FA] border border-[#E5E7EB]" />
      <div className="h-24 w-full rounded-[10px] bg-[#EAF1FB]/60 border border-[#C9DAF2]" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-8 rounded bg-[#F5F6FA]" />
        <div className="h-8 rounded bg-[#F5F6FA]" />
      </div>
    </div>
  </div>
);

export const LazyCategoryScene: React.FC<LazyCategorySceneProps> = ({
  descriptor,
  className = '',
  ...sceneProps
}) => {
  const SceneComponent = LAZY_SCENE_COMPONENTS[descriptor.key] || LAZY_SCENE_COMPONENTS.generic;

  return (
    <Suspense fallback={<StageLoadingFallback className={className} />}>
      <SceneComponent {...sceneProps} className={className} />
    </Suspense>
  );
};

export default LazyCategoryScene;
