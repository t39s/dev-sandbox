(function(){
'use strict';
const C=window.TwoByTwoCore;
const APP='2x2:v1:';
const els={};
const state={
  set:null,source:'stock',level:null,sequence:null,index:0,input:'',results:[],elapsedMs:0,shownAt:0,
  locked:false,interrupted:false,phase:'answer',abort:null,pending:null,
  previewToken:0,candidatePreviewToken:0,prepareToken:0,storageAvailable:true
};

function $(id){return document.getElementById(id)}
function mapEls(){['setup','practice','report','setTitle','setMeta','diagnostics','levels','preview','fileInput','loadFileBtn','stockBtn','demoBtn','startBtn','cancelPrepare','prepareBox','prepareText','levelTitle','progress','problem','answer','feedback','keypad','submit','reportTitle','reportStats','reportList','backBtn','resumeBox','resumeBtn','restartBtn','candidateBox','candidateTitle','candidateMeta','candidateLevels','candidatePreviewDetails','candidatePreview','useCandidateBtn','discardCandidateBtn'].forEach(id=>els[id]=$(id));}
function show(name){for(const id of ['setup','practice','report'])els[id].hidden=id!==name;}
function detectStorage(){try{const k=APP+'storage-probe';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch{return false}}
function storageGet(k){try{return localStorage.getItem(k)}catch{return null}}
function storageSet(k,v){try{localStorage.setItem(k,v);return true}catch{return false}}
function storageRemove(k){try{localStorage.removeItem(k)}catch{}}
function progressKey(){return APP+'progress:'+state.set.id+':'+state.set.revision}
function sessionKey(){return APP+'session'}
function importedKey(){return APP+'imported'}
function getProgress(){try{const p=JSON.parse(storageGet(progressKey())||'null');return p&&Number.isInteger(p.maxUnlocked)&&p.maxUnlocked>=0?{maxUnlocked:p.maxUnlocked}:{maxUnlocked:0}}catch{return {maxUnlocked:0}}}
function saveProgress(p){return storageSet(progressKey(),JSON.stringify(p))}
function clearSession(){storageRemove(sessionKey())}
function text(el,s){el.textContent=s}
function fmt(n){return String(n).replace('-', '−')}
function sanitizeIntegerInput(s){if(s==='-'||s==='')return s;if(!/^-?\d+$/.test(s))return null;const n=Number(s);if(!Number.isSafeInteger(n)||Math.abs(n)>1000000)return null;return String(n)}
function seeded(seed){let x=seed>>>0;return()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296}}
function diagnosticsForValidSet(extra=[]){const messages=['Набор прошёл структурную и семантическую проверку.',...extra];if(!state.storageAvailable)messages.push('Хранилище браузера недоступно: набор работает в памяти, но импорт, прогресс и прерванный сеанс после перезагрузки не сохранятся.');return messages}

function saveSession(){
  if(!state.set||!state.sequence||!state.level)return false;
  return storageSet(sessionKey(),JSON.stringify({
    setSnapshot:state.set,source:state.source,levelSnapshot:state.level,
    sequence:state.sequence,index:state.index,input:state.input,results:state.results,
    elapsedMs:state.elapsedMs,shownAt:state.shownAt,interrupted:state.interrupted,
    phase:state.phase,savedAt:Date.now()
  }));
}

async function fetchJson(url){
  const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(`Сетевая ошибка: HTTP ${r.status}`);
  const raw=await r.text();if(new TextEncoder().encode(raw).length>1024*1024)throw new Error('Файл больше 1 MiB.');
  try{return JSON.parse(raw)}catch{throw new Error('Ошибка синтаксиса JSON.')}
}
function diagnose(messages,ok){els.diagnostics.hidden=!messages.length;els.diagnostics.className=ok?'notice ok':'notice error';els.diagnostics.replaceChildren(...messages.map(m=>{const d=document.createElement('div');d.textContent=m;return d;}));}

async function loadBundled(url,source){
  try{const data=await fetchJson(url);activate(data,source,false)}catch(e){diagnose([e.message],false)}
}
function cancelPreparation(){state.prepareToken++;if(state.abort){state.abort.abort();state.abort=null}if(els.prepareBox)els.prepareBox.hidden=true;if(els.startBtn&&state.level&&els.setup&&!els.setup.hidden)els.startBtn.disabled=false;}
function activate(data,source,persist){
  const v=C.validateSet(data);if(!v.ok){diagnose(v.errors,false);return false}
  cancelPreparation();state.previewToken++;state.candidatePreviewToken++;
  state.set=data;state.source=source;state.pending=null;hideCandidate();
  const extra=[];
  if(source==='imported'&&persist&&!storageSet(importedKey(),JSON.stringify(data))){state.storageAvailable=false;extra.push('Набор активирован, но сохранить импорт в браузере не удалось.')}
  renderSetup();diagnose(diagnosticsForValidSet(extra),true);return true;
}

function renderSetup(){
  show('setup');state.sequence=null;state.level=null;state.results=[];state.input='';state.phase='answer';state.locked=false;
  text(els.setTitle,state.set?state.set.title:'Набор не загружен');
  const src=state.source==='stock'?'штатный набор':state.source==='demo'?'демонстрационный набор':'импортированный набор';
  text(els.setMeta,state.set?`id: ${state.set.id} · revision: ${state.set.revision} · ${src}`:'');
  els.levels.replaceChildren();els.preview.replaceChildren();els.startBtn.disabled=true;
  if(!state.set)return;
  const p=getProgress();
  state.set.levels.forEach((l,i)=>{
    const b=document.createElement('button');b.className='level-card';b.type='button';const open=i<=Math.min(p.maxUnlocked,state.set.levels.length-1);b.disabled=!open;
    const count=l.items.reduce((a,x)=>a+x.count,0);b.innerHTML='<span class="level-name"></span><span class="level-detail"></span>';
    b.querySelector('.level-name').textContent=l.title;b.querySelector('.level-detail').textContent=`${count} заданий · ≤ ${l.maxErrors} ошибок · ≤ ${l.maxSeconds} с${open?'':' · закрыт'}`;
    b.addEventListener('click',()=>selectLevel(i,b));els.levels.appendChild(b);
  });
}
async function renderPreview(set,level,container,isCurrent=()=>true){
  container.replaceChildren();const loading=document.createElement('div');loading.className='preview-head';loading.textContent='Предпросмотр: подготовка…';container.appendChild(loading);
  const warnings=[];
  try{
    const seq=await C.generateLevel(set,level,{rng:seeded(12345),onWarning:w=>warnings.push(w)});
    if(!isCurrent())return null;
    container.replaceChildren();const h=document.createElement('div');h.className='preview-head';h.textContent=`Предпросмотр первых ${Math.min(10,seq.length)} заданий`;container.appendChild(h);
    for(const warning of warnings){const d=document.createElement('div');d.className='preview-warning';d.textContent='Предупреждение: '+warning;container.appendChild(d)}
    seq.slice(0,10).forEach((x,k)=>{const row=document.createElement('div');row.className='preview-row';row.textContent=`${k+1}. ${x.prompt} → ${fmt(x.answer)}`;container.appendChild(row)});return true;
  }catch(e){
    if(!isCurrent())return null;
    container.replaceChildren();const h=document.createElement('div');h.className='preview-head';h.textContent='Уровень нельзя подготовить';container.appendChild(h);const d=document.createElement('div');d.className='error-text';d.textContent=e.message;container.appendChild(d);return false;
  }
}
async function selectLevel(i,b){
  const token=++state.previewToken;state.level=state.set.levels[i];document.querySelectorAll('#levels .level-card').forEach(x=>x.classList.toggle('selected',x===b));els.startBtn.disabled=true;
  const ok=await renderPreview(state.set,state.level,els.preview,()=>token===state.previewToken);
  if(token===state.previewToken)els.startBtn.disabled=ok!==true;
}

function stageCandidate(data){
  const v=C.validateSet(data);if(!v.ok){diagnose([...v.errors,'Предыдущий рабочий набор сохранён.'],false);return}
  state.pending=data;const token=++state.candidatePreviewToken;els.candidateBox.hidden=false;els.candidatePreviewDetails.open=false;text(els.candidateTitle,data.title);text(els.candidateMeta,`id: ${data.id} · revision: ${data.revision} · ${data.levels.length} уровней`);els.candidateLevels.replaceChildren();els.candidatePreview.replaceChildren();
  data.levels.forEach(l=>{const b=document.createElement('button');b.type='button';b.className='level-card';b.innerHTML='<span class="level-name"></span><span class="level-detail"></span>';b.querySelector('.level-name').textContent=l.title;b.querySelector('.level-detail').textContent=`${l.items.reduce((a,x)=>a+x.count,0)} заданий`;b.addEventListener('click',async()=>{const previewToken=++state.candidatePreviewToken;els.candidatePreviewDetails.open=false;document.querySelectorAll('#candidateLevels .level-card').forEach(x=>x.classList.toggle('selected',x===b));await renderPreview(data,l,els.candidatePreview,()=>state.pending===data&&previewToken===state.candidatePreviewToken)});els.candidateLevels.appendChild(b)});
  void token;diagnose(['Импортированный файл прошёл проверку. Просмотрите набор и нажмите «Использовать набор» для активации.'],true);
}
function hideCandidate(){if(!els.candidateBox)return;els.candidateBox.hidden=true;els.candidatePreviewDetails.open=false;els.candidateLevels.replaceChildren();els.candidatePreview.replaceChildren();}
function useCandidate(){if(state.pending)activate(state.pending,'imported',true)}
function discardCandidate(){state.pending=null;state.candidatePreviewToken++;hideCandidate();diagnose(['Импорт отменён. Текущий рабочий набор не изменён.'],true)}

async function startSelected(){
  if(!state.level)return;
  const set=state.set,level=state.level,token=++state.prepareToken;state.abort=new AbortController();els.prepareBox.hidden=false;els.startBtn.disabled=true;text(els.prepareText,'Проверяю допустимые комбинации…');
  try{
    const warnings=[];const seq=await C.generateLevel(set,level,{signal:state.abort.signal,onProgress:(n,t)=>{if(token===state.prepareToken)text(els.prepareText,`Подготовка: ${n} / ${t}`)},onWarning:w=>warnings.push(w)});
    if(token!==state.prepareToken||set!==state.set||level!==state.level)return;
    state.sequence=seq;state.index=0;state.input='';state.results=[];state.elapsedMs=0;state.interrupted=false;state.locked=false;state.phase='answer';state.shownAt=Date.now();state.abort=null;saveSession();els.prepareBox.hidden=true;
    if(warnings.length)diagnose(diagnosticsForValidSet(warnings.map(w=>'Предупреждение: '+w)),true);
    beginPractice();
  }catch(e){
    if(token!==state.prepareToken)return;
    state.abort=null;els.prepareBox.hidden=true;els.startBtn.disabled=false;if(e.name!=='AbortError')diagnose([e.message],false);
  }
}
function beginPractice(){show('practice');if(state.index>=state.sequence.length){finish();return}renderQuestion()}
function renderQuestion(){const item=state.sequence[state.index];text(els.levelTitle,state.level.title);text(els.progress,`${state.index+1} / ${state.sequence.length}`);text(els.problem,item.prompt);state.locked=false;state.phase='answer';text(els.feedback,state.interrupted?'Сеанс прерван: результат не откроет следующий уровень.':'');els.feedback.className=state.interrupted?'feedback warn':'feedback';renderInput();state.shownAt=Date.now();saveSession()}
function renderInput(){text(els.answer,state.input||' ');els.submit.disabled=state.locked||state.input===''||state.input==='-'}
function action(a){
  if(state.locked||els.practice.hidden)return;if(a==='submit'){submitAnswer();return}
  let candidate=state.input;if(/^\d$/.test(a)){if(candidate==='0')candidate=a;else if(candidate==='-0')candidate='-'+a;else candidate+=a}
  else if(a==='sign'){candidate=candidate.startsWith('-')?candidate.slice(1):'-'+candidate}
  else if(a==='back'){candidate=candidate.slice(0,-1)}
  const clean=sanitizeIntegerInput(candidate);if(clean===null)return;state.input=clean;renderInput();saveSession();
}
function advanceAfterFeedback(){if(state.phase!=='feedback')return;state.index++;state.input='';state.phase='answer';if(state.index>=state.sequence.length)finish();else renderQuestion()}
function submitAnswer(){
  if(state.locked||state.phase!=='answer'||state.input===''||state.input==='-')return;
  state.locked=true;const elapsed=Date.now()-state.shownAt;state.elapsedMs+=elapsed;const item=state.sequence[state.index];const n=Number(state.input);const correct=n===item.answer;
  state.results.push({prompt:item.prompt,answer:item.answer,given:n,correct,elapsedMs:elapsed});state.phase='feedback';text(els.feedback,correct?'Верно':'Неверно. Ответ: '+fmt(item.answer));els.feedback.className='feedback '+(correct?'good':'bad');renderInput();saveSession();setTimeout(advanceAfterFeedback,900);
}
function finish(){
  const errors=state.results.filter(x=>!x.correct).length;const secs=state.elapsedMs/1000;const passed=!state.interrupted&&errors<=state.level.maxErrors&&secs<=state.level.maxSeconds;
  if(passed){const idx=state.set.levels.findIndex(l=>l.id===state.level.id);const p=getProgress();p.maxUnlocked=Math.max(p.maxUnlocked,Math.min(state.set.levels.length-1,idx+1));saveProgress(p)}
  clearSession();show('report');text(els.reportTitle,passed?'Уровень пройден':'Тренировка завершена');text(els.reportStats,`${state.results.filter(x=>x.correct).length}/${state.results.length} верно · ошибок: ${errors} · время: ${secs.toFixed(1)} с · порог: ≤ ${state.level.maxErrors} ошибок и ≤ ${state.level.maxSeconds} с${state.interrupted?' · сеанс был прерван':''}`);els.reportList.replaceChildren();state.results.forEach((r,i)=>{const row=document.createElement('div');row.className='report-row '+(r.correct?'ok':'fail');const q=document.createElement('span');q.textContent=`${i+1}. ${r.prompt}`;const a=document.createElement('span');a.textContent=`ваш: ${fmt(r.given)} · ответ: ${fmt(r.answer)}`;row.append(q,a);els.reportList.appendChild(row)})
}

function validSessionItem(x){return x&&typeof x==='object'&&typeof x.prompt==='string'&&x.prompt.length<=1000&&Number.isInteger(x.answer)&&Math.abs(x.answer)<=1000000}
function validResult(x){return x&&typeof x==='object'&&typeof x.prompt==='string'&&Number.isInteger(x.answer)&&Math.abs(x.answer)<=1000000&&Number.isInteger(x.given)&&Math.abs(x.given)<=1000000&&typeof x.correct==='boolean'&&Number.isFinite(x.elapsedMs)&&x.elapsedMs>=0}
function tryRestore(){
  const raw=storageGet(sessionKey());if(!raw)return false;
  try{
    const s=JSON.parse(raw),v=C.validateSet(s.setSnapshot);if(!v.ok||!s.levelSnapshot||!Array.isArray(s.sequence)||!s.sequence.length||s.sequence.length>100||!s.sequence.every(validSessionItem))throw new Error('bad session');
    const level=s.setSnapshot.levels.find(l=>l.id===s.levelSnapshot.id);if(!level)throw new Error('bad level');
    if(!Number.isInteger(s.index)||s.index<0||s.index>=s.sequence.length)throw new Error('bad index');
    const input=typeof s.input==='string'?sanitizeIntegerInput(s.input):null;if(input===null)throw new Error('bad input');
    const results=Array.isArray(s.results)&&s.results.every(validResult)?s.results:null;if(!results)throw new Error('bad results');
    const phase=s.phase==='feedback'||results.length===s.index+1?'feedback':'answer';
    if((phase==='answer'&&results.length!==s.index)||(phase==='feedback'&&results.length!==s.index+1))throw new Error('inconsistent session');
    if(!Number.isFinite(s.elapsedMs)||s.elapsedMs<0)throw new Error('bad elapsed');
    state.set=s.setSnapshot;state.source=['stock','demo','imported'].includes(s.source)?s.source:'imported';renderSetup();
    let index=s.index,restoredInput=input;if(phase==='feedback'){index++;restoredInput=''}
    Object.assign(state,{level,sequence:s.sequence,index,input:restoredInput,results,elapsedMs:s.elapsedMs,interrupted:true,locked:false,phase:'answer',shownAt:Date.now()});
    els.resumeBox.hidden=false;
    const msg=index>=state.sequence.length?`Есть прерванный завершённый сеанс «${state.level.title}». Можно открыть отчёт без зачёта результата или начать заново.`:`Есть прерванный сеанс «${state.level.title}», задание ${index+1} из ${state.sequence.length}. Можно продолжить без зачёта результата или начать заново.`;
    text(els.resumeBox.querySelector('p'),msg);return true;
  }catch{clearSession();return false}
}
function resume(){els.resumeBox.hidden=true;if(state.index>=state.sequence.length)finish();else beginPractice()}
function restartInterrupted(){els.resumeBox.hidden=true;clearSession();renderSetup()}

function onFile(e){
  const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
  if(!/\.json$/i.test(f.name)){diagnose(['Нужен файл с расширением .json. Предыдущий рабочий набор сохранён.'],false);return}
  if(f.size>1024*1024){diagnose(['Файл больше 1 MiB. Предыдущий рабочий набор сохранён.'],false);return}
  const r=new FileReader();r.onload=()=>{try{const raw=new TextDecoder('utf-8',{fatal:true}).decode(r.result);stageCandidate(JSON.parse(raw))}catch(e){diagnose([e instanceof SyntaxError?'Ошибка синтаксиса JSON. Предыдущий рабочий набор сохранён.':'Файл должен быть корректным UTF-8 JSON. Предыдущий рабочий набор сохранён.'],false)}};r.onerror=()=>diagnose(['Не удалось прочитать файл. Предыдущий рабочий набор сохранён.'],false);r.readAsArrayBuffer(f)
}
function keyboard(e){if(els.practice.hidden)return;if(/^\d$/.test(e.key)){e.preventDefault();action(e.key)}else if(e.key==='-'){e.preventDefault();action('sign')}else if(e.key==='Backspace'){e.preventDefault();action('back')}else if(e.key==='Enter'){e.preventDefault();action('submit')}}
function markInterrupted(){if(!els.practice.hidden&&state.sequence&&state.index<state.sequence.length){state.interrupted=true;saveSession();text(els.feedback,'Сеанс прерван: результат не откроет следующий уровень.');els.feedback.className='feedback warn'}}

async function init(){
  mapEls();state.storageAvailable=detectStorage();
  els.loadFileBtn.addEventListener('click',()=>els.fileInput.click());els.fileInput.addEventListener('change',onFile);els.stockBtn.addEventListener('click',()=>loadBundled('data/templates.json','stock'));els.demoBtn.addEventListener('click',()=>loadBundled('data/demo-templates.json','demo'));
  els.useCandidateBtn.addEventListener('click',useCandidate);els.discardCandidateBtn.addEventListener('click',discardCandidate);els.startBtn.addEventListener('click',startSelected);els.cancelPrepare.addEventListener('click',cancelPreparation);
  els.keypad.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b)action(b.dataset.action)});els.submit.addEventListener('click',()=>action('submit'));els.backBtn.addEventListener('click',renderSetup);els.resumeBtn.addEventListener('click',resume);els.restartBtn.addEventListener('click',restartInterrupted);document.addEventListener('keydown',keyboard);document.addEventListener('visibilitychange',()=>{if(document.hidden)markInterrupted()});
  if(tryRestore())return;
  let imported=null;try{imported=JSON.parse(storageGet(importedKey())||'null')}catch{}
  if(imported&&C.validateSet(imported).ok)activate(imported,'imported',false);else await loadBundled('data/templates.json','stock');
}
window.addEventListener('DOMContentLoaded',init);
})();
