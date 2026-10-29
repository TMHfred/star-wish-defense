const assert=require('node:assert/strict');
const F=require('../dist/model.js');
const{playJourney}=require('./journey-fixture.cjs');
// New edition starts empty and never interprets old star counts as new achievements.
assert.equal(F.PROGRESS_KEY,'starwish-journey-v2');
assert.deepEqual(F.readProgress({version:1,stars:Array(12).fill(3)}),F.emptyProgress());
assert.deepEqual(F.readProgress({version:99,goals:Array(12).fill([true,true,true])}),F.emptyProgress());
const corrupted=F.readProgress({version:2,goals:[[false,true,true],[true,'true',true]],stars:[999],castleStyle:'star',titleId:'complete',trialWon:true});
assert.deepEqual(corrupted.goals[0],[false,false,false]);assert.deepEqual(corrupted.goals[1],[true,false,true]);
assert.equal(corrupted.stars[1],2);assert.equal(corrupted.castleStyle,'forest');assert.equal(corrupted.titleId,'rookie');assert.equal(corrupted.trialWon,false);
// Independent bits merge across runs; a worse result and defeat never erase a star.
{
 const g=new F.Game;g.phase='won';g.hp=15;const first=F.settle(g,F.emptyProgress());
 assert.deepEqual(first.goals[0],[true,false,true]);assert.equal(first.stars[0],2);
 g.hp=16;g.metrics.sales=1;const second=F.settle(g,first);assert.deepEqual(F.earnedGoals(g),[true,true,false]);assert.deepEqual(second.goals[0],[true,true,true]);
 g.phase='lost';assert.deepEqual(F.settle(g,second),second);assert.equal(F.earnedStars(g),0);
 assert.deepEqual(F.readProgress(JSON.parse(JSON.stringify(second))),second);
}
// Model enforces stage, tower and final-form gates even if the UI is bypassed.
{
 let progress=F.emptyProgress();const g=new F.Game(0,progress);g.gold=99999;
 assert.throws(()=>new F.Game(1,progress),/前一關/);
 assert.equal(g.build(0,1).ok,false);assert.equal(g.build(0,5).ok,false);
 const t=g.build(0,0).tower;assert.equal(g.upgrade(t,0).ok,true);assert.equal(g.upgrade(t).ok,true);assert.equal(g.upgrade(t).ok,true);
 assert.equal(t.level,4);const gold=g.gold;assert.match(g.upgradeReason(t),/6 顆/);assert.equal(g.upgrade(t).ok,false);assert.equal(g.gold,gold);
 progress.goals[0]=[true,true,true];progress.goals[1]=[true,true,true];progress=F.readProgress(progress);
 assert.equal(F.finalUnlocked(progress,0),true);assert.equal(F.towerUnlocked(progress,1),true);assert.equal(F.towerUnlocked(progress,2),true);assert.equal(F.towerUnlocked(progress,3),false);
 const upgraded=new F.Game(0,progress);upgraded.gold=99999;const tower=upgraded.build(0,0).tower;upgraded.upgrade(tower,0);upgraded.upgrade(tower);upgraded.upgrade(tower);assert.equal(upgraded.upgrade(tower).ok,true);
}
// Cosmetics are earned, sanitized, and persisted separately from combat stats.
{
 const p=F.emptyProgress();p.goals=F.STAGES.map(()=>[true,true,true]);p.castleStyle='star';p.titleId='complete';
 const saved=F.readProgress(p);assert.equal(F.totalStars(saved),36);assert.equal(saved.castleStyle,'star');assert.equal(saved.titleId,'complete');
 assert.equal(F.towerUnlocked(saved,5),false);assert.equal(F.finalUnlocked(saved,5),false); // Stars never replace the trial.
 saved.trialWon=true;assert.equal(F.towerUnlocked(saved,5),true);assert.equal(F.finalUnlocked(saved,5),true);
 assert.deepEqual(F.stats({type:0,level:5,branch:0}),F.stats({type:0,level:5,branch:0,castleStyle:'star',titleId:'complete'}));
}
// A new player can clear all 12 stages with only unlocked towers, real funds and legal upgrades.
// Alternate fixed policies demonstrate every special star is attainable; stars can be earned in separate runs.
const alternates={1:{roster:[1,0,1,0]},3:{limit:4},8:{branches:{2:1}},9:{limit:5},10:{stopWave:9}};
let progress=F.emptyProgress();
for(let id=0;id<12;id++){
 const before=F.readProgress(progress),g=playJourney(id,before);
 assert.equal(g.phase,'won',`new-player stage ${id+1}`);assert.ok(g.gold>=0);
 for(const t of g.towers){assert.ok(F.towerUnlocked(before,t.type));if(F.finalForm(t))assert.ok(F.finalUnlocked(before,t.type));}
 const challenge=alternates[id]?playJourney(id,before,alternates[id]):g;
 assert.equal(challenge.phase,'won',`special stage ${id+1}`);assert.ok(F.challengeStatus(challenge).complete,`special stage ${id+1}`);
 const health=id===10?playJourney(id,before,{branches:{0:1}}):id===11?playJourney(id,before,{roster:[0,1,4,2,3,4]}):g;
 assert.equal(health.phase,'won');assert.ok(F.objectiveStatus(health)[1].complete,`80% health stage ${id+1}`);
 assert.equal(F.towerUnlocked(before,5),false);
 progress=F.settle(g,before);assert.ok(progress.goals[id][0]);
}
assert.ok(progress.goals.every(row=>row[0]));assert.equal(F.stageUnlocked(progress,11),true);
console.log('PASS: fresh v2 progress, independent star merge, old-save isolation, stage/tower/final gates, cosmetic sanitation, trial prerequisite and all 12 new-player victories plus all health/special goals with normal economy');
