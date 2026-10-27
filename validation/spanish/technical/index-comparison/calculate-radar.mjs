import fs from 'node:fs/promises';
import { loadCore } from '../../../technical/load-core.mjs';

const base = new URL('.', import.meta.url);
const file = new URL('index-comparison.csv', base);

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted && character === '"' && text[index + 1] === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (!quoted && character === ',') { row.push(value); value = ''; }
    else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value); rows.push(row); row = []; value = '';
    } else value += character;
  }
  if (row.length || value) { row.push(value); rows.push(row); }
  const [headers, ...records] = rows;
  return records.filter(record => record.length === headers.length).map(record => Object.fromEntries(headers.map((header, index) => [header, record[index]])));
}

function quote(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

const { core } = await loadCore();
const rows = parseCsv((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
for (const row of rows) {
  const stats = core.textStats(row.text, 'es');
  const score = core.readabilityScore(stats, 'es');
  row.words = stats.words;
  row.sentences = stats.sentences;
  row.syllables = stats.syllables;
  row.index_raw = score;
  row.index_display = score.toFixed(1);
  row.inflesz_category = core.levelForScore(score, 'es');
  row.difference = row.reference_inflesz === '' ? '' : score - Number(row.reference_inflesz);
}
const headers = ['text_id', 'expected_difficulty', 'words', 'sentences', 'syllables', 'index_raw', 'index_display', 'inflesz_category', 'reference_inflesz', 'difference', 'text'];
await fs.writeFile(file, `\uFEFF${[headers, ...rows.map(row => headers.map(header => quote(row[header])))] .map(row => row.join(',')).join('\r\n')}\r\n`);
console.log(`Recalculated ${rows.length} Spanish Radar scores; external INFLESZ values were preserved.`);
