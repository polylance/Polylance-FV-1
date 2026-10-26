import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolyLanceData } from '../context/PolyLanceDataContext';
import { LandingVisitor } from './LandingVisitor';
import { VideoModal, useVideoModal } from '../components/video';
import { Seo } from '../components/seo/Seo';

export const Landing: React.FC = () => {
  const { jobs, profiles } = usePolyLanceData();
  const { activeVideoId, isOpen, closeVideo, openVideo, triggerRef } = useVideoModal();
  const navigate = useNavigate();

  // Instant redirect for legacy landing hashes (#how-it-works, #simulator, #product-tour)
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#how-it-works' || hash === '#product-tour') {
      navigate('/how-it-works', { replace: true });
    } else if (hash === '#simulator') {
      navigate('/escrow-simulator', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="w-full">
      <Seo routeKey="/" />
      {/* Show the PolyLance landing page for all users */}
      <LandingVisitor
        jobs={jobs}
        profiles={profiles}
        onOpenVideo={openVideo}
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
