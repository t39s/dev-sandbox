/* No external dependencies: deterministic fake-DOM smoke test for app control flow. */
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const model = require('../model.js');
const application = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
class Node {
  constructor(tag='div') { this.tagName=tag;this.children=[];this.events={};this.style={};this.dataset={};this.attributes={};this.value='';this.textContent='';this._classes=new Set();
    this.classList={toggle:(c,b)=>b?this._classes.add(c):this._classes.delete(c),add:c=>this._classes.add(c),remove:c=>this._classes.delete(c),contains:c=>this._classes.has(c)}; }
  set className(s){this._classes=new Set(String(s).split(' ').filter(Boolean));}get className(){return [...this._classes].join(' ');}
  append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;}
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}dispatch(type,props={}){for(const fn of this.events[type]??[])fn({preventDefault(){},stopPropagation(){},...props});}
  setAttribute(k,v){this.attributes[k]=v;}
}
function harness(store=new Map(), tapConfig={minTapGapMs:1000}) {
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const nav=['capture','capture','settings'].map(go=>{const n=new Node('button');n.dataset.go=go;return n;});
 const document={getElementById:get,createElement:tag=>new Node(tag),createElementNS:(_ns,tag)=>new Node(tag),createTextNode:s=>({textContent:s}),querySelectorAll:()=>nav,body:new Node('body'),addEventListener(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>{store.set(k,v);}};
 let clock=100000;
 let nextTimer=0;
 const timers=new Map();
 const window={IntervalModel:model,scrollTo(){},addEventListener(){},confirm:()=>true,prompt:(_label,old)=>old+' новое'};
 const fetch = async url => {
   if (url !== './config.json') throw new Error('Unexpected request: '+url);
   return {ok:true,status:200,json:async()=>tapConfig};
 };
 const context={window,document,navigator:{},localStorage,performance:{now:()=>clock},fetch,Date,Intl,Math,JSON,Number,
   Blob,URL,setTimeout:(fn,ms=0)=>{const id=++nextTimer;timers.set(id,{at:clock+ms,fn});return id;},
   clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>1,cancelAnimationFrame(){},console};
 vm.runInNewContext(application,context,{filename:'app.js'});
 const tap=(advance=1100)=>{clock+=advance;get('tapZone').dispatch('pointerdown',{isPrimary:true,button:0});};
 const advance=ms=>{clock+=ms;let due;
   while((due=[...timers.entries()].filter(([,x])=>x.at<=clock).sort((a,b)=>a[1].at-b[1].at)[0])){
     timers.delete(due[0]);due[1].fn();
   }
 };
 const ready=(async()=>{
   for(let i=0;i<25 && get('tapZone').disabled;i++)await Promise.resolve();
   if(tapConfig && Number.isSafeInteger(tapConfig.minTapGapMs) && tapConfig.minTapGapMs>=0 &&
      tapConfig.minTapGapMs<=3600000 && get('tapZone').disabled) throw new Error('Config load not complete');
 })();
 return {get,tap,advance,nav,store,window,ready};
}
test('app runs 11 taps per exercise, persists two full exercises, reopens history',async()=>{
 const h=harness();await h.ready;assert.equal(h.get('intervalText').textContent,'0 / 10 интервалов');
 assert.equal(h.get('intervalDigit').textContent,'0');
 h.tap();assert.equal(h.get('intervalDigit').textContent,'0');
 for(let i=1;i<11;i++){h.tap();assert.equal(h.get('intervalDigit').textContent,String(i));}
 assert.equal(h.get('capture').classList.contains('tap-flash'),true);
 h.advance(650);
 assert.equal(h.get('reviewTitle').textContent,'Первое упражнение');
 let data=JSON.parse(h.store.get(model.STORAGE_KEY));
 assert.equal(data.sessions.length,1);assert.equal(data.sessions[0].exercises[0].intervals.length,10);
 assert.equal(data.sessions[0].exercises[0].intervals.reduce((a,b)=>a+b,0),11000);
 const next=h.get('reviewActions').children.find(x=>x.textContent?.includes('Запустить упражнение 2'));
 assert.ok(next);next.dispatch('click');
 for(let i=0;i<11;i++)h.tap();
 h.advance(650);
 assert.equal(h.get('reviewTitle').textContent,'Сравнение упражнений');
 data=JSON.parse(h.store.get(model.STORAGE_KEY));
 assert.equal(data.sessions[0].exercises.length,2);
 const reloaded=harness(h.store);await reloaded.ready;reloaded.get('historyBtn').dispatch('click');
 assert.equal(reloaded.get('historyList').children.length,1);
});
test('settings target determines taps independently for next pair',async()=>{
 const h=harness();await h.ready;h.get('settingsBtn').dispatch('click');h.get('targetInput').value='2';
 h.get('settingsForm').dispatch('submit');
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).target,2);
 h.nav[0].dispatch('click');assert.equal(h.get('intervalText').textContent,'0 / 2 интервалов');
 for(let i=0;i<3;i++)h.tap();h.advance(650);
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions[0].exercises[0].intervals.length,2);
});

test('strict >1000 ms tap gate: rejected taps do not count, flash, or reset timer',async()=>{
 const h=harness();await h.ready;
 h.tap(0);
 assert.equal(h.get('intervalDigit').textContent,'0');
 assert.equal(h.get('capture').classList.contains('tap-flash'),true);
 h.advance(150);
 assert.equal(h.get('capture').classList.contains('tap-flash'),false);
 h.tap(849);  // 999ms from start: rejected
 assert.equal(h.get('intervalDigit').textContent,'0');
 assert.equal(h.get('capture').classList.contains('tap-flash'),false);
 h.tap(1);    // exactly 1000ms from start: rejected
 assert.equal(h.get('intervalDigit').textContent,'0');
 assert.equal(h.get('capture').classList.contains('tap-flash'),false);
 h.tap(0.01); // 1000.01ms from start: accepted
 assert.equal(h.get('intervalDigit').textContent,'1');
 assert.equal(h.get('capture').classList.contains('tap-flash'),true);
 h.advance(150);
 h.tap(200);  // rejected after last accepted tap
 assert.equal(h.get('intervalDigit').textContent,'1');
 assert.equal(h.get('capture').classList.contains('tap-flash'),false);
 const data=h.store.get(model.STORAGE_KEY);
 assert.equal(data, undefined, 'no history saved before final interval');
});
test('last interval stays visible briefly and ignores extra taps while finishing',async()=>{
 const h=harness();await h.ready;h.get('settingsBtn').dispatch('click');h.get('targetInput').value='1';
 h.get('settingsForm').dispatch('submit');h.nav[0].dispatch('click');
 h.tap();assert.equal(h.get('intervalDigit').textContent,'0');
 h.tap(1200);assert.equal(h.get('intervalDigit').textContent,'1');
 assert.equal(h.get('capture').classList.contains('hidden'),false);
 assert.equal(h.get('stateLabel').textContent,'ИНТЕРВАЛЫ ЗАВЕРШЕНЫ');
 h.tap(3000);assert.equal(h.get('intervalDigit').textContent,'1');
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions[0].exercises.length,1);
 h.advance(650);assert.equal(h.get('reviewTitle').textContent,'Первое упражнение');
});

test('interleaved athlete1/athlete2: each first attempt waits for own second attempt',async()=>{
  const h=harness();await h.ready;
  // New short target applies to both athlete pairs.
  h.get('settingsBtn').dispatch('click'); h.get('targetInput').value='2'; h.get('settingsForm').dispatch('submit');
  h.nav[0].dispatch('click');
  const complete=()=>{for(let i=0;i<3;i++)h.tap(1300);h.advance(700);};
  complete();
  let data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.length,1); assert.equal(data.sessions[0].exercises.length,1);
  const firstAthlete=data.selectedAthleteId;
  h.get('reviewActions').children.find(x=>x.textContent==='Сменить спортсмена').dispatch('click');
  assert.equal(h.get('athletes').classList.contains('hidden'),false);
  h.get('athleteNameInput').value='Спортсмен 2';h.get('athleteForm').dispatch('submit');
  data=JSON.parse(h.store.get(model.STORAGE_KEY));
  const secondAthlete=data.selectedAthleteId;assert.notEqual(secondAthlete,firstAthlete);
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 2 · ПОПЫТКА 01 / 02 · С ОТСЕЧКАМИ');
  complete();
  data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.length,2);
  assert.equal(data.sessions.filter(s=>s.exercises.length===1).length,2);
  // Return to athlete 1 for exercise 2 (athlete 2 remains pending).
  h.get('reviewActions').children.find(x=>x.textContent==='Сменить спортсмена').dispatch('click');
  h.get('athleteList').children[0].children[0].dispatch('click');
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 1 · ПОПЫТКА 02 / 02 · С ОТСЕЧКАМИ');
  complete();
  data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.find(s=>s.athleteId===firstAthlete).exercises.length,2);
  assert.equal(data.sessions.find(s=>s.athleteId===secondAthlete).exercises.length,1);
  // Athlete 1 history contains only his pair.
  h.get('reviewActions').children.find(x=>x.textContent==='История').dispatch('click');
  assert.equal(h.get('historyList').children.length,1);
  // Then athlete 2 completes his second exercise.
  h.get('historyChangeAthlete').dispatch('click');
  h.get('athleteList').children[1].children[0].dispatch('click');
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 2 · ПОПЫТКА 02 / 02 · С ОТСЕЧКАМИ');
  complete();
  data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.length,2);
  assert.equal(data.sessions.every(s=>s.exercises.length===2),true);
  assert.equal(h.get('reviewTitle').textContent,'Сравнение упражнений');
  const reload=harness(h.store);await reload.ready;
  assert.equal(reload.get('phaseLabel').textContent,'СПОРТСМЕН 2 · ПОПЫТКА 01 / 02 · С ОТСЕЧКАМИ');
  reload.get('historyBtn').dispatch('click');assert.equal(reload.get('historyList').children.length,1);
});
test('v1 application data migrates in-place without losing pending pair',async()=>{
  const store=new Map();
  const legacy=model.createSession(2,'2026-11-04T08:00:00.000Z');delete legacy.athleteId;
  legacy.exercises.push(model.createExercise([1100,1200],'2026-11-04T08:00:00.000Z','2026-11-04T08:00:02.300Z'));
  store.set(model.STORAGE_KEY,JSON.stringify({version:1,target:2,sessions:[legacy]}));
  const h=harness(store);await h.ready;
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 1 · ПОПЫТКА 02 / 02 · С ОТСЕЧКАМИ');
  const migrated=JSON.parse(store.get(model.STORAGE_KEY));
  assert.equal(migrated.version,4);assert.equal(migrated.sessions[0].id,legacy.id);
  assert.deepEqual(migrated.sessions[0].exercises[0].intervals,[1100,1200]);
});

test('start-stop uses separate interface; exactly two accepted taps and >1000ms gate',async()=>{
  const h=harness();await h.ready;h.get('modeBtn').dispatch('click');
  assert.equal(h.get('modes').classList.contains('hidden'),false);
  h.get('selectStopwatch').dispatch('click');
  assert.equal(h.get('capture').classList.contains('mode-stopwatch'),true);
  assert.equal(h.get('tapInstruction').textContent,'КОСНИТЕСЬ ДЛЯ СТАРТА');
  assert.equal(h.get('timeDisplay').textContent,'00:00.00');
  h.tap(0);assert.equal(h.get('tapInstruction').textContent,'КОСНИТЕСЬ ДЛЯ СТОПА');
  h.advance(150);h.tap(850);
  assert.equal(h.get('capture').classList.contains('tap-flash'),false);
  assert.equal(h.store.get(model.STORAGE_KEY) === undefined,false,'mode saved');
  assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions.length,0);
  h.tap(151);assert.equal(h.get('capture').classList.contains('tap-flash'),true);
  h.advance(700);
  assert.equal(h.get('reviewTitle').textContent,'Первое упражнение');
  assert.equal(h.get('chartPanel').classList.contains('hidden'),true);
  assert.equal(h.get('tablePanel').classList.contains('hidden'),true);
  const data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions[0].exercises[0].mode,model.MODE_STOPWATCH);
  assert.equal(data.sessions[0].exercises[0].totalMs,1151);
});

test('pair may switch from start-stop to intervals, compares only best total',async()=>{
  const h=harness();await h.ready;h.get('modeBtn').dispatch('click');h.get('selectStopwatch').dispatch('click');
  h.tap(0);h.tap(1400);h.advance(700);
  const first=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(first.sessions[0].exercises[0].totalMs,1400);
  h.get('reviewActions').children.find(x=>x.textContent==='Запустить упражнение 2 →').dispatch('click');
  h.get('modeBtn').dispatch('click');h.get('selectIntervals').dispatch('click');
  h.get('settingsBtn').dispatch('click');h.get('targetInput').value='2';h.get('settingsForm').dispatch('submit');
  h.nav[0].dispatch('click');
  // Current pair retains original target: 10 intervals.
  for(let i=0;i<11;i++)h.tap(1300);
  h.advance(700);
  const data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.length,1);
  assert.equal(data.sessions[0].exercises[0].mode,'stopwatch');
  assert.equal(data.sessions[0].exercises[1].mode,'intervals');
  assert.equal(data.sessions[0].exercises[1].intervals.length,10);
  assert.equal(model.bestTotal(data.sessions[0]),1400);
  assert.equal(h.get('tablePanel').classList.contains('hidden'),false);
  assert.equal(h.get('intervalTable').children[0].children[0].children.length,1);
});

test('manual historical result assigned to selected athlete, survives reload, excludes other athletes',async()=>{
  const h=harness();await h.ready;h.get('historyBtn').dispatch('click');
  h.get('archiveDate').value='2026-10-18';h.get('archiveSeconds').value='12,345';
  h.get('archiveForm').dispatch('submit');
  let data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.archived.length,1);assert.equal(data.archived[0].bestMs,12345);
  assert.equal(h.get('historyList').children.length,1);
  const reloaded=harness(h.store);await reloaded.ready;reloaded.get('historyBtn').dispatch('click');
  assert.equal(reloaded.get('historyList').children.length,1);
  reloaded.get('historyChangeAthlete').dispatch('click');
  reloaded.get('athleteNameInput').value='Другая';reloaded.get('athleteForm').dispatch('submit');
  reloaded.get('historyBtn').dispatch('click');
  assert.equal(reloaded.get('historyList').children.length,1); // empty state
  assert.equal(reloaded.get('historyList').children[0].textContent,'У этого спортсмена пока нет результатов.');
});

// 1.4.0: an early finish is a retained, non-scored attempt and does not consume a slot.
test('early finish saves only partial intervals and allows the same scored slot to be retried',async()=>{
 const h=harness();await h.ready;h.get('settingsBtn').dispatch('click');h.get('targetInput').value='2';h.get('settingsForm').dispatch('submit');h.nav[0].dispatch('click');
 assert.equal(h.get('earlyFinishBtn').classList.contains('hidden'),true);
 h.tap(0);assert.equal(h.get('earlyFinishBtn').classList.contains('hidden'),false);
 h.tap(1400);h.get('earlyFinishBtn').dispatch('pointerdown');h.get('earlyFinishBtn').dispatch('click');
 let data=JSON.parse(h.store.get(model.STORAGE_KEY));
 assert.equal(data.sessions.length,0);assert.equal(data.incomplete.length,1);
 assert.equal(data.incomplete[0].status,'incomplete');assert.equal(data.incomplete[0].intervals.length,1);
 assert.equal(data.incomplete[0].elapsedMs,1400);assert.equal(h.get('historyList').children.length,1);
 h.nav[0].dispatch('click');assert.equal(h.get('phaseLabel').textContent.includes('ПОПЫТКА 01'),true);
 h.tap(1200);h.tap(1200);h.tap(1200);h.advance(700);
 data=JSON.parse(h.store.get(model.STORAGE_KEY));assert.equal(data.sessions.length,1);
 assert.equal(data.sessions[0].exercises.length,1);assert.equal(data.incomplete.length,1);
 assert.equal(model.bestTotal(data.sessions[0]),null);
 // Early-finish a second attempt: first scored attempt remains intact and awaiting another second.
 h.get('reviewActions').children.find(x=>x.textContent?.includes('Запустить упражнение 2')).dispatch('click');
 h.tap(1200);h.get('earlyFinishBtn').dispatch('click');
 data=JSON.parse(h.store.get(model.STORAGE_KEY));assert.equal(data.sessions.length,1);
 assert.equal(data.sessions[0].exercises.length,1);assert.equal(data.sessions[0].status,'pending');
 assert.equal(data.incomplete.length,2);
 const reload=harness(h.store);await reload.ready;assert.equal(reload.get('phaseLabel').textContent.includes('ПОПЫТКА 02'),true);
});
test('declining second attempt closes a one-attempt scored series and can start a new series',async()=>{
 const h=harness();await h.ready;h.get('settingsBtn').dispatch('click');h.get('targetInput').value='1';h.get('settingsForm').dispatch('submit');h.nav[0].dispatch('click');
 h.tap(0);h.tap(1450);h.advance(700);
 assert.equal(h.get('reviewTitle').textContent,'Первое упражнение');
 const finish=h.get('reviewActions').children.find(x=>x.textContent?.includes('Завершить серию без второй'));assert.ok(finish);finish.dispatch('click');
 let data=JSON.parse(h.store.get(model.STORAGE_KEY));assert.equal(data.sessions[0].status,'closed');
 assert.equal(model.bestTotal(data.sessions[0]),1450);assert.equal(h.get('reviewTitle').textContent,'Серия завершена');
 assert.ok(h.get('reviewActions').children.find(x=>x.textContent==='Новая пара'));
 const reloaded=harness(h.store);await reloaded.ready;assert.equal(reloaded.get('phaseLabel').textContent.includes('ПОПЫТКА 01'),true);
 reloaded.get('historyBtn').dispatch('click');assert.equal(reloaded.get('historyList').children.length,1);
});
test('decline and deletion demand confirmation and remove only chosen records',async()=>{
 const h=harness();await h.ready;h.get('settingsBtn').dispatch('click');h.get('targetInput').value='1';h.get('settingsForm').dispatch('submit');h.nav[0].dispatch('click');
 h.tap(0);h.tap(1500);h.advance(700);
 const skip=h.get('reviewActions').children.find(x=>x.textContent?.includes('Завершить серию без второй'));
 h.window.confirm=()=>false;skip.dispatch('click');
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions[0].status,'pending');
 h.window.confirm=()=>true;skip.dispatch('click');
 h.get('reviewActions').children.find(x=>x.textContent==='История').dispatch('click');
 h.get('archiveDate').value='2026-10-18';h.get('archiveSeconds').value='8,000';h.get('archiveForm').dispatch('submit');
 h.nav[0].dispatch('click');h.tap(0);h.get('earlyFinishBtn').dispatch('click');
 let data=JSON.parse(h.store.get(model.STORAGE_KEY));assert.equal(data.sessions.length,1);assert.equal(data.archived.length,1);assert.equal(data.incomplete.length,1);
 const findDelete=(label)=> {
   for(const card of h.get('historyList').children){for(const c of card.children){if(c.textContent?.includes(label))return c;}}
   throw new Error('Delete control missing: '+label);
 };
 h.window.confirm=()=>false;findDelete('Удалить запись').dispatch('click');
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions.length,1);
 h.window.confirm=()=>true;findDelete('Удалить запись').dispatch('click');
 data=JSON.parse(h.store.get(model.STORAGE_KEY));assert.equal(data.sessions.length,0);assert.equal(data.archived.length,1);assert.equal(data.incomplete.length,1);
 findDelete('Удалить архивную запись').dispatch('click');data=JSON.parse(h.store.get(model.STORAGE_KEY));
 assert.equal(data.archived.length,0);assert.equal(data.incomplete.length,1);
 findDelete('Удалить неполную попытку').dispatch('click');data=JSON.parse(h.store.get(model.STORAGE_KEY));
 assert.equal(data.incomplete.length,0);assert.equal(h.get('historyList').children.length,1);
});

test('config 500ms: 500 rejected and 501 accepted without resetting on ignored taps',async()=>{
 const h=harness(new Map(),{minTapGapMs:500});await h.ready;
 h.tap(0);h.tap(400);h.tap(100);
 assert.equal(h.get('intervalDigit').textContent,'0');
 h.tap(1);assert.equal(h.get('intervalDigit').textContent,'1');
 h.tap(500);assert.equal(h.get('intervalDigit').textContent,'1');
 h.tap(1);assert.equal(h.get('intervalDigit').textContent,'2');
});
test('configured 250ms gate also applies to stopwatch',async()=>{
 const h=harness(new Map(),{minTapGapMs:250});await h.ready;
 h.get('modeBtn').dispatch('click');h.get('selectStopwatch').dispatch('click');
 h.tap(0);h.tap(250);
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions.length,0);
 h.tap(1);assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions.length,1);
});
test('invalid config blocks the entire capture surface',async()=>{
 const h=harness(new Map(),{minTapGapMs:-1});await h.ready;
 assert.equal(h.get('tapZone').disabled,true);
 assert.equal(h.get('stateLabel').textContent,'ОШИБКА КОНФИГУРАЦИИ');
 h.tap(5000);assert.equal(h.store.get(model.STORAGE_KEY),undefined);
});
test('zero gap only rejects exactly simultaneous timestamps',async()=>{
 const h=harness(new Map(),{minTapGapMs:0});await h.ready;
 h.tap(0);h.tap(0);assert.equal(h.get('intervalDigit').textContent,'0');
 h.tap(1);assert.equal(h.get('intervalDigit').textContent,'1');
});
