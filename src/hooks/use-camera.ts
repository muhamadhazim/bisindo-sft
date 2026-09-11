"use client";

import { useEffect, useRef, useState } from "react";
import { CameraController, type CameraStatus } from "@/lib/camera/controller";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controller = useRef<CameraController | null>(null);
  const [status, setStatus] = useState<CameraStatus>("IDLE");

  useEffect(() => {
    if (!videoRef.current) return;
    let mounted = true;
    const instance = new CameraController(videoRef.current, (next) => { if (mounted) setStatus(next); });
    controller.current = instance;
    const onPageHide = () => instance.stop();
    const onVisibility = () => { if (document.visibilityState === "hidden") instance.stop(); };
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mounted = false;
      instance.stop();
      controller.current = null;
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return { videoRef, status, start: () => controller.current?.start(), stop: () => controller.current?.stop() };
}
