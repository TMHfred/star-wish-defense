/* Camera math shared by pointer, wheel and button controls. */
(function(root){'use strict';class BattlefieldCamera{
 constructor(){this.zoom=1;this.scale=1;this.x=0;this.y=0;this.resize(1280,832);}
 resize(w,h){this.w=w;this.h=h;const top=h<600?54:90,bottom=h<600?80:110;this.base=Math.min(w/1280,Math.max(100,h-top-bottom)/640);this.zoom=1;this.scale=this.base;this.x=(w-1280*this.scale)/2;this.y=top+(h-top-bottom-640*this.scale)/2-96*this.scale;}
 clamp(){const sx=1280*this.scale,sy=832*this.scale;this.x=sx<=this.w?(this.w-sx)/2:Math.min(0,Math.max(this.w-sx,this.x));this.y=sy<=this.h?(this.h-sy)/2:Math.min(0,Math.max(this.h-sy,this.y));}
 at(x,y){return {x:(x-this.x)/this.scale,y:(y-this.y)/this.scale};}
 zoomAt(z,x,y){const p=this.at(x,y);this.zoom=Math.max(1,Math.min(3,z));this.scale=this.base*this.zoom;this.x=x-p.x*this.scale;this.y=y-p.y*this.scale;this.clamp();}
 pan(dx,dy){this.x+=dx;this.y+=dy;this.clamp();}
 reset(){this.resize(this.w,this.h);}
}root.BattlefieldCamera=BattlefieldCamera;})(globalThis);
