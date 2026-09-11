"use client";

import { useEffect, useEffectEvent, useRef, useState, type RefObject } from "react";
import { scheduleVideoFrames } from "@/lib/camera/frame-scheduler";
import { trackingConfig } from "@/lib/config/tracking";
import { checkRequiredHands } from "@/lib/mediapipe/canonicalize";
import { drawHandOverlay } from "@/lib/mediapipe/overlay";
import type { SignContent } from "@/types/content";
import type { HandRequirementStatus, HandFrame } from "@/types/tracking";

export type TrackingStatus = "LOADING" | "ERROR" | HandRequirementStatus;
type TrackingSnapshot = { status: TrackingStatus; latencyMs: number | null };

export function useHandTracking(videoRef: RefObject<HTMLVideoElement | null>, enabled: boolean, sign: Pick<SignContent, "requiredHands" | "handednessPolicy">, mirrored: boolean) {
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const [snapshot, setSnapshot] = useState<TrackingSnapshot>({ status: "LOADING", latencyMs: null });
  const [attempt, setAttempt] = useState(0);
  const draw = useEffectEvent((frame: HandFrame) => {
    if (overlayRef.current && videoRef.current) drawHandOverlay(overlayRef.current, videoRef.current, frame, mirrored);
  });
  const { requiredHands, handednessPolicy } = sign;
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
      setSnapshot({ status: "LOADING", latencyMs: null });
      const { createHandTracker } = await import("@/lib/mediapipe/hand-tracker");
      if (!active) return;
      const tracker = await createHandTracker();
      if (!active) { tracker.close(); return; }
      closeTracker = () => tracker.close();
      cancelFrames = scheduleVideoFrames(video, ({ timestampMs }) => {
        const { result, latencyMs } = tracker.detect(video, timestampMs);
        const status = checkRequiredHands(result, { requiredHands, handednessPolicy });
        draw(result.frame);
        if (status !== lastStatus || timestampMs - lastPublished >= trackingConfig.statusIntervalMs) {
          lastPublished = timestampMs;
          lastStatus = status;
          setSnapshot({ status, latencyMs });
        }
      }, () => { tracker.close(); if (active) setSnapshot({ status: "ERROR", latencyMs: null }); }, trackingConfig.minIntervalMs);
    })().catch(() => { if (active) setSnapshot({ status: "ERROR", latencyMs: null }); });
    return () => { active = false; cancelFrames?.(); closeTracker?.(); };
  }, [videoRef, enabled, requiredHands, handednessPolicy, attempt]);
  return { ...snapshot, overlayRef, retry: () => setAttempt((value) => value + 1) };
}
