(function(){
'use strict';
const C=window.TwoByTwoCore;
const APP='2x2:v1:';
const els={};
const state={set:null,source:'stock',level:null,sequence:null,index:0,input:'',results:[],elapsedMs:0,shownAt:0,locked:false,interrupted:false,abort:null,pending:null};

function $(id){return document.getElementById(id)}
function mapEls(){['setup','practice','report','setTitle','setMeta','diagnostics','levels','preview','fileInput','loadFileBtn','stockBtn','demoBtn','startBtn','cancelPrepare','prepareBox','prepareText','levelTitle','progress','problem','answer','feedback','keypad','submit','reportTitle','reportStats','reportList','backBtn','resumeBox','resumeBtn','restartBtn','candidateBox','candidateTitle','candidateMeta','candidateLevels','candidatePreview','useCandidateBtn','discardCandidateBtn'].forEach(id=>els[id]=$(id));}
function show(name){for(const id of ['setup','practice','report'])els[id].hidden=id!==name;}
function storageGet(k){try{return localStorage.getItem(k)}catch{return null}}
function storageSet(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}
function storageRemove(k){try{localStorage.removeItem(k)}catch{}}
function progressKey(){return APP+'progress:'+state.set.id+':'+state.set.revision}
function sessionKey(){return APP+'session'}
function importedKey(){return APP+'imported'}
function getProgress(){try{return JSON.parse(storageGet(progressKey())||'{"maxUnlocked":0}') }catch{return {maxUnlocked:0}}}
function saveProgress(p){return storageSet(progressKey(),JSON.stringify(p))}
function clearSession(){storageRemove(sessionKey())}
function text(el,s){el.textContent=s}
function fmt(n){return String(n).replace('-', '−')}
function sanitizeIntegerInput(s){if(s==='-'||s==='')return s;if(!/^-?\d+$/.test(s))return null;const n=Number(s);if(!Number.isSafeInteger(n)||Math.abs(n)>1000000)return null;return String(n)}
function seeded(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}

function saveSession(){
  if(!state.set||!state.sequence||!state.level)return;
  storageSet(sessionKey(),JSON.stringify({
    setSnapshot:state.set, source:state.source, levelSnapshot:state.level,
    sequence:state.sequence,index:state.index,input:state.input,results:state.results,
    elapsedMs:state.elapsedMs,shownAt:state.shownAt,interrupted:state.interrupted,savedAt:Date.now()
  }));
}

async function fetchJson(url){
  const r=await fetch(url,{cache:'no-store'}); if(!r.ok)throw new Error(`Сетевая ошибка: HTTP ${r.status}`);
  const raw=await r.text(); if(new TextEncoder().encode(raw).length>1024*1024)throw new Error('Файл больше 1 MiB.');
  try{return JSON.parse(raw)}catch{throw new Error('Ошибка синтаксиса JSON.')}
}
function diagnose(messages,ok){els.diagnostics.hidden=!messages.length;els.diagnostics.className=ok?'notice ok':'notice error';els.diagnostics.replaceChildren(...messages.map(m=>{const d=document.createElement('div');d.textContent=m;return d;}));}

async function loadBundled(url,source){
  try{const data=await fetchJson(url);activate(data,source,false)}catch(e){diagnose([e.message],false)}
}
function activate(data,source,persist){
  const v=C.validateSet(data); if(!v.ok){diagnose(v.errors,false);return false}
  state.set=data;state.source=source;state.pending=null;hideCandidate();
  if(source==='imported'&&persist&&!storageSet(importedKey(),JSON.stringify(data)))diagnose(['Набор активирован, но хранилище браузера недоступно: после перезагрузки импорт не сохранится.'],true);
  else diagnose(['Набор прошёл структурную и семантическую проверку.'],true);
  renderSetup(); return true;
}

function renderSetup(){
  show('setup');state.sequence=null;state.level=null;state.results=[];
  text(els.setTitle,state.set?state.set.title:'Набор не загружен');
  const src=state.source==='stock'?'штатный набор':state.source==='demo'?'демонстрационный набор':'импортированный набор';
  text(els.setMeta,state.set?`id: ${state.set.id} · revision: ${state.set.revision} · ${src}`:'');
  els.levels.replaceChildren();els.preview.replaceChildren();els.startBtn.disabled=true;
  if(!state.set)return;
  const p=getProgress();
  state.set.levels.forEach((l,i)=>{
    const b=document.createElement('button');b.className='level-card';b.type='button';const open=i<=p.maxUnlocked;b.disabled=!open;
    const count=l.items.reduce((a,x)=>a+x.count,0);b.innerHTML='<span class="level-name"></span><span class="level-detail"></span>';
    b.querySelector('.level-name').textContent=l.title;b.querySelector('.level-detail').textContent=`${count} заданий · ≤ ${l.maxErrors} ошибок · ≤ ${l.maxSeconds} с${open?'':' · закрыт'}`;
    b.addEventListener('click',()=>selectLevel(i,b));els.levels.appendChild(b);
  });
}
async function renderPreview(set,level,container){
  container.replaceChildren();const h=document.createElement('div');h.className='preview-head';h.textContent='Предпросмотр: подготовка…';container.appendChild(h);
  try{const seq=await C.generateLevel(set,level,{rng:seeded(12345)});h.textContent=`Предпросмотр первых ${Math.min(10,seq.length)} заданий`;seq.slice(0,10).forEach((x,k)=>{const row=document.createElement('div');row.className='preview-row';row.textContent=`${k+1}. ${x.prompt} → ${fmt(x.answer)}`;container.appendChild(row);});return true}
  catch(e){h.textContent='Уровень нельзя подготовить';const d=document.createElement('div');d.className='error-text';d.textContent=e.message;container.appendChild(d);return false}
}
async function selectLevel(i,b){state.level=state.set.levels[i];document.querySelectorAll('#levels .level-card').forEach(x=>x.classList.toggle('selected',x===b));els.startBtn.disabled=false;if(!await renderPreview(state.set,state.level,els.preview))els.startBtn.disabled=true;}

function stageCandidate(data){
  const v=C.validateSet(data);if(!v.ok){diagnose([...v.errors,'Предыдущий рабочий набор сохранён.'],false);return}
  state.pending=data;els.candidateBox.hidden=false;text(els.candidateTitle,data.title);text(els.candidateMeta,`id: ${data.id} · revision: ${data.revision} · ${data.levels.length} уровней`);els.candidateLevels.replaceChildren();els.candidatePreview.replaceChildren();
  data.levels.forEach((l,i)=>{const b=document.createElement('button');b.type='button';b.className='level-card';b.innerHTML='<span class="level-name"></span><span class="level-detail"></span>';b.querySelector('.level-name').textContent=l.title;b.querySelector('.level-detail').textContent=`${l.items.reduce((a,x)=>a+x.count,0)} заданий`;b.addEventListener('click',async()=>{document.querySelectorAll('#candidateLevels .level-card').forEach(x=>x.classList.toggle('selected',x===b));await renderPreview(data,l,els.candidatePreview)});els.candidateLevels.appendChild(b)});
  diagnose(['Импортированный файл прошёл проверку. Просмотрите набор и нажмите «Использовать набор» для активации.'],true);
}
function hideCandidate(){els.candidateBox.hidden=true;els.candidateLevels.replaceChildren();els.candidatePreview.replaceChildren();}
function useCandidate(){if(state.pending)activate(state.pending,'imported',true)}
function discardCandidate(){state.pending=null;hideCandidate();diagnose(['Импорт отменён. Текущий рабочий набор не изменён.'],true)}

async function startSelected(){
  if(!state.level)return;els.prepareBox.hidden=false;els.startBtn.disabled=true;state.abort=new AbortController();text(els.prepareText,'Проверяю допустимые комбинации…');
  try{const seq=await C.generateLevel(state.set,state.level,{signal:state.abort.signal,onProgress:(n,t)=>text(els.prepareText,`Подготовка: ${n} / ${t}`)});state.sequence=seq;state.index=0;state.input='';state.results=[];state.elapsedMs=0;state.interrupted=false;state.locked=false;state.shownAt=Date.now();saveSession();els.prepareBox.hidden=true;beginPractice()}
  catch(e){els.prepareBox.hidden=true;els.startBtn.disabled=false;if(e.name!=='AbortError')diagnose([e.message],false)}
}
function beginPractice(){show('practice');renderQuestion()}
function renderQuestion(){const item=state.sequence[state.index];text(els.levelTitle,state.level.title);text(els.progress,`${state.index+1} / ${state.sequence.length}`);text(els.problem,item.prompt);state.locked=false;text(els.feedback,state.interrupted?'Сеанс прерван: результат не откроет следующий уровень.':'');els.feedback.className=state.interrupted?'feedback warn':'feedback';renderInput();state.shownAt=Date.now();saveSession()}
function renderInput(){text(els.answer,state.input||' ');els.submit.disabled=state.locked||state.input===''||state.input==='-'}
function action(a){
  if(state.locked||els.practice.hidden)return;if(a==='submit'){submitAnswer();return}
  let candidate=state.input;
  if(/^\d$/.test(a)){if(candidate==='0')candidate=a;else if(candidate==='-0')candidate='-'+a;else candidate+=a}
  else if(a==='sign'){candidate=candidate.startsWith('-')?candidate.slice(1):'-'+candidate}
  else if(a==='back'){candidate=candidate.slice(0,-1)}
  const clean=sanitizeIntegerInput(candidate);if(clean===null)return;state.input=clean;renderInput();saveSession();
}
function submitAnswer(){
  if(state.locked||state.input===''||state.input==='-')return;state.locked=true;const elapsed=Date.now()-state.shownAt;state.elapsedMs+=elapsed;const item=state.sequence[state.index];const n=Number(state.input);const correct=n===item.answer;state.results.push({prompt:item.prompt,answer:item.answer,given:n,correct,elapsedMs:elapsed});text(els.feedback,correct?'Верно':'Неверно. Ответ: '+fmt(item.answer));els.feedback.className='feedback '+(correct?'good':'bad');renderInput();saveSession();setTimeout(()=>{state.index++;state.input='';if(state.index>=state.sequence.length)finish();else renderQuestion()},900)
}
function finish(){
  const errors=state.results.filter(x=>!x.correct).length;const secs=state.elapsedMs/1000;const passed=!state.interrupted&&errors<=state.level.maxErrors&&secs<=state.level.maxSeconds;
  if(passed){const idx=state.set.levels.findIndex(l=>l.id===state.level.id);const p=getProgress();p.maxUnlocked=Math.max(p.maxUnlocked,Math.min(state.set.levels.length-1,idx+1));saveProgress(p)}
  clearSession();show('report');text(els.reportTitle,passed?'Уровень пройден':'Тренировка завершена');text(els.reportStats,`${state.results.filter(x=>x.correct).length}/${state.results.length} верно · ошибок: ${errors} · время: ${secs.toFixed(1)} с · порог: ≤ ${state.level.maxErrors} ошибок и ≤ ${state.level.maxSeconds} с${state.interrupted?' · сеанс был прерван':''}`);els.reportList.replaceChildren();state.results.forEach((r,i)=>{const row=document.createElement('div');row.className='report-row '+(r.correct?'ok':'fail');const q=document.createElement('span');q.textContent=`${i+1}. ${r.prompt}`;const a=document.createElement('span');a.textContent=`ваш: ${fmt(r.given)} · ответ: ${fmt(r.answer)}`;row.append(q,a);els.reportList.appendChild(row)})
}

function tryRestore(){
  const raw=storageGet(sessionKey());if(!raw)return false;
  try{const s=JSON.parse(raw);const v=C.validateSet(s.setSnapshot);if(!v.ok||!s.levelSnapshot||!Array.isArray(s.sequence)||!s.sequence.length)return false;
    state.set=s.setSnapshot;state.source=s.source||'imported';renderSetup();Object.assign(state,{level:s.levelSnapshot,sequence:s.sequence,index:s.index||0,input:s.input||'',results:s.results||[],elapsedMs:s.elapsedMs||0,interrupted:true,locked:false,shownAt:Date.now()});
    els.resumeBox.hidden=false;text(els.resumeBox.querySelector('p'),`Есть прерванный сеанс «${state.level.title}», задание ${state.index+1} из ${state.sequence.length}. Можно продолжить без зачёта результата или начать заново.`);return true
  }catch{return false}
}
function resume(){els.resumeBox.hidden=true;beginPractice()}
function restartInterrupted(){els.resumeBox.hidden=true;clearSession();renderSetup()}

function onFile(e){
  const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;if(f.size>1024*1024){diagnose(['Файл больше 1 MiB. Предыдущий рабочий набор сохранён.'],false);return}
  const r=new FileReader();r.onload=()=>{try{stageCandidate(JSON.parse(r.result))}catch{diagnose(['Ошибка синтаксиса JSON. Предыдущий рабочий набор сохранён.'],false)}};r.onerror=()=>diagnose(['Не удалось прочитать файл. Предыдущий рабочий набор сохранён.'],false);r.readAsText(f,'utf-8')
}
function keyboard(e){if(els.practice.hidden)return;if(/^\d$/.test(e.key)){e.preventDefault();action(e.key)}else if(e.key==='-'){e.preventDefault();action('sign')}else if(e.key==='Backspace'){e.preventDefault();action('back')}else if(e.key==='Enter'){e.preventDefault();action('submit')}}
function markInterrupted(){if(!els.practice.hidden&&state.sequence&&state.index<state.sequence.length){state.interrupted=true;saveSession();text(els.feedback,'Сеанс прерван: результат не откроет следующий уровень.');els.feedback.className='feedback warn'}}

async function init(){
  mapEls();
  els.loadFileBtn.addEventListener('click',()=>els.fileInput.click());els.fileInput.addEventListener('change',onFile);els.stockBtn.addEventListener('click',()=>loadBundled('data/templates.json','stock'));els.demoBtn.addEventListener('click',()=>loadBundled('data/demo-templates.json','demo'));
  els.useCandidateBtn.addEventListener('click',useCandidate);els.discardCandidateBtn.addEventListener('click',discardCandidate);els.startBtn.addEventListener('click',startSelected);els.cancelPrepare.addEventListener('click',()=>state.abort&&state.abort.abort());
  els.keypad.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b)action(b.dataset.action)});els.submit.addEventListener('click',()=>action('submit'));els.backBtn.addEventListener('click',renderSetup);els.resumeBtn.addEventListener('click',resume);els.restartBtn.addEventListener('click',restartInterrupted);document.addEventListener('keydown',keyboard);document.addEventListener('visibilitychange',()=>{if(document.hidden)markInterrupted()});
  if(tryRestore())return;
  let imported=null;try{imported=JSON.parse(storageGet(importedKey())||'null')}catch{}
  if(imported&&C.validateSet(imported).ok)activate(imported,'imported',false);else await loadBundled('data/templates.json','stock');
}
window.addEventListener('DOMContentLoaded',init);
})();
