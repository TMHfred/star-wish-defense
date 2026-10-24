(() => {
 'use strict';
 const BUILD=19,VERSION='公開測試 v0.3.0',SEEN='star-wish-announcement-seen';
 // Only owner-reviewed, approved announcements belong in this published list.
 const announcements=[{"id": "star-journey-20261024", "date": "2026／10／24", "version": "公開測試 v0.3.0", "title": "《星之祈願：守護小隊》星願旅程更新", "html": "<p>守護者們，星光森林換上新面貌，也迎來新的成長旅程！</p><p><strong>全新守護小隊外觀</strong>：六種塔採統一的 Q 版奇幻風格，共 27 種造型。基礎、專精與最終型態各有辨識度，兩個分支擁有不同的最終外觀；怪物也同步換裝。</p><p><strong>更清楚的戰場</strong>：固定全圖視角，保留正方形格子與直角路線。手機橫向改用兩側操作，並限制塔的尺寸，減少遮擋。</p><p><strong>通關解鎖新塔</strong>：開始使用弓箭塔，通過第 1／2／4／6 關，依序解鎖火焰、冰霜、雷電、星輝塔。</p><p><strong>每顆星都有目標</strong>：每關分為通關星、80% 生命守護星與挑戰星，可以分次取得。第 1 關挑戰為場上同時最多 6 座塔，拆除後可以重建。</p><p><strong>星星解鎖最終型態</strong>：3 至 30 星，每 3 星依序開放五種塔的兩條最終分支；33 星開放星隕聖殿，36 星獲得「星願守護者」稱號與專屬城堡。</p><p><strong>星隕試煉</strong>：通過第 9 關開放 10 波試煉，暫借一座不可拆除的召星祭壇。完成後永久解鎖星隕塔。</p><p><strong>無盡繼續挑戰分數</strong>：無盡仍提供本場金幣與祝福，不額外產出關卡星星。玩法說明、圖鑑與關卡任務同步更新。</p><p><strong>舊進度調整</strong>：更新前會在目前瀏覽器備份舊進度。舊星星按新規則重算：保留已確認的通關星；舊滿血紀錄保留守護星；因舊版沒有挑戰紀錄，挑戰星需要重玩取得，因此總星數可能減少。已解鎖的基礎塔保留，最終分支資格依重算後星數判定。新制取得的星星不會因重玩失敗而扣除。</p><p>遊戲仍在公開測試，關卡難度與操作體驗會持續依試玩回饋調整。感謝一起守護星光的你！</p>"},{id:'star-breakthrough-20261023',date:'2026／10／23',version:'公開測試 v0.2.0',title:'《星之祈願：守護小隊》星級突破更新',html:`<p>守護者們，新的星光旅程即將展開！✨</p><h3>🏰 12 關冒險，收集通關星星</h3><p>闖關模式擴充至四個章節、共 12 關。每關最高可取得 3 星，重玩挑戰更好的成績，就能補齊星星！</p><h3>⭐ 累積星星，解鎖最終突破</h3><p>累積 3／6／9／12／15 星，依序解鎖弓箭、火焰、冰霜、雷電與星輝塔的最終突破。兩條專精都有全新造型與進化特效！</p><h3>🌠 18 星解鎖全新星隕塔</h3><p>召喚光球從天而降，轟炸範圍內的敵人！星隕塔採單一路線，可從「召星祭壇」升級為「星隕聖殿」。</p><p>星星解鎖不會消耗；解鎖後，每場仍需要使用金幣建造與升級。</p><h3>♾️ 通關領星，無盡挑戰高分</h3><p>通關時結算關卡星星。繼續無盡挑戰可累積分數與挑戰最高波次，不會額外獲得星星或永久解鎖獎勵；本場金幣與祝福仍可繼續取得。</p><h3>📖 圖鑑與玩法說明同步更新</h3><p>新增解鎖進度、最終型態介紹與通關獎勵提示，讓下一個目標更清楚。</p><p>帶上你的守護小隊，收集星光，迎接最終進化！🌟</p>`},{id:'public-test-20261023',date:'2026／10／23',version:'公開測試 v0.1.0',title:'《星之祈願：守護小隊》公開測試公告',html:`
 <p>各位守護者，歡迎加入星之祈願！✨</p>
 <p>遊戲目前開放公開測試，邀請大家一起建造防禦塔、搭配魔法，守護我們的星光城堡！</p>
 <h3>🏹 目前開放內容</h3><ul><li>闖關模式：沿著固定路線，挑戰一波波怪物。</li><li>自由迷宮：自由蓋塔，安排怪物行進路線。</li><li>五種防禦塔，可升級並選擇不同專精。</li><li>元素搭配、星之祝福與無盡挑戰。</li><li>支援電腦與手機，手機請橫向遊玩。</li></ul>
 <h3>🔧 測試期間提醒</h3><p>遊戲仍持續調整中，可能遇到操作、畫面或平衡性問題。歡迎回報遇到的狀況，也期待聽到你的遊玩建議！</p>
 <p>💾 遊戲進度儲存在目前使用的瀏覽器中，清除瀏覽器資料可能導致進度遺失。</p>
 <p>感謝每一位參與測試的守護者，和我們一起讓星光更加閃耀！🌟</p>`}];
 const $=s=>document.querySelector(s),dialog=$('#announcementDialog'),banner=$('#updateNotice');
 let seen=null,inFlight=false,lastCheck=0,latest=null,snoozeUntil=0,autoOpened=false;
 try{seen=localStorage.getItem(SEEN);}catch{}
 $('#buildVersion').textContent=VERSION;
 function openAnnouncements(){
  $('#announcementList').innerHTML=announcements.map(a=>'<article><div class="announcement-meta">'+a.version+' · '+a.date+'</div><h3 class="announcement-title">'+a.title+'</h3>'+a.html+'</article>').join('');
  if(!dialog.open){dialog.showModal();dialog.scrollTop=0;$('#announcementBody').scrollTop=0;}
 }
 $('#homeNews').onclick=openAnnouncements;
 $('#buildVersion').onclick=()=>{openAnnouncements();checkVersion();};
 dialog.addEventListener('close',()=>{seen=announcements[0].id;try{localStorage.setItem(SEEN,seen);}catch{}});
 function showFirstAnnouncement(){
  if(autoOpened||seen===announcements[0].id||!document.body.classList.contains('at-home')||document.hidden||matchMedia('(orientation:portrait)').matches||document.querySelector('dialog[open]'))return;
  autoOpened=true;openAnnouncements();
 }
 function renderNotice(){
  banner.hidden=!latest||Date.now()<snoozeUntil;
  if(latest)$('#updateMessage').textContent='新版本已推出：'+latest.version;
 }
 async function checkVersion(){
  if(document.hidden||inFlight||Date.now()-lastCheck<15000)return;
  inFlight=true;lastCheck=Date.now();const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),8000);
  try{
   const url=new URL('version.json',document.baseURI);url.searchParams.set('_',String(Date.now()));
   const response=await fetch(url,{cache:'no-store',signal:controller.signal});
   if(!response.ok)return;const data=await response.json();
   if(Number.isSafeInteger(data.build)&&data.build>BUILD&&typeof data.version==='string'&&data.version.length<80){latest=data;renderNotice();}
  }catch{/* Offline play continues without an interruption. */}
  finally{clearTimeout(timeout);inFlight=false;}
 }
 $('#updateLater').onclick=()=>{snoozeUntil=Date.now()+15*60*1000;renderNotice();};
 $('#updateReload').onclick=()=>{
  const event=new Event('starwish:before-update',{cancelable:true});
  if(!window.dispatchEvent(event)){$('#updateMessage').textContent='目前無法儲存進度，請先留在遊戲中，稍後再試。';return;}
  location.reload();
 };
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){checkVersion();renderNotice();showFirstAnnouncement();}});
 window.addEventListener('focus',checkVersion);
 window.addEventListener('resize',showFirstAnnouncement);
 new MutationObserver(showFirstAnnouncement).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open','class']});
 setInterval(()=>{checkVersion();renderNotice();},120000);
 checkVersion();showFirstAnnouncement();
})();
