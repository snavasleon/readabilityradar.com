import {loadCore} from './load-core.mjs';
const {core,sha256}=await loadCore();
let input='';for await(const chunk of process.stdin)input+=chunk;
const {texts,language}=JSON.parse(input);
console.log(JSON.stringify({server_sha256:sha256,records:texts.map(row=>{
 const stats=core.textStats(row.text,language),score=core.readabilityScore(stats,language);
 return {...row,...stats,index_raw:score,index_display:core.round1(score),inflesz_category:core.levelForScore(score,language)};
})}));
