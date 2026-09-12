import type { AlphabetLetter } from "@/features/recognition/types";

export type PosePoint = [number, number, number];
export type GestureHand = { side: "LEFT" | "RIGHT"; joints: PosePoint[] };
export type GestureReference = {
  id: string; symbol: AlphabetLetter; version: string;
  status: "SOURCE_VERIFIED" | "DRAFT";
  sourceId: string; sourceSampleId: string; sourceUrl: string; sourceSha256: string;
  comparisonSampleId: string | null; comparisonUrl: string | null;
  region: null; license: string; attribution: string;
  requiredHands: "ONE" | "TWO";
  motionType: "STATIC" | "DYNAMIC" | "UNKNOWN";
  limitation: string; hands: GestureHand[]; posterUrl: string;
};
