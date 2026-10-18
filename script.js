
const $ = (id) => document.getElementById(id);

const state = {
  photoFound: false,
  photoDone: false,
  notebook: false,
  messageDone: false,
  circuitDone: false,
  selectedTile: null,
  tiles: [],
  logs: ["[03:14] 系統啟動"]
};

// 建立一張有明確物件與連續線條的實驗室照片
// 使用 SVG，所以不需要另外放圖片檔案
const photoSVG = `
<svg xmlns="http://www.w3.org/2000/svg"
     width="900" height="900" viewBox="0 0 900 900">
  <defs>
    <linearGradient id="wall" x2="1" y2="1">
      <stop stop-color="#345a72"/>
      <stop offset="1" stop-color="#122338"/>
    </linearGradient>
    <linearGradient id="screen" x2="0" y2="1">
      <stop stop-color="#16758e"/>
      <stop offset="1" stop-color="#081c2d"/>
    </linearGradient>
  </defs>

  <rect width="900" height="900" fill="url(#wall)"/>
  <path d="M0 600 L900 600 L900 900 L0 900Z"
        fill="#1a3040"/>
  <path d="M0 600 L900 600" stroke="#7a9cb0"
        stroke-width="12"/>
  <path d="M150 0V600 M750 0V600"
        stroke="#53798c" stroke-width="9"/>

  <!-- 左側實驗室窗戶 -->
  <rect x="65" y="100" width="290" height="360"
        fill="#0c1b30" stroke="#8bb5c4" stroke-width="16"/>
  <path d="M210 100V460 M65 280H355"
        stroke="#8bb5c4" stroke-width="12"/>
  <path d="M95 390L145 300L180 335L240 230L320 350"
        fill="none" stroke="#44b9df" stroke-width="7"/>
  <circle cx="280" cy="170" r="28" fill="#b5eaff"/>

  <!-- 右側時鐘 -->
  <circle cx="715" cy="195" r="105"
          fill="#102536" stroke="#b5e8ed" stroke-width="16"/>
  <circle cx="715" cy="195" r="9" fill="#f5fbff"/>
  <path d="M715 195L715 132 M715 195L770 220"
        stroke="#f3f7fa" stroke-width="10"
        stroke-linecap="round"/>
  <text x="715" y="335" text-anchor="middle"
        fill="#d9f8ff" font-size="38"
        font-family="monospace">10:15</text>

  <!-- 桌面：橫跨照片下半部 -->
  <path d="M60 640H840L900 720H0Z"
        fill="#527184" stroke="#9cc3d0" stroke-width="12"/>
  <path d="M100 720V900 M800 720V900"
        stroke="#203f52" stroke-width="40"/>

  <!-- 中央電腦 -->
  <rect x="350" y="310" width="290" height="250" rx="12"
        fill="#081725" stroke="#a2bfc9" stroke-width="19"/>
  <rect x="375" y="337" width="240" height="190"
        fill="url(#screen)"/>
  <path d="M410 380H580 M410 405H550 M410 430H565"
        stroke="#68d9ed" stroke-width="7"/>
  <text x="495" y="482" text-anchor="middle"
        fill="#d6ffff" font-size="29"
        font-family="monospace">SYS-04</text>
  <path d="M495 560V625 M440 625H550"
        stroke="#a0bbc8" stroke-width="18"/>

  <!-- 左側杯子 -->
  <path d="M180 560H260L248 640H192Z"
        fill="#d1e6e9" stroke="#f5ffff" stroke-width="7"/>
  <path d="M260 575Q315 575 285 620H253"
        fill="none" stroke="#f5ffff" stroke-width="10"/>

  <!-- 右側第二個杯子 -->
  <path d="M700 560H770L760 640H710Z"
        fill="#8fb2c4" stroke="#c8e8ed" stroke-width="7"/>

  <!-- 桌面識別卡 -->
  <rect x="350" y="748" width="210" height="90" rx="8"
        fill="#e3edf0" stroke="#4f8ca2" stroke-width="8"/>
  <text x="455" y="780" text-anchor="middle"
        font-size="20" fill="#26475b"
        font-family="monospace">ACCESS CODE</text>
  <text x="455" y="821" text-anchor="middle"
        font-size="40" font-weight="bold"
        fill="#0b3c54" font-family="monospace">2416</text>

  <!-- 影像資料註記 -->
  <text x="25" y="45" fill="#c4eaf2"
        font-size="24" font-family="monospace">
    CAM-07 / ARCHIVE FRAME
  </text>
  <text x="875" y="875" text-anchor="end"
        fill="#a4c9d4" font-size="20"
        font-family="monospace">REC 08:41:58</text>
</svg>
`;

const photoURL =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(photoSVG);

function addLog(message) {
  state.logs.unshift(message);
  state.logs = state.logs.slice(0, 7);
  updateUI();
}

function updateUI() {
  const inventory = [];
  if (state.photoFound) inventory.push("◈ 損毀影像 IMG_001");
  if (state.photoDone) inventory.push("◈ 修復照片");
  if (state.notebook) inventory.push("◈ 記事本");
  if (state.circuitDone) inventory.push("◈ 錄音紀錄");

  $("inventory").innerHTML =
    inventory.length ? inventory.join("<br>") : "尚未取得物品";

  $("logs").innerHTML = state.logs.join("<br>");

  const count =
    Number(state.photoDone) +
    Number(state.messageDone) +
    Number(state.circuitDone);

  $("progressBar").style.width = `${count / 3 * 100}%`;
  $("progressText").textContent = `已恢復 ${count} / 3 項資料`;
}

function openModal(title, html) {
  $("modalTitle").textContent = title;
  $("modalContent").innerHTML = html;
  $("modal").classList.remove("hidden");
}

function closeModal() {
  $("modal").classList.add("hidden");
}

$("closeModal").addEventListener("click", closeModal);

$("startBtn").addEventListener("click", () => {
  $("intro").classList.add("hidden");
  $("game").classList.remove("hidden");
  addLog("[03:15] 偵測到未知使用者");
});

document.querySelectorAll(".object").forEach((object) => {
  object.addEventListener("click", () => {
    inspect(object.dataset.object);
  });
});

function inspect(name) {
  switch (name) {
    case "clock":
      openModal("OBJECT ANALYSIS / OBJ-001", `
        <div class="data-box">
          STATUS: STOPPED<br>
          DISPLAY: 10:15<br>
          POWER: OFFLINE<br>
          ERROR: TIMESTAMP MISMATCH
        </div>
        <p>牆上的時鐘停在 10:15，但系統紀錄顯示的時間更早。</p>
      `);
      break;

    case "shelf":
      if (!state.photoFound) {
        state.photoFound = true;
        addLog("[03:16] 發現損毀影像檔");
      }
      openModal("ARCHIVE / BOOKSHELF", `
        <div class="data-box">
          FILE: IMG_001<br>
          TYPE: IMAGE<br>
          INTEGRITY: 32%<br>
          STATUS: CORRUPTED
        </div>
        <p class="success">已取得損毀影像檔。</p>
        <p>可前往電腦的 IMAGE RECOVERY 程式進行修復。</p>
        <button class="action" onclick="openComputer()">
          前往電腦 →
        </button>
      `);
      break;

    case "computer":
      openComputer();
      break;

    case "drawer":
      if (!state.photoDone) {
        openModal("STORAGE_03", `
          <p class="warning">ACCESS DENIED</p>
          <p>抽屜需要四位數密碼。</p>
          <p>提示：密碼可能藏在損毀的影像裡。</p>
        `);
      } else if (!state.notebook) {
        showDrawerCode();
      } else {
        openModal("STORAGE_03", `
          <p>抽屜已開啟，裡面的記事本已被取走。</p>
        `);
      }
      break;

    case "door":
      if (state.photoDone &&
          state.messageDone &&
          state.circuitDone) {
        openModal("EXIT / ACCESS GRANTED", `
          <p class="success">三項資料已恢復。</p>
          <div class="data-box">
            EXIT PROTOCOL READY<br>
            USER IDENTITY: UNVERIFIED<br>
            NEXT SECTOR: UNKNOWN
          </div>
          <p>門鎖解除。你走向門口，螢幕卻突然顯示：</p>
          <p>「這不是你第一次離開這個房間。」</p>
          <button class="action" onclick="showEnding()">
            開啟門 →
          </button>
        `);
      } else {
        openModal("EXIT / ACCESS DENIED", `
          <p class="warning">電子門鎖尚未解除。</p>
          <div class="data-box">
            IMAGE RECOVERY:
            ${state.photoDone ? "COMPLETE" : "PENDING"}<br>
            MESSAGE TRACE:
            ${state.messageDone ? "COMPLETE" : "PENDING"}<br>
            CIRCUIT CONTROL:
            ${state.circuitDone ? "COMPLETE" : "PENDING"}
          </div>
        `);
      }
      break;
  }
}

function openComputer() {
  openModal("UNKNOWN OS / DESKTOP", `
    <div class="data-box">
      UNKNOWN OS v0.4<br>
      USER: UNREGISTERED<br>
      CONNECTION: LOCAL ONLY
    </div>
    <div class="app-grid">
      <button class="app-tile" onclick="openFiles()">
        ◈ FILE EXPLORER<br><small>瀏覽檔案</small>
      </button>
      <button class="app-tile" onclick="openPhotoGame()">
        ◈ IMAGE RECOVERY<br><small>修復損毀影像</small>
      </button>
      <button class="app-tile" onclick="openMessageGame()">
        ◈ MESSAGE TRACE<br><small>重建訊息</small>
      </button>
      <button class="app-tile" onclick="openCircuitGame()">
        ◈ CIRCUIT CONTROL<br><small>修復控制線路</small>
      </button>
    </div>
  `);
}

function openFiles() {
  openModal("FILE EXPLORER", `
    <div class="data-box">
      /ARCHIVE/<br>
      ├─ IMG_001
      [${state.photoFound ? "FOUND" : "LOCKED"}]<br>
      ├─ MESSAGE_02
      [${state.notebook ? "FOUND" : "LOCKED"}]<br>
      └─ CIRCUIT_SYS
      [${state.messageDone ? "READY" : "LOCKED"}]
    </div>
    <button class="action secondary" onclick="openComputer()">
      返回桌面
    </button>
  `);
}

// ================================
// 照片修復小遊戲
// ================================

// 0~8 只作為程式內部位置，不顯示在拼圖上
const correctOrder = [0, 1, 2, 3, 4, 5, 6, 7, 8];

function shuffleTiles() {
  // 從已完成的拼圖開始洗牌，保證有明確的完成狀態
  const arr = [...correctOrder];

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  // 避免一開始就剛好完成
  if (arr.every((v, i) => v === i)) {
    [arr[0], arr[1]] = [arr[1], arr[0]];
  }

  state.tiles = arr;
  state.selectedTile = null;
}

function openPhotoGame() {
  if (!state.photoFound) {
    openModal("IMAGE RECOVERY", `
      <p class="warning">FILE NOT FOUND</p>
      <p>請先在房間中找到損毀的影像檔。</p>
      <button class="action secondary" onclick="openComputer()">
        返回桌面
      </button>
    `);
    return;
  }

  if (state.photoDone) {
    showRepairedPhoto();
    return;
  }

  if (state.tiles.length !== 9) {
    shuffleTiles();
  }

  renderPhotoGame();
}

function renderPhotoGame() {
  openModal("IMAGE RECOVERY / IMG_001", `
    <p class="eyebrow">IMAGE INTEGRITY: 32%</p>
    <h3>影像碎片重組</h3>
    <p>點擊一塊碎片，再點擊另一塊交換位置。</p>
    <p>觀察窗框、牆壁、桌面和物件邊緣，將影像拼回原狀。</p>

    <div id="puzzleGrid" class="puzzle-grid"></div>

    <div class="puzzle-tools">
      <button class="action secondary" onclick="shuffleAndRender()">
        重新打亂
      </button>
      <button class="action secondary" onclick="openComputer()">
        返回桌面
      </button>
    </div>
    <p id="puzzleStatus" class="muted">
      SELECT TWO FRAGMENTS TO SWAP
    </p>
  `);

  const grid = $("puzzleGrid");

  state.tiles.forEach((piece, position) => {
    const tile = document.createElement("button");
    tile.className = "puzzle-tile";
    tile.type = "button";
    tile.setAttribute("aria-label", `拼圖位置 ${position + 1}`);

    // 根據碎片原始位置，顯示大圖的九分之一
    const col = piece % 3;
    const row = Math.floor(piece / 3);

    tile.style.backgroundImage = `url("${photoURL}")`;
    tile.style.backgroundPosition =
      `${col * 50}% ${row * 50}%`;

    if (state.selectedTile === position) {
      tile.classList.add("selected");
    }

    tile.addEventListener("click", () => {
      selectPuzzleTile(position);
    });

    grid.appendChild(tile);
  });
}

function selectPuzzleTile(position) {
  if (state.selectedTile === null) {
    state.selectedTile = position;
    renderPhotoGame();
    return;
  }

  if (state.selectedTile === position) {
    state.selectedTile = null;
    renderPhotoGame();
    return;
  }

  const first = state.selectedTile;

  [state.tiles[first], state.tiles[position]] =
    [state.tiles[position], state.tiles[first]];

  state.selectedTile = null;

  const solved = state.tiles.every(
    (piece, index) => piece === correctOrder[index]
  );

  if (solved) {
    state.photoDone = true;
    addLog("[03:18] IMG_001 影像修復成功");
    showRepairedPhoto();
  } else {
    renderPhotoGame();
  }
}

function shuffleAndRender() {
  shuffleTiles();
  renderPhotoGame();
}

function showRepairedPhoto() {
  openModal("IMAGE RECOVERY / COMPLETE", `
    <p class="success">✓ IMAGE RESTORED / INTEGRITY 100%</p>

    <img class="photo-preview" src="${photoURL}"
         alt="修復完成的未來實驗室照片">

    <div class="data-box">
      FILE: IMG_001<br>
      CAMERA: CAM-07<br>
      TIMESTAMP: 08:41:58<br>
      ANOMALY: TWO OBJECTS DETECTED
    </div>

    <p>照片顯示一間實驗室。桌上有兩個杯子，
    但出入紀錄只登記了一名使用者。</p>

    <p>你注意到桌面上的識別卡，似乎寫著一組密碼。</p>

    <p class="success">新目標：調查房間中的抽屜。</p>

    <button class="action" onclick="closeModal()">
      返回房間
    </button>
  `);
}

// ================================
// 抽屜密碼
// ================================

function showDrawerCode() {
  openModal("STORAGE_03 / PASSWORD REQUIRED", `
    <p>請輸入四位數密碼。</p>
    <p class="muted">提示：查看修復後照片中的桌面識別卡。</p>
    <input id="drawerPassword" type="text"
           inputmode="numeric" maxlength="4"
           placeholder="0000">
    <button class="action" onclick="checkDrawerCode()">
      確認
    </button>
    <p id="passwordResult"></p>
  `);
}

function checkDrawerCode() {
  const value = $("drawerPassword").value.trim();

  if (value === "2416") {
    state.notebook = true;
    addLog("[03:20] STORAGE_03 已解鎖");

    openModal("STORAGE_03 / UNLOCKED", `
      <p class="success">ACCESS GRANTED</p>
      <p>抽屜裡有一本舊記事本。</p>
      <div class="data-box">
        08:42 — 我收到一則還沒被傳送的訊息。<br>
        08:43 — 系統說我已經做出選擇。<br>
        08:44 — 可是我還沒開始。
      </div>
      <p>已解鎖電腦中的 MESSAGE TRACE。</p>
      <button class="action" onclick="openComputer()">
        返回電腦
      </button>
    `);
  } else {
    $("passwordResult").textContent = "密碼錯誤，請重新確認照片。";
    $("passwordResult").className = "warning";
  }
}

// ================================
// 訊息追蹤小遊戲
// ================================

const messages = [
  "08:40｜系統開始初始化",
  "08:41｜偵測到未知登入",
  "08:42｜使用者行為已被預測",
  "08:43｜記憶資料發生衝突",
  "08:44｜啟動資料隔離程序",
  "08:45｜封鎖出口"
];

let messageOrder = [];

function openMessageGame() {
  if (!state.notebook) {
    openModal("MESSAGE TRACE", `
      <p class="warning">ACCESS LOCKED</p>
      <p>需要先取得抽屜裡的記事本。</p>
      <button class="action secondary" onclick="openComputer()">
        返回桌面
      </button>
    `);
    return;
  }

  if (state.messageDone) {
    openModal("MESSAGE TRACE / COMPLETE", `
      <p class="success">訊息重建完成。</p>
      <p>系統在使用者做出行動之前，就已經留下預測紀錄。</p>
      <p>已解鎖 CIRCUIT CONTROL。</p>
      <button class="action" onclick="openComputer()">
        返回桌面
      </button>
    `);
    return;
  }

  messageOrder = [3, 0, 5, 1, 4, 2];
  renderMessages();
}

function renderMessages() {
  openModal("MESSAGE TRACE / SORT", `
    <p>點擊訊息，依照時間由早到晚重建紀錄。</p>
    <div id="messageList"></div>
    <p id="messageProgress" class="muted">
      已選取 0 / 6 則
    </p>
    <button class="action secondary" onclick="openMessageGame()">
      重新開始
    </button>
  `);

  const list = $("messageList");

  messageOrder.forEach((id) => {
    const button = document.createElement("button");
    button.className = "app-tile";
    button.style.display = "block";
    button.style.width = "100%";
    button.style.marginBottom = "8px";
    button.textContent = messages[id];
    button.addEventListener("click", () => selectMessage(id));
    list.appendChild(button);
  });
}

let selectedMessages = [];

function selectMessage(id) {
  if (selectedMessages.includes(id)) return;

  selectedMessages.push(id);

  const expected = selectedMessages.length - 1;

  if (id !== expected) {
    selectedMessages = [];
    $("messageProgress").textContent =
      "順序錯誤，已重置。請由最早的時間開始。";
    return;
  }

  const button = [...$("messageList").children].find(
    (el) => el.textContent === messages[id]
  );

  if (button) {
    button.disabled = true;
    button.style.opacity = ".35";
  }

  if (selectedMessages.length === 6) {
    state.messageDone = true;
    selectedMessages = [];
    addLog("[03:22] MESSAGE TRACE 已完成");
    openMessageGame();
  } else {
    $("messageProgress").textContent =
      `已選取 ${selectedMessages.length} / 6 則`;
  }
}

// ================================
// 電路控制小遊戲
// ================================

let circuitStates = [];

function openCircuitGame() {
  if (!state.messageDone) {
    openModal("CIRCUIT CONTROL", `
      <p class="warning">ACCESS LOCKED</p>
      <p>請先完成 MESSAGE TRACE。</p>
      <button class="action secondary" onclick="openComputer()">
        返回桌面
      </button>
    `);
    return;
  }

  if (state.circuitDone) {
    openModal("CIRCUIT CONTROL / COMPLETE", `
      <p class="success">電路已恢復供電。</p>
      <p>出口安全鎖已解除。</p>
      <button class="action" onclick="closeModal()">
        返回房間
      </button>
    `);
    return;
  }

  if (circuitStates.length === 0) {
    circuitStates = [0, 1, 2, 0, 2, 1, 2, 0, 2];
  }

  renderCircuit();
}

function renderCircuit() {
  openModal("CIRCUIT CONTROL / REPAIR", `
    <p>點擊節點旋轉線路，讓所有導線呈垂直方向。</p>
    <div id="circuitGrid" class="puzzle-grid"></div>
    <button class="action secondary" onclick="resetCircuit()">
      重置電路
    </button>
  `);

  const symbols = ["─", "│", "┼"];
  const grid = $("circuitGrid");

  circuitStates.forEach((value, index) => {
    const button = document.createElement("button");
    button.className = "app-tile";
    button.style.fontSize = "42px";
    button.style.textAlign = "center";
    button.style.padding = "0";
    button.textContent = symbols[value];

    button.addEventListener("click", () => {
      circuitStates[index] = (circuitStates[index] + 1) % 3;

      if (circuitStates.every((v) => v === 1)) {
        state.circuitDone = true;
        addLog("[03:25] CIRCUIT CONTROL 已恢復");
        openCircuitGame();
      } else {
        renderCircuit();
      }
    });

    grid.appendChild(button);
  });
}

function resetCircuit() {
  circuitStates = [];
  openCircuitGame();
}

// ================================
// 結局
// ================================

function showEnding() {
  openModal("UNKNOWN SYSTEM / END", `
    <p class="eyebrow">PROTOCOL 000 / EXECUTED</p>
    <h2>你已經來過這裡。</h2>

    <div class="data-box">
      PREVIOUS SESSION: FOUND<br>
      USER ID: 000<br>
      LAST EXIT: 08:45<br>
      CURRENT SESSION: REPEATED
    </div>

    <p>門後不是走廊，而是另一間完全相同的房間。</p>
    <p>裡面的電腦正在顯示你剛才的一舉一動。</p>
    <p>螢幕上出現一行字：</p>

    <h3>「下一次，你會做出不同的選擇嗎？」</h3>

    <button class="action" onclick="location.reload()">
      重新開始
    </button>
  `);
}

updateUI();
