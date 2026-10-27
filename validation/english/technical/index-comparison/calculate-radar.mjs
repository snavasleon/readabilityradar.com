import fs from 'node:fs/promises';
import vm from 'node:vm';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
const base=new URL('.',import.meta.url);
const source=await fs.readFile(new URL('../../../../server.mjs',base),'utf8');
const ctx=vm.createContext({});
const dictionary=JSON.parse(await fs.readFile(new URL('../../../../resources/cmudict-syllables.json',base),'utf8'));
ctx.ENGLISH_SYLLABLE_DICTIONARY=dictionary.entries;
ctx.ENGLISH_SYLLABLE_CACHE=new Map();
for(const name of ['textStats','spanishTokens','englishTokens','countSyllables','countEnglishSyllables','normalizeEnglishToken','englishDictionaryCounts','resolveEnglishSyllables','acronymLetterSyllables','heuristicEnglishSyllables','countSpanishSyllables','readabilityScore','classificationRules','levelForScore']){
 const a=source.indexOf(`function ${name}(`),b=source.indexOf('\nfunction ',a+1);assert(a>=0);vm.runInContext(source.slice(a,b<0?undefined:b),ctx);
}
const corpus=JSON.parse(await fs.readFile(new URL('corpus.json',base),'utf8'));
const records=[];
for(const [group,texts] of Object.entries(corpus)){
 assert.equal(texts.length,50);
 for(const [index,text] of texts.entries()){
  const stats=ctx.textStats(text,'en');const score=ctx.readabilityScore(stats,'en');
  records.push({text_id:`${group==='easy'?'EASY':'DIFF'}-${String(index+1).padStart(3,'0')}`,expected_difficulty:group,text,...stats,radar_score:score,radar_level:ctx.levelForScore(score,'en')});
 }
}
assert.equal(new Set(records.map(r=>r.text)).size,100);
await fs.writeFile(new URL('radar-results.json',base),JSON.stringify({server_sha256:crypto.createHash('sha256').update(source).digest('hex'),records},null,2));
for(const group of ['easy','difficult']){
 const subset=records.filter(r=>r.expected_difficulty===group);
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>English ${group} validation corpus</title><style>body{max-width:800px;margin:32px auto;padding:0 20px;font:17px/1.6 Arial}p{margin:24px 0}</style></head><body><main>${subset.map(r=>`<p id="${r.text_id}" data-text-id="${r.text_id}">${r.text.replaceAll('&','&amp;').replaceAll('<','&lt;')}</p>`).join('\n')}</main></body></html>`;
 await fs.writeFile(new URL(`../../${group}.html`,base),html);
}
console.log('Calculated 100 Radar scores and refreshed both corpus HTML files.');
