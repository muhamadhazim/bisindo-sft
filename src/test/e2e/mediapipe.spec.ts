import { expect, test } from "@playwright/test";

test.use({ launchOptions: { args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] } });

test("real pinned model loads locally only after start and reports no hand on synthetic blank input", async ({ page }) => {
  const modelRequests: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/models/")) modelRequests.push(request.url()); });
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  expect(modelRequests).toEqual([]);
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByText("Belum ada tangan terlihat.", { exact: false })).toBeVisible({ timeout: 20000 });
  expect(modelRequests.some((url) => url.endsWith(".task"))).toBe(true);
  expect(modelRequests.every((url) => url.startsWith("http://127.0.0.1:3100/"))).toBe(true);
  await page.getByRole("button", { name: "Hentikan kamera" }).click();
});

test("failed model download has recovery and can retry successfully", async ({ page }) => {
  await page.route("**/*.task", (route) => route.abort());
  await page.goto("/practice/bisindo-c-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByRole("button", { name: "Coba pelacakan lagi" })).toBeVisible({ timeout: 20000 });
  await expect(page.getByRole("link", { name: "Amati lagi" })).toBeVisible();
  await page.unroute("**/*.task");
  await page.getByRole("button", { name: "Coba pelacakan lagi" }).click();
  await expect(page.getByText("Belum ada tangan terlihat.", { exact: false })).toBeVisible({ timeout: 20000 });
  await page.getByRole("button", { name: "Hentikan kamera" }).click();
});

test("VIDEO tracker detects a hand from a licensed reference stream fixture", async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const image = new Image(); image.src = "/assets/signs/sanjaya-v1/l-0.jpg"; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Test canvas unavailable");
      const draw = () => { context.fillStyle = "#eee"; context.fillRect(0, 0, 640, 480); context.drawImage(image, 80, 0, 480, 480); };
      draw();
      const stream = canvas.captureStream(12);
      const timer = window.setInterval(draw, 80);
      for (const track of stream.getTracks()) {
        const stop = track.stop.bind(track);
        track.stop = () => { clearInterval(timer); stop(); };
      }
      return stream;
    };
  });
  await page.goto("/practice/bisindo-l-sanjaya-v1");
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await expect(page.getByText("Tangan terlihat.", { exact: true })).toBeVisible({ timeout: 20000 });
  const overlay = page.locator("canvas.camera-overlay");
  await expect(overlay).toBeVisible();
  await expect.poll(() => overlay.evaluate((canvas: HTMLCanvasElement) => {
    const pixels = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    return pixels.some((value, index) => index % 4 === 3 && value > 0);
  })).toBe(true);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.screenshot({ path: "test-results/hand-overlay-360.png", fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole("checkbox", { name: "Titik dan garis tangan" }).uncheck();
  await expect(overlay).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Titik dan garis tangan" }).check();
  await expect(overlay).toBeVisible();
  await page.getByRole("button", { name: "Hentikan kamera" }).click();
  await expect(overlay).toHaveCount(0);
});

