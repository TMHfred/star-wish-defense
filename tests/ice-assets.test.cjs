const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'ICE-ASSETS.json'),'utf8'));
require('../dist/asset-urls.js');
assert.equal(manifest.status,'user-approved');
assert.deepEqual(manifest.files.map(f=>f.path).sort(),Array.from({length:5},(_,i)=>`dist/assets/ice-${i}.webp`));
assert.equal(new Set(manifest.files.map(f=>f.sha)).size,5);
for(const file of manifest.files){
 const bytes=fs.readFileSync(path.join(root,file.path));
 assert.equal(bytes.length,file.size);
 const sha=crypto.createHash('sha1').update(Buffer.from(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
 assert.equal(sha,file.sha,file.path);
 const url=file.path.replace(/^dist\//,'');
 assert.equal(ForestArt.url(url),url+'?v='+file.sha);
}
assert.equal(ForestArt.url('assets/bow-0.webp'),'assets/bow-0.webp');
console.log('PASS: five approved ice files, unique final forms, exact Git blob hashes/sizes and shared versioned URLs');
