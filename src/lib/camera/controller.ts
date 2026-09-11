export type CameraStatus = "IDLE" | "REQUESTING" | "READY" | "DENIED" | "NOT_FOUND" | "NOT_READABLE" | "UNSUPPORTED" | "ERROR";

export const cameraConstraints: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } },
};

export function cameraErrorStatus(error: unknown): CameraStatus {
  const name = error instanceof Error ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "DENIED";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "NOT_FOUND";
  if (name === "NotReadableError" || name === "AbortError") return "NOT_READABLE";
  if (name === "NotSupportedError") return "UNSUPPORTED";
  return "ERROR";
}

/** Owns the stream only. It never reads pixels, mirrors, or recognizes gestures. */
export class CameraController {
  private generation = 0;
  private stream: MediaStream | null = null;
  private detachTracks: (() => void) | null = null;
  private status: CameraStatus = "IDLE";

  constructor(private readonly video: HTMLVideoElement, private readonly onStatus: (status: CameraStatus) => void) {}

  private setStatus(status: CameraStatus) {
    this.status = status;
    this.onStatus(status);
  }

  private release() {
    this.detachTracks?.();
    this.detachTracks = null;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
    this.video.pause();
    this.video.srcObject = null;
  }

  async start() {
    if (this.status === "REQUESTING" || this.status === "READY") return;
    const generation = ++this.generation;
    this.release();
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      this.setStatus("UNSUPPORTED");
      return;
    }
    this.setStatus("REQUESTING");
    try {
      const stream = await navigator.mediaDevices.getUserMedia(cameraConstraints);
      if (generation !== this.generation) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      this.stream = stream;
      const tracks = stream.getVideoTracks();
      if (!tracks.length || tracks.some((track) => track.readyState === "ended")) {
        throw new DOMException("Camera unavailable", "NotReadableError");
      }
      const ended = () => { this.stop(); this.setStatus("NOT_READABLE"); };
      tracks.forEach((track) => track.addEventListener("ended", ended));
      this.detachTracks = () => tracks.forEach((track) => track.removeEventListener("ended", ended));
      this.video.srcObject = stream;
      this.video.muted = true;
      this.video.playsInline = true;
      await this.video.play();
      if (generation === this.generation) this.setStatus("READY");
    } catch (error) {
      if (generation !== this.generation) return;
      this.release();
      this.setStatus(cameraErrorStatus(error));
    }
  }

  stop() {
    ++this.generation;
    this.release();
    this.setStatus("IDLE");
  }
}
