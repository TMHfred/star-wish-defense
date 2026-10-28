# 星之祈願：重製樣板 01

- Scope: four chapters and twelve distinct routes/wave schedules (8–15 waves), six guardians; five towers with 5 levels and two branches, meteor with 2 levels and no branch; independent from existing saves and hosting.
- Engine: Phaser 4.2.1, vendored and version-pinned. Model separated from scene/UI.
- Approved artwork: copied from the approved `detail-original/dist/assets` game, no new tower art generated. Forest is top-left crop from chapters-atlas, earth is top-left crop from road-materials. WebP crop only, no recoloring.
- Visual locks: fantasy storybook environment, chibi characters, common stone foundations, consistent three-quarter view, bottom-center sprite anchors. Base towers 118 world pixels wide, branch forms 132, final forms 146. Contact shadows stay on the ground. No floating tower idle animation.
- Motion: attack recoil and upgrade pop; leaf drift and landing rings; bow tracers versus fireball arcs. Shadows remain stable. UI respects reduced-motion preference.
- Layout: world 1280×400. Fit into viewport space below the HUD and above the bottom controls. Full-bleed forest backdrop is separate from the battlefield, so world scaling introduces no image seam. Pad zones are 108×95 world units.
- Stats: range and targeting use shared model.stats(); UI displays the same range normalized by 70. No separate visual range multiplier.
- Sample-only progression: branches at level2, final form at level5, no star locks in this independent sample. Not the pending full-game balance proposal.
- Source skill references: https://github.com/gamedev-skills/awesome-gamedev-agent-skills (tower-defense, create-game-assets, game-ui-ux, game-feel, phaser-core); snapshots in references/.
- Asset provenance: user-approved game artwork from existing Sites source; Phaser MIT license in dist/vendor/PHASER-LICENSE.txt.

- Lightning/beam/meteor artwork comes from the existing approved main-line commit `968d203` under `assets/*-v19.webp`, cropped exactly using that commit's `assets/art-v19.json`. Exported as lossless WebP with source alpha, no recoloring or redesign. Bow/fire assets remain unchanged. All 27 forms are listed by model metadata and shared by loader/UI/gallery.
- Meteor final form uses the same 146-world-pixel final width as the other guardians; its Lv.2 final status comes from model metadata rather than a hard-coded Lv.5 check.

- Chapter scenery reuses the forest backdrop with a backdrop-only wash/tint and chapter road-edge/particle palettes (river, frost ruins, sanctuary). Guardian artwork receives no chapter tint. Bridge pool, ruined column and lantern props are lossless crops of `968d203:assets/scenery.webp` using existing main-line scenery crop coordinates; decorations avoid platform centers and roads. These are assembled themes, not four newly commissioned background paintings.
- Stage route/pad data lives in stages.js. Renderer and DOM platform hit targets both consume the active Game's pads/routes. Road texture, portals, shadows, objects, tweens and delayed callbacks are rebuilt/cleared on stage changes; world dimensions and fitting rules are unchanged.
- Mobile viewport sizing is explicitly synchronized through viewport.js and Phaser Scale.NONE; this changes size/lifecycle synchronization, not the 1280×400 world, tower widths or world fitting formula. DOM platform targets are refreshed with the renderer after rotation/restore.

- Ice art supersedes the earlier v19 crops: use the five independent files supplied by remake commit 6fbcb18 and governed by ICE-ASSETS.md / ICE-ASSETS.json. Preserve their exact bytes, transparency, bases and distinct final structures. scripts/update-ice-assets.py validates the approved Git blob SHA/byte sizes and generates only shared URL versions; it never writes image data. Phaser preload, shop, tower portrait and gallery all use ForestArt.url().
