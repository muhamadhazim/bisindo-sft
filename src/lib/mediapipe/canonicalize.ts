import type { HandLandmarkerResult } from "@mediapipe/tasks-vision";
import type { CanonicalResult, HandFrame, Landmark, HandRequirementStatus } from "@/types/tracking";
import type { SignContent } from "@/types/content";
import { trackingConfig } from "@/lib/config/tracking";

type RawHands = Pick<HandLandmarkerResult, "landmarks" | "worldLandmarks" | "handedness">;
const validLandmarks = (points: Landmark[]) => points.length === 21 && points.every((point) => [point.x, point.y, point.z].every(Number.isFinite));

export function canonicalizeHands(raw: RawHands, timestampMs: number): CanonicalResult {
  const frame: HandFrame = { timestampMs, left: null, right: null };
  const uncertain = (): CanonicalResult => ({ frame: { timestampMs, left: null, right: null }, ambiguous: true });
  if (!Number.isFinite(timestampMs) || raw.landmarks.length > 2 || raw.handedness.length !== raw.landmarks.length) return uncertain();
  for (let index = 0; index < raw.landmarks.length; index++) {
    const points = raw.landmarks[index];
    const categories = [...(raw.handedness[index] ?? [])].sort((a, b) => b.score - a.score);
    const category = categories[0];
    if (!points || !validLandmarks(points) || !category || !Number.isFinite(category.score) || category.score < trackingConfig.minHandednessScore || category.score > 1) return uncertain();
    if (categories[1] && category.score - categories[1].score < trackingConfig.minCategoryMargin) return uncertain();
    // Index only pairs fields of the same detection. The provider label selects the slot.
    const slot = category.categoryName === "Left" ? "left" : category.categoryName === "Right" ? "right" : null;
    if (!slot || frame[slot]) return uncertain();
    const world = raw.worldLandmarks[index];
    if (world && !validLandmarks(world)) return uncertain();
    frame[slot] = {
      side: slot === "left" ? "LEFT" : "RIGHT",
      handednessScore: category.score,
      landmarks: points.map(({ x, y, z }) => ({ x, y, z })),
      ...(world ? { worldLandmarks: world.map(({ x, y, z }) => ({ x, y, z })) } : {}),
    };
  }
  return { frame, ambiguous: false };
}

export function checkRequiredHands(result: CanonicalResult, sign: Pick<SignContent, "requiredHands" | "handednessPolicy">): HandRequirementStatus {
  if (result.ambiguous) return "UNCERTAIN";
  const { left, right } = result.frame;
  const count = Number(!!left) + Number(!!right);
  if (!count) return "NO_HAND";
  if (sign.requiredHands === "TWO" && count < 2) return "INSUFFICIENT_HANDS";
  if (sign.requiredHands === "ONE" && count > 1) return "UNCERTAIN";
  if (sign.handednessPolicy === "LEFT" && !left || sign.handednessPolicy === "RIGHT" && !right || sign.handednessPolicy === "VALIDATOR_DEFINED") return "UNCERTAIN";
  // UNSPECIFIED allows tracking, never a claim that either hand is linguistically correct.
  return "TRACKING";
}
