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
  assert.deepEqual(M.mergeStores(base,incoming).data,M.validateStore(base));
  const newer=M.createSession(2,'2026-11-05T09:00:00Z');newer.exercises.push(M.createExercise([120,220],t0,t1));
  const r=M.mergeStores(base,{...incoming,sessions:[s,newer]});
  assert.equal(r.added,1);assert.equal(r.data.target,10);assert.equal(r.data.sessions.length,2);
});
test('historical comparison picks latest same-count earlier day',()=>{
  function s(day,target){const o=M.createSession(target,`2026-11-${day}T10:00:00Z`);o.exercises.push(M.createExercise(Array(target).fill(100),t0,t1));return o;}
  const today=s('04',10), earlierToday=s('04',10), yesterday=s('03',10), wrongTarget=s('03',5);
  for(const session of [today,earlierToday,yesterday,wrongTarget]) session.exercises.push(M.createExercise(Array(session.target).fill(110),t0,t1));
  earlierToday.createdAt='2026-11-04T09:00:00Z';
  assert.equal(M.findBaseline([earlierToday,yesterday,wrongTarget,today],today).id,yesterday.id);
});

test('v1 migration retains exact measurements and pairs under default athlete',()=>{
  const legacy = M.createSession(2,t0); delete legacy.athleteId;
  legacy.exercises.push(M.createExercise([1101,1144],t0,t1));
  const migrated = M.validateStore({version:1,target:10,sessions:[legacy]});
  assert.equal(migrated.version,3);
  assert.equal(migrated.athletes.length,1);
  assert.equal(migrated.sessions[0].athleteId,M.DEFAULT_ATHLETE_ID);
  assert.deepEqual(migrated.sessions[0].exercises[0].intervals,[1101,1144]);
  assert.equal(migrated.sessions[0].exercises[0].mode,M.MODE_INTERVALS);
  assert.equal(migrated.sessions[0].exercises[0].totalMs,2245);
  assert.deepEqual(M.validateStore(migrated),migrated);
});
test('two athletes retain independent pending pairs and separated baseline',()=>{
  const a=M.createAthlete('Алексей'),b=M.createAthlete('Борис');
  const a1=M.createSession(2,t0,a.id),b1=M.createSession(2,t0,b.id),a2=M.createSession(2,'2026-11-06T08:00:00.000Z',a.id);
  for(const s of [a1,b1,a2])s.exercises.push(M.createExercise([1200,1300],t0,t1));
  a1.exercises.push(M.createExercise([1300,1400],t0,t1));
  const store={version:2,target:2,selectedAthleteId:a.id,athletes:[a,b],sessions:[a1,b1,a2]};
  assert.equal(M.validateStore(store).sessions.length,3);
  assert.equal(M.findBaseline(store.sessions,a2).id,a1.id);
  assert.equal(M.findBaseline(store.sessions,b1),null);
  assert.throws(()=>M.validateStore({...store, sessions:[{...a1,athleteId:'not-in-athletes'}]}));
});
test('backup import merges athletes and sessions; legacy backup goes to default profile',()=>{
  const x=M.createAthlete('А'), y=M.createAthlete('Б');
  const mk=(athlete)=>{const s=M.createSession(2,t0,athlete);s.exercises.push(M.createExercise([1200,1400],t0,t1));return s;};
  const local={version:2,target:10,selectedAthleteId:x.id,athletes:[x],sessions:[mk(x.id)]};
  const imported={version:2,target:2,selectedAthleteId:y.id,athletes:[y],sessions:[mk(y.id)]};
  const result=M.mergeStores(local,imported);
  assert.equal(result.added,1);assert.equal(result.athletesAdded,1);
  assert.deepEqual(result.data.athletes.map(x=>x.id),[x.id,y.id]);
  assert.equal(result.data.selectedAthleteId,x.id);
  const legacySession=M.createSession(2,t0); delete legacySession.athleteId;legacySession.exercises.push(M.createExercise([1300,1400],t0,t1));
  const withLegacy=M.mergeStores(result.data,{version:1,target:10,sessions:[legacySession]});
  assert.equal(withLegacy.athletesAdded,1);
  assert.equal(withLegacy.data.sessions.at(-1).athleteId,M.DEFAULT_ATHLETE_ID);
});
