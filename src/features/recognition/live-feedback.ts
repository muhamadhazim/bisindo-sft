import { recognitionTiming } from "@/lib/config/recognition";
import type { RecognitionCandidate, RecognitionStatus } from "./stabilizer";

/** Current-pose feedback continues independently of one-shot attempt acceptance. */
export class LiveRecognitionFeedback {
  private target: string | null = null;
  private previousTime: number | null = null;
  private matchingSince: number | null = null;

  update(target: string, timestampMs: number, candidate: RecognitionCandidate): { status: RecognitionStatus; stableForMs: number } {
    if (!target || !Number.isFinite(timestampMs) || this.previousTime !== null && timestampMs <= this.previousTime) {
      this.matchingSince = null;
      return { status: "UNCERTAIN", stableForMs: 0 };
    }
    if (target !== this.target || this.previousTime !== null && timestampMs - this.previousTime > recognitionTiming.maxGapMs) this.matchingSince = null;
    this.target = target;
    this.previousTime = timestampMs;
    if (candidate !== "MATCH") {
      this.matchingSince = null;
      return { status: candidate === "NON_MATCH" ? "RETRY" : candidate, stableForMs: 0 };
    }
    this.matchingSince ??= timestampMs;
    const stableForMs = timestampMs - this.matchingSince;
    return { status: stableForMs >= recognitionTiming.stableMs ? "CORRECT" : "TRACKING", stableForMs };
  }
}
