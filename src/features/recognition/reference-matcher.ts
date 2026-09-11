import data from "./reference-model.json";
import { featureSchema, extractFeatures } from "./features";
import { RecognitionStabilizer, type RecognitionCandidate, type StabilizedResult } from "./stabilizer";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { trackingConfig } from "@/lib/config/tracking";
import type { CanonicalResult } from "@/types/tracking";
import type { SignContent } from "@/types/content";

type Prototype = (typeof data.prototypes)[number];
type ReferenceModel = typeof data;
export type Assessment = StabilizedResult & {
  targetSignId: string;
  predictedSignId?: string;
  reason: "MATCH" | "OTHER_REFERENCE" | "OUTSIDE_REFERENCES" | "UNSUPPORTED_SIDE" | "TRACKING";
  modelVersion: string;
};

export function geometryDistance(a: readonly number[], b: readonly number[]): number {
  if (a.length !== featureSchema.handLength || b.length !== a.length || !a.every(Number.isFinite) || !b.every(Number.isFinite)) return Infinity;
  return Math.sqrt(a.reduce((sum, value, index) => sum + (value - b[index]!) ** 2, 0) / a.length);
}

const block = (vector: readonly number[], side: string) => vector.slice(side === "LEFT" ? 0 : 25, side === "LEFT" ? 25 : 50);

/** Experimental reference matching, not human-validated linguistic correctness. */
export class ReferenceRecognitionEngine {
  private readonly stabilizer = new RecognitionStabilizer();
  private readonly references: Array<{ prototype: Prototype; geometry: number[]; radius: number }>;
  private acceptedTarget: string | null = null;

  constructor(private readonly model: ReferenceModel = data) {
    if (model.featureSchema !== featureSchema.id || model.normalizationVersion !== featureSchema.normalizationVersion || model.landmarkerAssetId !== featureSchema.landmarkerAssetId || model.packageVersion !== trackingConfig.packageVersion || model.radiusPolicy !== "half-nearest-other-class-same-side-rms" || model.status !== "EXPERIMENTAL" || !model.prototypes.length) throw new Error("Reference model contract mismatch");
    for (const p of model.prototypes) {
      if (!["LEFT", "RIGHT"].includes(p.side) || p.vector.length !== featureSchema.length || !p.vector.every(Number.isFinite) || p.vector[50] !== Number(p.side === "LEFT") || p.vector[51] !== Number(p.side === "RIGHT") || !p.assetId || !p.assetSha256 || !p.signId) throw new Error("Invalid reference prototype");
    }
    this.references = model.prototypes.map((prototype) => {
      const geometry = block(prototype.vector, prototype.side);
      const otherDistances = model.prototypes.filter((other) => other.side === prototype.side && other.signId !== prototype.signId).map((other) => geometryDistance(geometry, block(other.vector, other.side)));
      // Disjoint local neighborhoods, with an unknown region between source patterns.
      // Derived from observed source separation; not a calibrated accuracy threshold.
      const radius = Math.min(...otherDistances) / 2;
      if (!Number.isFinite(radius) || radius <= 0) throw new Error("Insufficient separated reference coverage");
      return { prototype, geometry, radius };
    });
  }

  classify(vector: readonly number[], side: "LEFT" | "RIGHT", target: SignContent): { candidate: RecognitionCandidate; reason: Assessment["reason"]; predictedSignId?: string } {
    const unknown = { candidate: "UNCERTAIN", reason: "OUTSIDE_REFERENCES" } as const;
    if (vector.length !== featureSchema.length || !vector.every(Number.isFinite) || vector[50] !== Number(side === "LEFT") || vector[51] !== Number(side === "RIGHT") || target.motionType !== "STATIC" || !["SOURCE_VERIFIED", "VALIDATOR_VERIFIED"].includes(target.validationStatus) || target.sourceId !== this.model.sourceId) return unknown;
    const pool = this.references.filter(({ prototype }) => prototype.side === side);
    if (!pool.some(({ prototype }) => prototype.signId === target.id)) return { candidate: "UNCERTAIN", reason: "UNSUPPORTED_SIDE" };
    const geometry = block(vector, side);
    const matches = pool.filter((reference) => geometryDistance(geometry, reference.geometry) < reference.radius);
    const labels = [...new Set(matches.map(({ prototype }) => prototype.signId))];
    if (labels.length !== 1) return unknown;
    const predictedSignId = labels[0]!;
    return predictedSignId === target.id
      ? { candidate: "MATCH", reason: "MATCH", predictedSignId }
      : { candidate: "NON_MATCH", reason: "OTHER_REFERENCE", predictedSignId };
  }

  evaluate(input: CanonicalResult, target: SignContent): Assessment {
    const handStatus = checkRequiredHands(input, target);
    let candidate: RecognitionCandidate = handStatus;
    let reason: Assessment["reason"] = "TRACKING";
    let predictedSignId: string | undefined;
    if (handStatus === "TRACKING") {
      const vector = extractFeatures(input.frame);
      const classification = vector ? this.classify(vector, input.frame.left ? "LEFT" : "RIGHT", target) : { candidate: "UNCERTAIN" as const, reason: "OUTSIDE_REFERENCES" as const };
      candidate = classification.candidate; reason = classification.reason;
      predictedSignId = "predictedSignId" in classification ? classification.predictedSignId : undefined;
    }
    const stabilized = this.stabilizer.update(target.id, input.frame.timestampMs, candidate);
    if (stabilized.accepted) this.acceptedTarget = target.id;
    if (!stabilized.waitingRelease) this.acceptedTarget = null;
    // Keep the completed attempt visible while awaiting release; accepted stays one-shot.
    const status = stabilized.waitingRelease && this.acceptedTarget === target.id && candidate !== "NO_HAND" ? "CORRECT" : stabilized.status;
    return { ...stabilized, status, targetSignId: target.id, ...(predictedSignId ? { predictedSignId } : {}), reason, modelVersion: this.model.version };
  }
}
