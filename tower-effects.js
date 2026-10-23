/* Shared battle / archive rendering. Decorative trails never apply damage. */
(function(root){'use strict';
const palettes=[['#83c95b','#70b9ff'],['#ff8b35','#e54a42'],['#36d8c9','#397bdf'],['#b296ff','#ffcf52'],['#ffd365','#eea4e9']];
const base=['#d2e9a0','#ffad50','#9deeff','#bd99ff','#ffe598'];
function color(type,b){return b>=0?palettes[type][b]:base[type];}
const descriptions=[['翠綠連射箭影','冰藍聚能長箭'],['橘紅爆破衝擊環','緋紅火焰與餘燼'],['青綠旋轉雪花','深藍冰晶；每第4擊呈現凍結'],['紫青跳躍電弧','金色集中落雷'],['金色聚焦光束','粉紫流光與儲能光珠']];
const finals=[['滿級：三道箭影與葉形碎光','滿級：長尾光矢與聚焦準星'],['滿級：雙層爆破環與熔火碎片','滿級：螺旋焰柱與環繞餘燼'],['滿級：雙環寒流與六角雪花','滿級：凍結時升起冰晶封鎖'],['滿級：雙色分岔電弧','滿級：金色天雷與雷紋衝擊'],['滿級：多層聚焦環與星芒光束','滿級：雙螺旋流光與月輪光珠']];
function description(type,b,level){return b<0?'選擇專精，預覽不同造型與攻擊特效。':level===5?finals[type][b]:descriptions[type][b];}
function line(c,x,y,tx,ty,col,w){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();}
function ring(c,x,y,r,col,w=2,sy=.6){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.ellipse(x,y,Math.max(.1,r),Math.max(.1,r*sy),0,0,Math.PI*2);c.stroke();}
function star(c,x,y,r,col,angle=0,arms=4){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=col;c.beginPath();for(let i=0;i<arms*2;i++){const a=i*Math.PI/arms,rr=i%2?r*.25:r;i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(rr,0);}c.closePath();c.fill();c.restore();}
function shard(c,x,y,r,col,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.fillStyle=col;c.beginPath();c.moveTo(0,-r);c.lineTo(r*.35,0);c.lineTo(0,r*.4);c.lineTo(-r*.35,0);c.closePath();c.fill();c.restore();}
function arrow(c,x,y,angle,col,length,width){c.save();c.translate(x,y);c.rotate(angle);line(c,-length,0,4,0,col,width);c.fillStyle='#f5ffff';c.beginPath();c.moveTo(9,0);c.lineTo(-1,-4-width);c.lineTo(-1,4+width);c.closePath();c.fill();c.restore();}
function attack(c,f,p,time,simple=false){
 const type=f.type??({arrow:0,fire:1,ice:2,lightning:3}[f.kind]??0),b=f.branch??-1,max=f.level===5,col=color(type,b),x=f.x,y=f.y,tx=f.tx,ty=f.ty,dx=tx-x,dy=ty-y,angle=Math.atan2(dy,dx),count=simple?4:max?12:8;
 c.save();c.lineCap='round';c.lineJoin='round';c.shadowColor=col;c.shadowBlur=simple?0:max?13:7;
 if(type===3){
  c.globalAlpha=Math.max(0,1-p);const bolt=(sx,sy,ex,ey,width,tint,offset=0)=>{c.strokeStyle=tint;c.lineWidth=width;c.beginPath();c.moveTo(sx,sy);for(let j=1;j<=9;j++){const q=j/9,z=j===9?0:Math.sin(j*16+Math.floor(time*24)+offset)*(b===1?8:13);c.lineTo(sx+(ex-sx)*q+z,sy+(ey-sy)*q-z);}c.stroke();};
  bolt(x,y,tx,ty,max?7:4,col);bolt(x,y,tx,ty,1.5,'#fffef7');
  if(b===0&&max){bolt(x,y+4,tx,ty+3,2,'#76fff0',3);if(!simple)for(let j=1;j<=3;j++){const q=j/4;line(c,x+dx*q,y+dy*q,x+dx*q+12,y+dy*q-13,col,1);}}
  if(b===1){if((f.chainIndex??0)===0)bolt(tx-6,ty-(max?85:42),tx,ty,max?9:4,col,2);ring(c,tx,ty+5,(max?35:20)*(p+.2),col,max?3:2);if(max)star(c,tx,ty,24*(1-p),'#fff2a4',time,6);}
  else star(c,tx,ty,(max?18:11)*(1-p),'#e8ffff',time,6);
  c.restore();return;
 }
 const travel=type===0?.63:.42,q=Math.min(1,p/travel),px=x+dx*q,py=y+dy*q-(type===1?Math.sin(q*Math.PI)*28:0);
 if(p<travel){
  if(type===0){
   const length=b===1?(max?47:30):20;line(c,px-dx*.15,py-dy*.15,px,py,col,b===1?max?6:4:2);arrow(c,px,py,angle,col,length,b===1?3:2);
   if(b===0){const n=max?3:2;for(let i=1;i<n;i++){const lag=i*.055,qq=Math.max(0,q-lag);arrow(c,x+dx*qq-Math.sin(angle)*i*4,y+dy*qq+Math.cos(angle)*i*4,angle,col,14,1.5);}}
   if(b===1&&max){ring(c,x,y,16,col,2,1);if(!simple)ring(c,px,py,10,'#d5efff',1,1);}
  }else if(type===1){
   star(c,px,py,max?15:10,col,time*4,6);star(c,px,py,max?8:5,'#fff4cf',-time,5);
   if(b===1)for(let j=0;j<(max?3:2);j++){const qq=Math.max(0,q-j*.065);shard(c,x+dx*qq+Math.sin(time*12+j)*6,y+dy*qq-Math.sin(qq*Math.PI)*28,9,col,-.3);}
  }else{
   if(b===1)shard(c,px,py,max?19:12,col,angle+Math.PI/2);else star(c,px,py,max?17:10,col,time*5,6);
   if(b===0&&max)ring(c,px,py,13,col,1.5,1);
  }
 }else{
  const k=(p-travel)/(1-travel),r=f.radius||24;c.globalAlpha=1-k;c.shadowBlur=simple?0:7;
  if(type===0){star(c,tx,ty,(max?22:13)*(1-k),'#f8ffff',angle,4);if(b===1){ring(c,tx,ty,8+k*18,col,2,1);if(max){line(c,tx-24,ty,tx+24,ty,col,1);line(c,tx,ty-24,tx,ty+24,col,1);}}else for(let j=0;j<(simple?3:max?8:4);j++)shard(c,tx+Math.cos(j*2)*k*24,ty+Math.sin(j*2)*k*20,5,col,j);}
  if(type===1){
   if(b===1){ring(c,tx,ty+6,r*.5,col,2);const n=simple?3:max?7:4;for(let j=0;j<n;j++){const a=j*6.28/n+time*4;shard(c,tx+Math.cos(a)*r*.45,ty+Math.sin(a)*r*.18-k*(max?34:18),max?16:10,col,Math.sin(time*6+j)*.4);}if(max)for(let j=0;j<2;j++){c.strokeStyle=j? '#ffd7e7':col;c.lineWidth=3;c.beginPath();for(let z=0;z<=12;z++){const xx=tx+Math.sin(z*.7+time*9+j*Math.PI)*(14-z*.7),yy=ty-z*4;z?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}}
   else{ring(c,tx,ty+4,6+k*r,col,max?4:3);if(max)ring(c,tx,ty+4,6+k*r*.7,'#ffdd77',2);star(c,tx,ty,24*(1-k),'#fff0a1',time,8);for(let j=0;j<count;j++){const a=j*6.28/count;shard(c,tx+Math.cos(a)*k*r,ty+Math.sin(a)*k*r*.5-k*12,6*(1-k)+2,col,a);}}
  }
  if(type===2){
   if(b===1){if(f.freeze){ring(c,tx,ty+8,21,col,2);for(let j=0;j<(simple?3:max?6:4);j++){const a=j*6.28/(simple?3:max?6:4);shard(c,tx+Math.cos(a)*20,ty+Math.sin(a)*9, max?34:20,j%2?col:'#c9e8ff',a*.15);}star(c,tx,ty-10,max?22:12,'#e6faff',time*.2,6);}else{shard(c,tx,ty,18*(1-k),col,.2);ring(c,tx,ty,6+k*16,col,2);}}
   else{ring(c,tx,ty+6,8+k*r,col,2);if(max)ring(c,tx,ty+6,8+k*r*.65,'#d5ffff',2);for(let j=0;j<count;j++){const a=j*6.28/count+time;star(c,tx+Math.cos(a)*k*r,ty+Math.sin(a)*k*r*.5,(max?8:5)*(1-k)+1,col,a,6);}}
  }
 }
 c.restore();
}
function beam(c,f,time,simple=false){
 const b=f.branch??-1,max=f.level===5,col=color(4,b),x=f.x,y=f.y,tx=f.tx,ty=f.ty,charge=f.charge||0,dx=tx-x,dy=ty-y,length=Math.hypot(dx,dy)||1,nx=-dy/length,ny=dx/length;
 c.save();c.lineCap='round';c.shadowColor=col;c.shadowBlur=simple?0:12;
 line(c,x,y,tx,ty,col,(max?7:4)+charge*.5);line(c,x,y,tx,ty,'#fffdf6',1.5+charge*.18);
 if(b===1){
  for(let j=0;j<(max?2:1);j++){c.strokeStyle=j?'#fff0ff':col;c.lineWidth=max?2.5:1.5;c.beginPath();const n=simple?12:26;for(let i=0;i<=n;i++){const q=i/n,off=Math.sin(q*18-time*8+j*Math.PI)*(max?9:5)*Math.sin(q*Math.PI);const xx=x+dx*q+nx*off,yy=y+dy*q+ny*off;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}c.stroke();}
  for(let j=0;j<(max?4:2);j++){const a=time*2+j*6.28/(max?4:2);star(c,x+Math.cos(a)*18,y+Math.sin(a)*12,max?5:3,'#fff1ff',a,4);}if(max)ring(c,tx,ty,18+Math.sin(time*4)*3,col,2,1);
 }else{
  const rings=max?3:1;for(let j=0;j<rings;j++){const q=.08+j*.1;ring(c,x+dx*q,y+dy*q,9+charge*.5+j*2,col,1.5,1);}
  star(c,tx,ty,(max?17:9)+Math.sin(time*14)*2,'#fff7cd',time*.4,max?8:4);
  if(max&&!simple){for(let j=0;j<3;j++){const q=(time*.75+j/3)%1;star(c,x+dx*q,y+dy*q,4,col,time,4);}}
 }
 c.restore();
}
root.TowerEffects={color,description,attack,beam};
})(typeof window==='undefined'?globalThis:window);
