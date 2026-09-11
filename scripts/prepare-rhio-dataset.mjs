import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const repo = 'rhiosutoyo/Indonesian-Sign-Language-BISINDO-Hand-Sign-Detection-Dataset';
const root = '.tools/bisindo-dataset';
await mkdir(root, { recursive: true });
const get = async url => { const r = await fetch(url, { headers: { 'User-Agent': 'BISINDO-training' } }); if (!r.ok) throw new Error(`${r.status}: ${url}`); return r; };
const tree = await (await get(`https://api.github.com/repos/${repo}/git/trees/e1a48c6caa9d12318c8561e9962da845ab50226e?recursive=1`)).json();
const files = tree.tree.filter(f => /^(train|test)\/[CLO]\.[^/]+\.(jpg|xml)$/.test(f.path));
const blobHash = b => createHash('sha1').update(`blob ${b.length}\0`).update(b).digest('hex');
let cursor = 0; const records = [];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (cursor < files.length) {
    const f = files[cursor++]; const local = `${root}/${f.path}`; await mkdir(`${root}/${f.path.split('/')[0]}`, { recursive: true });
    let bytes; try { bytes = await readFile(local); } catch {}
    if (!bytes || blobHash(bytes) !== f.sha) {
      bytes = Buffer.from(await (await get(`https://raw.githubusercontent.com/${repo}/${tree.sha}/${f.path}`)).arrayBuffer());
      if (blobHash(bytes) !== f.sha) throw new Error(`Checksum mismatch: ${f.path}`);
      await writeFile(local, bytes);
    }
    records.push({ ...f, sha256: createHash('sha256').update(bytes).digest('hex') });
    if (records.length % 100 === 0) console.log(`Downloaded/verified ${records.length}/${files.length}`);
  }
}));
const images = records.filter(r => r.path.endsWith('.jpg')).sort((a,b)=>a.path.localeCompare(b.path));
const samples = [];
for (const img of images) {
  const xml = await readFile(`${root}/${img.path.replace(/\.jpg$/, '.xml')}`, 'utf8');
  const labels = [...xml.matchAll(/<name>(.*?)<\/name>/g)].map(m=>m[1].trim());
  const label = img.path.split('/')[1].split('.')[0];
  if (labels.length !== 1 || labels[0] !== label || !/^[A-Z]$/.test(label)) throw new Error(`Label conflict: ${img.path}`);
  const publisherSplit = img.path.startsWith('train/') ? 'train' : 'test';
  // Parent image groups only; author metadata does not establish independent signers.
  const bucket = parseInt(img.sha256.slice(0,8),16) % 5;
  samples.push({ id: img.path, label, sourceId: 'rhio-bisindo-2024', sourceUrl: `https://github.com/${repo}/blob/${tree.sha}/${img.path}`, sha256: img.sha256, gitBlobSha: img.sha, groupId: img.sha256, signerId: null, publisherSplit, split: publisherSplit === 'test' ? 'test' : bucket === 0 ? 'validation' : 'train' });
}
if (new Set(samples.map(s=>s.sha256)).size !== samples.length) throw new Error('Duplicate images need group reconciliation');
await mkdir('ml/rhio', { recursive: true });
await writeFile('ml/rhio/manifest.json', JSON.stringify({ repo, revision: tree.sha, license: 'MIT', source: `https://github.com/${repo}`, splitLimitation: 'Parent-image split; signer/session independence unknown. No augmentation.', samples }, null, 2)+'\n');
const license = await (await get(`https://raw.githubusercontent.com/${repo}/${tree.sha}/LICENSE`)).text();
await writeFile('ml/rhio/LICENSE.dataset', license);
console.log(`Manifest: ${samples.length} source-labeled images; images stay in ignored local cache.`);


