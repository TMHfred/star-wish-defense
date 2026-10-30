"""Phase-one UI regression. Start npm run dev first; requires Playwright/Chromium."""
import os
from browser_fixtures import seed_all_unlocks
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 844, 'height': 390})
    seed_all_unlocks(page)
    errors, failed = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: failed.append(r.url) if r.status >= 400 else None)
    page.goto(os.environ.get('GAME_URL', 'http://127.0.0.1:8000/'), wait_until='networkidle')
    page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click()
    page.locator('[data-stage="0"]').click()
    page.locator('#beginStage').click()
    page.locator('#pad0').click()
    page.screenshot(path='/tmp/phase-one-empty-stone.png')
    page.locator('[data-shop="0"]').click()
    assert page.evaluate('battle.preview.visible && battle.preview.alpha < 1 && !battle.padViews[0].visible')
    assert page.evaluate('battle.model.gold === 320 && battle.model.towers.length === 0')
    assert page.evaluate('Math.abs(battle.preview.displayWidth-118)<.01 && battle.preview.x===battle.model.pads[0][0]')
    page.screenshot(path='/tmp/phase-one-preview.png')
    page.mouse.click(20, 200)
    assert page.locator('#tray').is_hidden()
    assert page.evaluate('!battle.preview.visible && battle.padViews[0].visible && battle.model.gold===320')

    page.evaluate('battle.model.gold=0')
    page.locator('#pad0').click()
    page.locator('[data-shop="5"]').click()
    assert page.locator('#confirmBuild').is_disabled()
    assert page.evaluate('battle.preview.visible && battle.preview.isTinted && battle.model.towers.length===0')
    page.locator('#backShop').click()
    assert page.evaluate('!battle.preview.visible && battle.padViews[0].visible')
    page.evaluate('battle.model.gold=100000')
    for tower_type in range(6):
        page.locator(f'[data-shop="{tower_type}"]').click()
        assert page.evaluate(f'battle.preview.texture.key === Forest.TOWERS[{tower_type}].id+"0"')
        assert page.evaluate('battle.model.gold === 100000')
        if tower_type != 5:
            page.locator('#backShop').click()
    page.locator('#confirmBuild').click()
    assert page.evaluate('!battle.preview.visible && !battle.padViews[0].visible && battle.model.gold===99760')
    page.locator('#targetPriority').click()
    page.locator('[data-target="strongest"]').click()
    assert page.evaluate('battle.model.towers[0].targetMode==="strongest"')
    assert '最高血量' in page.locator('#targetPriority').inner_text()
    page.locator('#upgradeTower').click()
    assert page.evaluate('battle.model.towers[0].targetMode==="strongest"')
    page.locator('#sellTower').click()
    assert page.evaluate('battle.padViews[0].visible && !battle.preview.visible')
    page.locator('[data-shop="0"]').click()
    page.locator('#confirmBuild').click()
    assert page.evaluate('battle.model.towers[0].targetMode==="first"')
    def controls(selectors):
        for width, height in [(1440, 900), (844, 390), (667, 375)]:
            page.set_viewport_size({'width': width, 'height': height})
            page.wait_for_timeout(400)
            for selector in selectors:
                assert page.locator(selector).evaluate('''e=>{
                    const r=e.getBoundingClientRect();return r.width>=44 && r.height>=44 && r.x>=0 &&
                    r.right<=innerWidth && r.bottom<=innerHeight &&
                    e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
                }'''), (width, height, selector)
            assert page.locator('#tray').bounding_box()['height'] < 100
    controls(['#targetPriority', '#towerDetails', '#sellTower', '[data-branch="0"]', '[data-branch="1"]', '#closeTray'])
    page.screenshot(path='/tmp/phase-one-controls-667.png')
    page.locator('#targetPriority').click()
    page.locator('[data-target="nearest"]').click()
    page.locator('[data-branch="1"]').click()
    assert page.evaluate('battle.model.towers[0].targetMode==="nearest"')
    for _ in range(3):
        page.locator('#upgradeTower').click()
    controls(['#targetPriority', '#towerDetails', '#sellTower', '#closeTray'])
    assert page.evaluate('Forest.finalForm(battle.model.towers[0]) && battle.model.towers[0].targetMode==="nearest"')
    page.locator('#closeTray').click()
    page.locator('#menuBtn').click()
    page.locator('#menuSettings').click()
    page.locator('#settingsEffects').click()
    assert page.evaluate('battle.effectsLow')
    page.locator('#backSettings').click()
    page.locator('#resume').click()
    # Burst, ring, lightning, impact and floating text share a strict object budget.
    page.evaluate('''()=>{
        for(let i=0;i<200;i++){
            battle.burst(200,100,0xffffff,20,30);battle.ring(200,100,0xffffff,60);
            battle.drawChain({points:[{x:200,y:100},{x:240,y:150}],shot:{branch:1}});
            battle.float(200,100,'+1');
        }
    }''')
    assert page.evaluate('battle.effectLayer.length <= battle.effectLimit')
    page.evaluate('battle.effectsLow=false; for(let i=0;i<20;i++)battle.burst(200,100,0xffffff,20,30)')
    assert page.evaluate('battle.effectLayer.length <= 144')
    page.emulate_media(reduced_motion='reduce')
    page.wait_for_function('battle.simpleEffects && battle.effectLayer.length<=48')
    assert page.evaluate('battle.simpleEffects && battle.effectLimit === 48')
    assert not errors, errors
    assert not failed, failed
    browser.close()
    print('PASS: six previews, no preview charge, blank cancel, insufficient funds, single base, per-tower priority, upgrade/sell lifecycle, 1440x900/844x390/667x375 controls and bounded/reduced effects')
