import fs from 'node:fs/promises';
import {loadCore} from './load-core.mjs';
const {core,sha256}=await loadCore();
const inputs=JSON.parse(await fs.readFile(new URL('impact-input.json',import.meta.url),'utf8'));
const summary={server_sha256:sha256};
for(const language of ['es','en']){
 const folder=language==='es'?'spanish':'english';
 const refs=JSON.parse((await fs.readFile(new URL(`../${folder}/technical/syllables/reference-counts.json`,import.meta.url),'utf8')).replace(/^\uFEFF/,''));
 const dictionary=new Map(refs.filter(r=>r.reference!=='').map(r=>[r.word,Number(r.reference)]));
 const rows=inputs[language].map(row=>{
  const stats=core.textStats(row.text,language);
  const tokens=language==='es'?core.spanishTokens(row.text).map(t=>t.text):(row.text.toLowerCase().match(/[a-záéíóúüñàèìòùâêîôûäëïöüç]+(?:['-][a-záéíóúüñàèìòùâêîôûäëïöüç]+)?/gi)??[]);
  let covered=0,change=0;
  for(const token of tokens)if(dictionary.has(token)){covered++;change+=dictionary.get(token)-core.countSyllables(token,language);}
  const original=core.readabilityScore(stats,language),substituted=core.readabilityScore({...stats,syllables:stats.syllables+change},language);
  return {text_id:row.text_id,words:stats.words,reference_covered_tokens:covered,reference_coverage:covered/stats.words,radar_syllables:stats.syllables,substituted_syllables:stats.syllables+change,radar_score:original,substituted_score:substituted,score_change:substituted-original,radar_category:core.levelForScore(original,language),substituted_category:core.levelForScore(substituted,language),category_changed:core.levelForScore(original,language)!==core.levelForScore(substituted,language)};
 });
 const headers=Object.keys(rows[0]);const csv=[headers,...rows.map(row=>headers.map(key=>row[key]))].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
 await fs.writeFile(new URL(`../${folder}/technical/index-comparison/syllable-impact.csv`,import.meta.url),'\uFEFF'+csv);
 summary[language]={texts:rows.length,changed_categories:rows.filter(row=>row.category_changed).length,mean_absolute_score_change:rows.reduce((s,r)=>s+Math.abs(r.score_change),0)/rows.length,maximum_absolute_score_change:Math.max(...rows.map(r=>Math.abs(r.score_change))),covered_tokens:rows.reduce((s,r)=>s+r.reference_covered_tokens,0),total_tokens:rows.reduce((s,r)=>s+r.words,0)};
}
await fs.writeFile(new URL('syllable-impact-summary.json',import.meta.url),JSON.stringify(summary,null,2));
console.log(summary);
