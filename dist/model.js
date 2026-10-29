(function(root){'use strict';
const {STAGES,CHAPTERS,TRIAL}=typeof module!=='undefined'?require('./stages.js'):root.ForestStages;
const TARGET_MODES=Object.freeze({first:'最前方',strongest:'最高血量',nearest:'最近'});
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
{name:'星門守護龍',art:7,hp:2600,speed:30,gold:140,leak:5,boss:true},
{name:'分裂史萊姆',art:0,hp:110,speed:48,gold:6,leak:2,split:9,children:2,tint:0x98e3c3},
{name:'史萊姆子體',art:0,hp:34,speed:72,gold:3,leak:1,child:true,tint:0xb7f2dd},
{name:'奔行幻影',art:4,hp:100,speed:180,gold:8,leak:1,trial:true,tint:0xc9e4ff}
];
const WAVES=STAGES[0].waves;
function pathLength(route){return route.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p[0]-route[i][0],p[1]-route[i][1]),0);}
const total=pathLength(ROUTE);
function position(d,route=ROUTE){d=Math.max(0,d);for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);if(d<=length){const r=d/length;return{x:a[0]+(b[0]-a[0])*r,y:a[1]+(b[1]-a[1])*r};}d-=length;}const p=route.at(-1);return{x:p[0],y:p[1]};}
const PROGRESS_KEY='starwish-journey-v2';
const TOWER_GATES=[null,0,1,3,5,'trial'];
const FINAL_STARS=[6,9,12,18,24,30];
const CASTLE_STYLES=[{id:'forest',name:'森林石堡',stars:0,tint:0xffffff},{id:'moon',name:'月溪銀堡',stars:12,tint:0xbddfff},{id:'star',name:'星願金堡',stars:24,tint:0xffdf9e}];
const TITLES=[{id:'rookie',name:'初星守望',stars:0},{id:'forest',name:'森林守護者',stars:6},{id:'moon',name:'月溪領航者',stars:18},{id:'star',name:'星願守護者',stars:30},{id:'complete',name:'滿星守望者',stars:36}];
function emptyProgress(){return{version:2,goals:STAGES.map(()=>[false,false,false]),stars:Array(STAGES.length).fill(0),trialWon:false,castleStyle:'forest',titleId:'rookie'};}
function readProgress(value){
 const clean=emptyProgress();if(value?.version!==2||!Array.isArray(value.goals))return clean;
 clean.goals=clean.goals.map((_,i)=>{const row=value.goals[i];return Array.isArray(row)&&row[0]===true?[true,row[1]===true,row[2]===true]:[false,false,false];});
 clean.stars=clean.goals.map(row=>row.filter(Boolean).length);
 clean.trialWon=value.trialWon===true&&clean.goals[8][0];
 const count=clean.stars.reduce((a,b)=>a+b,0);
 clean.castleStyle=CASTLE_STYLES.find(r=>r.id===value.castleStyle&&r.stars<=count)?.id||'forest';
 clean.titleId=TITLES.find(r=>r.id===value.titleId&&r.stars<=count)?.id||'rookie';return clean;
}
function totalStars(progress){return readProgress(progress).stars.reduce((a,b)=>a+b,0);}
function stageUnlocked(progress,id){return Number.isInteger(id)&&!!STAGES[id]&&(id===0||readProgress(progress).goals[id-1][0]);}
function towerUnlocked(progress,type){if(!TOWERS[type])return false;if(progress===null)return true;const p=readProgress(progress),gate=TOWER_GATES[type];return gate===null||gate==='trial'&&p.trialWon||Number.isInteger(gate)&&p.goals[gate][0];}
function towerRequirement(type){const gate=TOWER_GATES[type];return gate===null?'初始開放':gate==='trial'?'第九關後完成星隕試煉':'通關第 '+(gate+1)+' 關';}
function finalUnlocked(progress,type){return !!TOWERS[type]&&(progress===null||towerUnlocked(progress,type)&&totalStars(progress)>=FINAL_STARS[type]);}
function earnedGoals(game){return game.isTrial?[]:objectiveStatus(game).map(g=>g.complete);}
function earnedStars(game){return earnedGoals(game).filter(Boolean).length;}
function trialUnlocked(progress){return progress===null||readProgress(progress).goals[8][0];}
function trialStatus(game){return{current:game.metrics.meteorSlowHits,target:TRIAL.requiredCombos,met:game.metrics.meteorSlowHits>=TRIAL.requiredCombos};}
function settle(game,progress){const clean=readProgress(progress);if(game.phase==='won'){if(game.isTrial){if(clean.goals[8][0]&&trialStatus(game).met)clean.trialWon=true;}else{const goals=earnedGoals(game);clean.goals[game.stageId]=clean.goals[game.stageId].map((yes,i)=>yes||goals[i]);clean.stars=clean.goals.map(row=>row.filter(Boolean).length);}}return clean;}
const BLESSINGS=[
 {id:'volley',name:'精靈連射',description:'本局弓箭攻擊間隔減少 10%，最多 2 層。',cap:2},
 {id:'sight',name:'守護視野',description:'本局所有塔射程增加 5%，最多 2 層。',cap:2},
 {id:'gold',name:'旅途補給',description:'立即獲得 100 金幣，最多選 2 次。',cap:2},
 {id:'frost',name:'霜痕延續',description:'本局冰霜減速延長 0.5 秒，最多 1 層；不延長凍結。',cap:1},
 {id:'repair',name:'城堡修復',description:'立即恢復 4 生命，上限 20；最多 1 次，可幫助生命星判定。',cap:1}
];
function enemyMechanic(type){const e=ENEMIES[type];return e.split?'擊敗後在原路線分裂為兩個子體；用範圍攻擊接續處理。整組固定 12 金幣。':e.child?'子體速度較快，不會再次分裂。':e.trial?'速度比一般快敵更高；先用冰霜減速，讓隕石落點追得上。':e.shield?'先消耗護盾才會扣除生命，集中火力破盾。':e.boss?'頭目抵達城堡扣 5 生命，凍結時間縮短。':e.speed>=90?'速度較快，可用減速爭取攻擊時間。':'依路線前進，搭配單體與範圍攻擊攔截。';}
function challengeStatus(game){
 const c=game.stage.challenge,m=game.metrics;
 const target=c.kind==='variety'?c.types:c.target??c.limit;
 const current=c.kind==='sales'?m.sales:c.kind==='peak'?m.peak:c.kind==='gold'?game.gold:c.kind==='variety'?m.killsByType.filter(n=>n>=c.each).length:m[c.kind];
 const ceiling=c.kind==='sales'||c.kind==='peak',failed=ceiling&&current>target,met=ceiling?!failed:current>=target;
 return{...c,current,target,met,failed,complete:game.phase==='won'&&met};
}
function objectiveStatus(game){
 if(game.isTrial)return [];
 const won=game.phase==='won',lost=game.phase==='lost';
 return[
  {id:'clear',name:'守護成功',description:'擊敗全部波次並成功通關。',current:game.wave,target:game.waves.length,met:won,failed:lost,complete:won},
  {id:'health',name:'城堡守護',description:'通關且結算生命至少 16 / 20（80%）。',current:game.hp,target:16,met:game.hp>=16,failed:game.hp<16,complete:won&&game.hp>=16},
  {id:'challenge',...challengeStatus(game)}
 ];
}
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
function ability(t,s=stats(t)){switch(t.type){
 case 0:return t.branch===1?'單箭傷害與射程提高，可自行設定目標優先。':'連射分支提高攻擊速度，可自行設定目標優先。';
 case 1:return '爆炸半徑 '+Math.round(s.splash)+'；'+(s.burn?'每秒灼燒 '+s.burn+' 傷害，持續 3 秒。同類效果不疊加。':'爆炎分支擴大爆炸範圍。');
 case 2:return '緩速 '+Math.round(s.slow*100)+'%，持續 '+s.slowDuration+' 秒，取最強效果。'+(s.freeze?'每四次攻擊凍結 1 秒（頭目 0.35 秒）。':s.splash?'寒流影響落點周圍 '+s.splash+' 範圍。':'');
 case 3:return '最多連鎖 '+s.chain+' 個目標，跳躍距離 '+(s.chainRange/70).toFixed(1)+' 格，每跳保留 80% 傷害。';
 case 4:return '依目標優先取得並持續鎖定敵人，每秒增傷 '+Math.round(s.ramp*100)+'%，最高 '+(1+s.cap)+' 倍；換目標、離開射程或升級時重置。';
 case 5:return '隕石飛行 0.85 秒後在預告位置落下，爆炸半徑 '+s.splash+'；敵人可以移出落點。兩型態、無分支。';
}}
function upgradeCost(t){return finalForm(t)?0:Math.round(TOWERS[t.type].cost*(.65+t.level*.55));}
class Game{
constructor(stageId=0,progress=null){
 const isTrial=stageId===TRIAL.id,stage=isTrial?TRIAL:STAGES[stageId];
 if(!stage||!isTrial&&!Number.isInteger(stageId))throw new RangeError('找不到關卡');
 if(progress!==null&&!(isTrial?trialUnlocked(progress):stageUnlocked(progress,stageId)))throw new RangeError(isTrial?'請先通關第九關':'請先通關前一關');
 this.isTrial=isTrial;this.progress=progress===null?null:readProgress(progress);this.stageId=stageId;this.stage=stage;this.routes=stage.routes;this.pads=stage.pads;this.waves=stage.waves;this.routeLengths=this.routes.map(pathLength);this.gold=stage.startGold;this.hp=20;this.wave=0;this.kills=0;this.phase='prep';this.towers=[];this.enemies=[];this.shots=[];this.queue=[];this.pendingSplits=[];this.time=0;this.id=0;this.events=[];this.metrics={sales:0,peak:0,slowedKills:0,chainHits:0,freezes:0,beamEliteKills:0,meteorSlowHits:0,killsByType:Array(TOWERS.length).fill(0)};this.countdown=0;this.auto=true;this.paused=false;this.speed=1;this.towerLimit=isTrial?2:6;this.blessings=[];this.blessingsOffered=0;this.pendingBlessing=null;
 if(isTrial){const pad=TRIAL.altarPad,[x,y]=this.pads[pad],tower={id:++this.id,pad,type:5,x,y,level:1,branch:-1,cooldown:0,attacks:0,targetMode:'first',targetId:null,charge:0,spent:0,borrowed:true};this.towers.push(tower);this.emit('build',{tower});}
}
regularTowerCount(){return this.towers.filter(t=>!t.borrowed).length;}
towerAccessReason(type){return this.isTrial?(type===2?'':'試煉僅能建造冰霜支援塔'):towerUnlocked(this.progress,type)?'':towerRequirement(type);}
blessingCount(id){return this.blessings.filter(value=>value===id).length;}
stats(t){const s=stats(t);if(t.type===0)s.interval*=.9**this.blessingCount('volley');s.range*=1+.05*this.blessingCount('sight');if(t.type===2)s.slowDuration+=.5*this.blessingCount('frost');return s;}
blessingOptions(){const order=this.blessingsOffered===0?['volley','frost','gold','sight','repair']:['repair','frost','sight','gold','volley'];return order.filter(id=>{const b=BLESSINGS.find(b=>b.id===id);return this.blessingCount(id)<b.cap&&(id!=='frost'||!this.towerAccessReason(2))&&(id!=='repair'||this.hp<20);}).slice(0,3);}
chooseBlessing(id){
 if(!this.pendingBlessing||this.phase!=='prep')return{ok:false,reason:'目前沒有待選祝福'};
 if(id!=='skip'&&!this.pendingBlessing.options.includes(id))return{ok:false,reason:'請選擇本次提供的祝福'};
 if(id!=='skip'){const def=BLESSINGS.find(b=>b.id===id);if(!def||this.blessingCount(id)>=def.cap)return{ok:false,reason:'祝福已達上限'};this.blessings.push(id);if(id==='gold')this.gold+=100;if(id==='repair')this.hp=Math.min(20,this.hp+4);}
 this.pendingBlessing=null;this.countdown=4;this.emit('blessed',{id});this.changed();return{ok:true};
}

emit(type,data={}){this.events.push({type,...data});}
drain(){return this.events.splice(0);}
changed(){this.emit('state');}
reason(pad,type){if(!['prep','combat'].includes(this.phase))return'本場已結束';if(!this.pads[pad])return'請選擇建造平台';if(this.towers.some(t=>t.pad===pad))return'平台已有守護塔';if(this.regularTowerCount()>=this.towerLimit)return'本場最多建造 '+this.towerLimit+' 座'+(this.isTrial?'支援塔':'塔');if(!TOWERS[type])return'請選擇守護塔';if(this.towerAccessReason(type))return this.towerAccessReason(type);if(this.gold<TOWERS[type].cost)return'金幣不足，還差 '+(TOWERS[type].cost-this.gold);return'';}
build(pad,type){const reason=this.reason(pad,type);if(reason)return{ok:false,reason};const[x,y]=this.pads[pad],t={id:++this.id,pad,type,x,y,level:1,branch:-1,cooldown:0,attacks:0,targetMode:'first',targetId:null,charge:0,spent:TOWERS[type].cost};this.gold-=t.spent;this.towers.push(t);this.metrics.peak=Math.max(this.metrics.peak,this.regularTowerCount());this.emit('build',{tower:t});this.changed();return{ok:true,tower:t};}
setTargetMode(t,mode){
 if(!this.towers.includes(t)||!Object.hasOwn(TARGET_MODES,mode)||!['prep','combat'].includes(this.phase))return false;
 if(t.targetMode===mode)return true;
 t.targetMode=mode;t.targetId=null;t.charge=0;this.changed();return true;
}
compareTargets(t,a,b){
 const remaining=e=>this.routeLengths[e.routeIndex||0]-e.distance;
 const front=remaining(a)-remaining(b);
 const order=t.targetMode==='strongest'?b.hp-a.hp:t.targetMode==='nearest'?Math.hypot(t.x-a.x,t.y-a.y)-Math.hypot(t.x-b.x,t.y-b.y):front;
 return order||front||a.id-b.id;
}
upgradeReason(t,branch){if(!t||!this.towers.includes(t))return'找不到守護塔';if(!['prep','combat'].includes(this.phase))return'本場已結束';if(t.borrowed)return'試煉祭壇為固定借用型態';if(this.isTrial&&t.level>=2)return'試煉支援塔最高 Lv.2';if(finalForm(t))return'已達最高等級';if(t.level+1===TOWERS[t.type].maxLevel&&!finalUnlocked(this.progress,t.type))return'最終型態需累積 '+FINAL_STARS[t.type]+' 顆挑戰星';if(t.level===1&&TOWERS[t.type].branches.length&&![0,1].includes(branch))return'請先選擇進化分支';if(this.gold<upgradeCost(t))return'金幣不足，還差 '+(upgradeCost(t)-this.gold);return'';}
upgrade(t,branch){const reason=this.upgradeReason(t,branch);if(reason)return{ok:false,reason};const cost=upgradeCost(t);this.gold-=cost;t.spent+=cost;if(t.level===1&&TOWERS[t.type].branches.length)t.branch=branch;t.level++;t.targetId=null;t.charge=0;this.emit('upgrade',{tower:t});this.changed();return{ok:true};}
sell(t){if(!this.towers.includes(t)||t.borrowed||!['prep','combat'].includes(this.phase))return false;const gold=Math.floor(t.spent*.7);this.gold+=gold;this.metrics.sales++;this.towers=this.towers.filter(x=>x!==t);this.emit('sell',{tower:t,gold});this.changed();return true;}
startWave(){if(this.pendingBlessing||this.phase!=='prep'||this.wave>=this.waves.length)return false;this.wave++;this.phase='combat';this.countdown=0;let time=0;for(const[type,count,gap]of this.waves[this.wave-1])for(let i=0;i<count;i++){this.queue.push({type,time,routeIndex:this.queue.length%this.routes.length});time+=gap;}this.waveTime=0;this.emit('wave',{wave:this.wave});this.changed();return true;}
spawn(type,routeIndex=0,options={}){const def=ENEMIES[type],factor=(1+(this.wave-1)*.14)*this.stage.hpScale;const hp=Math.round(def.hp*factor);const e={id:++this.id,type,routeIndex,...position(options.distance||0,this.routes[routeIndex]),distance:options.distance||0,splitFrom:options.splitFrom??null,hp,maxHp:hp,shield:Math.round((def.shield||0)*factor),speed:def.speed,gold:def.gold,leak:def.leak,burn:0,burnTime:0,slow:0,slowTime:0,freezeTime:0};this.enemies.push(e);this.emit('spawn',{enemy:e});return e;}
hit(e,damage,sourceType=null){if(e.hp<=0)return;const absorbed=Math.min(e.shield||0,damage);e.shield=(e.shield||0)-absorbed;e.hp=Math.max(0,e.hp-(damage-absorbed));this.emit('hit',{enemy:e,damage});if(!e.hp){if(e.slowTime>0||e.freezeTime>0)this.metrics.slowedKills++;if(Number.isInteger(sourceType)&&TOWERS[sourceType])this.metrics.killsByType[sourceType]++;if(sourceType===4&&[5,6].includes(e.type))this.metrics.beamEliteKills++;if(ENEMIES[e.type].split)this.pendingSplits.push({type:ENEMIES[e.type].split,count:ENEMIES[e.type].children,parent:e});this.gold+=e.gold;this.kills++;this.emit('kill',{enemy:e,gold:e.gold});this.changed();}}
step(dt){if(this.paused||this.pendingBlessing||['won','lost'].includes(this.phase))return;dt*=this.speed;this.time+=dt;if(this.phase==='prep'){if(this.auto&&this.countdown>0){this.countdown-=dt;if(this.countdown<=0)this.startWave();}return;}
this.waveTime+=dt;while(this.queue.length&&this.queue[0].time<=this.waveTime){const next=this.queue.shift();this.spawn(next.type,next.routeIndex||0);};
for(const e of this.enemies){if(e.hp<=0)continue;if(e.burnTime>0){const tick=Math.min(dt,e.burnTime);e.burnTime-=tick;this.hit(e,e.burn*tick,e.burnType??1);}if(e.hp<=0)continue;const frozen=Math.min(dt,e.freezeTime||0);e.freezeTime=Math.max(0,(e.freezeTime||0)-dt);
const moving=dt-frozen,slowed=Math.min(moving,Math.max(0,(e.slowTime||0)-frozen));
e.distance+=e.speed*(moving-slowed*(e.slow||0));e.slowTime=Math.max(0,(e.slowTime||0)-dt);if(!e.slowTime)e.slow=0;Object.assign(e,position(e.distance,this.routes[e.routeIndex||0]));if(e.distance>=this.routeLengths[e.routeIndex||0]){e.hp=0;this.hp=Math.max(0,this.hp-e.leak);this.emit('leak',{enemy:e});this.changed();}}
for(const t of this.towers){
 const s=this.stats(t),candidates=this.enemies.filter(e=>e.hp>0&&Math.hypot(t.x-e.x,t.y-e.y)<=s.range)
 .sort((a,b)=>this.compareTargets(t,a,b));
 if(t.type===4){
  let target=candidates.find(e=>e.id===t.targetId);
  if(!target){target=candidates[0];t.targetId=target?.id??null;t.charge=0;}
  if(target){this.hit(target,s.damage*(dt+Math.min(s.cap,t.charge+s.ramp*dt/2)*dt),t.type);t.charge=Math.min(s.cap,t.charge+s.ramp*dt);}
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
   seen.add(next.id);points.push({x:next.x,y:next.y-15});this.hit(next,damage,shot.type);this.metrics.chainHits++;damage*=.8;
   const previous=next;next=this.enemies.filter(e=>e.hp>0&&!seen.has(e.id)&&Math.hypot(e.x-previous.x,e.y-previous.y)<=s.chainRange)
    .sort((a,b)=>Math.hypot(a.x-previous.x,a.y-previous.y)-Math.hypot(b.x-previous.x,b.y-previous.y)||a.id-b.id)[0];
  }
  this.emit('chain',{points,shot});
 }else{
  const victims=s.splash?this.enemies.filter(e=>e.hp>0&&Math.hypot(e.x-shot.tx,e.y-shot.ty)<=s.splash):target?[target]:[];
  for(const e of victims){
   if(shot.type===5&&(e.slowTime>0||e.freezeTime>0))this.metrics.meteorSlowHits++;
   this.hit(e,s.damage,shot.type);
   if(s.burn){e.burnType=shot.type;e.burn=Math.max(e.burn,s.burn);e.burnTime=Math.max(e.burnTime,3);}
   if(s.slow){e.slow=Math.max(e.slow||0,s.slow);e.slowTime=Math.max(e.slowTime||0,s.slowDuration);}
   if(shot.freeze&&e.hp>0){if(!(e.freezeTime>0))this.metrics.freezes++;e.freezeTime=Math.max(e.freezeTime||0,ENEMIES[e.type].boss?.35:s.freeze);}
  }
 }
 this.emit('impact',{shot,x:s.splash?shot.tx:target?.x,y:s.splash?shot.ty:target?.y,landed:shot.type!==3&&(!!s.splash||!!target)});
}
for(const split of this.pendingSplits.splice(0)){
 const parent=split.parent,children=[];
 for(let i=0;i<split.count;i++)children.push(this.spawn(split.type,parent.routeIndex||0,{distance:Math.max(0,Math.min(this.routeLengths[parent.routeIndex||0]-.001,parent.distance+(i?18:-18))),splitFrom:parent.id}));
 this.emit('split',{x:parent.x,y:parent.y,children});
}
this.shots=this.shots.filter(s=>!s.done);this.enemies=this.enemies.filter(e=>e.hp>0);
if(this.hp<=0){this.phase='lost';this.emit('end',{won:false});this.changed();}
else if(!this.queue.length&&!this.enemies.length&&!this.shots.length){
 this.gold+=35+this.wave*5;this.emit('clear',{wave:this.wave});
 if(this.wave===this.waves.length){
  const won=!this.isTrial||trialStatus(this).met;this.phase=won?'won':'lost';this.endReason=won?'':'需要至少 '+TRIAL.requiredCombos+' 次冰霜＋星隕配合命中，請再試一次。';this.emit('end',{won});
 }else{
  this.phase='prep';this.countdown=4;
  if(this.progress!==null&&!this.isTrial&&[3,6].includes(this.wave)&&this.blessingsOffered<2){const options=this.blessingOptions();if(options.length){this.blessingsOffered++;this.pendingBlessing={wave:this.wave,options};this.countdown=0;this.emit('blessing',{offer:this.pendingBlessing});}}
 }
 this.changed();
}}

}
const api={Game,TRIAL,BLESSINGS,trialUnlocked,trialStatus,enemyMechanic,PROGRESS_KEY,TOWER_GATES,FINAL_STARS,CASTLE_STYLES,TITLES,totalStars,stageUnlocked,towerUnlocked,towerRequirement,finalUnlocked,earnedGoals,TARGET_MODES,challengeStatus,objectiveStatus,STAGES,CHAPTERS,emptyProgress,readProgress,earnedStars,settle,pathLength,TOWERS,ENEMIES,WAVES,ROUTE,PADS,stats,variant,finalForm,formTower,ability,upgradeCost,position,total};root.Forest=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
