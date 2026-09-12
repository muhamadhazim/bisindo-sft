import { featureSchema } from "./features";
import { alphabet, type AlphabetLetter } from "./types";
import { trackingConfig } from "@/lib/config/tracking";

export type Envelope = { label: string; maxDistance: number; vectors: number[][] };
export type AlphabetMetadata = {
  id: string; version: string; status: string; labels: string[];
  featureSchema: typeof featureSchema;
  landmarker: typeof trackingConfig;
  runtime: { name: string; version: string };
  input: { name: string; shape: number[] }; output: { name: string; shape: number[] };
  threshold: number; envelopeTolerance: number;
  sourceSha256: string; modelSha256: string; envelopesSha256: string;
};

export function validateMetadata(value: unknown): asserts value is AlphabetMetadata {
  const m = value as Partial<AlphabetMetadata> | null;
  if (!m || m.id !== "alphabet-mlp-v2" || m.version !== "2.0.0" || m.status !== "EXPERIMENTAL"
    || m.labels?.join(",") !== alphabet.join(",") || m.runtime?.name !== "onnxruntime-web" || m.runtime.version !== "1.29.0"
    || Object.entries(featureSchema).some(([key, expected]) => m.featureSchema?.[key as keyof typeof featureSchema] !== expected)
    || Object.entries(trackingConfig).some(([key, expected]) => m.landmarker?.[key as keyof typeof trackingConfig] !== expected)
    || m.input?.name !== "float_input" || m.input.shape.join(",") !== "1,52"
    || m.output?.name !== "out_activations_result" || m.output.shape.join(",") !== "1,26"
    || m.threshold !== .5 || m.envelopeTolerance !== 1.8
    || [m.modelSha256, m.envelopesSha256, m.sourceSha256].some(hash => typeof hash !== "string" || !/^[a-f0-9]{64}$/.test(hash))) {
    throw new Error("Alphabet model contract mismatch");
  }
}

export function validateEnvelopes(value: unknown): asserts value is Envelope[] {
  if (!Array.isArray(value) || value.length !== 26 || value.some((item: Envelope, i) => !item || item.label !== alphabet[i]
    || !Number.isFinite(item.maxDistance) || item.maxDistance <= 0 || !Array.isArray(item.vectors) || !item.vectors.length
    || item.vectors.some(v => !validVector(v)))) throw new Error("Invalid alphabet envelopes");
}

export function validVector(v: readonly number[]): boolean {
  return Array.isArray(v) && v.length === 52 && v.every(Number.isFinite)
    && [0, 1].includes(v[50]!) && [0, 1].includes(v[51]!) && v[50]! + v[51]! > 0;
}

/** Exactly the Colab probability + same-presence-mask distance gate. */
export function decideAlphabet(vector: number[], probabilities: readonly number[], envelopes: Envelope[]): AlphabetLetter | null {
  if (!validVector(vector) || probabilities.length !== 26 || probabilities.some(p => !Number.isFinite(p) || p < 0 || p > 1)
    || Math.abs(probabilities.reduce((a, b) => a + b, 0) - 1) > 1e-4) return null;
  const ranked = probabilities.map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score);
  const best = ranked[0]!;
  if (best.score < .5 || best.score <= ranked[1]!.score) return null;
  const envelope = envelopes[best.index];
  if (!envelope) return null;
  const inside = envelope.vectors.some(ref => {
    if (ref[50] !== vector[50] || ref[51] !== vector[51]) return false;
    const distance = Math.sqrt(ref.reduce((sum, x, i) => sum + (x - vector[i]!) ** 2, 0) / 52);
    return distance <= envelope.maxDistance * 1.8;
  });
  return inside ? alphabet[best.index]! : null;
}
