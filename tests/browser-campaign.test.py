"""Campaign UI and stage transitions; model tests separately verify normal economy."""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':844,'height':390})
    errors=[]; failures=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failures.append(r.url) if r.status>=400 else None)
    url=os.environ.get('GAME_URL','http://127.0.0.1:8000/')
    page.goto(url,wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    page.evaluate("localStorage.setItem('unrelated-game-record','preserve')")
    page.locator('#startBtn').click()
    for width,height in [(1440,900),(844,390),(667,375)]:
        page.set_viewport_size({'width':width,'height':height})
        for chapter in range(4):
            page.locator(f'[data-chapter="{chapter}"]').click()
            assert page.locator('[data-stage]').count()==3
            if width==667 and chapter==3:
                page.screenshot(path='/tmp/campaign-selection.png')
            for card in page.locator('[data-stage]').all():
                card.scroll_into_view_if_needed()
                assert card.evaluate('''e=>{const r=e.getBoundingClientRect();return r.x>=0 && r.right<=innerWidth && r.width>=44 && r.height>=44 && e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}''')
    page.locator('[data-chapter="0"]').click();page.locator('[data-stage="0"]').click()
    page.locator('#pad0').click();page.locator('[data-shop="0"]').click();page.locator('#confirmBuild').click()
    page.locator('#menuBtn').click();page.locator('#chooseStage').click();page.locator('[data-stage="1"]').click()
    assert page.locator('#confirmStage').is_visible()
    page.locator('#cancelStage').click();assert page.evaluate('battle.model.towers.length')==1
    page.locator('[data-stage="0"]').click();page.locator('#confirmStage').click()
    # Real model victory drives every result modal; funding only speeds up browser fixtures.
    for stage_id in range(12):
        assert page.evaluate('battle.model.stageId')==stage_id
        assert page.evaluate('battle.model.wave')==0
        assert page.evaluate('battle.model.towers.length')==0
        assert page.evaluate('battle.enemyViews.size')==0
        assert page.locator('.platform-hit').count()==page.evaluate('battle.model.pads.length')
        assert page.locator('#waveTotal').inner_text()=='/'+str(page.evaluate('battle.model.waves.length'))
        page.locator('#previewBtn').click();assert page.locator('#modalTitle').inner_text().startswith('第 1 波')
        page.locator('#closeModal').click()
        if stage_id in [0,3,6,9]:
            page.screenshot(path=f'/tmp/campaign-chapter-{stage_id//3+1}.png')
        if stage_id==6:
            page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
            assert page.evaluate('battle.model.paused')
            page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(200)
            assert page.evaluate('battle.model.paused')
            page.locator('#pauseBtn').click()
        result=page.evaluate('''()=>{
            const g=battle.model;g.gold=99999;
            for(let type=0;type<6;type++){
                const t=g.build(type,type).tower;g.upgrade(t,type===5?undefined:0);
                while(!Forest.finalForm(t))g.upgrade(t);
            }
            battle.process();g.startWave();battle.process();
            for(let i=0;i<50000&&!['won','lost'].includes(g.phase);i++){
                g.step(.05);if(i%100===0)battle.process();
            }
            battle.process();return {phase:g.phase,wave:g.wave,total:g.waves.length};
        }''')
        assert result['phase']=='won',result
        assert result['wave']==result['total']
        assert page.locator('#resultStages').is_visible()
        if stage_id<11:page.locator('#nextStage').click()
        else:assert page.locator('#nextStage').count()==0
    assert '十二束星光' in page.locator('#modalTitle').inner_text()
    progress=page.evaluate("JSON.parse(localStorage.getItem('starwish-remake-campaign-v1'))")
    assert len(progress['stars'])==12 and all(n>0 for n in progress['stars'])
    assert page.evaluate("localStorage.getItem('unrelated-game-record')")=='preserve'
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click();page.locator('[data-chapter="3"]').click()
    assert '☆' in page.locator('[data-stage="11"] .stage-stars').inner_text()
    assert '★' in page.locator('[data-stage="11"] .stage-stars').inner_text()
    page.evaluate("localStorage.setItem('starwish-remake-campaign-v1','corrupted')")
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click()
    assert page.locator('[data-stage="0"] .stage-stars').inner_text()=='☆☆☆'
    page.locator('[data-stage="0"]').click()
    # Isolated storage-failure fixture exercises the notice, not combat victory.
    page.evaluate('''()=>{
        Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};
        battle.model.phase='won';battle.model.hp=20;
        UI.event({type:'end',won:true});
    }''')
    assert '無法儲存' in page.locator('#modalBody').inner_text()
    assert page.locator('.result-stars').inner_text()=='★★★'
    assert not errors,errors
    assert not failures,failures
    browser.close()
    print('PASS: 12 stage victories/results/next-stage resets, 4 chapter menus, three landscape sizes, orientation pause, previews, isolated progress/reload and corrupt-save fallback')
