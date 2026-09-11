import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { RandomForestClassifier } from 'ml-random-forest';
import { loadTrainingContract } from '../load-training-contract.mjs';

const read = async p => JSON.parse(await readFile(p, 'utf8'));
const dataset = await read('.tools/bisindo-dataset/features.json');
const manifest = await read('ml/rhio/manifest.json');
const { validateTrainingData, featureSchema, extractFeatures } = await loadTrainingContract();
validateTrainingData(manifest, dataset, featureSchema, extractFeatures);
const requested = [...new Set(manifest.samples.map(r => r.label))].sort();
// One final observation per original photo, not three correlated evaluation samples.
const rows = dataset.rows.filter(r => r.tick === 2 && r.vector);
const coverage = requested.map(label => ({ label, ...Object.fromEntries(['train', 'validation', 'test'].map(split => [split, rows.filter(r => r.label === label && r.split === split).length])) }));
await mkdir('output', { recursive: true });
await writeFile('output/coverage.json', JSON.stringify(coverage, null, 2));
const missing = coverage.filter(c => c.train < 2 || c.validation < 1 || c.test < 1);
if (missing.length) throw new Error('Insufficient extraction coverage; see output/coverage.json. Add/review data before claiming A-Z: ' + missing.map(c => c.label).join(', '));
const labels = requested;
const train = rows.filter(r => r.split === 'train');
const validation = rows.filter(r => r.split === 'validation');
const test = rows.filter(r => r.split === 'test');
const options = { seed: 42, nEstimators: 160, maxFeatures: .65, replacement: false, useSampleBagging: true, noOOB: true, treeOptions: { maxDepth: 16, minNumSamples: 2 } };
const forest = new RandomForestClassifier(options);
forest.train(train.map(r => r.vector), train.map(r => labels.indexOf(r.label)));
const votes = v => {
  const counts = labels.map(() => 0);
  for (const c of forest.predictionValues([v]).getRow(0)) counts[c]++;
  return counts.map(c => c / options.nEstimators);
};
const rank = v => votes(v).map((score, index) => ({ score, index })).sort((a, b) => b.score - a.score);
const distance = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length);
const sameMask = (a, b) => a[50] === b[50] && a[51] === b[51];
const envelopes = labels.map(label => {
  const positives = train.filter(r => r.label === label);
  const distances = [...positives, ...validation.filter(r => r.label === label)].map(r => Math.min(...positives.filter(p => p.groupId !== r.groupId && sameMask(p.vector, r.vector)).map(p => distance(p.vector, r.vector)))).filter(Number.isFinite).sort((a, b) => a - b);
  if (!distances.length) throw new Error('No independent distance coverage: ' + label);
  return { label, maxDistance: distances[Math.ceil(distances.length * .95) - 1], vectors: positives.map(r => r.vector) };
});
const classify = (v, threshold) => {
  const ranked = rank(v), best = ranked[0], envelope = envelopes[best.index];
  const nearest = Math.min(...envelope.vectors.filter(p => sameMask(p, v)).map(p => distance(p, v)));
  return best.score >= threshold && best.score > ranked[1].score && nearest <= envelope.maxDistance ? labels[best.index] : null;
};
// Validation only. Wrong acceptance costs more than abstention; no test tuning.
const candidates = [.5, .55, .6, .65, .7, .75, .8, .85, .9, .95, 1].map(threshold => {
  let correct = 0, wrong = 0;
  for (const r of validation) { const p = classify(r.vector, threshold); if (p === r.label) correct++; else if (p !== null) wrong++; }
  return { threshold, correct, wrong, uncertain: validation.length - correct - wrong, utility: correct - 4 * wrong };
});
candidates.sort((a, b) => b.utility - a.utility || a.wrong - b.wrong || b.threshold - a.threshold);
const calibration = candidates[0];
const confusion = labels.map(() => Array(labels.length + 1).fill(0));
for (const r of test) { const p = classify(r.vector, calibration.threshold); confusion[labels.indexOf(r.label)][p === null ? labels.length : labels.indexOf(p)]++; }
const payload = { id: 'rhio-alphabet-rf-candidate-v1', version: '1.0.0', status: 'EXPERIMENTAL', deploymentReady: false, labels, featureSchema: dataset.featureSchema, runtime: { name: 'ml-random-forest', version: '2.1.0' }, landmarker: dataset.trackingConfig, source: { id: 'rhio-bisindo-2024', repo: manifest.repo, revision: manifest.revision, license: 'MIT' }, threshold: calibration.threshold, envelopes, forest: forest.toJSON() };
const serialized = JSON.stringify(payload);
await writeFile('output/model.json', serialized);
const loaded = RandomForestClassifier.load(JSON.parse(serialized).forest);
if (JSON.stringify(loaded.predict(test.map(r => r.vector))) !== JSON.stringify(forest.predict(test.map(r => r.vector)))) throw new Error('Export parity failure');
const report = {
  modelSha256: createHash('sha256').update(serialized).digest('hex'), options, coverage, calibration,
  extraction: { originals: manifest.samples.length, usable: rows.length, rejected: manifest.samples.length - rows.length },
  testConfusion: { rows: labels, columns: [...labels, 'UNCERTAIN'], values: confusion },
  perLetter: labels.map((label, i) => ({ label, tested: confusion[i].reduce((a, b) => a + b, 0), matched: confusion[i][i], uncertain: confusion[i][labels.length], wrong: confusion[i].reduce((a, b, j) => a + (j !== i && j !== labels.length ? b : 0), 0) })),
  limitations: ['Static photo-label experiment, not validated dynamic alphabet recognition.', 'Signer/session identities unavailable; image split is not signer-independent.', 'No unknown-pose or live webcam acceptance evaluation.', 'Website currently accepts C/L/O only; candidate needs runtime/content integration and browser tests.'],
  golden: test.map(r => ({ id: r.id, label: r.label, frame: r.frame, vector: r.vector, votes: votes(r.vector), predicted: classify(r.vector, calibration.threshold) })),
};
await writeFile('output/evaluation.json', JSON.stringify(report, null, 2));
console.log(JSON.stringify({ ...report, golden: undefined }, null, 2));
