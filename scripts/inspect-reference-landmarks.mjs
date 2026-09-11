import { chromium } from "@playwright/test";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import ts from "typescript";

// Offline reference analysis only. Uses licensed public images, never a webcam.
// Start the production server on localhost:3000. Generated report stays in .tools.
const references = JSON.parse(await readFile("public/assets/signs/sanjaya-v1/provenance.json", "utf8"));
const modules = {
  "/__analysis/vision.mjs": "node_modules/@mediapipe/tasks-vision/vision_bundle.mjs",
  "/__analysis/config.mjs": "src/lib/config/tracking.ts",
  "/__analysis/canonicalize.mjs": "src/lib/mediapipe/canonicalize.ts",
  "/__analysis/features.mjs": "src/features/recognition/features.ts",
};
const browser = await chromium.launch({ channel: "chrome" });
try {
  const page = await browser.newPage();
  await page.route("**/__analysis/*.mjs", async (route) => {
    const file = modules[new URL(route.request().url()).pathname];
    if (!file) return route.abort();
    let body = await readFile(file, "utf8");
    if (file.endsWith(".ts")) body = ts.transpileModule(body, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replaceAll('"@/lib/config/tracking"', '"/__analysis/config.mjs"');
    await route.fulfill({ contentType: "text/javascript", body });
  });
  await page.goto("http://127.0.0.1:3000/credits");
  const samples = await page.evaluate(async (references) => {
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
        const scale = Math.min(440 / image.width, 440 / image.height);
        context.drawImage(image, (640 - image.width * scale) / 2, (480 - image.height * scale) / 2, image.width * scale, image.height * scale);
        const start = performance.now();
        const raw = model.detectForVideo(canvas, 1000);
        const result = canonicalizeHands(raw, 1000);
        const vector = result.ambiguous || !result.frame.left && !result.frame.right ? null : extractFeatures(result.frame);
        samples.push({ id: reference.id, symbol: reference.symbol, sourceId: reference.sourceId, assetSha256: reference.sha256, featureSchema, frame: result.frame, ambiguous: result.ambiguous, handedness: raw.handedness.map((categories) => categories.map(({ categoryName, score }) => ({ categoryName, score }))), vector, latencyMs: performance.now() - start });
      } finally { model.close(); }
    }
    return samples;
  }, references);
  await mkdir(".tools/references", { recursive: true });
  await writeFile(".tools/references/landmark-analysis.json", JSON.stringify({ purpose: "Reference investigation, not live validation or classifier acceptance", input: "9 licensed publisher images, aspect preserved within 440px on 640x480 light-gray canvas; no mirroring or camera input", samples }, null, 2));
  console.log(JSON.stringify(samples.map(({ id, ambiguous, handedness, vector, latencyMs }) => ({ id, ambiguous, handedness, usableFeatures: !!vector, latencyMs })), null, 2));
} finally { await browser.close(); }
