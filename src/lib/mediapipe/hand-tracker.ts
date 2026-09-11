import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { trackingConfig } from "@/lib/config/tracking";
import { canonicalizeHands } from "./canonicalize";

/** Loaded dynamically after camera readiness. No recognition or React dependencies. */
export async function createHandTracker() {
  const fileset = await FilesetResolver.forVisionTasks(trackingConfig.wasmRoot);
  const landmarker = await HandLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: trackingConfig.modelPath, delegate: "CPU" },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  let closed = false;
  let lastTimestampMs = -Infinity;
  return {
    detect(video: HTMLVideoElement, timestampMs: number) {
      if (closed || !Number.isFinite(timestampMs) || timestampMs <= lastTimestampMs) throw new Error("Invalid tracker lifecycle or timestamp");
      lastTimestampMs = timestampMs;
      const start = performance.now();
      const result = landmarker.detectForVideo(video, timestampMs);
      return { result: canonicalizeHands(result, timestampMs), latencyMs: performance.now() - start };
    },
    close() { if (!closed) { closed = true; landmarker.close(); } },
  };
}
