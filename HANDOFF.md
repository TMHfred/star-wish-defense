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

## 第一階段：建造操作、目標優先與六塔基本特效

- 開發分支 `remake/phase-one-combat`，基於本次環境既有 `92bb068`；只修改 dist 開發入口與文件／測試，根目錄正式網站未同步，未推送、合併或部署。
- 空平台改成帶石縫、厚度、接地陰影與少量苔色的石底座，不再畫加號；點選有金色提示，六塔預覽使用核准原圖與同一世界座標／射程。預覽、建造時隱藏空底座；取消或拆除還原，確認前不扣款，資源不足停用確認並顯示紅色預覽。
- 模型新增每塔 targetMode 與 setTargetMode：預設最前方，可選最高目前生命／最近，平手依剩餘路程與敵人 ID；升級保留設定，已發射攻擊不重選。星輝保持鎖定，改變設定或重新鎖定時蓄能歸零；雷電設定只影響首個目標，後續仍依距離連鎖。
- 操作列新增目標設定入口與目前模式；在小橫向尺寸隱藏重複名稱／統計，保留縮圖、進化、目標、能力與拆除按鈕。修正 Phaser 平台接收到 DOM 對話框點擊而改選底下平台的穿透問題。
- 基本特效補強箭光與命中點、火球弧線尾焰／爆點、冰晶彈與碎片／腳底霜紋／凍結輪廓、雷電主擊粗細與連鎖節點、星輝蓄能光芯及傳遞光點、星隕準確落點預告與撞擊。追蹤單體攻擊的命中特效使用目標當下位置；範圍攻擊仍使用原落點。未變更核准圖片、傷害、攻速或經濟。
- 戰場選單有標準／精簡特效，短暫物件總上限 144／48，切換會清理超額物件；系統 reduced motion 也採精簡效果。這不代表已完成實機效能測量。
- 通過 `npm test`（含新增每塔索敵、雙路線／平手、光束重置、連鎖首選與命中座標測試）、`npm run check`、`python3 tests/browser-combat.test.py`、`python3 tests/browser-phase-one.test.py`、`GAME_URL=http://127.0.0.1:8000/ python3 tests/browser-viewport.test.py`。原十二關正常經濟通關測試仍通過。
- 操作列驗證 Chromium 1440×900、844×390、667×375，含基本／最終進化；觸控與視口恢復另驗證 844×390、852×393、667×375、932×430 及對應直向切換。無頁面錯誤；不是實體 iPhone／Safari 測試。
- 本階段不含獨立挑戰星、永久解鎖、星隕試煉、祝福、分裂史萊姆或主頁重構。下一階段依討論處理進度與獎勵，開始前需定案既有玩家資格。

## 第二階段基礎與使用者指定新主頁

- 第二階段已先加入十二關特殊挑戰草案、三項目標的模型查詢，以及拆除／同時塔數／減速擊敗／連鎖／凍結／各塔擊敗數等實際事件計數。新增模型測試通過，尚未接入新星數存檔、永久解鎖或關卡準備 UI。特殊挑戰仍需進一步驗證可達成性與解鎖順序。
- 既有玩家「保留六塔與全部型態」或「保留六塔、最終型態重新解鎖」的偏好已向使用者提出，尚未收到答覆。依賴這項決策的舊存檔遷移／使用資格變更尚未執行；現行 v1 最佳星數仍可讀取。
- 使用者指定主頁改為分享連結中的星光森林圖，隨後直接附圖。已依 create-game-assets／game-ui-ux 保存規範，以 image_gen 清除六個圖內按鈕並補回石台；生成原檔留在 /workspace/generated_images，匯入 `dist/assets/home-forest.png`，由 HOME-ASSET.json 記錄來源、尺寸與 SHA-256。
- 新主頁使用實際 HTML 控制項，包含開始、繼續、玩法、圖鑑、公告與設定。繼續優先恢復同分頁未結束戰鬥；重載後有星數則開啟下一個未通關章節的選關，沒有紀錄時停用。音效與特效設定只套用本分頁。
- 已完整讀取 references 下的 tower-defense、game-ui-ux、phaser-core、create-game-assets、game-feel 五份規範副本；沒有宣稱已安裝遠端完整 Skill 套件。
- 最終主頁通過 `python3 tests/browser-home.test.py`：1440×900、844×390、667×375 六按鈕位置／至少 44px 命中、背景尺寸／載入、說明／圖鑑／公告／設定、分頁戰鬥續玩及重載後選關皆通過，無頁面或資源錯誤。`npm test`、`npm run check` 與封裝校驗通過。未部署正式站，未驗證實體 iPhone／Safari。

## 第二階段完成規則：使用者決定全員重新開始

- 使用者明確指示「不用考慮舊玩家，全部重新」，因此取消原遷移／既有資格方案，使用獨立 `starwish-journey-v2`。舊 v1 鍵不讀取、不刪除；新版一律從第一關與弓箭塔開始。
- 三顆星以 goals 的三個布林值獨立保存，stars 由 goals 推導；通關、結算至少 80% 生命、每關固定特殊挑戰均需通關才取得。跨次按位累積，失敗不扣。readProgress 嚴格清理無效欄位／未取得卻被裝備的獎勵，舊版本回到空進度。
- 新玩家關卡依序開放，火焰／冰霜／雷電／星輝分別在第一／二／四／六關通關後開放。最終型態需 6／9／12／18／24／30 星，模型同時強制塔資格及型態門檻。星隕仍需第九關後試煉；下一階段尚未實作試煉，不能以星數直接取得星隕。
- 選關卡後先顯示準備頁（路線、敵人預告、三顆星、塔資格），明確開始才重置戰鬥。戰場選單可暫停查看目前挑戰狀態；結算分別顯示本次星位、累積星與新獎勵。
- 旅程獎勵可選用城堡配色（原圖 tint，12／24 星）及稱號（6／18／30／36 星），選擇持久化，無永久攻擊加成。README 記錄完整門檻。
- 新進度下最終波兩頭目原本相隔 2.5 秒，改為 20 秒分批抵達，避免將生命星建立在尚未取得的星隕上。測試證明各關通關、生命星與特殊挑戰均可使用當時合法塔組與正常收入，在分次重玩中取得；未修改塔傷害、價格、起始金幣或護盾判定。
- 新增 tests/journey-fixture.cjs 與 tests/progression.test.cjs，納入 npm test。原模型／十二關／素材測試仍保留；新的正常經濟測試另外使用完整解鎖限制。測試輔助碼無法注入正式遊戲。
- 瀏覽器機制／素材／視口測試改以明確的全解鎖分頁 fixture 測試原功能；browser-home 與 browser-campaign 仍使用真正空白旅程驗證新玩家流程。所有 stage 點選流程都接上 beginStage 準備確認。
- 第二階段最終驗證：npm test／npm run check／git diff --check 通過。browser-campaign 通過完整十二關 UI 流程、獨立星位 ★☆★／★★☆、跨次補齊、失敗保留、獎勵配色／稱號保存與儲存異常；browser-phase-one 回歸通過。browser-home 另驗證新版準備頁在 1440×900、844×390、667×375 初次開啟時三項挑戰及固定開始／返回均可見且可點選。
- 可檢視 /tmp/journey-preparation-667.png；已生成並校驗測試包 /tmp/star-wish-new-journey/star-wish-preview-58aadd5ace999a9d.zip。以上為本機／Chromium 模擬證據，未部署正式網站，未進行實體 iPhone／Safari 測試。

## 第三階段：星隕試煉、本局祝福與分裂史萊姆

- 依使用者「執行」授權完成三項。延續 v2 旅程資料，不重設第二階段成果；十二關與其三顆星維持原結構，試煉是獨立 `meteor-trial`，不新增／刷取星數。
- 通關第九關後可從選關或旅程獎勵進入三波試煉。固定借用 Lv.1 星隕祭壇、花費零、不可拆除／升級，不占兩座冰霜支援塔名額；450 金幣、支援最高 Lv.2。快速幻影速度 180、正常隕石延遲 0.85 秒，需六次冰霜＋隕石配合命中且守住三波才成功。trialWon 只有在目標達成且九關已通過時由結算保存，失敗不扣資格，最終型態仍需 30 星。
- 本局祝福固定於一般關卡第 3／6 波後各提供一次。三選一或明確略過，模型時間／下一波與 UI 一起鎖定；不能以 Escape 或關閉按鈕誤略過。五種類型：弓箭間隔 ×0.9（2 層）、射程 +5%（2 層）、100 金幣（2 次）、減速 +0.5 秒（1 層）、修復 4 生命（1 次）。選項依資格／生命／層數篩選，每局最多兩選，重玩／換關清除；試煉不提供祝福。加成由 Game.stats 統一供攻擊、射程圈與選塔資訊使用。
- 分裂史萊姆自第三關開始分散加入部分波次。母體用現有史萊姆素材以較大尺寸、色調與雙點標記區別，子體較小，生成後淡入／有分裂回饋；沒有重畫或變更核准塔圖。母體死亡排入待生成清單，當次攻擊後才產生兩子體，沿同一路線以 ±18 世界距離散開並限制於路線內，避免身體永遠重疊。子體不再分裂，整組金幣固定 12，母體漏怪不生成子體，子體未清空不會結算波次。
- 新增 tests/phase-three.test.cjs 納入 npm test，涵蓋試煉門檻、保護祭壇、正常資源勝敗／教學目標／永久解鎖、子體路線與時序／不遞迴／固定獎金、祝福暫停／非法選擇／疊加／略過／修復與重玩隔離。原有正常經濟十二關與各星目標測試仍通過；journey fixture 明確略過祝福，沒有關閉正式機制。
- browser-phase-three 使用九關通關的瀏覽器進度 fixture 進入試煉，戰鬥本身正常金幣／合法支援升級，並驗證解鎖重載、一般關卡建造星隕、三種尺寸的祝福與 Esc 防誤關、修復／重玩清除，以及子體呈現。browser-campaign 也回歸完整十二關／解鎖／補星／儲存流程，模擬迴圈會明確略過祝福。
- 第三階段最終驗證：npm test（五組 Node 測試）／npm run check／git diff --check 通過；browser-phase-three 通過 1440×900、844×390、667×375 試煉與祝福操作、正常試煉資源／永久解鎖、暫停／Esc 防誤關、修復／重玩清除與分裂呈現；browser-campaign 回歸完整十二關／補星／裝備／儲存流程通過。這些為 Chromium 模擬，未做實體 iPhone／Safari 測試。
- 截圖：/tmp/meteor-trial-ready.png、/tmp/meteor-trial-result.png、/tmp/blessing-three-choices.png、/tmp/split-slime-children.png。已封裝並校驗 /tmp/star-wish-phase-three/star-wish-preview-d03bb391eb810e55.zip；未推送、合併或部署正式網站。
- 後續第四階段仍包含漸進教學、波間續玩存檔、失敗提示、音效整合與實機效能／Safari 驗證，不能將第三階段完成視為這些項目已完成。

## 本輪正式發布授權與驗證

- 使用者明確要求「發布」，目標沿用既有 https://tmhfred.github.io/star-wish-defense/，GitHub Pages 來源為 main 根目錄。
- 發布前遠端 main 為 92bb068377cc5837d82378d739cd4e110f084a73；已建立 /tmp/star-wish-production/main-before-92bb068.tar 完整舊版封存，並準備遠端 backup/pre-journey-v2-92bb068 備份分支。以一般 fast-forward 推送，不 force push。
- 正式封裝 build_id=d03bb391eb810e55，channel=github-pages，包含 .nojekyll、內容指紋 JS/CSS 與 SHA-256 清單，移除 viewport-debug 引用。封裝在本機 /star-wish-defense/ 子路徑通過 browser-home、browser-phase-three、browser-campaign；npm test／npm run check／git diff --check 亦通過。
- 本次網站採 v2 全員從零旅程；無中途戰鬥存檔，未做實體 iPhone／Safari 驗證。發布包含目前三階段與使用者指定主頁，第四階段仍另列待辦。
- 當前環境可讀 GitHub Actions HTML；tmhfred.github.io 與 api.github.com 請求遭代理 CONNECT 403。已將兩網域保存至環境設定草稿；草稿不代表執行環境已套用。部署成功需核對對應提交的 Pages 工作，正式站 build-info.json 的直接驗證另受此限制。

## 本輪正式部署結果

- 正式 main：708a2312e0909b229caddeb4249926188e14fff7，build_id=d03bb391eb810e55。GitHub Pages 工作 https://github.com/TMHfred/star-wish-defense/actions/runs/40900471999 對應此提交，已回報 Status Success，總耗時 33 秒，deploy 工作 13 秒；回傳正式網址 https://tmhfred.github.io/star-wish-defense/ 。
- 遠端 backup/pre-journey-v2-92bb068 已建立，指向原 main 92bb068。備份與 remake 的第一次原子推送因遠端有額外交接紀錄而拒絕，但同批發布指令未中止，main 先更新；已立即補建獨立備份，並將遠端原有紀錄與本輪內容合併保留，沒有 force push。
- 開發內容提交 06ba8c0；目前開發工作分支改名為 journey-v2-development，追蹤 origin/remake，避免本地 remake/ 子分支名稱與既有遠端 remake 名稱衝突。正式根目錄產物保留於 release/journey-v2／遠端 main。
- GitHub Actions 成功是部署證據；目前政策未允許正式站 HTTP，尚未完成線上 build-info.json／瀏覽器端到端驗證。所需 api.github.com、tmhfred.github.io 已保存環境草稿，需在環境設定檢閱儲存、發布雲端環境後才可套用。

## 手機畫質、森林介面與遺跡活化整合

- 本輪使用者在討論三項後明確指示「執行」，範圍為整合開發及預覽；本輪沒有新增正式發布指示。仍在 journey-v2-development 工作分支，根目錄正式產物、main 與遠端皆未變更。
- 已以 Chromium DPR 3／844×390 實測原版畫布仍為 844×390，game.config.resolution 未存在。Phaser 4.2.1 不採用舊的 GameConfig.resolution，因此原本設定沒有增加實際像素。
- viewport.js 改用實際 drawing buffer、Scale.NONE 的 display zoom 與 CSS 寬高同步；高密度上限 2，額外渲染約 300 萬像素預算，原生 CSS 面積更大時不降到低於 1。CSS 與 DOM 世界座標維持不變，相機使用 X／Y 實際像素比，明確同步 displayScale，避免大螢幕預算產生的小數取整影響顯示或輸入。DPR 3／844×390 現在為 1688×780 畫布。debug 記錄補入 buffer／density；正式封裝仍排除 debug。
- 保留原素材 bytes、世界 1280×400、塔尺寸與 fitting；地圖原始 forest.webp 僅 887×443，提高畫布像素不能補回原圖不存在的細節。精簡特效只減少效果，不降低地圖／塔解析度；沒有宣稱實機耗電、發熱或幀率改善。
- 全介面延伸指定主頁的森林綠、象牙白、暖金。HUD 波次數字改為下一波預告入口，自動接波移入預告，備戰顯示開始、戰鬥顯示暫停／繼續；速度與選單保留。暫停選單為本場摘要、兩欄六入口、次要離場操作、固定繼續守護；音效／特效收進設定。手機短高度面板保留安全區與捲動；準備頁三項挑戰及底部開始／返回仍可見。
- 空平台以程序圖形加入固定種子細節：風化石面、裂紋、缺角、青苔、草、接地陰影。點選疊加暖金星紋；半透明選塔預覽、取消不扣款與射程共用模型維持。確認後空底座隱藏，原塔圖的完整底座呈現新生，另加 600ms 地面活化／修復星光，精簡或 reduced-motion 180ms。建造立即生效，不等待動畫；活化使用實際場景時間，暫停時也會結束。拆除恢復風化平台。移除原建造縮小彈出以避免暫停時卡在縮小狀態。
- 新增 tests/browser-mobile-polish.test.py，含 DPR 1／2／3 真實 buffer、CSS／相機／輸入比例、四種尺寸 HUD 間距與選單可達性、原生 Phaser 觸控、低特效不降解析度、取消／暫停建造／活化結束／拆除／接波設定。更新原 browser-viewport、browser-phase-one、browser.test 的畫布和新設定入口預期。
- 已通過 npm test（五組模型／旅程／素材測試）、npm run check、git diff --check；browser-home、browser-viewport、browser-phase-one、browser-phase-three 通過。涵蓋主頁與續玩、準備頁三挑戰、直橫向故障恢復、建造索敵、試煉／祝福與分裂呈現。這些為 Chromium 模擬，並非實體 iPhone／Safari 測試。
- 最終整合驗證：browser-mobile-polish 通過 DPR 1／2／3、844×390／667×375／932×430／1440×900，含實際 drawing buffer、CSS／相機對齊、原生 Phaser 觸控、暫停建造與活化結束、拆除與接波設定。最後選單排版另以完整按鈕邊界 smoke 驗證 667／844／1440，六個手札入口與三個離場操作均初次可見、整顆可點，固定繼續／關閉可達；包含大畫面非整數倍率的 displayScale 校驗，無頁面錯誤。
- 交付預覽包：/workspace/star-wish-defense-preview/star-wish-preview-e4eabd83e077cbd6.zip，build_id=e4eabd83e077cbd6，61 個封裝檔案，已逐檔 SHA-256 校驗。預覽圖 battle-844.png、pause-667.png／pause-844.png／pause-1440.png、relic-selected.png／relic-awakened.png 及 render-report.json／final-smoke.json 同放該目錄。啟動方式見 README.txt。
- 本輪未 Git push、未更新 main 或正式 GitHub Pages；旅程存檔鍵及遊戲數值未變更。完整手機幀率、耗電、發熱與實體 Safari 驗證仍未完成。

## 手機優化正式發布授權

- 使用者明確要求「發布更新」，本輪將已交付的手機畫質、森林介面、風化平台與活化回饋發布至原網址 https://tmhfred.github.io/star-wish-defense/ 。未將後續討論的自動存檔、教學或音效等待辦混入本次發布。
- 正式封裝與核准預覽的 build_id 相同：e4eabd83e077cbd6。channel 為 github-pages，61 個檔案、.nojekyll、內容指紋 JS/CSS 與逐檔 SHA-256 驗證通過；正式包在 /workspace/star-wish-mobile-production/star-wish-github-pages-e4eabd83e077cbd6.zip。
- 最新遠端 main 基準為 708a2312e0909b229caddeb4249926188e14fff7。本機完整封存 /workspace/star-wish-mobile-production/main-before-708a231.tar，SHA-256=07cac442cccec352c328fd072c2b1bcb435a5154666f5d620c295a350d37df82。發布必須先建立並核對遠端 backup/pre-mobile-polish-708a231，再更新 main，禁止 force push。
- 發布前再次通過 npm test、npm run check、git diff --check；正式封裝內容與預覽一致，不改旅程存檔鍵、素材或遊戲數值。實機幀率／耗電／Safari 仍未驗證；目前執行環境網路政策仍未允許正式 Pages 網域，部署結果須由對應提交的 Actions 工作確認，不能宣稱已完成直接線上端到端驗證。
- 已先完成遠端備份並以 ls-remote 核對：backup/pre-mobile-polish-708a231 指向 708a2312e0909b229caddeb4249926188e14fff7。主分支更新必須在正式封裝互動回歸通過後進行。
