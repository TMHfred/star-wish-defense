/* Unified hand-painted tower atlas. Geometry uses visible silhouette, never atlas cell size. */
(function(root){'use strict';
const crops=[[[63, 32, 249, 275], [377, 15, 231, 292], [669, 33, 228, 276], [959, 30, 229, 279], [1246, 31, 235, 277], [45, 333, 265, 283], [364, 328, 261, 289], [669, 332, 229, 285], [946, 339, 258, 279], [1234, 324, 259, 294], [36, 652, 298, 324], [350, 637, 290, 341], [653, 635, 262, 343], [939, 635, 273, 343], [1219, 632, 295, 347]], [[52, 61, 271, 242], [367, 27, 225, 277], [647, 33, 235, 271], [963, 52, 223, 252], [1248, 33, 233, 271], [31, 342, 303, 284], [344, 322, 272, 306], [632, 322, 274, 306], [945, 345, 258, 282], [1228, 321, 281, 305], [10, 644, 338, 336], [342, 637, 277, 342], [618, 638, 303, 342], [927, 637, 289, 343], [1222, 637, 299, 343]], [[75, 18, 275, 287], [394, 20, 252, 284], [709, 25, 225, 277], [1011, 26, 247, 279], [1332, 55, 241, 250], [49, 324, 316, 295], [381, 320, 282, 296], [687, 315, 263, 302], [991, 321, 287, 297], [1319, 341, 268, 276], [28, 637, 350, 315], [383, 630, 285, 318], [683, 627, 273, 324], [984, 627, 296, 324], [1298, 637, 303, 314]]];
const sources=['base','a','b'].map(n=>'assets/towers-'+n+'-v14.webp');
const images=typeof Image==='undefined'?[]:sources.map(src=>{const im=new Image();im.src=src;im.onload=()=>root.dispatchEvent(new Event('towerartready'));return im;});
const cache=new Map();
function layout(type,level=1,branch=-1){
 level=Math.max(1,Math.min(5,level));branch=level<3?-1:branch;
 if(level>3&&branch<0)branch=0;
 const key=[type,level,branch].join(':');if(cache.has(key))return cache.get(key);
 const sheet=branch<0?0:branch+1,row=branch<0?level-1:level-3,crop=crops[sheet][row*5+type];
 let scale=Math.max([0,65,73,82,93,108][level]/crop[3],[0,50,55,61,68,78][level]/crop[2]);
 // Both silhouette dimensions must grow, including the first specialization.
 const prev=branch>=0&&level===3?layout(type,3,-1):level>1?layout(type,level-1,branch):null;
 if(prev)scale=Math.max(scale,prev.width*1.025/crop[2],prev.height*1.025/crop[3]);
 const result={sheet,crop,width:crop[2]*scale,height:crop[3]*scale,scale};cache.set(key,result);return result;
}
function draw(c,type,level,x,bottom,factor=1,branch=-1,alpha=1){const a=layout(type,level,branch),im=images[a.sheet];if(!im?.naturalWidth)return;const w=a.width*factor,h=a.height*factor;c.save();c.globalAlpha*=alpha;c.drawImage(im,...a.crop,x-w/2,bottom-h,w,h);c.restore();}
root.TowerArt={layout,draw,crops,sources};if(typeof module!=='undefined')module.exports=root.TowerArt;
})(typeof window==='undefined'?globalThis:window);
