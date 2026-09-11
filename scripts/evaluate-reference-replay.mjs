import { readFile } from 'node:fs/promises';
const model = JSON.parse(await readFile('src/features/recognition/reference-model.json', 'utf8'));
const { samples } = JSON.parse(await readFile('.tools/references/landmark-analysis-sequence.json', 'utf8'));
const distance = (a, b) => Math.sqrt(a.reduce((sum, v, i) => sum + (v - b[i]) ** 2, 0) / a.length);
const block = (v, side) => v.slice(side === 'LEFT' ? 0 : 25, side === 'LEFT' ? 25 : 50);
const profiles = model.prototypes.map(p => ({ ...p, radius: Math.min(...model.prototypes.filter(q => q.signId !== p.signId && q.side === p.side).map(q => distance(block(p.vector, p.side), block(q.vector, q.side)))) / 2 }));
for (const id of new Set(samples.map(s => s.id))) {
  const rows = samples.filter(s => s.id === id);
  const summary = { id, frames: rows.length, usable: 0, targetMatches: 0, wrongMatches: 0, uncertain: 0 };
  for (const s of rows) {
    if (!s.vector) { summary.uncertain++; continue; }
    summary.usable++;
    const side = s.frame.left ? 'LEFT' : 'RIGHT';
    const matches = [...new Set(profiles.filter(p => p.side === side && distance(block(s.vector, side), block(p.vector, side)) < p.radius).map(p => p.signId))];
    if (matches.length !== 1) summary.uncertain++;
    else if (matches[0] === `bisindo-${s.symbol.toLowerCase()}-sanjaya-v1`) summary.targetMatches++;
    else summary.wrongMatches++;
  }
  console.log(JSON.stringify(summary));
}
