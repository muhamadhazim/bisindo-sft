import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } });
type CameraTestWindow = Window & {
  cameraStreams: MediaStream[];
  cameraConstraints: MediaStreamConstraints[];
  releaseCamera?: () => void;
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as CameraTestWindow;
    state.cameraStreams = [];
    state.cameraConstraints = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      state.cameraConstraints.push(constraints ?? {});
      const stream = await original(constraints);
      state.cameraStreams.push(stream);
      return stream;
    };
  });
});

test("realtime stream starts by action, fits mobile, mirrors only display, stops and restarts", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  const uploads: string[] = [];
  page.on("requestfinished", (request) => { if (request.method() !== "GET") uploads.push(request.url()); });
  const response = await page.goto("/practice/bisindo-c-sanjaya-v1");
  expect(response?.headers()["content-security-policy"]).toBe("connect-src 'self'");
  expect(await page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams.length)).toBe(0);
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kamera aktif", exact: true })).toBeVisible();
  const video = page.getByLabel("Preview kamera langsung");
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBeGreaterThan(0);
  expect(await video.evaluate((element: HTMLVideoElement) => element.playsInline && element.muted && element.autoplay)).toBe(true);
  expect(await page.evaluate(() => (window as unknown as CameraTestWindow).cameraConstraints[0])).toEqual({ audio: false, video: { facingMode: { ideal: "user" }, width: { ideal: 640 }, height: { ideal: 480 } } });
  expect(await video.evaluate((element) => getComputedStyle(element).transform)).toContain("-1");
  await page.getByRole("checkbox", { name: "Tampilan cermin" }).uncheck();
  expect(await video.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  expect(await page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams.length)).toBe(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/camera-360.png", fullPage: true });
  await page.getByRole("button", { name: "Hentikan kamera" }).click();
  expect(await page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
  expect(await video.evaluate((element: HTMLVideoElement) => element.srcObject)).toBeNull();
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kamera aktif", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Amati lagi" }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
  expect(uploads).toEqual([]);
});

for (const [name, heading] of [
  ["NotAllowedError", "Izin kamera belum diberikan"],
  ["NotFoundError", "Kamera tidak ditemukan"],
  ["NotReadableError", "Kamera tidak dapat digunakan"],
  ["UnknownError", "Kamera gagal dimulai"],
]) {
  test(`camera failure ${name} leaves reference usable`, async ({ page }) => {
    await page.addInitScript((errorName) => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Injected test failure", errorName); }; }, name);
    await page.goto("/practice/bisindo-c-sanjaya-v1");
    await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Coba kamera lagi" })).toBeVisible();
    await page.getByRole("link", { name: "Amati lagi" }).click();
    await expect(page.getByRole("img")).toHaveCount(3);
  });
}

test("unsupported browser never attempts a stream", async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(navigator, "mediaDevices", { value: undefined }); });
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kamera tidak didukung di halaman ini" })).toBeVisible();
});

for (const action of ["cancel", "navigate"]) {
  test(`late permission after ${action} cannot leave the camera running`, async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as unknown as CameraTestWindow;
      const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
      navigator.mediaDevices.getUserMedia = async (constraints) => {
        const stream = await original(constraints);
        await new Promise<void>((resolve) => { state.releaseCamera = resolve; });
        return stream;
      };
    });
    await page.goto("/practice/bisindo-c-sanjaya-v1");
    await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
    await expect.poll(() => page.evaluate(() => !!(window as unknown as CameraTestWindow).releaseCamera)).toBe(true);
    if (action === "cancel") await page.getByRole("button", { name: "Batalkan" }).click();
    else await page.getByRole("link", { name: "Amati lagi" }).click();
    await page.evaluate(() => (window as unknown as CameraTestWindow).releaseCamera?.());
    await expect.poll(() => page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
  });
}

test("device ended and pagehide stop all tracks", async ({ page }) => {
  await page.goto("/practice/bisindo-l-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Kamera aktif", exact: true })).toBeVisible();
  await page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams[0]?.getVideoTracks()[0]?.dispatchEvent(new Event("ended")));
  await expect(page.getByRole("heading", { name: "Kamera tidak dapat digunakan" })).toBeVisible();
  await page.getByRole("button", { name: "Coba kamera lagi" }).click();
  await expect(page.getByRole("heading", { name: "Kamera aktif", exact: true })).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(page.getByRole("heading", { name: "Siap berlatih langsung?", exact: true })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as CameraTestWindow).cameraStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")))).toBe(true);
});
