// Engineering tracking thresholds, not BISINDO correctness thresholds.
export const trackingConfig = {
  packageVersion: "1.0.1",
  assetId: "mediapipe-hand-landmarker-float16-v1",
  modelPath: "/models/mediapipe/hand_landmarker-float16-v1.task",
  wasmRoot: "/models/mediapipe/tasks-vision-1.0.1/wasm",
  minHandednessScore: 0.7,
  minCategoryMargin: 0.2,
  minIntervalMs: 80,
  statusIntervalMs: 250,
} as const;
