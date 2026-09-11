import { expect, test } from "@playwright/test";
import { scheduleVideoFrames } from "../../lib/camera/frame-scheduler";

test("decoded-frame scheduler throttles, skips duplicates, cancels, and never queues busy work", async () => {
  let callback: VideoFrameRequestCallback | undefined;
  let scheduled = 0;
  let cancelled = 0;
  const video = {
    readyState: 2,
    requestVideoFrameCallback: (next: VideoFrameRequestCallback) => { callback = next; return ++scheduled; },
    cancelVideoFrameCallback: () => { cancelled++; },
  } as unknown as HTMLVideoElement;
  const frames: number[] = [];
  let resolveWork: (() => void) | undefined;
  const stop = scheduleVideoFrames(video, async ({ timestampMs }) => {
    frames.push(timestampMs);
    if (timestampMs === 100) await new Promise<void>((resolve) => { resolveWork = resolve; });
  }, () => { throw new Error("Unexpected failure"); });
  const fire = async (now: number, mediaTime: number) => { callback?.(now, { mediaTime } as VideoFrameCallbackMetadata); await Promise.resolve(); };
  await fire(0, 0);
  await fire(40, 0.04);
  await fire(90, 0);
  expect(frames).toEqual([0]);
  await fire(100, 0.1);
  const busyScheduled = scheduled;
  await Promise.resolve();
  expect(scheduled).toBe(busyScheduled);
  stop();
  resolveWork?.();
  await Promise.resolve();
  await Promise.resolve();
  expect(scheduled).toBe(busyScheduled);
  expect(cancelled).toBe(1);
  expect(frames).toEqual([0, 100]);
});

test("RAF fallback ignores duplicate currentTime and stops on a processing error", async () => {
  const previousRequest = globalThis.requestAnimationFrame;
  const previousCancel = globalThis.cancelAnimationFrame;
  let callback: FrameRequestCallback | undefined;
  let scheduled = 0;
  let errors = 0;
  const frames: number[] = [];
  globalThis.requestAnimationFrame = (next) => { callback = next; return ++scheduled; };
  globalThis.cancelAnimationFrame = () => {};
  try {
    const video = { readyState: 2, currentTime: 0 } as HTMLVideoElement;
    const stop = scheduleVideoFrames(video, ({ timestampMs }) => {
      frames.push(timestampMs);
      if (timestampMs === 200) throw new Error("Test processing error");
    }, () => { errors++; });
    callback?.(0); await Promise.resolve();
    callback?.(100); await Promise.resolve();
    expect(frames).toEqual([0]);
    video.currentTime = 0.2;
    callback?.(200); await Promise.resolve();
    const lastScheduled = scheduled;
    await Promise.resolve();
    expect(scheduled).toBe(lastScheduled);
    expect(errors).toBe(1);
    stop();
  } finally {
    globalThis.requestAnimationFrame = previousRequest;
    globalThis.cancelAnimationFrame = previousCancel;
  }
});
