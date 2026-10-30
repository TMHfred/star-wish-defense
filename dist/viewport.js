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
// Phaser 4 no longer consumes the old GameConfig.resolution option.
// Render into real device pixels; keep scene layout and DOM hit areas in CSS pixels.
function density(width,height){return Math.max(1,Math.min(root.devicePixelRatio||1,2,Math.sqrt(3000000/(width*height))));}
function renderSize(){const view=measure(),ratio=density(view.width,view.height);return{width:Math.round(view.width*ratio),height:Math.round(view.height*ratio),zoom:1/ratio};}
function bind(game){
 let frame=0,timers=[],disposed=false;
 const host=document.getElementById('game');
 function sync(){
  frame=0;if(disposed||!game.isBooted)return;
  const {width,height}=measure();
  host.style.width=width+'px';host.style.height=height+'px';
  const ratio=density(width,height),pw=Math.round(width*ratio),ph=Math.round(height*ratio);
  game.renderDensity=ratio;
  if(game.scale.zoom!==1/ratio)game.scale.setZoom(1/ratio);
  if(game.scale.width!==pw||game.scale.height!==ph)game.scale.resize(pw,ph);
  // Pixel-budget rounding must never leak into CSS size or input bounds.
  game.canvas.style.width=width+'px';game.canvas.style.height=height+'px';
  game.scale.updateBounds();
  game.scale.displayScale.set(pw/width,ph/height);
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
root.ForestViewport={measure,density,renderSize,bind};
})(window);
