const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');
const t0='2026-11-11T08:00:00Z', t1='2026-11-11T08:00:09Z';
function base(){return {version:4,target:10,mode:'intervals',athletes:[M.defaultAthlete()],selectedAthleteId:M.DEFAULT_ATHLETE_ID,sessions:[],archived:[],incomplete:[]};}
test('migration from v3 preserves records and marks pending vs completed without losing best times',()=>{
 const a=M.createSession(3,t0);a.exercises.push(M.createExercise([1100,1500,1200],t0,t1));
 const b=M.createSession(3,t0);b.exercises.push(M.createStopwatchExercise(2500,t0,t1),M.createStopwatchExercise(1900,t0,t1));
 delete a.status;delete b.status;
 const old={...base(),version:3,sessions:[a,b]};delete old.incomplete;
 const migrated=M.validateStore(old);
 assert.equal(migrated.version,4);assert.equal(migrated.incomplete.length,0);
 assert.equal(migrated.sessions[0].status,'pending');assert.equal(M.bestTotal(migrated.sessions[0]),null);
 assert.equal(migrated.sessions[1].status,'closed');assert.equal(M.bestTotal(migrated.sessions[1]),1900);
 assert.deepEqual(M.validateStore(migrated),migrated);
});
test('closed one-attempt series qualifies for history and comparisons, pending does not',()=>{
 const s=M.createSession(2,t0);s.exercises.push(M.createExercise([1100,1200],t0,t1));
 assert.equal(M.bestTotal(s),null);
 s.status='closed';assert.equal(M.bestTotal(s),2300);
 const normalized=M.validateStore({...base(),sessions:[s]});assert.equal(normalized.sessions[0].status,'closed');
 const pending=M.createSession(2,'2026-11-12T08:00:00Z');pending.exercises.push(M.createExercise([1400,1500],t0,t1));
 assert.equal(M.findBaseline([s,pending],pending).id,s.id);
 assert.throws(()=>M.validateStore({...base(),sessions:[{...s,status:'incorrect'}]}));
 assert.throws(()=>M.validateStore({...base(),sessions:[{...s,exercises:[...s.exercises,s.exercises[0]],status:'pending'}]}));
});
test('incomplete attempt stores real partial elapsed, never scores a best and validates bounds',()=>{
 const p=M.createIncomplete(M.DEFAULT_ATHLETE_ID,10,[1100,1300],2700,t0,t1);
 assert.equal(p.status,'incomplete');assert.equal(p.elapsedMs,2700);
 const normalized=M.validateStore({...base(),incomplete:[p]});
 assert.deepEqual(normalized.incomplete[0],p);
 assert.equal(normalized.sessions.length,0);
 assert.throws(()=>M.createIncomplete(M.DEFAULT_ATHLETE_ID,2,[1100,1300],2700,t0,t1));
 assert.throws(()=>M.validateStore({...base(),incomplete:[{...p,elapsedMs:100}]}));
 assert.throws(()=>M.validateStore({...base(),incomplete:[{...p,mode:'stopwatch'}]}));
 assert.throws(()=>M.validateStore({...base(),incomplete:[{...p,athleteId:'unknown'}]}));
});
test('imports incomplete and one-attempt-closed status with monotonic finish; detects collisions',()=>{
 const a=M.createSession(2,t0);a.exercises.push(M.createExercise([1200,1400],t0,t1));
 const p=M.createIncomplete(M.DEFAULT_ATHLETE_ID,2,[1200],1500,t0,t1);
 const local={...base(),sessions:[a]};const imported={...base(),sessions:[{...a,status:'closed'}],incomplete:[p]};
 const merged=M.mergeStores(local,imported);assert.equal(merged.data.sessions[0].status,'closed');assert.equal(merged.incompleteAdded,1);
 const back=M.mergeStores(merged.data,local);assert.equal(back.data.sessions[0].status,'closed');
 assert.equal(M.mergeStores(merged.data,imported).incompleteAdded,0);
 assert.throws(()=>M.mergeStores(merged.data,{...imported,incomplete:[{...p,elapsedMs:1800}]}));
 assert.throws(()=>M.validateStore({...base(),sessions:[a],incomplete:[{...p,id:a.id}]}));
});
test('delete each record type only for its owner while leaving other athlete unaffected',()=>{
 const athlete=M.createAthlete('Второй');
 const s=M.createSession(2,t0);s.exercises.push(M.createExercise([1200,1300],t0,t1));s.status='closed';
 const s2=M.createSession(2,t0,athlete.id);s2.exercises.push(M.createExercise([1400,1300],t0,t1));s2.status='closed';
 const a=M.createArchived(M.DEFAULT_ATHLETE_ID,'2026-10-08',3200);
 const p=M.createIncomplete(M.DEFAULT_ATHLETE_ID,2,[],300,t0,t1);
 const data={...base(),athletes:[M.defaultAthlete(),athlete],sessions:[s,s2],archived:[a],incomplete:[p]};
 assert.throws(()=>M.deleteRecord(data,athlete.id,'session',s.id));
 let next=M.deleteRecord(data,M.DEFAULT_ATHLETE_ID,'session',s.id);
 assert.deepEqual(next.sessions.map(x=>x.id),[s2.id]);
 next=M.deleteRecord(next,M.DEFAULT_ATHLETE_ID,'archive',a.id);
 next=M.deleteRecord(next,M.DEFAULT_ATHLETE_ID,'incomplete',p.id);
 assert.equal(next.sessions.length,1);assert.equal(next.archived.length,0);assert.equal(next.incomplete.length,0);
 assert.equal(data.sessions.length,2,'delete returns a new validated state');
 assert.throws(()=>M.deleteRecord(next,M.DEFAULT_ATHLETE_ID,'archive',a.id));
});
