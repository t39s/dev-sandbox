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
  addEventListener(type,fn){(this.events[type]??=[]).push(fn);}dispatch(type,props={}){for(const fn of this.events[type]??[])fn({preventDefault(){},...props});}
  setAttribute(k,v){this.attributes[k]=v;}
}
function harness(store=new Map()) {
 const nodes=new Map();const get=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const nav=['capture','capture','settings'].map(go=>{const n=new Node('button');n.dataset.go=go;return n;});
 const document={getElementById:get,createElement:tag=>new Node(tag),createElementNS:(_ns,tag)=>new Node(tag),createTextNode:s=>({textContent:s}),querySelectorAll:()=>nav,body:new Node('body'),addEventListener(){}};
 const localStorage={getItem:k=>store.get(k)||null,setItem:(k,v)=>{store.set(k,v);}};
 let clock=100000;
 let nextTimer=0;
 const timers=new Map();
 const window={IntervalModel:model,scrollTo(){},addEventListener(){},confirm:()=>true,prompt:(_label,old)=>old+' новое'};
 const context={window,document,navigator:{},localStorage,performance:{now:()=>clock},Date,Intl,Math,JSON,Number,
   Blob,URL,setTimeout:(fn,ms=0)=>{const id=++nextTimer;timers.set(id,{at:clock+ms,fn});return id;},
   clearTimeout:id=>timers.delete(id),requestAnimationFrame:()=>1,cancelAnimationFrame(){},console};
 vm.runInNewContext(application,context,{filename:'app.js'});
 const tap=(advance=1100)=>{clock+=advance;get('tapZone').dispatch('pointerdown',{isPrimary:true,button:0});};
 const advance=ms=>{clock+=ms;let due;
   while((due=[...timers.entries()].filter(([,x])=>x.at<=clock).sort((a,b)=>a[1].at-b[1].at)[0])){
     timers.delete(due[0]);due[1].fn();
   }
 };
 return {get,tap,advance,nav,store};
}
test('app runs 11 taps per exercise, persists two full exercises, reopens history',()=>{
 const h=harness();assert.equal(h.get('pressText').textContent,'1-е из 11 нажатий');
 assert.equal(h.get('intervalDigit').textContent,'—');
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
 const reloaded=harness(h.store);reloaded.get('historyBtn').dispatch('click');
 assert.equal(reloaded.get('historyList').children.length,1);
});
test('settings target determines taps independently for next pair',()=>{
 const h=harness();h.get('settingsBtn').dispatch('click');h.get('targetInput').value='2';
 h.get('settingsForm').dispatch('submit');
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).target,2);
 h.nav[0].dispatch('click');assert.equal(h.get('pressText').textContent,'1-е из 3 нажатий');
 for(let i=0;i<3;i++)h.tap();h.advance(650);
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions[0].exercises[0].intervals.length,2);
});

test('strict >1000 ms tap gate: rejected taps do not count, flash, or reset timer',()=>{
 const h=harness();
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
test('last interval stays visible briefly and ignores extra taps while finishing',()=>{
 const h=harness();h.get('settingsBtn').dispatch('click');h.get('targetInput').value='1';
 h.get('settingsForm').dispatch('submit');h.nav[0].dispatch('click');
 h.tap();assert.equal(h.get('intervalDigit').textContent,'0');
 h.tap(1200);assert.equal(h.get('intervalDigit').textContent,'1');
 assert.equal(h.get('capture').classList.contains('hidden'),false);
 assert.equal(h.get('stateLabel').textContent,'ИНТЕРВАЛЫ ЗАВЕРШЕНЫ');
 h.tap(3000);assert.equal(h.get('intervalDigit').textContent,'1');
 assert.equal(JSON.parse(h.store.get(model.STORAGE_KEY)).sessions[0].exercises.length,1);
 h.advance(650);assert.equal(h.get('reviewTitle').textContent,'Первое упражнение');
});

test('interleaved athlete1/athlete2: each first attempt waits for own second attempt',()=>{
  const h=harness();
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
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 2 · УПРАЖНЕНИЕ 01 / 02');
  complete();
  data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.length,2);
  assert.equal(data.sessions.filter(s=>s.exercises.length===1).length,2);
  // Return to athlete 1 for exercise 2 (athlete 2 remains pending).
  h.get('reviewActions').children.find(x=>x.textContent==='Сменить спортсмена').dispatch('click');
  h.get('athleteList').children[0].children[0].dispatch('click');
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 1 · УПРАЖНЕНИЕ 02 / 02');
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
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 2 · УПРАЖНЕНИЕ 02 / 02');
  complete();
  data=JSON.parse(h.store.get(model.STORAGE_KEY));
  assert.equal(data.sessions.length,2);
  assert.equal(data.sessions.every(s=>s.exercises.length===2),true);
  assert.equal(h.get('reviewTitle').textContent,'Сравнение упражнений');
  const reload=harness(h.store);
  assert.equal(reload.get('phaseLabel').textContent,'СПОРТСМЕН 2 · УПРАЖНЕНИЕ 01 / 02');
  reload.get('historyBtn').dispatch('click');assert.equal(reload.get('historyList').children.length,1);
});
test('v1 application data migrates in-place without losing pending pair',()=>{
  const store=new Map();
  const legacy=model.createSession(2,'2026-11-04T08:00:00.000Z');delete legacy.athleteId;
  legacy.exercises.push(model.createExercise([1100,1200],'2026-11-04T08:00:00.000Z','2026-11-04T08:00:02.300Z'));
  store.set(model.STORAGE_KEY,JSON.stringify({version:1,target:2,sessions:[legacy]}));
  const h=harness(store);
  assert.equal(h.get('phaseLabel').textContent,'СПОРТСМЕН 1 · УПРАЖНЕНИЕ 02 / 02');
  const migrated=JSON.parse(store.get(model.STORAGE_KEY));
  assert.equal(migrated.version,2);assert.equal(migrated.sessions[0].id,legacy.id);
  assert.deepEqual(migrated.sessions[0].exercises[0].intervals,[1100,1200]);
});
