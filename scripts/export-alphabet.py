"""Rebuild the user's MLP inference package, never retrain or alter source files.

python -m pip install -r ml/alphabet-v2/requirements.txt
python scripts/export-alphabet.py
"""
import hashlib
import json
import math
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'ml/bisindo-mlp2-clean-results'
BACKUP = ROOT / 'ml/bisindo-dataset-raw-backup'
OUT = ROOT / 'public/models/alphabet-mlp-v2'
AUDIT = ROOT / 'ml/alphabet-v2'
LABELS = list('ABCDEFGHIJKLMNOPQRSTUVWXYZ')


def read(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write(path, value):
    path.write_text(json.dumps(value, separators=(',', ':'), allow_nan=False), encoding='utf-8')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    AUDIT.mkdir(parents=True, exist_ok=True)
    manifest, dataset = read(BACKUP / 'manifest.json'), read(BACKUP / 'features.json')
    report = read(SOURCE / 'evaluation-python2.json')
    assert manifest == read(SOURCE / 'manifest.json'), 'Manifest mismatch'
    source_rows = {r['id']: r for r in manifest['samples']}
    seen, groups = set(), {}
    for row in dataset['rows']:
        assert row['id'] not in seen, 'Duplicate extraction'
        seen.add(row['id'])
        original = source_rows[row['id']]
        for key in ['label', 'sha256', 'groupId', 'split', 'sourceId', 'publisherSplit']:
            assert row[key] == original[key], f'Provenance mismatch: {key}'
        for key in [row['sha256'], row['groupId']]:
            assert key not in groups or groups[key] == row['split'], 'Split leakage'
            groups[key] = row['split']
        if row['vector'] is not None:
            assert len(row['vector']) == 52 and np.isfinite(row['vector']).all()
    assert seen == set(source_rows), 'Incomplete extraction'
    usable = [r for r in dataset['rows'] if r['vector'] is not None]
    parts = {s: [r for r in usable if r['split'] == s] for s in ['train', 'validation', 'test']}
    coverage = [{'label': l, **{s: sum(r['label'] == l for r in rs) for s, rs in parts.items()}} for l in LABELS]
    assert coverage == report['coverage']
    envelopes = []
    for label in LABELS:
        train = [r for r in parts['train'] if r['label'] == label]
        vectors = np.array([r['vector'] for r in train])
        distances = []
        for row in train + [r for r in parts['validation'] if r['label'] == label]:
            v = np.array(row['vector'])
            mask = np.all(vectors[:, 50:] == v[50:], axis=1) & np.array([r['groupId'] != row['groupId'] for r in train])
            if mask.any():
                distances.append(float(np.sqrt(np.mean((vectors[mask] - v) ** 2, axis=1)).min()))
        distances.sort()
        assert distances
        envelopes.append({'label': label, 'maxDistance': distances[math.ceil(len(distances) * .99) - 1], 'vectors': vectors.tolist()})

    source_path = SOURCE / 'model-python2.onnx'
    model = onnx.load(str(source_path))
    # Extract the existing graph ending at Softmax; no weight conversion/quantization.
    model = onnx.shape_inference.infer_shapes(model)
    derived = onnx.utils.Extractor(model).extract_model(['float_input'], ['out_activations_result'])
    onnx.checker.check_model(derived)
    onnx.save(derived, str(OUT / 'model.onnx'))
    original_session = ort.InferenceSession(str(source_path), providers=['CPUExecutionProvider'])
    session = ort.InferenceSession(str(OUT / 'model.onnx'), providers=['CPUExecutionProvider'])
    replay = []
    for split in ['validation', 'test']:
        rows = parts[split]
        X = np.array([r['vector'] for r in rows], dtype=np.float32)
        probs = session.run(None, {'float_input': X})[0]
        original_probs = original_session.run(None, {'float_input': X})[1]
        assert np.max(np.abs(probs - np.array([[p[i] for i in range(26)] for p in original_probs]))) <= 1e-5
        matrix = np.zeros((26, 27), dtype=int)
        for row, p in zip(rows, probs):
            rank = np.argsort(-p, kind='stable'); best = int(rank[0])
            env = envelopes[best]; v = np.array(row['vector']); refs = np.array(env['vectors'])
            refs = refs[np.all(refs[:, 50:] == v[50:], axis=1)]
            distance = float(np.sqrt(np.mean((refs-v)**2, axis=1)).min()) if len(refs) else math.inf
            predicted = best if p[best] >= .5 and p[best] > p[rank[1]] and distance <= env['maxDistance'] * 1.8 else 26
            matrix[LABELS.index(row['label']), predicted] += 1
            if split == 'test':
                replay.append({'id': row['id'], 'label': row['label'], 'vector': row['vector'], 'probabilities': p.tolist(), 'predicted': LABELS[predicted] if predicted < 26 else None})
        actual = {'correct': int(np.trace(matrix[:, :26])), 'uncertain': int(matrix[:, 26].sum())}
        actual['wrong'] = len(rows) - sum(actual.values())
        expected = report['calibration'] if split == 'validation' else {'correct': 367, 'wrong': 100, 'uncertain': 215}
        assert all(actual[k] == expected[k] for k in actual), (split, actual)
        if split == 'test':
            assert matrix.tolist() == report['testConfusion']['values'], 'Evaluation drift'
        print(split, actual)
    write(OUT / 'envelopes.json', envelopes)
    metadata = {
        'id': 'alphabet-mlp-v2', 'version': '2.0.0', 'status': 'EXPERIMENTAL', 'labels': LABELS,
        'featureSchema': dataset['featureSchema'], 'landmarker': dataset['trackingConfig'],
        'runtime': {'name': 'onnxruntime-web', 'version': '1.29.0'},
        'input': {'name': 'float_input', 'shape': [1, 52]},
        'output': {'name': 'out_activations_result', 'shape': [1, 26]},
        'threshold': .5, 'envelopeTolerance': 1.8,
        'sourceSha256': digest(source_path), 'modelSha256': digest(OUT / 'model.onnx'),
        'envelopesSha256': digest(OUT / 'envelopes.json'),
        'manifestSha256': digest(BACKUP / 'manifest.json'), 'sources': manifest['sources'],
        'limitations': ['Static photo classifier; not motion recognition.', 'Signer/session identities unknown.',
                         'IMAGE extraction and VIDEO runtime require separate live testing.',
                         '52 geometry features do not encode relative positions between hands.',
                         'Not validated linguistic correctness or live accuracy.'],
    }
    write(OUT / 'metadata.json', metadata)
    write(AUDIT / 'replay.json', replay)
    write(AUDIT / 'evaluation.json', report)
    write(AUDIT / 'checksums.json', {'metadataSha256': digest(OUT / 'metadata.json'), **{k:v for k,v in metadata.items() if k.endswith('Sha256')}})
    print('Exported unchanged weights and 26 envelopes; source/derived parity and exact confusion passed.')


if __name__ == '__main__':
    main()
