'use strict';
const C=require('../core.js');
function makeTemplate(id,offset){return {id,title:id,variables:{a:{min:0,max:999},b:{min:0,max:99}},expression:offset?`a * 100 + b + ${offset}`:'a * 100 + b'};}
function msSince(t){return Number(process.hrtime.bigint()-t)/1e6;}
(async()=>{
  const t=makeTemplate('max-100k',0);
  let start=process.hrtime.bigint();
  const pool=await C.buildPoolAsync(t);
  const poolMs=msSince(start);
  if(pool.length!==100000)throw new Error(`pool length ${pool.length}`);

  const templates=[0,1,2,3,4].map((n)=>makeTemplate(`max-${n}`,n));
  const set={format:'2x2-templates',version:1,id:'perf',revision:1,title:'perf',templates,levels:[{id:'max-level',title:'max',maxErrors:0,maxSeconds:999,items:templates.map(x=>({templateId:x.id,count:1})),shuffle:false}]};
  const v=C.validateSet(set);if(!v.ok)throw new Error(v.errors.join('\n'));
  start=process.hrtime.bigint();
  const seq=await C.generateLevel(set,set.levels[0],{rng:()=>0.5});
  const levelMs=msSince(start);
  if(seq.length!==5)throw new Error(`sequence length ${seq.length}`);
  const rss=Math.round(process.memoryUsage().rss/1024/1024);
  console.log(JSON.stringify({runtime:`Node ${process.version}`,pool_100k_ms:+poolMs.toFixed(1),level_500k_ms:+levelMs.toFixed(1),rss_after_mb:rss},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
