# 星之祈願：重製樣板 01

- Scope: one forest map, 8 waves, bow/fire towers, 5 levels and two branches; independent from existing saves and hosting.
- Engine: Phaser 4.2.1, vendored and version-pinned. Model separated from scene/UI.
- Approved artwork: copied from the approved `detail-original/dist/assets` game, no new tower art generated. Forest is top-left crop from chapters-atlas, earth is top-left crop from road-materials. WebP crop only, no recoloring.
- Visual locks: fantasy storybook environment, chibi characters, common stone foundations, consistent three-quarter view, bottom-center sprite anchors. Base towers 118 world pixels wide, branch forms 132, final forms 146. Contact shadows stay on the ground. No floating tower idle animation.
- Motion: attack recoil and upgrade pop; leaf drift and landing rings; bow tracers versus fireball arcs. Shadows remain stable. UI respects reduced-motion preference.
- Layout: world 1280×400. Fit into viewport space below the HUD and above the bottom controls. Full-bleed forest backdrop is separate from the battlefield, so world scaling introduces no image seam. Pad zones are 108×95 world units.
- Stats: range and targeting use shared model.stats(); UI displays the same range normalized by 70. No separate visual range multiplier.
- Sample-only progression: branches at level2, final form at level5, no star locks in this independent sample. Not the pending full-game balance proposal.
- Source skill references: https://github.com/gamedev-skills/awesome-gamedev-agent-skills (tower-defense, create-game-assets, game-ui-ux, game-feel, phaser-core); snapshots in references/.
- Asset provenance: user-approved game artwork from existing Sites source; Phaser MIT license in dist/vendor/PHASER-LICENSE.txt.
