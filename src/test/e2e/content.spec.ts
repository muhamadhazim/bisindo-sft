import { expect, test } from "@playwright/test";
import { gestureReferences } from "../../features/gesture-reference/references";
import { getPublishableSigns, referenceAssets } from "../../features/curriculum/content";
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

test("historical source photos preserve publisher checksums", () => {
  for (const asset of provenance) {
    const bytes = readFileSync(resolve("public", asset.url.slice(1)));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(asset.sha256);
  }
});

test("all published alphabet characters have matching source-linked reviewed poses", () => {
  const published = getPublishableSigns();
  expect(published).toHaveLength(26);
  for (const sign of published) {
    const pose = gestureReferences.find(p => p.symbol === sign.symbol)!;
    expect(pose.status).toBe("SOURCE_VERIFIED");
    expect(pose.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(pose.sourceUrl).toContain("githubusercontent.com");
    expect(pose.requiredHands).toBe(sign.requiredHands);
    expect(pose.motionType).toBe(sign.motionType);
    expect(sign.region).toBeNull();
    const asset = referenceAssets.find(a => a.id === sign.referenceAssetIds[0])!;
    expect(asset.url).toBe(pose.posterUrl);
    expect(readFileSync(resolve("public", asset.url.slice(1)), "utf8")).toContain("<svg");
  }
});
