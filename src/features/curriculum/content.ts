import type { ContentSource, ReferenceAsset, SignContent } from "@/types/content";
import { contentSources } from "./sources";
import { gestureReferences } from "@/features/gesture-reference/references";

export const referenceAssets: readonly ReferenceAsset[] = gestureReferences.map(pose => ({
  id: pose.id, kind: "SVG", url: pose.posterUrl, sourceId: pose.sourceId,
  license: pose.license, attribution: pose.attribution, width: 480, height: 390,
}));

export const signContents: readonly SignContent[] = gestureReferences.map(pose => ({
  id: pose.signId,
  symbol: pose.symbol, language: "BISINDO", region: null, sourceId: pose.sourceId,
  validationStatus: pose.status, requiredHands: pose.requiredHands,
  handednessPolicy: "UNSPECIFIED", motionType: pose.motionType, practiceMode: "POSE_SNAPSHOT",
  instruction: `Amati contoh karakter ${pose.symbol} dari sudut depan. Tampilkan ${pose.requiredHands === "TWO" ? "kedua tangan" : "satu tangan"} dengan bentuk dan arah sesuai contoh. ${pose.limitation}`,
  commonMistakes: [], referenceAssetIds: [pose.id],
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

