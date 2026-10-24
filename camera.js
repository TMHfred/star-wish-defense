/* Fixed square-grid viewport; decorative scenery fills the screen margins. */
(function(root){'use strict';class BattlefieldCamera{
 constructor(){this.zoom=1;this.scale=1;this.x=0;this.y=0;this.resize(1280,832);}
 resize(w,h,insets={}){this.w=w;this.h=h;const side=h<=600&&w>=640,left=side?(insets.left||96):12,right=side?(insets.right||130):12,top=side?40:88,bottom=side?12:116;const boardWidth=side?1120:1280,boardHeight=side?672:640;this.base=Math.max(.01,Math.min((w-left-right)/boardWidth,(h-top-bottom)/boardHeight));this.zoom=1;this.scale=this.base;this.x=side?left+(w-left-right-1024*this.scale)/2-128*this.scale:(w-1280*this.scale)/2;this.y=top+(h-top-bottom-640*this.scale)/2-96*this.scale;}

 clamp(){const sx=1280*this.scale,sy=832*this.scale;this.x=sx<=this.w?(this.w-sx)/2:Math.min(0,Math.max(this.w-sx,this.x));this.y=sy<=this.h?(this.h-sy)/2:Math.min(0,Math.max(this.h-sy,this.y));}
 at(x,y){return {x:(x-this.x)/this.scale,y:(y-this.y)/this.scale};}
 zoomAt(){}
 pan(){}
 reset(){this.resize(this.w,this.h);}
}root.BattlefieldCamera=BattlefieldCamera;})(globalThis);
