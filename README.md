# 光緣共好生活聚落・第一版

全新獨立的「生活品牌資訊探索平台」。消費者可依八大分類、縣市、關鍵字查詢品牌；店家提交申請後，必須經光緣管理者審核才會刊登。除光緣官方外，平台僅展示店家資訊及外部聯絡連結，不處理其他品牌的購物、付款、預約及售後。

## 已完成頁面

| 路徑 | 用途 |
|---|---|
| `/` | 網站首頁、分類、搜尋、地區篩選、品牌詳細介紹彈窗 |
| `/apply.html` | 店家提交品牌申請 |
| `/admin.html` | 管理者登入、查看待審/上架/未通過清單、核准/拒絕/恢復待審 |
| `/privacy.html` | 隱私與刊登說明（正式上線前應完善） |

## 技術

- GitHub：版控與 Cloudflare Git 自動部署
- Cloudflare Pages：靜態網站及 Pages Functions API
- Cloudflare D1：品牌與申請資料；使用 SQL prepared statements
- 原生 HTML/CSS/JS：無需前端框架或複雜建置
- 管理端：高強度密碼登入、HMAC 簽署的 8 小時 HttpOnly/Secure/SameSite Cookie；登入密碼僅儲存在 Cloudflare Secret 中

**注意**：此 MVP 為小流量初期版本。正式公開受理申請前，應加上 Cloudflare Turnstile、WAF 登入/API 速率限制，以及視情況採用 Cloudflare Access 或多管理員身分驗證；隱私政策需完善個資告知。不要以目前的密碼機制作為長期大型後台的唯一保護。

## 上線步驟（選 GitHub 整合，非 Drag & Drop）

1. 建立全新的 GitHub repository，例如 `guangyuan-life`，將**專案資料夾內的檔案**上傳至 repository 根目錄（`public/`、`functions/`、`schema.sql` 等）。
2. 登入 Cloudflare → **Workers & Pages** → 建立 **Pages** 專案 → 連結該 GitHub repository。
   - Framework preset：None
   - Build command：留空
   - Build output directory：`public`
   - Root directory：repository 根目錄
3. Cloudflare → D1 → **Create database**，名稱例如 `guangyuan-life-db`。
4. 在專案 **Settings → Bindings → Add → D1 database**，binding 名稱填 **`DB`**（大小寫相同），選剛建立的資料庫；重新部署後生效。官方說明：https://developers.cloudflare.com/pages/functions/bindings/
5. 在 Cloudflare D1 Console 貼入 `schema.sql` 內容執行。或用 Wrangler：
   ```bash
   npx wrangler d1 execute guangyuan-life-db --remote --file=schema.sql
   ```
6. 在 Pages 專案的 **Settings → Variables and Secrets** 設定兩個**加密 Secrets**（Production 和需要的 Preview 環境分別設置）：
   - `ADMIN_PASSWORD`：自訂長且唯一的高強度密碼
   - `ADMIN_SECRET`：至少 32 字元的隨機字串，用於簽署管理 Cookie
   - **不要把任何密碼或金鑰寫入 GitHub、`public/` 或 README。**
7. 重新部署，開啟 `https://你的專案.pages.dev`。先執行選用的 `seed.sql`（D1 Console）即可展示光緣官方範例；其他店家由 `/apply.html` 申請，再前往 `/admin.html` 核准。
8. 驗證審核流程：提交測試 → 管理登入查看 pending → 核准 → 首頁看到店家 → 拒絕或恢復待審 → 首頁不顯示。確認後再邀請真正店家申請。

官方 GitHub 整合及 Pages Functions 說明：https://developers.cloudflare.com/pages/functions/get-started/

## 本機執行（選用）

需要 Node.js / npm 與 Wrangler。專案根目錄執行：

```bash
npm install
cp .dev.vars.example .dev.vars  # 修改成自己的強密碼與隨機金鑰
npx wrangler pages dev public --d1 DB=<YOUR_D1_DATABASE_ID>
```

如果本機 D1 尚未建立資料表，可使用 Wrangler 的 local D1 初始化：

```bash
npx wrangler d1 execute guangyuan-life-db --local --file=schema.sql
```

本機較建議再新增 `wrangler.jsonc` 的 D1 binding，使 DB ID 一致；也可直接在 Cloudflare 遠端完成第一次整合。不要把 `.dev.vars` 提交到 GitHub。

## 品牌資料欄位

`id` UUID、`name` 品牌名、`category` 八大分類、`city`/`district` 地區、`description` 故事簡介、`services` 服務項目、`cover_url` 圖片連結、`website` 官網、`instagram`、`line_url`、`phone`、`address` 公開資訊、`contact_name`/`contact_email` 私人申請聯絡資料、`status`（pending/published/rejected）、`is_guangyuan`、`consent`、建立與修改時間。

公開 `/api/brands` **不回傳**私人聯絡資料，且僅公開 `published` 品牌。後台修改刊登狀態需要有效登入。

## 第一版限制與下一步

- 暫未實作管理者編輯店家內容、圖片上傳、會員、自動通知、信箱驗證；店家送件後如需修改，可由管理者在 D1 Console 中處理，或下一版增加「編輯資料」後台。
- 外部圖片需由品牌提供具公開存取權及使用授權的 URL。上線時建議使用雲端物件儲存及圖像最佳化。
- 沒有顧客站內購物車；**光緣自有商品**也只是連至官方 LINE 訂購，與現有官方接單流程一致。
- 為防濫用，請啟用 Cloudflare WAF、Turnstile 並配置合理速率限制。高流量前務必先完成。
- 正式發布前，請將站點隱私告知、資料保存期限、個資權利行使方式與網站經營者資訊補齊。

## 自訂品牌視覺

調整 `public/style.css` 的色系與文字；首頁內容在 `public/index.html`，分類與品牌卡功能在 `public/main.js`。目前以奶白、香檳金、木質灰棕色為視覺風格。
