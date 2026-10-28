/* Phaser 4.2.1 owns rendering, texture cache, input and visual feedback.
   model.js owns world coordinates, targeting, damage, wave timing and economy. */
(function(){'use strict';const F=Forest;
class ForestScene extends Phaser.Scene{
constructor(){super('forest');}
preload(){this.load.on('progress',v=>{document.getElementById('loadBar').style.width=(v*100)+'%'});this.load.on('loaderror',f=>{document.getElementById('loadText').textContent='素材讀取失敗：'+f.key+'，請重新整理';});for(const tower of F.TOWERS)for(let i=0;i<tower.forms.length;i++)this.load.image(tower.id+i,`assets/${tower.id}-${i}.webp`);for(const i of [...new Set(F.ENEMIES.map(e=>e.art))])this.load.image('enemy'+i,`assets/monsters-${i}.webp`);for(const [key,file]of [['forest','forest.webp'],['earth','earth.webp'],['castle','castle-0.webp'],['portal','portal.webp'],['river-prop','river-prop.webp'],['ruin-prop','ruin-prop.webp'],['lantern-prop','lantern-prop.webp']])this.load.image(key,'assets/'+file);}
create(){this.model=new F.Game;this.selected=-1;this.playing=false;this.ambient=0;this.enemyViews=new Map;this.towerViews=new Map;this.background=this.add.image(0,0,'forest');this.wash=this.add.graphics();this.world=this.add.container(0,0);this.buildWorld();this.layout();this.scale.on('resize',()=>this.layout());document.getElementById('loader').hidden=true;window.battle=this;window.dispatchEvent(new Event('forest-ready'));}
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
 this.range=this.add.graphics();this.world.add(this.range);this.padViews=[];
 this.model.pads.forEach(([x,y],i)=>{
  const g=this.add.graphics();g.fillStyle(0x274b34,.15).fillEllipse(x,y+9,79,29);g.fillStyle(0xdce0b2,.8).fillEllipse(x,y,77,30);g.lineStyle(1.5,0x849a61,.7).strokeEllipse(x,y,77,30);g.lineStyle(1,0xf8f2cc,.8).strokeEllipse(x,y-1,65,23);g.lineStyle(2.5,0x648b59,.8).lineBetween(x-6,y,x+6,y).lineBetween(x,y-6,x,y+6);this.world.add(g);this.padViews.push(g);
  const z=this.add.zone(x,y-18,108,95).setInteractive({useHandCursor:true});this.world.add(z);z.on('pointerdown',()=>{if(this.playing)window.UI?.select(i);});
 });
 this.shadowLayer=this.add.graphics();this.world.add(this.shadowLayer);this.creatures=this.add.container(0,0);this.world.add(this.creatures);
 this.portals=this.model.routes.map(route=>{const [x,y]=route[0];const p=this.add.image(x,y+17,'portal').setOrigin(.5,1).setDisplaySize(76,82);this.creatures.add(p);return p;});
 const [cx,cy]=this.model.routes[0].at(-1);this.castle=this.add.image(cx,cy+21,'castle').setOrigin(.5,1).setDisplaySize(119,132);this.creatures.add(this.castle);
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
layout(){const w=this.scale.width,h=this.scale.height;const size=this.textures.get('forest').getSourceImage();const cover=Math.max(w/size.width,h/size.height);this.background.setPosition(w/2,h/2).setScale(cover);this.wash.clear();const chapter=this.model.stage.chapter;if(chapter)this.wash.fillStyle([0,0x82cee3,0xe2eeff,0x302052][chapter],[0,.12,.4,.3][chapter]).fillRect(0,0,w,h);const top=h<500?78:123,bottom=h<500?80:110;this.worldScale=Math.min((w-62)/1280,(h-top-bottom)/400);this.worldScale=Math.max(.1,this.worldScale);this.world.setScale(this.worldScale).setPosition((w-1280*this.worldScale)/2,top+(h-top-bottom-400*this.worldScale)/2);window.UI?.layout?.();}
reset(stageId=this.model.stageId){this.tweens.killAll();this.time.removeAllEvents();this.model=new F.Game(stageId);this.enemyViews.clear();this.towerViews.clear();this.world.removeAll(true);this.textures.remove('road');this.selected=-1;this.buildWorld();this.layout();}
select(i){this.selected=i;this.drawRange();}
drawRange(previewType){this.range.clear();if(this.selected<0)return;const [x,y]=this.model.pads[this.selected],t=this.model.towers.find(t=>t.pad===this.selected);if(!t&&previewType===undefined)return;const r=t?F.stats(t).range:F.stats({type:previewType,level:1,branch:-1}).range;this.range.fillStyle(0xb8e1b1,.08).fillCircle(x,y,r);this.range.lineStyle(2.5,0xf9e5a3,.9).strokeCircle(x,y,r);this.range.lineStyle(1,0xffffff,.6).strokeCircle(x,y,r-5);this.range.lineStyle(2,0xf5df8f,.9).strokeEllipse(x,y+2,89,35);}
addTower(t){const im=this.add.image(t.x,t.y+17,F.TOWERS[t.type].id+F.variant(t)).setOrigin(.5,1);this.creatures.add(im);this.towerViews.set(t.id,im);this.sizeTower(t,im);im.setScale(im.scaleX*.72,im.scaleY*.72);this.tweens.add({targets:im,scaleX:im.baseScale,scaleY:im.baseScale,duration:350,ease:'Back.Out'});this.padViews[t.pad].setVisible(false);this.burst(t.x,t.y,0xe7d48b,12,40);this.syncShadows();}
sizeTower(t,im){this.tweens.killTweensOf(im);im.setTexture(F.TOWERS[t.type].id+F.variant(t));const width=F.finalForm(t)?146:t.level>=2?132:118;im.baseScale=width/im.width;im.setScale(im.baseScale);}
syncShadows(){this.shadowLayer.clear();for(const t of this.model.towers){this.shadowLayer.fillStyle(0x284c32,.22).fillEllipse(t.x+2,t.y+10,F.finalForm(t)?96:80,24);this.shadowLayer.fillStyle(0x24402c,.14).fillEllipse(t.x,t.y+8,58,15);}}
burst(x,y,color,count=7,radius=24){if(this.effectLayer.length>160)return;for(let i=0;i<count;i++){const a=Math.PI*2*i/count+Math.random()*.5,r=radius*(.5+Math.random()*.5);const p=this.add.circle(x,y,2+Math.random()*2,color,.9);this.effectLayer.add(p);this.tweens.add({targets:p,x:x+Math.cos(a)*r,y:y+Math.sin(a)*r-9,alpha:0,scale:0,duration:360+Math.random()*250,ease:'Quad.Out',onComplete:()=>p.destroy()});}}
ring(x,y,color,r=60){const c=this.add.circle(x,y,5,color,.12).setStrokeStyle(2,color,.9);this.effectLayer.add(c);this.tweens.add({targets:c,scale:r/5,alpha:0,duration:440,ease:'Cubic.Out',onComplete:()=>c.destroy()});}
float(x,y,str,color='#fff1b9'){if(this.effectLayer.length>160)return;const t=this.add.text(x,y,str,{fontFamily:'system-ui',fontSize:16,fontStyle:'bold',color,stroke:'#34523a',strokeThickness:3}).setOrigin(.5);this.effectLayer.add(t);this.tweens.add({targets:t,y:y-37,alpha:0,duration:800,ease:'Quad.Out',onComplete:()=>t.destroy()});}
process(){for(const e of this.model.drain()){switch(e.type){case'build':this.addTower(e.tower);break;case'upgrade':{const v=this.towerViews.get(e.tower.id);this.sizeTower(e.tower,v);this.ring(e.tower.x,e.tower.y,0xf3d77e,80);this.burst(e.tower.x,e.tower.y-45,0xfbe8a0,18,70);this.float(e.tower.x,e.tower.y-90,'Lv.'+e.tower.level);this.syncShadows();this.drawRange();break;}case'sell':this.towerViews.get(e.tower.id)?.destroy();this.towerViews.delete(e.tower.id);this.padViews[e.tower.pad].setVisible(true);this.float(e.tower.x,e.tower.y,'+'+e.gold);this.syncShadows();break;case'spawn':{const v=this.add.container(e.enemy.x,e.enemy.y);const d=F.ENEMIES[e.enemy.type],w=d.boss?89:55,im=this.add.image(0,4,'enemy'+d.art).setOrigin(.5,1);im.setScale(w/im.width);im.baseScale=im.scaleX;const bar=this.add.graphics();v.add([im,bar]);v.body=im;v.bar=bar;this.creatures.add(v);this.enemyViews.set(e.enemy.id,v);break;}case'fire':{const v=this.towerViews.get(e.tower.id);if(v){this.tweens.killTweensOf(v);v.setScale(v.baseScale*1.025,v.baseScale*.975);this.tweens.add({targets:v,scaleX:v.baseScale,scaleY:v.baseScale,duration:150});}this.burst(e.shot.x,e.shot.y,[0xc0dfa0,0xffc469,0xa9edff,0xd6b4ff,0xfff1ac,0xe6bdff][e.tower.type],3,12);window.UI?.sound(['arrow','fire','ice','lightning','beam','meteor'][e.tower.type]);break;}case'hit':{const v=this.enemyViews.get(e.enemy.id);if(v&&e.damage>1){v.body.setTint(0xffe5b4);this.time.delayedCall(70,()=>{if(v.active)v.body.clearTint();});}break;}case'kill':{this.burst(e.enemy.x,e.enemy.y-15,0xe5d59a,6,24);this.float(e.enemy.x,e.enemy.y-35,'+'+e.gold);break;}case'chain':{const line=this.add.graphics();this.effectLayer.add(line);line.lineStyle(7,0x9966dd,.3);for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i];line.lineBetween(a.x,a.y,b.x,b.y);}line.lineStyle(2,0xe4dcff,1);for(let i=1;i<e.points.length;i++){const a=e.points[i-1],b=e.points[i],mx=(a.x+b.x)/2+9,my=(a.y+b.y)/2-12;line.lineBetween(a.x,a.y,mx,my).lineBetween(mx,my,b.x,b.y);}this.tweens.add({targets:line,alpha:0,duration:190,onComplete:()=>line.destroy()});break;}
case'impact':{const shot=e.shot;if(shot.type===3)break;const colors=[0xdbeda2,shot.branch===1?0xe66f39:0xffc35e,0xa3e9ff,0xd6b4ff,0xfff1ac,0xc3a2ff],color=colors[shot.type];if(shot.stats.splash)this.ring(shot.tx,shot.ty,color,shot.stats.splash);this.burst(shot.tx,shot.ty-8,color,shot.type===5?22:shot.final?12:6,Math.max(16,(shot.stats.splash||24)*.7));break;}
case'leak':this.ring(1170,298,0xd58677,80);this.float(1170,210,'−'+e.enemy.leak,'#ffc3ac');window.UI?.sound('leak');break;}
window.UI?.event(e);}}
drawShot(p){
 const g=this.projectile,q=Math.min(1,p.time/p.duration);let tx=p.tx,ty=p.ty;
 if(p.type===3)return;
 if(p.type===0||p.type===2&&!p.stats.splash){const target=this.model.enemies.find(e=>e.id===p.target);if(target){tx=target.x;ty=target.y-15;}}
 let x=p.x+(tx-p.x)*q,y=p.y+(ty-p.y)*q;
 if(p.type===5){
  g.lineStyle(2,0xd4b2ff,.65).strokeCircle(tx,ty,p.stats.splash);
  g.lineStyle(1,0xffe8a3,.5).strokeCircle(tx,ty,p.stats.splash*q);
  x=tx-95*(1-q);y=ty-240*(1-q);
  g.lineStyle(14,0xb388ed,.25).lineBetween(x-26,y-60,x,y);
  g.lineStyle(5,0xffd083,.8).lineBetween(x-15,y-40,x,y);
  g.fillStyle(0xe8b7ff,.95).fillCircle(x,y,p.final?18:14);g.fillStyle(0xfff0b0,1).fillCircle(x+3,y-2,8);return;
 }
 if(p.type===2){g.lineStyle(p.freeze?6:3,0x9eeaff,.7).lineBetween(x-12,y-7,x,y);g.fillStyle(0xe6fbff,1).fillTriangle(x,y-8,x+6,y+4,x-6,y+4);return;}
 if(p.type===1){y-=Math.sin(q*Math.PI)*75;g.fillStyle(0xffc25c,.16).fillCircle(x,y,p.final?21:15);g.fillStyle(p.branch===1?0xe5632d:0xffa441,.75).fillCircle(x,y,9);g.fillStyle(0xffefad,1).fillCircle(x-2,y-2,5);g.lineStyle(2,0xffd07b,.4).lineBetween(x-9,y-7,x-20,y-18);return;}
 const a=Math.atan2(ty-p.y,tx-p.x),dx=Math.cos(a),dy=Math.sin(a),len=p.branch===1?27:18;
 g.lineStyle(p.final?4:2.5,p.branch===1?0xb8d7ff:0xffefb8,.9).lineBetween(x-dx*len,y-dy*len,x,y);g.lineStyle(2,0xfef9da,1).lineBetween(x-dx*7+dy*4,y-dy*7-dx*4,x,y).lineBetween(x,y,x-dx*7-dy*4,y-dy*7+dx*4);
}
update(time,delta){if(!this.model)return;this.world.setVisible(this.playing);this.ambient=time/1000;this.tweens.timeScale=this.model.paused?0:this.model.speed;this.model.step(Math.min(delta/1000,.05));this.process();for(const [id,v]of this.enemyViews){const e=this.model.enemies.find(e=>e.id===id);if(!e){v.destroy();this.enemyViews.delete(id);continue;}v.setPosition(e.x,e.y);const im=v.body;if(e.freezeTime>0)im.setTint(0xa6dcff);else if(e.slowTime>0)im.setTint(0xc8efff);else if(!this.model.paused)im.clearTint();const pulse=Math.sin(this.ambient*7+id)*.035;im.setScale(im.baseScale*(1-pulse),im.baseScale*(1+pulse));v.bar.clear();if(e.shield>0){v.bar.lineStyle(2,0xa7dfff,.75).strokeEllipse(0,-im.displayHeight/2,im.displayWidth+12,im.displayHeight+8);}if(e.hp<e.maxHp){v.bar.fillStyle(0x25422f,.7).fillRoundedRect(-20,-im.displayHeight-6,40,4,2);v.bar.fillStyle(e.burnTime>0?0xe9aa55:0xa8c774,1).fillRoundedRect(-20,-im.displayHeight-6,40*e.hp/e.maxHp,4,2);}if(e.burnTime>0&&Math.random()<.07)this.burst(e.x,e.y-15,0xee9c48,1,7);}
this.creatures.list.sort((a,b)=>a.y-b.y);this.projectile.clear();
for(const t of this.model.towers){if(t.type!==4||!t.targetId)continue;const target=this.model.enemies.find(e=>e.id===t.targetId&&e.hp>0);if(!target)continue;const color=t.branch===1?0xc5dcff:0xffe59a;this.projectile.lineStyle(9+t.charge*2,color,.2).lineBetween(t.x,t.y-55,target.x,target.y-18);this.projectile.lineStyle(2+t.charge,color,.95).lineBetween(t.x,t.y-55,target.x,target.y-18);this.projectile.fillStyle(0xfff9dd,.85).fillCircle(target.x,target.y-18,4+t.charge);}
for(const p of this.model.shots)this.drawShot(p);
this.leaves.clear();for(let i=0;i<12;i++){const t=this.ambient*.2+i*1.7,x=(i*127+t*17)%1280,y=25+(i*73+t*6)%360;const chapter=this.model.stage.chapter;this.leaves.fillStyle([i%3?0xc4dc76:0xf7e7a5,0xc4f2ed,0xeaf5ff,0xf4dcff][chapter],.25+.18*Math.sin(t+i)).fillEllipse(x,y,chapter===2?2:4+i%3,2);}if(this.playing)window.UI?.frame();}
}
window.ForestScene=ForestScene;window.phaserGame=new Phaser.Game({type:Phaser.AUTO,parent:'game',backgroundColor:'#466b40',scale:{mode:Phaser.Scale.RESIZE,width:window.innerWidth,height:window.innerHeight},render:{antialias:true,roundPixels:false},resolution:Math.min(window.devicePixelRatio||1,2),scene:[ForestScene],audio:{noAudio:true},fps:{target:60}});
})();
