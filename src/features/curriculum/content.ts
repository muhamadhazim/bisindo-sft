import type { ContentSource, ReferenceAsset, SignContent } from "@/types/content";
import { contentSources } from "./sources";
import provenance from "../../../public/assets/signs/sanjaya-v1/provenance.json";

// Source comparison is recorded in public/assets/signs/sanjaya-v1/REVIEW.md.
// This is not human-validator approval or recognition-model acceptance.
export const referenceAssets: readonly ReferenceAsset[] = provenance.map((asset) => ({
  id: asset.id,
  kind: "IMAGE",
  url: asset.url,
  sourceId: asset.sourceId,
  license: asset.license,
  attribution: asset.attribution,
}));

export const signContents: readonly SignContent[] = ["C", "L", "O"].map((symbol) => ({
  id: `bisindo-${symbol.toLowerCase()}-sanjaya-v1`,
  symbol,
  language: "BISINDO",
  region: null,
  sourceId: "sanjaya-bisindo-alphabet-2024-v1",
  validationStatus: "SOURCE_VERIFIED",
  requiredHands: "ONE",
  handednessPolicy: "UNSPECIFIED",
  motionType: "STATIC",
  instruction: `Amati contoh huruf ${symbol} dari referensi Sanjaya. Perhatikan bentuk jari dan arah telapak pada beberapa contoh, lalu tirukan bentuk yang ditampilkan menggunakan satu tangan.`,
  commonMistakes: [],
  referenceAssetIds: provenance.filter((asset) => asset.symbol === symbol).map((asset) => asset.id),
}));

/** Structural publication gate; linguistic review still happens before promotion. */
export function getPublishableSigns(
  signs: readonly SignContent[] = signContents,
  sources: readonly ContentSource[] = contentSources,
  assets: readonly ReferenceAsset[] = referenceAssets,
): SignContent[] {
  return signs.filter((sign) => {
    if (sign.validationStatus !== "SOURCE_VERIFIED" && sign.validationStatus !== "VALIDATOR_VERIFIED") {
      return false;
    }

    const source = sources.find((entry) => entry.id === sign.sourceId);
    if (!source?.title.trim() || !source.publisherOrAuthor.trim() || !sign.instruction.trim()) {
      return false;
    }

    return sign.referenceAssetIds.length > 0 && sign.referenceAssetIds.every((id) => {
      const asset = assets.find((entry) => entry.id === id);
      return !!(
        asset?.url.trim() &&
        asset.license?.trim() &&
        asset.attribution?.trim() &&
        sources.some((entry) => entry.id === asset.sourceId)
      );
    });
  });
}
