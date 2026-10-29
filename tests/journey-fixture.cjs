// Legal fixed build policy using real starting funds/income and the supplied unlock snapshot.
const F=require('../dist/model.js');
function playJourney(stageId,progress,options={}){
 const g=new F.Game(stageId,progress),limit=options.limit||6;
 const roster=(options.roster||[0,1,4,2,3,0]).filter(type=>F.towerUnlocked(progress,type));
 const pads=g.pads.map((p,i)=>({i,score:g.routes.reduce((sum,route)=>{
  for(let d=0;d<F.pathLength(route);d+=20){const q=F.position(d,route);if(Math.hypot(q.x-p[0],q.y-p[1])<210)sum+=20;}return sum;
 },0)})).sort((a,b)=>b.score-a.score);
 function buy(){
  if(options.stopWave&&g.wave>=options.stopWave)return;
  if(g.towers.length<limit){const type=roster[g.towers.length%roster.length];if(g.gold>=F.TOWERS[type].cost){g.build(pads[g.towers.length].i,type);return;}}
  for(const t of g.towers.filter(t=>!F.finalForm(t)).sort((a,b)=>a.level-b.level)){
   const branch=options.branches?.[t.type]??0;
   if(!g.upgradeReason(t,branch)){g.upgrade(t,branch);break;}
  }
 }
 for(let i=0;i<30;i++)buy();g.startWave();
 for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++){if(g.pendingBlessing)g.chooseBlessing('skip');if(i%20===0)buy();g.step(.05);g.drain();}
 return g;
}
module.exports={playJourney};
