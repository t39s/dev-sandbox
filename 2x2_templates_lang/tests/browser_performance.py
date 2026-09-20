#!/usr/bin/env python3
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
core=(ROOT/'core.js').read_text(encoding='utf-8')
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page()
    page.set_content('<!doctype html><meta charset="utf-8"><title>perf</title>')
    page.add_script_tag(content=core)
    result=page.evaluate('''async()=>{
      const C=window.TwoByTwoCore;
      const make=(id,o)=>({id,title:id,variables:{a:{min:0,max:999},b:{min:0,max:99}},expression:o?`a * 100 + b + ${o}`:'a * 100 + b'});
      const t=make('max-100k',0);
      let ticks=0,maxGap=0,last=performance.now();
      const timer=setInterval(()=>{const now=performance.now();maxGap=Math.max(maxGap,now-last);last=now;ticks++},1);
      let start=performance.now();const pool=await C.buildPoolAsync(t);const poolMs=performance.now()-start;
      const templates=[0,1,2,3,4].map(n=>make(`max-${n}`,n));
      const set={format:'2x2-templates',version:1,id:'perf',revision:1,title:'perf',templates,levels:[{id:'max-level',title:'max',maxErrors:0,maxSeconds:999,items:templates.map(x=>({templateId:x.id,count:1})),shuffle:false}]};
      start=performance.now();const seq=await C.generateLevel(set,set.levels[0],{rng:()=>0.5});const levelMs=performance.now()-start;
      clearInterval(timer);
      return {poolLength:pool.length,sequenceLength:seq.length,pool100kMs:+poolMs.toFixed(1),level500kMs:+levelMs.toFixed(1),timerTicks:ticks,maxTimerGapMs:+maxGap.toFixed(1)};
    }''')
    result['runtime']='Chromium '+browser.version
    print(json.dumps(result,ensure_ascii=False,indent=2))
    browser.close()
