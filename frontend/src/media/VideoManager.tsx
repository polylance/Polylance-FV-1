import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from './useDataSaver';
import { useDataSaver } from './useDataSaver';

export type VideoState = 'idle' | 'near' | 'playing' | 'paused' | 'released';

export interface VideoSlotStateInfo {
  id: string;
  state: VideoState;
  loops: number;
  lastActiveTime: number;
  bytesEstimated: number;
}

interface VideoManagerContextType {
  activeVideoId: string | null;
  requestPlay: (id: string, playCallback: () => void, pauseCallback: () => void) => boolean;
  releaseVideo: (id: string) => void;
  updateState: (id: string, state: VideoState, bytesDelta?: number) => void;
  incrementLoop: (id: string) => number;
  canAutoplay: boolean;
  isDevHUDVisible: boolean;
  toggleDevHUD: () => void;
  slotStates: Record<string, VideoSlotStateInfo>;
  totalDownloadedBytes: number;
}

const VideoManagerContext = createContext<VideoManagerContextType | null>(null);

export const VideoManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [slotStates, setSlotStates] = useState<Record<string, VideoSlotStateInfo>>({});
  const [totalDownloadedBytes, setTotalDownloadedBytes] = useState(0);
  const [isDevHUDVisible, setIsDevHUDVisible] = useState(false);

  const reducedMotion = useReducedMotion();
  const dataSaver = useDataSaver();

  // Network connection check (2g / 3g / saveData)
  const isSlowConnection = typeof navigator !== 'undefined' && (
    // @ts-ignore
    navigator.connection?.saveData ||
    // @ts-ignore
    ['slow-2g', '2g', '3g'].includes(navigator.connection?.effectiveType)
  );

  const canAutoplay = !reducedMotion && !dataSaver && !isSlowConnection;

  // Active play callbacks to pause previous player
  const activeCallbacks = useRef<Map<string, () => void>>(new Map());

  const updateState = useCallback((id: string, state: VideoState, bytesDelta: number = 0) => {
    setSlotStates((prev) => {
      const existing = prev[id] || {
        id,
        state: 'idle',
        loops: 0,
        lastActiveTime: Date.now(),
        bytesEstimated: 0,
      };

      return {
        ...prev,
        [id]: {
          ...existing,
          state,
          lastActiveTime: Date.now(),
          bytesEstimated: existing.bytesEstimated + bytesDelta,
        },
      };
    });

    if (bytesDelta > 0) {
      setTotalDownloadedBytes((b) => b + bytesDelta);
    }
  }, []);

  const incrementLoop = useCallback((id: string): number => {
    let nextLoops = 1;
    setSlotStates((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      nextLoops = existing.loops + 1;
      return {
        ...prev,
        [id]: {
          ...existing,
          loops: nextLoops,
        },
      };
    });
    return nextLoops;
  }, []);

  const requestPlay = useCallback((id: string, playCallback: () => void, pauseCallback: () => void): boolean => {
    // Single active video rule: Pause and release previous video
    activeCallbacks.current.forEach((pauseFn, otherId) => {
      if (otherId !== id) {
        try {
          pauseFn();
        } catch (err) {
          console.warn('[VideoManager] Error pausing video:', otherId, err);
        }
        updateState(otherId, 'released');
      }
    });

    activeCallbacks.current.clear();
    activeCallbacks.current.set(id, pauseCallback);
    setActiveVideoId(id);

    try {
      playCallback();
      updateState(id, 'playing');
      return true;
    } catch (err) {
      console.warn('[VideoManager] Play failed for video:', id, err);
      return false;
    }
  }, [updateState]);

  const releaseVideo = useCallback((id: string) => {
    const pauseFn = activeCallbacks.current.get(id);
    if (pauseFn) {
      try {
        pauseFn();
      } catch {}
      activeCallbacks.current.delete(id);
    }
    if (activeVideoId === id) {
      setActiveVideoId(null);
    }
    updateState(id, 'released');
  }, [activeVideoId, updateState]);

  const toggleDevHUD = useCallback(() => {
    setIsDevHUDVisible((v) => !v);
  }, []);

  // Performance HUD in dev mode
  const activeCount = Object.values(slotStates).filter((s) => s.state === 'playing').length;
  const releasedCount = Object.values(slotStates).filter((s) => s.state === 'released').length;

  const [isDiagnosticsEnabled, setIsDiagnosticsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('polylance_media_diagnostics') === 'true';
  });

  useEffect(() => {
    const handleDiagnosticsChange = () => {
      setIsDiagnosticsEnabled(localStorage.getItem('polylance_media_diagnostics') === 'true');
    };
    window.addEventListener('storage', handleDiagnosticsChange);
    window.addEventListener('polylance_diagnostics_changed', handleDiagnosticsChange);
    return () => {
      window.removeEventListener('storage', handleDiagnosticsChange);
      window.removeEventListener('polylance_diagnostics_changed', handleDiagnosticsChange);
    };
  }, []);

  return (
    <VideoManagerContext.Provider
      value={{
        activeVideoId,
        requestPlay,
        releaseVideo,
        updateState,
        incrementLoop,
        canAutoplay,
        isDevHUDVisible,
        toggleDevHUD,
        slotStates,
        totalDownloadedBytes,
      }}
    >
      {children}

      {/* Media Diagnostics HUD: Render ONLY in DEV mode when explicitly enabled in Settings > Developer */}
      {isDiagnosticsEnabled && import.meta.env.DEV && (
        <aside
          role="complementary"
          aria-label="Video Manager HUD"
          className="fixed bottom-3 right-3 z-50 font-sans text-xs bg-[#0B0B0F]/95 text-white border border-gray-700 rounded-[8px] shadow-lg max-w-sm overflow-hidden"
        >
          <div 
            onClick={toggleDevHUD}
            className="px-3 py-1.5 bg-black/60 flex items-center justify-between cursor-pointer border-b border-gray-800"
          >
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${activeCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-gray-400'}`} />
              <span className="font-semibold text-gray-200">VideoManager HUD</span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              {activeCount} active • {releasedCount} rel
            </span>
          </div>

          {isDevHUDVisible && (
            <div data-lenis-prevent="true" className="p-3 space-y-2 max-h-60 overflow-y-auto overscroll-contain custom-scrollbar">
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>Autoplay allowed:</span>
                <span className={canAutoplay ? 'text-emerald-400' : 'text-amber-400'}>
                  {canAutoplay ? 'Yes' : 'Blocked (Saver/Motion)'}
                </span>
              </div>
              <div className="flex justify-between text-gray-400 text-[11px]">
                <span>Est. downloaded:</span>
                <span className="text-gray-200 font-mono">
                  {(totalDownloadedBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              <div className="pt-2 border-t border-gray-800 space-y-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Registered Slots:</div>
                {Object.keys(slotStates).length === 0 ? (
                  <div className="text-gray-500 italic text-[11px]">No active video slots</div>
                ) : (
                  Object.values(slotStates).map((s) => (
                    <div key={s.id} className="flex items-center justify-between font-mono text-[10px]">
                      <span className="truncate max-w-[140px] text-gray-300">{s.id}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] ${
                        s.state === 'playing' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        s.state === 'near' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                        s.state === 'paused' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {s.state} (l:{s.loops})
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      )}
    </VideoManagerContext.Provider>
  );
};

export const useVideoManager = () => {
  const context = useContext(VideoManagerContext);
  if (!context) {
    // Graceful fallback for non-provider usage
    return {
      activeVideoId: null,
      requestPlay: (_id: string, play: () => void) => { play(); return true; },
      releaseVideo: () => {},
      updateState: () => {},
      incrementLoop: () => 1,
      canAutoplay: true,
      isDevHUDVisible: false,
      toggleDevHUD: () => {},
      slotStates: {},
      totalDownloadedBytes: 0,
    };
  }
  return context;
};
