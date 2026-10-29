"""Optional local browser regression: start npm run dev, then run this file.
Requires Python Playwright and Chromium. No dependencies are downloaded.
"""
import os
from browser_fixtures import seed_all_unlocks
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
        headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 844, 'height': 390})
    seed_all_unlocks(page)
    errors = []
    failed_resources = []
    page.on('response', lambda response: failed_resources.append(response.url) if response.status >= 400 else None)
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(os.environ.get('GAME_URL', 'http://127.0.0.1:8000/'), wait_until='networkidle')
    page.wait_for_function('window.battle && window.UI')
    page.locator('#startBtn').click()
    page.locator('[data-stage="0"]').click()
    page.locator('#beginStage').click()
    # Test fixture funds let every branch reach its final form without balance changes.
    page.evaluate('battle.model.gold = 100000')
    for tower_type in range(6):
        for branch in ([0] if tower_type == 5 else range(2)):
            page.locator('#pad0').click()
            assert page.locator('[data-shop]').count() == 6
            for shop in page.locator('[data-shop]').all():
                assert shop.evaluate('''e => {
                    const r=e.getBoundingClientRect();
                    return r.width>=44 && r.height>=44 && r.x>=0 && r.right<=innerWidth &&
                        e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));
                }''')
            page.locator(f'[data-shop="{tower_type}"]').click()
            page.locator('#confirmBuild').click()
            if tower_type == 5:
                assert page.locator('[data-branch]').count() == 0
                page.locator('#upgradeTower').click()
            else:
                page.locator(f'[data-branch="{branch}"]').click()
            tower_id = ['bow', 'fire', 'ice', 'lightning', 'beam', 'meteor'][tower_type]
            expected = tower_id + str(1 if tower_type == 5 else 1 + branch)
            assert page.evaluate('battle.towerViews.values().next().value.texture.key') == expected
            # Upgrade while the initial build animation may still be running.
            for _ in range(0 if tower_type == 5 else 3):
                page.locator('#upgradeTower').click()
            page.wait_for_timeout(450)
            view = page.evaluate('''() => {
                const v = battle.towerViews.values().next().value;
                return {texture: v.texture.key, width: v.displayWidth};
            }''')
            assert view['texture'] == tower_id + str(1 if tower_type == 5 else 3 + branch), view
            assert abs(view['width'] - 146) < 0.01, view
            for width, height in [(1440, 900), (844, 390), (667, 375)]:
                page.set_viewport_size({'width': width, 'height': height})
                page.wait_for_timeout(150)
                assert page.locator('#tray').bounding_box()['height'] < 100
                for selector in ['#previewBtn', '#waveBtn', '.wave-actions label',
                                 '#pauseBtn', '#speedBtn', '#menuBtn']:
                    element = page.locator(selector)
                    box = element.bounding_box()
                    assert box and box['height'] >= 44 and box['x'] >= 0
                    assert box['x'] + box['width'] <= width
                    assert element.evaluate('''e => {
                        const r = e.getBoundingClientRect();
                        return e.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2));
                    }'''), selector
            page.locator('#previewBtn').click()
            assert page.locator('#modal').is_visible()
            page.locator('#closeModal').click()
            page.locator('#autoBtn').uncheck()
            assert not page.evaluate('battle.model.auto')
            page.locator('#autoBtn').check()
            page.locator('#sellTower').click()
            page.locator('#closeTray').click()
    page.locator('#menuBtn').click()
    page.locator('#menuGallery').click()
    assert page.locator('[data-gallery]').count() == 6
    for tower_type, forms in enumerate([5, 5, 5, 5, 5, 2]):
        page.locator(f'[data-gallery="{tower_type}"]').click()
        assert page.locator('[data-form]').count() == forms
        for form in range(forms):
            page.locator(f'[data-form="{form}"]').click()
            assert page.locator('#galleryDetail').inner_text()
    page.locator('#closeModal').click()
    for tower_type in range(6):
        page.locator(f'#pad{tower_type}').click()
        page.locator(f'[data-shop="{tower_type}"]').click()
        page.locator('#confirmBuild').click()
        if tower_type == 5:
            page.locator('#upgradeTower').click()
        else:
            page.locator('[data-branch="0"]').click()
            for _ in range(3):
                page.locator('#upgradeTower').click()
    page.locator('#closeTray').click()
    page.locator('#waveBtn').click()
    assert page.evaluate('battle.model.wave') == 1
    page.wait_for_timeout(6000)
    assert page.evaluate('battle.model.kills') > 0
    page.screenshot(path='/tmp/six-guardians.png')
    assert not failed_resources, failed_resources
    assert not errors, errors
    browser.close()
    print('PASS: six guardians, eleven evolution paths, 27 gallery forms, final sizes, tower tray, HUD hit targets and live combat')
