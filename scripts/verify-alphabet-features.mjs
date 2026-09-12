import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { loadTrainingContract } from './load-training-contract.mjs';
const { extractFeatures, featureSchema } = await loadTrainingContract();
const dataset = JSON.parse(await readFile('ml/bisindo-dataset-raw-backup/features.json', 'utf8'));
assert.deepEqual(dataset.featureSchema, featureSchema);
let checked = 0;
for (const row of dataset.rows) {
  if (!row.vector) continue;
  const vector = extractFeatures(row.frame);
  assert.ok(vector && vector.length === row.vector.length);
  assert.ok(vector.every((value, i) => Math.abs(value - row.vector[i]) <= 1e-10), row.id);
  checked++;
}
console.log(`${checked} original extraction vectors match the current runtime.`);
