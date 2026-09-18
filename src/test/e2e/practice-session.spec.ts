import { expect, test } from "@playwright/test";
import { PracticeSession } from "../../features/practice/session";
import type { Assessment } from "../../features/recognition/types";

const result = (targetSignId: string, timestampMs: number, state: "correct" | "none" | "wrong" = "correct"): Assessment => ({
  targetSignId, timestampMs, status: state === "correct" ? "CORRECT" : state === "none" ? "NO_HAND" : "RETRY",
  accepted: state === "correct", reason: state === "correct" ? "MATCH" : "TRACKING", modelVersion: "test",
  stableForMs: state === "correct" ? 400 : 0, waitingRelease: false, predictedLetter: null,
});

test("acceptance celebrates once, waits for manual Continue, and requires release", () => {
  const s = new PracticeSession("session", ["a", "b", "c"], "a");
  expect(s.observe(result("a", 400))).toBe(true);
  const receipt = s.snapshot().acceptanceId;
  expect(s.observe(result("a", 500))).toBe(false);
  expect(s.continue()).toBe(false);
  expect(s.finishCelebration(receipt)).toBe(true);
  expect(s.finishCelebration(receipt)).toBe(false);
  expect(s.continue()).toBe(true);
  expect(s.continue()).toBe(false);
  expect(s.snapshot()).toMatchObject({ phase: "PREPARING_NEXT", targetId: "b", completedIds: ["a"] });
  expect(s.observe(result("a", 600))).toBe(false);
  expect(s.observe(result("b", 600))).toBe(false);
  for (const t of [900, 1050, 1200]) s.observe(result("b", t, "none"));
  expect(s.snapshot().phase).toBe("PRACTICING");
  expect(s.observe(result("b", 1700))).toBe(true);
  expect(s.snapshot().completedIds).toEqual(["a", "b"]);
});

test("release during celebration is remembered, repeat does not double-count", () => {
  const s = new PracticeSession("session", ["a", "b"], "a");
  s.observe(result("a", 400));
  for (const t of [600, 800, 1000]) s.observe(result("a", t, "none"));
  s.finishCelebration(s.snapshot().acceptanceId); s.repeat();
  expect(s.snapshot().phase).toBe("PRACTICING");
  s.observe(result("a", 1500));
  expect(s.snapshot().completedIds).toEqual(["a"]);
  expect(s.snapshot().acceptanceId).toBe("session:a:1");
});

test("partial group summary counts only accepted letters, and stale callbacks cannot advance", () => {
  const s = new PracticeSession("session", ["a", "b", "c"], "c");
  expect(s.observe(result("c", 1, "wrong"))).toBe(false);
  s.observe(result("c", 401));
  const receipt = s.snapshot().acceptanceId;
  s.interrupt();
  expect(s.snapshot().phase).toBe("AWAITING_CONTINUE");
  expect(s.finishCelebration(receipt)).toBe(false);
  s.continue();
  expect(s.snapshot()).toMatchObject({ phase: "SUMMARY", completedIds: ["c"] });
  expect(s.continue()).toBe(false);
});

test("manual selection cancels receipt, timestamp gaps cannot simulate release", () => {
  const s = new PracticeSession("session", ["a", "b"], "a");
  s.observe(result("a", 400)); const receipt = s.snapshot().acceptanceId;
  s.select("b"); expect(s.finishCelebration(receipt)).toBe(false);
  s.observe(result("b", 500, "none")); s.observe(result("b", 10000, "none"));
  expect(s.snapshot().phase).toBe("PREPARING_NEXT");
  s.observe(result("b", 10150, "none")); s.observe(result("b", 10300, "none"));
  expect(s.snapshot().phase).toBe("PRACTICING");
  expect(s.observe(result("b", 10300))).toBe(false);
  expect(s.observe({ ...result("b", 10800), stableForMs: 100 })).toBe(false);
});

test("restored progress stays marked and does not double-count a practiced letter", () => {
  const s = new PracticeSession("session", ["a", "b", "c"], "a", false, ["a", "b"]);
  expect(s.snapshot().completedIds).toEqual(["a", "b"]);
  s.observe(result("a", 400));
  expect(s.snapshot().completedIds).toEqual(["a", "b"]);
});
