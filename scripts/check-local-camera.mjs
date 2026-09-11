import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

// Explicit opt-in hardware check; no camera pixels, screenshots, or video are saved.
// Run the local production server on port 3000 first. Requires installed Chrome.
const browser = await chromium.launch({ channel: "chrome" });
try {
  const context = await browser.newContext({ permissions: ["camera"] });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3000/practice/bisindo-c-sanjaya-v1");
  await page.evaluate(() => {
    window.checkedStreams = [];
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      window.checkedStreams.push(stream);
      return stream;
    };
  });
  await page.getByRole("button", { name: "Mulai kamera", exact: true }).click();
  await page.getByRole("heading", { name: "Kamera aktif", exact: true }).waitFor({ timeout: 15000 });
  const dimensions = await page.locator("video").evaluate((video) => ({ width: video.videoWidth, height: video.videoHeight }));
  assert(dimensions.width > 0 && dimensions.height > 0, "Camera must deliver decoded frames");
  await page.getByRole("link", { name: "Amati lagi" }).click();
  await page.getByRole("heading", { name: "Bentuk huruf C", exact: true }).waitFor();
  const stopped = await page.evaluate(() => window.checkedStreams.length > 0 && window.checkedStreams.every((stream) => stream.getTracks().every((track) => track.readyState === "ended")));
  assert(stopped, "Every camera track must stop after route exit");
  console.log(JSON.stringify({ realDevice: true, dimensions, stoppedAfterRouteExit: stopped, framesRecorded: false }));
} finally {
  await browser.close();
}
