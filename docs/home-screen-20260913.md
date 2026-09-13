# iPad 主畫面啟動

- 名稱沿用既有「注音探險島」，圖示為抱著 ㄅ 的棉花兔，與遊戲首頁一致。
- 新增 manifest：standalone、相對 scope/id、正式首頁 start_url；沒有 demo 或學生識別資料。landscape 是偏好，不保證能覆蓋 iPad 的方向鎖定。
- Apple 專用 180px 不透明 PNG、192/512px manifest 圖示、Apple standalone/title/status-bar metadata；保留安全區、縮放與系統操作，不呼叫或強求全螢幕 API。
- 沒有新增 Service Worker 或離線快取；登入、題庫設定、成績仍需網路。獨立 App 啟動不等於鎖定 iPad；系統時間／電量／Home 指示條或視窗模式仍由 iPadOS 控制。
- install.html 為老師安裝指引，老師專區加入入口。學生應將正式遊戲首頁加入主畫面，不是將安裝教學或老師試玩加入。
- 不改密碼、權限、星星、成績與 Google 後台。

## 圖示製作

使用內建 image_gen，非 CLI/API 備援。既有 rabbit.png 僅作為角色／材質參考，生成一張新的主畫面圖示。完整提示詞見 icon-prompt-20260913.txt。

- 原始圖：assets/icons/bunny-master-v1.png
- iPad 圖示：assets/icons/apple-touch-icon-v1.png
- 通用圖示：assets/icons/icon-192-v1.png、assets/icons/icon-512-v1.png
- tools/export-app-icons.ps1 僅做尺寸轉換與 RGB 輸出，不重新繪製角色。

## 驗證

自動測試檢查 standalone / Apple metadata、正式啟動路徑與 scope、PNG 真實尺寸及不透明性、指南連結與安全提醒。桌面瀏覽器可檢查 metadata 與介面，但不能冒充實體 iPad 的「加入主畫面」驗收。

56 項測試通過。已檢查 180px 圖示、教學頁外觀及 1024×768 橫向遊戲首頁，兔子圖示可辨識且關卡版面沒有溢出。未安裝到任何實體 iPad。

參考：
- https://support.apple.com/zh-tw/guide/ipad/ipad8f1f7a29/ipados
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/

98355d9 已上傳 GitHub 主分支，啟動正式網站發布；安裝入口為 /zhuyin-game/?v=20260913-home1，教學頁為 /zhuyin-game/install.html。

發布完成：269dac1 的 GitHub Pages run 34734300353 為 success；正式教學頁可開啟，正式首頁 DOM 已確認 Apple standalone=yes、manifest 與兔子 apple-touch-icon 路徑。實體 iPad 的系統安裝流程尚未驗收，交付說明已明示此限制。
