import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Subtitles, ChevronDown, ChevronUp, AlertCircle 
} from 'lucide-react';
import { VideoManifestEntry } from '../../media';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useDataSaver } from '../../media/useDataSaver';
import { registerPlayingVideo } from '../../media/playbackCoordinator';

export interface VideoPlayerProps {
  entry: VideoManifestEntry;
  className?: string;
  autoPlayAmbient?: boolean;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  entry,
  className = '',
  autoPlayAmbient = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const reducedMotion = useReducedMotion();
  const dataSaver = useDataSaver();

  // Standard player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(entry.durationSeconds || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);

  // Preference persistence
  const [isMuted, setIsMuted] = useState(() => {
    try {
      return localStorage.getItem('polylance_video_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [captionsEnabled, setCaptionsEnabled] = useState(() => {
    try {
      const stored = localStorage.getItem('polylance_video_captions');
      if (stored !== null) return stored === 'true';
      return entry.captions && entry.captions.length > 0;
    } catch {
      return true;
    }
  });

  // Track if ambient video is manually paused by user
  const [ambientPausedByUser, setAmbientPausedByUser] = useState(false);

  const isVertical = entry.aspect === '9:16';
  const aspectClass = isVertical ? 'aspect-[9/16]' : 'aspect-video';
  const isAmbient = entry.type === 'ambient';

  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // ── AMBIENT PLAYBACK OBSERVATION & LIFECYCLE ──
  useEffect(() => {
    if (!isAmbient || !autoPlayAmbient || reducedMotion || dataSaver) return;

    const el = containerRef.current;
    const vid = videoRef.current;
    if (!el || !vid) return;

    let inView = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
          if (inView && !ambientPausedByUser && document.visibilityState === 'visible') {
            vid.play().catch(() => {});
          } else {
            vid.pause();
          }
        });
      },
      { threshold: [0, 0.5, 1] }
    );

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        vid.pause();
      } else if (inView && !ambientPausedByUser) {
        vid.play().catch(() => {});
      }
    };

    observer.observe(el);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAmbient, autoPlayAmbient, reducedMotion, dataSaver, ambientPausedByUser]);

  // ── GLOBAL PLAYBACK COORDINATION (Only one video plays at once) ──
  useEffect(() => {
    if (!isPlaying) return;

    const unregister = registerPlayingVideo(entry.id, () => {
      if (videoRef.current) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    });

    return unregister;
  }, [isPlaying, entry.id]);

  // ── TOGGLE PLAY/PAUSE ──
  const togglePlay = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;

    if (vid.paused || vid.ended) {
      vid.play().then(() => {
        setIsPlaying(true);
        setHasStarted(true);
        if (isAmbient) setAmbientPausedByUser(false);
      }).catch((err) => {
        console.warn('[VideoPlayer] Play interrupted:', err);
      });
    } else {
      vid.pause();
      setIsPlaying(false);
      if (isAmbient) setAmbientPausedByUser(true);
    }
  }, [isAmbient]);

  // ── TOGGLE MUTE ──
  const toggleMute = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    setIsMuted(nextMuted);
    try {
      localStorage.setItem('polylance_video_muted', String(nextMuted));
    } catch {}
  };

  // ── TOGGLE CAPTIONS ──
  const toggleCaptions = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const nextCaptions = !captionsEnabled;
    setCaptionsEnabled(nextCaptions);
    try {
      localStorage.setItem('polylance_video_captions', String(nextCaptions));
    } catch {}

    // Update text tracks
    for (let i = 0; i < vid.textTracks.length; i++) {
      vid.textTracks[i].mode = nextCaptions ? 'showing' : 'hidden';
    }
  };

  // ── CYCLE SPEED ──
  const cyclePlaybackRate = () => {
    const vid = videoRef.current;
    if (!vid) return;
    const speeds = [0.75, 1, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    vid.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  // ── SEEK ──
  const seekRelative = (delta: number) => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.currentTime = Math.max(0, Math.min(vid.duration || duration, vid.currentTime + delta));
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vid = videoRef.current;
    if (!vid) return;
    const target = parseFloat(e.target.value);
    vid.currentTime = target;
    setCurrentTime(target);
  };

  // ── FULLSCREEN ──
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // ── KEYBOARD SHORTCUTS ──
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isAmbient) return;
    const key = e.key.toLowerCase();

    if (key === ' ' || key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (key === 'm') {
      e.preventDefault();
      toggleMute();
    } else if (key === 'c') {
      e.preventDefault();
      toggleCaptions();
    } else if (key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (key === 'arrowleft') {
      e.preventDefault();
      seekRelative(-5);
    } else if (key === 'arrowright') {
      e.preventDefault();
      seekRelative(5);
    }
  };

  // If entry has an embed URL (YouTube nocookie / Vimeo facade)
  if (entry.embed) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div
          className={`relative w-full ${aspectClass} bg-[#0B0B0F] border border-[#E5E7EB] rounded-[12px] overflow-hidden`}
        >
          {!isIframeLoaded ? (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer group"
              onClick={() => setIsIframeLoaded(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsIframeLoaded(true)}
              aria-label={`Play ${entry.title}`}
            >
              <img
                src={entry.poster}
                alt=""
                className="w-full h-full object-cover opacity-80 group-hover:opacity-90 transition-opacity"
              />
              <div className="absolute w-16 h-16 rounded-full bg-[#0047AB] text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <Play size={24} className="fill-white ml-1" />
              </div>
            </div>
          ) : (
            <iframe
              src={entry.embed}
              title={entry.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-[#4B5563]">
          <span className="font-semibold text-[#0B0B0F]">{entry.title}</span>
          <span className="font-mono">{entry.durationSeconds}s</span>
        </div>
      </div>
    );
  }

  // Graceful error state
  if (hasError) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className={`relative w-full ${aspectClass} bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] overflow-hidden p-6 flex flex-col items-center justify-center text-center space-y-2`}>
          <AlertCircle size={28} className="text-[#6B7280]" />
          <h4 className="font-sans font-semibold text-sm text-[#0B0B0F]">Video currently unavailable</h4>
          <p className="text-xs text-[#4B5563] max-w-sm">
            {entry.transcript ? 'The media file could not be loaded. You can read the full transcript below.' : 'Please check back shortly.'}
          </p>
        </div>
        {entry.transcript && (
          <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-[8px] p-3 text-xs text-[#4B5563]">
            <p className="font-medium text-[#0B0B0F] mb-1">Transcript:</p>
            <p>{entry.transcript}</p>
          </div>
        )}
      </div>
    );
  }

  // ── AMBIENT PLAYER ──
  if (isAmbient) {
    // If reduced motion or data saver is active, show poster only
    if (reducedMotion || dataSaver) {
      return (
        <div
          ref={containerRef}
          className={`relative w-full ${aspectClass} bg-[#F6F7F9] border border-[#E5E7EB] rounded-[12px] overflow-hidden ${className}`}
          aria-hidden="true"
        >
          <img
            src={entry.poster}
            alt={entry.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className={`relative w-full ${aspectClass} bg-[#0B0B0F] border border-[#E5E7EB] rounded-[12px] overflow-hidden group ${className}`}
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          poster={entry.poster}
          preload="none"
          className="w-full h-full object-cover pointer-events-none"
          onError={() => setHasError(true)}
        >
          {entry.sources.webm && <source src={entry.sources.webm} type="video/webm" />}
          {entry.sources.mp4 && <source src={entry.sources.mp4} type="video/mp4" />}
        </video>

        {/* WCAG 2.2.2 Pause/Play control (visible on hover and focus) */}
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause ambient video" : "Play ambient video"}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-[#0B0B0F]/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:ring-[#0047AB] transition-opacity cursor-pointer z-20"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
        </button>
      </div>
    );
  }

  // ── STANDARD PLAYER ──
  return (
    <div className={`space-y-3 ${className}`}>
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className={`relative w-full ${aspectClass} bg-[#0B0B0F] border border-[#E5E7EB] rounded-[12px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB] group select-none`}
        aria-label={entry.title}
      >
        <video
          ref={videoRef}
          playsInline
          poster={entry.poster}
          preload="none"
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) setDuration(videoRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
          onError={() => setHasError(true)}
        >
          {entry.sources.webm && <source src={entry.sources.webm} type="video/webm" />}
          {entry.sources.mp4 && <source src={entry.sources.mp4} type="video/mp4" />}
          {entry.captions?.map((c) => (
            <track
              key={c.src}
              kind="subtitles"
              src={c.src}
              srcLang={c.lang}
              label={c.label}
              default={c.lang === 'en' && captionsEnabled}
            />
          ))}
        </video>

        {/* Initial Large Play Button Overlay */}
        {!hasStarted && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer bg-black/20 group-hover:bg-black/10 transition-colors z-20"
            onClick={togglePlay}
            role="button"
            tabIndex={-1}
          >
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-[#0047AB] text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Play size={24} className="fill-white ml-1" />
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        {hasStarted && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 sm:p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-20 space-y-2">
            
            {/* Scrub bar */}
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleScrub}
              aria-label="Seek video position"
              className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#0047AB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0047AB]"
            />

            {/* Controls row */}
            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-3">
                {/* Play / Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  aria-label={isPlaying ? "Pause (Space/K)" : "Play (Space/K)"}
                  className="p-1 hover:text-[#93C5FD] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                {/* Time Display */}
                <span className="font-mono text-[11px] text-[#D1D5DB]">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Captions Toggle */}
                {entry.captions && entry.captions.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleCaptions}
                    aria-label="Toggle captions (C)"
                    className={`p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white ${
                      captionsEnabled ? 'text-[#0047AB] bg-white' : 'text-white hover:text-[#93C5FD]'
                    }`}
                  >
                    <Subtitles size={15} />
                  </button>
                )}

                {/* Speed Selector */}
                <button
                  type="button"
                  onClick={cyclePlaybackRate}
                  aria-label="Change playback speed"
                  className="px-1.5 py-0.5 rounded font-mono text-[11px] bg-white/20 hover:bg-white/30 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                >
                  {playbackRate}x
                </button>

                {/* Mute Toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute (M)" : "Mute (M)"}
                  className="p-1 hover:text-[#93C5FD] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
                  className="p-1 hover:text-[#93C5FD] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white rounded"
                >
                  {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info & Transcript Row */}
      <div className="space-y-2 text-left">
        <div className="flex items-center justify-between text-xs text-[#4B5563]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#0B0B0F]">{entry.title}</span>
            <span className="font-mono text-[11px] bg-[#F6F7F9] border border-[#E5E7EB] px-1.5 py-0.5 rounded-[4px]">
              {entry.durationSeconds}s
            </span>
          </div>
          {entry.transcript && (
            <button
              type="button"
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-[#0047AB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>{showTranscript ? 'Hide transcript' : 'Read transcript'}</span>
              {showTranscript ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        <p className="text-xs text-[#4B5563] leading-relaxed">
          {entry.summary}
        </p>

        {/* Expandable Transcript */}
        {showTranscript && entry.transcript && (
          <div className="p-3 bg-[#F6F7F9] border border-[#E5E7EB] rounded-[8px] text-xs text-[#4B5563] leading-relaxed">
            <div className="font-semibold text-[#0B0B0F] mb-1">Full Transcript:</div>
            <p>{entry.transcript}</p>
          </div>
        )}
      </div>
    </div>
  );
};
