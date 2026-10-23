(() => {
 'use strict';
 const BUILD=17,VERSION='公開測試 v0.1.0',SEEN='star-wish-announcement-seen';
 // Only owner-reviewed, approved announcements belong in this published list.
 const announcements=[{id:'public-test-20261023',date:'2026／10／23',version:VERSION,title:'《星之祈願：守護小隊》公開測試公告',html:`
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
