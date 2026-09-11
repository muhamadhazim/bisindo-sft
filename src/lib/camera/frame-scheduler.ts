export type VideoFrameTick = { timestampMs: number; mediaTimeMs: number };

/** At most one callback in flight. Decoded frame identity stays separate from wall time. */
export function scheduleVideoFrames(
  video: HTMLVideoElement,
  onFrame: (frame: VideoFrameTick) => void | Promise<void>,
  onError: () => void,
  minIntervalMs = 80,
): () => void {
  let active = true;
  let handle = 0;
  let lastMediaTime = -1;
  let lastTimestamp = -Infinity;
  const useVideoCallback = typeof video.requestVideoFrameCallback === "function";

  function schedule() {
    if (!active) return;
    handle = useVideoCallback
      ? video.requestVideoFrameCallback((now, metadata) => { void tick(now, metadata.mediaTime); })
      : requestAnimationFrame((now) => { void tick(now, video.currentTime); });
  }

  async function tick(timestampMs: number, mediaTime: number) {
    if (!active) return;
    if (video.readyState >= 2 && mediaTime !== lastMediaTime && timestampMs - lastTimestamp >= minIntervalMs) {
      lastMediaTime = mediaTime;
      lastTimestamp = timestampMs;
      try { await onFrame({ timestampMs, mediaTimeMs: mediaTime * 1000 }); }
      catch { active = false; onError(); return; }
    }
    schedule();
  }

  schedule();
  return () => {
    active = false;
    if (useVideoCallback) video.cancelVideoFrameCallback(handle);
    else cancelAnimationFrame(handle);
  };
}
