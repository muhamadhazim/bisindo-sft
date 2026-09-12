import { InferenceSession, Tensor, env } from "onnxruntime-web/wasm";
import checksums from "../../../ml/alphabet-v2/checksums.json";
import { extractFeatures } from "./features";
import { RecognitionStabilizer, type RecognitionCandidate } from "./stabilizer";
import { LiveRecognitionFeedback } from "./live-feedback";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { decideAlphabet, validateEnvelopes, validateMetadata, type Envelope } from "./alphabet-model";
import { isAlphabetLetter, type Assessment, type GestureClassifier } from "./types";
import type { CanonicalResult } from "@/types/tracking";
import type { SignContent } from "@/types/content";

async function verifiedBytes(path: string, sha256: string): Promise<ArrayBuffer> {
  const response = await fetch(path, { signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error("Alphabet download failed");
  const bytes = await response.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  if (actual !== sha256) throw new Error("Alphabet checksum mismatch");
  return bytes;
}

export class AlphabetClassifier implements GestureClassifier {
  private stabilizer = new RecognitionStabilizer();
  private feedback = new LiveRecognitionFeedback();
  private closed = false;
  private pending: Promise<unknown> = Promise.resolve();
  constructor(private session: InferenceSession, private envelopes: Envelope[]) {}
  reset() { this.stabilizer = new RecognitionStabilizer(); this.feedback = new LiveRecognitionFeedback(); }
  async probabilities(vector: number[]): Promise<number[]> {
    if (this.closed) throw new Error("Classifier closed");
    const tensor = new Tensor("float32", Float32Array.from(vector), [1, 52]);
    const operation = this.session.run({ float_input: tensor });
    this.pending = operation;
    try {
      const output = await operation;
      try {
        const probabilities = output.out_activations_result;
        if (!probabilities || probabilities.type !== "float32" || probabilities.dims.join(",") !== "1,26") throw new Error("Classifier output mismatch");
        return Array.from(probabilities.data as Float32Array);
      } finally { Object.values(output).forEach(value => value.dispose()); }
    } finally { tensor.dispose(); }
  }
  async evaluate(input: CanonicalResult, target: SignContent): Promise<Assessment> {
    const hands = checkRequiredHands(input, target);
    let candidate: RecognitionCandidate = hands;
    let predictedLetter: Assessment["predictedLetter"] = null;
    let reason: Assessment["reason"] = "TRACKING";
    if (hands === "TRACKING") {
      const supported = target.validationStatus !== "DRAFT" && target.motionType === "STATIC" && isAlphabetLetter(target.symbol);
      const vector = extractFeatures(input.frame);
      predictedLetter = supported && vector ? decideAlphabet(vector, await this.probabilities(vector), this.envelopes) : null;
      candidate = predictedLetter ? predictedLetter === target.symbol ? "MATCH" : "NON_MATCH" : "UNCERTAIN";
      reason = !supported ? "UNSUPPORTED_CONTENT" : predictedLetter ? candidate === "MATCH" ? "MATCH" : "OTHER_REFERENCE" : "OUTSIDE_REFERENCES";
    }
    const timestampMs = input.frame.timestampMs;
    return { ...this.stabilizer.update(target.id, timestampMs, candidate), ...this.feedback.update(target.id, timestampMs, candidate),
      targetSignId: target.id, predictedLetter, reason, modelVersion: "2.0.0", timestampMs };
  }
  async close() {
    if (this.closed) return;
    this.closed = true;
    await this.pending.catch(() => undefined);
    await this.session.release();
  }
}

export async function loadAlphabetClassifier(): Promise<AlphabetClassifier> {
  const root = "/models/alphabet-mlp-v2";
  const decoder = new TextDecoder();
  const metadata: unknown = JSON.parse(decoder.decode(await verifiedBytes(`${root}/metadata.json`, checksums.metadataSha256)));
  validateMetadata(metadata);
  const [model, envelopeBytes] = await Promise.all([
    verifiedBytes(`${root}/model.onnx`, metadata.modelSha256), verifiedBytes(`${root}/envelopes.json`, metadata.envelopesSha256),
  ]);
  const envelopes: unknown = JSON.parse(decoder.decode(envelopeBytes));
  validateEnvelopes(envelopes);
  env.wasm.numThreads = 1;
  env.wasm.proxy = false;
  env.wasm.wasmPaths = "/models/onnxruntime-1.29.0/";
  const session = await InferenceSession.create(model, { executionProviders: ["wasm"] });
  try {
    const input = session.inputMetadata[0]; const output = session.outputMetadata[0];
    if (session.inputNames.join() !== "float_input" || session.outputNames.join() !== "out_activations_result"
      || !input?.isTensor || input.type !== "float32" || input.shape.length !== 2 || input.shape[1] !== 52
      || !output?.isTensor || output.type !== "float32" || output.shape.length !== 2 || output.shape[1] !== 26) throw new Error("ONNX graph contract mismatch");
    return new AlphabetClassifier(session, envelopes);
  } catch (error) { await session.release(); throw error; }
}
