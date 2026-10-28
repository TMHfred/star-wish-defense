"""Render every guardian's attack in a disposable, controlled combat fixture."""
import os
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 844, 'height': 390})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(os.environ.get('GAME_URL', 'http://127.0.0.1:8000/'), wait_until='networkidle')
    page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click()
    page.locator('[data-stage="0"]').click()
    page.evaluate('''() => {
        const g = battle.model; g.gold = 99999; g.auto = false;
        for (let type=0; type<6; type++) {
            const t=g.build(type,type).tower;
            g.upgrade(t,type===5?undefined:0);
            while (!Forest.finalForm(t)) g.upgrade(t);
        }
        g.startWave(); g.queue=[{type:0,time:999}];
        for (const distance of [150,500,700,1000]) {
            g.spawn(0);
            Object.assign(g.enemies.at(-1), Forest.position(distance),
                {distance,speed:0,hp:100000,maxHp:100000});
        }
        window.attackTypes=new Set();window.chainSeen=false;
        const emit=g.emit.bind(g);
        g.emit=(type,data={})=>{
            if(type==='fire') attackTypes.add(data.tower.type);
            if(type==='chain') chainSeen=true;
            emit(type,data);
        };
        battle.process();
    }''')
    page.wait_for_function('attackTypes.size===5 && chainSeen && battle.model.towers[4].charge>0')
    page.wait_for_timeout(1300)
    assert page.evaluate('battle.model.enemies.some(e=>e.slowTime>0)')
    assert page.evaluate('battle.model.enemies.every(e=>e.hp<100000)')
    assert page.evaluate('battle.towerViews.size') == 6
    assert not errors, errors
    page.screenshot(path='/tmp/six-guardians-combat.png')
    browser.close()
    print('PASS: six tower views, ice status, lightning chains, beam charge and all attack renderers without page errors')
