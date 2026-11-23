import fs from 'node:fs/promises';
import { loadCore } from '../../../technical/load-core.mjs';

const base = new URL('.', import.meta.url);
const file = new URL('index-comparison.csv', base);
const publicSnapshot = new URL('../../../../public/index-validation.json', base);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
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

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function pearson(left, right) {
  const leftMean = mean(left);
  const rightMean = mean(right);
  const covariance = mean(left.map((value, index) => (value - leftMean) * (right[index] - rightMean)));
  const leftVariance = mean(left.map(value => (value - leftMean) ** 2));
  const rightVariance = mean(right.map(value => (value - rightMean) ** 2));
  return leftVariance && rightVariance ? covariance / Math.sqrt(leftVariance * rightVariance) : null;
}

function linsConcordance(left, right) {
  const leftMean = mean(left);
  const rightMean = mean(right);
  const covariance = mean(left.map((value, index) => (value - leftMean) * (right[index] - rightMean)));
  const denominator = mean(left.map(value => (value - leftMean) ** 2)) + mean(right.map(value => (value - rightMean) ** 2)) + (leftMean - rightMean) ** 2;
  return denominator ? (2 * covariance) / denominator : null;
}

function crossedInfleszThreshold(left, right) {
  return [40, 55, 65, 80].find(threshold => (left < threshold) !== (right < threshold)) ?? null;
}

const { core, sha256: serverSha256, coreSha256, processingSha256 } = await loadCore();
const rows = parseCsv((await fs.readFile(file, 'utf8')).replace(/^\uFEFF/, ''));
for (const row of rows) {
  const stats = core.textStats(row.text, 'es');
  const score = core.readabilityScore(stats, 'es');
  row.words = String(stats.words);
  row.sentences = String(stats.sentences);
  row.syllables = String(stats.syllables);
  row.index_raw = String(score);
  row.index_display = score.toFixed(1);
  row.inflesz_category = core.levelForScore(score, 'es');
  row.difference = row.reference_inflesz === '' ? '' : String(score - Number(row.reference_inflesz));
}
const headers = ['text_id', 'expected_difficulty', 'words', 'sentences', 'syllables', 'index_raw', 'index_display', 'inflesz_category', 'reference_inflesz', 'difference', 'text'];
await fs.writeFile(file, `\uFEFF${[headers, ...rows.map(row => headers.map(header => quote(row[header])))] .map(row => row.join(',')).join('\r\n')}\r\n`);

const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const group of ['easy', 'difficult']) {
  const subset = rows.filter(row => row.expected_difficulty === group);
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Spanish ${group} validation corpus</title><style>body{max-width:800px;margin:32px auto;padding:0 20px;font:17px/1.6 Arial}p{margin:24px 0}</style></head><body><main>${subset.map(row => `<p id="${row.text_id}" data-text-id="${row.text_id}">${escapeHtml(row.text)}</p>`).join('\n')}</main></body></html>`;
  await fs.writeFile(new URL(`../../${group}.html`, base), html);
}

const valid = rows.filter(row => Number.isFinite(Number(row.reference_inflesz)));
const radar = valid.map(row => Number(row.index_raw));
const inflesz = valid.map(row => Number(row.reference_inflesz));
const differences = radar.map((score, index) => score - inflesz[index]);
const pairs = valid.map((row, index) => ({ row, radar: radar[index], inflesz: inflesz[index] }));
const mismatches = pairs.filter(({ radar: score, inflesz: reference }) => core.levelForScore(score, 'es') !== core.levelForScore(reference, 'es'));
const sameCategoryCount = valid.length - mismatches.length;
const summary = {
  reference_software: 'INFLESZ',
  texts_total: rows.length,
  texts_compared: valid.length,
  external_errors: rows.length - valid.length,
  mean_radar_score: mean(radar),
  mean_inflesz_score: mean(inflesz),
  mean_signed_difference: mean(differences),
  mean_absolute_difference: mean(differences.map(Math.abs)),
  pearson_correlation: pearson(radar, inflesz),
  lins_concordance_correlation: linsConcordance(radar, inflesz),
  category_agreement: sameCategoryCount / valid.length,
  same_category_count: sameCategoryCount,
  category_mismatches: mismatches.map(({ row, radar: score, inflesz: reference }) => ({
    text_id: row.text_id,
    radar_score: Number(score.toFixed(1)),
    inflesz_score: reference,
    threshold: crossedInfleszThreshold(score, reference),
  })),
  external_unavailable: rows.filter(row => !Number.isFinite(Number(row.reference_inflesz))).map(row => row.text_id),
  generated_at: new Date().toISOString(),
  radar_server_sha256: serverSha256,
  core_sha256: coreSha256,
  processing_sha256: processingSha256.es,
};
const agreementHeaders = Object.keys(summary);
await fs.writeFile(new URL('agreement-summary.csv', base), `\uFEFF${[agreementHeaders, agreementHeaders.map(header => summary[header])].map(row => row.map(quote).join(',')).join('\r\n')}\r\n`);

let snapshot = {};
try { snapshot = JSON.parse(await fs.readFile(publicSnapshot, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
snapshot.spanish = summary;
await fs.writeFile(publicSnapshot, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Recalculated ${rows.length} Spanish Radar scores with the shared core; ${valid.length} were compared with INFLESZ.`);
