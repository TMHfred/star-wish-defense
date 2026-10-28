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
