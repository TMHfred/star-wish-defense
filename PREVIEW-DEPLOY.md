# 獨立測試站發布

只發布 `remake` 的測試站。不合併 main、不改正式 GitHub Pages，也不從此工作區操作舊 Sites 部署。

## 產生可驗證的封裝

```bash
python3 scripts/build-preview.py
```

輸出位於 `/tmp/star-wish-preview`。ZIP 根目錄就是網站根目錄，含 index.html、全部本地素材、Phaser、build-info.json。封裝會排除本機視口診斷，不包含 Git 或任何授權資訊。build_id 由實際檔案內容決定，不使用尚未包含本輪修改的舊 Git 提交冒充部署版本。腳本不執行上傳或發布。

## Netlify 獨立測試站（可選）

1. 登入 https://app.netlify.com/drop 。
2. 解壓 ZIP，將含有 index.html 的整個資料夾拖入 Drop，建立新的獨立測試站。
3. 記下服務實際回傳的 HTTPS 網址。不要自行推測網址，也不要覆蓋既有正式站。
4. 開啟該網址的 `/build-info.json`，核對 build_id 與封裝輸出一致。

如要由代理透過服務 API 自動部署，需先指定測試站服務並在環境設定提供該服務的部署授權及必要網路目的地。不要在對話或專案檔案中放入 token。目前沒有注入可用的測試站授權；Git 的讀取權限不代表網站部署權限。

## 上線後驗證

- 首頁及素材無 HTTP 錯誤，build-info.json 的 build_id 正確。
- 四章各三關、六塔縮圖、升級外觀、怪物預告、開始波次可用。
- 切關後塔、敵人、動畫、波次和金幣重置；第十二關結束沒有第十三關。
- 本機最佳星數可於同一網站重載保留，不讀寫正式版紀錄。離線 HTML 與 HTTPS 測試站屬於不同來源，不會共享紀錄。
- 瀏覽器回歸可使用 `GAME_URL=https://實際測試站/ python3 tests/browser-campaign.test.py`。這會在獨立瀏覽器中用測試資金跑完流程，不代表人工難度或實體手機驗證。
- 實體手機另測首次載入、橫向操作、安全區、連續轉向及八至十五波實際手感。

部署回報須分開列出：封裝已驗證、是否已上傳、服務是否部署成功、線上驗證是否通過。沒有服務回傳的成功結果及實際網址時，不得宣稱網站已發布。

## 已選定 Netlify：代理自動部署

已在環境設定草稿新增 `NETLIFY_AUTH_TOKEN` 秘密需求，僅供 `api.netlify.com` 使用；測試頁驗證需允許 `*.netlify.app`。請在環境設定安全填入 Netlify personal access token，儲存設定並依介面發布環境。不要把 token 貼到聊天中。草稿儲存不等於授權已注入目前執行環境。

取得有效授權後，從專案目錄執行（將 archive 換成實際封裝路徑）：

```bash
python3 scripts/deploy-netlify-preview.py /tmp/star-wish-preview/star-wish-preview-b08aafc3226e40c6.zip
python3 scripts/deploy-netlify-preview.py --status
```

腳本首次只建立新的獨立測試站，後續僅重用 `/tmp/star-wish-preview/netlify-state.json` 記錄的該站；不接受任意正式站 ID。部署狀態到 `ready` 才回傳 HTTPS 測試網址。仍須核對線上 build-info.json 與跑線上遊戲驗證。現在只驗證了腳本語法與缺憑證時不送請求的保護，尚未執行實際 Netlify API 部署。
