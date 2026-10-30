"""Simulated supply shop: mobile layout, local keepsakes and pause isolation.
Uses disposable Chromium profiles, never a real player's browser or payment service.
"""
import json
import os
from pathlib import Path
from urllib.parse import urlsplit
from playwright.sync_api import sync_playwright

URL=os.environ.get('GAME_URL','http://127.0.0.1:8005/')
OUT=Path(os.environ.get('SUPPLY_ARTIFACTS','/workspace/star-wish-supply-preview/browser-results'))
OUT.mkdir(parents=True,exist_ok=True)
NOTICE='趣味模擬，無實際付款，不會收取費用'
IDS=['starlight','wish','drink']
NAMES=['星光應援者','祈願同行者','作者的飲料贊助商']

def reachable(e):
    e.evaluate("e=>e.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'})")
    assert e.evaluate('''e=>{const r=e.getBoundingClientRect();return r.width>=44&&r.height>=44&&r.x>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight&&e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}'''),e

def tap(page,selector):
    e=page.locator(selector) if isinstance(selector,str) else selector
    reachable(e)
    r=e.bounding_box();page.touchscreen.tap(r['x']+r['width']/2,r['y']+r['height']/2)

def frame(page):
    assert page.locator('.supply-disclaimer').inner_text()==NOTICE
    for sel in ['#closeModal','.supply-disclaimer']:
        assert page.locator(sel).evaluate('''e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth;}'''),sel
    assert page.locator('#modalBody').evaluate('e=>e.scrollWidth<=e.clientWidth+1')
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert page.locator('#modal').locator('a,form,input,iframe').count()==0

def stored(page):
    return page.evaluate('JSON.parse(localStorage.getItem(Forest.PROGRESS_KEY))')

def no_badges(p):
    p=dict(p);p.pop('supplyBadges',None);return p

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':844,'height':390},is_mobile=True,has_touch=True,device_scale_factor=2)
    legacy={'version':2,'goals':[[True,True,True] if i<9 else [False,False,False] for i in range(12)],'stars':[3]*9+[0]*3,'trialWon':True,'castleStyle':'star','titleId':'moon'}
    page.add_init_script("if(!sessionStorage.getItem('supply-fixture')){localStorage.setItem('starwish-journey-v2',"+json.dumps(json.dumps(legacy))+");sessionStorage.setItem('supply-fixture','1');}")
    errors=[];requests=[];failed=[];popups=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('request',lambda r:requests.append(r.url))
    page.on('response',lambda r:failed.append(r.url) if r.status>=400 else None)
    page.on('popup',lambda q:popups.append(q.url))
    page.goto(URL,wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    assert page.evaluate('battle.model.progress.supplyBadges.length===0')
    home_font=page.locator('#supplyBtn').evaluate('e=>getComputedStyle(e).fontSize')
    before=stored(page)
    for width,height in [(844,390),(667,375),(932,430),(1440,900)]:
        page.set_viewport_size({'width':width,'height':height});page.wait_for_timeout(450)
        for sel in ['#startBtn','#continueBtn','#helpBtn','#galleryBtn','#newsBtn','#settingsBtn','#supplyBtn']:reachable(page.locator(sel))
        tap(page,'#supplyBtn');assert page.evaluate('battle.model.paused')
        assert page.locator('.supply-packs>article').count()==3
        cards=[e.bounding_box() for e in page.locator('.supply-packs>article').all()]
        assert max(c['y'] for c in cards)-min(c['y'] for c in cards)<1,cards
        for a,b in zip(cards,cards[1:]):assert a['x']+a['width']+3<=b['x'],cards
        for e in page.locator('[data-supply-pack]').all():reachable(e)
        frame(page)
        page.locator('#modalBody').evaluate('e=>e.scrollTop=0')
        page.screenshot(path=str(OUT/f'shop-{width}.png'),scale='css')
        page.locator('.supply-collection').evaluate("e=>e.scrollIntoView({block:'nearest',behavior:'instant'})");frame(page)
        assert page.locator('[data-supply-badge]').count()==3
        page.screenshot(path=str(OUT/f'collection-{width}.png'),scale='css')
        tap(page,'#closeModal');assert page.evaluate('battle.model.paused')
        assert stored(page)==before
        print(f'PASS layout: {width}x{height}',flush=True)
    page.set_viewport_size({'width':844,'height':390});page.wait_for_timeout(450)
    assert page.locator('#supplyBtn').evaluate('e=>getComputedStyle(e).fontSize')==home_font
    tap(page,'#supplyBtn')
    tap(page,'[data-supply-pack="drink"]');frame(page)
    assert page.locator('#supplyConfirm').is_enabled()
    assert '不需要真的按讚、留言、分享或購買飲料' in page.locator('#modalBody').inner_text()
    tap(page,'#supplyBack');assert stored(page)==before
    tap(page,'[data-supply-pack="drink"]');page.keyboard.press('Escape')
    assert page.locator('[data-supply-pack]').count()==3
    assert stored(page)==before
    # Count writes and deliberately invoke a stale confirm handler twice.
    page.evaluate('''()=>{const set=Storage.prototype.setItem;window.supplyWrites=0;Storage.prototype.setItem=function(k,v){if(k===Forest.PROGRESS_KEY)supplyWrites++;return set.call(this,k,v);};}''')
    for i,key in enumerate(IDS):
        button=page.locator(f'[data-supply-pack="{key}"]');font=button.evaluate('e=>getComputedStyle(e).fontSize');tap(page,button)
        page.evaluate('''()=>{const button=document.getElementById('supplyConfirm');button.onclick();button.onclick();document.getElementById('supplySkip')?.click();}''')
        assert page.locator('#supplyReturn').is_visible()
        assert NAMES[i] in page.locator('#modalBody').inner_text()
        assert stored(page)['supplyBadges']==IDS[:i+1]
        assert no_badges(stored(page))==before
        assert page.evaluate('supplyWrites')==i+1
        frame(page)
        if key=='drink':
            text=page.locator('.supply-thanks').inner_text()
            assert text=='心意已送達！\n作者獲得了『想像中的飲料』一杯。\n感謝你陪伴《星之祈願：守護小隊》成長。',text
            page.screenshot(path=str(OUT/'drink-thanks.png'),scale='css')
        writes=page.evaluate('supplyWrites')
        page.evaluate("document.getElementById('supplyReplay').click();document.getElementById('supplySkip')?.click()")
        assert page.evaluate('supplyWrites')==writes
        tap(page,'#supplyReturn')
        assert page.locator(f'[data-supply-badge="{key}"]').get_attribute('class')=='collected'
        assert page.locator(f'[data-supply-pack="{key}"]').evaluate('e=>getComputedStyle(e).fontSize')==font
    # An already-owned pack remains replayable but does not add another badge.
    tap(page,'[data-supply-pack="drink"]')
    assert '已收藏' in page.locator('.supply-badge-preview').inner_text()
    page.evaluate("document.getElementById('supplyConfirm').click();document.getElementById('supplySkip')?.click()")
    assert stored(page)['supplyBadges']==IDS
    # Media changes during the animation finish it, without a later timer reopening it.
    page.evaluate("document.getElementById('supplyReplay').click()")
    page.emulate_media(reduced_motion='reduce');page.wait_for_function("!!document.getElementById('supplyReturn')")
    assert page.locator('.supply-opening').count()==0
    tap(page,'#supplyReturn');tap(page,'[data-supply-pack="wish"]');tap(page,'#supplyConfirm')
    assert page.locator('#supplyReturn').is_visible();assert page.locator('.supply-opening').count()==0
    page.emulate_media(reduced_motion='no-preference')
    page.evaluate("document.getElementById('supplyReplay').click();document.getElementById('closeModal').click()")
    page.wait_for_timeout(1750);assert page.locator('#modal').is_hidden()
    assert page.evaluate('battle.model.paused')
    # Refresh during an opening: the confirmed gift is already safely collected.
    tap(page,'#supplyBtn');tap(page,'[data-supply-pack="starlight"]')
    page.evaluate("document.getElementById('supplyConfirm').click()")
    page.reload(wait_until='networkidle');page.wait_for_function('window.battle && window.UI')
    assert stored(page)['supplyBadges']==IDS;assert no_badges(stored(page))==before
    tap(page,'#supplyBtn');assert page.locator('.supply-card.owned').count()==3
    tap(page,'#closeModal')
    # Existing low-effects setting also skips the shop animation.
    tap(page,'#settingsBtn');tap(page,'#settingsEffects');tap(page,'#closeModal')
    tap(page,'#supplyBtn');tap(page,'[data-supply-pack="drink"]');tap(page,'#supplyConfirm')
    assert page.locator('.supply-opening').count()==0;assert page.locator('#supplyReturn').is_visible();tap(page,'#closeModal')
    # The home-only entrance cannot reset or resume a retained battle.
    tap(page,'#startBtn');tap(page,'[data-stage="0"]');tap(page,'#beginStage')
    tap(page,'#pad0');tap(page,'[data-shop="0"]');tap(page,'#confirmBuild');tap(page,'#closeTray');tap(page,'#waveBtn');tap(page,'#pauseBtn')
    snapshot=page.evaluate('JSON.stringify({time:battle.model.time,gold:battle.model.gold,hp:battle.model.hp,towers:battle.model.towers,wave:battle.model.wave})')
    tap(page,'#menuBtn');tap(page,'#goHome');tap(page,'#supplyBtn');tap(page,'#closeModal');page.wait_for_timeout(250)
    assert page.evaluate('battle.model.paused')
    assert page.evaluate('JSON.stringify({time:battle.model.time,gold:battle.model.gold,hp:battle.model.hp,towers:battle.model.towers,wave:battle.model.wave})')==snapshot
    tap(page,'#continueBtn');assert page.evaluate('!battle.model.paused && battle.model.towers.length===1 && battle.model.wave===1')
    tap(page,'#pauseBtn')
    page.evaluate("document.getElementById('supplyBtn').click()")
    tap(page,'#closeModal');assert page.evaluate('battle.model.paused')
    assert page.locator('#hud #supplyBtn').count()==0
    tap(page,'#pauseBtn');assert page.evaluate('!battle.model.paused')
    page.evaluate("document.getElementById('supplyBtn').click()")
    assert page.evaluate('battle.model.paused');tap(page,'#closeModal');assert page.evaluate('!battle.model.paused')
    assert not errors,errors
    assert not failed,failed
    assert not popups,popups
    origin=urlsplit(URL).netloc
    external=[u for u in requests if not (u.startswith(URL) or u.startswith('data:') or u.startswith('blob:') and urlsplit(u[5:]).netloc==origin)]
    assert not external,external
    page.close()
    # Disabled storage is explicit and recoverable; keepsakes give no continue/unlock benefits.
    blocked=browser.new_page(viewport={'width':667,'height':375},is_mobile=True,has_touch=True)
    blocked.add_init_script("Storage.prototype.getItem=()=>{throw new Error('storage disabled')};Storage.prototype.setItem=()=>{throw new Error('storage disabled')};")
    blocked_errors=[];blocked.on('pageerror',lambda e:blocked_errors.append(str(e)))
    blocked.goto(URL,wait_until='networkidle');blocked.wait_for_function('window.battle && window.UI');blocked.emulate_media(reduced_motion='reduce')
    tap(blocked,'#supplyBtn');tap(blocked,'[data-supply-pack="drink"]');tap(blocked,'#supplyConfirm')
    assert '僅保留至重新整理前' in blocked.locator('.supply-storage-warning').inner_text()
    assert blocked.evaluate("battle.model.progress.supplyBadges.join(',')==='drink' && Forest.totalStars(battle.model.progress)===0 && !Forest.towerUnlocked(battle.model.progress,1)")
    tap(blocked,'#closeModal');assert blocked.locator('#continueBtn').is_disabled()
    assert not blocked_errors,blocked_errors
    blocked.close();browser.close()
    (OUT/'result.json').write_text(json.dumps({'status':'passed','sizes':[[844,390],[667,375],[932,430],[1440,900]],'checks':['three parallel packs','pinned disclosure and close','no horizontal overflow','stable fonts','cancel and Escape','double-confirm guard','three unique badges','no battle/progress benefits','no outgoing requests or popups','animation skip/replay/reduced-motion','close cancels timers','refresh and legacy save preservation','storage failure feedback','manual/home/battle pause isolation','retained combat resume']},ensure_ascii=False,indent=2)+'\n')
    print('PASS: simulated supply shop end-to-end; legacy save preservation, idempotent collection, all animation/cancel/reload paths, no external actions, and existing battle pause/resume')
