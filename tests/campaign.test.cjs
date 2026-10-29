const assert=require('node:assert/strict');
const F=require('../dist/model.js');
const {gapToRoute}=require('../dist/stages.js');
assert.equal(F.STAGES.length,12);assert.equal(F.CHAPTERS.length,4);
assert.equal(new Set(F.STAGES.map(s=>JSON.stringify(s.routes))).size,12);
assert.equal(new Set(F.STAGES.map(s=>JSON.stringify(s.waves))).size,12);
for(let chapter=0;chapter<4;chapter++)assert.equal(F.STAGES.filter(s=>s.chapter===chapter).length,3);
for(const stage of F.STAGES){
 assert.ok(stage.pads.length>=6);
 for(const route of stage.routes){
  assert.deepEqual(route.at(-1),[1170,298]);
  for(let i=1;i<route.length;i++){
   const a=route[i-1],b=route[i];assert.notDeepEqual(a,b);
   assert.ok(a[0]===b[0]||a[1]===b[1],`diagonal in stage ${stage.number}`);
  }
  const start=F.position(0,route),end=F.position(F.pathLength(route),route);
  assert.deepEqual(start,{x:route[0][0],y:route[0][1]});assert.deepEqual(end,{x:1170,y:298});
 }
 for(const [x,y]of stage.pads){assert.ok(x>=50&&x<=1230&&y>=70&&y<=400);assert.ok(gapToRoute(x,y,stage.routes)>=50);}
 for(const wave of stage.waves){assert.ok(wave.length);for(const[type,count,gap]of wave){assert.ok(F.ENEMIES[type]);assert.ok(count>0&&gap>0);}}
}
assert.throws(()=>new F.Game(-1),RangeError);assert.throws(()=>new F.Game(12),RangeError);
// Two entrances alternate while targeting uses remaining path length, not raw distance.
{
 const g=new F.Game(1);g.gold=1000;const t=g.build(0,0).tower;g.startWave();assert.deepEqual(g.queue.slice(0,4).map(q=>q.routeIndex),[0,1,0,1]);
 g.queue=[{type:0,time:999}];g.spawn(0,0);g.spawn(0,1);
 g.enemies.forEach((e,i)=>Object.assign(e,{speed:0,distance:i?50:100},F.position(i?50:100,g.routes[i])));
 g.step(.01);assert.equal(g.shots[0].target,g.enemies[1].id);assert.equal(t.cooldown,F.stats(t).interval);
}
{
 const g=new F.Game(6);g.wave=1;g.spawn(5);const e=g.enemies[0],hp=e.hp,shield=e.shield;
 g.hit(e,shield-10);assert.equal(e.hp,hp);assert.equal(e.shield,10);
 g.hit(e,30);assert.equal(e.hp,hp-20);assert.equal(e.shield,0);
}
// A fixed, legal build/upgrade policy must win every authored stage using actual income.
function play(stageId){
 const game=new F.Game(stageId),types=[0,1,4,2,3,5];
 const pads=game.pads.map((p,i)=>({i,score:game.routes.reduce((sum,route)=>{
  let coverage=0;const length=F.pathLength(route);
  for(let d=0;d<length;d+=20){const q=F.position(d,route);if(Math.hypot(q.x-p[0],q.y-p[1])<210)coverage+=20;}
  return sum+coverage;
 },0)})).sort((a,b)=>b.score-a.score);
 function buy(){
  if(game.towers.length<6){const i=game.towers.length,type=types[i];if(game.gold>=F.TOWERS[type].cost){assert.equal(game.build(pads[i].i,type).ok,true);return;}}
  for(const t of game.towers.filter(t=>!F.finalForm(t)).sort((a,b)=>a.level-b.level))if(!game.upgradeReason(t,0)){assert.equal(game.upgrade(t,t.type===5?undefined:0).ok,true);break;}
 }
 for(let i=0;i<30;i++)buy();game.startWave();
 for(let i=0;i<50000&&!['won','lost'].includes(game.phase);i++){if(i%20===0)buy();game.step(.05);game.drain();assert.ok(game.gold>=0);}
 assert.equal(game.phase,'won',`stage ${stageId+1}`);assert.equal(game.wave,game.waves.length);assert.equal(game.enemies.length,0);
 return game;
}
let progress=F.emptyProgress();
for(const stage of F.STAGES){
 const winner=play(stage.id);progress=F.settle(winner,progress);assert.ok(progress.stars[stage.id]>0);
 const undefended=new F.Game(stage.id);undefended.startWave();
 for(let i=0;i<50000&&!['won','lost'].includes(undefended.phase);i++){undefended.step(.05);undefended.drain();}
 assert.equal(undefended.phase,'lost',`defeat in stage ${stage.number}`);
 assert.deepEqual(F.settle(undefended,progress),progress); // defeats never erase records
}
assert.equal(progress.stars.filter(n=>n>0).length,12);
assert.deepEqual(F.readProgress(JSON.parse(JSON.stringify(progress))),progress);
assert.deepEqual(F.readProgress({version:2,stars:[3]}),F.emptyProgress());
assert.deepEqual(F.readProgress({version:1,stars:[999,-1,'3',NaN]}).stars.slice(0,4),[0,0,0,0]);
console.log('PASS: 12 distinct stages, 4 chapters, orthogonal routes/platforms, dual entrances/priority, shields, normal-economy full victories, defeats and best-star records');
