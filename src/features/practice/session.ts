import { recognitionTiming } from "@/lib/config/recognition";
import type { Assessment } from "@/features/recognition/types";

export type SessionPhase = "PRACTICING" | "CELEBRATING" | "AWAITING_CONTINUE" | "PREPARING_NEXT" | "SUMMARY";
export type SessionSnapshot = {
  phase: SessionPhase; targetId: string; index: number; attempt: number;
  completedIds: string[]; acceptanceId: string | null;
};

/** Session receipts and progression never change classifier probabilities. */
export class PracticeSession {
  private phase: SessionPhase = "PRACTICING";
  private index: number;
  private attempt = 0;
  private completed = new Set<string>();
  private acceptanceId: string | null = null;
  private lastAccepted = -Infinity;
  private lastFrame = -Infinity;
  private releaseSince: number | null = null;
  private released = true;
  constructor(readonly id: string, readonly targetIds: readonly string[], startId: string) {
    this.index = targetIds.indexOf(startId);
    if (!targetIds.length || this.index < 0 || new Set(targetIds).size !== targetIds.length) throw new Error("Invalid practice sequence");
  }
  snapshot(): SessionSnapshot {
    return { phase: this.phase, targetId: this.targetIds[this.index]!, index: this.index, attempt: this.attempt, completedIds: [...this.completed], acceptanceId: this.acceptanceId };
  }
  observe(result: Assessment): boolean {
    const time = result.timestampMs;
    if (result.targetSignId !== this.targetIds[this.index] || time === undefined || !Number.isFinite(time) || time <= this.lastFrame) return false;
    if (time - this.lastFrame > recognitionTiming.maxGapMs) this.releaseSince = null;
    this.lastFrame = time;
    if (result.status === "NO_HAND") {
      this.releaseSince ??= time;
      if (time - this.releaseSince >= recognitionTiming.releaseMs && time - this.lastAccepted >= recognitionTiming.cooldownMs) this.released = true;
    } else { this.releaseSince = null; }
    if (this.phase === "PREPARING_NEXT" && this.released) {
      this.phase = "PRACTICING"; this.attempt++; return true;
    }
    if (this.phase !== "PRACTICING" || !result.accepted || result.status !== "CORRECT" || result.reason !== "MATCH" || result.stableForMs < recognitionTiming.stableMs) return false;
    this.completed.add(result.targetSignId);
    this.acceptanceId = `${this.id}:${result.targetSignId}:${this.attempt}`;
    this.phase = "CELEBRATING"; this.lastAccepted = time; this.released = false; this.releaseSince = null;
    return true;
  }
  finishCelebration(acceptanceId: string | null): boolean {
    if (this.phase !== "CELEBRATING" || !acceptanceId || acceptanceId !== this.acceptanceId) return false;
    this.phase = "AWAITING_CONTINUE"; return true;
  }
  continue(): boolean {
    if (this.phase !== "AWAITING_CONTINUE") return false;
    if (this.index === this.targetIds.length - 1) { this.phase = "SUMMARY"; return true; }
    this.index++; this.arm(); return true;
  }
  repeat(): boolean {
    if (this.phase !== "AWAITING_CONTINUE") return false;
    this.arm(); return true;
  }
  select(targetId: string): boolean {
    const index = this.targetIds.indexOf(targetId);
    if (index < 0 || index === this.index) return false;
    this.index = index; this.released = false; this.arm(); return true;
  }
  interrupt(): void {
    this.releaseSince = null; this.released = false; this.lastFrame = -Infinity;
    // No animation timer needs to survive camera stop/hidden tab.
    if (this.phase === "CELEBRATING") this.phase = "AWAITING_CONTINUE";
    else if (this.phase === "PRACTICING") { this.phase = "PREPARING_NEXT"; this.attempt++; }
  }
  private arm() {
    this.phase = this.released ? "PRACTICING" : "PREPARING_NEXT";
    this.acceptanceId = null; this.attempt++;
  }
}
