import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import { loadCore } from '../../../technical/load-core.mjs';

const base = new URL('.', import.meta.url);
const corpus = JSON.parse(await fs.readFile(new URL('corpus.json', base), 'utf8'));
const { core, sha256: serverSha256, coreSha256, processingSha256 } = await loadCore();
const records = [];

for (const [group, texts] of Object.entries(corpus)) {
  assert.equal(texts.length, 50);
  for (const [index, text] of texts.entries()) {
    const stats = core.textStats(text, 'en');
    const score = core.readabilityScore(stats, 'en');
    records.push({
      text_id: `${group === 'easy' ? 'EASY' : 'DIFF'}-${String(index + 1).padStart(3, '0')}`,
      expected_difficulty: group,
      text,
      ...stats,
      radar_score: score,
      radar_level: core.levelForScore(score, 'en'),
    });
  }
}

assert.equal(new Set(records.map(record => record.text)).size, 100);
await fs.writeFile(new URL('radar-results.json', base), JSON.stringify({
  server_sha256: serverSha256,
  core_sha256: coreSha256,
  processing_sha256: processingSha256.en,
  records,
}, null, 2));

for (const group of ['easy', 'difficult']) {
  const subset = records.filter(record => record.expected_difficulty === group);
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>English ${group} validation corpus</title><style>body{max-width:800px;margin:32px auto;padding:0 20px;font:17px/1.6 Arial}p{margin:24px 0}</style></head><body><main>${subset.map(record => `<p id="${record.text_id}" data-text-id="${record.text_id}">${record.text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')}</p>`).join('\n')}</main></body></html>`;
  await fs.writeFile(new URL(`../../${group}.html`, base), html);
}

console.log('Calculated 100 Radar scores with the shared core and refreshed both corpus HTML files.');
