/* Stable map IDs: 0–2 are the original story maps; 3 remains the free maze. */
(function(root){'use strict';
const {MAPS,UNLOCK_STARS,TOWERS}=root.Starbloom;
const additions=[
 ['月溪曲徑','河畔彎道交錯，讓範圍攻擊守住轉角。',1.32,550,[[[0,3],[3,3],[3,7],[8,7],[8,2],[12,2],[12,4],[15,4]]]],
 ['雙月渡口','兩股敵軍從溪岸匯合，兼顧兩邊防線。',1.4,600,[[[0,2],[4,2],[4,5],[10,5],[10,4],[15,4]],[[0,8],[6,8],[6,5],[10,5],[10,4],[15,4]]]],
 ['回聲長橋','長橋環繞水岸，善用重複覆蓋的射程。',1.5,650,[[[0,7],[3,7],[3,1],[7,1],[7,8],[12,8],[12,4],[15,4]]]],
 ['霜花回廊','護盾與厚血怪出現，突破塔開始發揮威力。',1.65,700,[[[0,2],[5,2],[5,7],[9,7],[9,1],[13,1],[13,4],[15,4]]]],
 ['古碑交界','長短路線交會，優先攔截接近城堡的敵人。',1.8,750,[[[0,1],[3,1],[3,6],[10,6],[10,4],[15,4]],[[0,8],[7,8],[7,6],[10,6],[10,4],[15,4]]]],
 ['星霜迷廊','曲折遺跡有多個轉角，安排冰火交會點。',1.95,800,[[[0,4],[2,4],[2,1],[6,1],[6,8],[10,8],[10,2],[13,2],[13,4],[15,4]]]],
 ['祈願環庭','怪物繞行聖域，讓天降光球覆蓋密集路段。',2.1,850,[[[0,1],[12,1],[12,7],[4,7],[4,4],[15,4]]]],
 ['星門雙翼','雙線會師星門，結合控制與大範圍轟炸。',2.3,900,[[[0,1],[3,1],[3,3],[10,3],[10,4],[15,4]],[[0,8],[3,8],[3,6],[10,6],[10,4],[15,4]]]],
 ['希望之巔','最後的星光試煉，集結整支守護小隊。',2.5,950,[[[0,4],[2,4],[2,1],[7,1],[7,8],[12,8],[12,4],[15,4]],[[0,8],[4,8],[4,5],[7,5],[7,8],[12,8],[12,4],[15,4]]]]
];
additions.forEach(([name,desc,mult,startGold,points],i)=>MAPS.push({name,desc,mult,startGold,points,waves:15,tag:'STORY '+String(i+4).padStart(2,'0'),icon:i<3?'≈':i<6?'❄':'✦'}));
const storyIds=MAPS.map((m,i)=>i).filter(i=>i!==3),chapters=['花語森林','月溪古道','星霜遺跡','祈願聖域'];
storyIds.forEach((id,i)=>Object.assign(MAPS[id],{storyNumber:i+1,chapter:Math.floor(i/3),chapterName:chapters[Math.floor(i/3)]}));
function starsAt(stars,id){return Math.max(0,Math.min(3,Math.floor(Number(stars?.[id])||0)));}
function total(stars){return storyIds.reduce((n,id)=>n+starsAt(stars,id),0);}
function unlocked(stars,id){const i=storyIds.indexOf(id);return id===3||i===0||i>0&&(starsAt(stars,id)>0||starsAt(stars,storyIds[i-1])>0);}
function label(type){return TOWERS[type].name+(type<5?'突破':'');}
function settle(game,stars){
 if(game.sandbox||game.endless||game.phase!=='won'||!storyIds.includes(game.map))return null;
 if(game.campaignResult){stars[game.map]=Math.max(starsAt(stars,game.map),game.campaignResult.best);game.starTotal=total(stars);return game.campaignResult;}
 const before=total(stars),previous=starsAt(stars,game.map),earned=game.hp===game.maxHp()?3:game.hp>=10?2:1;
 stars[game.map]=Math.max(previous,earned);const after=total(stars);
 game.starTotal=after;
 return game.campaignResult={earned,best:stars[game.map],added:stars[game.map]-previous,total:after,unlocks:UNLOCK_STARS.map((n,i)=>n>before&&n<=after?i:-1).filter(i=>i>=0)};
}
root.Campaign={storyIds,chapters,starsAt,total,unlocked,settle,label};
})(globalThis);
