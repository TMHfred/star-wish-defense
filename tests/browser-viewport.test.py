"""Mobile viewport recovery in Chromium, with explicit stale-measurement fixtures."""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=3)
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(os.environ.get('GAME_URL','http://127.0.0.1:8001/'),wait_until='networkidle')
    page.wait_for_function('window.battle && window.UI')
    page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(450)
    page.locator('#startBtn').tap();page.locator('[data-chapter="3"]').tap();page.locator('[data-stage="11"]').tap()

    def aligned(width,height):
        page.wait_for_timeout(450)
        state=page.evaluate('''()=>{
            const c=phaserGame.canvas.getBoundingClientRect();
            return {width:battle.scale.width,height:battle.scale.height,x:c.x,y:c.y,
                canvasWidth:c.width,canvasHeight:c.height,
                worldY:battle.world.y,worldBottom:battle.world.y+400*battle.worldScale};
        }''')
        assert state['width']==width and state['height']==height,state
        assert abs(state['x'])<1 and abs(state['y'])<1,state
        assert abs(state['canvasWidth']-width)<1 and abs(state['canvasHeight']-height)<1,state
        assert state['worldY']>=0 and state['worldBottom']<=height,state
        for index in range(page.locator('.platform-hit').count()):
            assert page.locator(f'#pad{index}').evaluate('''e=>{
                const r=e.getBoundingClientRect();
                return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
            }'''),index

    aligned(844,390)
    # Model the bad combination: portrait renderer height, landscape DOM, stale parent bounds.
    page.evaluate('''()=>{
        const host=document.getElementById('game');
        host.getBoundingClientRect=()=>new DOMRect(0,0,844,768);
        battle.scale.resize(844,768);
        visualViewport.dispatchEvent(new Event('resize'));
    }''')
    aligned(844,390)
    page.evaluate("delete document.getElementById('game').getBoundingClientRect")
    # Same-size resume must also recover, even when the window resize event never arrives.
    for event in ['pageshow','focus']:
        page.evaluate(f'battle.scale.resize(844,768);window.dispatchEvent(new Event("{event}"))')
        aligned(844,390)
    # Simulate a late visual viewport height, then its final settled measurement.
    page.evaluate('''()=>{
        Object.defineProperty(window,'innerHeight',{configurable:true,get:()=>768});
        visualViewport.dispatchEvent(new Event('resize'));
    }''')
    aligned(844,390)
    page.evaluate("delete window.innerHeight")
    for width,height in [(390,844),(844,390),(393,852),(852,393),(375,667),(667,375),(430,932),(932,430)]:
        page.set_viewport_size({'width':width,'height':height})
        if width<height:
            page.wait_for_timeout(450)
            assert page.evaluate('battle.model.paused')
        else:
            aligned(width,height)
            assert page.evaluate('battle.model.paused')
            page.locator('#pauseBtn').tap()
            assert not page.evaluate('battle.model.paused')
    page.locator('#pad0').tap();page.locator('[data-shop="0"]').tap();page.locator('#confirmBuild').tap()
    assert page.evaluate('battle.model.towers.length')==1
    page.locator('#closeTray').tap();page.locator('#waveBtn').tap()
    page.wait_for_timeout(600)
    assert page.evaluate('battle.model.wave')==1
    page.screenshot(path='/tmp/mobile-viewport-fixed.png')
    assert not errors,errors
    browser.close()
    print('PASS: stale Phaser/parent/innerHeight recovery, visual viewport events, same-size restore, repeated portrait/landscape, shared hit targets and touch combat')
