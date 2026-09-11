import type { CanonicalResult } from "@/types/tracking";
import type { SignContent, ValidationStatus } from "@/types/content";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { extractFeatures, featureSchema } from "./features";
import { RecognitionStabilizer, type RecognitionCandidate } from "./stabilizer";

export type RuleProfile = {
  signId: string;
  version: string;
  featureSchema: string;
  normalizationVersion: string;
  landmarkerAssetId: string;
  inputLength: number;
  validationStatus: ValidationStatus;
  sourceIds: readonly string[];
  bounds: ReadonlyArray<{ index: number; min: number; max: number }>;
};

function validateProfile(profile: RuleProfile) {
  if (profile.featureSchema !== featureSchema.id || profile.normalizationVersion !== featureSchema.normalizationVersion || profile.landmarkerAssetId !== featureSchema.landmarkerAssetId || profile.inputLength !== featureSchema.length) throw new Error("Recognition feature/model contract mismatch");
  if (!profile.version.trim() || !profile.signId.trim() || !profile.sourceIds.length || profile.sourceIds.some((id) => !id.trim()) || !profile.bounds.length) throw new Error("Incomplete recognition profile");
  const indices = new Set<number>();
  for (const bound of profile.bounds) {
    if (!Number.isInteger(bound.index) || bound.index < 0 || bound.index >= featureSchema.length || indices.has(bound.index) || !Number.isFinite(bound.min) || !Number.isFinite(bound.max) || bound.min > bound.max) throw new Error("Invalid recognition feature bounds");
    indices.add(bound.index);
  }
}

/** Empty/DRAFT profiles intentionally never produce a match. No top-1 fallback. */
export class RuleRecognitionEngine {
  private readonly stabilizer = new RecognitionStabilizer();
  constructor(private readonly profiles: readonly RuleProfile[]) { profiles.forEach(validateProfile); }

  evaluate(input: CanonicalResult, target: SignContent) {
    const handStatus = checkRequiredHands(input, target);
    let candidate: RecognitionCandidate = handStatus;
    let predictedSignId: string | undefined;
    if (handStatus === "TRACKING") {
      candidate = "UNCERTAIN";
      const vector = extractFeatures(input.frame);
      if (vector && target.motionType === "STATIC" && target.validationStatus !== "DRAFT") {
        const profiles = this.profiles.filter((profile) => profile.validationStatus !== "DRAFT" && (profile.signId !== target.id || profile.sourceIds.includes(target.sourceId)));
        const targetSupported = profiles.some((profile) => profile.signId === target.id && profile.sourceIds.includes(target.sourceId));
        const matches = profiles.filter((profile) => profile.bounds.every(({ index, min, max }) => vector[index]! >= min && vector[index]! <= max));
        const matchingIds = [...new Set(matches.map((profile) => profile.signId))];
        if (targetSupported && matchingIds.length === 1) {
          predictedSignId = matchingIds[0];
          candidate = predictedSignId === target.id ? "MATCH" : "NON_MATCH";
        }
      }
    }
    return {
      ...this.stabilizer.update(target.id, input.frame.timestampMs, candidate),
      targetSignId: target.id,
      ...(predictedSignId ? { predictedSignId } : {}),
      featureSchema: featureSchema.id,
    };
  }
}

// No reviewed, calibrated rule thresholds exist yet. Production stays tracking-only.
export const acceptedRuleProfiles: readonly RuleProfile[] = [];
