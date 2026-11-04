const assert = require('node:assert/strict');
const test = require('node:test');
const M = require('../model.js');
const t0 = '2026-11-04T08:00:00.000Z';
const t1 = '2026-11-04T08:00:05.000Z';
test('ten intervals require eleven taps',()=>{
  assert.equal(M.requiredPresses(10),11);assert.equal(M.requiredPresses(1),2);
  for(const bad of [0,-1,1.5,201,NaN,'10'])assert.throws(()=>M.requiredPresses(bad));
});
test('timing formatting and statistics',()=>{
  assert.equal(M.formatClock(61342),'01:01.34');
  assert.equal(M.formatSeconds(1567.893),'1.568');
  const a=M.stats([1000,1100,900,800]);
  assert.equal(a.total,3800);assert.equal(a.avg,950);assert.equal(a.delta,-200);
  assert.equal(M.stats([0,0]).cv,0);assert.equal(M.stats([]),null);
  assert.equal(M.stats([1000]).delta,null);
});
test('completed exercise and valid exported data',()=>{
  const s=M.createSession(10,t0);s.exercises.push(M.createExercise(Array(10).fill(100),t0,t1));
  const backup=M.validateStore({version:1,target:10,sessions:[s]});
  assert.equal(backup.sessions[0].exercises[0].intervals.length,10);
  assert.throws(()=>M.validateStore({...backup,sessions:[{...s,exercises:[{...s.exercises[0],intervals:[1]}]}]}));
  assert.throws(()=>M.validateStore({...backup,sessions:[s,s]}));
});
test('import merges unique sessions and retains local target',()=>{
  const s=M.createSession(2,t0);s.exercises.push(M.createExercise([100,250],t0,t1));
  const base={version:1,target:10,sessions:[s]};const incoming={version:1,target:5,sessions:[s]};
  assert.deepEqual(M.mergeStores(base,incoming).data,base);
  const newer=M.createSession(2,'2026-11-05T09:00:00Z');newer.exercises.push(M.createExercise([120,220],t0,t1));
  const r=M.mergeStores(base,{...incoming,sessions:[s,newer]});
  assert.equal(r.added,1);assert.equal(r.data.target,10);assert.equal(r.data.sessions.length,2);
});
test('historical comparison picks latest same-count earlier day',()=>{
  function s(day,target){const o=M.createSession(target,`2026-11-${day}T10:00:00Z`);o.exercises.push(M.createExercise(Array(target).fill(100),t0,t1));return o;}
  const today=s('04',10), earlierToday=s('04',10), yesterday=s('03',10), wrongTarget=s('03',5);
  earlierToday.createdAt='2026-11-04T09:00:00Z';
  assert.equal(M.findBaseline([earlierToday,yesterday,wrongTarget,today],today).id,yesterday.id);
});
