import { expect, test } from "@playwright/test";
import { getPublishableSigns } from "../../features/curriculum/content";
import type { ContentSource, ReferenceAsset, SignContent } from "../../types/content";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import provenance from "../../../public/assets/signs/rhio-clo/provenance.json";

// Synthetic structural fixtures only; these describe no real BISINDO gesture.
const source: ContentSource = {
  id: "test-source", title: "Test fixture", publisherOrAuthor: "Test author", region: null,
};
const asset: ReferenceAsset = {
  id: "test-asset", kind: "SVG", url: "/test-only.svg", sourceId: source.id,
  license: "CC0-1.0", attribution: "Synthetic test fixture",
};
const sign: SignContent = {
  id: "test-only", symbol: "TEST", language: "BISINDO", region: null,
  sourceId: source.id, validationStatus: "SOURCE_VERIFIED", requiredHands: "ONE",
  handednessPolicy: "UNSPECIFIED", motionType: "STATIC", instruction: "Test-only text",
  commonMistakes: [], referenceAssetIds: [asset.id],
};

test("draft content stays unpublished even when references are complete", () => {
  expect(getPublishableSigns([{ ...sign, validationStatus: "DRAFT" }], [source], [asset])).toEqual([]);
});

test("verified content requires a traceable source and instruction", () => {
  expect(getPublishableSigns([sign], [], [asset])).toEqual([]);
  expect(getPublishableSigns([sign], [{ ...source, publisherOrAuthor: " " }], [asset])).toEqual([]);
  expect(getPublishableSigns([{ ...sign, instruction: " " }], [source], [asset])).toEqual([]);
});

test("missing, unlicensed, or unattributed assets prevent publication", () => {
  expect(getPublishableSigns([sign], [source], [])).toEqual([]);
  expect(getPublishableSigns([{ ...sign, referenceAssetIds: [] }], [source], [asset])).toEqual([]);
  expect(getPublishableSigns([sign], [source], [{ ...asset, license: null }])).toEqual([]);
  expect(getPublishableSigns([sign], [source], [{ ...asset, attribution: null }])).toEqual([]);
  expect(getPublishableSigns([sign], [source], [{ ...asset, sourceId: "unknown" }])).toEqual([]);
});

test("source-verified and validator-verified records can pass without inventing a region", () => {
  expect(getPublishableSigns([sign], [source], [asset])).toEqual([sign]);
  const reviewed = { ...sign, validationStatus: "VALIDATOR_VERIFIED" } as const;
  expect(getPublishableSigns([reviewed], [source], [asset])).toEqual([reviewed]);
  expect(sign.region).toBeNull();
});

test("published references preserve publisher checksums and traceable letter labels", () => {
  const published = getPublishableSigns();
  expect(published.length).toBeGreaterThanOrEqual(2);
  expect(new Set(provenance.map((asset) => asset.id)).size).toBe(provenance.length);
  for (const sign of published) {
    expect(sign.referenceAssetIds.length).toBeGreaterThan(0);
    for (const id of sign.referenceAssetIds) {
      const asset = provenance.find((entry) => entry.id === id);
      expect(asset?.symbol).toBe(sign.symbol);
      if (!asset) throw new Error(`Missing source asset ${id}`);
      const bytes = readFileSync(resolve("public", asset.url.slice(1)));
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
      expect(asset.sourceUrl).toContain("/Indonesian-Sign-Language-BISINDO-Hand-Sign-Detection-Dataset/blob/");
    }
  }
});

