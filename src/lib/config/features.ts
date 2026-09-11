// Heavy capabilities stay off until their phase passes its acceptance gates.
export const features = {
  ENABLE_3D_REFERENCE: false,
  ENABLE_DYNAMIC_RECOGNITION: false,
  ENABLE_NUMERIC_SIMILARITY: false,
  ENABLE_DEBUG_PANEL:
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true",
} as const;
