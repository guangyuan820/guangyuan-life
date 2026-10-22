光緣 GUANGYUAN LIFE V2 — Cloudinary 封面直接上傳升級
更新日期：2026-10-22

這是「差異升級包」，不是完整網站，也不是舊的 R2 套件。
只有下列 5 個程式檔案，會覆蓋原專案的同名檔案：
- public/apply.html（新增照片選擇與預覽，仍允許填網址）
- public/apply.js（新增，表單一次送出照片與品牌資料）
- public/privacy.html（說明圖片會傳至 Cloudinary 及公開網址風險）
- functions/api/apply.js（保留 Turnstile、原本 D1 欄位與審核流程）
- functions/_lib/cloudinary.js（新增，僅後端呼叫 Cloudinary 簽名上傳）

本版不改資料庫 schema、不改管理後台、不改公開品牌 API。
新增上傳照片為「選填」，JPG、PNG、WebP，最多 3,000,000 bytes。
照片在申請提交時一起傳到光緣的 /api/apply，成功驗證 Turnstile、品牌資料及 IP 速率限制後，後端才上傳 Cloudinary。
照片網址會存在原本的 brands.cover_url，核准後公開展示。
注意 Cloudinary 的一般 public 圖片 URL 一旦被知道即能讀取，即使品牌仍待審，也不是完全私有的存取控制。請勿上傳敏感圖像。
注意 Cloudinary 圖片上傳成功、但 D1 儲存失敗時，可能產生未被品牌引用的孤兒圖片，需定期人工清理。

你先前已在 Cloudflare Pages Production 設定：
CLOUDINARY_CLOUD_NAME (Text)
CLOUDINARY_API_KEY (Secret)
CLOUDINARY_API_SECRET (Secret)
Cloudinary Upload preset 必須為 guangyuan-brand-cover，Signing mode Signed。
請不要把金鑰或 .dev.vars 放入 GitHub。Cloudflare Pages 的新變數應確認被新的 Production 部署採用。

【安裝方式（Mac）】
1. 先不要動目前 Cloudflare 上線版本。請在 GitHub Desktop 選 guangyuan-life / main，並確認沒有其他尚未提交的修改。
2. 在 GitHub Desktop：Repository -> Show in Finder，確認專案是 ~/Documents/GitHub/guangyuan-life。
3. 將此 ZIP 下載至 Mac「下載項目」後，開啟終端機，執行以下三行：
   cd ~/Documents/GitHub/guangyuan-life
   unzip -o ~/Downloads/guangyuan-v2-cloudinary-patch.zip
   git status --short
   (重要：一定要先 cd 到光緣專案再解壓，不然可能覆蓋別的資料夾)
4. 預期只看見以上 5 個檔案變動。先不要 Push。
5. 先在本機用 Wrangler 啟動網站、測試申請表照片預覽。Cloudinary 真正的上傳測試需要為本機配置金鑰（不要上傳金鑰），或在正式環境使用明確標示的測試品牌驗收。建議先審查程式修改內容及備份。
6. 成功測試後在 GitHub Desktop commit，Push origin。Cloudflare Pages 會觸發 Production 部署。
7. 在正式網站用不含私人資料的自有圖片填寫一筆測試品牌申請，確認待審；核准後首頁出現照片，最後拒絕或下架。進入 Cloudinary 後台刪除不需要的測試圖片。

【回復原狀】
若發現問題，可透過 GitHub Desktop revert 本次新增的 commit 再 Push，原始 D1 資料不會因此被刪除。

【重要】
圖片上傳 API 的 backend secrets 永遠不能貼到前端或傳給別人。
這是已通過 Node 語法檢查及模擬 API 測試的升級版本，尚未在使用者的 Cloudflare/Cloudinary 真實帳號實測。切勿宣稱目前線上功能已啟用。
