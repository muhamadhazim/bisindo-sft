import type { CanonicalResult } from "@/types/tracking";
import type { SignContent } from "@/types/content";
import type { StabilizedResult } from "./stabilizer";

export const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"] as const;
export type AlphabetLetter = typeof alphabet[number];
export const isAlphabetLetter = (value: string): value is AlphabetLetter => (alphabet as readonly string[]).includes(value);
export type Assessment = StabilizedResult & {
  targetSignId: string;
  predictedLetter: AlphabetLetter | null;
  reason: "MATCH" | "OTHER_REFERENCE" | "OUTSIDE_REFERENCES" | "UNSUPPORTED_SIDE" | "UNSUPPORTED_CONTENT" | "TRACKING";
  modelVersion: string;
  timestampMs?: number;
};
export interface GestureClassifier {
  evaluate(input: CanonicalResult, target: SignContent): Promise<Assessment>;
  reset(): void;
  close(): Promise<void>;
}
