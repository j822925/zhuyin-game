# 森林小夥伴・視覺更新

2026-09-12，本機預覽，尚未推送或部署正式版。

## 美術方向

參考 [Nintendo《Animal Crossing》官方網站](https://animalcrossing.nintendo.com/) 的田園島嶼氛圍，採用自然色、圓潤比例、木橋、花葉與溫暖村落。角色是重新創造的動物與精靈，沒有沿用任天堂角色、標誌或遊戲素材。

20 個角色採毛絨、針織、刺繡與柔光質感。每個角色有自己的衣服、配件與主題。月光半睜眼慵懶、雪晶安靜不笑、森林認真、星河驚訝、莓果挑眉俏皮；其他角色保留不同的親切表情。

學生頁延續圖像操作：大角色、開始箭頭、座號、藍橘雙人識別與語音提示，不新增解釋性段落。老師頁保留完整說明。

## 素材與提示詞

- 角色：`assets/characters/cozy-v1/`，20 張獨立 RGBA PNG。
- 島嶼背景：`assets/ui/meadow-v1.png`。
- 生成方式：內建 image_gen；角色每張獨立生成，5 個表情以原圖局部編修，再以內建工具去背。
- 完整生成與修改提示詞：`docs/cozy-prompts.json`。
- 原始生成檔保留於 Codex generated_images，不刪除；專案自含實際使用的全部素材。

## 之後新增角色

1. 把新角色圖片放入 `assets/characters/` 的版本資料夾。
2. 在 `data/characters.json` 新增唯一 `id`、名稱、分類 animal/fairy、圖片路徑、配色、圖示、`starter` 與 `enabled`。
3. 執行 `npm run sync:characters`，自動更新前端清單和後台角色池；再執行 `npm run check:characters` 與測試。
4. 正式開放時同步部署前端與 Apps Script。不要只更新其中一邊。

不要改名或重複使用既有 `id`，以免影響收藏。若暫停抽取，保留角色資料但把 `enabled` 設為 false；原有收藏仍能顯示。角色池依分類選取，不以第 1–10／11–20 筆的位置切分，因此可繼續擴充。

新版外觀沿用原錢包與收藏欄位，不清空既有星星、糖果或角色。
