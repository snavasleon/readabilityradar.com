import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { loadCore } from '../../../technical/load-core.mjs';
const base=new URL('.',import.meta.url);
const source=await fs.readFile(new URL('../../../../server.mjs',base),'utf8');
const { core: ctx } = await loadCore();
const input=JSON.parse((await fs.readFile(new URL('reference-counts.json',base),'utf8')).replace(/^\uFEFF/,''));
const rows=input.map(r=>({word:r.word,frequency:Number(r.frequency),current_count:ctx.countSyllables(r.word,r.language),reference_count:r.reference===''?null:Number(r.reference)}));
const language=input[0].language;
const valid=rows.filter(r=>r.reference_count!==null),weight=valid.reduce((s,r)=>s+r.frequency,0);
const error=valid.reduce((s,r)=>s+r.frequency*(r.current_count-r.reference_count),0)/weight;
const summary={language,version:'current_radar',total_word_types:rows.length,compared_word_types:valid.length,excluded_word_types:rows.length-valid.length,
 exact_type_agreement:valid.filter(r=>r.current_count===r.reference_count).length/valid.length,
 exact_count:valid.filter(r=>r.current_count===r.reference_count).length,
 one_syllable_discrepancies:valid.filter(r=>Math.abs(r.current_count-r.reference_count)===1).length,
 multiple_syllable_discrepancies:valid.filter(r=>Math.abs(r.current_count-r.reference_count)>=2).length,
 mean_absolute_error:valid.reduce((s,r)=>s+Math.abs(r.current_count-r.reference_count),0)/valid.length,
 maximum_absolute_error:Math.max(...valid.map(r=>Math.abs(r.current_count-r.reference_count))),
 frequency_weighted_agreement:valid.reduce((s,r)=>s+(r.current_count===r.reference_count?r.frequency:0),0)/weight,
 undercounted_type_proportion:valid.filter(r=>r.current_count<r.reference_count).length/valid.length,
 overcounted_type_proportion:valid.filter(r=>r.current_count>r.reference_count).length/valid.length,
 mean_signed_error_weighted:error,implied_score_bias:-(language==='es'?62.3:84.6)*error,
 reference_source:language==='es'?'pylabeador 0.9.0 reference syllable counts':'CMU Pronouncing Dictionary, first listed pronunciation',
 dictionary_covered_word_types:valid.filter(r=>ctx.spanishSyllableSource(r.word)==='pylabeador').length,
 dictionary_coverage:valid.filter(r=>ctx.spanishSyllableSource(r.word)==='pylabeador').length/valid.length,
 heuristic_word_types:valid.filter(r=>ctx.spanishSyllableSource(r.word)!=='pylabeador').length,
 generated_at:new Date().toISOString(),current_server_sha256:crypto.createHash('sha256').update(source).digest('hex')};
async function csv(name,headers,values){await fs.writeFile(new URL(name,base),'\uFEFF'+[headers,...values].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(',')).join('\r\n'));}
await csv('word-comparison.csv',['word','frequency','current_count','reference_count','difference','exact_agreement'],rows.map(r=>[r.word,r.frequency,r.current_count,r.reference_count,r.reference_count===null?'':r.current_count-r.reference_count,r.reference_count===null?'':r.current_count===r.reference_count]));
await csv('agreement-summary.csv',Object.keys(summary),[Object.values(summary)]);
const reportPath=new URL('../../../../public/syllable-validation.json',base);
let snapshots={};try{snapshots=JSON.parse(await fs.readFile(reportPath,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
snapshots[language]=summary;await fs.writeFile(reportPath,JSON.stringify(snapshots,null,2)+'\n');
console.log(`${language}: ${valid.length} words compared; agreement ${(summary.exact_type_agreement*100).toFixed(4)}%.`);
