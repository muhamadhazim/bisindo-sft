import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { CloClassifier, type CloModel } from "../../features/recognition/clo-classifier";
import { extractFeatures } from "../../features/recognition/features";
import type { HandFrame } from "../../types/tracking";
const modelText = readFileSync("public/models/rhio-clo-v1/model.json", "utf8");
const model = JSON.parse(modelText) as CloModel;
const report = JSON.parse(readFileSync("ml/rhio/evaluation.json", "utf8")) as { modelSha256: string; golden: Array<{ frame: HandFrame; vector: number[]; votes: number[]; predicted: string | null }> };

test("trained forest export preserves extractor and predictions on held-out golden vectors", () => {
  expect(createHash("sha256").update(modelText).digest("hex")).toBe(report.modelSha256);
  const classifier = new CloClassifier(model);
  for (const row of report.golden) {
    const actual = extractFeatures(row.frame)!;
    expect(actual).toHaveLength(row.vector.length);
    actual.forEach((value,index)=>expect(value).toBeCloseTo(row.vector[index]!,10));
    expect(classifier.votes(row.vector)).toEqual(row.votes);
    expect(classifier.classifyVector(row.vector)).toBe(row.predicted);
  }
});
test("classifier rejects invalid inputs, absent/opposite hands and out-of-distribution geometry", () => {
  const classifier = new CloClassifier(model);
  expect(classifier.classifyVector(Array(52).fill(0))).toBeNull();
  expect(classifier.classifyVector([NaN])).toBeNull();
  expect(classifier.classifyVector([...Array(50).fill(1000),0,1])).toBeNull();
  expect(() => new CloClassifier({...model, runtime:{name:"unsupported",version:"2.1.0"}})).toThrow();
  expect(() => new CloClassifier({...model, featureSchema:{...model.featureSchema,id:"wrong"}})).toThrow();
});

