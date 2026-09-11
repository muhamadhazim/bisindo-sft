import { readFile, writeFile, mkdir, statfs } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const root = '.tools/bisindo-dataset';
await mkdir(root, { recursive: true });
const get = async url => {
  for (let attempt = 0; attempt < 4; attempt++) {
    try { const r = await fetch(url, { signal: AbortSignal.timeout(120000), headers: { Accept: 'application/vnd.mendeley-public-dataset.1+json', 'User-Agent': 'BISINDO-research-notebook' } }); if (r.ok) return r; throw new Error(`${r.status} ${url}`); }
    catch (error) { if (attempt === 3) throw error; await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000)); }
  }
};
const repo = 'rhiosutoyo/Indonesian-Sign-Language-BISINDO-Hand-Sign-Detection-Dataset';
const revision = 'e1a48c6caa9d12318c8561e9962da845ab50226e';
const tree = await (await get(`https://api.github.com/repos/${repo}/git/trees/${revision}?recursive=1`)).json();
if (tree.truncated) throw new Error('GitHub tree truncated');
const files = tree.tree.filter(f => /^(train|test)\/[A-Z]\.[^/]+\.jpg$/.test(f.path));
const samples = [];
for (const f of files) {
  const xmlPath = f.path.replace(/\.jpg$/, '.xml');
  const xml = await (await get(`https://raw.githubusercontent.com/${repo}/${revision}/${xmlPath}`)).text();
  const names = [...xml.matchAll(/<name>(.*?)<\/name>/g)].map(m => m[1].trim());
  const label = f.path.split('/')[1][0];
  if (names.length !== 1 || names[0] !== label) throw new Error('XML label conflict: ' + f.path);
  samples.push({ id: 'rhio/' + f.path, label, sourceId: 'rhio-bisindo-2024', sourceUrl: `https://raw.githubusercontent.com/${repo}/${revision}/${f.path}`, gitBlobSha: f.sha, bytes: f.size, publisherSplit: f.path.startsWith('test/') ? 'test' : 'train', license: 'MIT', signerId: null });
}
const base = 'https://data.mendeley.com/public-api/datasets/ywnjpbcz8m';
const folders = await (await get(base + '/folders/1')).json();
const originals = folders.find(f => f.name === '01. Original Images');
if (!originals) throw new Error('Original image directory missing; do not substitute resized/binary derivatives');
for (const folder of folders.filter(f => f.parent_id === originals.id && /^[A-Z]$/.test(f.name))) {
  const list = await (await get(`${base}/files?folder_id=${folder.id}&version=1`)).json();
  if (!Array.isArray(list)) throw new Error('Unexpected Mendeley file response');
  for (const f of list) {
    if (!/^image\//.test(f.content_details?.content_type ?? '')) continue;
    samples.push({ id: 'sanjaya/' + f.id + '.jpg', label: folder.name, sourceId: 'sanjaya-bisindo-alphabet-2024-v1', sourceUrl: f.content_details.download_url, sha256: f.content_details.sha256_hash, bytes: f.size, originalFilename: f.filename, publisherSplit: null, license: 'CC BY 4.0', signerId: null });
  }
}
for (const source of ['rhio-bisindo-2024', 'sanjaya-bisindo-alphabet-2024-v1']) for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  if (!samples.some(s => s.sourceId === source && s.label === letter)) throw new Error(`Missing source label ${source}/${letter}`);
}
console.log('Originals:', samples.length, 'Download GB:', (samples.reduce((s, r) => s + r.bytes, 0) / 1e9).toFixed(2));
const disk = await statfs('.');
if (disk.bavail * disk.bsize < samples.reduce((s, r) => s + r.bytes, 0) + 2e9) throw new Error('Insufficient disk for original datasets; use a larger runtime/disk');
let cursor = 0, done = 0;
await Promise.all(Array.from({ length: 4 }, async () => {
  while (cursor < samples.length) {
    const sample = samples[cursor++], path = root + '/' + sample.id;
    await mkdir(path.slice(0, path.lastIndexOf('/')), { recursive: true });
    let bytes; try { bytes = await readFile(path); } catch {}
    const valid = b => b && (sample.sha256 ? hash(b) === sample.sha256 : createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex') === sample.gitBlobSha);
    if (!valid(bytes)) { bytes = Buffer.from(await (await get(sample.sourceUrl)).arrayBuffer()); if (!valid(bytes)) throw new Error('Checksum mismatch: ' + sample.id); await writeFile(path, bytes); }
    sample.sha256 = hash(bytes); sample.groupId = sample.sha256;
    if (++done % 100 === 0) console.log('Verified', done, '/', samples.length);
  }
}));
// Exact duplicates never cross splits. Conflicting duplicate labels stop training.
const unique = new Map();
for (const sample of samples) {
  const previous = unique.get(sample.sha256);
  if (previous && previous.label !== sample.label) throw new Error('Duplicate image has conflicting labels: ' + sample.id);
  if (!previous || sample.publisherSplit === 'test') unique.set(sample.sha256, sample);
}
const selected = [...unique.values()];
for (const source of new Set(selected.map(s => s.sourceId))) for (const label of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
  const group = selected.filter(s => s.sourceId === source && s.label === label).sort((a, b) => a.sha256.localeCompare(b.sha256));
  if (source === 'rhio-bisindo-2024') {
    const training = group.filter(s => s.publisherSplit !== 'test');
    for (const s of group) s.split = s.publisherSplit === 'test' ? 'test' : training.indexOf(s) < Math.max(1, Math.floor(training.length * .2)) ? 'validation' : 'train';
  } else {
    const n = Math.max(1, Math.floor(group.length * .2));
    group.forEach((s, i) => { s.split = i < n ? 'test' : i < 2 * n ? 'validation' : 'train'; });
  }
}
await mkdir('ml/rhio', { recursive: true });
const sources = [{ id: 'rhio-bisindo-2024', repo, revision, license: 'MIT' }, { id: 'sanjaya-bisindo-alphabet-2024-v1', doi: '10.17632/ywnjpbcz8m.1', author: 'Samuel Ady Sanjaya', license: 'CC BY 4.0', url: 'https://data.mendeley.com/datasets/ywnjpbcz8m/1' }];
await writeFile('ml/rhio/manifest.json', JSON.stringify({ sources, splitLimitation: 'Original-image groups only; signer/session metadata unknown. No augmentation or derivative image versions.', samples: selected }, null, 2));
await mkdir('output', { recursive: true });
await writeFile('output/LICENSE.rhio', await (await get(`https://raw.githubusercontent.com/${repo}/${revision}/LICENSE`)).text());
await writeFile('output/ATTRIBUTION.txt', 'Combined source-labelled static-photo experiment.\nRhio Sutoyo et al., BISINDO Hand-Sign Detection Dataset, MIT. See LICENSE.rhio.\nSamuel Ady Sanjaya (2024), BISINDO Indonesian Sign Language: Alphabet Image Data, v1. DOI 10.17632/ywnjpbcz8m.1. CC BY 4.0 https://creativecommons.org/licenses/by/4.0/ . Original images converted to landmark features; model fitted from features.\nNo claim of mentor validation or live recognition accuracy.\n');
console.log('Manifest ready:', selected.length, 'original photos; duplicate copies removed:', samples.length - selected.length);
