"""Original jointed hand illustration from source-linked, reviewed photo landmarks.

Never uses training detection count as the pedagogical hand-count rule. Every
entry in reviewed-hands.json must come from the documented visual source audit.
Unobservable inter-hand depth is NOT reconstructed; rotation is limited in UI.
"""
import json
import hashlib
import argparse
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--letters', default='ABCDEFGHIJKLMNOPQRSTUVWXYZ')
    args = parser.parse_args()
    rows = json.loads((ROOT/'ml/bisindo-dataset-raw-backup/features.json').read_text(encoding='utf-8'))['rows']
    review = json.loads((ROOT/'src/features/gesture-reference/reviewed-hands.json').read_text(encoding='utf-8'))
    overrides = json.loads((ROOT/'src/features/gesture-reference/illustration-landmarks.json').read_text(encoding='utf-8'))
    output = ROOT/'public/assets/signs/sinyal-v2'
    output.mkdir(parents=True, exist_ok=True)
    poses = []
    for symbol in args.letters:
        choice = review[symbol]
        row = next(r for r in rows if r['id'] == choice['sourceSampleId'])
        photo = ROOT/'.tools/bisindo-dataset'/row['id'].removeprefix('rhio/')
        assert hashlib.sha256(photo.read_bytes()).hexdigest() == row['sha256']
        override = overrides.get(symbol)
        if override: assert override['sourceSampleId'] == row['id']
        illustration = override['frame'] if override else row['frame']
        hands = []
        for side in ['left', 'right']:
            hand = illustration[side]
            if hand is None: continue
            joints = [[(p['x']-.5)*8, (.5-p['y'])*6, -p['z']*8] for p in hand['landmarks']]
            hands.append({'side': hand['side'], 'joints': joints})
        assert len(hands) == choice['handCount'], 'Reviewed sample extraction incomplete'
        # Center and frame both hands together, retaining the source image relation.
        points = [p for h in hands for p in h['joints']]
        lo = [min(p[i] for p in points) for i in range(2)]
        hi = [max(p[i] for p in points) for i in range(2)]
        scale = min(3.4/(hi[0]-lo[0]), 2.9/(hi[1]-lo[1]))
        for hand in hands:
            hand['joints'] = [[round((p[0]-(lo[0]+hi[0])/2)*scale, 6), round((p[1]-(lo[1]+hi[1])/2)*scale+.15, 6), round(p[2]*scale, 6)] for p in hand['joints']]
            hand['radius'] = round(max(.06, min(.3, math.dist(hand['joints'][0][:2], hand['joints'][9][:2])*.14)), 6)
        pose = {
            'id': f'sinyal-pose-{symbol.lower()}-v2', 'symbol': symbol, 'version': '2.0.0',
            'signId': f"bisindo-{symbol.lower()}-{'sanjaya-v1' if symbol in 'CLO' else 'rhio-v2'}",
            'viewpoint': 'SOURCE_CAMERA_FRONT', 'review': 'PHOTO_SOURCE_ONLY',
            'status': choice['status'], 'sourceId': row['sourceId'], 'sourceSampleId': row['id'],
            'sourceUrl': row['sourceUrl'], 'sourceSha256': row['sha256'],
            'comparisonSampleId': choice.get('comparisonSampleId'), 'comparisonUrl': choice.get('comparisonUrl'),
            'region': None, 'requiredHands': 'ONE' if choice['handCount']==1 else 'TWO',
            'motionType': choice['motionType'], 'limitation': choice['limitation'],
            'license': 'MIT', 'attribution': 'Original Sinyal hand geometry; pose reference: Rhio Sutoyo et al., MIT. No source pixels reused.',
            'hands': hands, 'posterUrl': f'/assets/signs/sinyal-v2/{symbol.lower()}.svg'
        }
        poses.append(pose)
        (output/f'{symbol.lower()}.svg').write_text(poster(pose), encoding='utf-8')
    (ROOT/'src/features/gesture-reference/poses.json').write_text(json.dumps(poses, separators=(',', ':')), encoding='utf-8')
    print('Exported source-linked original pose geometry and SVG:', args.letters)


def poster(pose):
    # Orthographic front projection of the same joint positions used by the 3D rig.
    def xy(p): return (240+p[0]*90, 195-p[1]*90)
    def pt(p): return ','.join(f'{v:.2f}' for v in xy(p))
    shapes = []
    for hand in pose['hands']:
        p = hand['joints']; x,y=xy(p[0])
        color='#ffc391' if hand['side']=='RIGHT' else '#ffd7ad'
        palm=' '.join(pt(p[i]) for i in [0,1,5,9,13,17])
        shapes.append((sum(p[i][2] for i in [0,5,9,13,17])/5, f'<polygon points="{palm}" fill="{color}" stroke="#9c623f" stroke-width="2" stroke-linejoin="round"/>'))
        for chain in [[0,1,2,3,4],[5,6,7,8],[9,10,11,12],[13,14,15,16],[17,18,19,20]]:
            for a,b in zip(chain,chain[1:]):
                x1,y1=xy(p[a]);x2,y2=xy(p[b]);w=hand['radius']*180*(1 if a in [0,1,5,9,13,17] else .85)
                shapes.append(((p[a][2]+p[b][2])/2, f'<path d="M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}" stroke="#9c623f" stroke-width="{w+2}" stroke-linecap="round"/><path d="M{x1:.2f} {y1:.2f}L{x2:.2f} {y2:.2f}" stroke="{color}" stroke-width="{w}" stroke-linecap="round"/>'))
        shapes.append((p[0][2]+.2,f'<rect x="{x-17:.2f}" y="{y+2:.2f}" width="34" height="24" rx="9" fill="#007857"/><circle cx="{x-6:.2f}" cy="{y+11:.2f}" r="2.5" fill="white"/><circle cx="{x+6:.2f}" cy="{y+11:.2f}" r="2.5" fill="white"/><path d="M{x-5:.2f} {y+17:.2f}q5 4 10 0" fill="none" stroke="white" stroke-width="2"/>'))
    body=''.join(s for z,s in sorted(shapes,key=lambda v:v[0]))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 390" role="img" aria-labelledby="title"><title id="title">Karakter tangan Sinyal, contoh bentuk {pose["symbol"]}</title><rect width="480" height="390" rx="24" fill="#f0fbf5"/><ellipse cx="240" cy="349" rx="125" ry="14" fill="#d8eade"/>{body}<text x="24" y="37" font-family="sans-serif" font-size="24" font-weight="bold" fill="#075d48">{pose["symbol"]}</text><text x="240" y="378" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#375a4b">Contoh bentuk • karakter orisinal Sinyal</text></svg>'


if __name__=='__main__': main()
