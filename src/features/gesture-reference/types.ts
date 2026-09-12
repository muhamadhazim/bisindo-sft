import type { AlphabetLetter } from "@/features/recognition/types";

export type PosePoint = [number, number, number];
export type GestureHand = { side: "LEFT" | "RIGHT"; radius: number; joints: PosePoint[] };
export type GestureReference = {
  signId: string; viewpoint: "SOURCE_CAMERA_FRONT"; review: "PHOTO_SOURCE_ONLY";
  id: string; symbol: AlphabetLetter; version: string;
  status: "SOURCE_VERIFIED" | "DRAFT";
  sourceId: string; sourceSampleId: string; sourceUrl: string; sourceSha256: string;
  comparisonSampleId: string | null; comparisonUrl: string | null;
  region: null; license: string; attribution: string;
  requiredHands: "ONE" | "TWO";
  motionType: "STATIC" | "DYNAMIC" | "UNKNOWN";
  limitation: string; hands: GestureHand[]; posterUrl: string;
};
