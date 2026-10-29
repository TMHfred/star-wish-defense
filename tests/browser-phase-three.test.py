"""Trial and blessings UI integration; model tests separately prove normal-resource outcomes."""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':844,'height':390})
    errors,failed=[],[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
    page.goto(os.environ.get('GAME_URL','http://127.0.0.1:8000/'),wait_until='networkidle')
    page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click();assert page.locator('#trialBtn').is_disabled()
    # Stage-clear fixture opens the trial; its combat funds and upgrades are not altered.
    page.evaluate('''()=>{const p=Forest.emptyProgress();p.goals=p.goals.map((_,i)=>[i<9,false,false]);localStorage.setItem(Forest.PROGRESS_KEY,JSON.stringify(p));}''')
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click();page.locator('#trialBtn').click()
    for width,height in [(1440,900),(844,390),(667,375)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(300)
        for selector in ['#beginStage','#cancelStage']:
            assert page.locator(selector).evaluate('''e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'''),(width,height,selector)
    page.screenshot(path='/tmp/meteor-trial-ready.png')
    page.locator('#beginStage').click()
    assert page.evaluate('battle.model.isTrial && battle.model.towers.length===1 && battle.model.towers[0].borrowed && battle.model.gold===450')
    page.locator('#pad3').click();assert page.locator('#sellTower').is_disabled();assert page.locator('#upgradeTower').count()==0
    for pad in [0,2]:
        page.locator(f'#pad{pad}').click()
        assert page.locator('[data-shop="2"]').is_enabled()
        assert all(page.locator(f'[data-shop="{i}"]').is_disabled() for i in [0,1,3,4,5])
        page.locator('[data-shop="2"]').click();page.locator('#confirmBuild').click();page.locator('[data-branch="0"]').click()
    assert page.evaluate('battle.model.regularTowerCount()===2 && battle.model.gold===10 && battle.model.towers.length===3')
    page.locator('#closeTray').click();page.locator('#waveBtn').click()
    result=page.evaluate('''()=>{
        const g=battle.model;
        for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++){g.step(.05);if(i%100===0)battle.process();}
        battle.process();return{phase:g.phase,combos:g.metrics.meteorSlowHits,gold:g.gold};
    }''')
    assert result['phase']=='won' and result['combos']>=6,result
    assert '通過' in page.locator('#modalTitle').inner_text()
    assert page.evaluate('JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY)).trialWon')
    assert page.evaluate('JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY)).stars.reduce((a,b)=>a+b,0)')==9
    page.screenshot(path='/tmp/meteor-trial-result.png')
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    assert page.evaluate('battle.model.progress.trialWon')
    page.locator('#startBtn').click();page.locator('[data-chapter="3"]').click();page.locator('[data-stage="9"]').click();page.locator('#beginStage').click()
    page.locator('#pad0').click();page.locator('[data-shop="5"]').click();page.locator('#confirmBuild').click()
    assert page.evaluate('battle.model.towers[0].type===5 && !battle.model.towers[0].borrowed')
    assert '30' in page.locator('#upgradeTower').inner_text()
    page.locator('#closeTray').click()
    # Drive a wave-clear boundary to inspect the actual three-choice overlay.
    page.evaluate("Object.assign(battle.model,{phase:'combat',wave:3,waveTime:0,queue:[],enemies:[],shots:[]});battle.model.step(.01);battle.process()")
    assert page.locator('[data-blessing]').count()==3
    assert page.locator('#closeModal').is_hidden()
    assert page.evaluate('battle.model.paused && battle.model.pendingBlessing && !battle.model.startWave()')
    time=page.evaluate('battle.model.time');page.evaluate('battle.model.step(10)');assert page.evaluate('battle.model.time')==time
    page.keyboard.press('Escape');assert page.locator('#modal').is_visible();assert page.locator('[data-blessing]').count()==3
    for width,height in [(1440,900),(844,390),(667,375)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(300)
        for button in page.locator('[data-blessing],#skipBlessing').all():
            assert button.evaluate('''e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'''),(width,height)
    page.screenshot(path='/tmp/blessing-three-choices.png')
    page.locator('[data-blessing="frost"]').click()
    assert page.evaluate('!battle.model.paused && !battle.model.pendingBlessing && battle.model.stats({type:2,level:1,branch:-1}).slowDuration===2.5')
    page.evaluate("Object.assign(battle.model,{phase:'combat',wave:6,waveTime:0,hp:16,queue:[],enemies:[],shots:[]});battle.model.step(.01);battle.process()")
    assert page.locator('[data-blessing="frost"]').count()==0
    page.locator('[data-blessing="repair"]').click()
    assert page.evaluate('battle.model.hp===20 && battle.model.blessings.length===2 && battle.model.blessingsOffered===2')
    assert page.evaluate('!Object.hasOwn(JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY)),"blessings")')
    page.locator('#menuBtn').click();page.locator('#restart').click();page.locator('#yesRestart').click()
    assert page.evaluate('battle.model.blessings.length===0 && battle.model.stats({type:2,level:1,branch:-1}).slowDuration===2')
    # Rendering fixture: split bodies have distinct size and appear on their parent's route.
    page.evaluate('''()=>{
        const g=battle.model;g.phase='combat';g.wave=1;g.waveTime=0;g.queue=[{type:0,time:999}];
        const e=g.spawn(8,0,{distance:220});e.speed=0;battle.process();window.splitParent=e;
    }''')
    page.wait_for_timeout(250)
    page.evaluate('battle.model.hit(splitParent,99999,1);battle.model.step(.01);battle.process()')
    page.wait_for_function('battle.model.enemies.length===2 && battle.enemyViews.size===2')
    assert page.evaluate('battle.model.enemies.every(e=>e.type===9&&e.routeIndex===0&&e.splitFrom===splitParent.id)')
    assert page.evaluate('[...battle.enemyViews.values()].every(v=>v.body.displayWidth<40)')
    page.screenshot(path='/tmp/split-slime-children.png')
    assert not errors,errors
    assert not failed,failed
    browser.close()
    print('PASS: gated normal-resource trial UI/protected altar/permanent unlock, three-size blessing choices/pause/Escape guard/repair/reset, and split rendering/route inheritance without page errors')
