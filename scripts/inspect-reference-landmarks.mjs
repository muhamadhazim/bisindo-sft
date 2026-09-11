import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import ts from "typescript";

// Offline reference analysis only. Uses licensed public images, never a webcam.
// Start the production server on localhost:3000. Generated report stays in .tools.
const useOriginals = process.argv.includes("--originals");
const sequence = process.argv.includes("--sequence");
const references = JSON.parse(await readFile(useOriginals ? "src/features/recognition/original-references.json" : "public/assets/signs/sanjaya-v1/provenance.json", "utf8"));
if (useOriginals) {
  await mkdir(".tools/references/originals", { recursive: true });
  for (const reference of references) {
    let data;
    try { data = await readFile(reference.file); }
    catch (error) {
      if (error.code !== "ENOENT") throw error;
      const response = await fetch(reference.sourceUrl);
      if (!response.ok) throw new Error(`Original reference download failed: ${reference.id}`);
      data = Buffer.from(await response.arrayBuffer());
    }
    if (createHash("sha256").update(data).digest("hex") !== reference.sha256) throw new Error(`Original reference checksum mismatch: ${reference.id}`);
    await writeFile(reference.file, data);
  }
}
const modules = {
  "/__analysis/vision.mjs": "node_modules/@mediapipe/tasks-vision/vision_bundle.mjs",
  "/__analysis/config.mjs": "src/lib/config/tracking.ts",
  "/__analysis/canonicalize.mjs": "src/lib/mediapipe/canonicalize.ts",
  "/__analysis/features.mjs": "src/features/recognition/features.ts",
};
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  if (useOriginals) await page.route("**/__originals/*.jpg", async (route) => {
    const reference = references.find((reference) => reference.url === new URL(route.request().url()).pathname);
    if (!reference) return route.abort();
    await route.fulfill({ contentType: "image/jpeg", body: await readFile(reference.file) });
  });
  await page.route("**/__analysis/*.mjs", async (route) => {
    const file = modules[new URL(route.request().url()).pathname];
    if (!file) return route.abort();
    let body = await readFile(file, "utf8");
    if (file.endsWith(".ts")) body = ts.transpileModule(body, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('"@/lib/config/tracking"', '"/__analysis/config.mjs"');
    await route.fulfill({ contentType: "text/javascript", body });
  });
  await page.goto("http://127.0.0.1:3000/credits");
  const samples = await page.evaluate(async ({ references, sequence }) => {
    const { FilesetResolver, HandLandmarker } = await import("/__analysis/vision.mjs");
    const { trackingConfig } = await import("/__analysis/config.mjs");
    const { canonicalizeHands } = await import("/__analysis/canonicalize.mjs");
    const { extractFeatures, featureSchema } = await import("/__analysis/features.mjs");
    const fileset = await FilesetResolver.forVisionTasks(trackingConfig.wasmRoot);
    const samples = [];
    for (const reference of references) {
      const model = await HandLandmarker.createFromOptions(fileset, { baseOptions: { modelAssetPath: trackingConfig.modelPath, delegate: "CPU" }, runningMode: "VIDEO", numHands: 2, minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
      try {
        const image = new Image(); image.src = reference.url; await image.decode();
        const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Reference analysis canvas unavailable");
        context.fillStyle = "#eee"; context.fillRect(0, 0, 640, 480);
        const size = sequence ? 480 : 440;
        const scale = Math.min(size / image.width, size / image.height);
        context.drawImage(image, (640 - image.width * scale) / 2, (480 - image.height * scale) / 2, image.width * scale, image.height * scale);
        for (let tick = 0; tick < (sequence ? 12 : 1); tick++) {
          const timestamp = 1000 + tick * 100;
          const start = performance.now();
          const raw = model.detectForVideo(canvas, timestamp);
          const result = canonicalizeHands(raw, timestamp);
          const vector = result.ambiguous || !result.frame.left && !result.frame.right ? null : extractFeatures(result.frame);
          samples.push({ id: reference.id, symbol: reference.symbol, sourceId: reference.sourceId, assetSha256: reference.sha256, featureSchema, frame: result.frame, ambiguous: result.ambiguous, handedness: raw.handedness.map((categories) => categories.map(({ categoryName, score }) => ({ categoryName, score }))), vector, latencyMs: performance.now() - start });
        }
      } finally { model.close(); }
    }
    return samples;
  }, { references, sequence });
  await mkdir(".tools/references", { recursive: true });
  await writeFile(`.tools/references/landmark-analysis${useOriginals ? "-originals" : ""}${sequence ? "-sequence" : ""}.json`, JSON.stringify({ purpose: "Reference investigation, not live validation or classifier acceptance", input: `${useOriginals ? "Original" : "Publisher resized"} licensed images, aspect preserved within ${sequence ? 480 : 440}px on 640x480 light-gray canvas; no mirroring or camera input; ${sequence ? "12 repeated frames, 100ms timestamps" : "one frame"}`, samples }, null, 2));
  console.log(JSON.stringify(samples.map(({ id, ambiguous, handedness, vector, latencyMs }) => ({ id, ambiguous, handedness, usableFeatures: !!vector, latencyMs })), null, 2));
} finally { await browser.close(); }
