(function(){'use strict';
const {Game,UNLOCK_STARS,BLESSINGS,TOWERS,ENEMIES,MAPS,COLS,ROWS,key,xy}=Starbloom;
const $=s=>document.querySelector(s),canvas=$('#battle'),ctx=canvas.getContext('2d'),S=64,OX=128,OY=96,W=1280,H=832;
const saveKey='starbloom-defense-v1',progressKey='starbloom-stars-v1';
const camera=new BattlefieldCamera();
let bestWaves={};try{bestWaves=JSON.parse(localStorage.getItem('star-wish-endless-best')||'{}');if(!bestWaves||typeof bestWaves!=='object')bestWaves={};}catch{}
let view={scale:1,x:0,y:0,dpr:1};
let homeActive=true,simpleEffects=false,music=false,guideType=0,guideLevel=1,guideBranch=-1,helpPage=0;
let g,paused=false,speed=1,auto=true,routeVisible=true,selectedType=null,selectedId=null,pending=null,hover=null,menuMode='story',sandboxChoice=false,replaceAction=null,fx=[],last=0,uiTime=0,panelSig='',toastTimer,stars={},storageOK=true,seenResult=false;
try{stars=JSON.parse(localStorage.getItem(progressKey)||'{}');if(!stars||typeof stars!=='object')stars={};let raw=localStorage.getItem(saveKey);g=raw?Game.restore(raw):new Game();paused=!!raw&&g.phase==='combat';}catch{g=new Game();}
try{if(stars._version!==3&&Object.keys(stars).length&&!localStorage.getItem('star-wish-progress-before-v3'))localStorage.setItem('star-wish-progress-before-v3',JSON.stringify({stars,run:localStorage.getItem(saveKey)}));}catch{storageOK=false;}
Progression.bind(g,stars);
let menuChapter=Math.min(3,Math.floor(Math.max(0,Campaign.storyIds.filter(id=>Campaign.unlocked(stars,id)).length-1)/3));
const atlas=new Image();atlas.src=ArtManifest.monsters.src;atlas.onload=()=>{drawPortraits();renderPanel(true);};
// Production landscape and environment art, rendered into the actual playable board.
const landscape=new Image(),scenery=new Image();
landscape.onload=()=>{bgMap=-1;};scenery.onload=()=>{bgMap=-1;};
landscape.src='assets/forest-ground.webp';scenery.src='assets/scenery.webp';
const sceneryCrops=[[8,5,466,505],[474,74,414,438],[887,57,445,461],[1332,73,442,447],[7,565,443,299],[465,520,391,343],[866,519,468,359],[1349,542,425,328]];
function prop(c,i,x,y,w,h,alpha=1){if(!scenery.complete||!scenery.naturalWidth)return;const a=sceneryCrops[i];c.save();c.globalAlpha=alpha;c.drawImage(scenery,...a,x,y,w,h);c.restore();}
const sprites=[...Array(5).fill([0,0,1,1]),...ArtManifest.monsters.crops];ENEMIES.forEach((e,i)=>e.sprite=i);
const rewardCastle=new Image();rewardCastle.src=ArtManifest.castle.src;
function sprite(c,i,x,y,w,h,alpha=1){if(!atlas.complete||!atlas.naturalWidth)return;const a=sprites[i];c.save();c.globalAlpha=alpha;c.drawImage(atlas,...a,x,y,w,h);c.restore();}
const branchColor=(type,branch)=>TowerEffects.color(type,branch);
window.addEventListener('towerartready',()=>{drawPortraits();renderPanel(true);});
function towerArt(c,type,level,x,y,w,h,alpha=1,branch=-1){
 const a=TowerArt.layout(type,level,branch);
 const factor=Math.min(w*.88/a.width,h*.90/a.height);
 TowerArt.draw(c,type,level,x+w/2,y+h,factor,branch,alpha);
}
function portrait(c,type){const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);if(c.hasAttribute('data-enemy')){const a=sprites[type],h=c.height*.9,w=h*a[2]/a[3];sprite(x,type,(c.width-w)/2,0,w,h);return;}const level=Number(c.dataset.level)||1,branch=Number(c.dataset.branch??-1);if(c.closest('.tower-card')){const a=TowerArt.layout(type,level,branch);TowerArt.draw(x,type,level,c.width/2,c.height*.96,Math.min((c.width-6)/a.width,c.height*.92/a.height),branch);return;}towerArt(x,type,level,2,0,c.width-4,c.height*.96,1,branch);}
function drawPortraits(){document.querySelectorAll('canvas[data-sprite]').forEach(c=>portrait(c,Number(c.dataset.sprite)));}
function toast(s){$('#toast').textContent=s;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
let audioCtx=null,sound=false,lastChirp=0;
try{const settings=JSON.parse(localStorage.getItem('starbloom-settings')||'{}');sound=!!settings.sound;music=!!settings.music;simpleEffects=!!settings.simpleEffects;}catch{}
function chirp(kind){if(!sound)return;const now=performance.now();if(now-lastChirp<75)return;lastChirp=now;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();let o=audioCtx.createOscillator(),v=audioCtx.createGain();o.type=kind==='lightning'?'triangle':'sine';o.frequency.setValueAtTime(({build:640,kill:880,arrow:720,fire:160,ice:1100,lightning:260})[kind]||420,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(kind==='build'?960:480,audioCtx.currentTime+.12);v.gain.setValueAtTime(.025,audioCtx.currentTime);v.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+.18);o.connect(v);v.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+.18);}catch{}}
function save(){if(g.endless&&!g.sandbox){bestWaves[g.map]=Math.max(bestWaves[g.map]||0,...g.completed);try{localStorage.setItem('star-wish-endless-best',JSON.stringify(bestWaves));}catch{}}if(homeActive&&!hasSave)return;try{localStorage.setItem(saveKey,g.serialize());localStorage.setItem(progressKey,JSON.stringify(stars));}catch{storageOK=false;$('#saveStatus').textContent='此瀏覽器無法保存進度，請勿關閉遊戲';}}
function activeTower(){return g.towers.find(t=>t.id===selectedId);}
function safeDialog(id){const d=$('#'+id);if(!d.open)d.showModal();}
function panelPrice(n){return '◉ '+n;}

function refreshPanelBudget(){
 const t=activeTower(),canAct=['prep','combat'].includes(g.phase);
 $('#selectionBar').querySelectorAll('[data-cost]').forEach(b=>{
  const cost=Number(b.dataset.cost),reason=b.id==='switchBranch'&&t?.level===6&&!g.canAscend(t.type,1-t.branch)?'需 '+g.ascendStars(t.type,1-t.branch)+' 星':b.id==='confirmBuild'&&pending?g.validate(pending.x,pending.y,selectedType):'';
  const missing=g.sandbox?0:Math.max(0,Math.ceil(cost-g.gold));b.disabled=!canAct||!!reason||missing>0;
  b.querySelector('.cost-status').textContent=reason||(!canAct?'本場已結束':missing?'還差 '+missing+' 金幣':'◉ '+cost);
 });
}
function costButton(id,label,cost,cls='primary-btn',extra=''){return '<button id="'+id+'" class="'+cls+'" data-cost="'+cost+'" '+extra+'>'+label+'<small class="cost-status">◉ '+cost+'</small></button>';}
function renderPanel(force=false){
 const t=activeTower(),type=t?t.type:selectedType,show=!!t||(!!pending&&type!==null),root=$('#selectionBar');
 $('.tower-dock').classList.toggle('has-selection',show);root.hidden=!show;$('#towerCards').hidden=show;$('#cancelTool').hidden=show;
 const sig=[type,t?.id,t?.level,t?.branch,t?.targetMode,pending?.x,pending?.y,g.phase,g.starTotal,g.blessings.join(',')].join('|');
 if(!force&&sig===panelSig){refreshPanelBudget();return;}panelSig=sig;if(!show){root.innerHTML='';return;}
 const d=TOWERS[type],level=t?.level||1,branch=t?.branch??-1,st=g.stats(t||{type,level,branch});
 let actions='';
 if(t){
  if(level===3&&branch<0)actions=d.branches.map((b,i)=>costButton('branch'+i,'<canvas width="70" height="80" data-sprite="'+type+'" data-level="3" data-branch="'+i+'"></canvas><span><b>'+b[0]+'</b><small>'+b[1]+'</small></span>',g.branchCost(t),'specialize-card','data-branch="'+i+'"')).join('');
  else if((level===5&&type<5||type===5&&level===1)&&!g.canAscend(type,branch))actions='<span class="locked-tier">🔒 突破需 '+g.ascendStars(type,branch)+' 星<small>目前 '+g.starTotal+' 星</small></span>';else if(level<g.maxLevel(type))actions=costButton('upgradeTower',type===5?'進化：星隕聖殿':level===5?'星級突破 Lv.6':'升級 Lv.'+(level+1),g.upgradeCost(t));
  else actions='<span class="max-tier">✦ 最終進化</span>';
  if(branch>=0)actions+=costButton('switchBranch','改為'+d.branches[1-branch][0],50,'small-btn');
  actions+='<button id="sellTower" class="sell-compact" '+(t.loan||!['prep','combat'].includes(g.phase)?'disabled':'')+'>'+(t.loan?'試煉借用':'拆除')+'<small>＋'+Math.floor(t.invested*.75)+'</small></button>';
 }else actions=costButton('confirmBuild','確認建造',d.cost)+'<button id="changeTower" class="small-btn">換塔</button>';
 root.innerHTML='<div class="selected-identity"><canvas width="90" height="100" data-sprite="'+type+'" data-level="'+level+'" data-branch="'+branch+'"></canvas><div><b>'+d.name+' · Lv.'+level+'</b><small>'+(type===5?(level===2?'星隕聖殿':'召星祭壇'):branch>=0?d.branches[branch][0]:level===3?'選擇專精':'基礎')+' · 射程 '+st.range.toFixed(2)+'</small><small class="range-key">實線：目前'+(t&&level<g.maxLevel(type)&&(level!==5||g.canAscend(type,branch))&&!(level===3&&branch<0)?' · 虛線：升級後':'')+'</small></div></div><div class="compact-actions">'+actions+'</div><button id="towerDetails" class="detail-button" aria-label="防禦塔詳細能力">ⓘ</button><button id="closeSelection" class="detail-button" aria-label="取消選取">×</button>';
 root.classList.toggle('choosing-specialty',!!t&&level===3&&branch<0);
 $('#closeSelection').onclick=clearSelection;$('#towerDetails').onclick=()=>openTowerDetails(t||{type,level:1,branch:-1});
 if($('#changeTower'))$('#changeTower').onclick=()=>{selectedType=null;updateUI();};
 if($('#confirmBuild'))$('#confirmBuild').onclick=()=>{const r=g.build(pending.x,pending.y,type);if(r.ok){pending=null;selectedType=null;panelSig='';chirp('build');save();updateUI();}else toast(r.reason);};
 if($('#upgradeTower'))$('#upgradeTower').onclick=()=>{if(g.upgrade(t.id)){chirp('build');save();updateUI();if(t.level===g.maxLevel(type))toast('✦ '+(type===5?'星隕聖殿':d.branches[t.branch][0]+' · 星級突破')+'！');}};
 root.querySelectorAll('[data-branch]').forEach(b=>{if(b.tagName==='BUTTON')b.onclick=()=>{if(g.specialize(t.id,Number(b.dataset.branch))){chirp('build');save();updateUI();}};});
 if($('#switchBranch'))$('#switchBranch').onclick=()=>{if(g.specialize(t.id,1-t.branch)){chirp('build');save();updateUI();}};
 if($('#sellTower'))$('#sellTower').onclick=()=>{const n=g.sell(t.id);if(n){clearSelection();save();toast('已拆除 · 退還 '+n+' 金幣');}};
 drawPortraits();refreshPanelBudget();
}
function openTowerDetails(t){
 const d=TOWERS[t.type],st=g.stats(t);$('#towerDetailTitle').textContent=d.name+' · Lv.'+t.level+(t.branch>=0?' · '+d.branches[t.branch][0]:'');
 $('#towerDetailContent').innerHTML='<div class="detail-layout"><canvas width="180" height="190" data-sprite="'+t.type+'" data-level="'+t.level+'" data-branch="'+t.branch+'"></canvas><div><p>'+d.desc+'</p><div class="detail-stats"><span>'+(t.type===4?'初始每秒傷害':'單次傷害')+'<b>'+st.damage.toFixed(1)+'</b></span><span>射程<b>'+st.range.toFixed(2)+' 格</b></span><span>'+(t.type===4?'光束上限':'攻擊間隔')+'<b>'+(t.type===4?((1+g.beamCap(t)*.5)*100+'%'):st.interval.toFixed(2)+' 秒')+'</b></span></div><p>'+(t.branch>=0?d.branches[t.branch][1]:(t.type===5?'只有兩種型態；單一路線，無專精分支。':'Lv.3 選擇專精；'+g.ascendStars(t.type,t.branch)+' 星解鎖 Lv.6 最終突破。'))+'</p><p>'+TowerEffects.description(t.type,t.branch,t.level)+'</p></div></div>'+(t.id?'<div class="targeting"><small>目標優先</small><div>'+[['first','最前方'],['strongest','最高血量'],['nearest','最近']].map(([mode,label])=>'<button data-target-mode="'+mode+'" aria-pressed="'+(t.targetMode===mode)+'">'+label+'</button>').join('')+'</div></div>':'');
 $('#towerDetailContent').querySelectorAll('[data-target-mode]').forEach(b=>b.onclick=()=>{g.setTargetMode(t.id,b.dataset.targetMode);save();openTowerDetails(t);});drawPortraits();safeDialog('towerDetailDialog');
}

function buildDock(){const cards=$('#towerCards');cards.innerHTML=TOWERS.map((t,i)=>'<button class="tower-card" data-type="'+i+'" aria-label="選擇'+t.name+'，花費'+t.cost+'金幣"><span class="key">'+(i+1)+'</span><canvas width="100" height="110" data-sprite="'+i+'"></canvas><span><b>'+t.name+'</b><small>◉ '+t.cost+'</small></span></button>').join('');cards.querySelectorAll('button').forEach(b=>b.onclick=()=>chooseType(Number(b.dataset.type)));drawPortraits();}
function chooseType(type){if(!g.sandbox&&!g.towerAccess[type]){toast(type===5?'通過第9關後，完成星隕試煉解鎖':'通過第'+Progression.requirements[type]+'關解鎖'+TOWERS[type].name);return;}selectedType=type;selectedId=null;updateUI();}
function updateUI(){auto=g.autoNext;$('#auto').checked=auto;$('#viewBlessings').textContent='✦ 本局祝福（'+g.blessings.length+'）';const d=g.def;$('#hp').innerHTML=g.hp+'<em>/'+g.maxHp()+'</em>';$('#gold').textContent=g.sandbox?'∞':Math.floor(g.gold);$('#wave').innerHTML=g.wave+'<em>/'+(g.endless?'∞':d.waves)+'</em>';$('#stageName').textContent=d.name;$('#stageDesc').textContent=d.desc;$('#modeTag').textContent=d.tag+(g.endless?' · 無盡':'')+(g.sandbox?' · 沙盒':'');$('#battleStatus').textContent=g.phase==='won'?'防守成功 · 星花城堡安然無恙':g.phase==='lost'?'防守結束 · 再試一種布局吧':g.phase==='combat'?'防守中 · '+(g.enemies.length+g.queue.length)+' 隻敵人尚未擊退':g.wave===0?'準備階段 · 點空白格召喚防禦塔':'第'+g.wave+'波完成 · 調整布局，迎接下一波';$('#pauseOverlay').hidden=true;if(paused&&!homeActive)$('#battleStatus').textContent='Ⅱ 已暫停 · 仍可建造、升級與拆除';$('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-label',paused?'繼續':'暫停');$('#speed').textContent=speed+'×';$('#routeToggle').classList.toggle('active',routeVisible);document.querySelectorAll('.tower-card').forEach((b,i)=>{b.classList.toggle('active',selectedType===i&&!selectedId);const locked=!g.sandbox&&!g.towerAccess[i];b.classList.toggle('locked',locked);b.querySelector('small').textContent=locked?'🔒 '+(i===5?'完成試煉':'通過第'+Progression.requirements[i]+'關'):'◉ '+TOWERS[i].cost;b.style.opacity=locked||!g.sandbox&&g.gold<TOWERS[i].cost?'.55':'1';});let max=!g.endless&&g.wave>=d.waves;$('#nextLabel').textContent=max?'最後一波':('下一波 · 第'+(g.wave+1)+'波');$('#nextInfo').textContent=max?(g.phase==='won'?'防守完成':g.phase==='lost'?'城堡失守':'守住最後的星光！'):g.waveSpec().map(q=>ENEMIES[q.type].name+' × '+q.count).join('、');const b=$('#startWave');b.disabled=!g.canStartWave();b.innerHTML=g.phase==='combat'?'提前開波 <span>＋10</span>':'第'+(g.wave+1)+'波 <span>▶</span>';b.setAttribute('aria-label',g.phase==='combat'?'提前開始下一波，獲得10金幣':'開始第'+(g.wave+1)+'波');if(auto&&g.wave>0&&g.phase==='prep'&&g.canStartWave())b.innerHTML='下一波 '+Math.max(1,Math.ceil(3-g.autowait))+' 秒 <span>▶</span>';if(max)b.textContent=g.phase==='combat'?'最後一波防守中':'防守已結束';renderPanel();let t=activeTower();if(t?.type===4&&$('#beamFill')){const cap=g.beamCap(t);$('#beamFill').style.width=(t.charge/cap*100)+'%';$('#beamCaption').textContent='光束強度 '+Math.round((1+t.charge*.5)*100)+'%'+(t.target?' · 鎖定中':' · 等待目標');}
if(!homeActive&&g.blessingOffers.length&&g.phase!=='lost'){showBlessing();return;}if(!homeActive&&(g.phase==='won'||g.phase==='lost')&&!seenResult){seenResult=true;finish();}}
let blessingSignature='';
function blessingStage(b,n){return b.type===-2&&b.id!=='vitality'?'已領取 '+n+' 次':'第 '+n+' 層'+(Number.isFinite(b.cap)?'／'+b.cap:' · 可持續累積');}
function nextBlessingText(){if(g.blessingOffers.length)return '有祝福尚未選擇';if(g.endless){let w=g.def.waves+5;while(g.completed.includes(w)||g.blessingMilestones.includes(w))w+=5;return '下次祝福：完成第 '+w+' 波';}const w=[3,6,9,12].find(w=>!g.completed.includes(w)&&!g.blessingMilestones.includes(w));return w?'下次祝福：完成第 '+w+' 波':'通關後可繼續無盡挑戰，每完成5波再選祝福';}
function renderBlessingList(){$('#ownedBlessingLead').textContent=nextBlessingText();const owned=BLESSINGS.filter(b=>g.hasBlessing(b.id));$('#ownedBlessingList').innerHTML=owned.length?owned.map(b=>{const n=g.blessingCount(b.id),instant=b.id==='gold'||b.id==='castle';return '<article><span class="owned-icon">'+b.icon+'</span><div><h3>'+b.name+' <small>'+blessingStage(b,n)+'</small></h3><p>'+(instant?(b.id==='gold'?'金幣已直接加入持有金幣。':'生命已在取得時恢復；不會持續回血。'):g.blessingText(b.id,n))+'</p></div></article>';}).join(''):'<p class="empty-mini">尚未獲得祝福。完成第3波即可選擇第一份祝福。</p>';}
$('#viewBlessings').onclick=()=>setToolsTab('blessings');
function showBlessing(){if(portraitMode.matches||document.querySelector('dialog[open]:not(#blessingDialog)'))return;const offer=g.blessingOffers[0],sig=JSON.stringify([offer,g.blessings]);if(sig!==blessingSignature){blessingSignature=sig;$('#blessingLead').textContent='第 '+offer.wave+' 波完成 · '+(offer.wave>g.def.waves?'無盡祝福 · ':'')+'選擇一項';$('#blessingCards').innerHTML=offer.choices.map(id=>{const b=BLESSINGS.find(b=>b.id===id),n=g.blessingCount(id),count=g.towers.filter(t=>b.type===-1||t.type===b.type).length;return '<button class="blessing-card" data-blessing="'+id+'"><span class="blessing-icon">'+b.icon+'</span><strong>'+b.name+'</strong><span class="blessing-tier">'+(n?'已取得'+n+'次 → ':'')+blessingStage(b,n+1)+'</span><span class="blessing-description">'+g.blessingText(id,n+1,offer.wave)+'</span><small>'+(b.type>=-1?'目前 '+count+' 座塔受益 · 新建也有效':id==='gold'?'立即領取金幣':'目前生命 '+g.hp+'／'+g.maxHp())+'</small><b class="choose-blessing">選擇這份祝福 ✦</b></button>';}).join('');$('#blessingCards').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(g.chooseBlessing(b.dataset.blessing)){const gift=BLESSINGS.find(x=>x.id===b.dataset.blessing);$('#blessingDialog').close();blessingSignature='';panelSig='';save();toast('✦ 已獲得「'+gift.name+'」');updateUI();}});save();}safeDialog('blessingDialog');}
$('#blessingDialog').addEventListener('cancel',e=>e.preventDefault());
$('#continueEndless').onclick=()=>{if(g.continueEndless()){$('#resultDialog').close();seenResult=false;paused=false;save();updateUI();toast('∞ 無盡挑戰開始 · 帶著祝福繼續守護');}};
function finish(){
 const win=g.phase==='won',reward=Campaign.settle(g,stars);Progression.bind(g,stars);
 $('#resultTag').textContent=g.endless?'ENDLESS RECORD':win?'STAGE CLEAR':'TRY AGAIN';
 $('#resultStars').textContent=reward?'★'.repeat(reward.earned)+'☆'.repeat(3-reward.earned):win?'✦':'☾';
 $('#resultTitle').textContent=g.endless?'無盡挑戰完成':win?'星光守住了！':'再試一種魔法布局吧';
 $('#resultText').textContent=(g.sandbox?'沙盒練習 · ':'')+'完成 '+g.cleared+' 波 · 本場分數 '+g.score().toLocaleString()+' · 擊殺 '+g.kills+' 隻 · 剩餘 '+g.hp+' 生命。';
 $('#resultRewards').innerHTML=reward?.trial?'<b>星隕試煉完成！召星祭壇已解鎖。</b><p>試煉不提供主線星星。</p>':reward?'<b>'+(reward.best===3?'本關星星獎勵已全部取得':'本次獎勵已結算，重玩可挑戰更高星等')+'</b><p>新增 '+reward.added+' 星 · 累積 '+reward.total+'／36 星</p>'+reward.unlocks.map(i=>'<div class="unlock-celebrate">✦ 已解鎖：'+Campaign.label(i)+'</div>').join(''):g.map===3?'自由迷宮不提供闖關星星。':g.endless?'無盡只累積分數與最高波次，不提供額外星星或永久解鎖獎勵。':'本次未取得星星，再挑戰一次吧。';
 $('#continueEndless').hidden=!win||g.trial;$('#endlessHint').hidden=!win||g.trial;$('#endlessHint').textContent='本次獎勵已結算。無盡不再獲得星星；保留金幣、塔與祝福，挑戰更高分數。';
 $('#resultMenu').textContent='返回選關';const next=Campaign.storyIds[Campaign.storyIds.indexOf(g.map)+1];
 $('#nextStage').hidden=!win||g.trial||g.map===3||next===undefined||g.sandbox;$('#nextStage').onclick=()=>askNew(next,false);
 save();safeDialog('resultDialog');
}
function reset(map,sandbox=false,trial=false){enterBattle();hasSave=true;g=Progression.bind(new Game(map,sandbox,Campaign.total(stars)),stars);if(map===Campaign.storyIds[8]&&trial){Progression.startTrial(g);}g.seed=crypto.getRandomValues(new Uint32Array(1))[0];camera.reset();syncCamera();selectedType=null;selectedId=null;pending=null;hover=null;fx=[];paused=false;seenResult=false;auto=true;$('#auto').checked=true;closeBattleTools();panelSig='';$('#boardScroll').classList.remove('zoomed');$('#zoom').textContent='⊕ 縮放';['menuDialog','confirmDialog','resultDialog','blessingDialog','ownedBlessingDialog'].forEach(i=>$('#'+i).close());save();updateUI();toast('點空白格選塔 · 固定全圖，隨時掌握戰況');}
function askNew(map,sandbox,trial=false){if(!Campaign.unlocked(stars,map)){toast('請先通過上一關');return;}replaceAction=()=>reset(map,sandbox,trial);if(g.wave===0&&g.towers.length===0||g.phase==='won'||g.phase==='lost'){replaceAction();return;}$('#menuDialog').close();$('#resultDialog').close();safeDialog('confirmDialog');}
function openMenu(){menuMode=g.map===3?'maze':'story';renderMenu();safeDialog('menuDialog');save();}
function renderMenu(){$('#resume').hidden=!hasSave;$('#resetGame').hidden=!hasSave;$('#storyTab').classList.toggle('active',menuMode==='story');$('#mazeTab').classList.toggle('active',menuMode==='maze');let r=$('#mapChoices');if(menuMode==='story'){const total=Campaign.total(stars),thresholds=Progression.rewards.map(r=>r.stars),next=thresholds.findIndex(n=>total<n);
 r.innerHTML='<section class="star-progress"><div><b>✦ '+total+'／36 星</b><span>'+(next>=0?'下一個：'+Campaign.label(next)+' · '+total+'／'+thresholds[next]+' 星':'星願守護者・全部獎勵已解鎖')+'</span></div><div class="unlock-track">'+thresholds.map((n,i)=>'<span class="'+(total>=n?'unlocked':'')+'">'+(total>=n?'✓ ':'🔒 ')+Progression.rewards[i].name+' '+n+'★</span>').join('')+'</div></section><div class="chapter-tabs">'+Campaign.chapters.map((name,i)=>'<button data-chapter="'+i+'" class="'+(menuChapter===i?'active':'')+'">'+(i+1)+'. '+name+'</button>').join('')+'</div>'+
 Campaign.storyIds.slice(menuChapter*3,menuChapter*3+3).map(id=>{const m=MAPS[id],n=Campaign.starsAt(stars,id),locked=!Campaign.unlocked(stars,id);return '<button class="map-card" data-map="'+id+'" '+(locked?'disabled':'')+'><span class="map-badge">'+(locked?'🔒':m.icon)+'</span><span><h3>'+String(m.storyNumber).padStart(2,'0')+' · '+m.name+'</h3><p>'+m.desc+'<br>★ 挑戰：'+Progression.tasks[m.storyNumber-1]+'<br>'+m.waves+' 波 · '+(m.points.length>1?'雙入口':'單入口')+(locked?' · 通過上一關解鎖':' · 無盡最佳：'+(bestWaves[id]||'—'))+'</p></span><span class="stars">'+'★'.repeat(n)+'☆'.repeat(3-n)+'</span></button>';}).join('')+'<p class="story-progress">通關開放下一關 · 通關、80%生命、挑戰任務可分次集星 · 星星永久解鎖、不消耗</p>';
 if(Progression.cleared(stars,9)){r.insertAdjacentHTML('beforeend','<button id="meteorTrial" class="primary-btn">🌠 星隕試煉 · '+(stars._trial?'再次挑戰':'10波解鎖召星祭壇')+'</button>');$('#meteorTrial').onclick=()=>{askNew(Campaign.storyIds[8],false,true);};}r.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>askNew(Number(b.dataset.map),false));r.querySelectorAll('[data-chapter]').forEach(b=>b.onclick=()=>{menuChapter=Number(b.dataset.chapter);renderMenu();});}else{r.innerHTML='<div class="game-settings"><button id="survivalChoice" class="small-btn '+(!sandboxChoice?'active':'')+'">生存挑戰 · 有限金幣</button><button id="sandboxChoice" class="small-btn '+(sandboxChoice?'active':'')+'">沙盒練習 · 無限金幣</button></div><button class="map-card" id="mazeChoice"><span class="map-badge">▦</span><span><h3>自由迷宮 · 16 × 10</h3><p>固定左右出入口，其餘自由蓋塔。<br>20波 · 自動尋路 · 可隨時改路<br>無盡最佳：'+(bestWaves[3]?'第 '+bestWaves[3]+' 波':'尚未挑戰')+'</p></span><span class="stars">→</span></button><p class="story-progress">迷宮允許上下左右通行；放塔前會顯示新路線。自由迷宮與沙盒皆不提供闖關星星。</p>';$('#survivalChoice').onclick=()=>{sandboxChoice=false;renderMenu();};$('#sandboxChoice').onclick=()=>{sandboxChoice=true;renderMenu();};$('#mazeChoice').onclick=()=>askNew(3,sandboxChoice);}}
function boardPoint(ev){const r=canvas.getBoundingClientRect();return {x:Math.floor(((ev.clientX-r.left-view.x)/view.scale-OX)/S),y:Math.floor(((ev.clientY-r.top-view.y)/view.scale-OY)/S)};}
function clearSelection(){selectedType=null;selectedId=null;pending=null;hover=null;updateUI();}
function tapBoard(e){const p=boardPoint(e);if(p.x<0||p.x>=COLS||p.y<0||p.y>=ROWS){clearSelection();return;}const t=g.towers.find(t=>t.x===p.x&&t.y===p.y);if(t){selectedId=t.id;selectedType=t.type;pending=null;}else if(pending||selectedId){clearSelection();return;}else{const reason=g.validate(p.x,p.y,selectedType??0,true);if(reason){toast(reason);return;}selectedId=null;pending=p;}updateUI();}
const pointers=new Map();let gesture=null;
function pinchState(){const a=[...pointers.values()];return {x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.max(1,Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y))};}
canvas.addEventListener('pointerdown',e=>{if(homeActive||portraitMode.matches)return;canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY,moved:false,multi:false};if(pointers.size>=2){gesture.multi=true;gesture.pinch=pinchState();}hover=null;});
canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId)){if(e.pointerType==='mouse')hover=boardPoint(e);return;}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size>=2){const q=pinchState(),prev=gesture.pinch;camera.zoomAt(camera.zoom*q.d/prev.d,prev.x,prev.y);camera.pan(q.x-prev.x,q.y-prev.y);gesture.pinch=q;gesture.moved=true;syncCamera();}else{if(Math.hypot(e.clientX-gesture.startX,e.clientY-gesture.startY)>8)gesture.moved=true;if(gesture.moved){camera.pan(e.clientX-gesture.x,e.clientY-gesture.y);syncCamera();}gesture.x=e.clientX;gesture.y=e.clientY;}});
function releasePointer(e,cancel=false){if(!pointers.has(e.pointerId))return;const tap=!cancel&&gesture&&!gesture.moved&&!gesture.multi;pointers.delete(e.pointerId);if(pointers.size===0){gesture=null;if(tap)tapBoard(e);}else{const p=[...pointers.values()][0];gesture.x=p.x;gesture.y=p.y;if(pointers.size>=2)gesture.pinch=pinchState();}}
canvas.addEventListener('pointerup',e=>releasePointer(e));canvas.addEventListener('pointercancel',e=>releasePointer(e,true));canvas.addEventListener('lostpointercapture',e=>releasePointer(e,true));canvas.addEventListener('pointerleave',()=>hover=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();camera.zoomAt(camera.zoom*Math.exp(-e.deltaY*.0015),e.clientX,e.clientY);syncCamera();},{passive:false});
function syncCamera(){view.scale=camera.scale;view.x=camera.x;view.y=camera.y;$('#zoomLevel').textContent=Math.round(camera.zoom*100)+'%';$('#zoomOut').disabled=camera.zoom<=1;$('#zoomIn').disabled=camera.zoom>=3;positionPanel();}
function positionPanel(){}
$('#zoomIn').onclick=()=>{camera.zoomAt(camera.zoom+.35,innerWidth/2,innerHeight/2);syncCamera();};$('#zoomOut').onclick=()=>{camera.zoomAt(camera.zoom-.35,innerWidth/2,innerHeight/2);syncCamera();};$('#resetView').onclick=()=>{camera.reset();syncCamera();};
$('#cancelTool').onclick=()=>{selectedType=null;selectedId=null;pending=null;updateUI();};$('#pause').onclick=()=>{paused=!paused;save();updateUI();};$('#speed').onclick=()=>{speed=speed===3?1:speed+1;updateUI();};$('#auto').onchange=e=>{g.autoNext=auto=e.target.checked;g.autowait=0;save();updateUI();};$('#startWave').onclick=()=>{if(g.startWave()){save();updateUI();}};$('#routeToggle').onclick=()=>{routeVisible=!routeVisible;updateUI();};$('#zoom').onclick=()=>{const z=$('#boardScroll').classList.toggle('zoomed');$('#zoom').textContent=z?'⊖ 縮小':'⊕ 縮放';};$('#fullscreen').onclick=()=>{if(document.fullscreenElement){document.exitFullscreen?.();}else if(document.documentElement.requestFullscreen){document.documentElement.requestFullscreen().catch(()=>toast('此瀏覽器暫不支援全螢幕'));}else toast('可將遊戲加入手機主畫面，取得更大的畫面');};$('#sound').onclick=()=>{sound=!sound;$('#sound').setAttribute('aria-label',sound?'關閉音效':'開啟音效');$('#sound .off-dot').style.display=sound?'none':'block';chirp('build');};$('#menuHelp').onclick=()=>{$('#menuDialog').close();safeDialog('helpDialog');};$('#menuSound').onclick=()=>{$('#sound').click();$('#menuSound').innerHTML='<span class="menu-button-icon" aria-hidden="true">♫</span><span>音效：'+(sound?'開啟':'關閉')+'</span>';$('#menuSound').setAttribute('aria-pressed',String(sound));};$('#help').onclick=()=>safeDialog('helpDialog');$('#menu').onclick=openMenu;$('#brandHome').onclick=e=>{e.preventDefault();openMenu();};$('#storyTab').onclick=()=>{menuMode='story';renderMenu();};$('#mazeTab').onclick=()=>{menuMode='maze';renderMenu();};$('#resume').onclick=()=>$('#menuDialog').close();$('#resetGame').onclick=()=>askNew(g.map,g.sandbox);$('#confirmNew').onclick=()=>replaceAction?.();$('#retry').onclick=()=>reset(g.map,g.sandbox,g.trial);$('#resultMenu').onclick=()=>{$('#resultDialog').close();openMenu();};document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).close());document.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement||document.querySelector('dialog[open]')||homeActive||portraitMode.matches)return;if(e.key>='1'&&e.key<='6')chooseType(Number(e.key)-1);if(e.code==='Space'){e.preventDefault();if(paused){paused=false;updateUI();}else openBattleTools();}if(e.key==='Escape'){pending=null;selectedId=null;selectedType=null;updateUI();}});document.addEventListener('visibilitychange',()=>{if(document.hidden){paused=true;save();updateUI();}});window.addEventListener('pagehide',save);setInterval(save,3000);
// Rendering: orthogonal square ground; upright artwork provides 2.5D depth.
function rounded(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.stroke();}}
function point(n){let [x,y]=xy(n);return [OX+(x+.5)*S,OY+(y+.5)*S];}
function hash(x,y){let v=Math.sin(x*127.1+y*311.7)*43758.5453;return v-Math.floor(v);}
function flower(x,y,r,color='#fffbdf'){ctx.save();ctx.translate(x,y);ctx.fillStyle=color;for(let k=0;k<5;k++){let a=k*Math.PI*2/5;ctx.beginPath();ctx.ellipse(Math.cos(a)*r*.65,Math.sin(a)*r*.65,r*.55,r*.42,a,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#e2c16f';ctx.beginPath();ctx.arc(0,0,r*.28,0,Math.PI*2);ctx.fill();ctx.restore();}
function tree(x,y,size){ctx.fillStyle='#789a62';rounded(ctx,x-size*.09,y,size*.18,size*.3,4,'#8d9970');ctx.fillStyle='#73996c';for(let [dx,dy,r]of [[0,-.6,.4],[-.28,-.3,.34],[.28,-.28,.33],[0,-.15,.38]]){ctx.beginPath();ctx.arc(x+dx*size,y+dy*size,r*size,0,Math.PI*2);ctx.fill();}ctx.fillStyle='#8eac75';for(let [dx,dy,r]of [[-.12,-.62,.3],[-.3,-.35,.24],[.19,-.4,.28],[0,-.2,.26]]){ctx.beginPath();ctx.arc(x+dx*size,y+dy*size,r*size,0,Math.PI*2);ctx.fill();}}
let bg=document.createElement('canvas'),bgMap=-1;bg.width=W;bg.height=H;
function terrainFlower(c,x,y,r,color='#fffbdf'){c.save();c.translate(x,y);for(let j=0;j<5;j++){let a=j*Math.PI*2/5;c.fillStyle=color;c.beginPath();c.ellipse(Math.cos(a)*r*.6,Math.sin(a)*r*.6,r*.52,r*.4,a,0,Math.PI*2);c.fill();}c.fillStyle='#e8bc55';c.beginPath();c.arc(0,0,r*.25,0,7);c.fill();c.restore();}
function stonePath(c){
 // The road follows the real simulation cells; no decorative painted shortcut.
 c.save();c.strokeStyle='#62874977';c.lineWidth=68;c.lineCap='square';c.lineJoin='round';
 for(const route of g.routes){c.beginPath();route.forEach((p,i)=>{let x=OX+(p[0]+.5)*S,y=OY+(p[1]+.5)*S;i?c.lineTo(x,y):c.moveTo(x,y);});c.stroke();}
 for(const n of g.road){let [x,y]=xy(n),px=OX+x*S,py=OY+y*S;c.fillStyle='#d7c69b';c.fillRect(px,py,S,S);
  // Individually shaded cobbles, with irregular joints and moss between stones.
  for(let j=0;j<4;j++)for(let k=0;k<4;k++){let dx=px+k*16+(j%2?5:0)-3,dy=py+j*16+2,ww=13+hash(x+k,y+j)*3,hh=10+hash(y+k,x+j)*3;
   c.save();c.beginPath();c.rect(px,py,S,S);c.clip();c.lineWidth=.8;rounded(c,dx,dy+1.5,ww,hh,3,'#ae9e7b');rounded(c,dx,dy,ww,hh,3,['#f0e3c4','#e7d8b6','#eedebe','#e1d3ad'][Math.floor(hash(x*4+k,y*4+j)*4)],'#c2b28b');c.strokeStyle='#fff5d499';c.beginPath();c.moveTo(dx+3,dy+2);c.lineTo(dx+ww-3,dy+2);c.stroke();c.restore();}
  for(let j=0;j<2;j++){let xx=px+hash(x+j,12+y)*S,yy=py+hash(y+j,12+x)*S;c.fillStyle='#8fae6860';c.beginPath();c.ellipse(xx,yy,3.2,1.8,hash(j,x)*3,0,7);c.fill();}
 }
 c.restore();
}
function sceneryFits(x,y,w,h){for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){if(i<0||j<0||i>=COLS||j>=ROWS)return false;let n=key(i,j);if(g.buildable.has(n)||g.road.has(n)||g.entries.includes(n)||n===g.exit)return false;}return true;}
function background(){const c=bg.getContext('2d');c.clearRect(0,0,W,H);c.fillStyle='#b5d277';c.fillRect(0,0,W,H);
 if(landscape.complete&&landscape.naturalWidth){c.drawImage(landscape,0,0,W,H);c.drawImage(landscape,190,145,1155,640,OX,OY,COLS*S,ROWS*S);}
 else {const grad=c.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#b6d682');grad.addColorStop(1,'#8dbf6d');c.fillStyle=grad;c.fillRect(0,0,W,H);}
 // Blend the grass into the full-screen landscape before drawing crisp grid/roads.
 c.save();c.globalCompositeOperation='destination-in';const edge=c.createLinearGradient(OX,0,OX+COLS*S,0);edge.addColorStop(0,'#0000');edge.addColorStop(.035,'#000');edge.addColorStop(.965,'#000');edge.addColorStop(1,'#0000');c.fillStyle=edge;c.fillRect(0,0,W,H);const vertical=c.createLinearGradient(0,OY,0,OY+ROWS*S);vertical.addColorStop(0,'#0000');vertical.addColorStop(.045,'#000');vertical.addColorStop(.955,'#000');vertical.addColorStop(1,'#0000');c.fillStyle=vertical;c.fillRect(0,0,W,H);c.restore();
 // Low-opacity square overlay retains the painted grass and makes every cell exact.
 c.save();c.beginPath();c.rect(OX,OY,COLS*S,ROWS*S);c.clip();
 for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let n=key(x,y),px=OX+x*S,py=OY+y*S;if(g.road.has(n))continue;
  c.fillStyle=g.buildable.has(n)?((x+y)%2?'#fffbe718':'#416c4109'):'#315f311c';c.fillRect(px,py,S,S);
  c.strokeStyle=g.map===3?'#487e3f42':g.buildable.has(n)?'#6c95585b':'#5b854022';c.lineWidth=1;c.strokeRect(px+.5,py+.5,S,S);
  if(g.buildable.has(n)&&g.map!==3){c.fillStyle='#c8dfa875';c.strokeStyle='#73995165';c.lineWidth=1;rounded(c,px+8,py+8,S-16,S-16,7,'#eff5be15','#7ca25355');c.beginPath();c.arc(px+32,py+32,3.5,0,7);c.fill();c.stroke();}
 }
 if(g.routes)stonePath(c);
 c.restore();
 // Frames made of small stones, rather than a heavy checkerboard panel.
 c.save();c.lineWidth=2;rounded(c,OX-3,OY-3,COLS*S+6,ROWS*S+6,6,null,'#628b4399');c.strokeStyle='#e9f2be77';c.lineWidth=1;rounded(c,OX-5,OY-5,COLS*S+10,ROWS*S+10,7,null,'#e9f2be77');c.restore();
 // Environmental objects occupy only non-buildable land in story maps.
 if(g.routes){const used=new Set();for(let y=0;y<ROWS-1;y++)for(let x=0;x<COLS-1;x++){let n=key(x,y);if(used.has(n)||!sceneryFits(x,y,2,2)||hash(x+g.map*4,y)<.24)continue;
   for(let j=y;j<y+2;j++)for(let i=x;i<x+2;i++)used.add(key(i,j));let i=g.map===1?6:g.map===2?(hash(x,y)>.5?3:5):(hash(x,y)>.6?2:4);
   prop(c,i,OX+x*S+5,OY+y*S+4,S*2-10,S*2-8);
  }
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){let n=key(x,y);if(used.has(n)||!sceneryFits(x,y,1,1)||hash(x,y)<.87)continue;prop(c,hash(x+2,y)>.65?5:4,OX+x*S+7,OY+y*S+6,S-14,S-10,.95);}
 }
 // Theme-specific border details: water garden, blossoms, and forest lanterns.
 if(g.map===1){prop(c,6,355,H-103,175,112);prop(c,7,820,6,120,80);}else if(g.map===2){prop(c,3,260,-15,115,125);prop(c,3,760,H-115,125,130);prop(c,5,1000,0,90,96);}else {prop(c,7,410,8,110,77);prop(c,4,850,H-80,120,76);}
 // Never place decorative obstacles on the free maze grid.
 for(const n of [...g.entries,g.exit]){let [x,y]=point(n);c.strokeStyle='#b0a477';c.lineWidth=44;c.lineCap='round';c.beginPath();if(n===g.exit){c.moveTo(x,y);c.lineTo(W-72,y);}else {c.moveTo(66,y);c.lineTo(x,y);}c.stroke();c.strokeStyle='#e8d7b3';c.lineWidth=38;c.stroke();}
 bgMap=g.map;
}
function gate(n,exit,time){let [x,y]=point(n);const gx=innerHeight<=600&&innerWidth>=640?x:exit?W-64:64;ctx.save();
 const glow=ctx.createRadialGradient(gx,y-22,5,gx,y-22,70);glow.addColorStop(0,exit?'#ffe8a368':'#ccacff75');glow.addColorStop(1,'#ffffff00');ctx.fillStyle=glow;ctx.fillRect(gx-72,y-94,144,150);
 if(scenery.complete&&scenery.naturalWidth){if(exit&&g.royalCastle&&rewardCastle.naturalWidth)ctx.drawImage(rewardCastle,...ArtManifest.castle.crops[0],gx-57,y-112,114,132);else if(exit)prop(ctx,0,gx-60,y-118,120,137);else prop(ctx,1,gx-52,y-98,104,116);}
 else {ctx.fillStyle=exit?'#f0d8a7':'#9d7ac8';rounded(ctx,gx-30,y-54,60,70,20,ctx.fillStyle,'#688353');}
 ctx.fillStyle='#fff9e9';ctx.strokeStyle=exit?'#9f9569':'#837199';ctx.lineWidth=1;rounded(ctx,gx-24,y+23,48,17,8,'#fff9e9e8',ctx.strokeStyle);ctx.fillStyle=exit?'#8e8158':'#8a729d';ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(exit?'城堡':'入口',gx,y+35);
 // A small rune marks the exact entrance/exit tile center.
 ctx.strokeStyle=exit?'#f8efbb99':'#e0c4ff88';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,17,8,0,0,7);ctx.stroke();ctx.restore();}
function ambient(time){ctx.save();
 // Falling petals and tiny fireflies stay in the margins, away from cell selection.
 for(let j=0;j<15;j++){const side=j%2,xx=side?W-105+hash(j,7)*100:hash(j,4)*112,yy=((time*(5+j%3)+hash(j,9)*H)%H);ctx.globalAlpha=.25+Math.sin(time*1.8+j)*.2;ctx.fillStyle=j%3?'#fff9d2':'#ffd0db';ctx.beginPath();ctx.ellipse(xx+Math.sin(time+j)*9,yy,2+j%2,3+j%2,time*.3+j,0,7);ctx.fill();}
 // A soft shimmer along the stream at the lower left.
 ctx.globalAlpha=.2;ctx.strokeStyle='#f4ffff';ctx.lineWidth=2;for(let j=0;j<4;j++){let x=25+j*56,y=H-38+Math.sin(time*1.6+j)*4;ctx.beginPath();ctx.ellipse(x,y,10+j*2,2,0,0,7);ctx.stroke();}ctx.restore();}
function routeLine(path,time,color='#79c7b2',alpha=.6){if(path.length<2)return;ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash([5,11]);ctx.lineDashOffset=-time*12;ctx.beginPath();path.forEach((n,i)=>{let [x,y]=point(n);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();ctx.setLineDash([]);for(let i=4;i<path.length-1;i+=6){let [x,y]=point(path[i]),[nx,ny]=point(path[i+1]);ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(ny-y,nx-x));ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(-4,-4);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.restore();}ctx.restore();}
function draw(time){ctx.setTransform(view.dpr,0,0,view.dpr,0,0);ctx.clearRect(0,0,innerWidth,innerHeight);if(landscape.complete&&landscape.naturalWidth){const cover=Math.max(innerWidth/landscape.width,innerHeight/landscape.height);ctx.drawImage(landscape,(innerWidth-landscape.width*cover)/2,(innerHeight-landscape.height*cover)/2,landscape.width*cover,landscape.height*cover);}ctx.setTransform(view.dpr*view.scale,0,0,view.dpr*view.scale,view.x*view.dpr,view.y*view.dpr);if(bgMap!==g.map)background();ctx.drawImage(bg,OX,OY,COLS*S,ROWS*S,OX,OY,COLS*S,ROWS*S);ambient(time);if(routeVisible){if(g.routes)g.routes.forEach(p=>routeLine(p.map(a=>key(...a)),time,'#a08b58',.55));else routeLine(g.pathPreview(),time,'#ddfff1',.9);}
let t=activeTower(),preview=pending||hover;if(pending&&selectedType===null)highlight(pending.x,pending.y,'#fff3ad');if(t){if(t.level<g.maxLevel(t.type)&&(t.level!==5||g.canAscend(t.type,t.branch))&&!(t.level===3&&t.branch<0))range(t.x,t.y,g.stats({...t,level:t.level+1}).range,'#ffe9a0',true);range(t.x,t.y,g.stats(t).range,t.branch>=0?branchColor(t.type,t.branch):TOWERS[t.type].color);highlight(t.x,t.y,'#fff4b0');}else if(preview&&selectedType!==null&&preview.x>=0&&preview.x<COLS&&preview.y>=0&&preview.y<ROWS){const reason=g.validate(preview.x,preview.y,selectedType),color=reason?'#d58b7d':TOWERS[selectedType].color;range(preview.x,preview.y,g.stats({type:selectedType,level:1,branch:-1}).range,color);highlight(preview.x,preview.y,color);if(pending&&g.map===3&&!reason)routeLine(g.pathPreview(key(preview.x,preview.y)),time,'#fff8d4',1);if(pending){let [px,py]=point(key(preview.x,preview.y));drawTowerSprite(selectedType,px,py,.45,1);}}
for(const n of g.entries)gate(n,false,time);gate(g.exit,true,time);
const entities=[...g.towers.map(t=>({y:t.y+.4,t})),...g.enemies.map(e=>({y:e.y+.45,e}))].sort((a,b)=>a.y-b.y);
for(const o of entities){if(o.t){let t=o.t,[x,y]=point(key(t.x,t.y));drawTowerSprite(t.type,x,y,activeTower()&&activeTower().id!==t.id&&activeTower().x===t.x&&activeTower().y===t.y-1?.45:1,t.level,t.branch);if(selectedId===t.id){ctx.fillStyle='#fffdf1';ctx.strokeStyle=TOWERS[t.type].color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+20,y+13,9,0,7);ctx.fill();ctx.stroke();ctx.fillStyle=TOWERS[t.type].color;ctx.font='bold 10px system-ui';ctx.textAlign='center';ctx.fillText(t.level,x+20,y+17);}}else drawEnemy(o.e,time);}
for(const f of g.fields){const x=OX+(f.x+.5)*S,y=OY+(f.y+.5)*S;ctx.save();ctx.fillStyle='#ef69372a';ctx.strokeStyle='#ffb85a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,f.r*S,f.r*S*.6,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
for(const t of g.towers){if(t.type!==4||!t.target)continue;const e=g.enemies.find(e=>e.id===t.target);if(!e)continue;const [x,y]=point(key(t.x,t.y));TowerEffects.beam(ctx,{...t,x,y:y-31,tx:OX+(e.x+.5)*S,ty:OY+(e.y+.5)*S-8},time,simpleEffects);}
for(let i=fx.length-1;i>=0;i--){let f=fx[i],p=(time-f.born)/f.duration;if(p>=1){fx.splice(i,1);continue;}if(p<0)continue;drawFx(f,p,time);}
}

function range(x,y,r,color,upgrade=false){
 const [px,py]=point(key(x,y)),radius=r*S;ctx.save();const unit=1/view.scale;
 ctx.beginPath();ctx.arc(px,py,radius,0,Math.PI*2);
 if(!upgrade){ctx.fillStyle=color+'32';ctx.fill();}
 ctx.strokeStyle='#24483daa';ctx.lineWidth=(upgrade?4:5)*unit;ctx.setLineDash(upgrade?[8*unit,6*unit]:[]);ctx.stroke();
 ctx.strokeStyle=upgrade?'#ffe9a0':'#fffde5';ctx.lineWidth=(upgrade?2:2.5)*unit;ctx.stroke();
 if(!upgrade&&!simpleEffects){ctx.setLineDash([]);for(let j=0;j<8;j++){const a=last*.18+j*Math.PI/4;ctx.fillStyle=color;ctx.strokeStyle='#fff';ctx.lineWidth=unit;ctx.beginPath();ctx.arc(px+Math.cos(a)*radius,py+Math.sin(a)*radius,3*unit,0,7);ctx.fill();ctx.stroke();}}
 ctx.restore();
}

function highlight(x,y,color){ctx.save();ctx.lineWidth=3;rounded(ctx,OX+x*S+2,OY+y*S+2,S-4,S-4,5,color+'25',color);ctx.restore();}
function drawTowerSprite(type,x,y,alpha=1,level=1,branch=-1){ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#536b3b25';ctx.beginPath();ctx.ellipse(x,y+16,24,9,0,0,7);ctx.fill();if(branch>=0){ctx.strokeStyle=branchColor(type,branch)+'b0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+13,26,11,0,0,7);ctx.stroke();}const recent=fx.find(f=>f.x===(x-OX)/S-.5&&f.y===(y-OY)/S-.5&&['arrow','fire','ice','lightning'].includes(f.kind)&&last-f.born<.18);const evolve=fx.find(f=>f.kind==='evolve'&&f.x===(x-OX)/S-.5&&f.y===(y-OY)/S-.5);if(evolve){const k=Math.max(0,Math.min(1,(last-evolve.born)/evolve.duration));ctx.translate(0,-Math.sin(k*Math.PI)*12);}if(recent)ctx.translate(0,Math.sin((last-recent.born)/.18*Math.PI)*3);TowerArt.draw(ctx,type,level,x,y+21,TowerArt.battlefieldFactor(type,level,branch),branch);if(level>=5||type===5&&level===2){ctx.strokeStyle=branchColor(type,branch)+'a0';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y+17,28,10,0,0,7);ctx.stroke();}if(level>1){for(let j=0;j<Math.min(6,level);j++){ctx.fillStyle=branch>=0?'#f4d791':'#fff3d4';ctx.beginPath();ctx.arc(x+(j-(level-1)/2)*5,y+25,1.8,0,7);ctx.fill();}}ctx.restore();}
function drawEnemy(e,time){const x=OX+(e.x+.5)*S,y=OY+(e.y+.5)*S,sz=e.mini?27:e.type===4?80:[3,5].includes(e.type)?61:e.type===1?44:40,a=sprites[5+(e.mini?7:e.type)],w=sz*a[2]/a[3],bob=e.freeze>0?0:Math.sin(time*e.speed*9+e.anim)*2;ctx.save();ctx.fillStyle='#465b3a22';ctx.beginPath();ctx.ellipse(x,y+9,w*.34,5,0,0,7);ctx.fill();sprite(ctx,5+(e.mini?7:e.type),x-w/2,y+12-sz+bob,w,sz);if(fx.some(f=>f.tx!==undefined&&Math.hypot(f.tx-e.x,f.ty-e.y)<.4&&last-f.born>.18&&last-f.born<.3)){ctx.globalAlpha=.5;spark(x,y-15,12,'#fffde6',time);ctx.globalAlpha=1;}if(e.slow>0){ctx.fillStyle='#a9dff440';ctx.beginPath();ctx.ellipse(x,y+10,w*.45,7,0,0,7);ctx.fill();}if(e.freeze>0){rounded(ctx,x-w/2-2,y+8-sz,w+4,sz+3,8,'#c1eff750','#b9e9f3');}if(e.burnTime>0){ctx.fillStyle='#edb368';for(let j=0;j<3;j++){let fy=y+5-Math.sin(time*7+j)*3;ctx.beginPath();ctx.ellipse(x+(j-1)*7,fy,2.4,5,0,0,7);ctx.fill();}}let bw=e.type===4?55:28;rounded(ctx,x-bw/2,y-sz+4+bob,bw,4,2,'#698568');rounded(ctx,x-bw/2,y-sz+4+bob,bw*Math.max(0,e.hp/e.maxHp),4,2,e.type===4?'#c7a5d7':'#d7ed9d');if(e.shield>0){ctx.strokeStyle='#9cecff';ctx.lineWidth=2;ctx.fillStyle='#8ad9ed24';ctx.beginPath();ctx.ellipse(x,y-sz/2+8,w*.65,sz*.65,0,0,Math.PI*2);ctx.fill();ctx.stroke();rounded(ctx,x-bw/2,y-sz-2+bob,bw*e.shield/e.maxShield,3,1,'#8ce5ff');}const badges=[];if(e.shield>0)badges.push(['盾','#296e9e','#b6eeff']);if(e.type===6)badges.push(['分','#427e40','#d7f5ad']);if(e.burnTime>0)badges.push(['燃','#ad5229','#ffe2a5']);if(e.freeze>0)badges.push(['凍','#3968b6','#e4f6ff']);else if(e.slow>0&&e.slowTime>0)badges.push(['緩','#287c86','#c5f6ed']);ctx.font='bold 10px system-ui';ctx.textAlign='center';for(let j=0;j<badges.length;j++){const [label,fg,bg]=badges[j],bx=x+(j-(badges.length-1)/2)*17,by=y-sz-8+bob;rounded(ctx,bx-7,by-7,14,14,4,bg,fg);ctx.fillStyle=fg;ctx.fillText(label,bx,by+3);}ctx.restore();}
function collectEffects(time){let chain=0;for(const e of g.effects){if(e.kind==='waveclear'){toast(e.text);continue;}if(['build','arrow','fire','ice','lightning'].includes(e.kind))chirp(e.kind);const delay=e.kind==='lightning'?(chain++%6)*.035:0;fx.push({...e,born:time+delay,duration:e.kind==='meteor'?.65/speed:e.kind==='meteorImpact'?.8/speed:['kill','sell','leak'].includes(e.kind)?.85:e.kind==='evolve'?1.4:e.kind==='steam'?1.25:e.kind==='combo'?1.1:e.kind==='build'?.65:e.kind==='fire'?(e.branch===1?1.05:.7):e.kind==='ice'?(e.freeze?.85:.6):e.kind==='arrow'?.36:.32});if(fx.length>180)fx.shift();}g.effects=[];}
function spark(x,y,r,color,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-r);ctx.lineTo(r*.25,-r*.25);ctx.lineTo(r,0);ctx.lineTo(r*.25,r*.25);ctx.lineTo(0,r);ctx.lineTo(-r*.25,r*.25);ctx.lineTo(-r,0);ctx.lineTo(-r*.25,-r*.25);ctx.closePath();ctx.fill();ctx.restore();}
function drawFx(f,p,time){const x=OX+(f.x+.5)*S,y=OY+(f.y+.5)*S-28,tx=OX+(f.tx+.5)*S,ty=OY+(f.ty+.5)*S-8;ctx.save();ctx.lineCap='round';const count=simpleEffects?4:12;
if(['arrow','fire','ice','lightning','meteor','meteorImpact'].includes(f.kind)){TowerEffects.attack(ctx,{...f,x,y,tx,ty,radius:(f.r||.35)*S},p,time,simpleEffects); }else if(f.kind==='steam'){ctx.globalAlpha=(1-p)*.65;for(let j=0;j<(simpleEffects?3:8);j++){const angle=j*Math.PI*2/8,rad=(15+p*60);ctx.fillStyle=j%2?'#fff5dc':'#c8eff0';ctx.beginPath();ctx.arc(x+Math.cos(angle)*rad,y+20+Math.sin(angle)*rad*.55-p*22,9+p*16,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1-p;ctx.strokeStyle='#ffd98b';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y+28,p*1.2*S,p*.5*S,0,0,7);ctx.stroke();ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.strokeStyle='#35534b';ctx.lineWidth=4;ctx.strokeText(f.text,x,y-12-p*25);ctx.fillStyle='#fff4ce';ctx.fillText(f.text,x,y-12-p*25);
}else if(f.kind==='combo'){ctx.globalAlpha=1-p;ctx.font='bold 14px system-ui';ctx.textAlign='center';ctx.strokeStyle='#244b3e';ctx.lineWidth=4;ctx.strokeText(f.text,x,y-12-p*28);ctx.fillStyle=f.color;ctx.fillText(f.text,x,y-12-p*28);spark(x,y+18,19*(1-p),f.color,time);ctx.lineWidth=3;for(let j=0;j<(simpleEffects?3:7);j++){const a=j*6.28/7;ctx.beginPath();ctx.moveTo(x+Math.cos(a)*12,y+18+Math.sin(a)*12);ctx.lineTo(x+Math.cos(a)*(20+p*32),y+18+Math.sin(a)*(20+p*32));ctx.stroke();}ctx.strokeStyle=f.color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y+28,15+p*20,7+p*8,0,0,7);ctx.stroke();if(!simpleEffects)for(let j=0;j<4;j++)spark(x+Math.cos(j*1.57+time)*22,y+12+Math.sin(j*1.57+time)*12,4*(1-p),f.color,j);
}else if(f.kind==='evolve'){const col=branchColor(f.type,f.branch);ctx.globalAlpha=1-p;ctx.strokeStyle=col;ctx.lineWidth=3;for(let j=0;j<(simpleEffects?1:3);j++){ctx.beginPath();ctx.ellipse(x,y+43-j*15,18+p*35,7+p*14,0,0,7);ctx.stroke();}for(let j=0;j<(simpleEffects?4:10);j++){const a=j*6.28/10;spark(x+Math.cos(a)*(20+p*24),y+25-p*65+Math.sin(a)*18,5*(1-p)+2,col,a);}ctx.font='bold 13px system-ui';ctx.textAlign='center';ctx.strokeStyle='#244b3e';ctx.lineWidth=4;ctx.strokeText('✦ '+f.text,x,y-45-p*16);ctx.fillStyle='#fff8cf';ctx.fillText('✦ '+f.text,x,y-45-p*16);
}else if(f.kind==='build'){ctx.globalAlpha=1-p;ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y+40,20+p*25,8+p*10,0,0,7);ctx.stroke();for(let j=0;j<6;j++)spark(x+Math.sin(j*1.8)*25,y+30-p*60-j*5,4,f.color,time);
}else{ctx.globalAlpha=1-p;ctx.fillStyle=f.kind==='leak'?'#b96c69':'#d2a439';ctx.strokeStyle='#fff9e4';ctx.lineWidth=3;ctx.font='bold 15px system-ui';ctx.textAlign='center';ctx.strokeText(f.text||'',x,y-p*35);ctx.fillText(f.text||'',x,y-p*35);if(f.kind==='kill')for(let j=0;j<count/2;j++)spark(x+Math.cos(j*2)*p*32,y+Math.sin(j*2)*p*24,3*(1-p),'#ffed9a',time);}
ctx.restore();}

function frame(ms){const time=ms/1000,elapsed=Math.min(.08,time-(last||time));last=time;const blocked=paused||!!document.querySelector('dialog[open]')||homeActive||portraitMode.matches;const wave=g.wave;g.sessionTick(elapsed,{blocked,speed});if(g.wave!==wave)save();collectEffects(time);draw(time);if($('#guideDialog').open)drawGuide(time);if(time-uiTime>.15){updateUI();uiTime=time;}requestAnimationFrame(frame);}

let hasSave=false;try{hasSave=!!localStorage.getItem(saveKey);}catch{}
const portraitMode=matchMedia('(orientation: portrait)');
function fitScene(){const w=innerWidth,h=innerHeight;const left=document.querySelector('.stats')?.getBoundingClientRect(),right=document.querySelector('.top-actions')?.getBoundingClientRect();camera.resize(w,h,{left:left?.width?left.right+10:96,right:right?.width?w-right.left+10:130});view.dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(w*view.dpr);canvas.height=Math.round(h*view.dpr);syncCamera();pointers.clear();gesture=null;document.querySelector('main').inert=portraitMode.matches;$('.topbar').inert=portraitMode.matches;$('.camera-controls').inert=portraitMode.matches;$('#battleTools').inert=portraitMode.matches;if(portraitMode.matches)closeBattleTools();$('#homeScreen').inert=portraitMode.matches;if(portraitMode.matches){paused=true;updateUI();}}
window.addEventListener('resize',fitScene);portraitMode.addEventListener('change',()=>{if(portraitMode.matches){paused=true;save();updateUI();}fitScene();});
function enterBattle(){homeActive=false;$('#homeScreen').hidden=true;document.body.classList.remove('at-home');fitScene();}
function showHome(){closeBattleTools();homeActive=true;paused=true;save();document.querySelectorAll('dialog[open]').forEach(d=>d.close());$('#homeScreen').hidden=false;document.body.classList.add('at-home');$('#homeContinue').hidden=!hasSave;updateUI();}
$('#homeContinue').hidden=!hasSave;
$('#homeStart').onclick=()=>{menuMode='story';renderMenu();safeDialog('menuDialog');};
$('#homeContinue').onclick=()=>{enterBattle();paused=true;updateUI();};
$('#homeHelp').onclick=()=>safeDialog('helpDialog');
$('#homeGuide').onclick=openGuide;$('#menuGuide').onclick=openGuide;
$('#homeSettings').onclick=openSettings;$('#menuSettings').onclick=openSettings;
$('#backHome').onclick=showHome;
$('#closePanel').onclick=()=>$('#cancelTool').click();
$('#resume').onclick=()=>{$('#menuDialog').close();enterBattle();updateUI();};
$('#menu').onclick=()=>{paused=true;openMenu();updateUI();};
// Keep combat controls within easy thumb reach along the upper right.
$('.top-actions').prepend($('#pause'),$('#speed'));
$('.top-actions').insertBefore($('#startWave'),$('#battleToolsToggle'));
$('#toolActions').append($('#wavePreview'),$('#routeToggle'),$('.auto'),$('#sound'),$('#help'),$('#fullscreen'));
$('#fullscreen').textContent='⛶ 全螢幕';
$('#sound').insertAdjacentHTML('beforeend','<span class="tool-label">音效</span>');$('#help').insertAdjacentHTML('beforeend','<span class="tool-label">玩法說明</span>');

function closeBattleTools(){if($('#battleTools').open)$('#battleTools').close();$('#battleToolsToggle').setAttribute('aria-expanded','false');}
function openBattleTools(){renderBattleTools();setToolsTab('overview');$('#battleToolsToggle').setAttribute('aria-expanded','true');safeDialog('battleTools');save();}
function setToolsTab(name){document.querySelectorAll('[data-tools-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.toolsTab===name)));document.querySelectorAll('[data-tools-page]').forEach(p=>p.hidden=p.dataset.toolsPage!==name);}
function renderBattleTools(){
 const mins=Math.floor(g.playTime/60),secs=Math.floor(g.playTime%60);$('#toolsSubtitle').textContent=g.def.name+(g.endless?' · 無盡挑戰':g.map===3?'':' · 闖關模式')+(g.sandbox?' · 沙盒':'');
 const stats=[['本場分數',g.score().toLocaleString()],['完成波數',g.cleared+'／'+(g.endless?'∞':g.def.waves)],['擊殺怪物',g.kills],['城堡生命',g.hp+'／'+g.maxHp()],['持有金幣',g.sandbox?'∞':Math.floor(g.gold)],['遊玩時間',mins+':'+String(secs).padStart(2,'0')]];
 $('#battleOverview').innerHTML=stats.map(([k,v])=>'<article><small>'+k+'</small><b>'+v+'</b></article>').join('');
 $('#scoreRule').textContent='計分：每擊殺1隻＋10分，每完成1波＋100分。'+(g.sandbox?'沙盒分數僅供本場參考。':'');
 $('#battleProgress').textContent='目前第 '+g.wave+' 波 · 場上 '+g.enemies.length+' 隻 · 待出場 '+g.queue.length+' 隻 · 已建造 '+g.towers.length+' 座塔';
 if(!g.endless&&!g.sandbox&&g.map!==3)$('#battleProgress').textContent+=' · ★ '+(g.trial?'完成10波星隕試煉':Progression.tasks[g.def.storyNumber-1])+'（同時最多 '+Progression.metrics(g).peak+' 座／已拆 '+Progression.metrics(g).sales+' 次）';renderBlessingList();$('#toolsBlessings').innerHTML=$('#ownedBlessingList').innerHTML;$('#toolsNextBlessing').textContent=nextBlessingText();
 const n=id=>g.blessingCount(id),power=n('power')*20,range=(Math.min(3,n('range'))*.4).toFixed(1);
 $('#battleAbilities').innerHTML='<article><h3>全體與城堡</h3><p>所有塔傷害 ＋'+power+'%<br>所有塔射程 ＋'+range+' 格<br>祝福攻速加成：0%<br>對重甲、頭目與護盾怪傷害 ＋'+n('breaker')*25+'%<br>城堡生命上限 ＋'+n('vitality')*2+'</p></article>'+TOWERS.map((d,i)=>{const id=['arrow','fire','ice','lightning','beam'][i],b=BLESSINGS.find(b=>b.id===id);return '<article><h3>'+d.name+'</h3><p>'+(n(id)?g.blessingText(id):'尚無此類專屬祝福')+'</p><small>已建造 '+g.towers.filter(t=>t.type===i).length+' 座</small></article>';}).join('');
 $('#toolsResume').textContent=paused?'返回戰場（維持暫停）':'繼續遊戲 ▶';$('#toolsUnpause').hidden=!paused;$('#toolSpeed').textContent='戰鬥速度：'+speed+'×';$('#toolEffects').textContent='特效：'+(simpleEffects?'簡化':'標準');$('#toolMusic').textContent='音樂：'+(music?'開啟':'關閉');
}
$('#battleToolsToggle').onclick=openBattleTools;$('#closeBattleTools').onclick=closeBattleTools;$('#toolsResume').onclick=closeBattleTools;
$('#toolsUnpause').onclick=()=>{paused=false;closeBattleTools();updateUI();};
$('#battleTools').addEventListener('close',()=>{$('#battleToolsToggle').setAttribute('aria-expanded','false');});
document.querySelectorAll('[data-tools-tab]').forEach(b=>b.onclick=()=>setToolsTab(b.dataset.toolsTab));
$('#pause').onclick=()=>{if(paused){paused=false;updateUI();}else openBattleTools();};
$('#toolSpeed').onclick=()=>{speed=speed===3?1:speed+1;renderBattleTools();updateUI();};
$('#toolEffects').onclick=()=>{simpleEffects=!simpleEffects;persistSettings();renderBattleTools();};
$('#toolMusic').onclick=()=>{$('#settingMusic').click();renderBattleTools();};

$('#routeToggle').className='small-btn';$('#routeToggle').textContent='路線';
$('#settingFullscreen').onclick=()=>$('#fullscreen').click();
function persistSettings(){try{localStorage.setItem('starbloom-settings',JSON.stringify({sound,music,simpleEffects}));}catch{}$('#settingSound').textContent=sound?'開啟':'關閉';$('#settingMusic').textContent=music?'開啟':'關閉';$('#settingEffects').textContent=simpleEffects?'簡化':'標準';$('#sound .off-dot').style.display=sound?'none':'block';$('#sound').setAttribute('aria-label',sound?'關閉音效':'開啟音效');}
function openSettings(){persistSettings();safeDialog('settingsDialog');}
$('#settingSound').onclick=()=>{sound=!sound;persistSettings();chirp('build');};
$('#sound').onclick=()=>{sound=!sound;persistSettings();chirp('build');};
$('#settingEffects').onclick=()=>{simpleEffects=!simpleEffects;persistSettings();};
$('#settingMusic').onclick=()=>{music=!music;persistSettings();if(music){try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();}catch{}}};
let melodyStep=0;setInterval(()=>{if(!music||document.hidden||portraitMode.matches)return;try{audioCtx=audioCtx||new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state!=='running')return;const now=audioCtx.currentTime;for(const [freq,volume]of [[ [523,659,784,659,587,698,880,698][melodyStep++%8],.018],[261.63,.007]]){let o=audioCtx.createOscillator(),gain=audioCtx.createGain();o.type='sine';o.frequency.value=freq;gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+.12);gain.gain.exponentialRampToValueAtTime(.0001,now+1.5);o.connect(gain);gain.connect(audioCtx.destination);o.start(now);o.stop(now+1.6);}}catch{}},650);
// One illustrated topic per page, with navigation outside the scroll region.
const helpCards=[...document.querySelectorAll('.help-grid article')];
function showHelpPage(){helpCards.forEach((a,i)=>a.hidden=i!==helpPage);$('#helpCount').textContent=(helpPage+1)+' / '+helpCards.length;$('#helpPrev').disabled=helpPage===0;$('#helpNext').disabled=helpPage===helpCards.length-1;$('.help-scroll').scrollTop=0;}
$('#helpPrev').onclick=()=>{helpPage--;showHelpPage();};$('#helpNext').onclick=()=>{helpPage++;showHelpPage();};showHelpPage();
$('#helpGuide').onclick=()=>{$('#helpDialog').close();openGuide();};
window.addEventListener('starwish:before-update',event=>{save();if(!storageOK)event.preventDefault();});
function openGuide(){renderGuide();safeDialog('guideDialog');}
function renderGuide(){
 // Replacing focused controls can reset a scrolling dialog on mobile browsers.
 const dialog=$('#guideDialog'),scrollTop=dialog.scrollTop,scrollLeft=dialog.scrollLeft,active=document.activeElement;
 const focusAttribute=['data-guide','data-look-level','data-guide-branch'].find(attr=>active?.hasAttribute(attr));
 const focusValue=focusAttribute?active.getAttribute(focusAttribute):null;
 guideLevel=Math.min(guideLevel,guideType===5?2:6);
 const d=TOWERS[guideType],b=guideType!==5&&guideLevel>=3?guideBranch:-1,color=branchColor(guideType,b),name=guideType===5?(guideLevel===2?'星隕聖殿':'召星祭壇'):b>=0?d.branches[b][0]:'基礎';
 if(!$('#guideTabs').children.length)$('#guideTabs').innerHTML=TOWERS.map((t,i)=>'<button data-guide="'+i+'">'+t.name+'</button>').join('');
 $('#guideTabs').querySelectorAll('button').forEach(el=>el.classList.toggle('active',Number(el.dataset.guide)===guideType));
 $('#guideTabs').querySelectorAll('button').forEach(el=>el.onclick=()=>{guideType=Number(el.dataset.guide);renderGuide();});
 $('#guideContent').innerHTML='<div class="guide-body"><div><canvas id="guideDemo" width="420" height="420" aria-label="'+d.name+' '+name+' Lv.'+guideLevel+' 外觀與攻擊特效示範"></canvas><div class="guide-caption">'+name+' · Lv.'+guideLevel+(guideLevel===(guideType===5?2:6)?' 最終型態':'')+'</div><div id="appearanceLevels" class="appearance-levels">'+(guideType===5?[1,2]:[1,3,6]).map(l=>'<button data-look-level="'+l+'" aria-pressed="'+(guideLevel===l)+'" class="'+(guideLevel===l?'active':'')+'">Lv.'+l+'</button>').join('')+'</div></div><div><h3>'+d.name+'</h3><p style="color:'+color+'">'+d.role+' · ◉ '+d.cost+'</p><p>'+d.desc+'</p><div class="guide-branches">'+d.branches.map((br,i)=>'<button data-guide-branch="'+i+'" aria-pressed="'+(b===i)+'" class="'+(b===i?'active':'')+'" style="--branch-color:'+branchColor(guideType,i)+'"><b>'+br[0]+'</b><small>'+br[1]+'</small><span>預覽專精外觀與特效</span></button>').join('')+'</div><p class="fx-description">'+TowerEffects.description(guideType,b,guideLevel)+'</p><p class="combo-guide">'+['❄ 冰＋弓箭：對緩速或凍結怪物傷害＋25%。','♨ 火＋冰：燃燒與冰霜交會時觸發蒸汽範圍傷害；火＋光束蓄能快50%。','♨ 火＋冰：蒸汽爆發。冰＋弓箭增傷25%；冰＋雷多連鎖1隻。','⚡ 冰＋雷：首個目標緩速或凍結時，多連鎖1隻。','✦ 火＋光束：燃燒期間蓄能速度＋50%，最大倍率不變。','🌠 天降光球：鎖定落點後延遲命中，搭配冰霜減速更容易擊中。'][guideType]+'</p><p style="margin-top:8px;font-size:10px">'+(guideType===5?'通過第9關開放試煉，完成後解鎖 · 33星解鎖星隕聖殿':'Lv.3 選擇專精 · 基礎／專精／最終三階外觀 · '+g.ascendStars(guideType,Math.max(0,b))+'星解鎖此分支最終型態')+'</p></div></div>';
 $('#appearanceLevels').querySelectorAll('button').forEach(el=>el.onclick=()=>{guideLevel=Number(el.dataset.lookLevel);if(guideType!==5&&guideLevel>=4&&guideBranch<0)guideBranch=0;renderGuide();});
 $('#guideContent').querySelectorAll('[data-guide-branch]').forEach(el=>el.onclick=()=>{guideBranch=Number(el.dataset.guideBranch);guideLevel=Math.max(3,guideLevel);renderGuide();});
 if(dialog.open){
  if(focusAttribute)dialog.querySelector('['+focusAttribute+'="'+focusValue+'"]')?.focus({preventScroll:true});
  dialog.scrollTop=scrollTop;dialog.scrollLeft=scrollLeft;
 }
}
function drawGuide(time){
 const c=$('#guideDemo');if(!c)return;const a=c.getContext('2d'),b=guideLevel>=3?guideBranch:-1,q=time%2.2/2.2;
 a.clearRect(0,0,420,420);a.fillStyle='#a7bc7e40';a.beginPath();a.ellipse(170,345,135,23,0,0,7);a.fill();
 towerArt(a,guideType,guideLevel,20,30,280,300,1,b);sprite(a,5,335,296,34,34);a.save();a.globalAlpha=.48;
 const f={kind:guideType===5?(q<.45?'meteor':'meteorImpact'):undefined,type:guideType,branch:b,level:guideLevel,x:160,y:155,tx:352,ty:315,radius:guideType===1?60:guideType===2&&b===0?55:24,freeze:b===1&&Math.floor(time/2.2)%4===3,chainIndex:0,charge:3+q*5};
 if(guideType===4)TowerEffects.beam(a,f,time,simpleEffects);else TowerEffects.attack(a,f,guideType===5?(q<.45?q/.45:(q-.45)/.55):q,time,simpleEffects);a.restore();
}

persistSettings();fitScene();
buildDock();updateUI();requestAnimationFrame(frame);
// Read-only snapshot helps accessibility and test tooling inspect the current board.
window.starbloomSnapshot=()=>({map:g.map,phase:g.phase,endless:g.endless,blessings:[...g.blessings],blessingOffers:g.blessingOffers.map(o=>({...o,choices:[...o.choices]})),wave:g.wave,hp:g.hp,gold:g.gold,paused,towers:g.towers.map(t=>({x:t.x,y:t.y,type:t.type,level:t.level,branch:t.branch})),enemies:g.enemies.length,pending,selectedType,selectedId,routeLength:g.pathPreview().length});

$('#wavePreview').onclick=()=>{const w=g.endless?g.wave+1:Math.min(g.wave+1,g.def.waves);$('#previewTitle').textContent='第'+w+'波 · 怪物預告';$('#enemyPreview').innerHTML=g.waveSpec(w).map(q=>{const e=ENEMIES[q.type];return '<article><canvas width="90" height="90" data-enemy data-sprite="'+(5+e.sprite)+'"></canvas><div><b>'+e.name+' × '+q.count+'</b><span>'+e.icon+' '+e.trait+'</span><p>'+e.tip+'</p></div></article>';}).join('');drawPortraits();safeDialog('waveDialog');};

})();
