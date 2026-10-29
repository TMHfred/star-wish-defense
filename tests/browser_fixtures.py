"""Explicit all-unlocks fixture for visual/mechanics suites, never new-player progression."""

def seed_all_unlocks(page):
    page.add_init_script('''localStorage.setItem('starwish-journey-v2',JSON.stringify({
        version:2,goals:Array.from({length:12},()=>[true,true,true]),trialWon:true,
        castleStyle:'forest',titleId:'rookie'
    }));''')
