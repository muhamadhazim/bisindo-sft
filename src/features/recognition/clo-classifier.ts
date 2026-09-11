import { RandomForestClassifier } from "ml-random-forest";
import { extractFeatures, featureSchema } from "./features";
import { RecognitionStabilizer, type RecognitionCandidate, type StabilizedResult } from "./stabilizer";
import { LiveRecognitionFeedback } from "./live-feedback";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { trackingConfig } from "@/lib/config/tracking";
import type { CanonicalResult } from "@/types/tracking";
import type { SignContent } from "@/types/content";

export type CloLetter = "C" | "L" | "O";
export type CloModel = {
  id: string; version: string; status: string; labels: string[];
  featureSchema: { id: string; normalizationVersion: string; landmarkerAssetId: string; length: number };
  runtime: { name: string; version: string };
  landmarker: { packageVersion: string; assetId: string };
  threshold: number;
  envelopes: Array<{ label: string; maxDistance: number; vectors: number[][] }>;
  forest: ReturnType<RandomForestClassifier["toJSON"]>;
};
export type Assessment = StabilizedResult & {
  targetSignId: string; predictedLetter: CloLetter | null;
  reason: "MATCH" | "OTHER_REFERENCE" | "OUTSIDE_REFERENCES" | "UNSUPPORTED_SIDE" | "TRACKING";
  modelVersion: string;
};
const rms = (a: readonly number[], b: readonly number[]) => Math.sqrt(a.reduce((s,v,i)=>s+(v-b[i]!)**2,0)/a.length);

export class CloClassifier {
  private readonly forest: RandomForestClassifier;
  private readonly stabilizer = new RecognitionStabilizer();
  private readonly feedback = new LiveRecognitionFeedback();
  constructor(private readonly model: CloModel) {
    if (model.id !== "rhio-clo-rf-v1" || model.labels.join(",") !== "C,L,O" || model.featureSchema.id !== featureSchema.id || model.featureSchema.normalizationVersion !== featureSchema.normalizationVersion || model.featureSchema.landmarkerAssetId !== featureSchema.landmarkerAssetId || model.featureSchema.length !== featureSchema.length || model.landmarker.packageVersion !== trackingConfig.packageVersion || model.landmarker.assetId !== trackingConfig.assetId || model.runtime.name !== "ml-random-forest" || model.runtime.version !== "2.1.0" || !Number.isFinite(model.threshold) || model.threshold <= 0 || model.threshold > 1) throw new Error("Classifier contract mismatch");
    if (model.envelopes.length !== 3 || model.envelopes.some((e,i)=>e.label!==model.labels[i] || !Number.isFinite(e.maxDistance) || e.maxDistance<=0 || !e.vectors.length || e.vectors.some(v=>v.length!==featureSchema.length || !v.every(Number.isFinite)))) throw new Error("Invalid classifier envelope");
    this.forest = RandomForestClassifier.load(model.forest);
  }
  votes(vector: number[]): number[] {
    const values = this.forest.predictionValues([vector]).getRow(0);
    const counts = [0,0,0];
    for (const value of values) { if (!Number.isInteger(value) || value<0 || value>2) throw new Error("Invalid classifier output"); counts[value]!++; }
    return counts.map(value=>value/values.length);
  }
  classifyVector(vector: number[]): CloLetter | null {
    if (vector.length!==featureSchema.length || !vector.every(Number.isFinite) || vector[50]!==0 || vector[51]!==1) return null;
    const ranking = this.votes(vector).map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score);
    const best = ranking[0]!;
    if (best.score<this.model.threshold || best.score<=ranking[1]!.score) return null;
    const envelope = this.model.envelopes[best.index]!;
    const nearest = Math.min(...envelope.vectors.filter(v=>v[50]===vector[50]&&v[51]===vector[51]).map(v=>rms(v,vector)));
    return nearest<=envelope.maxDistance ? this.model.labels[best.index] as CloLetter : null;
  }
  evaluate(input: CanonicalResult, target: SignContent): Assessment {
    const handStatus = checkRequiredHands(input,target);
    let candidate: RecognitionCandidate = handStatus;
    let predictedLetter: CloLetter | null = null;
    let reason: Assessment["reason"] = "TRACKING";
    if (handStatus === "TRACKING") {
      const vector = extractFeatures(input.frame);
      const supported = ["C","L","O"].includes(target.symbol) && target.motionType === "STATIC" && ["SOURCE_VERIFIED","VALIDATOR_VERIFIED"].includes(target.validationStatus);
      predictedLetter = supported && vector ? this.classifyVector(vector) : null;
      candidate = predictedLetter ? predictedLetter===target.symbol ? "MATCH" : "NON_MATCH" : "UNCERTAIN";
      reason = input.frame.left ? "UNSUPPORTED_SIDE" : predictedLetter ? predictedLetter===target.symbol ? "MATCH" : "OTHER_REFERENCE" : "OUTSIDE_REFERENCES";
    }
    const result = this.stabilizer.update(target.id,input.frame.timestampMs,candidate);
    const feedback = this.feedback.update(target.id,input.frame.timestampMs,candidate);
    return {...result,...feedback,targetSignId:target.id,predictedLetter,reason,modelVersion:this.model.version};
  }
}
export async function loadCloClassifier(): Promise<CloClassifier> {
  const response = await fetch("/models/rhio-clo-v1/model.json");
  if (!response.ok) throw new Error("Classifier download failed");
  return new CloClassifier(await response.json() as CloModel);
}
