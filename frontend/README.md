# RF-Map 前端應用程式

本應用程式是 RF-Map 的使用者介面，使用 React 和 Vite 建立。它透過 WebSocket 從後端接收即時數據，並使用 Leaflet.js 將其呈現在一個互動式地圖上。

## 檔案結構概覽

/frontend
├── public/                              # 靜態資源，如地圖圖片和圖示
└── src/
├── components/                          # 主要的 React 元件
│   ├── Map/                             # 地圖相關元件，如地圖本身和城市標記
│   ├── InfoPanel/                       # 用於顯示城市、國家、聯盟詳細資訊的面板
│   ├── Ranking/                         # 排行榜面板
│   └── Timelapse/                       # 縮時戰報視圖和控制項
├── context/                             # React Context 用於全域狀態管理
│   ├── MapContext.tsx                   # 儲存和管理從後端接收到的核心地圖數據
│   └── UserInteractionContext.tsx       # 管理使用者的互動狀態，如當前選擇的城市
├── services/                            # 處理與後端的通訊
│   ├── socketService.ts                 # 管理與後端的 WebSocket 連線
│   └── apiService.ts                    # 呼叫後端 REST API 的函數
├── App.tsx                              # 應用程式的主元件，負責組合所有元件和視圖
└── index.tsx                            # 應用程式的進入點


## 狀態管理 (State Management)

本專案主要使用 React Context 來進行全域狀態管理，主要分為幾個部分：

* **`MapContext`**: 作為數據的「單一來源 (Single Source of Truth)」。`socketService` 會將從後端收到的數據更新到 `MapContext` 中。所有需要顯示地圖數據的元件都會從這裡讀取資料。
* **`UserInteractionContext`**: 處理所有與使用者互動相關的狀態，例如使用者點擊了哪個城市、是否正在規劃路線等。這將 UI 互動的邏輯與地圖數據本身分離開來。
* **`UIViewContext`**: 控制 UI 元件的顯示和隱藏，例如哪個面板是可見的、是否處於「縮時戰報」模式等。
* **`SearchContext`**: 管理搜尋框的狀態、搜尋結果和歷史紀錄。

## 數據流 (Data Flow)

1.  **啟動**: 應用程式啟動時，`socketService` 會嘗試與後端建立 WebSocket 連線。
2.  **接收初始數據**: 連線成功後，後端會將所有初始的地圖數據 (城市、路徑、國家等) 推送過來。`MapContext` 會接收這些數據並更新其 state。
3.  **渲染**: 各個元件從 `MapContext` 中獲取數據並進行渲染。
4.  **即時更新**: 當遊戲數據發生變化時，後端會推送一個 `delta_update` 事件。`MapContext` 會根據這個事件的內容，更新對應的城市、聯盟或國家數據，從而觸發 UI 的重新渲染。

## 如何貢獻

如果您想為前端做出貢獻，可以從以下幾個方面著手：
* 優化地圖的渲染效能。
* 新增或改進 UI 元件，提升使用者體驗。
* 修復現有的 bug 或響應式設計問題。
* 為元件增加單元測試。