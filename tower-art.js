/* Approved chibi designs: base, two branches, and distinct branch finals. */
(function(root){'use strict';
const names=['bow','fire','ice','lightning','beam','meteor'];
const manifest=root.ArtManifest||{};
const sources=names.map(n=>manifest[n]?.src);
const crops=names.map(n=>manifest[n]?.crops||[]);
const images=typeof Image==='undefined'?[]:sources.map(src=>{const im=new Image();if(src)im.src=src;im.onload=()=>root.dispatchEvent(new Event('towerartready'));return im;});
function layout(type,level=1,branch=-1){
 const final=type===5?level>=2:level>=6;
 const index=type===5?(final?1:0):branch<0||level<3?0:(final?3:1)+branch;
 const crop=crops[type][index]||[0,0,1,1];
 const width=type===5?(final?60:52):final?60:branch>=0&&level>=3?56:50;
 const height=Math.min(final?82:branch>=0&&level>=3?76:68,width*crop[3]/crop[2]);
 return {sheet:type,index,crop,width,height,scale:width/crop[2]};
}
function battlefieldFactor(){return 1;}
function draw(c,type,level,x,bottom,factor=1,branch=-1,alpha=1){
 const a=layout(type,level,branch),im=images[a.sheet];if(!im?.naturalWidth)return;
 c.save();c.globalAlpha*=alpha;c.drawImage(im,...a.crop,x-a.width*factor/2,bottom-a.height*factor,a.width*factor,a.height*factor);c.restore();
}
root.TowerArt={layout,draw,battlefieldFactor,crops,sources};
if(typeof module!=='undefined')module.exports=root.TowerArt;
})(typeof window==='undefined'?globalThis:window);
