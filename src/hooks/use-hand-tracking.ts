"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { scheduleVideoFrames } from "@/lib/camera/frame-scheduler";
import { trackingConfig } from "@/lib/config/tracking";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { drawHandOverlay } from "@/lib/mediapipe/overlay";
import type { SignContent } from "@/types/content";
import type { HandRequirementStatus, HandFrame } from "@/types/tracking";

import type { Assessment } from "@/features/recognition/clo-classifier";

export type TrackingStatus = "LOADING" | "ERROR" | HandRequirementStatus;
type TrackingSnapshot = { status: TrackingStatus; latencyMs: number | null; assessment: Assessment | null };

export function useHandTracking(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, sign: SignContent, mirrored: boolean, assess = false) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, setSnapshot] = useState<TrackingSnapshot>({ status: "LOADING", latencyMs: null, assessment: null });
  const [attempt, setAttempt] = useState(0);
  const draw = useEffectEvent((frame: HandFrame) => {
    if (overlayRef.current && videoRef.current) drawHandOverlay(overlayRef.current, videoRef.current, frame, mirrored);
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!enabled || !video) return;
    let active = true;
    let closeTracker: (() => void) | undefined;
    let cancelFrames: (() => void) | undefined;
    let lastPublished = -Infinity;
    let lastStatus: TrackingStatus = "LOADING";
    // Async setup keeps the heavy runtime outside the landing and non-camera path.
    void (async () => {
      setSnapshot({ status: "LOADING", latencyMs: null, assessment: null });
      const { createHandTracker } = await import("@/lib/mediapipe/hand-tracker");
      const recognition = assess ? await (await import("@/features/recognition/clo-classifier")).loadCloClassifier() : null;
      if (!active) return;
      const tracker = await createHandTracker();
      if (!active) { tracker.close(); return; }
      closeTracker = () => tracker.close();
      cancelFrames = scheduleVideoFrames(video, ({ timestampMs }) => {
        const { result, latencyMs } = tracker.detect(video, timestampMs);
        const status = checkRequiredHands(result, sign);
        const assessment = recognition?.evaluate(result, sign) ?? null;
        draw(result.frame);
        if (assessment?.accepted || status !== lastStatus || timestampMs - lastPublished >= trackingConfig.statusIntervalMs) {
          lastPublished = timestampMs;
          lastStatus = status;
          setSnapshot({ status, latencyMs, assessment });
        }
      }, () => { tracker.close(); if (active) setSnapshot({ status: "ERROR", latencyMs: null, assessment: null }); }, trackingConfig.minIntervalMs);
    })().catch(() => { if (active) setSnapshot({ status: "ERROR", latencyMs: null, assessment: null }); });
    return () => { active = false; cancelFrames?.(); closeTracker?.(); };
  }, [videoRef, enabled, sign, assess, attempt]);
  return { ...snapshot, overlayRef, retry: () => setAttempt((value) => value + 1) };
}


