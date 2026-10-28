# 星之祈願：守護小隊｜重製版星願旅程

四場景十二關的獨立手機橫向守塔遊戲。使用原有核准素材，Phaser 4.2.1 負責場景、素材載入與互動，獨立模型負責波次、移動、索敵、經濟與命中。

## 本次完成
- 四章各三關：花語森林、月溪古道、星霜遺跡、祈願聖域；每關獨立路線與 8～15 波編排。
- 單／雙入口、快敵、護盾、厚血巨像與章末頭目；保留第一關原本路線與八波。
- 章節選關、下一關、重玩及本機最佳星數；全部關卡開放試玩。
- 六種守護塔：弓箭、火焰、冰霜、雷電、星輝、星隕。
- 前五塔在 Lv.2 選分支、Lv.5 最終進化；星隕只有 Lv.1／Lv.2 兩型態、無分支。
- 冰霜減速／凍結、雷電連鎖、星輝持續鎖定增傷、星隕延遲範圍落點。
- 隨時建造、升級、拆除，最多同時 6 座。
- 命中、拋物線火球、升級與金幣回饋；落地陰影、環境飄葉。
- 橫向滿版、安全區、暫停、1×／2×、預設自動接波。
- 圖鑑有實際名稱與可點選的能力資料。
- 手機直向暫停，回到橫向後手動繼續。
- 勝敗、重玩、返回選關／主畫面；音效預設關閉。

## 驗證
`npm test`、`npm run check`

可選瀏覽器回歸：先啟動 `npm run dev`，再執行 `python3 tests/browser.test.py`；`python3 tests/browser-combat.test.py` 另驗證全部攻擊效果；`python3 tests/browser-campaign.test.py` 驗證十二關結算與銜接、四章選單及本機星數。需 Python Playwright 與 Chromium，可用 `GAME_URL`／`CHROMIUM_PATH` 指定本機服務及瀏覽器。測試會以獨立瀏覽器及測試金幣驗證六塔進化、27 種圖鑑型態與橫向控制，不修改實際遊戲起始金幣。

以瀏覽器內嵌視窗驗證 844×390、667×375 與 390×844 直橫向切換；並驗證建造、扣款、分支、暫停及第一波。沒有宣稱使用實體 iPhone 完整通關。十二關完整勝敗流程由模型測試驗證；固定建造策略使用正常起始金幣與收入，可守完全部關卡，不以修改金幣作為模型通關證據。

本版本僅以 `starwish-remake-campaign-v1` 儲存重製版最佳星數，不讀寫正式版存檔。沒有戰鬥中途續玩存檔；瀏覽器停用儲存時仍可遊玩，但重新整理會失去本次紀錄。數值為可通關的試玩基線，完整平衡調整仍待後續。

## Codex 接手
先讀 AGENTS.md 與 HANDOFF.md。`npm run dev` 啟動後開啟 http://localhost:8000 。需 Python 3 與 Node.js 20+，無需 npm install；Phaser 已固定在 vendor。`npm test`、`npm run check` 執行驗證。正式 GitHub Pages 由 main 根目錄發布；需使用者明確授權才更新。開發檔案在 dist，根目錄網站由封裝產生。

## 本機視口診斷
以本機伺服器開啟 `/?viewportDebug`，重現首次載入或連續直橫向切換。
在開發者工具讀取 `window.viewportDebug.samples`，或呼叫
`window.viewportDebug.capture()` 即時記錄。最多保留 120 筆於記憶體，包含
inner/visualViewport、顯示模式、安全區、canvas、Phaser scale、世界位置與上下操作列。
不記錄帳號、存檔或網址，不寫入儲存空間、不傳送資料；重新整理即清除。
僅 localhost／loopback 且帶參數才啟用，正式網域不啟用。

## 十二關內容

| 章節 | 關卡 | 重點 |
| --- | --- | --- |
| 花語森林 | 林間初遇、雙溪之畔、星月花園 | 建塔搭配、雙入口、森林頭目 |
| 月溪古道 | 月溪曲徑、雙月渡口、回聲長橋 | 快敵、長短路線、回折覆蓋 |
| 星霜遺跡 | 霜花回廊、古碑交界、星霜迷廊 | 護盾、巨像、持續輸出 |
| 祈願聖域 | 祈願環庭、星門雙翼、希望之巔 | 密集敵群、雙線防守、最終頭目 |

關卡內容在 `dist/stages.js`；模擬規則、星數判定在 `dist/model.js`。世界大小與塔尺寸維持不變；背景以既有森林基底搭配章節環境色、原有橋池／古碑／燈籠素材和氣氛粒子區分，未新增塔圖。自由迷宮不在本次十二關範圍。

## 正式 GitHub Pages 發布

使用者已於本輪授權將重製版更新到原 GitHub Pages。正式網址為 https://tmhfred.github.io/star-wish-defense/ ，Pages 原設定為 main / (root)。

先在 remake 執行完整測試並提交開發內容，再執行 `python3 scripts/build-preview.py --channel github-pages`。正式封裝會移除本機診斷引用、加入 .nojekyll 及 build-info.json。將封裝內容同步到基於最新 main 並合併 remake 的發布分支根目錄，保留 dist 原始碼。部署前備份舊 main；以一般 fast-forward 推送，遇到遠端更新則重新整合，禁止 force push。上傳提交不等於 Pages 部署成功，仍需核對 GitHub Pages 工作與線上 build-info.json。

重製版保留舊版瀏覽器資料但不讀取或遷移它，沒有自由迷宮與戰鬥中途續玩。這些差異已在使用者指定正式發布前說明。
