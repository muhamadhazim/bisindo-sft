export type Landmark = { x: number; y: number; z: number };
export type CanonicalHand = {
  side: "LEFT" | "RIGHT";
  handednessScore: number;
  landmarks: Landmark[];
  worldLandmarks?: Landmark[];
};
export type HandFrame = { timestampMs: number; left: CanonicalHand | null; right: CanonicalHand | null };
export type CanonicalResult = { frame: HandFrame; ambiguous: boolean };
export type HandRequirementStatus = "NO_HAND" | "INSUFFICIENT_HANDS" | "TRACKING" | "UNCERTAIN";
