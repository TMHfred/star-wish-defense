/* Fixed square-grid viewport; decorative scenery fills the screen margins. */
(function(root){'use strict';class BattlefieldCamera{
 constructor(){this.zoom=1;this.scale=1;this.x=0;this.y=0;this.resize(1280,832);}
 resize(w,h){this.w=w;this.h=h;const side=h<=600&&w>=640,top=side?12:88,bottom=side?12:116;this.base=Math.max(.01,Math.min(side?(w-238)/1024:(w-24)/1280,(h-top-bottom)/640));this.zoom=1;this.scale=this.base;this.x=side?96+(w-238-1024*this.scale)/2-128*this.scale:(w-1280*this.scale)/2;this.y=top+(h-top-bottom-640*this.scale)/2-96*this.scale;}
 clamp(){const sx=1280*this.scale,sy=832*this.scale;this.x=sx<=this.w?(this.w-sx)/2:Math.min(0,Math.max(this.w-sx,this.x));this.y=sy<=this.h?(this.h-sy)/2:Math.min(0,Math.max(this.h-sy,this.y));}
 at(x,y){return {x:(x-this.x)/this.scale,y:(y-this.y)/this.scale};}
 zoomAt(){}
 pan(){}
 reset(){this.resize(this.w,this.h);}
}root.BattlefieldCamera=BattlefieldCamera;})(globalThis);
