const assert=require('node:assert/strict');
const F=require('../dist/model.js');
const withoutBadges=p=>{const copy=structuredClone(p);delete copy.supplyBadges;return copy;};
const legacy=F.emptyProgress();delete legacy.supplyBadges;
legacy.goals=F.STAGES.map((_,i)=>i<9?[true,true,true]:[false,false,false]);
legacy.trialWon=true;legacy.castleStyle='star';legacy.titleId='star';
const base=F.readProgress(legacy);
assert.deepEqual(base.supplyBadges,[]);
assert.deepEqual(withoutBadges(base),withoutBadges(F.readProgress({...legacy,supplyBadges:[]})));
for(const invalid of [null,42,'drink',{},[false,{},null,'unknown']]){
 assert.deepEqual(F.readProgress({...base,supplyBadges:invalid}).supplyBadges,[]);
}
assert.deepEqual(F.readProgress({...base,supplyBadges:['drink','drink','wish','unknown','starlight']}).supplyBadges,['starlight','wish','drink']);
let p=base;
for(const id of ['drink','starlight','wish','drink','wish']){
 const previous=structuredClone(p);p=F.collectSupplyBadge(p,id);
 assert.deepEqual(withoutBadges(p),withoutBadges(base));
 assert.deepEqual(previous,F.readProgress(previous));
 assert.ok(p.supplyBadges.length<=3);assert.equal(new Set(p.supplyBadges).size,p.supplyBadges.length);
}
assert.deepEqual(p.supplyBadges,['starlight','wish','drink']);
assert.deepEqual(F.collectSupplyBadge(p,'invalid'),p);
assert.deepEqual(F.readProgress(JSON.parse(JSON.stringify(p))),p);
assert.deepEqual(base.supplyBadges,[]); // No mutation of a loaded progress object.
for(let type=0;type<F.TOWERS.length;type++){
 assert.equal(F.towerUnlocked(base,type),F.towerUnlocked(p,type));
 assert.equal(F.finalUnlocked(base,type),F.finalUnlocked(p,type));
}
assert.equal(F.totalStars(base),F.totalStars(p));
const original=new F.Game(0,base),gifted=new F.Game(0,p);
for(const field of ['gold','hp','wave','kills','towerLimit','metrics','blessings','countdown'])assert.deepEqual(gifted[field],original[field]);
for(let type=0;type<6;type++)assert.deepEqual(gifted.stats({type,level:1,branch:-1}),original.stats({type,level:1,branch:-1}));
const fresh=F.SUPPLY_BADGES.reduce((progress,id)=>F.collectSupplyBadge(progress,id),F.emptyProgress());
assert.equal(F.totalStars(fresh),0);assert.equal(F.towerUnlocked(fresh,1),false);assert.equal(F.trialUnlocked(fresh),false);assert.equal(F.stageUnlocked(fresh,1),false);
const won=new F.Game(0,fresh);won.phase='won';
assert.deepEqual(F.settle(won,fresh).supplyBadges,fresh.supplyBadges);
won.phase='lost';assert.deepEqual(F.settle(won,fresh),fresh);
assert.deepEqual(F.readProgress({...p,castleStyle:'moon'}).supplyBadges,p.supplyBadges);
console.log('PASS: additive legacy-save defaults, strict unique badge sanitation, idempotent collection, save roundtrip and retention through settlement/cosmetics, zero combat or unlock benefits');
