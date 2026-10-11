import React from 'react';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { LandingVisitor } from './LandingVisitor';
import { VideoModal, useVideoModal } from '../components/video';

export const Landing: React.FC = () => {
  const { jobs, profiles } = usePolyLanceData();
  const { activeVideoId, isOpen, closeVideo, triggerRef } = useVideoModal();

  return (
    <div className="w-full">
      {/* Show the PolyLance landing page for all users */}
      <LandingVisitor
        jobs={jobs}
        profiles={profiles}
      />

      {/* Shared accessible video modal */}
      <VideoModal
        id={activeVideoId}
        isOpen={isOpen}
        onClose={closeVideo}
        triggerRef={triggerRef}
      />
    </div>
  );
};

export default Landing;
