/* A local, pretend gift exchange. It has no payment, messaging or combat hooks. */
(function(root){'use strict';
const NOTICE='趣味模擬，無實際付款，不會收取費用';
const PACKS=Object.freeze([
 {id:'starlight',name:'星光小袋',price:'給作者一個讚',action:'送上鼓勵',badge:'星光應援者',description:'把一點鼓勵，裝進柔軟的星光裡。',thanks:['心意已收藏！','一個想像中的讚，化成了一束小小星光。','謝謝你為這趟旅程點亮溫柔的鼓勵。']},
 {id:'wish',name:'祈願寶箱',price:'給作者一句加油',action:'加油，繼續做！',badge:'祈願同行者',description:'讓一句加油，陪著祈願繼續發光。',thanks:['心意已收藏！','一句想像中的加油，已裝進祈願寶箱。','謝謝你與這片森林一路同行。']},
 {id:'drink',name:'守護者典藏箱',price:'請作者喝一杯飲料',action:'這杯我請！',badge:'作者的飲料贊助商',description:'為這片星光，添一份心意。',thanks:['心意已送達！','作者獲得了『想像中的飲料』一杯。','感謝你陪伴《星之祈願：守護小隊》成長。']}
]);
let drawing=0;
const star='<path d="m0-15 4.5 9.5 10.5 1.6-7.5 7.3 1.8 10.4L0 8.8l-9.3 5 1.8-10.4-7.5-7.3 10.5-1.6Z"/>';
function art(id,drink=false){
 const key='supply-art-'+(++drawing);
 const defs=`<defs><linearGradient id="${key}-cloth" x2=".7" y2="1"><stop stop-color="#fff5da"/><stop offset="1" stop-color="#d9bd81"/></linearGradient><linearGradient id="${key}-gold" x2=".3" y2="1"><stop stop-color="#fff0b3"/><stop offset=".5" stop-color="#dab56b"/><stop offset="1" stop-color="#ac7f3c"/></linearGradient><linearGradient id="${key}-green" x2=".8" y2="1"><stop stop-color="#6c9271"/><stop offset="1" stop-color="#305b48"/></linearGradient></defs>`;
 const gold=`url(#${key}-gold)`,cream=`url(#${key}-cloth)`,green=`url(#${key}-green)`;
 let body;
 if(drink){
  body=`<path d="m129 47 12-30 10 4-14 31" fill="#e6c68a"/><path d="m89 64 10 72q22 17 44 0l10-72Z" fill="${cream}"/><path d="m96 90 6 42q19 12 38 0l6-42" fill="#c99567" opacity=".65"/><ellipse cx="121" cy="62" rx="34" ry="11" fill="${green}"/><path d="M93 49q-6-13 7-18 3-15 17-10 13-11 22 3 17-1 17 15 13 10-2 19H96Z" fill="#fff2d5"/><ellipse cx="121" cy="60" rx="36" ry="9" fill="#a8b895"/><g fill="#6e4c36" stroke="none"><circle cx="108" cy="124" r="4"/><circle cx="120" cy="128" r="4"/><circle cx="133" cy="124" r="4"/><circle cx="114" cy="114" r="3"/><circle cx="129" cy="114" r="3"/></g><g transform="translate(122 90) scale(.78)" fill="${gold}">${star}</g><path d="M109 103q12 10 23 0" fill="none" stroke="#785b3d"/><circle cx="106" cy="96" r="2" fill="#785b3d" stroke="none"/><circle cx="136" cy="96" r="2" fill="#785b3d" stroke="none"/>`;
 }else if(id==='starlight'){
  body=`<g class="gift-lid"><path d="m92 30 15 6 14-10 14 10 16-6-13 31h-35Z" fill="${cream}"/><path d="m107 31 2 24m14-24-1 25m13-21-3 23" fill="none" stroke="#c2a977"/></g><path d="M102 60Q82 74 72 104q-7 34 24 40 26 8 52-1 30-9 19-41-9-25-32-42Z" fill="${cream}"/><path d="M89 83q-10 17-8 31m65-36q12 13 14 31" stroke="#b69960" opacity=".5" fill="none"/><path d="M100 59q21 8 39-1" fill="none" stroke="#456b4e" stroke-width="6"/><path d="m134 60 21 14-15 2 8 15-19-21" fill="${green}"/><g transform="translate(120 105) scale(1.25)" fill="${gold}">${star}</g><path d="M68 131q-15-18-21-8 8 15 21 8m103-6q15-18 21-8-7 16-21 8" fill="${green}"/>`;
 }else{
  const deluxe=id==='drink';
  body=`${deluxe?`<path d="m96 29 12 9 13-18 13 18 14-9-4 21H99Z" fill="${gold}"/>`:''}<path d="M67 79h107v56q-52 25-107 0Z" fill="${green}"/><path d="m67 80 14 8v52l-14-6Zm93 7 14-7v54l-14 7Z" fill="${gold}"/><path d="M82 91q40 11 77-1v40q-38 17-77 0Z" fill="${cream}"/><g class="gift-lid"><path d="M65 81V62q3-25 56-25 50 0 55 25v19q-55 22-111 0Z" fill="${green}"/><path d="M67 64q52 23 107 0m-87-22-2 43m68-43 3 43" stroke="${deluxe?'#f3d88f':'#d2b879'}" stroke-width="7" fill="none"/><path d="M67 79q55 20 108 0" stroke="${gold}" stroke-width="8" fill="none"/></g><path d="M109 82h25v29h-25Z" fill="${gold}"/><g transform="translate(121 105) scale(.85)" fill="#fff0ae">${star}</g><path d="M104 138q18 7 35 0" fill="none" stroke="#f0d49a"/>${deluxe?'<path d="M53 109q-17-22-23-12 2 16 23 12m128-1q17-22 23-12-2 16-23 12" fill="#678d68"/>':''}`;
 }
 return `<svg class="supply-art" viewBox="0 0 240 160" aria-hidden="true" focusable="false">${defs}<ellipse cx="120" cy="143" rx="74" ry="10" fill="#1b3b2b" opacity=".16"/><g fill="#e5c888" opacity=".7"><g transform="translate(48 43) scale(.38)">${star}</g><g transform="translate(190 55) scale(.32)">${star}</g><g transform="translate(174 22) scale(.25)">${star}</g></g><g stroke="#786344" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round">${body}</g></svg>`;
}
function seal(id){
 const center=id==='drink'?'<path d="m28 23 3 24q5 5 11 0l3-24Zm13 0 5-10m-19 11h19" fill="#f0dfb1"/><path d="M32 36h10"/>':id==='wish'?'<path d="M36 16v37m0-12Q17 38 19 26q18 0 17 15m0-5q17-4 16-17-16 1-16 17" fill="#a8b98a"/>':`<g transform="translate(36 35) scale(.9)" fill="#f1d48a">${star}</g>`;
 return `<svg class="supply-seal" viewBox="0 0 72 72" aria-hidden="true" focusable="false"><path d="m22 46-6 21 13-6 7 9 4-23m8-1 7 20-12-5-7 9-4-23" fill="#698c66" stroke="#42634a"/><circle cx="36" cy="33" r="28" fill="#c7a66b" stroke="#806b47"/><circle cx="36" cy="33" r="23" fill="#fff0cc" stroke="#e5c280"/><circle cx="36" cy="33" r="19" fill="#375c46"/><g stroke="#d5b77a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">${center}</g></svg>`;
}
function create(host){
 const $=id=>document.getElementById(id),media=matchMedia('(prefers-reduced-motion: reduce)');
 let view='closed',chosen=null,timer=0,sequence=0,saved=true;
 const owned=id=>host.getProgress().supplyBadges.includes(id);
 function cancel(){clearTimeout(timer);timer=0;sequence++;}
 function render(next,title,body,actions=''){
  cancel();view=next;host.open(title,body);
  $('modalFooter').innerHTML=(actions?'<div class="supply-actions">'+actions+'</div>':'')+`<p class="supply-disclaimer" role="note">${NOTICE}</p>`;
  $('modalFooter').hidden=false;$('modalBody').scrollTop=0;
 }
 function show(){
  chosen=null;const count=host.getProgress().supplyBadges.length;
  render('list','星願補給所',`<p class="supply-lead">把一點鼓勵，收藏成星光。<span>紀念徽章 ${count} / 3</span></p><div class="supply-packs">${PACKS.map(p=>`<article class="supply-card ${owned(p.id)?'owned':''}"><span class="supply-ribbon">${owned(p.id)?'已收藏 · 可重播':'一份小小心意'}</span>${art(p.id)}<h3>${p.name}</h3><p class="supply-description">${p.description}</p><p class="supply-price"><small>售價</small><strong>${p.price}</strong></p><button data-supply-pack="${p.id}">${p.action}</button></article>`).join('')}</div><section class="supply-collection" aria-label="紀念徽章收藏"><h3>心意收藏冊 <span>${count} / 3</span></h3><p>三枚紀念徽章，只收藏心意，不增加戰鬥能力。</p><ol>${PACKS.map(p=>`<li class="${owned(p.id)?'collected':''}" data-supply-badge="${p.id}">${seal(p.id)}<span><strong>${p.badge}</strong><small>${owned(p.id)?'已收藏':'尚未收藏'}</small></span></li>`).join('')}</ol></section>`);
  document.querySelectorAll('[data-supply-pack]').forEach(b=>b.onclick=()=>confirm(b.dataset.supplyPack));
 }
 function confirm(id){
  chosen=PACKS.find(p=>p.id===id);if(!chosen)return;
  const p=chosen;
  render('confirm',p.name+' · 模擬兌換',`<div class="supply-detail"><div class="supply-detail-art">${art(p.id)}<p>${p.description}</p></div><div><p class="supply-price"><small>趣味售價</small><strong>${p.price}</strong></p><h3>這份心意會留下</h3><div class="supply-badge-preview">${seal(p.id)}<span>${p.badge}<small>${owned(p.id)?'已收藏，可再體驗開箱':'一枚紀念徽章'}</small></span></div><p class="supply-explain">這只是遊戲內的模擬，不需要真的按讚、留言、分享或購買飲料。徽章只作紀念。</p></div></div>`, '<button id="supplyBack">返回補給所</button><button id="supplyConfirm" class="primary">確認模擬兌換</button>');
  $('supplyBack').onclick=show;$('supplyConfirm').onclick=()=>{
   if(view!=='confirm')return;
   $('supplyConfirm').disabled=true;
   saved=host.claim(p.id);opening();
  };
 }
 function opening(){
  const p=chosen;if(!p)return;
  const reduced=host.reduceMotion()||media.matches;
  const reveal=p.id==='drink'?`<div class="supply-reveal-box">${art(p.id)}</div><div class="supply-reveal-drink">${art(p.id,true)}</div>`:art(p.id);
  render('opening',p.name+' · 星光開箱',`<div class="supply-opening ${reduced?'supply-still':''}"><div class="supply-open-stage">${reveal}${Array.from({length:6},(_,i)=>`<span class="supply-particle" style="--i:${i}" aria-hidden="true">✦</span>`).join('')}</div><p role="status">正在把心意化成星光…</p></div>`, '<button id="supplySkip">跳過動畫，查看徽章</button>');
  $('supplySkip').onclick=finish;
  if(reduced){finish();return;}
  const token=sequence;timer=setTimeout(()=>{if(view==='opening'&&token===sequence)finish();},1600);
 }
 function finish(){
  if(view!=='opening'||!chosen)return;
  const p=chosen;
  render('result','謝謝你，星光同行者',`<div class="supply-result"><div class="supply-result-art">${art(p.id,p.id==='drink')}</div><div><p class="supply-thanks" role="status">${p.thanks.join('<br>')}</p><div class="supply-badge-preview">${seal(p.id)}<span><small>紀念徽章已收藏</small><strong>${p.badge}</strong></span></div>${saved?'':'<p class="supply-storage-warning" role="status">目前無法儲存到瀏覽器，徽章僅保留至重新整理前。</p>'}</div></div>`, '<button id="supplyReplay">再看一次開箱</button><button id="supplyReturn" class="primary">返回補給所</button>');
  $('supplyReplay').onclick=()=>{if(view==='result')opening();};$('supplyReturn').onclick=show;
 }
 media.addEventListener('change',e=>{if(e.matches&&view==='opening')finish();});
 return{show,dismiss(){cancel();view='closed';chosen=null;},get active(){return view!=='closed';},back(){if(view==='opening'){finish();return true;}if(view==='confirm'||view==='result'){show();return true;}return false;}};
}
root.ForestSupplyShop={create,PACKS,NOTICE};
})(window);
