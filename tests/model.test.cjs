const assert=require('node:assert/strict');const F=require('../dist/model.js');
// The movement model carries distance through right-angle corners.
let p=F.position(270+150+20);assert.equal(p.x,385);assert.equal(p.y,78);
// Failed economy actions leave gold and placements unchanged.
let g=new F.Game;let t=g.build(0,0).tower;assert.equal(g.gold,240);assert.equal(g.build(0,1).ok,false);assert.equal(g.gold,240);assert.equal(g.upgrade(t).ok,false);assert.equal(t.level,1);assert.equal(g.upgrade(t,1).ok,true);assert.equal(t.branch,1);assert.equal(t.level,2);assert.equal(F.variant(t),2);
let before=g.gold;g.gold=0;assert.equal(g.upgrade(t).ok,false);assert.equal(t.level,2);g.gold=before;
assert.equal(g.sell(t),true);assert.equal(g.gold,before+Math.floor(t.spent*.7));assert.equal(g.sell(t),false);
// Stop at six even though the map offers seven placements.
g=new F.Game;g.gold=99999;for(let i=0;i<6;i++)assert.equal(g.build(i,i%2).ok,true);assert.equal(g.build(6,0).reason,'本場最多建造 6 座塔');
// Pause freezes damage/movement/time; speed is part of simulation, not renderer.
g.startWave();g.step(.5);const snapshot=JSON.stringify({time:g.time,queue:g.queue,enemies:g.enemies,gold:g.gold});g.paused=true;g.step(4);assert.equal(JSON.stringify({time:g.time,queue:g.queue,enemies:g.enemies,gold:g.gold}),snapshot);
// Projectiles resolve after flight. Splash damages all living units in the radius.
g=new F.Game;g.phase='combat';g.wave=1;g.waveTime=0;g.queue=[{type:0,time:999}];g.spawn(0);g.spawn(0);g.enemies.forEach(e=>Object.assign(e,{x:100,y:228,distance:5,speed:0}));g.shots.push({time:0,duration:.1,type:1,tx:100,ty:228,stats:{damage:20,splash:64,burn:0}});g.step(.05);assert.equal(g.enemies[0].hp,82);g.step(.05);assert.equal(g.enemies[0].hp,62);assert.equal(g.enemies[1].hp,62);
// Full loss and full victory are reachable; no empty-wave lock or restart leakage.
g=new F.Game;g.startWave();for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++)g.step(.05);assert.equal(g.phase,'lost');
g=new F.Game;g.gold=99999;for(const [i,type,b]of [[0,0,0],[1,1,0],[2,0,1],[3,1,1],[5,0,0],[6,1,0]]){const t=g.build(i,type).tower;g.upgrade(t,b);while(t.level<5)g.upgrade(t);assert.ok(F.stats(t).range>0);}g.startWave();for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++)g.step(.05);assert.equal(g.phase,'won');assert.equal(g.wave,8);assert.equal(g.enemies.length,0);
console.log('PASS: route corners, failed purchases, branching, refunds, six-tower cap, pause, splash timing, defeat and eight-wave victory');

// Every guardian has its own progression, including the two-form branchless meteor.
assert.equal(F.TOWERS.length,6);
for(let type=0;type<6;type++)for(const branch of F.TOWERS[type].branches.length?[0,1]:[undefined]){
 const game=new F.Game;game.gold=99999;const tower=game.build(0,type).tower;
 if(type!==5)assert.equal(game.upgrade(tower).ok,false);
 assert.equal(game.upgrade(tower,branch).ok,true);
 while(!F.finalForm(tower))assert.equal(game.upgrade(tower).ok,true);
 assert.equal(tower.level,F.TOWERS[type].maxLevel);
 assert.equal(F.variant(tower),type===5?1:3+branch);
 const gold=game.gold;assert.equal(game.upgrade(tower).ok,false);assert.equal(game.gold,gold);
 if(type===5)assert.equal(tower.branch,-1);
}
function fixture(type,branch=-1){
 const game=new F.Game;game.gold=99999;game.auto=false;
 const tower=game.build(0,type).tower;if(branch>=0)game.upgrade(tower,branch);
 game.phase='combat';game.wave=1;game.waveTime=0;game.queue=[{type:0,time:999}];
 return{game,tower};
}
function enemy(game,distance,hp=10000,type=0){game.spawn(type);const e=game.enemies.at(-1);Object.assign(e,{distance,...F.position(distance),hp,maxHp:hp,speed:0});return e;}
function advance(game,seconds){for(let i=0;i<Math.round(seconds/.01);i++)game.step(.01);}
// Ice actually slows movement, does not multiply stacked slows, and freezes each fourth shot.
{
 const{game,tower}=fixture(2,1);const e=enemy(game,150);advance(game,.5);
 assert.equal(e.slow,.35);assert.ok(e.slowTime>0);assert.equal(e.freezeTime,0);
 tower.cooldown=100;e.speed=100;const d=e.distance;game.step(.1);assert.ok(Math.abs(e.distance-d-6.5)<1e-8);
 e.speed=0;tower.attacks=3;tower.cooldown=0;advance(game,.45);assert.ok(e.freezeTime>.9);
 const d2=e.distance;e.speed=100;game.step(.1);assert.equal(e.distance,d2);
 const boss=enemy(game,150,10000,3);e.hp=0;tower.cooldown=0;tower.attacks=3;advance(game,.45);assert.ok(boss.freezeTime>0&&boss.freezeTime<=.35);
}
{
 const{game}=fixture(2,0);const a=enemy(game,150),b=enemy(game,165);advance(game,.5);
 assert.equal(a.slow,.4);assert.equal(b.slow,.4);
}
// Chain damage falls off, visits each enemy only once and stops at its jump radius.
{
 const{game,tower}=fixture(3,0);const enemies=[150,170,190,210,230,250].map(d=>enemy(game,d));
 const far=enemy(game,900);advance(game,.1);const damage=F.stats(tower).damage;
 enemies.slice().reverse().forEach((e,i)=>assert.ok(Math.abs(10000-e.hp-damage*.8**i)<1e-7));
 assert.equal(far.hp,10000);assert.equal(game.drain().filter(e=>e.type==='chain')[0].points.length,7);
}
// Beam ramps on one target, resets on retarget/upgrade/range exit and respects pause.
{
 const{game,tower}=fixture(4,0);const e=enemy(game,150);advance(game,.5);const first=10000-e.hp;
 const hp=e.hp;advance(game,.5);assert.ok(hp-e.hp>first);assert.equal(tower.targetId,e.id);
 const t=game.time;game.paused=true;const charge=tower.charge,h=e.hp;game.step(1);assert.equal(game.time,t);assert.equal(e.hp,h);assert.equal(tower.charge,charge);game.paused=false;
 const next=enemy(game,160,20000);advance(game,.01);assert.equal(tower.targetId,e.id); // sticky lock
 e.hp=0;advance(game,.01);assert.equal(tower.targetId,next.id);assert.ok(tower.charge<.02);
 game.upgrade(tower);assert.equal(tower.targetId,null);assert.equal(tower.charge,0);
 next.distance=1000;Object.assign(next,F.position(1000));advance(game,.01);assert.equal(tower.targetId,null);assert.equal(tower.charge,0);
}
// Meteor lands after a delay, hits multiple enemies and can miss enemies that leave the area.
{
 const{game,tower}=fixture(5);const a=enemy(game,150),b=enemy(game,170);advance(game,.5);assert.equal(a.hp,10000);
 advance(game,.4);assert.equal(a.hp,10000-F.stats(tower).damage);assert.equal(b.hp,a.hp);
 tower.cooldown=0;advance(game,.01);a.distance=900;Object.assign(a,F.position(900));const hp=a.hp;advance(game,.9);assert.equal(a.hp,hp);assert.ok(b.hp<10000-F.stats(tower).damage);
}
// Six distinct guardians can fight through the existing eight-wave stage together.
g=new F.Game;g.gold=99999;for(let type=0;type<6;type++){const tower=g.build(type,type).tower;g.upgrade(tower,type===5?undefined:0);while(!F.finalForm(tower))g.upgrade(tower);}g.startWave();
for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++)g.step(.05);
assert.equal(g.phase,'won');assert.equal(g.wave,8);
console.log('PASS: six guardians, all evolution forms, ice slow/freeze, chain falloff/radius, beam lock/ramp/reset, meteor delay/splash and six-tower victory');
