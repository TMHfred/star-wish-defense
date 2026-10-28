# 重製版交接 — 2026-10-28

## 入口與版本
- 此 GitHub remake 分支保存獨立重製版；main 保留原正式版，尚未將新版發布至 GitHub Pages。
- 獨立試玩：https://star-wish-reborn.dj92zyy7hp.chatgpt.site（ChatGPT 登入可見）
- 對應原 Sites 源提交：cdbec12f3486fde3982ce5ea92624712b4c38117。
- 不搬入 Sites 的 .openai 身分、Git 中繼資料或授權資料；不要從此分支直接操作原 Sites 部署。

## 已完成
Phaser 4.2.1 本地 vendor；四場景十二關、8～15 波、八種敵人；六種守護塔，前五種兩分支、Lv.5 最終造型，星隕兩型態無分支；建造、升級、70% 拆除退款、最多六塔；射程圈；投射物、範圍傷害與灼燒；環境飄葉、升級與金幣特效；主頁、圖鑑、怪物預告、音效開關、暫停、1×/2×、預設自動接波、勝敗與重玩。沒有正式版存檔讀寫；重製版最佳星數另存本機。

## 使用者核准方向
奇幻繪本場景＋Q 版角色＋清楚動畫特效。既有六種塔核准造型應保留，尤其底座一致、進化不縮小。手機橫向滿版。底部先顯示塔縮圖，點後才顯示數值與費用。直向顯示森林橫放提示，遊戲暫停，回橫向手動繼續。

完整版目標為六塔（弓箭、火、冰、雷、光、星隕）、四場景十二關與自由迷宮。目前已完成六塔與十二關可玩基線；自由迷宮尚未實作。星隕預期兩型態、無分支；其餘塔保留分支差異。大幅難度平衡暫緩。塔融合方案已捨棄。

## 測試證據與限制
- 模型測試：直角路徑、扣款失敗不變更狀態、分支、退款、六塔限制、暫停、延遲範圍命中，以及八波勝利和失敗。
- 瀏覽器：844×390、667×375 內嵌視窗，390×844 直向切換；建造與扣款、分支升級、第一波運行。沒有實體手機全流程驗證。
- 使用者 iPhone 曾出現戰場整體偏下並裁切；重開恢復。根因未確認，不能斷定手機故障或已修復。追蹤首次載入、主畫面模式、visualViewport、安全區與連續轉向。先重現，不要直接調整地圖大小。

## 下一步
1. 讓使用者試玩十二關，確認章節難度、路線配置、塔搭配與手機操作。
2. 重現偶發視口偏移；蒐集實際 innerHeight / visualViewport / Phaser scale 尺寸（如需新增診斷，限定本地、不上傳個資）。
3. 六塔與十二關已完成可玩基線；後續依需求另行整合迷宮。
4. 平衡與正式發布另行取得任務授權。

## 程式地圖
- dist/stages.js：四章十二關的路線、平台、波次、提示與起始資源。
- dist/model.js：純模擬、塔與怪物資料、波次、索敵、經濟、星數判定。
- dist/scene.js：Phaser 場景、貼圖載入、世界縮放、陰影、塔與怪物、特效。
- dist/ui.js：主頁、暫停、圖鑑、建塔列、按鈕、模式狀態與 DOM 點擊區。
- dist/style.css / index.html：介面、安全區與直向提示。
- tests/model.test.cjs：可獨立執行的模型測試。
- ART-DIRECTION.md、references/：美術規範、來源技能快照。技能網址為參考，不代表遊戲已全數實作。

## 本輪接手進度
- 已讀指引；`npm test`、`npm run check` 通過。
- 新增 `dist/viewport-debug.js`，只在 localhost／loopback 的 `?viewportDebug` 啟用；記憶體上限 120 筆，無上傳或持久儲存。操作方式見 README。
- Chromium 模擬 844×390、667×375，穿插 390×844／375×667 連續轉向，canvas 與 Phaser scale 尺寸一致，回橫向世界仍在視口內，直向暫停，手動繼續後第一波正常，無頁面執行錯誤。
- 未重現 iPhone 偶發偏移；未做實體 iPhone、Safari 或主畫面模式驗證，不宣稱修復。未調整地圖尺寸、美術或平衡，未部署或合併 main。

## 上方控制列與進化外觀檢查
- 波次預告、自動接續、開始波次整合至 HUD；開啟塔資訊時不再隱藏。保留安全區與至少 44px 操作高度，不調整戰場縮放。
- 修正窄畫面最終型態說明被擠成直排、資訊面板撐高遮擋戰場。
- 本機四條分支皆可切換正確貼圖；修正快速升級時舊建造／後座動畫可能覆寫進化尺寸，升級先取消舊縮放動畫。
- `npm test`、`npm run check` 通過。新增可選 `tests/browser.test.py`：需 Python Playwright 與 Chromium，先啟動 dev server，再執行 `python3 tests/browser.test.py`；可用 GAME_URL、CHROMIUM_PATH 指定位址／瀏覽器。驗證 1440×900、844×390、667×375 的操作命中、資訊列高度、四分支最終貼圖／146 世界單位寬度、預告、自動接波與第一波；本輪全部通過。未驗證實體 iPhone，未部署。


## 六塔擴充（使用者已確認第一關並要求加入全部守護塔）
- 六塔皆可在第一關選用：弓箭／火焰沿用原玩法，新增冰霜（寒流範圍緩速／每四擊凍結）、雷電（六目標連鎖／高傷兩目標雷擊）、星輝（聚焦蓄能／輝耀射程傷害）、星隕（預告落點後延遲範圍爆炸）。
- 前五塔沿用 Lv.2 選分支、Lv.5 最終型態；星隕只有 Lv.1／Lv.2，無分支。所有上限、型態、圖鑑能力描述由模型資料提供，UI 不複製攻擊規則。
- 冰霜取最強緩速，不相乘；凍結頭目縮短至 0.35 秒。雷電同次不重複命中、每跳保留 80% 傷害。星輝維持鎖定，換目標／升級／離開射程重置蓄能。星隕在發射時決定落點，敵人可走出落點。
- 新增的 17 張外觀裁自既有核准 main-line `968d203` 的 v19 圖集，依原 art-v19.json 座標，保留透明度並輸出 lossless WebP；無重畫。總共 27 型態，最終寬度仍為 146 世界單位，底座錨點不變。
- 六個縮圖在窄橫向畫面完整顯示；點選後才顯示建造費用與數值；圖鑑改為六塔頁籤並保留星隕的兩型態。上方波次控制不隱藏。
- `npm test`、`npm run check` 通過。模型新增六塔進化、冰緩速／凍結及頭目、連鎖衰減／距離、光束鎖定／增傷／重置／暫停、隕石飛行／範圍／移出落點，以及六種塔一起守完八波的測試。
- Chromium `tests/browser.test.py` 通過：11 條升級路線、27 種圖鑑型態、最終貼圖／尺寸、建造／拆除、操作命中與第一波。驗證尺寸 1440×900、844×390、667×375。`tests/browser-combat.test.py` 通過：六塔場景物件、冰狀態、閃電鏈、光束蓄能、各攻擊繪製，無頁面錯誤。
- 測試使用獨立瀏覽器與測試金幣，未改遊戲起始金幣。尚未驗證實體 iPhone；既有八波、六座上限與弓箭／火焰數值保留，新增塔數值為試玩基線，整體平衡待後續。不含其餘關卡、迷宮或正式版存檔。未推送、合併 main 或部署。


## 十二關整批製作
- 已完成四章各三關；每關不同直角路線、8～15 波獨立敵群編排。第一關保留原路線／平台／八波／320 金幣。第二、五、八、十一、十二關有雙入口，敵人交替從入口出現，索敵以剩餘路程排序。
- 八種敵人加入快斥候、護盾巨像、厚血石靈與最終守護龍；護盾先扣再傷生命，頭目凍結時間仍縮短。所有模型判定維持在 model.js，內容在 stages.js。
- 四章以既有森林底圖組合環境色、不同道路邊緣、飄葉／水光／雪／星光及既有橋池、古碑、燈籠素材區分；不是四張全新背景原畫。塔圖、世界尺寸與縮放規則不變。
- 主畫面開始改為章節選關；十二關全開方便試玩。戰鬥選單也能選關，已有進度時確認後才重置。勝利可前往下一關、重玩或回選關；第十二關無不存在的下一關。切關清除世界物件、路線紋理、敵人、塔、特效、舊動畫與延遲回呼，重建對應數量的 DOM 平台點擊區。
- 最佳星數使用專用 `starwish-remake-campaign-v1` 本機鍵；只有通關才寫入，低星或失敗不覆蓋高星；版本／資料驗證、損壞紀錄回退、停用儲存時提示。無中途續玩，不讀寫正式版紀錄。
- `npm test` 包含原六塔測試及新增 campaign.test.cjs。十二關以正常金幣與收入、固定合法建造升級策略完整通關，亦測試十二關無塔失敗；其餘包含路線直角／平台可放置、雙入口／剩餘距離索敵、護盾與最佳星數。
- `tests/browser-campaign.test.py` 在 Chromium 完整跑完十二次模型勝利→結算→下一關，驗證清場、預告、四章選單、1440×900／844×390／667×375、直向暫停／回橫向手動繼續、星數重載／獨立儲存／損壞回退。瀏覽器通關使用測試資金以縮短流程；正常經濟可通關的證據來自模型測試。六塔 browser-combat 測試亦通過。
- 沒有實體 iPhone／Safari 的十二關全流程驗證。整體難度與新增塔數值仍待試玩細調；本輪不加入迷宮、不推送、不合併 main、不部署。原有獨立試玩連結尚未更新到本輪本機程式。

## 第五階段：獨立測試站發布準備
- 使用者已授權進入測試站發布階段；仍不合併 main、不更新正式版。
- 新增 scripts/build-preview.py，產生內容指紋、檔案 SHA-256 清單及 build-info.json，排除 viewport-debug.js，並附可選 Netlify no-cache 標頭。腳本會檢查封裝完整性，不讀憑證、不自動發布。
- 測試站封裝與操作／上線驗證方式記於 PREVIEW-DEPLOY.md。可重新產生內容指紋，避免把舊 HEAD 當成本輪未提交修改的版本號。
- 目前未提供 Sites 部署工具；Netlify／Vercel 等測試站也未注入可用授權，尚未上傳或部署。先等使用者指定服務／提供安全部署入口，或使用已備妥的 ZIP 於獨立測試站手動上傳。
- 使用者已選定 Netlify。已保存部署秘密需求 NETLIFY_AUTH_TOKEN（只允許 api.netlify.com）及 api.netlify.com／*.netlify.app 網路設定草稿；仍需使用者在環境設定填入授權並儲存／發布，當前執行環境尚無 token。
- scripts/deploy-netlify-preview.py 備妥新測試站建立、ZIP 上傳、部署狀態查詢；只重用自己建立的站，不碰正式站。通過語法及缺憑證停止檢查；未執行 Netlify API 部署。具體命令及後續驗證見 PREVIEW-DEPLOY.md。


## GitHub Pages 正式發布授權與準備
- 使用者已改為明確要求直接更新 GitHub Pages 正式站，取代先前只做測試站的限制。目標確認為 https://tmhfred.github.io/star-wish-defense/ ，現有 main / (root) 設定來自原 README，GitHub 頁面亦回傳該 Pages 網址。
- 遠端 main 仍為 968d20321002288d8cb63fdc077c84b527fc56ec，remake 仍為 0bc70bf597c71eec9b552307769cea725418be0a。正式切換應保存舊 main 備份分支；原版資源仍可從該提交回復。
- 封裝腳本新增 --channel github-pages，包含 .nojekyll，排除本機診斷引用。開發內容在 dist；實際 Pages 根目錄需同步封裝檔案，不可只推送 dist 就宣稱已更新網站。
- 已保存 api.github.com 與 tmhfred.github.io 的網路需求草稿（保留既有網路項目），尚未套用到目前執行環境；Netlify token 不再是這次 GitHub Pages 發布的前提。

## GitHub Pages 已完成部署
- 已依使用者明確授權將十二關重製版發布至 https://tmhfred.github.io/star-wish-defense/ 。
- 開發提交：275d501e0f10831f5edf8db910d289f53f9805ad；正式 main 提交：63b96a18d206bb291c349edafb64bcd6f8d26e00。正式根目錄 build-info.json 的 build_id 為 b08aafc3226e40c6，channel 為 github-pages。
- 遠端舊版備份分支 backup/pre-remake-968d203 指向 968d20321002288d8cb63fdc077c84b527fc56ec；另有本機 /tmp/star-wish-preview/main-before-remake-968d203.tar。未 force push。
- GitHub Pages 工作 https://github.com/TMHfred/star-wish-defense/actions/runs/40722869025 已回報 WORKFLOW_RUN_STATUS_COMPLETED / WORKFLOW_RUN_CONCLUSION_SUCCESS。這是部署成功證據，不只 Git push 成功。
- 發布前實際根目錄於 /star-wish-defense/ 子路徑通過十二關瀏覽器回歸；全部檔案 SHA-256 校驗與 .nojekyll 檢查通過。
- 目前執行環境仍未套用 tmhfred.github.io 網路存取，無法直接對正式站做 HTTP／瀏覽器回歸；未宣稱正式站端到端驗證或實體 iPhone 測試已通過。網路需求已保存在設定草稿，待套用後應核對線上 build-info.json 再執行 browser-campaign 測試。
- 已返回 remake 開發分支；未把正式根目錄產物混入該開發分支。後續修改仍在 remake 進行，正式發布須按流程同步根目錄並驗證。

## 手機戰場向下裁切修正
- 使用者提供正式站手機畫面：HUD 在上方，但戰場大部分落在螢幕下方。實體 Safari 的精確觸發條件尚未確認；不能把模擬故障注入視為實機重現。
- 新增 viewport.js，改用手動 Phaser Scale.NONE 尺寸同步，依 document／innerHeight／visualViewport 的可用高度計算可視區；排除轉向期間寬度不符的舊 visualViewport 與 pinch zoom。遊戲 host 不再依賴 Phaser 父元素快取高度，顯式設定可視寬高。
- 監聽 resize、orientationchange、visualViewport resize/scroll、pageshow、focus、visibility restore 及 fullscreenchange，於動畫影格與 100／350ms 後重新量測。畫布、世界轉換與 DOM 平台點擊區一起更新；world 1280×400、塔尺寸、原有地圖 fitting 公式不變。
- tests/browser-viewport.test.py 於 Chromium mobile/touch/DPR3 驗證：初始直向→橫向、注入殘留 768px Phaser／父元素高度、innerHeight 延遲、無 window resize 的 pageshow／focus、反覆直橫向、觸控建塔與戰鬥。橫向尺寸 844×390、852×393、667×375、932×430 通過。未安裝 WebKit，未完成實體 iPhone／Safari 驗證。
- 發布封裝的 JS／CSS URL 改帶檔案內容指紋，避免新 HTML 搭配舊快取 scene.js／style.css；實際檔案與 build-info.json 的校驗值仍一致。


## 補齊核准冰塔素材
- 已拉取並合併遠端 remake 的 6fbcb18（Supply approved ice tower artwork and explicit form mapping），保留本機尚未發布的手機視口修正。已閱讀 ICE-ASSETS.md 與 ICE-ASSETS.json，這兩份文件是冰塔圖片的新依據，取代先前冰塔 v19 裁切素材。
- 直接使用該提交提供的 dist/assets/ice-0.webp 至 ice-4.webp，未裁切、重畫、重新壓縮或以分支圖代替最終型態。五張檔案的 Git blob SHA 與位元組數均吻合 ICE-ASSETS.json。
- 新增 asset-urls.js，所有冰塔預載、商店縮圖、塔資訊頭像與圖鑑使用相同內容版本網址。版本來自核准 manifest 的 Git blob SHA，解決同檔名／同預載鍵仍命中舊 HTTP 快取的問題。scripts/update-ice-assets.py 只驗證圖片與生成 URL 表，不寫入圖片。
- 新增 ice-assets.test.cjs：檢查五張完整檔案雜湊／大小與版本網址；browser-ice-assets.test.py 核對實際 HTTP 回應與 Phaser 解碼像素、五張圖鑑載入、基本→分支→最終兩路線及最終 146 世界單位寬度。
- 上述素材模型／檔案／瀏覽器檢查已通過；圖片原檔未變更。準備與手機視口修正一起同步 GitHub Pages，發布設定維持 main / (root)，不改玩法。

## 手機視口與核准冰塔更新已發布
- 環境恢復後完成正式根目錄的手機回歸測試，通過舊 Phaser／父元素／innerHeight 故障注入、反覆轉向、背景返回、點擊區與觸控建塔。npm test、npm run check、正式根目錄所有檔案雜湊均通過。
- 正式 main 已更新至 92bb068（Publish viewport synchronization and approved ice tower textures）；build-info.json 的 build_id 為 1119d76800eb5868。
- GitHub Pages 工作 https://github.com/TMHfred/star-wish-defense/actions/runs/40726893535 已核對此次提交並回報 COMPLETED / SUCCESS。正式網址維持 https://tmhfred.github.io/star-wish-defense/ 。
- 新版冰塔五張原檔皆直接來自 6fbcb18，根目錄／dist／manifest 的雜湊一致；戰場與圖鑑實際回應、解碼像素及兩條最終進化驗證已通過，沒有從舊圖集裁切。
- 更新前版本已保存遠端 backup/pre-mobile-63b96a1，未 force push。實體 iPhone／Safari 的裁切症狀仍需使用者試玩確認；本環境無 tmhfred.github.io 存取權，未宣稱線上瀏覽器或實體手機測試已通過。
