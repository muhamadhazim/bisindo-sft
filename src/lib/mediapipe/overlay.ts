import type { HandFrame, Landmark } from "@/types/tracking";

// MediaPipe landmark topology; these are drawing connections, not gesture rules.
const connections = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [0, 17], [17, 18], [18, 19], [19, 20],
] as const;

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
    const points = hand.landmarks.map(landmark => overlayPoint(landmark, video.videoWidth, video.videoHeight, width, height, mirror));
    ctx.lineCap = "round";
    ctx.beginPath();
    for (const [from, to] of connections) {
      const start = points[from], end = points[to];
      if (!start || !end) continue;
      ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y);
    }
    ctx.strokeStyle = "#12352c"; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = "#12352c"; ctx.lineWidth = 1.5;
    for (const landmark of hand.landmarks) {
      const point = overlayPoint(landmark, video.videoWidth, video.videoHeight, width, height, mirror);
      ctx.beginPath(); ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
    }
  }
}
