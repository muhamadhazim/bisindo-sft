import type { GestureClassifier } from "./types";

/** Explicit developer rollback; never an automatic error fallback. */
export async function loadClassifier(): Promise<GestureClassifier> {
  if (process.env.NEXT_PUBLIC_RECOGNITION_ENGINE === "clo-rf") {
    const { loadCloClassifier, CloClassifier } = await import("./clo-classifier");
    let classifier = await loadCloClassifier();
    return {
      evaluate: async (input, target) => classifier.evaluate(input, target),
      reset: () => { classifier = new CloClassifier(classifier.model); },
      close: async () => undefined,
    };
  }
  return (await import("./alphabet-classifier")).loadAlphabetClassifier();
}
