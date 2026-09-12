import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import ortProvenance from "../../../public/models/onnxruntime-1.29.0/provenance.json";
import { readFileSync } from "node:fs";
import replay from "../../../ml/alphabet-v2/replay.json";
import metadata from "../../../public/models/alphabet-mlp-v2/metadata.json";
import envelopes from "../../../public/models/alphabet-mlp-v2/envelopes.json";
import { decideAlphabet, validateEnvelopes, validateMetadata } from "../../features/recognition/alphabet-model";
import { serveBrowserModules } from "../browser-modules";

test("all 682 exported decisions reproduce the held-out Colab report", () => {
  validateMetadata(metadata); validateEnvelopes(envelopes);
  for (const row of replay) expect(decideAlphabet(row.vector, row.probabilities, envelopes)).toBe(row.predicted);
  expect(() => validateMetadata({ ...metadata, threshold: .4 })).toThrow();
  expect(() => validateMetadata({ ...metadata, labels: [...metadata.labels].reverse() })).toThrow();
  expect(() => validateEnvelopes([])).toThrow();
  expect(decideAlphabet(Array(52).fill(0), replay[0]!.probabilities, envelopes)).toBeNull();
  expect(decideAlphabet([NaN], replay[0]!.probabilities, envelopes)).toBeNull();
  expect(decideAlphabet(replay[0]!.vector, Array(26).fill(.5), envelopes)).toBeNull();
  expect(decideAlphabet([...Array(50).fill(999), 0, 1], replay[0]!.probabilities, envelopes)).toBeNull();
});

test("actual browser ONNX loader reproduces every test probability and rejection", async ({ page }) => {
  test.setTimeout(90000);
  await serveBrowserModules(page);
  await page.goto("/");
  const result = await page.evaluate(async rows => {
    const modulePath = "/__modules/src/features/recognition/alphabet-classifier.ts";
    const decisionPath = "/__modules/src/features/recognition/alphabet-model.ts";
    const { loadAlphabetClassifier } = await import(modulePath);
    const { decideAlphabet } = await import(decisionPath);
    const refs = await (await fetch("/models/alphabet-mlp-v2/envelopes.json")).json();
    const start = performance.now();
    const model = await loadAlphabetClassifier();
    const loaded = performance.now();
    let maxError = 0, mismatches = 0;
    try {
      for (const row of rows) {
        const p: number[] = await model.probabilities(row.vector);
        maxError = Math.max(maxError, ...p.map((v, i) => Math.abs(v - row.probabilities[i]!)));
        if (decideAlphabet(row.vector, p, refs) !== row.predicted) mismatches++;
      }
    } finally { await model.close(); }
    return { maxError, mismatches, loadMs: loaded - start, perInferenceMs: (performance.now() - loaded) / rows.length };
  }, replay);
  expect(result.maxError).toBeLessThanOrEqual(1e-5);
  expect(result.mismatches).toBe(0);
  console.log("Browser alphabet parity", result);
});

test("browser rejects modified metadata before creating a model session", async ({ page }) => {
  await serveBrowserModules(page);
  await page.route("**/models/alphabet-mlp-v2/metadata.json", route => route.fulfill({ contentType: "application/json", body: readFileSync("public/models/alphabet-mlp-v2/metadata.json", "utf8").replace('"2.0.0"', '"9.0.0"') }));
  await page.goto("/");
  const rejected = await page.evaluate(async () => {
    const p = "/__modules/src/features/recognition/alphabet-classifier.ts";
    try { await (await import(p)).loadAlphabetClassifier(); return false; } catch { return true; }
  });
  expect(rejected).toBe(true);
});

test("contract rejects drift, valid tied scores, absent masks and invalid probabilities", () => {
  for (const override of [
    { runtime: { name: "onnxruntime-web", version: "0.0.0" } },
    { featureSchema: { ...metadata.featureSchema, id: "wrong" } },
    { input: { ...metadata.input, shape: [1, 53] } },
    { output: { ...metadata.output, shape: [1, 25] } },
    { landmarker: { ...metadata.landmarker, minIntervalMs: 999 } },
  ]) expect(() => validateMetadata({ ...metadata, ...override })).toThrow();
  const vector = replay[0]!.vector;
  expect(decideAlphabet(vector, [.5, .5, ...Array(24).fill(0)], envelopes)).toBeNull();
  expect(decideAlphabet(vector, [NaN, ...Array(25).fill(0)], envelopes)).toBeNull();
  const opposite = vector.slice(); opposite[50] = vector[50] ? 0 : 1; opposite[51] = vector[51] ? 0 : 1;
  expect(decideAlphabet(vector, [1, ...Array(25).fill(0)], [{ label: "A", maxDistance: 100, vectors: [opposite] }])).toBeNull();
});

test("local ONNX WASM assets match pinned package checksums", () => {
  expect(ortProvenance.version).toBe("1.29.0");
  for (const asset of ortProvenance.assets) {
    const local = readFileSync(`public/models/onnxruntime-1.29.0/${asset.name}`);
    const installed = readFileSync(`node_modules/onnxruntime-web/dist/${asset.name}`);
    expect(local.length).toBe(asset.bytes);
    expect(createHash("sha256").update(local).digest("hex")).toBe(asset.sha256);
    expect(local.equals(installed)).toBe(true);
  }
});
