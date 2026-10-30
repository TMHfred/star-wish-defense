"""Real buffer density, CSS/input alignment, forest UI and relic feedback.
Chromium mobile emulation only; this does not claim physical iPhone performance.
"""
import json
import os
from playwright.sync_api import sync_playwright

URL=os.environ.get('GAME_URL','http://127.0.0.1:8000/')
OUT=os.environ.get('POLISH_ARTIFACTS','/tmp/star-wish-mobile-polish')
os.makedirs(OUT,exist_ok=True)

def reachable(locator):
    locator.evaluate("e=>e.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})")
    assert locator.evaluate('''e=>{const r=e.getBoundingClientRect();return r.width>=44 && r.height>=44 && r.left>=0 && r.top>=0 && r.right<=innerWidth && r.bottom<=innerHeight && e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'''),locator

def renderer(page):
    state=page.evaluate('''()=>{
      const v=ForestViewport.measure(),c=phaserGame.canvas,r=c.getBoundingClientRect(),b=battle;
      const [x,y]=b.model.pads[0],p=b.cameras.main.getWorldPoint((b.world.x+x*b.worldScale)*c.width/r.width,(b.world.y+(y-18)*b.worldScale)*c.height/r.height);
      return {css:[r.width,r.height],buffer:[c.width,c.height],view:[v.width,v.height],density:phaserGame.renderDensity,inputScale:[b.scale.displayScale.x,b.scale.displayScale.y],dpr:devicePixelRatio,world:[b.world.x,b.world.y,b.worldScale],cameraPoint:[p.x,p.y],expectedPoint:[b.world.x+x*b.worldScale,b.world.y+(y-18)*b.worldScale]};
    }''')
    assert state['css']==state['view'],state
    for i in range(2):
        assert abs(state['buffer'][i]-state['view'][i]*state['density'])<=1,state
        assert abs(state['cameraPoint'][i]-state['expectedPoint'][i])<.02,state
        assert abs(state['inputScale'][i]-state['buffer'][i]/state['css'][i])<.00001,state
    assert 1<=state['density']<=min(state['dpr'],2),state
    return state

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    reports=[]
    for dpr in [int(n) for n in os.environ.get('POLISH_DPRS','1,2,3').split(',')]:
        page=browser.new_page(viewport={'width':844,'height':390},device_scale_factor=dpr,is_mobile=True,has_touch=True)
        errors=[];failed=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
        page.goto(URL,wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
        page.locator('#startBtn').tap();page.locator('[data-stage="0"]').tap();page.locator('#beginStage').tap()
        # All key controls fit with separation. Wave preview replaces a separate preview button.
        sizes=[(844,390),(667,375),(932,430),(1440,900)] if dpr==3 else [(844,390)]
        for width,height in sizes:
            page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(450)
            reports.append(renderer(page))
            print(f'Checking DPR {dpr}: {width}x{height}',flush=True)
            rects=[]
            for sel in ['.resources>span:first-child','.resources>span:nth-child(2)','#previewBtn','#waveBtn','#speedBtn','#menuBtn']:
                e=page.locator(sel)
                if e.evaluate('e=>e.tagName==="BUTTON"'):reachable(e)
                rects.append(e.bounding_box())
            for i,a in enumerate(rects):
                for b in rects[i+1:]:assert a['x']+a['width']+3<=b['x'] or b['x']+b['width']+3<=a['x'],(width,a,b)
            page.locator('#menuBtn').tap()
            assert page.evaluate('battle.model.paused')
            for e in page.locator('.pause-links button,.pause-secondary button').all():
                assert e.evaluate('e=>{const r=e.getBoundingClientRect(),b=document.getElementById("modalBody").getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom+1&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}')
                reachable(e)
                assert e.evaluate('e=>e.scrollWidth<=e.clientWidth+1')
            reachable(page.locator('#resume'));reachable(page.locator('#closeModal'))
            if dpr==3:page.screenshot(path=f'{OUT}/pause-{width}.png',scale='css')
            page.locator('#menuSettings').tap();before=renderer(page)['buffer']
            page.locator('#settingsEffects').tap();assert page.evaluate('battle.effectsLow') if width==844 else True
            assert renderer(page)['buffer']==before
            page.locator('#backSettings').tap();page.locator('#resume').tap()
            if dpr==3:page.screenshot(path=f'{OUT}/battle-{width}.png',scale='css')
        # Return to phone width, prove native Phaser input agrees with the DOM button centers.
        page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(450)
        page.evaluate("document.getElementById('platforms').style.pointerEvents='none';document.querySelectorAll('.platform-hit').forEach(e=>e.style.pointerEvents='none')")
        pt=page.evaluate('''()=>({x:battle.world.x+battle.model.pads[0][0]*battle.worldScale,y:battle.world.y+(battle.model.pads[0][1]-18)*battle.worldScale})''')
        page.touchscreen.tap(pt['x'],pt['y']);assert page.locator('#tray').is_visible()
        if dpr==3:page.screenshot(path=f'{OUT}/relic-selected.png',scale='css')
        page.locator('[data-shop="0"]').tap()
        assert page.evaluate('battle.preview.visible && !battle.padViews[0].visible && battle.model.gold===320')
        page.locator('#backShop').tap();assert page.evaluate('battle.padViews[0].visible && !battle.preview.visible')
        page.locator('#closeTray').tap()
        # Pause through menu, close without resume: build feedback must still finish in real time.
        page.locator('#waveBtn').tap();assert page.locator('#waveBtn').is_hidden();reachable(page.locator('#pauseBtn'))
        page.locator('#pauseBtn').tap();assert page.evaluate('battle.model.paused')
        page.touchscreen.tap(pt['x'],pt['y']);page.locator('[data-shop="0"]').tap()
        assert page.evaluate("()=>{document.getElementById('confirmBuild').click();return battle.awakenings.size===1}")
        assert page.evaluate('battle.model.gold===240 && battle.model.towers.length===1 && !battle.padViews[0].visible && !battle.preview.visible')
        if dpr==3:page.screenshot(path=f'{OUT}/relic-awakened.png',scale='css')
        page.wait_for_timeout(700)
        assert page.evaluate('battle.awakenings.size===0 && Math.abs([...battle.towerViews.values()][0].displayWidth-118)<.01')
        page.locator('#sellTower').tap();assert page.evaluate('battle.padViews[0].visible && battle.model.towers.length===0')
        page.locator('#closeTray').tap();page.locator('#previewBtn').tap();reachable(page.locator('.auto-setting'))
        page.locator('#autoBtn').uncheck();assert not page.evaluate('battle.model.auto')
        page.locator('#autoBtn').check();assert page.evaluate('battle.model.auto')
        page.locator('#closeModal').tap()
        assert not errors,errors
        assert not failed,failed
        page.close()
    browser.close()
    with open(f'{OUT}/render-report.json','w') as f:json.dump(reports,f,indent=2)
    print('PASS: DPR1/2/3 real drawing buffers; 844/667/932/1440 layouts; CSS/native Phaser input alignment; separated HUD; readable scrollable menu; resolution-independent effects; canceled/paused build, timed activation, sell and auto-wave setting.')
