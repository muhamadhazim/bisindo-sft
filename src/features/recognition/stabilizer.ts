import { recognitionTiming } from "@/lib/config/recognition";

export type RecognitionStatus = "NO_HAND" | "INSUFFICIENT_HANDS" | "TRACKING" | "UNCERTAIN" | "CORRECT" | "RETRY";
export type RecognitionCandidate = "NO_HAND" | "INSUFFICIENT_HANDS" | "TRACKING" | "UNCERTAIN" | "MATCH" | "NON_MATCH";
export type StabilizedResult = { status: RecognitionStatus; stableForMs: number; accepted: boolean; waitingRelease: boolean };

/** Emits acceptance once per held gesture. Target changes always require a release. */
export class RecognitionStabilizer {
  private target: string | null = null;
  private previousTime: number | null = null;
  private matchingSince: number | null = null;
  private releaseSince: number | null = null;
  private lastAccepted = -Infinity;
  private waitingRelease = false;

  update(target: string, timestampMs: number, candidate: RecognitionCandidate): StabilizedResult {
    const result = (status: RecognitionStatus, stableForMs = 0, accepted = false): StabilizedResult => ({ status, stableForMs, accepted, waitingRelease: this.waitingRelease });
    if (!target || !Number.isFinite(timestampMs) || this.previousTime !== null && timestampMs <= this.previousTime) {
      this.matchingSince = null; this.releaseSince = null;
      return result("UNCERTAIN");
    }
    if (this.target !== null && this.target !== target) { this.waitingRelease = true; this.matchingSince = null; this.releaseSince = null; }
    this.target = target;
    if (this.previousTime !== null && timestampMs - this.previousTime > recognitionTiming.maxGapMs) { this.matchingSince = null; this.releaseSince = null; }
    this.previousTime = timestampMs;
    if (candidate === "NO_HAND") {
      this.matchingSince = null;
      this.releaseSince ??= timestampMs;
      if (timestampMs - this.releaseSince >= recognitionTiming.releaseMs && timestampMs - this.lastAccepted >= recognitionTiming.cooldownMs) this.waitingRelease = false;
      return result("NO_HAND");
    }
    this.releaseSince = null;
    if (this.waitingRelease) return result("TRACKING");
    if (candidate !== "MATCH") {
      this.matchingSince = null;
      return result(candidate === "NON_MATCH" ? "RETRY" : candidate);
    }
    this.matchingSince ??= timestampMs;
    const stableForMs = timestampMs - this.matchingSince;
    if (stableForMs < recognitionTiming.stableMs) return result("TRACKING", stableForMs);
    this.lastAccepted = timestampMs;
    this.waitingRelease = true;
    return result("CORRECT", stableForMs, true);
  }
}
