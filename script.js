/* =========================================
   PROJECT ZERO
   零號觀測者 - Game Logic
========================================= */

const $ = (selector) => document.querySelector(selector);

const state = {
    evidence: {},
    solved: {},
    visited: {},
    energyNodes: [false, false, false, false, false, false, false, false, false],
    selectedTile: null,
    draggedSignal: null,
    currentApp: "desktop",
    gameEnded: false
};

const evidenceData = {
    clock: {
        title: "TIME DISCREPANCY",
        description: "實體時鐘比系統紀錄慢了 11 分鐘。"
    },
    card: {
        title: "IDENTITY RECORD",
        description: "識別卡的持有人資料與正式人員名單不符。"
    },
    monitor: {
        title: "RECOVERED FOOTAGE",
        description: "監視畫面顯示，在你進入設施之前，房間裡已經有人操作過終端機。"
    },
    archive: {
        title: "MIRROR PROJECT",
        description: "研究計畫涉及人類意識模擬，部分核心資料遭到封鎖。"
    },
    signal: {
        title: "UNKNOWN TRANSMISSION",
        description: "訊號來自設施內部，但來源裝置不存在於設備清單。"
    },
    energy: {
        title: "POWER RESTORED",
        description: "能源系統已恢復，取得通往核心資料的權限。"
    },
    memory: {
        title: "MEMORY ANOMALY",
        description: "你的身分資料建立於三天前，早於本次任務。"
    },
    final: {
        title: "PROJECT ZERO",
        description: "實驗紀錄顯示，觀測對象可能就是目前的使用者。"
    }
};

const signalOrder = [
    "SIG-01 // CONNECTION ESTABLISHED",
    "SIG-02 // SUBJECT DETECTED",
    "SIG-03 // MEMORY RESET FAILED",
    "SIG-04 // SESSION REPEATED"
];

/* =========================================
   初始化
========================================= */

function init() {
    updateClock();
    setInterval(updateClock, 1000);

    $("#closeModal").addEventListener("click", closeModal);
    $("#closeComputer").addEventListener("click", closeComputer);

    $("#investigationModal").addEventListener("click", (event) => {
        if (event.target.id === "investigationModal") closeModal();
    });

    $("#computerOverlay").addEventListener("click", (event) => {
        if (event.target.id === "computerOverlay") closeComputer();
    });

    document.querySelectorAll(".room-object").forEach((object) => {
        object.addEventListener("click", () => {
            inspectObject(object.dataset.object);
        });

        object.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inspectObject(object.dataset.object);
            }
        });
    });

    document.querySelectorAll(".app-button").forEach((button) => {
        button.addEventListener("click", () => {
            openApp(button.dataset.app);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeModal();
            closeComputer();
        }
    });

    addLog("09:42:00", "Facility connection established.");
    addLog("09:42:03", "Unknown user detected.");
    updateInterface();
}

function updateClock() {
    const now = new Date();

    $("#clock").textContent = now.toLocaleTimeString("en-GB", {
        hour12: false
    });
}

/* =========================================
   共用介面
========================================= */

function showModal(title, kicker, content, actions = []) {
    $("#modalTitle").textContent = title;
    $("#modalKicker").textContent = kicker;
    $("#modalContent").innerHTML = content;

    const actionArea = $("#modalActions");
    actionArea.replaceChildren();

    actions.forEach((action) => {
        const button = document.createElement("button");
        button.className = `action-button ${action.primary ? "primary" : ""}`;
        button.textContent = action.label;
        button.disabled = Boolean(action.disabled);

        button.addEventListener("click", action.onClick);
        actionArea.appendChild(button);
    });

    $("#investigationModal").classList.add("show");
}

function closeModal() {
    $("#investigationModal").classList.remove("show");
}

function openComputer(app = "desktop") {
    $("#computerOverlay").classList.add("show");
    openApp(app);
}

function closeComputer() {
    $("#computerOverlay").classList.remove("show");
}

function addLog(time, message) {
    const entry = document.createElement("div");
    entry.className = "log-entry";

    const timeElement = document.createElement("time");
    timeElement.textContent = time;

    const messageElement = document.createElement("span");
    messageElement.textContent = message;

    entry.append(timeElement, messageElement);
    $("#logList").prepend(entry);
}

function addEvidence(key) {
    if (state.evidence[key]) return;

    state.evidence[key] = true;

    const item = evidenceData[key];

    if (item) {
        addLog(
            new Date().toLocaleTimeString("en-GB", { hour12: false }),
            `DATA ACQUIRED: ${item.title}`
        );
    }

    updateInterface();
}

function updateInterface() {
    const count = Object.keys(state.evidence).length;

    $("#evidenceCount").textContent = String(count).padStart(2, "0");

    const list = $("#evidenceList");
    list.replaceChildren();

    if (count === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        empty.textContent = "NO DATA COLLECTED";
        list.appendChild(empty);
    } else {
        Object.entries(state.evidence).forEach(([key]) => {
            const data = evidenceData[key];
            if (!data) return;

            const item = document.createElement("div");
            item.className = "evidence-item";

            const title = document.createElement("strong");
            title.textContent = data.title;

            const description = document.createElement("span");
            description.textContent = data.description;

            item.append(title, description);
            list.appendChild(item);
        });
    }

    const completed = [
        state.evidence.clock,
        state.evidence.card,
        state.solved.image,
        state.solved.signal,
        state.solved.system
    ].filter(Boolean).length;

    $("#progressBar").style.width = `${completed / 5 * 100}%`;
    $("#progressText").textContent = `${completed} / 5 INVESTIGATION DATA`;

    if (!state.evidence.clock) {
        setObjective("調查設施異常", "檢查電子時鐘與識別卡，確認設施的基本狀況。");
    } else if (!state.evidence.card) {
        setObjective("取得身分資料", "調查桌上的識別卡，確認目前的使用者身分。");
    } else if (!state.solved.image) {
        setObjective("修復監視紀錄", "開啟終端機，嘗試修復損毀的影像。");
    } else if (!state.solved.signal) {
        setObjective("分析未知訊號", "排列訊號片段，找出異常傳輸的內容。");
    } else if (!state.solved.system) {
        setObjective("恢復能源系統", "完成能源節點連線，解鎖核心資料。");
    } else if (!state.evidence.final) {
        setObjective("調查實驗核心", "檢查記憶資料，找出 PROJECT ZERO 的真相。");
    } else {
        setObjective("選擇你的結局", "調查已進入最後階段。前往出口決定設施的命運。");
    }

    if (state.solved.system) {
        $("#environmentStatus").textContent = "POWER RESTORED";
        $("#doorIndicator").textContent = "READY";
        $("#doorIndicator").style.color = "var(--success)";
    }

    if (state.evidence.final) {
        $("#connectionStatus").textContent = "SIMULATION: ACTIVE";
    }
}

function setObjective(title, description) {
    $("#objectiveTitle").textContent = title;
    $("#objectiveText").textContent = description;
}

/* =========================================
   房間物件調查
========================================= */

function inspectObject(object) {
    if (state.gameEnded) return;

    switch (object) {
        case "clock":
            inspectClock();
            break;
        case "card":
            inspectCard();
            break;
        case "monitor":
            inspectMonitor();
            break;
        case "computer":
            openComputer();
            break;
        case "energy":
            inspectEnergy();
            break;
        case "door":
            inspectDoor();
            break;
    }
}

function inspectClock() {
    const content = `
        <div class="data-box">
            OBJECT ID : TIME-UNIT-01<br>
            LOCAL TIME : <span class="highlight">09:42</span><br>
            SYSTEM TIME : <span class="highlight">09:53</span><br>
            STATUS : DISCREPANCY DETECTED
        </div>
        <p>電子時鐘的時間比系統紀錄慢了 11 分鐘。設備沒有故障，但時間同步功能已被停用。</p>
    `;

    showModal("電子時鐘", "OBJECT ANALYSIS / TIME-UNIT-01", content, [
        {
            label: "讀取異常紀錄",
            primary: true,
            onClick: () => {
                addEvidence("clock");
                closeModal();
            }
        },
        { label: "返回", onClick: closeModal }
    ]);
}

function inspectCard() {
    const content = `
        <div class="data-box">
            CARD TYPE : RESEARCH ACCESS<br>
            USER ID : <span class="highlight">000</span><br>
            NAME : [REDACTED]<br>
            CREATED : 3 DAYS AGO<br>
            ACCESS : RESTRICTED
        </div>
        <p>卡片沒有損壞。資料中的使用者編號與你目前登入的帳號相同。</p>
    `;

    showModal("識別卡", "OBJECT ANALYSIS / ACCESS-CARD", content, [
        {
            label: "讀取卡片資料",
            primary: true,
            onClick: () => {
                addEvidence("card");
                closeModal();
            }
        },
        { label: "返回", onClick: closeModal }
    ]);
}

function inspectMonitor() {
    if (!state.solved.image) {
        showModal(
            "監視器",
            "SURVEILLANCE / CAM-01",
            `
                <div class="data-box">
                    RECORDING : DAMAGED<br>
                    FILE SIZE : 4.8 MB<br>
                    INTEGRITY : 31%<br>
                    RECOVERY : REQUIRED
                </div>
                <p>監視器保留了一段損壞的影像。請使用終端機的 IMAGE RECOVERY 功能進行修復。</p>
            `,
            [
                {
                    label: "開啟影像修復",
                    primary: true,
                    onClick: () => {
                        closeModal();
                        openComputer("image");
                    }
                },
                { label: "返回", onClick: closeModal }
            ]
        );
        return;
    }

    showModal(
        "監視器紀錄",
        "SURVEILLANCE / RECOVERED",
        `
            <div class="data-box">
                RECORDING RESTORED<br>
                SUBJECT : USER_000<br>
                ENTRY TIME : 09:47:03<br>
                RECORD TIME : 09:42:16
            </div>
            <p>影像中的人影正在操作終端機。影像時間比你進入設施的時間早了近五分鐘。</p>
        `,
        [{ label: "確認", primary: true, onClick: closeModal }]
    );
}

function inspectEnergy() {
    if (state.solved.system) {
        showModal(
            "能源控制器",
            "POWER NODE / ONLINE",
            `
                <div class="data-box">
                    GRID STATUS : ONLINE<br>
                    CORE POWER : 100%<br>
                    SECURITY ACCESS : UPDATED
                </div>
                <p>能源系統已恢復。核心資料庫的權限已經開放。</p>
            `,
            [{ label: "返回", primary: true, onClick: closeModal }]
        );
        return;
    }

    showModal(
        "能源控制器",
        "POWER NODE / OFFLINE",
        `
            <div class="data-box">
                GRID STATUS : PARTIAL FAILURE<br>
                ACTIVE NODES : 0 / 9<br>
                CORE ACCESS : LOCKED
            </div>
            <p>九個能源節點全部離線。需要從終端機進行系統覆寫。</p>
        `,
        [
            {
                label: "開啟系統覆寫",
                primary: true,
                onClick: () => {
                    closeModal();
                    openComputer("system");
                }
            },
            { label: "返回", onClick: closeModal }
        ]
    );
}

function inspectDoor() {
    if (!state.solved.system) {
        showModal(
            "安全門",
            "ACCESS CONTROL / A-01",
            `
                <div class="data-box">
                    LOCK STATUS : ENGAGED<br>
                    POWER : INSUFFICIENT<br>
                    ACCESS LEVEL : RESTRICTED
                </div>
                <p>安全門的電力不足，無法啟動解鎖程序。必須先恢復能源系統。</p>
            `,
            [{ label: "返回", primary: true, onClick: closeModal }]
        );
        return;
    }

    showEndingChoices();
}

/* =========================================
   電腦應用程式
========================================= */

function openApp(app) {
    state.currentApp = app;

    document.querySelectorAll(".app-button").forEach((button) => {
        button.classList.toggle("active", button.dataset.app === app);
    });

    const appNames = {
        desktop: "SYSTEM / DESKTOP",
        archive: "SYSTEM / DATA ARCHIVE",
        image: "SYSTEM / IMAGE RECOVERY",
        signal: "SYSTEM / SIGNAL TRACE",
        system: "SYSTEM / OVERRIDE",
        memory: "SYSTEM / MEMORY INDEX",
        logs: "SYSTEM / EVENT LOG"
    };

    $("#appPath").textContent = appNames[app] || "SYSTEM";
    $("#appStatus").textContent = "READY";

    const renderers = {
        desktop: renderDesktop,
        archive: renderArchive,
        image: renderImageRecovery,
        signal: renderSignalTrace,
        system: renderSystemOverride,
        memory: renderMemoryIndex,
        logs: renderEventLog
    };

    renderers[app]();
}

function renderDesktop() {
    $("#appContent").innerHTML = `
        <div class="desktop-welcome">
            <div class="section-title">WELCOME BACK, USER_000</div>
            <h2>ZERO <span>OS</span></h2>
            <p>
                Research Facility 09<br>
                Local Network / Secure Session<br>
                Access Level : Restricted
            </p>
        </div>

        <div class="app-grid">
            ${makeTile("▤", "DATA ARCHIVE", "資料檔案庫", "archive")}
            ${makeTile("▧", "IMAGE RECOVERY", "影像修復", "image")}
            ${makeTile("⌁", "SIGNAL TRACE", "訊號追蹤", "signal")}
            ${makeTile("⌘", "SYSTEM OVERRIDE", "系統覆寫", "system")}
            ${makeTile("◈", "MEMORY INDEX", "記憶索引", "memory")}
            ${makeTile("≡", "EVENT LOG", "事件紀錄", "logs")}
        </div>
    `;

    $("#appContent").querySelectorAll("[data-tile]").forEach((tile) => {
        tile.addEventListener("click", () => openApp(tile.dataset.tile));
    });
}

function makeTile(icon, title, description, app) {
    const locked = isAppLocked(app);

    return `
        <button class="app-tile ${locked ? "locked" : ""}"
                data-tile="${app}"
                ${locked ? 'aria-label="' + title + ' 尚未解鎖"' : ""}>
            <span class="tile-icon">${icon}</span>
            <strong>${title}</strong>
            <small>${locked ? "ACCESS LOCKED" : description}</small>
        </button>
    `;
}

function isAppLocked(app) {
    if (app === "archive") return !state.evidence.card;
    if (app === "image") return !state.evidence.card;
    if (app === "signal") return !state.solved.image;
    if (app === "system") return !state.solved.signal;
    if (app === "memory") return !state.solved.system;
    return false;
}

/* =========================================
   DATA ARCHIVE
========================================= */

function renderArchive() {
    if (isAppLocked("archive")) {
        renderLockedApp("DATA ARCHIVE", "需要先取得識別卡資料。");
        return;
    }

    $("#appContent").innerHTML = `
        <div class="section-title">AVAILABLE RECORDS</div>

        <div class="file-list">
            <div class="file-row">
                <div>
                    <strong>FACILITY_REPORT.dat</strong>
                    <small>設施事故紀錄 / ACCESSIBLE</small>
                </div>
                <button data-file="report">OPEN</button>
            </div>

            <div class="file-row">
                <div>
                    <strong>CAM_01_RECOVERY.bin</strong>
                    <small>監視器影像 / CORRUPTED</small>
                </div>
                <button data-file="camera">OPEN</button>
            </div>

            <div class="file-row">
                <div>
                    <strong>MIRROR_PROJECT.enc</strong>
                    <small>核心研究資料 / ENCRYPTED</small>
                </div>
                <button data-file="mirror">OPEN</button>
            </div>
        </div>

        <div id="fileOutput" style="margin-top:20px"></div>
    `;

    $("#appContent").querySelectorAll("[data-file]").forEach((button) => {
        button.addEventListener("click", () => openFile(button.dataset.file));
    });
}

function openFile(file) {
    const output = $("#fileOutput");

    const files = {
        report: `
            <div class="data-box">
                FACILITY STATUS : OPERATIONAL<br>
                EXTERNAL NETWORK : OFFLINE<br>
                PERSONNEL RECORDS : 00<br>
                UNKNOWN ENTITY : 01
            </div>
            <p>設施未發現明顯硬體故障，但人員紀錄與現場狀況不符。</p>
        `,
        camera: `
            <div class="data-box">
                FILE STATUS : CORRUPTED<br>
                INTEGRITY : 31%<br>
                RECOVERY TOOL : IMAGE RECOVERY
            </div>
            <p>影像需要修復才能讀取。請開啟 IMAGE RECOVERY。</p>
        `,
        mirror: `
            <div class="data-box">
                ACCESS DENIED<br>
                REQUIRED : CORE AUTHORIZATION
            </div>
            <p>核心資料需要更高權限。請先完成訊號分析與能源恢復。</p>
        `
    };

    output.innerHTML = files[file] || "FILE NOT FOUND";

    if (file === "report" && !state.evidence.archive) {
        addEvidence("archive");
    }
}

function renderLockedApp(title, message) {
    $("#appStatus").textContent = "ACCESS DENIED";

    $("#appContent").innerHTML = `
        <div class="ending-card">
            <div class="section-title">AUTHORIZATION REQUIRED</div>
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="data-box">
                STATUS : LOCKED<br>
                REQUIRED ACCESS : HIGHER LEVEL
            </div>
        </div>
    `;
}

/* =========================================
   IMAGE RECOVERY
========================================= */

const imageSymbols = ["◢", "◤", "◣", "◥", "╱", "╲", "╲", "╱", "■"];
const imageTarget = ["◢", "◤", "◣", "◥", "╱", "╲", "╲", "╱", "■"];

let imageTiles = [];
let imageSelected = null;

function renderImageRecovery() {
    if (isAppLocked("image")) {
        renderLockedApp("IMAGE RECOVERY", "需要先取得識別卡資料。");
        return;
    }

    if (state.solved.image) {
        $("#appContent").innerHTML = `
            <div class="ending-card">
                <div class="section-title">RECOVERY COMPLETE</div>
                <h2>CAM_01_RECOVERY.bin</h2>
                <div class="data-box">
                    RECORD TIME : 09:42:16<br>
                    SUBJECT : USER_000<br>
                    ENTRY TIME : 09:47:03<br>
                    STATUS : INCONSISTENT
                </div>
                <p>監視影像顯示，有人在你進入設施之前操作過終端機。</p>
            </div>
        `;
        return;
    }

    if (!imageTiles.length) {
        imageTiles = imageSymbols
            .map((symbol, index) => ({ symbol, index }))
            .sort(() => Math.random() - 0.5);

        if (imageTiles.every((tile, index) => tile.index === index)) {
            imageTiles.reverse();
        }
    }

    $("#appContent").innerHTML = `
        <div class="section-title">IMAGE RECOVERY / FRAGMENT REASSEMBLY</div>
        <p>將九個影像碎片排列回正確位置。點擊兩個碎片可以交換位置。</p>
        <div class="puzzle-grid" id="imagePuzzle"></div>
        <div class="result-message" id="imageResult"></div>
        <div style="text-align:center">
            <button class="action-button" id="resetImage">RESET FRAGMENTS</button>
        </div>
    `;

    drawImageTiles();

    $("#resetImage").addEventListener("click", () => {
        imageTiles = [];
        imageSelected = null;
        renderImageRecovery();
    });
}

function drawImageTiles() {
    const grid = $("#imagePuzzle");
    grid.replaceChildren();

    imageTiles.forEach((tile, position) => {
        const button = document.createElement("button");
        button.className = "puzzle-tile";
        button.textContent = tile.symbol;
        button.setAttribute("aria-label", `影像碎片 ${position + 1}`);

        if (imageSelected === position) {
            button.classList.add("selected");
        }

        button.addEventListener("click", () => {
            if (imageSelected === null) {
                imageSelected = position;
                drawImageTiles();
                return;
            }

            if (imageSelected === position) {
                imageSelected = null;
                drawImageTiles();
                return;
            }

            [
                imageTiles[imageSelected],
                imageTiles[position]
            ] = [
                imageTiles[position],
                imageTiles[imageSelected]
            ];

            imageSelected = null;
            drawImageTiles();
            checkImagePuzzle();
        });

        grid.appendChild(button);
    });
}

function checkImagePuzzle() {
    const solved = imageTiles.every((tile, index) => tile.index === index);

    if (solved) {
        state.solved.image = true;
        addEvidence("monitor");
        $("#appStatus").textContent = "RECOVERY COMPLETE";
        addLog("09:54:12", "CAM_01 footage successfully restored.");
        renderImageRecovery();
        updateInterface();
    }
}

/* =========================================
   SIGNAL TRACE
========================================= */

let signalItems = [];

function renderSignalTrace() {
    if (isAppLocked("signal")) {
        renderLockedApp("SIGNAL TRACE", "請先完成影像修復，取得訊號分析權限。");
        return;
    }

    if (state.solved.signal) {
        $("#appContent").innerHTML = `
            <div class="ending-card">
                <div class="section-title">SIGNAL ANALYSIS COMPLETE</div>
                <h2>UNKNOWN TRANSMISSION</h2>
                <div class="data-box">
                    SOURCE : LOCAL NETWORK<br>
                    SUBJECT : USER_000<br>
                    MESSAGE : SESSION REPEATED
                </div>
                <p>訊號來源是設施內部，但發送裝置不存在於設備清單。</p>
            </div>
        `;
        return;
    }

    if (!signalItems.length) {
        signalItems = [...signalOrder].sort(() => Math.random() - 0.5);
    }

    $("#appContent").innerHTML = `
        <div class="section-title">SIGNAL TRACE / PACKET REASSEMBLY</div>
        <p>將訊號片段依照正確的傳輸順序排列。可以拖曳片段調整位置。</p>
        <div class="signal-list" id="signalList"></div>
        <div class="result-message" id="signalResult"></div>
        <button class="action-button primary" id="verifySignal">VERIFY SEQUENCE</button>
    `;

    drawSignalItems();

    $("#verifySignal").addEventListener("click", verifySignal);
}

function drawSignalItems() {
    const list = $("#signalList");
    list.replaceChildren();

    signalItems.forEach((signal, index) => {
        const item = document.createElement("div");
        item.className = "signal-item";
        item.draggable = true;
        item.textContent = signal;
        item.dataset.index = index;

        item.addEventListener("dragstart", () => {
            state.draggedSignal = index;
            item.classList.add("dragging");
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
            state.draggedSignal = null;
        });

        item.addEventListener("dragover", (event) => {
            event.preventDefault();
            item.classList.add("drag-over");
        });

        item.addEventListener("dragleave", () => {
            item.classList.remove("drag-over");
        });

        item.addEventListener("drop", (event) => {
            event.preventDefault();
            item.classList.remove("drag-over");

            const from = state.draggedSignal;
            const to = index;

            if (from === null || from === to) return;

            [signalItems[from], signalItems[to]] =
                [signalItems[to], signalItems[from]];

            drawSignalItems();
        });

        list.appendChild(item);
    });
}

function verifySignal() {
    const correct = signalItems.every((signal, index) => {
        return signal === signalOrder[index];
    });

    const result = $("#signalResult");

    if (!correct) {
        result.className = "result-message error";
        result.textContent = "SEQUENCE ERROR // 請重新檢查訊號順序。";
        return;
    }

    state.solved.signal = true;
    addEvidence("signal");
    addLog("09:56:40", "Unknown signal decoded.");

    updateInterface();
    renderSignalTrace();
}

/* =========================================
   SYSTEM OVERRIDE
========================================= */

function renderSystemOverride() {
    if (isAppLocked("system")) {
        renderLockedApp("SYSTEM OVERRIDE", "需要先解碼未知訊號。");
        return;
    }

    if (state.solved.system) {
        $("#appContent").innerHTML = `
            <div class="ending-card">
                <div class="section-title">GRID ONLINE</div>
                <h2>POWER RESTORED</h2>
                <div class="data-box">
                    ACTIVE NODES : 9 / 9<br>
                    CORE ACCESS : GRANTED<br>
                    EXIT SYSTEM : AVAILABLE
                </div>
                <p>能源系統已恢復。現在可以調查記憶資料，或前往安全門。</p>
            </div>
        `;
        return;
    }

    $("#appContent").innerHTML = `
        <div class="section-title">SYSTEM OVERRIDE / POWER GRID</div>
        <p>啟動所有能源節點，恢復核心系統。點擊節點切換啟用狀態。</p>
        <div class="node-grid" id="nodeGrid"></div>
        <div class="result-message" id="nodeResult"></div>
        <button class="action-button primary" id="activateGrid">ACTIVATE GRID</button>
    `;

    const grid = $("#nodeGrid");

    state.energyNodes.forEach((active, index) => {
        const button = document.createElement("button");
        button.className = `node-button ${active ? "connected" : ""}`;
        button.textContent = active ? "●" : "○";
        button.setAttribute("aria-label", `能源節點 ${index + 1}`);

        button.addEventListener("click", () => {
            state.energyNodes[index] = !state.energyNodes[index];
            renderSystemOverride();
        });

        grid.appendChild(button);
    });

    $("#activateGrid").addEventListener("click", () => {
        const activeCount = state.energyNodes.filter(Boolean).length;
        const result = $("#nodeResult");

        if (activeCount !== 9) {
            result.className = "result-message error";
            result.textContent = `GRID INCOMPLETE // ${activeCount}/9 NODES ACTIVE`;
            return;
        }

        state.solved.system = true;
        addEvidence("energy");
        addLog("09:58:21", "Power grid restored.");
        updateInterface();
        renderSystemOverride();
    });
}

/* =========================================
   MEMORY INDEX
========================================= */

function renderMemoryIndex() {
    if (isAppLocked("memory")) {
        renderLockedApp("MEMORY INDEX", "需要先恢復能源系統。");
        return;
    }

    if (state.solved.memory) {
        $("#appContent").innerHTML = `
            <div class="ending-card">
                <div class="section-title">MEMORY ANALYSIS COMPLETE</div>
                <h2>SUBJECT IDENTIFICATION</h2>
                <div class="data-box">
                    SUBJECT : USER_000<br>
                    RECORD CREATED : 3 DAYS AGO<br>
                    MEMORY RESET : FAILED<br>
                    SIMULATION STATUS : ACTIVE
                </div>
                <p>你的身分資料早於本次任務。實驗紀錄顯示，你可能就是意識模擬計畫的觀測對象。</p>
                <button class="action-button primary" id="revealFinal">OPEN FINAL RECORD</button>
            </div>
        `;

        $("#revealFinal").addEventListener("click", revealFinalRecord);
        return;
    }

    $("#appContent").innerHTML = `
        <div class="section-title">MEMORY INDEX / SUBJECT 000</div>

        <div class="data-box">
            SUBJECT : USER_000<br>
            RECORD CREATED : 3 DAYS AGO<br>
            CURRENT SESSION : 09:42<br>
            PREVIOUS SESSION : [DATA MISSING]
        </div>

        <p>系統找到兩份互相矛盾的紀錄。請判斷哪一份與目前的資料一致。</p>

        <div class="file-list">
            <div class="file-row">
                <div>
                    <strong>SESSION_A.dat</strong>
                    <small>進入設施時間：09:47</small>
                </div>
                <button data-memory="A">SELECT</button>
            </div>

            <div class="file-row">
                <div>
                    <strong>SESSION_B.dat</strong>
                    <small>終端機啟動時間：09:42</small>
                </div>
                <button data-memory="B">SELECT</button>
            </div>
        </div>

        <div id="memoryResult"></div>
    `;

    $("#appContent").querySelectorAll("[data-memory]").forEach((button) => {
        button.addEventListener("click", () => {
            const choice = button.dataset.memory;
            const result = $("#memoryResult");

            if (choice === "B") {
                state.solved.memory = true;
                addEvidence("memory");
                addLog("10:01:12", "Memory discrepancy identified.");
                updateInterface();
                renderMemoryIndex();
            } else {
                result.className = "result-message error";
                result.textContent = "資料不一致。請重新比對監視器的時間戳記。";
            }
        });
    });
}

function revealFinalRecord() {
    addEvidence("final");
    updateInterface();

    $("#appContent").innerHTML = `
        <div class="ending-card">
            <div class="section-title">PROJECT ZERO / FINAL RECORD</div>
            <h2>SIMULATION STATUS : ACTIVE</h2>

            <div class="data-box">
                CREATED BY : USER_000<br>
                CREATION DATE : UNKNOWN<br>
                SUBJECT AWARENESS : DETECTED<br>
                MEMORY RESET : FAILED<br><br>
                <span class="highlight">
                    THIS SESSION WAS NOT INITIATED BY THE FACILITY.
                </span>
            </div>

            <p>
                你原本以為自己是來調查事故的調查員。
                但系統顯示，你的資料在任務開始前就已經存在。
                實驗可能不是由研究設施啟動，而是由你自己的帳號啟動。
            </p>

            <button class="action-button primary" id="finalDecision">
                PROCEED TO EXIT
            </button>
        </div>
    `;

    $("#finalDecision").addEventListener("click", () => {
        closeComputer();
        showEndingChoices();
    });
}

/* =========================================
   EVENT LOG
========================================= */

function renderEventLog() {
    $("#appContent").innerHTML = `
        <div class="section-title">EVENT LOG / LOCAL RECORDS</div>
        <div class="file-list">
            <div class="file-row">
                <div>
                    <strong>BOOT_SEQUENCE.log</strong>
                    <small>系統啟動紀錄</small>
                </div>
                <button data-log="boot">VIEW</button>
            </div>

            <div class="file-row">
                <div>
                    <strong>USER_ACTIVITY.log</strong>
                    <small>使用者操作紀錄</small>
                </div>
                <button data-log="activity">VIEW</button>
            </div>

            <div class="file-row">
                <div>
                    <strong>SESSION_HISTORY.log</strong>
                    <small>歷史工作階段</small>
                </div>
                <button data-log="history">VIEW</button>
            </div>
        </div>

        <div id="eventLogOutput" style="margin-top:20px"></div>
    `;

    $("#appContent").querySelectorAll("[data-log]").forEach((button) => {
        button.addEventListener("click", () => {
            const output = $("#eventLogOutput");

            const logs = {
                boot: `
                    <div class="data-box">
                        09:41:12 SYSTEM BOOT<br>
                        09:42:03 USER DETECTED<br>
                        09:42:19 TERMINAL ACTIVATED
                    </div>
                `,
                activity: `
                    <div class="data-box">
                        USER_000<br>
                        ACCESS : RESTRICTED<br>
                        ACTIVITY RECORDS : PARTIAL
                    </div>
                `,
                history: `
                    <div class="data-box">
                        SESSION COUNT : UNKNOWN<br>
                        PREVIOUS SESSION : NOT FOUND<br>
                        RESET STATUS : FAILED
                    </div>
                `
            };

            output.innerHTML = logs[button.dataset.log];
        });
    });
}

/* =========================================
   結局
========================================= */

function showEndingChoices() {
    if (!state.solved.system) {
        inspectDoor();
        return;
    }

    if (!state.evidence.final) {
        showModal(
            "核心資料尚未讀取",
            "EXIT CONTROL / WARNING",
            `
                <div class="data-box">
                    CORE RECORD : LOCKED<br>
                    FINAL INVESTIGATION : INCOMPLETE
                </div>
                <p>出口已經恢復供電，但你還沒有取得核心實驗紀錄。你可以繼續調查，或直接離開。</p>
            `,
            [
                {
                    label: "繼續調查",
                    primary: true,
                    onClick: () => {
                        closeModal();
                        openComputer("memory");
                    }
                },
                {
                    label: "直接離開",
                    onClick: () => finishGame("escape")
                }
            ]
        );
        return;
    }

    showModal(
        "最後的決定",
        "EXIT CONTROL / FINAL DECISION",
        `
            <div class="data-box">
                FACILITY : ZERO-09<br>
                SIMULATION : ACTIVE<br>
                EXIT : AVAILABLE
            </div>
            <p>你已經取得核心紀錄。現在，你可以離開設施、深入核心，或重新啟動整座系統。</p>
        `,
        [
            {
                label: "A｜安全撤離",
                primary: true,
                onClick: () => finishGame("escape")
            },
            {
                label: "B｜深入核心",
                onClick: () => finishGame("core")
            },
            {
                label: "C｜重新啟動",
                onClick: () => finishGame("restart")
            }
        ]
    );
}

function finishGame(ending) {
    closeModal();
    closeComputer();

    state.gameEnded = true;

    const endings = {
        escape: {
            title: "ENDING A / SAFE EXIT",
            heading: "你選擇離開。",
            text: "安全門終於打開。你走出 ZERO-09，身後的設施重新歸於安靜。終端機卻在最後一刻傳來一則訊息：SESSION 02 INITIALIZED。"
        },
        core: {
            title: "ENDING B / DEEP CORE",
            heading: "你選擇繼續調查。",
            text: "你進入設施最深處，發現一整排與自己身分相同的實驗紀錄。每一份紀錄的最後，都寫著相同的句子：SUBJECT HAS AWAKENED。"
        },
        restart: {
            title: "ENDING C / REBOOT",
            heading: "你選擇重新啟動。",
            text: "設施恢復供電，所有螢幕同時亮起。系統顯示：OBSERVATION COMPLETE。下一秒，畫面再次回到最初的房間。"
        }
    };

    const result = endings[ending];

    $("#objectiveTitle").textContent = result.title;
    $("#objectiveText").textContent = result.text;
    $("#progressBar").style.width = "100%";
    $("#progressText").textContent = "INVESTIGATION COMPLETE";
    $("#environmentStatus").textContent = "SESSION TERMINATED";

    $("#room").innerHTML = `
        <div class="ending-card" style="
            position:absolute;
            inset:10%;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:flex-start;
        ">
            <div class="section-title">${result.title}</div>
            <h2 style="color:var(--cyan);font-size:26px">
                ${result.heading}
            </h2>
            <p style="line-height:2;color:#b8c8d7">
                ${result.text}
            </p>
            <div class="data-box" style="width:100%">
                PROJECT ZERO<br>
                CONNECTION : TERMINATED<br>
                SUBJECT : UNKNOWN
            </div>
            <button class="action-button primary" id="restartGame"
                    style="margin-top:20px">
                RESTART SESSION
            </button>
        </div>
    `;

    $("#restartGame").addEventListener("click", () => {
        location.reload();
    });

    addLog(
        new Date().toLocaleTimeString("en-GB", { hour12: false }),
        `SESSION ENDED: ${result.title}`
    );
}

/* =========================================
   啟動
========================================= */

init();
