// Global video playback coordinator: ensures only one video plays at a time across the entire application.

type StopCallback = () => void;
const activePlayers = new Map<string, StopCallback>();

export function registerPlayingVideo(id: string, pauseFn: StopCallback): () => void {
  // Pause any other actively playing video
  activePlayers.forEach((pauseOther, otherId) => {
    if (otherId !== id) {
      try {
        pauseOther();
      } catch (err) {
        console.error('[PlaybackCoordinator] Error pausing other player:', err);
      }
    }
  });

  activePlayers.set(id, pauseFn);

  return () => {
    if (activePlayers.get(id) === pauseFn) {
      activePlayers.delete(id);
    }
  };
}

export function pauseAllVideos(): void {
  activePlayers.forEach((pause) => {
    try {
      pause();
    } catch {}
  });
  activePlayers.clear();
}
