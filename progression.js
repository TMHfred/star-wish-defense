/* Independent star goals and staged tower access. Old saves are migrated once. */
(function(root){'use strict';
const C=root.Campaign,{Game,TOWERS,MAPS}=root.Starbloom,P=Game.prototype;
const requirements=[0,1,2,4,6,9];
const tasks=['同時最多6座塔','建造至少1座火焰塔','使用至少3種塔','擊敗全部頭目，不能漏掉頭目','拆塔不超過2次','曾同時擁有連射與狙擊','同時最多8座塔','使用至少4種塔','不建造星輝塔','不使用星隕塔','擊敗全部頭目且保有至少50%生命','使用至少5種塔且不拆塔'];
const rewards=TOWERS.slice(0,5).flatMap((t,type)=>t.branches.map((b,branch)=>({stars:(type*2+branch+1)*3,type,branch,name:t.name+'・'+b[0]+'最終型態'}))).concat([{stars:33,type:5,branch:-1,name:'星隕聖殿'},{stars:36,type:-1,name:'星願守護者稱號與專屬城堡'}]);
function migrate(stars){if(stars._version===3)return stars;const old={...stars};stars._legacyTowers=[0,1,2,3,4];if(C.total(old)>=18)stars._legacyTowers.push(5);stars._goals={};for(const id of C.storyIds){const n=C.starsAt(old,id);stars._goals[id]=[n>0,n===3,false];stars[id]=stars._goals[id].filter(Boolean).length;}stars._version=3;stars._migration={before:C.total(old),after:C.total(stars)};return stars;}
function prepare(stars){if(stars._version!==3){if(C.storyIds.some(id=>C.starsAt(stars,id)>0))migrate(stars);else{stars._version=3;stars._goals={};}}return stars;}
function cleared(stars,number){return !!stars._goals?.[C.storyIds[number-1]]?.[0];}
function canBuild(stars,type){if(type===0||stars._legacyTowers?.includes(type))return true;return type===5?!!stars._trial:cleared(stars,requirements[type]);}
function bind(game,stars){prepare(stars);game.starTotal=C.total(stars);game.towerAccess=TOWERS.map((_,i)=>canBuild(stars,i));game.royalCastle=game.starTotal>=36;return game;}
function metrics(g){return g.challenge||(g.challenge={peak:g.towers.length,types:[...new Set(g.towers.map(t=>t.type))],sales:0,dual:false,bossLeaks:0,verified:g.wave===0});}
function track(g){const m=metrics(g);m.peak=Math.max(m.peak,g.towers.length);m.types=[...new Set([...m.types,...g.towers.map(t=>t.type)])];m.dual=m.dual||[0,1].every(b=>g.towers.some(t=>t.type===0&&t.branch===b));}
function challenge(g){const m=metrics(g);if(!m.verified)return false;switch(g.def.storyNumber){case 1:return m.peak<=6;case 2:return m.types.includes(1);case 3:return m.types.length>=3;case 4:return m.bossLeaks===0;case 5:return m.sales<=2;case 6:return m.dual;case 7:return m.peak<=8;case 8:return m.types.length>=4;case 9:return !m.types.includes(4);case 10:return !m.types.includes(5);case 11:return m.bossLeaks===0&&g.hp>=g.maxHp()*.5;case 12:return m.types.length>=5&&m.sales===0;default:return false;}}
const validate=P.validate;P.validate=function(x,y,type,ignoreGold){if(this.towerAccess&&!this.towerAccess[type]&&!this.sandbox)return type===5?'通過第9關後完成星隕試煉解鎖':'通過第'+requirements[type]+'關解鎖'+TOWERS[type].name;const total=this.starTotal;if(type===5&&(this.towerAccess?.[5]||this.sandbox||this.trial))this.starTotal=Math.max(18,total);try{return validate.call(this,x,y,type,ignoreGold);}finally{this.starTotal=total;}};
const build=P.build;P.build=function(...a){metrics(this);const r=build.apply(this,a);if(r.ok)track(this);return r;};
const sell=P.sell;P.sell=function(id){if(this.towers.find(t=>t.id===id)?.loan)return 0;metrics(this);const n=sell.call(this,id);if(n)this.challenge.sales++;return n;};
const specialize=P.specialize;P.specialize=function(id,b){const t=this.towers.find(t=>t.id===id);if(t?.level===6&&!this.canAscend(t.type,b))return false;const r=specialize.call(this,id,b);if(r)track(this);return r;};
P.ascendStars=function(type,branch=0){return type===5?33:(type*2+Math.max(0,branch)+1)*3;};
P.canAscend=function(type,branch=0){return this.sandbox||this.starTotal>=this.ascendStars(type,branch);};
const upgrade=P.upgrade;P.upgrade=function(id){const t=this.towers.find(t=>t.id===id);if(t&&(t.level===5||t.type===5)&&!this.canAscend(t.type,t.branch))return false;return upgrade.call(this,id);};
const update=P.update;P.update=function(dt){const m=metrics(this),bosses=this.enemies.filter(e=>e.type===4&&!e.leaked);update.call(this,dt);m.bossLeaks+=bosses.filter(e=>e.leaked).length;};
// Heavy final-chapter bosses leave a longer focus window; their escorts stay fast.
const spawn=P.spawn;P.spawn=function(q){spawn.call(this,q);if(this.def.chapter===3&&q.type===4)this.enemies.at(-1).speed*=.75;};
const restore=Game.restore;Game.restore=function(raw){const data=typeof raw==='string'?JSON.parse(raw):raw,g=restore.call(this,data);for(const k of ['challenge','trial','towerAccess','royalCastle'])if(data[k]!==undefined)g[k]=data[k];if(g.trial)g.def={...g.def,waves:10,name:'星隕試煉'};metrics(g);return g;};
const spec=P.waveSpec;P.waveSpec=function(w){w=w||this.wave+1;if(this.trial)return [{type:w%3===0?3:0,count:w%3===0?4:12+w},{type:1,count:4+Math.floor(w/2)},...(w%5===0?[{type:4,count:1}]:[])];let groups=spec.call(this,w);if(!this.endless&&this.def.chapter<2)groups=groups.map(q=>({...q,type:q.type===5?3:q.type===6?2:q.type}));if(this.def.chapter===1&&w%4===0)groups.push({type:1,count:2});if(this.def.chapter===3&&w%5===0)groups.push({type:2,count:6});return groups;};
const endless=P.continueEndless;P.continueEndless=function(){return !this.trial&&endless.call(this);};
const start=P.startWave;P.startWave=function(){const ok=start.call(this);if(ok&&this.trial){for(const q of this.queue)if(q.wave===this.wave)q.at=this.clock+(q.at-this.clock)*1.5;this.queue.sort((a,b)=>a.at-b.at);}return ok;};
const pool=P.blessingPool;P.blessingPool=function(w){return pool.call(this,w).filter(b=>b.type<0||this.sandbox||!this.towerAccess||this.towerAccess[b.type]||this.towers.some(t=>t.type===b.type));};
const offer=P.offerBlessing;P.offerBlessing=function(w){offer.call(this,w);this.blessingOffers=this.blessingOffers.filter(o=>o.choices.length>0);};
function startTrial(g){g.trial=true;g.def={...g.def,waves:10,name:'星隕試煉'};g.gold=900;const owned=g.towerAccess[5];g.towerAccess[5]=true;const spot=[...g.buildable].find(n=>n%16>=5&&n%16<=10);const r=g.build(spot%16,Math.floor(spot/16),5);if(r.ok){r.tower.loan=true;g.gold=900;}g.towerAccess[5]=owned;return g;}
C.settle=function(g,stars){prepare(stars);if(g.sandbox||g.endless||g.phase!=='won'||!C.storyIds.includes(g.map))return null;if(g.trial){stars._trial=true;bind(g,stars);return {earned:0,best:0,added:0,total:C.total(stars),unlocks:[],trial:true};}if(g.campaignResult?.version===3)return g.campaignResult;const before=C.total(stars),id=g.map,prev=stars._goals[id]||[false,false,false],earned=[true,g.hp>=g.maxHp()*.8,challenge(g)],goals=prev.map((v,i)=>v||earned[i]);stars._goals[id]=goals;stars[id]=goals.filter(Boolean).length;const total=C.total(stars);bind(g,stars);return g.campaignResult={version:3,earned:earned.filter(Boolean).length,best:stars[id],added:total-before,total,goals,unlocks:rewards.map((r,i)=>r.stars>before&&r.stars<=total?i:-1).filter(i=>i>=0)};};
C.label=i=>rewards[i]?.name||'';
root.Progression={tasks,rewards,prepare,migrate,bind,metrics,challenge,startTrial,cleared,requirements,canBuild};
})(globalThis);
