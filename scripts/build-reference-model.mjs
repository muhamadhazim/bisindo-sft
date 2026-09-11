import { readFile, writeFile } from 'node:fs/promises';
const read = async path => JSON.parse(await readFile(path, 'utf8'));
const path = 'src/features/recognition/reference-model.json';
const model = await read(path);
const prototypes = [];
for (const variant of ['resized', 'original']) {
  const assets = await read(variant === 'resized' ? 'public/assets/signs/sanjaya-v1/provenance.json' : 'src/features/recognition/original-references.json');
  const report = await read(`.tools/references/landmark-analysis${variant === 'original' ? '-originals' : ''}.json`);
  for (const sample of report.samples) {
    if (!sample.vector || sample.ambiguous) continue;
    const asset = assets.find(a => a.id === sample.id);
    if (!asset || asset.sha256 !== sample.assetSha256 || asset.sourceId !== model.sourceId || asset.symbol !== sample.symbol || sample.featureSchema.id !== model.featureSchema || sample.featureSchema.normalizationVersion !== model.normalizationVersion || sample.featureSchema.landmarkerAssetId !== model.landmarkerAssetId) throw new Error(`Source/schema mismatch: ${sample.id}`);
    const side = sample.frame.left && !sample.frame.right ? 'LEFT' : sample.frame.right && !sample.frame.left ? 'RIGHT' : null;
    if (!side || sample.vector.length !== 52 || !sample.vector.every(Number.isFinite)) throw new Error(`Invalid vector: ${sample.id}`);
    prototypes.push({ assetId: sample.id, assetSha256: sample.assetSha256, variant, signId: `bisindo-${sample.symbol.toLowerCase()}-sanjaya-v1`, side, vector: sample.vector });
  }
}
if (!prototypes.length) throw new Error('No usable source observations');
await writeFile(path, JSON.stringify({ ...model, prototypes }, null, 2) + '\n');
console.log(`${prototypes.length} measurements from ${new Set(prototypes.map(p => p.assetId)).size} source observations; no accuracy claim.`);
