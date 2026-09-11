import type { HandFrame, Landmark } from "@/types/tracking";

export function overlayPoint(point: Landmark, videoWidth: number, videoHeight: number, width: number, height: number, mirror: boolean) {
  const scale = Math.min(width / videoWidth, height / videoHeight);
  const contentWidth = videoWidth * scale;
  const contentHeight = videoHeight * scale;
  return { x: (width - contentWidth) / 2 + (mirror ? 1 - point.x : point.x) * contentWidth, y: (height - contentHeight) / 2 + point.y * contentHeight };
}

export function drawHandOverlay(canvas: HTMLCanvasElement, video: HTMLVideoElement, frame: HandFrame, mirror: boolean) {
  const { width, height } = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }
  const ctx = canvas.getContext("2d");
  if (!ctx || !video.videoWidth || !video.videoHeight) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  for (const hand of [frame.left, frame.right]) {
    if (!hand) continue;
    ctx.fillStyle = hand.side === "LEFT" ? "#d6eb77" : "#77dcff";
    for (const landmark of hand.landmarks) {
      const point = overlayPoint(landmark, video.videoWidth, video.videoHeight, width, height, mirror);
      ctx.beginPath(); ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI); ctx.fill();
    }
  }
}
