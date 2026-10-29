"""Verify actual scene textures and gallery responses against approved image bytes."""
import hashlib
import json
import os
from browser_fixtures import seed_all_unlocks
from pathlib import Path
from urllib.parse import urlparse,parse_qs
from playwright.sync_api import sync_playwright

manifest=json.loads((Path(__file__).resolve().parents[1]/'ICE-ASSETS.json').read_text())
expected={Path(f['path']).name:f for f in manifest['files']}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':844,'height':390})
    seed_all_unlocks(page)
    errors=[];responses=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:responses.append(r) if Path(urlparse(r.url).path).name in expected else None)
    page.goto(os.environ.get('GAME_URL','http://127.0.0.1:8001/'),wait_until='networkidle')
    page.wait_for_function('window.battle && window.UI && window.ForestArt')
    # Compare decoded Phaser pixels to images fetched using the authoritative versions.
    assert page.evaluate('''async()=>{
        for(let i=0;i<5;i++){
            const reference=new Image();reference.src=ForestArt.url(`assets/ice-${i}.webp`);await reference.decode();
            const texture=battle.textures.get('ice'+i).getSourceImage();
            const a=document.createElement('canvas'),b=document.createElement('canvas');
            a.width=b.width=reference.naturalWidth;a.height=b.height=reference.naturalHeight;
            if(texture.width!==a.width||texture.height!==a.height)return false;
            a.getContext('2d').drawImage(reference,0,0);b.getContext('2d').drawImage(texture,0,0);
            if(a.toDataURL()!==b.toDataURL())return false;
        }
        return true;
    }''')
    page.locator('#galleryBtn').click();page.locator('[data-gallery="2"]').click()
    images=page.locator('.gallery-forms img')
    assert images.count()==5
    for i in range(5):
        image=images.nth(i)
        image.evaluate('e=>e.decode()')
        parsed=urlparse(image.get_attribute('src'))
        assert Path(parsed.path).name==f'ice-{i}.webp'
        assert parse_qs(parsed.query)['v']==[expected[f'ice-{i}.webp']['sha']]
        page.locator(f'[data-form="{i}"]').click()
    page.screenshot(path='/tmp/approved-ice-gallery.png')
    page.locator('#closeModal').click();page.locator('#startBtn').click();page.locator('[data-stage="0"]').click()
    page.locator('#beginStage').click()
    page.evaluate('battle.model.gold=100000')
    for branch in range(2):
        page.locator(f'#pad{branch}').click();page.locator('[data-shop="2"]').click();page.locator('#confirmBuild').click()
        assert page.evaluate('battle.towerViews.get(battle.model.towers.at(-1).id).texture.key')=='ice0'
        page.locator(f'[data-branch="{branch}"]').click()
        assert page.evaluate('battle.towerViews.get(battle.model.towers.at(-1).id).texture.key')=='ice'+str(1+branch)
        for _ in range(3):page.locator('#upgradeTower').click()
        page.wait_for_timeout(400)
        view=page.evaluate('''()=>{const v=battle.towerViews.get(battle.model.towers.at(-1).id);return{key:v.texture.key,width:v.displayWidth};}''')
        assert view['key']=='ice'+str(3+branch) and abs(view['width']-146)<.01,view
    page.locator('#closeTray').click();page.screenshot(path='/tmp/approved-ice-battle.png')
    seen=set()
    for response in responses:
        parsed=urlparse(response.url);name=Path(parsed.path).name;item=expected[name]
        assert parse_qs(parsed.query).get('v')==[item['sha']],response.url
        assert response.ok,response.status
        data=response.body()
        assert len(data)==item['size']
        assert hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()==item['sha']
        seen.add(name)
    assert seen==set(expected),seen
    assert not errors,errors
    browser.close()
    print('PASS: all five approved image response hashes, decoded Phaser textures, gallery versions, both final battlefield forms and nonshrinking final sizes')
