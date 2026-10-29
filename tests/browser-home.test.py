"""User-selected forest home, mobile controls and honest continue behavior."""
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
    assert page.locator('#continueBtn').is_disabled()
    assert page.locator('.home-background').evaluate('e=>e.complete && e.naturalWidth===1846 && e.naturalHeight===852')
    for width,height in [(1440,900),(844,390),(667,375)]:
        page.set_viewport_size({'width':width,'height':height})
        page.wait_for_timeout(400)
        for selector in ['#startBtn','#continueBtn','#helpBtn','#galleryBtn','#newsBtn','#settingsBtn']:
            assert page.locator(selector).evaluate('''e=>{
                const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.right<=innerWidth&&
                r.y>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
            }'''),(width,height,selector)
        page.screenshot(path=f'/tmp/star-wish-home-{width}.png')
    page.locator('#helpBtn').click();assert page.locator('#modal').is_visible();page.locator('#closeModal').click()
    page.locator('#galleryBtn').click();assert page.locator('[data-gallery]').count()==6;page.locator('#closeModal').click()
    page.locator('#newsBtn').click();assert '中途存檔' in page.locator('#modalBody').inner_text();page.locator('#closeModal').click()
    page.locator('#settingsBtn').click();page.locator('#soundBtn').click();assert '開啟' in page.locator('#soundBtn').inner_text()
    page.locator('#settingsEffects').click();assert page.evaluate('battle.effectsLow');page.locator('#closeModal').click()
    # Continue resumes the existing in-memory battle without rebuilding or refunding.
    page.locator('#startBtn').click();page.locator('[data-stage="0"]').click()
    for width,height in [(1440,900),(844,390),(667,375)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(300)
        for selector in ['#beginStage','#cancelStage']:
            assert page.locator(selector).evaluate('''e=>{const r=e.getBoundingClientRect();return r.height>=44&&r.width>=44&&r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'''),(width,height,selector)
        for goal in page.locator('.prepare-goals .objectives-list li').all():
            assert goal.evaluate('''e=>{const r=e.getBoundingClientRect(),body=document.getElementById('modalBody').getBoundingClientRect();return r.top>=body.top&&r.bottom<=body.bottom+1;}'''),(width,height,'all goals initially visible')
        page.screenshot(path=f'/tmp/journey-preparation-{width}.png')
    page.locator('#beginStage').click()
    page.locator('#pad0').click();page.locator('[data-shop="0"]').click();page.locator('#confirmBuild').click();page.locator('#closeTray').click()
    page.locator('#menuBtn').click();page.locator('#goHome').click()
    assert page.locator('#continueBtn').is_enabled()
    page.locator('#continueBtn').click()
    assert page.locator('#home').is_hidden()
    assert page.evaluate('battle.model.towers.length===1 && battle.model.gold===240 && battle.model.stageId===0')
    # Persisted stars continue at chapter selection, never invent an in-progress save.
    page.evaluate('''()=>{const progress=Forest.emptyProgress();progress.goals[0]=[true,false,false];localStorage.setItem(Forest.PROGRESS_KEY,JSON.stringify(progress));}''')
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    assert page.locator('#continueBtn').is_enabled()
    page.locator('#continueBtn').click()
    assert page.locator('[data-stage]').count()==3
    assert page.evaluate('!battle.playing && battle.model.towers.length===0')
    assert not errors,errors
    assert not failed,failed
    browser.close()
    print('PASS: selected forest image, six home controls at 1440x900/844x390/667x375, help/gallery/news/settings, session battle resume and persisted chapter selection')
