import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const read = p => readFile(p, 'utf8');
const bundle = {};
for (const path of ['src/lib/config/tracking.ts', 'src/lib/mediapipe/canonicalize.ts', 'src/features/recognition/features.ts', 'scripts/load-training-contract.mjs', 'scripts/colab/prepare-combined.mjs', 'scripts/colab/train-alphabet.mjs', 'public/models/mediapipe/provenance.json']) bundle[path] = await read(path);
bundle['ml/rhio/training-contract.ts'] = (await read('ml/rhio/training-contract.ts'))
  .replace('!["C", "L", "O"].includes(sample.label)', '!/^[A-Z]$/.test(sample.label)')
  .replace('(sample.publisherSplit === "test") !== (sample.split === "test")', 'sample.publisherSplit !== null && (sample.publisherSplit === "test") !== (sample.split === "test")');
bundle['scripts/colab/train-alphabet.mjs'] = bundle['scripts/colab/train-alphabet.mjs'].replace("id: 'rhio-alphabet-rf-candidate-v1'", "id: 'combined-alphabet-rf-candidate-v1'")
  .replace("source: { id: 'rhio-bisindo-2024', repo: manifest.repo, revision: manifest.revision, license: 'MIT' }", 'sources: manifest.sources');
bundle['scripts/extract-rhio-landmarks.mjs'] = (await read('scripts/extract-rhio-landmarks.mjs'))
  .replace("{ channel: 'chrome' }", "{ args: ['--no-sandbox'] }")
  .replace("count===1", "count>=1").replace("count!==1", "count<1")
  .replace('C/L/O images', 'alphabet images')
  .replace("  await page.goto('http://127.0.0.1:3000/credits');", `  await page.route('**/models/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path.includes('..')) return route.abort();
    await route.fulfill({ contentType: path.endsWith('.js') ? 'text/javascript' : path.endsWith('.wasm') ? 'application/wasm' : 'application/octet-stream', body: await readFile('public' + path) });
  });
  await page.route('http://127.0.0.1:3000/credits', route => route.fulfill({contentType:'text/html', headers:{'Content-Security-Policy': "connect-src 'self'"}, body:'<!doctype html><title>Offline extraction</title>'}));
  await page.goto('http://127.0.0.1:3000/credits');`);
const cells = [];
const md = source => cells.push({ cell_type: 'markdown', metadata: {}, source });
const code = source => cells.push({ cell_type: 'code', metadata: {}, execution_count: null, outputs: [], source });
md(`# Training BISINDO A–Z — Rhio + Sanjaya (Google Colab)

Upload notebook ini ke **https://colab.research.google.com/**, pilih runtime **CPU**, lalu jalankan sel berurutan. Tidak perlu upload project atau mengaktifkan kamera. Data diunduh langsung dari kedua penerbit; ekstraksi seluruh foto dapat memakan waktu lama. Setiap sel menampilkan progres. Unduhan dapat dilanjutkan dengan menjalankan sel yang gagal lagi.

**Output:** ZIP berisi model Random Forest JSON, evaluasi per huruf, confusion matrix, manifest sumber dan atribusi. Ini kandidat eksperimen klasifikasi **foto berlabel A–Z**, bukan bukti 26 gesture statis benar secara linguistik. Huruf yang memerlukan gerak butuh dataset sequence terpisah. Model website saat ini C/L/O: jangan langsung menimpa; integrasi alfabet dan browser acceptance test masih diperlukan.

Sumber: [Rhio / MIT](https://github.com/rhiosutoyo/Indonesian-Sign-Language-BISINDO-Hand-Sign-Detection-Dataset), [Samuel Ady Sanjaya, 18 Oktober 2024, v1 / CC BY 4.0](https://data.mendeley.com/datasets/ywnjpbcz8m/1).

Hanya **Original Images** Mendeley dipakai; versi resized/binary tidak digabung. Label mengikuti XML Rhio dan folder penerbit Sanjaya; kesamaan nama huruf bukan jaminan kesamaan varian isyarat. Hasil perlu ditinjau per sumber. Tidak ada horizontal flip atau augmentation. Split berdasarkan foto asli, bukan identitas orang yang tidak tersedia; hasil bukan signer-independent accuracy.

MediaPipe Tasks Vision 1.0.1, aset float16 v1 dan extractor TypeScript 52 fitur disertakan persis dari project. Handedness memakai label provider, bukan urutan array. Kapasitas dua tangan; ini tidak menetapkan aturan tangan per huruf. GPU tidak diperlukan untuk pipeline CPU Random Forest ini.
`);
code(`import os, json, pathlib, subprocess, urllib.request, hashlib, tarfile, shutil, base64
ROOT = pathlib.Path('/content/bisindo-alphabet-training')
ROOT.mkdir(parents=True, exist_ok=True)
os.chdir(ROOT)
def run(*args):
    subprocess.run(args, check=True)
version = '24.21.0'
archive = f'node-v{version}-linux-x64.tar.xz'
url = f'https://nodejs.org/dist/v{version}/'
if not pathlib.Path('node/bin/node').exists():
    urllib.request.urlretrieve(url + archive, archive)
    checksums = urllib.request.urlopen(url + 'SHASUMS256.txt').read().decode()
    expected = next(line.split()[0] for line in checksums.splitlines() if line.split()[-1] == archive)
    assert hashlib.sha256(pathlib.Path(archive).read_bytes()).hexdigest() == expected, 'Node checksum mismatch'
    with tarfile.open(archive) as tar:
        tar.extractall('.', filter='data')
    pathlib.Path(f'node-v{version}-linux-x64').rename('node')
os.environ['PATH'] = str(ROOT / 'node/bin') + ':' + os.environ['PATH']
run('node', '--version')
`);
const packed = Buffer.from(JSON.stringify(bundle)).toString('base64');
code(`# Source snapshot embedded: no private repository credentials needed.
bundle = json.loads(base64.b64decode('${packed}'))
for name, content in bundle.items():
    path = ROOT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8')
package = {'private': True, 'type': 'module', 'dependencies': {'@mediapipe/tasks-vision':'1.0.1', '@playwright/test':'1.63.0', 'typescript':'5.9.3', 'ml-random-forest':'2.1.0'}}
pathlib.Path('package.json').write_text(json.dumps(package))
run('npm', 'install', '--no-audit', '--no-fund')
run('npx', 'playwright', 'install', '--with-deps', 'chromium')
provenance = json.loads(pathlib.Path('public/models/mediapipe/provenance.json').read_text())
for asset in provenance['assets']:
    target = pathlib.Path(asset['path']); target.parent.mkdir(parents=True, exist_ok=True)
    if target.suffix == '.task':
        if not target.exists(): urllib.request.urlretrieve(provenance['modelSource'], target)
    else:
        shutil.copyfile(pathlib.Path('node_modules/@mediapipe/tasks-vision/wasm') / target.name, target)
    assert hashlib.sha256(target.read_bytes()).hexdigest() == asset['sha256'], str(target) + ' checksum mismatch'
print('Runtime dan model MediaPipe siap; checksum sesuai website.')
`);
md('## 1. Unduh dan gabungkan dua dataset\nSemua A–Z dari kedua sumber. Sel ini memerlukan jaringan dan ruang disk untuk foto asli. File yang sudah cocok checksum tidak diunduh ulang. Jika layanan penerbit gagal, jalankan kembali sel ini. Tidak ada data kamera pribadi.');
code("run('node', 'scripts/colab/prepare-combined.mjs')\nmanifest = json.loads(pathlib.Path('ml/rhio/manifest.json').read_text())\nfrom collections import Counter\nprint(Counter((r['sourceId'], r['split']) for r in manifest['samples']))\n");
md('## 2. Tinjau contoh kedua sumber\nPeriksa apakah label dan bentuk dalam kedua sumber cocok. Foto di bawah hanya contoh, bukan validasi semua data. Konflik varian harus diselesaikan sebelum model dipakai untuk menyatakan gesture benar.');
code(`from PIL import Image, ImageOps
import matplotlib.pyplot as plt
LETTER = 'C'  # Ubah menjadi huruf A-Z untuk memeriksa sumber.
fig, axes = plt.subplots(2, 3, figsize=(10, 7))
for row, source in enumerate(['rhio-bisindo-2024', 'sanjaya-bisindo-alphabet-2024-v1']):
    samples = [r for r in manifest['samples'] if r['label'] == LETTER and r['sourceId'] == source][:3]
    for ax, sample in zip(axes[row], samples):
        with Image.open(ROOT / '.tools/bisindo-dataset' / sample['id']) as im:
            ax.imshow(ImageOps.exif_transpose(im))
        ax.set_title(source.split('-')[0] + ' / ' + LETTER); ax.axis('off')
plt.tight_layout(); plt.show()
`);
md('## 3. Ekstrak titik dengan pipeline browser\nMode VIDEO memakai tiga timestamp per foto untuk warm-up. Evaluasi hanya memakai tick terakhir per foto. Tangan ambigu/tidak terlihat dan fitur tidak valid ditolak. Tidak ada webcam yang digunakan.');
code("run('node', 'scripts/extract-rhio-landmarks.mjs')\nfeatures = json.loads(pathlib.Path('.tools/bisindo-dataset/features.json').read_text())\nprint(Counter(r['rejection'] or 'USABLE' for r in features['rows'] if r['tick'] == 2))\n");
md('## 4. Train, kalibrasi dan uji\nKalibrasi hanya memakai validation split, test tetap terpisah. Jika suatu huruf kekurangan data hasil ekstraksi, proses berhenti dan menulis coverage.json; jangan mengklaim A–Z selesai. Model mengizinkan UNCERTAIN. Probability bukan skor kebenaran gesture.');
code("run('node', 'scripts/colab/train-alphabet.mjs')\nreport = json.loads(pathlib.Path('output/evaluation.json').read_text())\nimport pandas as pd\ndisplay(pd.DataFrame(report['perLetter']))\nprint(report['limitations'])\n");
code(`import numpy as np
matrix = np.array(report['testConfusion']['values'])
fig, ax = plt.subplots(figsize=(15, 12))
chart = ax.imshow(matrix, cmap='Blues')
ax.set_xticks(range(len(report['testConfusion']['columns'])), report['testConfusion']['columns'], rotation=90)
ax.set_yticks(range(len(report['testConfusion']['rows'])), report['testConfusion']['rows'])
ax.set_xlabel('Prediksi'); ax.set_ylabel('Label sumber'); fig.colorbar(chart)
plt.tight_layout(); plt.savefig('output/confusion.png'); plt.show()
# Source breakdown exposes differences hidden by combined totals.
by_id = {r['id']: r for r in manifest['samples']}
breakdown = Counter()
for row in report['golden']:
    outcome = 'matched' if row['predicted'] == row['label'] else 'uncertain' if row['predicted'] is None else 'wrong'
    breakdown[(by_id[row['id']]['sourceId'], row['label'], outcome)] += 1
source_report = [{'source': s, 'letter': l, 'outcome': o, 'count': n} for (s,l,o),n in sorted(breakdown.items())]
pd.DataFrame(source_report).to_csv('output/evaluation-by-source.csv', index=False)
display(pd.DataFrame(source_report))
`);
md('## 5. Download hasil\nZIP tidak menyertakan foto dataset. Simpan ZIP dan notebook yang sudah dijalankan. Model masih kandidat: current website hanya mendukung C/L/O, memerlukan perluasan label/content, uji parity di browser dan uji kamera langsung sebelum model alfabet dapat dipakai.');
code(`shutil.copyfile('ml/rhio/manifest.json', 'output/manifest.json')
shutil.copyfile('public/models/mediapipe/provenance.json', 'output/mediapipe-provenance.json')
shutil.copyfile('package-lock.json', 'output/package-lock.json')
pathlib.Path('output/source-snapshot.json').write_text(json.dumps(bundle))
shutil.make_archive('/content/bisindo-alphabet-results', 'zip', 'output')
from google.colab import files
files.download('/content/bisindo-alphabet-results.zip')
`);
cells.forEach((cell, index) => { cell.id = 'bisindo-' + index; cell.source = cell.source.split(/(?<=\n)/); });
await mkdir('notebooks', { recursive: true });
await writeFile('notebooks/BISINDO_Alphabet_Combined_Colab.ipynb', JSON.stringify({ nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { display_name: 'Python 3', language: 'python', name: 'python3' }, language_info: { name: 'python', version: '3.12' }, colab: { name: 'BISINDO_Alphabet_Combined_Colab.ipynb', provenance: [] }, sourceSnapshotSha256: createHash('sha256').update(JSON.stringify(bundle)).digest('hex') }, cells }, null, 2) + '\n');
console.log('Created notebooks/BISINDO_Alphabet_Combined_Colab.ipynb');
