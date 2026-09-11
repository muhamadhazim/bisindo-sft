import type { HandFrame } from "../../src/types/tracking";

type SourceSample = { id: string; label: string; sha256: string; groupId: string; split: string; publisherSplit: string };
type ExtractionRow = SourceSample & { tick: number; frame: HandFrame; vector: number[] | null };
type Schema = { id: string; length: number; normalizationVersion: string; landmarkerAssetId: string };

/** Fail before fitting when a cached extraction no longer agrees with its source manifest/runtime. */
export function validateTrainingData(
  manifest: { samples: SourceSample[] },
  dataset: { featureSchema: Schema; rows: ExtractionRow[] },
  expectedSchema: Schema,
  extract: (frame: HandFrame) => number[] | null,
): void {
  for (const key of ["id", "length", "normalizationVersion", "landmarkerAssetId"] as const) {
    if (dataset.featureSchema[key] !== expectedSchema[key]) throw new Error(`Feature schema mismatch: ${key}`);
  }
  const sources = new Map<string, SourceSample>();
  const groups = new Map<string, string>();
  for (const sample of manifest.samples) {
    if (sources.has(sample.id) || !["C", "L", "O"].includes(sample.label) || !["train", "validation", "test"].includes(sample.split) || !/^[a-f0-9]{64}$/.test(sample.sha256) || !sample.groupId) throw new Error("Invalid source manifest");
    if ((sample.publisherSplit === "test") !== (sample.split === "test")) throw new Error("Publisher test partition changed");
    for (const group of [sample.groupId, sample.sha256]) {
      if (groups.has(group) && groups.get(group) !== sample.split) throw new Error("Source group crosses partitions");
      groups.set(group, sample.split);
    }
    sources.set(sample.id, sample);
  }
  const observations = new Set<string>();
  for (const row of dataset.rows) {
    const source = sources.get(row.id);
    if (!source || ["label", "sha256", "groupId", "split", "publisherSplit"].some(key => row[key as keyof SourceSample] !== source[key as keyof SourceSample])) throw new Error(`Extraction provenance mismatch: ${row.id}`);
    const observation = `${row.id}:${row.tick}`;
    if (!Number.isInteger(row.tick) || row.tick < 0 || observations.has(observation)) throw new Error("Duplicate or invalid extraction tick");
    observations.add(observation);
    if (row.vector === null) continue;
    const actual = extract(row.frame);
    if (!actual || row.vector.length !== expectedSchema.length || !row.vector.every(Number.isFinite) || actual.some((v,i) => Math.abs(v-row.vector![i]!)>1e-10)) throw new Error(`Feature parity mismatch: ${row.id}`);
  }
  if (!observations.size) throw new Error("No extraction observations");
}
