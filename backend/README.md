# RF-Map 後端服務

本服務是 RF-Map 的後端，主要負責：
1.  連接到遊戲「Reversed Front」的 Phoenix WebSocket 伺服器，以接收即時遊戲數據。
2.  處理和儲存來自遊戲的數據，特別是「縮時戰報」所需的事件。
3.  透過自己的 WebSocket 伺服器，將處理過的即時數據廣播給前端客戶端。
4.  提供一個 Express API，用於提供一些非即時的數據（例如，聯盟、國家的詳細資訊和歷史戰報）。

## 檔案結構概覽
/backend
├── src/
│   ├── data/              # 存放靜態數據，如城市間的路徑和城市的 NPC/獎勵資訊
│   ├── services/
│   │   ├── database.ts    # 處理 MongoDB 連線
│   │   └── phoenixService.ts # 核心服務，負責連接和處理來自遊戲伺服器的數據
│   ├── types/             # 定義 TypeScript 的數據類型
│   │   ├── index.ts       # 主要的遊戲數據類型 (City, Nation, Union)
│   │   └── timelapse.ts   # 縮時戰報相關的 Mongoose Schema 和類型
│   └── server.ts          # 應用程式的進入點，設定 Express 和 WebSocket 伺服器
├── package.json
└── tsconfig.json


## 核心邏輯

### Phoenix 服務 (`phoenixService.ts`)

這是後端的「心臟」。它會使用環境變數中設定的遊戲帳號和密碼登入，並維持一個與遊戲伺服器的長連線。

* **`startPhoenixConnection()`**: 登入並初始化 WebSocket 連線。
* **`handlePhoenixUpdate()`**: 監聽來自遊戲的 `update_data` 事件，處理數據的變化（例如，城市的控制權變更），並將這些變化儲存到記憶體中。
* **`logTimelapseEvent()`**: 當城市的控制權變更時，如果設定了 MongoDB，這個函數會將事件記錄到資料庫中，供縮時戰報功能使用。

### WebSocket & API 伺服器 (`server.ts`)

* **WebSocket Server**: 當有新的前端客戶端連接時，伺服器會立即將當前所有的地圖數據（城市、勢力、路徑等）發送給它。之後，每當 `phoenixService` 收到數據更新，`server.ts` 會透過 `broadcastToClients` 函數將這些「增量更新 (delta update)」廣播給所有連接的前端客戶端。
* **Express API**: 提供一些隨需 (on-demand) 的數據請求，例如獲取特定聯盟的詳細成員列表，或查詢可用的縮時戰報日期。

## 如何貢獻

如果您想為後端做出貢獻，可以從以下幾個方面著手：
* 優化數據處理的效能。
* 新增更多的 API 端點來提供更豐富的數據。
* 完善錯誤處理和日誌記錄。