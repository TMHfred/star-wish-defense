(function(root){'use strict';
const {STAGES,CHAPTERS}=typeof module!=='undefined'?require('./stages.js'):root.ForestStages;
const ROUTE=STAGES[0].routes[0],PADS=STAGES[0].pads;
const TOWERS=[
{id:'bow',name:'弓箭塔',cost:80,damage:22,interval:.65,range:210,maxLevel:5,branches:['連射','狙擊'],forms:['弓箭塔','連射塔','狙擊塔','翠葉連射塔','月影狙擊塔'],desc:'精靈弓箭手守望林間，快速攔截最前方的敵人。'},
{id:'fire',name:'火焰塔',cost:120,damage:36,interval:1.5,range:195,maxLevel:5,branches:['爆炎','灼燒'],forms:['火焰塔','爆炎塔','灼燒塔','熾焰爆炎塔','煉火灼燒塔'],desc:'火球在落點爆開，適合處理聚集的敵人。'},
{id:'ice',name:'冰霜塔',cost:100,damage:14,interval:1,range:195,maxLevel:5,branches:['寒流','凍結'],forms:['冰霜塔','寒流塔','凍結塔','極寒風暴塔','永凍水晶塔'],desc:'冰彈減速敵人；寒流擴大影響範圍，凍結分支每四次攻擊冰封目標。'},
{id:'lightning',name:'雷電塔',cost:150,damage:30,interval:1.15,range:205,maxLevel:5,branches:['連鎖','雷擊'],forms:['雷電塔','連鎖塔','雷擊塔','雷霆連鎖塔','天罰雷擊塔'],desc:'閃電在相鄰敵人之間跳躍，每跳保留八成傷害，不會重複命中。'},
{id:'beam',name:'星輝塔',cost:180,damage:26,interval:.1,range:215,maxLevel:5,branches:['聚焦','輝耀'],forms:['星輝塔','聚焦塔','輝耀塔','日耀聚焦塔','星河輝耀塔'],desc:'持續鎖定敵人，照射越久傷害越高；切換目標時重新蓄能。'},
{id:'meteor',name:'星隕塔',cost:240,damage:145,interval:3.4,range:265,maxLevel:2,branches:[],forms:['召星祭壇','星隕聖殿'],desc:'召來隕石，在預告落點造成大範圍傷害。只有兩種型態，沒有分支。'}
];
const ENEMIES=[
{name:'森林史萊姆',art:0,hp:82,speed:55,gold:9,leak:1},
{name:'疾風菇菇',art:1,hp:65,speed:90,gold:10,leak:1},
{name:'岩甲獸',art:2,hp:230,speed:43,gold:18,leak:2},
{name:'森林守門者',art:5,hp:1450,speed:32,gold:90,leak:5,boss:true},
{name:'星夜斥候',art:4,hp:100,speed:110,gold:12,leak:1},
{name:'護盾巨像',art:3,hp:210,shield:110,speed:39,gold:24,leak:2},
{name:'遺跡石靈',art:6,hp:650,speed:34,gold:42,leak:3},
{name:'星門守護龍',art:7,hp:2600,speed:30,gold:140,leak:5,boss:true}
];
const WAVES=STAGES[0].waves;
function pathLength(route){return route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-route[i][0],p[1]-route[i][1]),0);}
const total=pathLength(ROUTE);
function position(d,route=ROUTE){d=Math.max(0,d);for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=length){const r=d/length;return{x:a[0]+(b[0]-a[0])*r,y:a[1]+(b[1]-a[1])*r};}d-=length;}const p=route.at(-1);return{x:p[0],y:p[1]};}
function emptyProgress(){return{version:1,stars:Array(STAGES.length).fill(0)};}
function readProgress(value){const clean=emptyProgress();if(value?.version!==1||!Array.isArray(value.stars))return clean;clean.stars=clean.stars.map((_,i)=>Number.isInteger(value.stars[i])?Math.max(0,Math.min(3,value.stars[i])):0);return clean;}
function earnedStars(game){return game.phase==='won'?(game.hp===20?3:game.hp>=10?2:1):0;}
function settle(game,progress){const clean=readProgress(progress);if(game.phase==='won')clean.stars[game.stageId]=Math.max(clean.stars[game.stageId],earnedStars(game));return clean;}
function stats(t){
 const d=TOWERS[t.type],l=t.level-1;
 let damage=d.damage*(1+l*.48),interval=d.interval,range=d.range+l*8;
 let splash=t.type===1?64:t.type===5?100:0,burn=0,slow=t.type===2?.35:0;
 let slowDuration=2,freeze=0,chain=t.type===3?3:0,chainRange=154,ramp=.5,cap=2;
 if(t.branch===0){
  if(t.type===0){interval*=.64;damage*=.82;}
  if(t.type===1){splash=82+l*4;damage*=1.2;}
  if(t.type===2){splash=85;slow=.4;}
  if(t.type===3)chain=6;
  if(t.type===4){ramp=.75;cap=3;}
 }
 if(t.branch===1){
  if(t.type===0){damage*=2.45;interval*=1.65;range+=70;}
  if(t.type===1){burn=8+l*5;splash=58;interval*=.9;}
  if(t.type===2){freeze=1;damage*=1.2;}
  if(t.type===3){damage*=2.2;chain=2;}
  if(t.type===4){range+=65;damage*=1.25;}
 }
 if(t.type===5&&t.level===2){damage*=1.6;splash=125;}
 return{damage,interval,range,splash,burn,slow,slowDuration,freeze,chain,chainRange,ramp,cap};
}
function variant(t){return t.type===5?(t.level>=2?1:0):t.branch<0?0:t.level>=5?3+t.branch:1+t.branch;}
function finalForm(t){return t.level>=TOWERS[t.type].maxLevel;}
function formTower(type,form){return{type,level:type===5?form+1:form===0?1:form>=3?5:2,branch:type===5||form===0?-1:(form-1)%2};}
function ability(t){const s=stats(t);switch(t.type){
 case 0:return t.branch===1?'優先攻擊最高血量目標；單箭傷害與射程提高。':'優先攻擊最前方敵人；連射分支提高攻擊速度。';
 case 1:return '爆炸半徑 '+Math.round(s.splash)+'；'+(s.burn?'每秒灼燒 '+s.burn+' 傷害，持續 3 秒。同類效果不疊加。':'爆炎分支擴大爆炸範圍。');
 case 2:return '緩速 '+Math.round(s.slow*100)+'%，持續 '+s.slowDuration+' 秒，取最強效果。'+(s.freeze?'每四次攻擊凍結 1 秒（頭目 0.35 秒）。':s.splash?'寒流影響落點周圍 '+s.splash+' 範圍。':'');
 case 3:return '最多連鎖 '+s.chain+' 個目標，跳躍距離 '+(s.chainRange/70).toFixed(1)+' 格，每跳保留 80% 傷害。';
 case 4:return '持續鎖定最高血量敵人，每秒增傷 '+Math.round(s.ramp*100)+'%，最高 '+(1+s.cap)+' 倍；換目標、離開射程或升級時重置。';
 case 5:return '隕石飛行 0.85 秒後在預告位置落下，爆炸半徑 '+s.splash+'；敵人可以移出落點。兩型態、無分支。';
}}
function upgradeCost(t){return finalForm(t)?0:Math.round(TOWERS[t.type].cost*(.65+t.level*.55));}
class Game{
constructor(stageId=0){if(!Number.isInteger(stageId)||!STAGES[stageId])throw new RangeError('找不到關卡');this.stageId=stageId;this.stage=STAGES[stageId];this.routes=this.stage.routes;this.pads=this.stage.pads;this.waves=this.stage.waves;this.routeLengths=this.routes.map(pathLength);this.gold=this.stage.startGold;this.hp=20;this.wave=0;this.kills=0;this.phase='prep';this.towers=[];this.enemies=[];this.shots=[];this.queue=[];this.time=0;this.id=0;this.events=[];this.countdown=0;this.auto=true;this.paused=false;this.speed=1;}
emit(type,data={}){this.events.push({type,...data});}
drain(){return this.events.splice(0);}
changed(){this.emit('state');}
reason(pad,type){if(!['prep','combat'].includes(this.phase))return'本場已結束';if(!this.pads[pad])return'請選擇建造平台';if(this.towers.some(t=>t.pad===pad))return'平台已有守護塔';if(this.towers.length>=6)return'本場最多建造 6 座塔';if(!TOWERS[type])return'請選擇守護塔';if(this.gold<TOWERS[type].cost)return'金幣不足，還差 '+(TOWERS[type].cost-this.gold);return'';}
build(pad,type){const reason=this.reason(pad,type);if(reason)return{ok:false,reason};const[x,y]=this.pads[pad],t={id:++this.id,pad,type,x,y,level:1,branch:-1,cooldown:0,attacks:0,targetId:null,charge:0,spent:TOWERS[type].cost};this.gold-=t.spent;this.towers.push(t);this.emit('build',{tower:t});this.changed();return{ok:true,tower:t};}
upgradeReason(t,branch){if(!t||!this.towers.includes(t))return'找不到守護塔';if(!['prep','combat'].includes(this.phase))return'本場已結束';if(finalForm(t))return'已達最高等級';if(t.level===1&&TOWERS[t.type].branches.length&&![0,1].includes(branch))return'請先選擇進化分支';if(this.gold<upgradeCost(t))return'金幣不足，還差 '+(upgradeCost(t)-this.gold);return'';}
upgrade(t,branch){const reason=this.upgradeReason(t,branch);if(reason)return{ok:false,reason};const cost=upgradeCost(t);this.gold-=cost;t.spent+=cost;if(t.level===1&&TOWERS[t.type].branches.length)t.branch=branch;t.level++;t.targetId=null;t.charge=0;this.emit('upgrade',{tower:t});this.changed();return{ok:true};}
sell(t){if(!this.towers.includes(t)||!['prep','combat'].includes(this.phase))return false;const gold=Math.floor(t.spent*.7);this.gold+=gold;this.towers=this.towers.filter(x=>x!==t);this.emit('sell',{tower:t,gold});this.changed();return true;}
startWave(){if(this.phase!=='prep'||this.wave>=this.waves.length)return false;this.wave++;this.phase='combat';this.countdown=0;let time=0;for(const[type,count,gap]of this.waves[this.wave-1])for(let i=0;i<count;i++){this.queue.push({type,time,routeIndex:this.queue.length%this.routes.length});time+=gap;}this.waveTime=0;this.emit('wave',{wave:this.wave});this.changed();return true;}
spawn(type,routeIndex=0){const def=ENEMIES[type],factor=(1+(this.wave-1)*.14)*this.stage.hpScale;const hp=Math.round(def.hp*factor);const e={id:++this.id,type,routeIndex,...position(0,this.routes[routeIndex]),distance:0,hp,maxHp:hp,shield:Math.round((def.shield||0)*factor),speed:def.speed,gold:def.gold,leak:def.leak,burn:0,burnTime:0,slow:0,slowTime:0,freezeTime:0};this.enemies.push(e);this.emit('spawn',{enemy:e});}
hit(e,damage){if(e.hp<=0)return;const absorbed=Math.min(e.shield||0,damage);e.shield=(e.shield||0)-absorbed;e.hp=Math.max(0,e.hp-(damage-absorbed));this.emit('hit',{enemy:e,damage});if(!e.hp){this.gold+=e.gold;this.kills++;this.emit('kill',{enemy:e,gold:e.gold});this.changed();}}
step(dt){if(this.paused||['won','lost'].includes(this.phase))return;dt*=this.speed;this.time+=dt;if(this.phase==='prep'){if(this.auto&&this.countdown>0){this.countdown-=dt;if(this.countdown<=0)this.startWave();}return;}
this.waveTime+=dt;while(this.queue.length&&this.queue[0].time<=this.waveTime){const next=this.queue.shift();this.spawn(next.type,next.routeIndex||0);};
for(const e of this.enemies){if(e.hp<=0)continue;if(e.burnTime>0){const tick=Math.min(dt,e.burnTime);e.burnTime-=tick;this.hit(e,e.burn*tick);}if(e.hp<=0)continue;const frozen=Math.min(dt,e.freezeTime||0);e.freezeTime=Math.max(0,(e.freezeTime||0)-dt);
const moving=dt-frozen,slowed=Math.min(moving,Math.max(0,(e.slowTime||0)-frozen));
e.distance+=e.speed*(moving-slowed*(e.slow||0));e.slowTime=Math.max(0,(e.slowTime||0)-dt);if(!e.slowTime)e.slow=0;Object.assign(e,position(e.distance,this.routes[e.routeIndex||0]));if(e.distance>=this.routeLengths[e.routeIndex||0]){e.hp=0;this.hp=Math.max(0,this.hp-e.leak);this.emit('leak',{enemy:e});this.changed();}}
for(const t of this.towers){
 const s=stats(t),candidates=this.enemies.filter(e=>e.hp>0&&Math.hypot(t.x-e.x,t.y-e.y)<=s.range)
 .sort((a,b)=>t.type===4||t.branch===1&&t.type===0?b.hp-a.hp:(this.routeLengths[a.routeIndex||0]-a.distance)-(this.routeLengths[b.routeIndex||0]-b.distance));
 if(t.type===4){
  let target=candidates.find(e=>e.id===t.targetId);
  if(!target){target=candidates[0];t.targetId=target?.id??null;t.charge=0;}
  if(target){this.hit(target,s.damage*(dt+Math.min(s.cap,t.charge+s.ramp*dt/2)*dt));t.charge=Math.min(s.cap,t.charge+s.ramp*dt);}
  continue;
 }
 t.cooldown-=dt;if(t.cooldown>0||!candidates.length)continue;
 const e=candidates[0];t.cooldown=s.interval;t.attacks++;
 const shot={id:++this.id,type:t.type,from:t.id,target:e.id,x:t.x,y:t.y-46,tx:e.x,ty:e.y,time:0,
 duration:t.type===0?.16:t.type===3?.08:t.type===5?.85:.42,stats:s,final:finalForm(t),branch:t.branch,freeze:s.freeze&&t.attacks%4===0};
 this.shots.push(shot);this.emit('fire',{tower:t,shot});
}
for(const shot of this.shots){
 shot.time+=dt;if(shot.time<shot.duration||shot.done)continue;shot.done=true;
 const target=this.enemies.find(e=>e.id===shot.target&&e.hp>0),s=shot.stats;
 if(shot.type===3){
  const points=[{x:shot.x,y:shot.y}],seen=new Set;let next=target,damage=s.damage;
  for(let jump=0;next&&jump<s.chain;jump++){
   seen.add(next.id);points.push({x:next.x,y:next.y-15});this.hit(next,damage);damage*=.8;
   const previous=next;next=this.enemies.filter(e=>e.hp>0&&!seen.has(e.id)&&Math.hypot(e.x-previous.x,e.y-previous.y)<=s.chainRange)
    .sort((a,b)=>Math.hypot(a.x-previous.x,a.y-previous.y)-Math.hypot(b.x-previous.x,b.y-previous.y)||a.id-b.id)[0];
  }
  this.emit('chain',{points});
 }else{
  const victims=s.splash?this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-shot.tx,e.y-shot.ty)<=s.splash):target?[target]:[];
  for(const e of victims){
   this.hit(e,s.damage);
   if(s.burn){e.burn=Math.max(e.burn,s.burn);e.burnTime=Math.max(e.burnTime,3);}
   if(s.slow){e.slow=Math.max(e.slow||0,s.slow);e.slowTime=Math.max(e.slowTime||0,s.slowDuration);}
   if(shot.freeze)e.freezeTime=Math.max(e.freezeTime||0,ENEMIES[e.type].boss?.35:s.freeze);
  }
 }
 this.emit('impact',{shot});
}
this.shots=this.shots.filter(s=>!s.done);this.enemies=this.enemies.filter(e=>e.hp>0);
if(this.hp<=0){this.phase='lost';this.emit('end',{won:false});this.changed();}else if(!this.queue.length&&!this.enemies.length&&!this.shots.length){this.gold+=35+this.wave*5;this.emit('clear',{wave:this.wave});if(this.wave===this.waves.length){this.phase='won';this.emit('end',{won:true});}else{this.phase='prep';this.countdown=4;}this.changed();}}
}
const api={Game,STAGES,CHAPTERS,emptyProgress,readProgress,earnedStars,settle,pathLength,TOWERS,ENEMIES,WAVES,ROUTE,PADS,stats,variant,finalForm,formTower,ability,upgradeCost,position,total};root.Forest=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
