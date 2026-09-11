export type ValidationStatus = "DRAFT" | "SOURCE_VERIFIED" | "VALIDATOR_VERIFIED";

export type ContentSource = {
  id: string;
  title: string;
  publisherOrAuthor: string;
  url?: string;
  license?: string;
  region?: string | null;
  notes?: string;
};

export type ReferenceAsset = {
  id: string;
  kind: "IMAGE" | "VIDEO" | "GLB" | "SVG";
  url: string;
  sourceId: string;
  license: string | null;
  attribution: string | null;
};

export type SignContent = {
  id: string;
  symbol: string;
  language: "BISINDO";
  region: string | null;
  sourceId: string;
  validationStatus: ValidationStatus;
  requiredHands: "ONE" | "TWO";
  handednessPolicy: "UNSPECIFIED" | "EITHER" | "LEFT" | "RIGHT" | "VALIDATOR_DEFINED";
  motionType: "STATIC" | "DYNAMIC";
  instruction: string;
  commonMistakes: string[];
  referenceAssetIds: string[];
};
