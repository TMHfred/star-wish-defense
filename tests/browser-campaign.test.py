"""Fresh journey UI; model tests separately prove normal-economy wins/challenges."""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':844,'height':390})
    errors,failures=[],[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('response',lambda r:failures.append(r.url) if r.status>=400 else None)
    url=os.environ.get('GAME_URL','http://127.0.0.1:8000/')
    page.goto(url,wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    page.evaluate("localStorage.setItem('starwish-remake-campaign-v1',JSON.stringify({version:1,stars:Array(12).fill(3)}));localStorage.setItem('unrelated-game-record','preserve')")
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    assert page.locator('#continueBtn').is_disabled()  # Old players start fresh too.
    page.locator('#startBtn').click()
    assert page.locator('[data-stage="0"] .stage-stars').inner_text()=='☆☆☆'
    assert page.locator('[data-stage="1"]').is_disabled()
    for width,height in [(1440,900),(844,390),(667,375)]:
        page.set_viewport_size({'width':width,'height':height})
        for chapter in range(4):
            page.locator(f'[data-chapter="{chapter}"]').click()
            assert page.locator('[data-stage]').count()==3
            if chapter:
                assert all(card.is_disabled() for card in page.locator('[data-stage]').all())
    page.locator('[data-chapter="0"]').click();page.locator('[data-stage="0"]').click()
    assert page.locator('.objectives-list li').count()==3
    assert '80%' in page.locator('.objectives-list').inner_text()
    assert page.locator('.ready-roster .locked').count()==5
    page.screenshot(path='/tmp/journey-preparation-667.png')
    page.locator('#beginStage').click()
    page.locator('#pad0').click()
    assert page.locator('[data-shop="0"]').is_enabled()
    assert all(page.locator(f'[data-shop="{t}"]').is_disabled() for t in range(1,6))
    page.locator('[data-shop="0"]').click();page.locator('#confirmBuild').click()
    page.locator('#menuBtn').click();page.locator('#objectivesBtn').click()
    assert page.evaluate('battle.model.paused')
    assert page.locator('.objectives-list li').count()==3
    page.locator('#closeModal').click();page.locator('#menuBtn').click();page.locator('#chooseStage').click()
    page.locator('[data-stage="0"]').click();page.locator('#cancelStage').click()
    assert page.evaluate('battle.model.towers.length')==1
    page.locator('[data-stage="0"]').click();page.locator('#beginStage').click()
    # Real victories with synthetic browser-only funds; every build/upgrade still obeys unlocks.
    for stage_id in range(12):
        assert page.evaluate('battle.model.stageId')==stage_id
        assert page.evaluate('battle.model.wave===0 && battle.model.towers.length===0 && battle.enemyViews.size===0')
        assert page.locator('.platform-hit').count()==page.evaluate('battle.model.pads.length')
        assert page.locator('#waveTotal').inner_text()=='/'+str(page.evaluate('battle.model.waves.length'))
        if stage_id==6:
            page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(200)
            assert page.evaluate('battle.model.paused')
            page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(200)
            page.locator('#pauseBtn').click()
        result=page.evaluate('''()=>{
            const g=battle.model;g.gold=99999;
            const roster=[0,1,4,2,3,0].filter(type=>Forest.towerUnlocked(g.progress,type));
            for(let i=0;i<6;i++){
                const type=roster[i%roster.length],t=g.build(i,type).tower;
                while(!g.upgradeReason(t,0))g.upgrade(t,0);
            }
            battle.process();g.startWave();battle.process();
            for(let i=0;i<60000&&!['won','lost'].includes(g.phase);i++){
                if(g.pendingBlessing){g.chooseBlessing('skip');battle.process();}g.step(.05);if(i%100===0)battle.process();
            }
            battle.process();return {phase:g.phase,wave:g.wave,total:g.waves.length};
        }''')
        assert result['phase']=='won',result
        assert result['wave']==result['total']
        assert page.locator('#resultStages').is_visible()
        assert page.locator('.objectives-list li').count()==3
        if stage_id==0:
            assert '火焰塔' in page.locator('.unlock-notice').inner_text()
        if stage_id<11:
            page.locator('#nextStage').click()
            assert page.locator('#beginStage').is_visible()
            page.locator('#beginStage').click()
        else:
            assert page.locator('#nextStage').count()==0
    assert '十二束星光' in page.locator('#modalTitle').inner_text()
    progress=page.evaluate('JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY))')
    assert len(progress['goals'])==12 and all(row[0] for row in progress['goals'])
    assert progress['trialWon'] is False
    assert page.evaluate("JSON.parse(localStorage.getItem('starwish-remake-campaign-v1')).stars.every(n=>n===3)")
    assert page.evaluate("localStorage.getItem('unrelated-game-record')")=='preserve'
    page.locator('#resultStages').click();page.locator('#campaignRewards').click()
    page.locator('[data-castle="moon"]').click()
    assert page.evaluate('battle.castle.isTinted')
    page.locator('[data-title="forest"]').click()
    page.screenshot(path='/tmp/journey-rewards.png')
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    assert page.evaluate("JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY)).castleStyle==='moon'")
    page.locator('#startBtn').click();page.locator('[data-chapter="3"]').click()
    assert page.locator('[data-stage="11"]').is_enabled()
    assert '★' in page.locator('[data-stage="11"] .stage-stars').inner_text()
    page.evaluate("localStorage.setItem(Forest.PROGRESS_KEY,'corrupted')")
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click()
    assert page.locator('[data-stage="0"] .stage-stars').inner_text()=='☆☆☆'
    assert page.locator('[data-stage="1"]').is_disabled()
    page.locator('[data-stage="0"]').click();page.locator('#beginStage').click()
    # Isolated result fixtures verify independent star positions/merge through the real UI/storage path.
    page.evaluate("battle.model.phase='won';battle.model.hp=15;UI.event({type:'end',won:true})")
    assert page.locator('.result-stars').inner_text()=='★☆★'
    page.locator('#playAgain').click();page.locator('#beginStage').click()
    page.evaluate("battle.model.phase='won';battle.model.hp=16;battle.model.metrics.sales=1;UI.event({type:'end',won:true})")
    assert page.locator('.result-stars').inner_text()=='★★☆'
    assert page.evaluate('JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY)).goals[0].every(Boolean)')
    page.locator('#playAgain').click();page.locator('#beginStage').click()
    page.evaluate("battle.model.phase='lost';battle.model.hp=0;UI.event({type:'end',won:false})")
    assert page.locator('.result-stars').inner_text()=='☆☆☆'
    assert page.evaluate('JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY)).goals[0].every(Boolean)')
    page.locator('#playAgain').click();page.locator('#beginStage').click()
    page.evaluate('''()=>{
        Storage.prototype.setItem=()=>{throw new DOMException('blocked','SecurityError')};
        battle.model.phase='won';battle.model.hp=20;UI.event({type:'end',won:true});
    }''')
    assert '無法儲存' in page.locator('#modalBody').inner_text()
    assert page.locator('.result-stars').inner_text()=='★★★'
    assert not errors,errors
    assert not failures,failures
    browser.close()
    print('PASS: fresh reset/old-save isolation, locked stages/roster, preparation and live goals, 12 victories/results/unlocks, separate goal persistence, cosmetic equipment/reload, corrupt-save fallback and storage failure')
