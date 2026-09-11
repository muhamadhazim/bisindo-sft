import type { ContentSource, ReferenceAsset, SignContent } from "@/types/content";
import { contentSources } from "./sources";

// Intentionally empty until individual content and licensed assets are verified.
export const signContents: readonly SignContent[] = [];
export const referenceAssets: readonly ReferenceAsset[] = [];

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
