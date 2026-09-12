"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { scheduleVideoFrames } from "@/lib/camera/frame-scheduler";
import { trackingConfig } from "@/lib/config/tracking";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { drawHandOverlay } from "@/lib/mediapipe/overlay";
import type { SignContent } from "@/types/content";
import type { HandRequirementStatus, HandFrame } from "@/types/tracking";
import type { Assessment, GestureClassifier } from "@/features/recognition/types";

export type TrackingStatus = "LOADING" | "ERROR" | HandRequirementStatus;
type Snapshot = { status: TrackingStatus; latencyMs: number | null; assessment: Assessment | null; modelError: boolean; sourceKey?: string };
type Options = { attemptKey?: string; onAssessment?: (result: Assessment) => void };

export function useHandTracking(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, sign: SignContent, mirrored: boolean, assess = false, options: Options = {}) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, setSnapshot] = useState<Snapshot>({ status: "LOADING", latencyMs: null, assessment: null, modelError: false });
  const [attempt, setAttempt] = useState(0);
  const current = useEffectEvent(() => ({ sign, key: `${sign.id}:${options.attemptKey ?? "0"}` }));
  const publish = useEffectEvent((assessment: Assessment) => options.onAssessment?.(assessment));
  const draw = useEffectEvent((frame: HandFrame) => {
    if (overlayRef.current && videoRef.current) drawHandOverlay(overlayRef.current, videoRef.current, frame, mirrored);
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;
    let active = true;
    let closeTracker: (() => void) | undefined;
    let cancelFrames: (() => void) | undefined;
    let recognition: GestureClassifier | null = null;
    let lastPublished = -Infinity;
    let lastKey = "";
    let lastAssessment = "";
    let modelError = false;
    void (async () => {
      setSnapshot({ status: "LOADING", latencyMs: null, assessment: null, modelError: false });
      const { createHandTracker } = await import("@/lib/mediapipe/hand-tracker");
      if (!active) return;
      const tracker = await createHandTracker();
      if (!active) { tracker.close(); return; }
      closeTracker = () => tracker.close();
      if (assess) {
        try { recognition = await (await import("@/features/recognition/load-classifier")).loadClassifier(); }
        catch { modelError = true; }
      }
      if (!active) { tracker.close(); await recognition?.close(); return; }
      cancelFrames = scheduleVideoFrames(video, async ({ timestampMs }) => {
        const target = current();
        if (target.key !== lastKey) { recognition?.reset(); lastKey = target.key; }
        const { result, latencyMs } = tracker.detect(video, timestampMs);
        const status = checkRequiredHands(result, target.sign);
        draw(result.frame);
        let assessment: Assessment | null = null;
        try { assessment = recognition && !modelError ? await recognition.evaluate(result, target.sign) : null; }
        catch { modelError = true; }
        if (!active || current().key !== target.key) return;
        if (assessment) publish({ ...assessment, timestampMs });
        const key = `${status}:${assessment?.status}:${assessment?.predictedLetter}:${assessment?.reason}:${modelError}`;
        if (assessment?.accepted || key !== lastAssessment || timestampMs - lastPublished >= trackingConfig.statusIntervalMs) {
          lastPublished = timestampMs; lastAssessment = key;
          setSnapshot({ status, latencyMs, assessment, modelError, sourceKey: target.key });
        }
      }, () => { tracker.close(); if (active) setSnapshot({ status: "ERROR", latencyMs: null, assessment: null, modelError }); }, trackingConfig.minIntervalMs);
    })().catch(() => { closeTracker?.(); void recognition?.close(); if (active) setSnapshot({ status: "ERROR", latencyMs: null, assessment: null, modelError }); });
    return () => { active = false; cancelFrames?.(); closeTracker?.(); void recognition?.close(); };
  }, [videoRef, enabled, assess, attempt]);
  const visibleAssessment = snapshot.sourceKey === `${sign.id}:${options.attemptKey ?? "0"}` ? snapshot.assessment : null;
  return { ...snapshot, assessment: visibleAssessment, overlayRef, retry: () => setAttempt(value => value + 1) };
}
