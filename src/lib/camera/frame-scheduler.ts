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
    // `loadedmetadata` can fire before the browser has a drawable decoded frame.
    // MediaPipe throws for that short window, so only hand a frame to consumers
    // after video dimensions and current frame data are both available.
    const hasDrawableFrame = video.readyState >= 2
      && video.videoWidth > 0
      && video.videoHeight > 0
      && !video.paused
      && !video.ended;
    if (hasDrawableFrame && mediaTime !== lastMediaTime && timestampMs - lastTimestamp >= minIntervalMs) {
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
