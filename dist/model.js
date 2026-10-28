(function(root){'use strict';
const ROUTE=[[95,228],[365,228],[365,78],[795,78],[795,298],[1170,298]];
const PADS=[[255,125],[485,205],[660,205],[925,178],[260,355],[485,355],[1000,355]];
const TOWERS=[{id:'bow',name:'弓箭塔',cost:80,damage:22,interval:.65,range:210,branches:['連射','狙擊'],desc:'精靈弓箭手守望林間，快速攔截最前方的敵人。'},{id:'fire',name:'火焰塔',cost:120,damage:36,interval:1.5,range:195,branches:['爆炎','灼燒'],desc:'火球在落點爆開，適合處理聚集的敵人。'}];
const ENEMIES=[{name:'森林史萊姆',art:0,hp:82,speed:55,gold:9,leak:1},{name:'疾風菇菇',art:1,hp:65,speed:90,gold:10,leak:1},{name:'岩甲獸',art:2,hp:230,speed:43,gold:18,leak:2},{name:'森林守門者',art:5,hp:1450,speed:32,gold:90,leak:5}];
const WAVES=[[[0,8,.85]],[[0,8,.65],[1,4,.7]],[[1,10,.6]],[[0,12,.5],[2,3,1.4]],[[2,7,1.1],[1,6,.5]],[[0,15,.4],[1,8,.5]],[[2,10,.9]],[[0,10,.6],[2,5,1],[3,1,1]]];
const lengths=ROUTE.slice(1).map((p,i)=>Math.hypot(p[0]-ROUTE[i][0],p[1]-ROUTE[i][1]));const total=lengths.reduce((a,b)=>a+b,0);
function position(d){d=Math.max(0,d);for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const a=ROUTE[i],b=ROUTE[i+1],r=d/lengths[i];return {x:a[0]+(b[0]-a[0])*r,y:a[1]+(b[1]-a[1])*r}}d-=lengths[i]}const p=ROUTE.at(-1);return{x:p[0],y:p[1]};}
function stats(t){const d=TOWERS[t.type],l=t.level-1;let damage=d.damage*(1+l*.48),interval=d.interval,range=d.range+l*8,splash=t.type?64:0,burn=0;
if(t.branch===0){if(t.type===0){interval*=.64;damage*=.82}else{splash=82+l*4;damage*=1.2}}
if(t.branch===1){if(t.type===0){damage*=2.45;interval*=1.65;range+=70}else{burn=8+l*5;splash=58;interval*=.9}}
return{damage,interval,range,splash,burn};}
function variant(t){return t.branch<0?0:t.level>=5?3+t.branch:1+t.branch;}
function upgradeCost(t){return t.level>=5?0:Math.round(TOWERS[t.type].cost*(.65+t.level*.55));}
class Game{
constructor(){this.gold=320;this.hp=20;this.wave=0;this.kills=0;this.phase='prep';this.towers=[];this.enemies=[];this.shots=[];this.queue=[];this.time=0;this.id=0;this.events=[];this.countdown=0;this.auto=true;this.paused=false;this.speed=1;}
emit(type,data={}){this.events.push({type,...data});}
drain(){return this.events.splice(0);}
changed(){this.emit('state');}
reason(pad,type){if(!['prep','combat'].includes(this.phase))return'本場已結束';if(!PADS[pad])return'請選擇建造平台';if(this.towers.some(t=>t.pad===pad))return'平台已有守護塔';if(this.towers.length>=6)return'本場最多建造 6 座塔';if(!TOWERS[type])return'請選擇守護塔';if(this.gold<TOWERS[type].cost)return'金幣不足，還差 '+(TOWERS[type].cost-this.gold);return'';}
build(pad,type){const reason=this.reason(pad,type);if(reason)return{ok:false,reason};const[x,y]=PADS[pad],t={id:++this.id,pad,type,x,y,level:1,branch:-1,cooldown:0,spent:TOWERS[type].cost};this.gold-=t.spent;this.towers.push(t);this.emit('build',{tower:t});this.changed();return{ok:true,tower:t};}
upgradeReason(t,branch){if(!t||!this.towers.includes(t))return'找不到守護塔';if(!['prep','combat'].includes(this.phase))return'本場已結束';if(t.level>=5)return'已達最高等級';if(t.level===1&&![0,1].includes(branch))return'請先選擇連射／狙擊或火焰分支';if(this.gold<upgradeCost(t))return'金幣不足，還差 '+(upgradeCost(t)-this.gold);return'';}
upgrade(t,branch){const reason=this.upgradeReason(t,branch);if(reason)return{ok:false,reason};const cost=upgradeCost(t);this.gold-=cost;t.spent+=cost;if(t.level===1)t.branch=branch;t.level++;this.emit('upgrade',{tower:t});this.changed();return{ok:true};}
sell(t){if(!this.towers.includes(t)||!['prep','combat'].includes(this.phase))return false;const gold=Math.floor(t.spent*.7);this.gold+=gold;this.towers=this.towers.filter(x=>x!==t);this.emit('sell',{tower:t,gold});this.changed();return true;}
startWave(){if(this.phase!=='prep'||this.wave>=WAVES.length)return false;this.wave++;this.phase='combat';this.countdown=0;let time=0;for(const[type,count,gap]of WAVES[this.wave-1])for(let i=0;i<count;i++){this.queue.push({type,time});time+=gap;}this.waveTime=0;this.emit('wave',{wave:this.wave});this.changed();return true;}
spawn(type){const def=ENEMIES[type],factor=1+(this.wave-1)*.14;const hp=Math.round(def.hp*factor);const e={id:++this.id,type,...position(0),distance:0,hp,maxHp:hp,speed:def.speed,gold:def.gold,leak:def.leak,burn:0,burnTime:0};this.enemies.push(e);this.emit('spawn',{enemy:e});}
hit(e,damage){if(e.hp<=0)return;e.hp=Math.max(0,e.hp-damage);this.emit('hit',{enemy:e,damage});if(!e.hp){this.gold+=e.gold;this.kills++;this.emit('kill',{enemy:e,gold:e.gold});this.changed();}}
step(dt){if(this.paused||['won','lost'].includes(this.phase))return;dt*=this.speed;this.time+=dt;if(this.phase==='prep'){if(this.auto&&this.countdown>0){this.countdown-=dt;if(this.countdown<=0)this.startWave();}return;}
this.waveTime+=dt;while(this.queue.length&&this.queue[0].time<=this.waveTime)this.spawn(this.queue.shift().type);
for(const e of this.enemies){if(e.hp<=0)continue;if(e.burnTime>0){const tick=Math.min(dt,e.burnTime);e.burnTime-=tick;this.hit(e,e.burn*tick);}if(e.hp<=0)continue;e.distance+=e.speed*dt;Object.assign(e,position(e.distance));if(e.distance>=total){e.hp=0;this.hp=Math.max(0,this.hp-e.leak);this.emit('leak',{enemy:e});this.changed();}}
for(const t of this.towers){t.cooldown-=dt;if(t.cooldown>0)continue;const s=stats(t);const e=this.enemies.filter(e=>e.hp>0&&Math.hypot(t.x-e.x,t.y-e.y)<=s.range).sort((a,b)=>t.branch===1&&t.type===0?b.hp-a.hp:b.distance-a.distance)[0];if(!e)continue;t.cooldown=s.interval;const shot={id:++this.id,type:t.type,from:t.id,target:e.id,x:t.x,y:t.y-46,tx:e.x,ty:e.y,time:0,duration:t.type===0?.16:.42,stats:s,final:t.level===5,branch:t.branch};this.shots.push(shot);this.emit('fire',{tower:t,shot});}
for(const shot of this.shots){shot.time+=dt;if(shot.time<shot.duration)continue;if(shot.done)continue;shot.done=true;const target=this.enemies.find(e=>e.id===shot.target&&e.hp>0);if(shot.type===0){if(target)this.hit(target,shot.stats.damage);}else{for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-shot.tx,e.y-shot.ty)<=shot.stats.splash){this.hit(e,shot.stats.damage);if(shot.stats.burn){e.burn=shot.stats.burn;e.burnTime=3;}}}this.emit('impact',{shot});}
this.shots=this.shots.filter(s=>!s.done);this.enemies=this.enemies.filter(e=>e.hp>0);
if(this.hp<=0){this.phase='lost';this.emit('end',{won:false});this.changed();}else if(!this.queue.length&&!this.enemies.length&&!this.shots.length){this.gold+=35+this.wave*5;this.emit('clear',{wave:this.wave});if(this.wave===WAVES.length){this.phase='won';this.emit('end',{won:true});}else{this.phase='prep';this.countdown=4;}this.changed();}}
}
const api={Game,TOWERS,ENEMIES,WAVES,ROUTE,PADS,stats,variant,upgradeCost,position,total};root.Forest=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
