import { expect, test } from "@playwright/test";
import { extractFeatures, featureSchema } from "../../features/recognition/features";
import { RecognitionStabilizer } from "../../features/recognition/stabilizer";
import type { CanonicalHand, HandFrame } from "../../types/tracking";
import type { SignContent } from "../../types/content";
import { RuleRecognitionEngine, type RuleProfile } from "../../features/recognition/rule-engine";

// Deliberately synthetic geometry, not a BISINDO letter or a correctness reference.
function fixture(): HandFrame {
  const worldLandmarks = Array.from({ length: 21 }, (_, index) => ({ x: Math.sin(index + 0.2) * 0.03, y: index * 0.004, z: Math.cos(index) * 0.005 }));
  const hand: CanonicalHand = { side: "RIGHT", handednessScore: 0.99, landmarks: worldLandmarks.map(() => ({ x: 0.5, y: 0.5, z: 0 })), worldLandmarks };
  return { timestampMs: 0, left: null, right: hand };
}

const syntheticTarget: SignContent = {
  id: "synthetic-test-shape", symbol: "TEST", language: "BISINDO", region: null,
  sourceId: "synthetic-test-only", validationStatus: "SOURCE_VERIFIED", requiredHands: "ONE",
  handednessPolicy: "RIGHT", motionType: "STATIC", instruction: "Test fixture only",
  commonMistakes: [], referenceAssetIds: [],
};
function testProfile(): RuleProfile {
  return {
    signId: syntheticTarget.id, version: "test-only", featureSchema: featureSchema.id,
    normalizationVersion: featureSchema.normalizationVersion, landmarkerAssetId: featureSchema.landmarkerAssetId,
    inputLength: featureSchema.length, validationStatus: "SOURCE_VERIFIED", sourceIds: [syntheticTarget.sourceId],
    bounds: [{ index: 51, min: 1, max: 1 }],
  };
}

test("profile metadata mismatches and malformed bounds fail before recognition", () => {
  for (const overrides of [{ featureSchema: "wrong" }, { normalizationVersion: "wrong" }, { landmarkerAssetId: "wrong" }, { inputLength: 126 }, { bounds: [{ index: 52, min: 0, max: 1 }] }, { bounds: [{ index: 0, min: 2, max: 1 }] }, { sourceIds: [] }]) {
    expect(() => new RuleRecognitionEngine([{ ...testProfile(), ...overrides }])).toThrow();
  }
});

test("empty, draft and overlapping profiles never force a letter match", () => {
  for (const profiles of [[], [{ ...testProfile(), validationStatus: "DRAFT" as const }], [testProfile(), { ...testProfile(), signId: "other-test-shape" }]]) {
    const engine = new RuleRecognitionEngine(profiles);
    for (const timestampMs of [0, 100, 200, 300, 400, 500]) {
      const result = engine.evaluate({ frame: { ...fixture(), timestampMs }, ambiguous: false }, syntheticTarget);
      expect(result.status).toBe("UNCERTAIN"); expect(result.accepted).toBe(false);
    }
  }
});

test("target-aware source-linked match stabilizes; unsupported source and dynamic targets stay uncertain", () => {
  const engine = new RuleRecognitionEngine([testProfile()]);
  for (const timestampMs of [0, 100, 200, 300]) expect(engine.evaluate({ frame: { ...fixture(), timestampMs }, ambiguous: false }, syntheticTarget).accepted).toBe(false);
  expect(engine.evaluate({ frame: { ...fixture(), timestampMs: 400 }, ambiguous: false }, syntheticTarget)).toMatchObject({ status: "CORRECT", accepted: true, predictedSignId: syntheticTarget.id });
  for (const overrides of [{ sourceId: "unreviewed-source" }, { motionType: "DYNAMIC" as const }]) {
    expect(new RuleRecognitionEngine([testProfile()]).evaluate({ frame: fixture(), ambiguous: false }, { ...syntheticTarget, ...overrides }).status).toBe("UNCERTAIN");
  }
});

test("schema ordering and missing-hand policy are deterministic; geometry ignores world translation/scale", () => {
  const frame = fixture();
  const vector = extractFeatures(frame)!;
  expect(vector).toHaveLength(featureSchema.length);
  expect(vector.slice(0, 25)).toEqual(Array(25).fill(0));
  expect(vector.slice(-2)).toEqual([0, 1]);
  const transformed = fixture();
  transformed.right!.worldLandmarks = transformed.right!.worldLandmarks!.map((point) => ({ x: point.x * 2 + 10, y: point.y * 2 - 4, z: point.z * 2 + 1 }));
  const other = extractFeatures(transformed)!;
  vector.forEach((value, index) => expect(other[index]).toBeCloseTo(value, 8));
  expect(extractFeatures(frame)).toEqual(vector);
});

test("invalid, cropped, or missing world landmarks cannot produce guessed features", () => {
  const frame = fixture();
  frame.right!.landmarks[0]!.x = -0.01;
  expect(extractFeatures(frame)).toBeNull();
  const missing = fixture(); delete missing.right!.worldLandmarks;
  expect(extractFeatures(missing)).toBeNull();
  const zero = fixture(); zero.right!.worldLandmarks = Array.from({ length: 21 }, () => ({ x: 0, y: 0, z: 0 }));
  expect(extractFeatures(zero)).toBeNull();
});

test("acceptance uses elapsed time at different frame rates and emits once", () => {
  for (const step of [40, 100, 125]) {
    const stabilizer = new RecognitionStabilizer();
    const accepted: number[] = [];
    for (let time = 0; time <= 1500; time += step) if (stabilizer.update("test-target", time, "MATCH").accepted) accepted.push(time);
    expect(accepted).toHaveLength(1);
    expect(accepted[0]).toBeGreaterThanOrEqual(400);
    expect(accepted[0]).toBeLessThan(400 + step);
  }
});

test("gaps, uncertain frames and reversed timestamps cannot complete a stale match", () => {
  const stabilizer = new RecognitionStabilizer();
  stabilizer.update("test", 0, "MATCH"); stabilizer.update("test", 200, "MATCH");
  expect(stabilizer.update("test", 1000, "MATCH").stableForMs).toBe(0);
  expect(stabilizer.update("test", 900, "MATCH").status).toBe("UNCERTAIN");
  expect(stabilizer.update("test", 1100, "MATCH").accepted).toBe(false);
  stabilizer.update("test", 1200, "UNCERTAIN");
  expect(stabilizer.update("test", 1300, "MATCH").stableForMs).toBe(0);
});

test("new targets and repeated targets require sustained no-hand release plus cooldown", () => {
  const stabilizer = new RecognitionStabilizer();
  for (const time of [0, 100, 200, 300]) stabilizer.update("first", time, "MATCH");
  expect(stabilizer.update("first", 400, "MATCH").accepted).toBe(true);
  expect(stabilizer.update("second", 500, "MATCH").waitingRelease).toBe(true);
  for (const time of [600, 700, 800]) expect(stabilizer.update("second", time, "NO_HAND").waitingRelease).toBe(true);
  expect(stabilizer.update("second", 900, "NO_HAND").waitingRelease).toBe(false);
  for (const time of [1000, 1100, 1200, 1300]) expect(stabilizer.update("second", time, "MATCH").accepted).toBe(false);
  expect(stabilizer.update("second", 1400, "MATCH").accepted).toBe(true);
  expect(stabilizer.update("second", 1500, "MATCH").accepted).toBe(false);
});
