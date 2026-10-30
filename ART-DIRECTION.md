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

## 主頁面圖更新（使用者指定）

- 後續主頁面以使用者指定的圖片為準，取代先前「城堡中心、六塔兩側、遠方星門」的自製集結構圖方案。
- 使用者提供的參考連結：https://chatgpt.com/s/m_6ae352c390d08191a87cbee0f0202aed
- 分享連結最初遭代理拒絕（CONNECT 403）；使用者隨後在對話中直接提供 1846×852 的星光森林主頁圖。使用 image_gen 清除六個烘焙按鈕並補回石台，產生 `dist/assets/home-forest.png`，來源與 SHA-256 記於 HOME-ASSET.json。
- 已整合至 dist 開發主頁，以獨立 HTML 按鈕承接開始、繼續、說明、圖鑑、公告與設定。背景 cover 置中，手機橫向優先；標題與六元素圖案沿用參考圖，桌面較窄比例會裁切外側森林。根目錄正式站尚未同步。

## 森林遺跡活化與介面統一

- 以現有星光森林主頁的象牙白／暖金按鈕延伸到森林綠面板、戰鬥頂列與建塔列。保留所有核准塔、敵人、城堡與地圖圖片原始資料，不以重新生成塔圖改善清晰度。
- 空底座維持原本三分之四視角及世界位置，加入固定細節的風化石面、裂紋、缺角、礦物點、邊緣青苔、草及接地陰影。不是新塔圖，也不重畫塔內底座。
- 點選浮現暖金星紋；選塔預覽時隱藏風化底座，確認後以原塔圖完整底座與短暫地面星光表達活化，避免雙層。取消還原沉睡遺跡，拆除也回復風化狀態。活化效果不延遲建造或攻擊。
- 畫布增加實際像素，世界 1280×400、塔尺寸、世界 fitting 及判定保持不變。高密度渲染不會憑空增加低解析度森林原圖的細節。

## 星願補給所

- 沿用主頁的米白、森林綠、暖金與細邊框，以三款專用 SVG 表現星光布袋、祈願寶箱、加上星冠／葉飾的典藏箱。飲料與封印式徽章採相同筆觸、顏色與柔和陰影，無外部素材或彩色 emoji；核准塔圖與地圖不變。
- 新入口與主頁其餘次要按鈕並排，主要開始按鈕仍是暖金重點；戰場不新增常駐入口。短高度維持三欄，精簡裝飾與介紹，保留 44px 操作區及固定模擬聲明，收藏區可向下捲動。
- 開箱使用一次的抬蓋、星光緩移與淡入，典藏箱露出可愛飲料；無強光閃爍。結果頁的飲料、徽章與感謝文字保持靜止。支援跳過及系統／遊戲減少動態設定。
