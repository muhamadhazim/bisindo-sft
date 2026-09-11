import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { canonicalizeHands, checkRequiredHands } from "../../lib/mediapipe/canonicalize";
import { overlayPoint } from "../../lib/mediapipe/overlay";
import provenance from "../../../public/models/mediapipe/provenance.json";

const points = (x: number) => Array.from({ length: 21 }, () => ({ x, y: 0.25, z: 0, visibility: 1 }));
const category = (name: string, score = 0.95) => ({ categoryName: name, score, index: 99, displayName: "" });
const raw = () => ({ landmarks: [points(0.2), points(0.8)], worldLandmarks: [], handedness: [[category("Right")], [category("Left")]] });

test("canonical hand slots follow confident labels even when detection order changes", () => {
  const original = raw();
  const first = canonicalizeHands(original, 100);
  const reversed = canonicalizeHands({ landmarks: [...original.landmarks].reverse(), worldLandmarks: [], handedness: [...original.handedness].reverse() }, 100);
  expect(first).toEqual(reversed);
  expect(first.frame.right?.landmarks[0]?.x).toBe(0.2);
  expect(first.frame.left?.landmarks[0]?.x).toBe(0.8);
  expect(original.landmarks[0]?.[0]?.x).toBe(0.2);
});

test("low, conflicting, duplicate, missing or malformed handedness stays uncertain", () => {
  for (const handedness of [ [[category("Right", 0.6)], [category("Left")]], [[category("Right")], [category("Right")]], [[category("Right", 0.8), category("Left", 0.75)], [category("Left")]], [[category("Unknown")], [category("Left")]], [] ]) {
    expect(canonicalizeHands({ ...raw(), handedness }, 100)).toMatchObject({ ambiguous: true, frame: { left: null, right: null } });
  }
  expect(canonicalizeHands({ ...raw(), landmarks: [points(NaN), points(0.8)] }, 100).ambiguous).toBe(true);
  expect(canonicalizeHands({ ...raw(), landmarks: [points(0.2).slice(1), points(0.8)] }, 100).ambiguous).toBe(true);
});

test("requirements distinguish no hand, one hand, two hands, and explicit side", () => {
  const empty = canonicalizeHands({ landmarks: [], worldLandmarks: [], handedness: [] }, 0);
  const one = canonicalizeHands({ landmarks: [points(0.2)], worldLandmarks: [], handedness: [[category("Right")]] }, 100);
  const two = canonicalizeHands(raw(), 100);
  expect(checkRequiredHands(empty, { requiredHands: "ONE", handednessPolicy: "UNSPECIFIED" })).toBe("NO_HAND");
  expect(checkRequiredHands(one, { requiredHands: "ONE", handednessPolicy: "UNSPECIFIED" })).toBe("TRACKING");
  expect(checkRequiredHands(one, { requiredHands: "TWO", handednessPolicy: "UNSPECIFIED" })).toBe("INSUFFICIENT_HANDS");
  expect(checkRequiredHands(two, { requiredHands: "TWO", handednessPolicy: "UNSPECIFIED" })).toBe("TRACKING");
  expect(checkRequiredHands(two, { requiredHands: "ONE", handednessPolicy: "UNSPECIFIED" })).toBe("UNCERTAIN");
  expect(checkRequiredHands(one, { requiredHands: "ONE", handednessPolicy: "LEFT" })).toBe("UNCERTAIN");
});

test("overlay accounts for contain letterboxing and mirror without mutating model coordinates", () => {
  const point = { x: 0.25, y: 0, z: 0.1 };
  expect(overlayPoint(point, 640, 480, 400, 400, false)).toEqual({ x: 100, y: 50 });
  expect(overlayPoint(point, 640, 480, 400, 400, true)).toEqual({ x: 300, y: 50 });
  expect(overlayPoint(point, 480, 640, 400, 400, false)).toEqual({ x: 125, y: 0 });
  expect(point).toEqual({ x: 0.25, y: 0, z: 0.1 });
});

test("hosted model and every WASM/JS asset match recorded checksums and installed runtime", () => {
  const packageJson = JSON.parse(readFileSync("node_modules/@mediapipe/tasks-vision/package.json", "utf8")) as { version: string };
  expect(packageJson.version).toBe(provenance.packageVersion);
  for (const asset of provenance.assets) {
    const data = readFileSync(asset.path);
    expect(data.byteLength).toBe(asset.bytes);
    expect(createHash("sha256").update(data).digest("hex")).toBe(asset.sha256);
    if (!asset.path.endsWith(".task")) {
      const name = asset.path.split("/").at(-1);
      expect(data.equals(readFileSync(`node_modules/@mediapipe/tasks-vision/wasm/${name}`))).toBe(true);
    }
  }
});
