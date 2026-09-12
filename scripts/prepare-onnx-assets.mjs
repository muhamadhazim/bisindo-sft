import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const version = '1.29.0';
const root = `public/models/onnxruntime-${version}`;
await mkdir(root, { recursive: true });
const names = ['ort-wasm-simd-threaded.mjs', 'ort-wasm-simd-threaded.wasm'];
const assets = [];
for (const name of names) {
  await copyFile(`node_modules/onnxruntime-web/dist/${name}`, `${root}/${name}`);
  const bytes = await readFile(`${root}/${name}`);
  assets.push({ name, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') });
}
// npm distribution omits LICENSE; keep the checked-in license from the v1.29.0 tag.
await readFile(`${root}/LICENSE`);
await writeFile(`${root}/provenance.json`, JSON.stringify({ package: 'onnxruntime-web', version, assets }, null, 2));
