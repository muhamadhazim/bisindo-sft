import type { CanonicalHand, HandFrame, Landmark } from "@/types/tracking";
import { trackingConfig } from "@/lib/config/tracking";

export const featureSchema = {
  id: "hands-geometry-v1",
  normalizationVersion: "world-palm-scale-v1",
  landmarkerAssetId: trackingConfig.assetId,
  length: 52,
  handLength: 25,
} as const;

const joints = [[1, 2, 3], [2, 3, 4], [5, 6, 7], [6, 7, 8], [9, 10, 11], [10, 11, 12], [13, 14, 15], [14, 15, 16], [17, 18, 19], [18, 19, 20]] as const;
const tips = [4, 8, 12, 16, 20] as const;
const subtract = (a: Landmark, b: Landmark): Landmark => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const norm = (a: Landmark) => Math.hypot(a.x, a.y, a.z);
const distance = (a: Landmark, b: Landmark) => norm(subtract(a, b));
const valid = (points: Landmark[]) => points.length === 21 && points.every((point) => [point.x, point.y, point.z].every(Number.isFinite));

function extractHand(hand: CanonicalHand | null): number[] | null {
  if (!hand) return Array<number>(featureSchema.handLength).fill(0);
  const points = hand.worldLandmarks;
  if (!points || !valid(points) || !valid(hand.landmarks) || hand.landmarks.some((point) => point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1)) return null;
  // Array length was checked; coordinates here are anatomical landmark IDs, not hand order.
  const p = (index: number) => points[index]!;
  const scale = distance(p(0), p(9));
  if (scale < 1e-6) return null;
  const features: number[] = [];
  for (const [a, b, c] of joints) {
    const u = subtract(p(a), p(b));
    const v = subtract(p(c), p(b));
    const denominator = norm(u) * norm(v);
    if (denominator < 1e-12) return null;
    const cosine = (u.x * v.x + u.y * v.y + u.z * v.z) / denominator;
    features.push(Math.acos(Math.max(-1, Math.min(1, cosine))) / Math.PI);
  }
  for (const tip of tips.slice(1)) features.push(distance(p(4), p(tip)) / scale);
  for (const tip of tips) features.push(distance(p(0), p(tip)) / scale);
  for (const [a, b] of [[8, 12], [12, 16], [16, 20]]) features.push(distance(p(a!), p(b!)) / scale);
  const u = subtract(p(5), p(0));
  const v = subtract(p(17), p(0));
  const normal = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const normalLength = norm(normal);
  if (normalLength < 1e-12) return null;
  features.push(normal.x / normalLength, normal.y / normalLength, normal.z / normalLength);
  return features.length === featureSchema.handLength && features.every(Number.isFinite) ? features : null;
}

/** Shared extraction for reference analysis and runtime. No hand mirroring or guessed data. */
export function extractFeatures(frame: HandFrame): number[] | null {
  const left = extractHand(frame.left);
  const right = extractHand(frame.right);
  if (!left || !right || !Number.isFinite(frame.timestampMs)) return null;
  return [...left, ...right, Number(!!frame.left), Number(!!frame.right)];
}
