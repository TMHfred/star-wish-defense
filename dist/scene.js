/* Phaser 4.2.1 owns rendering, texture cache, input and visual feedback.
   model.js owns world coordinates, targeting, damage, wave timing and economy. */
(function(){'use strict';const F=Forest,artURL=ForestArt.url;
class ForestScene extends Phaser.Scene{
constructor(){super('forest');}
preload(){this.load.on('progress',v=>{document.getElementById('loadBar').style.width=(v*100)+'%'});this.load.on('loaderror',f=>{document.getElementById('loadText').textContent='素材讀取失敗：'+f.key+'，請重新整理';});for(const tower of F.TOWERS)for(let i=0;i<tower.forms.length;i++)this.load.image(tower.id+i,artURL(`assets/${tower.id}-${i}.webp`));for(const i of [...new Set(F.ENEMIES.map(e=>e.art))])this.load.image('enemy'+i,`assets/monsters-${i}.webp`);for(const [key,file]of [['forest','forest.webp'],['earth','earth.webp'],['castle','castle-0.webp'],['portal','portal.webp'],['river-prop','river-prop.webp'],['ruin-prop','ruin-prop.webp'],['lantern-prop','lantern-prop.webp']])this.load.image(key,'assets/'+file);}
create(){this.model=new F.Game(0,F.emptyProgress());this.selected=-1;this.playing=false;this.ambient=0;this.effectsLow=false;this.reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');this.reducedMotion.addEventListener('change',()=>this.trimEffects());this.enemyViews=new Map;this.towerViews=new Map;this.background=this.add.image(0,0,'forest');this.wash=this.add.graphics();this.world=this.add.container(0,0);this.buildWorld();this.layout();this.scale.on('resize',()=>this.layout());this.input.on('pointerdown',(pointer,objects)=>{if(this.playing&&!document.getElementById('modal').open&&!objects.length&&pointer.event?.target===this.game.canvas)window.UI?.cancelSelection();});document.getElementById('loader').hidden=true;window.battle=this;window.dispatchEvent(new Event('forest-ready'));}
buildWorld(){
 const stage=this.model.stage,theme=F.CHAPTERS[stage.chapter].theme;
 this.background.setTint([0xffffff,0xb8e2e5,0xc6d9f4,0xa7a0d0][stage.chapter]);
 this.decor=this.add.graphics();this.world.add(this.decor);this.drawDecor(theme);
 if(stage.chapter>0){
  const key=['','river-prop','ruin-prop','lantern-prop'][stage.chapter],size=stage.chapter===2?105:150;
  for(const [x,y]of [[80,400],[1200,410],[80,120],[1180,100]]){
   if(stage.pads.some(p=>Math.hypot(x-p[0],y-45-p[1])<110)||ForestStages.gapToRoute(x,y-45,stage.routes)<90)continue;
   const prop=this.add.image(x,y,key).setOrigin(.5,1);prop.setScale(size/prop.width);this.world.add(prop);
  }
 }
 this.makeRoad();this.road=this.add.image(0,0,'road').setOrigin(0);this.world.add(this.road);
 this.padViews=[];this.awakenings=new Map;
 this.model.pads.forEach(([x,y],i)=>{
  const g=this.add.graphics();this.drawPad(g,x,y,i);this.world.add(g);this.padViews.push(g);
  const z=this.add.zone(x,y-18,108,95).setInteractive({useHandCursor:true});this.world.add(z);z.on('pointerdown',pointer=>{if(this.playing&&pointer.event?.target===this.game.canvas)window.UI?.select(i);});
 });
 this.range=this.add.graphics();this.world.add(this.range);this.activation=this.add.graphics();this.world.add(this.activation);this.shadowLayer=this.add.graphics();this.world.add(this.shadowLayer);this.creatures=this.add.container(0,0);this.world.add(this.creatures);
 this.portals=this.model.routes.map(route=>{const [x,y]=route[0];const p=this.add.image(x,y+17,'portal').setOrigin(.5,1).setDisplaySize(76,82);this.creatures.add(p);return p;});
 const [cx,cy]=this.model.routes[0].at(-1);this.castle=this.add.image(cx,cy+21,'castle').setOrigin(.5,1).setDisplaySize(119,132);this.creatures.add(this.castle);this.applyCosmetics();
 this.preview=this.add.image(0,0,'bow0').setOrigin(.5,1).setVisible(false);this.creatures.add(this.preview);
 this.projectile=this.add.graphics();this.world.add(this.projectile);this.effectLayer=this.add.container(0,0);this.world.add(this.effectLayer);this.leaves=this.add.graphics();this.world.add(this.leaves);
}
drawDecor(theme){
 const g=this.decor;
 if(theme==='river'){
  g.fillStyle(0x397c9e,.6).fillRoundedRect(0,375,1280,40,18);
  for(let x=20;x<1280;x+=70){g.lineStyle(2,0xb9f1ef,.5).lineBetween(x,390,x+35,390);g.fillStyle(0x9cc68c,.7).fillEllipse(x+20,380,24,9);}
 }
 if(theme==='frost'){
  for(let i=0;i<16;i++){const x=35+i*79;g.fillStyle(0xe0edff,.45).fillEllipse(x,402-i%3*5,90,26);g.fillStyle(0xb3d8fb,.7).fillTriangle(x,382,x+8,356-i%2*8,x+17,383);g.lineStyle(1,0xf4fbff,.8).lineBetween(x+8,359,x+8,382);}
  g.fillStyle(0xe5efff,.08).fillRect(0,0,1280,400);
 }
 if(theme==='sanctuary'){
  g.lineStyle(2,0xe5cbff,.4);for(let x=70;x<1280;x+=175){g.strokeCircle(x,391,28);g.lineBetween(x-35,391,x+35,391);g.fillStyle(0xffe5a8,.8).fillCircle(x,391,3);}
 }
}
makeRoad(){
 const c=document.createElement('canvas');c.width=1280;c.height=440;const x=c.getContext('2d'),chapter=this.model.stage.chapter;
 x.lineJoin='miter';x.lineCap='round';
 for(const route of this.model.routes){const p=new Path2D;p.moveTo(...route[0]);for(const point of route.slice(1))p.lineTo(...point);
  for(const [width,color]of [[56,'#3e4e3028'],[48,['#72854770','#7aafb899','#b6cde4bb','#9e8bb4aa'][chapter]],[43,x.createPattern(this.textures.get('earth').getSourceImage(),'repeat')],[27,['#edcf9929','#a7d6e833','#e5f2ff66','#dcc9ef44'][chapter]]]){x.strokeStyle=color;x.lineWidth=width;x.stroke(p);}
  for(let j=1;j<route.length;j++){const a=route[j-1],b=route[j],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
   for(let d=17;d<len-10;d+=29)for(const side of [-1,1]){const xx=a[0]+dx*d/len+nx*25*side,yy=a[1]+dy*d/len+ny*25*side;x.fillStyle=['#91a360aa','#9ab7b4aa','#dbe8f5cc','#cbb4dfaa'][chapter];x.beginPath();x.ellipse(xx,yy,3,1.5,j,0,7);x.fill();}
   const mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;x.strokeStyle='#537f6470';x.lineWidth=2;x.beginPath();x.moveTo(mx-dx/len*4+nx*4,my-dy/len*4+ny*4);x.lineTo(mx+dx/len*3,my+dy/len*3);x.lineTo(mx-dx/len*4-nx*4,my-dy/len*4-ny*4);x.stroke();
  }
 }
 this.textures.addCanvas('road',c);
}
layout(){const {width:w,height:h}=ForestViewport.measure();this.cameras.main.setOrigin(0,0).setZoom(this.scale.width/w,this.scale.height/h);const size=this.textures.get('forest').getSourceImage();const cover=Math.max(w/size.width,h/size.height);this.background.setPosition(w/2,h/2).setScale(cover);this.wash.clear();const chapter=this.model.stage.chapter;if(chapter)this.wash.fillStyle([0,0x82cee3,0xe2eeff,0x302052][chapter],[0,.12,.4,.3][chapter]).fillRect(0,0,w,h);const top=h<500?78:123,bottom=h<500?80:110;this.worldScale=Math.min((w-62)/1280,(h-top-bottom)/400);this.worldScale=Math.max(.1,this.worldScale);this.world.setScale(this.worldScale).setPosition((w-1280*this.worldScale)/2,top+(h-top-bottom-400*this.worldScale)/2);window.UI?.layout?.();}
reset(stageId=this.model.stageId,progress=this.model.progress){this.tweens.killAll();this.time.removeAllEvents();this.model=new F.Game(stageId,progress);this.enemyViews.clear();this.towerViews.clear();this.world.removeAll(true);this.textures.remove('road');this.selected=-1;this.buildWorld();this.layout();}
applyCosmetics(progress=this.model.progress){const style=F.CASTLE_STYLES.find(r=>r.id===F.readProgress(progress).castleStyle);this.castle.setTint(style.tint);}
drawPad(g,x,y,index){
 // Weathered stone is static: deterministic details, cached once per stage.
 const top=[[-44,-5],[-31,-16],[-19,-18],[20,-19],[32,-14],[43,-4],[42,8],[22,21],[-24,21],[-44,8]];
 const points=(dy=0)=>top.map(([a,b])=>({x:x+a,y:y+b+dy}));
 let seed=139+index*821+this.model.stage.chapter*37;
 const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 g.fillStyle(0x273b25,.12).fillEllipse(x,y+18,118,47);
 g.fillStyle(0x34412a,.18).fillEllipse(x+2,y+18,102,34);
 g.fillStyle(0x665f4b).fillPoints(points(8),true);
 g.lineStyle(1.4,0x4e5540,.8).strokePoints(points(8),true);
 g.fillStyle(0xaaa58b).fillPoints(points(),true);
 g.lineStyle(1.4,0xd1cab0,.7).strokePoints(points(),true);
 // Uneven mineral flecks, mortar and chips avoid the clean icon-like surface.
 for(let i=0;i<38;i++){const dx=(rand()-.5)*72,dy=(rand()-.5)*29;g.fillStyle(i%3?0x747962:0xd9d1b1,.16+rand()*.18).fillEllipse(x+dx,y+dy,1+rand()*5,1+rand()*2);}
 g.lineStyle(1.2,0x757761,.65).lineBetween(x-31,y-3,x+29,y-3).lineBetween(x+3,y-16,x+3,y-3).lineBetween(x-16,y-2,x-16,y+18).lineBetween(x+25,y-2,x+25,y+17);
 const flip=index%2?-1:1;
 for(const crack of [[[-34,-12],[-25,-6],[-29,1],[-17,8],[-20,16]],[[26,-15],[18,-9],[20,-4],[12,3]],[[42,7],[30,8],[25,15]]]){
  const pts=crack.map(([dx,dy])=>({x:x+dx*flip,y:y+dy}));g.lineStyle(2.2,0x61654f,.85).strokePoints(pts);g.lineStyle(.65,0xe0d8b5,.65).strokePoints(pts.map(p=>({x:p.x+1,y:p.y+1})));
 }
 g.fillStyle(0x717660).fillTriangle(x-42,y+8,x-34,y+11,x-40,y+17).fillTriangle(x+25,y+22,x+31,y+17,x+30,y+25);
 for(const [mx,my,r]of [[-35,12,16],[31,10,13],[-25,-13,10],[10,21,12]]){
  g.fillStyle(0x526d3f,.75).fillEllipse(x+mx,y+my,r,5);
  for(let j=0;j<7;j++)g.fillStyle(j%2?0x94a45e:0x738d49,.7).fillEllipse(x+mx+(rand()-.5)*r,y+my+(rand()-.5)*5,2+rand()*4,1+rand()*2);
 }
 for(const side of [-1,1])for(let j=0;j<5;j++){const xx=x+side*(36+j*2),yy=y+20+(j%2)*3;g.lineStyle(1, j%2?0x889b52:0x5c7a43,.85).lineBetween(xx,yy,xx+side*(j-2),yy-4-rand()*5);}
}
awaken(t){
 // Feedback never delays construction, aiming or damage. It also works during pause.
 this.awakenings.set(t.id,{pad:t.pad,started:this.time.now,duration:this.simpleEffects?180:600});
}
drawAwakenings(time){
 const g=this.activation;g.clear();
 for(const [id,a]of this.awakenings){
  if(!this.model.towers.some(t=>t.id===id)){this.awakenings.delete(id);continue;}
  const q=Math.min(1,Math.max(0,(time-a.started)/a.duration));if(q>=1){this.awakenings.delete(id);continue;}
  const [x,y]=this.model.pads[a.pad],fade=1-q;
  g.fillStyle(0xffe7a2,.18*fade).fillEllipse(x,y+11,88+q*36,32+q*14);
  g.lineStyle(2,0xffe2a0,fade).strokeEllipse(x,y+8,75+q*43,27+q*16);
  g.lineStyle(1.4,0xfff4c4,fade).lineBetween(x-31,y+5,x-12,y-2).lineBetween(x-12,y-2,x,y+5).lineBetween(x,y+5,x+30,y-5);
  if(!this.simpleEffects)for(let i=0;i<5;i++){const dx=(i-2)*15,yy=y-8-q*(24+i%2*12);g.lineStyle(1,0xffefb5,fade).lineBetween(x+dx-3,yy,x+dx+3,yy).lineBetween(x+dx,yy-4,x+dx,yy+4);}
 }
}

select(i){this.selected=i;this.drawRange();}
drawRange(previewType=-1){
 this.range.clear();this.preview.setVisible(false);
 const t=this.model.towers.find(t=>t.pad===this.selected),show=this.selected>=0&&!t&&F.TOWERS[previewType];
 this.padViews.forEach((v,i)=>v.setVisible(!this.model.towers.some(t=>t.pad===i)&&!(show&&i===this.selected)));
 if(this.selected<0)return;
 const [x,y]=this.model.pads[this.selected],valid=t||!show||!this.model.reason(this.selected,previewType),color=valid?0xf9e5a3:0xe89c8d;
 this.range.fillStyle(color,.13).fillEllipse(x,y+7,104,43);
 this.range.lineStyle(2,color,.95).strokeEllipse(x,y+7,99,40);
 if(!t&&!show){this.range.lineStyle(1.5,color,.9).lineBetween(x-22,y+4,x,y-9).lineBetween(x,y-9,x+23,y+5).lineBetween(x+23,y+5,x,y+17).lineBetween(x,y+17,x-22,y+4);this.range.lineBetween(x-7,y+4,x+7,y+4).lineBetween(x,y-3,x,y+11);}
 if(show){
  this.preview.setTexture(F.TOWERS[previewType].id+'0').setPosition(x,y+17).setAlpha(.48).setVisible(true);
  this.preview.setScale(118/this.preview.width);this.preview.clearTint();if(!valid)this.preview.setTint(0xe5aaa1);
 }
 if(!t&&!show)return;
 const r=this.model.stats(t||{type:previewType,level:1,branch:-1}).range;
 this.range.fillStyle(color,.055).fillCircle(x,y,r);
 this.range.lineStyle(2.5,color,.85).strokeCircle(x,y,r);
}
get effectsLow(){return !!this._effectsLow;}
set effectsLow(value){this._effectsLow=!!value;this.trimEffects();}
trimEffects(){if(!this.effectLayer)return;while(this.effectLayer.length>this.effectLimit){const child=this.effectLayer.list.at(-1);this.tweens.killTweensOf(child);child.destroy();}}
get effectLimit(){return this.effectsLow||this.reducedMotion.matches?48:144;}
get simpleEffects(){return this.effectsLow||this.reducedMotion.matches;}
addTower(t){const im=this.add.image(t.x,t.y+17,F.TOWERS[t.type].id+F.variant(t)).setOrigin(.5,1);this.creatures.add(im);this.towerViews.set(t.id,im);this.sizeTower(t,im);this.padViews[t.pad].setVisible(false);this.drawRange();this.burst(t.x,t.y,0xe7d48b,12,40);this.syncShadows();this.awaken(t);}
sizeTower(t,im){this.tweens.killTweensOf(im);im.setTexture(F.TOWERS[t.type].id+F.variant(t));const width=F.finalForm(t)?146:t.level>=2?132:118;im.baseScale=width/im.width;im.setScale(im.baseScale);}
syncShadows(){this.shadowLayer.clear();for(const t of this.model.towers){this.shadowLayer.fillStyle(0x284c32,.22).fillEllipse(t.x+2,t.y+10,F.finalForm(t)?96:80,24);this.shadowLayer.fillStyle(0x24402c,.14).fillEllipse(t.x,t.y+8,58,15);}}
burst(x,y,color,count=7,radius=24){count=Math.min(this.simpleEffects?Math.min(count,3):count,this.effectLimit-this.effectLayer.length);for(let i=0;i<count;i++){const a=Math.PI*2*i/count+Math.random()*.5,r=radius*(.5+Math.random()*.5);const p=this.add.circle(x,y,2+Math.random()*2,color,.9);this.effectLayer.add(p);this.tweens.add({targets:p,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r-9,alpha:0,scale:0,duration:360+Math.random()*250,ease:'Quad.Out',onComplete:()=>p.destroy()});}}
ring(x,y,color,r=60){if(this.effectLayer.length>=this.effectLimit)return;const c=this.add.circle(x,y,5,color,.12).setStrokeStyle(2,color,.9);this.effectLayer.add(c);this.tweens.add({targets:c,scale:r/5,alpha:0,duration:this.simpleEffects?220:400,ease:'Cubic.Out',onComplete:()=>c.destroy()});}
float(x,y,str,color='#fff1b9'){if(this.effectLayer.length>=this.effectLimit)return;const t=this.add.text(x,y,str,{fontFamily:'system-ui',fontSize:16,fontStyle:'bold',color,stroke:'#34523a',strokeThickness:3}).setOrigin(.5);this.effectLayer.add(t);this.tweens.add({targets:t,y:y-37,alpha:0,duration:800,ease:'Quad.Out',onComplete:()=>t.destroy()});}
process(){for(const e of this.model.drain()){switch(e.type){case'build':this.addTower(e.tower);break;case'upgrade':{const v=this.towerViews.get(e.tower.id);this.sizeTower(e.tower,v);this.ring(e.tower.x,e.tower.y,0xf3d77e,80);this.burst(e.tower.x,e.tower.y-45,0xfbe8a0,18,70);this.float(e.tower.x,e.tower.y-90,'Lv.'+e.tower.level);this.syncShadows();this.drawRange();break;}case'sell':this.towerViews.get(e.tower.id)?.destroy();this.towerViews.delete(e.tower.id);this.padViews[e.tower.pad].setVisible(true);this.float(e.tower.x,e.tower.y,'+'+e.gold);this.syncShadows();break;case'spawn':{const v=this.add.container(e.enemy.x,e.enemy.y);const d=F.ENEMIES[e.enemy.type],w=d.boss?89:d.child?34:d.split?66:d.trial?47:55,im=this.add.image(0,4,'enemy'+d.art).setOrigin(.5,1);im.setScale(w/im.width);im.baseScale=im.scaleX;if(d.tint)im.setTint(d.tint);if(e.enemy.splitFrom!==null){im.setAlpha(.4);this.tweens.add({targets:im,alpha:1,duration:180});}const bar=this.add.graphics();v.add([im,bar]);v.body=im;v.bar=bar;this.creatures.add(v);this.enemyViews.set(e.enemy.id,v);break;}case'fire':{const v=this.towerViews.get(e.tower.id);if(v){this.tweens.killTweensOf(v);v.setScale(v.baseScale*1.025,v.baseScale*.975);this.tweens.add({targets:v,scaleX:v.baseScale,scaleY:v.baseScale,duration:150});}this.burst(e.shot.x,e.shot.y,[0xc0dfa0,0xffc469,0xa9edff,0xd6b4ff,0xfff1ac,0xe6bdff][e.tower.type],3,12);window.UI?.sound(['arrow','fire','ice','lightning','beam','meteor'][e.tower.type]);break;}case'hit':{const v=this.enemyViews.get(e.enemy.id);if(v&&e.damage>1){v.body.setTint(0xffe5b4);this.time.delayedCall(70,()=>{if(v.active)v.body.clearTint();});}break;}case'kill':{this.burst(e.enemy.x,e.enemy.y-15,0xe5d59a,6,24);this.float(e.enemy.x,e.enemy.y-35,'+'+e.gold);break;}case'split':this.ring(e.x,e.y,0xa9ebce,28);this.burst(e.x,e.y-15,0xb3f2d8,8,28);break;case'chain':this.drawChain(e);break;
case'impact':this.impact(e);break;
case'leak':this.ring(1170,298,0xd58677,80);this.float(1170,210,'−'+e.enemy.leak,'#ffc3ac');window.UI?.sound('leak');break;}
window.UI?.event(e);}}
drawChain(e){
 if(this.effectLayer.length>=this.effectLimit)return;
 const g=this.add.graphics();this.effectLayer.add(g);const strong=e.shot?.branch===1;
 for(let i=1;i<e.points.length;i++){
  const a=e.points[i-1],b=e.points[i],alpha=Math.max(.3,1-(i-1)*.12),width=strong&&i===1?5:2.5;
  if(!this.simpleEffects)g.lineStyle(width+7,0xa77cff,.18*alpha).lineBetween(a.x,a.y,b.x,b.y);
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,nx=-dy/len,ny=dx/len;
  const points=[a,{x:a.x+dx*.32+nx*8,y:a.y+dy*.32+ny*8},{x:a.x+dx*.66-nx*6,y:a.y+dy*.66-ny*6},b];
  g.lineStyle(width,0xdbc7ff,alpha).strokePoints(points,false);
  g.lineStyle(1,0xffffff,alpha).strokePoints(points,false);
  g.fillStyle(0xf1e6ff,alpha).fillCircle(b.x,b.y,strong?5:3);
 }
 this.tweens.add({targets:g,alpha:0,duration:this.simpleEffects?100:180,onComplete:()=>g.destroy()});
}
impact(e){
 const p=e.shot;if(!e.landed||p.type===3)return;
 const x=e.x??p.tx,y=e.y??p.ty,color=[0xe4efb4,p.branch===1?0xf19a54:0xffc775,0xb4efff,0xd6b4ff,0xfff1ac,0xd4b7ff][p.type];
 if(p.stats.splash)this.ring(x,y,color,p.stats.splash);
 this.burst(x,y-10,color,p.type===5?16:p.final?9:5,p.type===5?p.stats.splash*.65:p.type===1?35:20);
 if(this.effectLayer.length>=this.effectLimit)return;
 const g=this.add.graphics();this.effectLayer.add(g);
 if(p.type===2){
  for(let i=0;i<(p.freeze?8:5);i++){const a=i*Math.PI*2/(p.freeze?8:5),dx=Math.cos(a),dy=Math.sin(a);g.fillStyle(i%2?0x79c7ee:0xe3fbff,.9).fillTriangle(x+dx*8,y+dy*8-12,x+dx*29-dy*4,y+dy*29+dx*4-12,x+dx*24+dy*4,y+dy*24-dx*4-12);}
 }else{
  g.fillStyle(color,.22).fillEllipse(x,y-8,p.type===5?78:p.type===1?46:22,p.type===5?40:23);
  g.lineStyle(p.type===5?4:2,0xfff7d7,.95).lineBetween(x-9,y-10,x+9,y-10).lineBetween(x,y-19,x,y-1);
 }
 this.tweens.add({targets:g,alpha:0,duration:this.simpleEffects?120:p.type===5?330:210,onComplete:()=>g.destroy()});
}
drawShot(p){
 const g=this.projectile,q=Math.min(1,p.time/p.duration);let tx=p.tx,ty=p.ty;
 if(p.type===3)return;
 if(p.type===0||p.type===2&&!p.stats.splash){const target=this.model.enemies.find(e=>e.id===p.target);if(target){tx=target.x;ty=target.y-15;}}
 let x=p.x+(tx-p.x)*q,y=p.y+(ty-p.y)*q;
 if(p.type===5){
  g.fillStyle(0xb898eb,.045).fillCircle(tx,ty,p.stats.splash);g.lineStyle(2,0xd4b2ff,.75).strokeCircle(tx,ty,p.stats.splash);
  g.lineStyle(2,0xfff0c0,.9).lineBetween(tx-8,ty,tx+8,ty).lineBetween(tx,ty-8,tx,ty+8);
  g.lineStyle(1,0xffe8a3,.5).strokeCircle(tx,ty,p.stats.splash*q);
  x=tx-95*(1-q);y=ty-240*(1-q);
  g.lineStyle(14,0xb388ed,.25).lineBetween(x-26,y-60,x,y);
  g.lineStyle(5,0xffd083,.8).lineBetween(x-15,y-40,x,y);
  g.fillStyle(0xe8b7ff,.95).fillCircle(x,y,p.final?18:14);g.fillStyle(0xfff0b0,1).fillCircle(x+3,y-2,8);return;
 }
 if(p.type===2){const a=Math.atan2(ty-p.y,tx-p.x),dx=Math.cos(a),dy=Math.sin(a);
  g.lineStyle(p.freeze?7:4,0x8cdbff,.22).lineBetween(x-dx*28,y-dy*28,x,y);
  g.lineStyle(2,0xd8faff,.85).lineBetween(x-dx*20,y-dy*20,x,y);
  g.fillStyle(p.freeze?0xffffff:0xc8f4ff,1).fillTriangle(x+dx*9,y+dy*9,x-dx*6-dy*5,y-dy*6+dx*5,x-dx*6+dy*5,y-dy*6-dx*5);return;}

 if(p.type===1){y-=Math.sin(q*Math.PI)*75;
  if(!this.simpleEffects)for(let i=3;i>0;i--){const past=Math.max(0,q-i*.035),px=p.x+(tx-p.x)*past,py=p.y+(ty-p.y)*past-Math.sin(past*Math.PI)*75;g.fillStyle(i%2?0xff9750:0xffce77,.32/i).fillCircle(px,py,10-i*2);}
g.fillStyle(0xffc25c,.16).fillCircle(x,y,p.final?21:15);g.fillStyle(p.branch===1?0xe5632d:0xffa441,.75).fillCircle(x,y,9);g.fillStyle(0xffefad,1).fillCircle(x-2,y-2,5);g.lineStyle(2,0xffd07b,.4).lineBetween(x-9,y-7,x-20,y-18);return;}
 const a=Math.atan2(ty-p.y,tx-p.x),dx=Math.cos(a),dy=Math.sin(a),len=p.branch===1?27:18;
 if(!this.simpleEffects)g.lineStyle(p.branch===1?8:5,0xb6e3a4,.18).lineBetween(x-dx*(len+14),y-dy*(len+14),x,y);
 g.lineStyle(p.final?4:2.5,p.branch===1?0xb8d7ff:0xffefb8,.9).lineBetween(x-dx*len,y-dy*len,x,y);g.lineStyle(2,0xfef9da,1).lineBetween(x-dx*7+dy*4,y-dy*7-dx*4,x,y).lineBetween(x,y,x-dx*7-dy*4,y-dy*7+dx*4);
}
update(time,delta){if(!this.model)return;this.world.setVisible(this.playing);this.ambient=time/1000;this.drawAwakenings(time);this.tweens.timeScale=this.model.paused?0:this.model.speed;this.model.step(Math.min(delta/1000,.05));this.process();for(const [id,v]of this.enemyViews){const e=this.model.enemies.find(e=>e.id===id);if(!e){v.destroy();this.enemyViews.delete(id);continue;}v.setPosition(e.x,e.y);const im=v.body;if(e.freezeTime>0)im.setTint(0xa6dcff);else if(e.slowTime>0)im.setTint(0xc8efff);else if(F.ENEMIES[e.type].tint)im.setTint(F.ENEMIES[e.type].tint);else if(!this.model.paused)im.clearTint();const pulse=this.reducedMotion.matches?0:Math.sin(this.model.time*7+id)*.035;im.setScale(im.baseScale*(1-pulse),im.baseScale*(1+pulse));v.bar.clear();if(F.ENEMIES[e.type].split){v.bar.fillStyle(0xd6fff0,.95).fillCircle(-5,-im.displayHeight-13,3).fillCircle(5,-im.displayHeight-13,3);v.bar.lineStyle(1,0x4f9e8c,.8).lineBetween(-3,-im.displayHeight-13,3,-im.displayHeight-13);}if(e.slowTime>0||e.freezeTime>0){
 const frozen=e.freezeTime>0;v.bar.lineStyle(frozen?2.5:1.5,frozen?0xd8faff:0x8dd5ed,.85).strokeEllipse(0,0,im.displayWidth*.85,13);
 if(frozen){v.bar.lineStyle(2,0xc5edff,.8).strokePoints([{x:-19,y:0},{x:-24,y:-26},{x:-12,y:-im.displayHeight-3},{x:13,y:-im.displayHeight-6},{x:24,y:-23},{x:19,y:0}],true);}
 else{v.bar.lineStyle(1,0xd0f5ff,.8).lineBetween(-12,-4,12,4).lineBetween(-12,4,12,-4);}
 }if(e.shield>0){v.bar.lineStyle(2,0xa7dfff,.75).strokeEllipse(0,-im.displayHeight/2,im.displayWidth+12,im.displayHeight+8);}if(e.hp<e.maxHp){v.bar.fillStyle(0x25422f,.7).fillRoundedRect(-20,-im.displayHeight-6,40,4,2);v.bar.fillStyle(e.burnTime>0?0xe9aa55:0xa8c774,1).fillRoundedRect(-20,-im.displayHeight-6,40*e.hp/e.maxHp,4,2);}if(e.burnTime>0&&!this.model.paused&&Math.random()<(this.simpleEffects?.015:.05))this.burst(e.x,e.y-15,0xee9c48,1,7);}
this.creatures.list.sort((a,b)=>a.y-b.y);this.projectile.clear();
for(const t of this.model.towers){if(t.type!==4||!t.targetId)continue;const target=this.model.enemies.find(e=>e.id===t.targetId&&e.hp>0);if(!target)continue;const color=t.branch===1?0xc5dcff:0xffe59a;const charge=t.charge/this.model.stats(t).cap;this.projectile.lineStyle(9+t.charge*2,color,.2).lineBetween(t.x,t.y-55,target.x,target.y-18);this.projectile.lineStyle(2+t.charge,color,.95).lineBetween(t.x,t.y-55,target.x,target.y-18);this.projectile.lineStyle(1.2+charge,0xfffce9,.95).lineBetween(t.x,t.y-55,target.x,target.y-18);
 this.projectile.fillStyle(0xfff9dd,.85).fillCircle(target.x,target.y-18,4+t.charge);
 this.projectile.lineStyle(1.5,color,.65).strokeCircle(t.x,t.y-55,5+charge*8);
 if(!this.simpleEffects){const phase=(this.model.time*1.5)%1;const x=t.x+(target.x-t.x)*phase,y=t.y-55+(target.y-18-(t.y-55))*phase;this.projectile.fillStyle(0xfffce0,.8).fillCircle(x,y,2+charge*2);}}
for(const p of this.model.shots)this.drawShot(p);
this.leaves.clear();for(let i=0;i<12;i++){const t=this.ambient*.2+i*1.7,x=(i*127+t*17)%1280,y=25+(i*73+t*6)%360;const chapter=this.model.stage.chapter;this.leaves.fillStyle([i%3?0xc4dc76:0xf7e7a5,0xc4f2ed,0xeaf5ff,0xf4dcff][chapter],.25+.18*Math.sin(t+i)).fillEllipse(x,y,chapter===2?2:4+i%3,2);}if(this.playing)window.UI?.frame();}
}
window.ForestScene=ForestScene;window.phaserGame=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#466b40',scale:{mode:Phaser.Scale.NONE,...ForestViewport.renderSize()},render:{antialias:true,roundPixels:false},scene:[ForestScene],audio:{noAudio:true},fps:{target:60}});ForestViewport.bind(window.phaserGame);
})();
