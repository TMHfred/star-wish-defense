const assert=require('node:assert/strict');
const F=require('../dist/model.js');
function trialProgress(){const p=F.emptyProgress();p.goals=p.goals.map((_,i)=>[i<9,false,false]);return F.readProgress(p);}
function advance(g){for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++){g.step(.05);g.drain();}return g;}
// Entry requires stage nine, and the altar is a protected loan outside the support limit.
assert.throws(()=>new F.Game(F.TRIAL.id,F.emptyProgress()),/第九關/);
{
 const p=trialProgress(),g=new F.Game(F.TRIAL.id,p),altar=g.towers[0],gold=g.gold;
 assert.equal(altar.borrowed,true);assert.equal(altar.spent,0);assert.equal(g.regularTowerCount(),0);
 assert.equal(g.sell(altar),false);assert.equal(g.upgrade(altar).ok,false);assert.equal(g.gold,gold);
 assert.equal(g.build(0,0).ok,false);assert.equal(g.build(0,5).ok,false);
 for(const pad of [0,2]){const t=g.build(pad,2).tower;assert.equal(g.upgrade(t,0).ok,true);assert.equal(g.upgrade(t).ok,false);}
 assert.equal(g.towers.length,3);assert.equal(g.regularTowerCount(),2);assert.equal(g.build(1,2).ok,false);
 assert.equal(g.gold,10);g.startWave();advance(g);
 assert.equal(g.phase,'won');assert.ok(g.hp>0);assert.ok(F.trialStatus(g).met);assert.equal(g.blessingsOffered,0);
 const saved=F.settle(g,p);assert.equal(saved.trialWon,true);assert.deepEqual(saved.goals,p.goals);assert.deepEqual(saved.stars,p.stars);
 const normal=new F.Game(9,saved);assert.equal(normal.build(0,5).ok,true);assert.equal(normal.upgrade(normal.towers[0]).ok,false); // still needs 30 stars
 const noIce=new F.Game(F.TRIAL.id,p);noIce.startWave();advance(noIce);
 assert.equal(noIce.phase,'lost');assert.equal(noIce.metrics.meteorSlowHits,0);assert.ok(noIce.hp>0); // merely surviving is insufficient
 assert.equal(F.settle(noIce,p).trialWon,false);assert.equal(F.settle(noIce,saved).trialWon,true);
 noIce.phase='won';assert.equal(F.settle(noIce,p).trialWon,false); // settlement validates the teaching goal too
}
// Parent death queues one split; children share the lane, do not move early or split recursively.
function combat(stageId=1){const g=new F.Game(stageId);g.phase='combat';g.wave=1;g.waveTime=0;g.queue=[{type:0,time:999}];return g;}
{
 const g=combat(),gold=g.gold,parent=g.spawn(8,1,{distance:100});parent.speed=0;
 g.hit(parent,99999,1);g.hit(parent,99999,1);assert.equal(g.pendingSplits.length,1);assert.equal(g.gold,gold+6);
 g.step(.01);const children=g.enemies;
 assert.equal(children.length,2);assert.ok(children.every(e=>e.type===9&&e.routeIndex===1&&e.splitFrom===parent.id));
 assert.deepEqual(children.map(e=>e.distance),[82,118]);
 for(const child of children){assert.deepEqual({x:child.x,y:child.y},F.position(child.distance,g.routes[1]));g.hit(child,99999,1);}
 g.step(.01);assert.equal(g.enemies.length,0);assert.equal(g.pendingSplits.length,0);assert.equal(g.gold,gold+12);
 assert.equal(g.metrics.killsByType[1],3);
}
{
 const g=combat(),gold=g.gold,parent=g.spawn(8,0,{distance:g.routeLengths[0]-.01});g.step(.1);
 assert.equal(g.hp,18);assert.equal(g.enemies.length,0);assert.equal(g.pendingSplits.length,0);assert.equal(g.gold,gold);
}
{
 const g=combat(),p=g.spawn(8,0,{distance:200});p.speed=0;p.hp=1;
 g.shots.push({type:1,target:p.id,time:0,duration:.01,tx:p.x,ty:p.y,stats:{damage:9999,splash:100,burn:0,slow:0}});
 g.step(.01);assert.equal(g.enemies.length,2);assert.ok(g.enemies.every(e=>e.hp>0)); // same explosion does not retroactively hit newly born children
}
// The model, not just the modal, freezes time and next-wave requests while choosing.
function offer(g,wave){g.phase='combat';g.wave=wave;g.waveTime=0;g.queue=[];g.enemies=[];g.shots=[];g.step(.01);return g.pendingBlessing;}
{
 const g=new F.Game(0,F.emptyProgress());const pending=offer(g,3),base=F.stats({type:0,level:1,branch:-1});
 assert.equal(pending.options.length,3);assert.equal(new Set(pending.options).size,3);
 assert.ok(!pending.options.includes('frost'));const time=g.time;g.step(50);assert.equal(g.time,time);assert.equal(g.startWave(),false);
 assert.equal(g.chooseBlessing('not-an-option').ok,false);assert.ok(g.pendingBlessing);
 assert.equal(g.chooseBlessing('volley').ok,true);assert.ok(Math.abs(g.stats({type:0,level:1,branch:-1}).interval-base.interval*.9)<1e-9);
 assert.equal(F.stats({type:0,level:1,branch:-1}).interval,base.interval);
 g.hp=16;assert.ok(offer(g,6).options.includes('repair'));g.chooseBlessing('repair');assert.equal(g.hp,20);
 assert.equal(g.blessings.length,2);assert.equal(g.blessingsOffered,2);assert.equal(offer(g,7),null);
 g.phase='won';const saved=F.settle(g,F.emptyProgress());assert.equal(saved.goals[0][1],true);assert.equal(Object.hasOwn(saved,'blessings'),false);
 const restart=new F.Game(0,saved);assert.deepEqual(restart.blessings,[]);assert.equal(restart.stats({type:0,level:1,branch:-1}).interval,base.interval);
}
{
 const g=new F.Game(0,trialProgress()),ice={type:2,level:2,branch:0};offer(g,3);assert.ok(g.pendingBlessing.options.includes('frost'));
 const old=g.stats(ice);g.chooseBlessing('frost');assert.equal(g.stats(ice).slowDuration,old.slowDuration+.5);assert.equal(g.stats(ice).freeze,old.freeze);
 assert.ok(!offer(g,6).options.includes('frost'));const money=g.gold;g.chooseBlessing('gold');assert.equal(g.gold,money+100);
}
{
 const g=new F.Game(0,F.emptyProgress()),bow={type:0,level:1,branch:-1};offer(g,3);g.chooseBlessing('volley');offer(g,6);g.chooseBlessing('volley');
 assert.ok(Math.abs(g.stats(bow).interval-F.stats(bow).interval*.81)<1e-9);assert.equal(g.blessingCount('volley'),2);
 const range=new F.Game(0,F.emptyProgress());offer(range,3);range.chooseBlessing('sight');assert.equal(range.stats(bow).range,F.stats(bow).range*1.05);
 const skip=new F.Game(0,F.emptyProgress());offer(skip,3);skip.chooseBlessing('skip');assert.deepEqual(skip.blessings,[]);assert.equal(skip.pendingBlessing,null);assert.equal(skip.countdown,4);
}
console.log('PASS: gated normal-resource trial, protected altar, slow/meteor teaching and permanent unlock, split lanes/timing/fixed rewards/no recursion, wave-3/6 pause/choice/caps/skip, scoped stat buffs, repair goal and reset isolation');
