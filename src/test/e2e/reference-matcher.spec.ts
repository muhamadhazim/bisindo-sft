import { expect, test } from "@playwright/test";
import { ReferenceRecognitionEngine, geometryDistance } from "../../features/recognition/reference-matcher";
import model from "../../features/recognition/reference-model.json";
import { signContents } from "../../features/curriculum/content";

test("source exemplars match their label and reject a different supported target; not an accuracy evaluation", () => {
  const engine = new ReferenceRecognitionEngine();
  for (const p of model.prototypes) {
    const target = signContents.find(s => s.id === p.signId)!;
    const side = p.side as "LEFT" | "RIGHT";
    expect(engine.classify(p.vector, side, target).candidate).toBe("MATCH");
    const other = signContents.find(s => s.id !== p.signId && model.prototypes.some(q => q.side === side && q.signId === s.id))!;
    expect(engine.classify(p.vector, side, other).candidate).toBe("NON_MATCH");
    expect(engine.classify(p.vector, side, { ...target, sourceId: "unreviewed" }).candidate).toBe("UNCERTAIN");
    expect(engine.classify(p.vector, side, { ...target, validationStatus: "DRAFT" }).candidate).toBe("UNCERTAIN");
  }
});

test("unknown, invalid and unsupported handedness cannot be accepted", () => {
  const engine = new ReferenceRecognitionEngine();
  const p = model.prototypes[0]!;
  const target = signContents[0]!;
  const far = p.vector.map((v, i) => i < 50 ? 1000 : v);
  expect(engine.classify(far, "RIGHT", target).candidate).toBe("UNCERTAIN");
  expect(engine.classify(p.vector, "LEFT", target).candidate).toBe("UNCERTAIN");
  const left = model.prototypes.find(q => q.side === "LEFT")!;
  expect(engine.classify(left.vector, "LEFT", target).reason).toBe("UNSUPPORTED_SIDE");
  expect(geometryDistance([NaN], [0])).toBe(Infinity);
  expect(() => new ReferenceRecognitionEngine({ ...model, featureSchema: "incompatible" })).toThrow();
  expect(() => new ReferenceRecognitionEngine({ ...model, prototypes: [p] })).toThrow();
});
