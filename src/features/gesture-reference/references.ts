import data from "./poses.json";
import type { GestureReference } from "./types";

export const gestureReferences = data as GestureReference[];
export const getGestureReference = (symbol: string) => gestureReferences.find(p => p.symbol === symbol && p.status === "SOURCE_VERIFIED");
