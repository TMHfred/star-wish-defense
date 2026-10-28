/* Keep renderer pixels and DOM hit targets on one visible CSS viewport. */
(function(root){'use strict';
function measure(){
 const doc=document.documentElement,visual=root.visualViewport;
 const width=Math.max(1,Math.round(doc.clientWidth||root.innerWidth));
 const heights=[doc.clientHeight,root.innerHeight].filter(n=>Number.isFinite(n)&&n>0);
 // Ignore a stale portrait visual viewport during rotation, and preserve pinch zoom.
 if(visual&&Math.abs(visual.scale-1)<.01&&Math.abs(visual.width-width)<2&&visual.height>0)heights.push(visual.height);
 return{width,height:Math.max(1,Math.round(Math.min(...heights)))};
}
function bind(game){
 let frame=0,timers=[],disposed=false;
 const host=document.getElementById('game');
 function sync(){
  frame=0;if(disposed||!game.isBooted)return;
  const {width,height}=measure();
  host.style.width=width+'px';host.style.height=height+'px';
  if(game.scale.width!==width||game.scale.height!==height)game.scale.resize(width,height);
  else game.scale.updateBounds();
  // Refresh the shared world transform and DOM hit areas even after same-size restore.
  root.battle?.layout();
 }
 function schedule(){
  if(disposed)return;
  if(!frame)frame=requestAnimationFrame(sync);
  timers.forEach(clearTimeout);
  // Mobile layout/visual viewport updates may arrive on different frames.
  timers=[setTimeout(sync,100),setTimeout(sync,350)];
 }
 const listeners=[];
 function listen(target,event,handler=schedule){if(!target)return;target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));}
 for(const event of ['resize','orientationchange','pageshow','focus'])listen(root,event);
 listen(document,'visibilitychange',()=>{if(!document.hidden)schedule();});
 listen(document,'fullscreenchange');
 listen(root.visualViewport,'resize');listen(root.visualViewport,'scroll');
 game.events.once('ready',schedule);
 game.events.once('destroy',()=>{disposed=true;cancelAnimationFrame(frame);timers.forEach(clearTimeout);listeners.forEach(remove=>remove());});
 schedule();
 return{sync:schedule};
}
root.ForestViewport={measure,bind};
})(window);
