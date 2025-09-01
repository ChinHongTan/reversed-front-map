# RF-Map: 一款線上戰略遊戲的地圖工具

RF-Map 是一款為線上戰略遊戲「Reversed Front」打造的即時地圖與數據分析工具。它透過 WebSocket 從遊戲伺服器獲取即時數據，並在地圖上以視覺化的方式呈現，幫助玩家更有效地制定戰略。

![地圖截圖](frontend/public/screenshot.png)

## ✨ 主要功能

* **即時地圖**: 以視覺化的方式呈現遊戲中的城市、勢力、聯盟以及它們之間的關係。
* **戰術儀表板**: 玩家可以標記進攻、防禦和優先關注的城市，並在戰術視圖中查看。
* **縮時戰報 (Timelapse)**: 回放過去的戰報，觀察戰局的演變。
* **排行榜**: 查看國家和聯盟的城市數量排名。
* **詳細資訊面板**: 點擊地圖上的城市、國家或聯盟，即可查看詳細資訊。
* **路徑規劃**: 玩家可以在地圖上規劃自訂路線。

## 🛠️ 技術棧

* **前端**:
    * React
    * TypeScript
    * Leaflet.js (地圖)
    * d3-delaunay (Voronoi 圖)
    * Vite
* **後端**:
    * Node.js
    * Express
    * WebSocket (ws)
    * MongoDB (Mongoose)
    * Phoenix (用於連接遊戲伺服器)

## 🚀 快速開始

### 前置需求

* Node.js (v18 或更高版本)
* MongoDB / [Docker](https://www.docker.com/products/docker-desktop/) (推薦，用於運行本地資料庫)
* Reversed Front的帳號

### 後端設定

**關於資料庫設定 (可選)**:
    * 本專案使用 MongoDB 來儲存「縮時戰報」的資料。如果您不需要此功能，**可以跳過此步驟**。
    * 如果您想啟用此功能，有兩種方式設定 MongoDB：
        1.  **使用 Docker (建議)**: 在專案根目錄執行 `docker-compose up -d`，即可啟動一個本地的 MongoDB 實例。
        2.  **使用您自己的 MongoDB**: 將您的 MongoDB 連線字串填入 `.env` 檔案中。

1.  進入 `backend` 目錄:
    ```bash
    cd backend
    ```
2.  安裝依賴:
    ```bash
    npm install
    ```
3.  建立一個 `.env` 檔案，並填入以下內容:
    ```
    # 遊戲伺服器 API
    GAME_API_HOST=api.komisureiya.com
    GAME_API_KEY=rfront2023

    # 您的遊戲帳號
    GAME_EMAIL=your_email@example.com
    GAME_PASSWORD=your_password

    # MongoDB 連線字串
    MONGODB_URI=mongodb://localhost:27017/rf-map

    # 伺服器運行的埠號
    PORT=3001
    ```
4.  啟動後端伺服器:
    ```bash
    npm run dev
    ```

### 前端設定

1.  進入 `frontend` 目錄:
    ```bash
    cd frontend
    ```
2.  安裝依賴:
    ```bash
    npm install
    ```
3.  建立一個 `.env` 檔案，並填入後端伺服器的 URL:
    ```
    VITE_BACKEND_BASE_URL=localhost:3001
    ```
4.  啟動前端開發伺服器:
    ```bash
    npm start
    ```
現在，您應該可以在瀏覽器中打開 `http://localhost:5173` 來查看應用程式了。

## 🤝 如何貢獻

歡迎您為這個專案做出貢獻！您可以透過以下方式參與：

* **提報問題 (Issues)**: 如果您發現了任何錯誤或有功能建議，請隨時建立一個 issue。
* **提交拉取請求 (Pull Requests)**: 如果您想直接為這個專案貢獻程式碼，請 fork 這個儲存庫，然後提交一個 pull request。

## 📄 授權條款

本專案採用 [MIT](LICENSE) 授權條款。