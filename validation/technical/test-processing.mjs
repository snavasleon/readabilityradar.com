import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {loadCore} from './load-core.mjs';
const {core,sha256}=await loadCore();
const cases=[
 ['period','La casa. La sala.',2,4,6],
 ['semicolon','La casa; la sala.',2,4,6],
 ['colon','La casa: la sala.',2,4,6],
 ['questions','¿La casa? ¿La sala?',2,4,6],
 ['exclamations','¡La casa! ¡La sala!',2,4,6],
 ['em_dash','La casa\u2014la sala.',2,4,6],
 ['consecutive_signs','¿¡La casa!?... La sala!!!',2,4,6],
 ['trailing_spaces','La casa.   \n',1,2,3],
 ['empty',' ;:?!\u2014 ',0,0,0],
 ['unfinished_tail','La casa. La sala',2,4,6],
 ['symbols','% € $ @ + £ ≠ ≥',1,8,8],
 ['numbers','12 300 45',1,3,3],
 ['known_abbreviations','Sra Dr Av etc fig vg pta',1,7,7],
 ['abbreviation_period','Dr. La casa.',2,3,4],
 ['compound','teórico-práctico',1,1,7],
 ['hiatus','día país idea realidad',1,4,11],
 ['diphthongs','tierra ciudad',1,2,4],
 ['triphthongs','buey',1,1,1],
];
const results=cases.map(([id,text,sentences,words,syllables])=>{
 const actual=core.textStats(text,'es');
 assert.equal(JSON.stringify(actual),JSON.stringify({words,sentences,syllables}),id);
 return {case_id:id,text,expected_sentences:sentences,expected_words:words,expected_syllables:syllables,...actual,passed:true,reference_basis:'documented rules / explicit implementation convention; NOT external INFLESZ execution'};
});
for(const [score,category] of [[-10,'Muy difícil'],[39.999,'Muy difícil'],[40,'Algo difícil'],[54.999,'Algo difícil'],[55,'Normal'],[64.999,'Normal'],[65,'Bastante fácil'],[79.999,'Bastante fácil'],[80,'Muy fácil']])assert.equal(core.levelForScore(score,'es'),category);
const longParagraph=`Primera frase. ${'Palabra '.repeat(120)}Última frase.`.replace(/\s+/g,' ').trim();
const paragraphs=core.extractTextBlocks(`<article><p>${longParagraph}</p><p>Párrafo independiente.</p></article>`);
assert.equal(JSON.stringify(paragraphs),JSON.stringify([longParagraph,'Párrafo independiente.']));
assert.equal(JSON.stringify(core.extractTextBlocks('<main><p>Aviso repetido.</p><p>Aviso repetido.</p></main>')),JSON.stringify(['Aviso repetido.','Aviso repetido.']));
assert.equal(JSON.stringify(core.extractTextBlocks('<header><p>Menú.</p></header><main><p>Contenido.</p></main><footer><p>Pie.</p></footer>')),JSON.stringify(['Contenido.']));
assert.equal(JSON.stringify(core.extractTextBlocks('<main><div>Texto sin párrafo semántico.</div></main>')),JSON.stringify([]));
assert.equal(core.assertSupportedHtmlSize('a'.repeat(1800000)).length,1800000);
assert.throws(()=>core.assertSupportedHtmlSize('a'.repeat(1800001)),/PAGE_HTML_TOO_LARGE/);
const pool=Array.from({length:40},(_,i)=>({text:`Fragment ${i}`,score:i,fragmentId:String(i)}));
const sample=core.sampleFragments(pool,10,'seed');
assert.equal(sample.length,10);assert.equal(new Set(sample.map(f=>f.text)).size,10);
assert.equal(JSON.stringify(sample),JSON.stringify(core.sampleFragments([...pool].reverse(),10,'seed')));
assert.deepEqual(sample.map(f=>f.fragmentId),core.sampleFragments(pool.map(f=>({...f,score:-f.score})),10,'seed').map(f=>f.fragmentId));
assert.equal(core.sampleFragments([...pool.slice(0,3),{...pool[0],fragmentId:'same-text-different-paragraph'}],10,'seed').length,4);
const coverage=new Set();for(let i=0;i<100;i++)core.sampleFragments(pool,10,String(i)).forEach(f=>coverage.add(f.fragmentId));assert.equal(coverage.size,40);
const headers=Object.keys(results[0]);const csv=[headers,...results.map(r=>headers.map(h=>r[h]))].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
await fs.writeFile(new URL('processing-tests.csv',import.meta.url),'\uFEFF'+csv);
await fs.writeFile(new URL('test-summary.json',import.meta.url),JSON.stringify({server_sha256:sha256,processing_cases:results.length,classification_boundaries:9,paragraph_integrity:'passed: complete semantic paragraphs only; no sentence-based split or container fallback; repeated paragraphs preserved',content_boundaries:'passed: navigation/header/footer excluded consistently; pages above the technical limit fail rather than truncate',random_sampling:'passed: seed, score/order invariance, uniqueness, small pool, coverage',external_inflesz:'pending'},null,2));
console.log(`PASS: ${results.length} documented/convention cases; 9 category boundaries; full semantic paragraphs; non-truncation boundary; unbiased-by-score sampling invariants.`);
