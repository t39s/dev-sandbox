const assert=require('node:assert/strict');
const test=require('node:test');
const M=require('../model.js');
const t0='2026-11-11T08:00:00.000Z',t1='2026-11-11T08:00:08.000Z';
function base() {return {version:3,target:10,mode:M.MODE_INTERVALS,selectedAthleteId:M.DEFAULT_ATHLETE_ID,athletes:[M.defaultAthlete()],sessions:[],archived:[]};}
test('two modes: best of mixed attempts uses only total time',()=>{
 const s=M.createSession(10,t0);s.exercises.push(M.createExercise(Array(10).fill(1200),t0,t1));
 s.exercises.push(M.createStopwatchExercise(11345,t0,t1));
 assert.equal(M.exerciseTotal(s.exercises[0]),12000);
 assert.equal(M.exerciseTotal(s.exercises[1]),11345);
 assert.equal(M.bestTotal(s),11345);
 assert.equal(s.exercises[1].intervals.length,0);
 const data=M.validateStore({...base(),sessions:[s]});
 assert.equal(data.sessions[0].exercises[1].mode,M.MODE_STOPWATCH);
 assert.equal(data.sessions[0].exercises[1].totalMs,11345);
});
test('pending pair not treated as historical best',()=>{
 const s=M.createSession(10,t0);s.exercises.push(M.createStopwatchExercise(1101,t0,t1));
 assert.equal(M.bestTotal(s),null);
});
test('manual archive date and best-only record validated without fake attempts',()=>{
 const a=M.createArchived(M.DEFAULT_ATHLETE_ID,'2026-10-17',13789);
 const output=M.validateStore({...base(),archived:[a]});
 assert.deepEqual(output.archived[0],a);
 assert.equal(output.sessions.length,0);
 for(const d of ['2026-02-30','2026-13-01','17-10-2026','2026-2-1',''])assert.equal(M.validDate(d),false);
 assert.throws(()=>M.createArchived(M.DEFAULT_ATHLETE_ID,'2026-02-30',3000));
 assert.throws(()=>M.createArchived(M.DEFAULT_ATHLETE_ID,'2026-10-17',-1));
 assert.throws(()=>M.validateStore({...base(),archived:[{...a,athleteId:'unknown'}]}));
});
test('old version2 records migrate preserving intervals, athletes and pending pairs',()=>{
 const athlete=M.createAthlete('Андрей');const s=M.createSession(2,t0,athlete.id);
 const e=M.createExercise([1245,1536],t0,t1);delete e.mode;delete e.totalMs;s.exercises=[e];
 const old={version:2,target:2,athletes:[M.defaultAthlete(),athlete],selectedAthleteId:athlete.id,sessions:[s]};
 const migrated=M.validateStore(old);
 assert.equal(migrated.version,4);assert.equal(migrated.mode,M.MODE_INTERVALS);
 assert.equal(migrated.sessions[0].exercises.length,1);
 assert.deepEqual(migrated.sessions[0].exercises[0].intervals,[1245,1536]);
 assert.equal(migrated.sessions[0].exercises[0].totalMs,2781);
 assert.deepEqual(migrated.archived,[]);
 assert.deepEqual(M.validateStore(migrated),migrated);
});
test('backup import merges archive and mixed-mode pair without duplication',()=>{
 const local=base();const archive=M.createArchived(M.DEFAULT_ATHLETE_ID,'2026-10-17',14000);
 const s=M.createSession(10,t0);s.exercises.push(M.createStopwatchExercise(1101,t0,t1));
 const incoming={...base(),mode:M.MODE_STOPWATCH,archived:[archive],sessions:[s]};
 const first=M.mergeStores(local,incoming);
 assert.equal(first.added,1);assert.equal(first.archivedAdded,1);
 assert.equal(first.data.mode,M.MODE_INTERVALS);
 assert.equal(M.mergeStores(first.data,incoming).archivedAdded,0);
 assert.equal(M.mergeStores(first.data,incoming).added,0);
 assert.throws(()=>M.mergeStores(first.data,{...incoming,archived:[{...archive,bestMs:18000}]}));
 const finished={...s,exercises:[...s.exercises,M.createExercise(Array(10).fill(1200),t0,t1)]};
 const upgraded=M.mergeStores(first.data,{...incoming,sessions:[finished]});
 assert.equal(upgraded.data.sessions[0].exercises.length,2);
 assert.equal(M.bestTotal(upgraded.data.sessions[0]),1101);
});
test('tampered data rejected: total cannot disagree with intervals',()=>{
 const s=M.createSession(2,t0);const e=M.createExercise([2001,2202],t0,t1);s.exercises=[{...e,totalMs:1}];
 assert.throws(()=>M.validateStore({...base(),sessions:[s]}));
 assert.throws(()=>M.createStopwatchExercise(999,t0,t1));
 assert.throws(()=>M.validateStore({...base(),mode:'unknown'}));
});
