// js/view-workout.js
import * as DB from "./db.js";

let allExercises = [];
let currentLog = []; // 暫存今日紀錄，還沒送到 DB 前

export async function initWorkoutView() {
    await loadSelectOptions();
    
    // 監聽動作更新 (如果從管理頁新增了動作)
    window.addEventListener("exercises-updated", loadSelectOptions);

    // 1. 部位選單連動
    const partSelect = document.getElementById("partSelect");
    const exSelect = document.getElementById("exerciseSelect");
    
    partSelect.addEventListener("change", () => {
        const selectedPart = partSelect.value;
        const filtered = allExercises.filter(e => e.part === selectedPart);
        
        exSelect.innerHTML = "";
        filtered.forEach(e => {
            const opt = document.createElement("option");
            opt.value = e.id;
            opt.textContent = e.name;
            opt.dataset.note = e.note || ""; // 把備註藏在 data attribute
            exSelect.appendChild(opt);
        });
        updateNoteDisplay(); // 更新備註顯示
    });

    // 動作改變時更新備註
    exSelect.addEventListener("change", updateNoteDisplay);

    // 2. 加減按鈕邏輯 (Event Delegation)
    document.querySelector(".logger-card").addEventListener("click", (e) => {
        if (!e.target.classList.contains("btn-step")) return;
        const action = e.target.dataset.action;
        const wInput = document.getElementById("weightInput");
        const rInput = document.getElementById("repsInput");
        
        if (action === "plus-weight") wInput.value = parseFloat(wInput.value) + 2.5;
        if (action === "minus-weight") wInput.value = Math.max(0, parseFloat(wInput.value) - 2.5);
        if (action === "plus-reps") rInput.value = parseInt(rInput.value) + 1;
        if (action === "minus-reps") rInput.value = Math.max(1, parseInt(rInput.value) - 1);
    });

    // 3. 紀錄此組 (暫存到前端陣列)
    document.getElementById("addSetBtn").addEventListener("click", () => {
        const exId = exSelect.value;
        if (!exId) return;
        
        const exName = exSelect.options[exSelect.selectedIndex].text;
        const weight = parseFloat(document.getElementById("weightInput").value);
        const reps = parseInt(document.getElementById("repsInput").value);

        // 加到暫存
        currentLog.push({
            exerciseId: exId,
            exerciseName: exName,
            part: partSelect.value,
            weight,
            reps,
            timestamp: new Date()
        });

        renderTodayLog();
    });

    // 4. 完成今日訓練 (寫入 DB)
    document.getElementById("finishWorkoutBtn").addEventListener("click", async () => {
        if (currentLog.length === 0) return;
        if (!confirm("確定完成並儲存？")) return;

        // 我們將所有暫存的組數，整理並儲存
        // 為了簡單，這裡我們直接把每一個 Set 都存成一筆，或者你可以整理成一個 Document
        // 這裡示範：依照「動作」分組儲存，或者單純一點：一組就是一筆 Document (最靈活)
        // 為了日後好分析，我們採用：一個 Document 代表「一項動作的多次組數」
        
        // 1. Group by Exercise
        const grouped = {};
        currentLog.forEach(log => {
            const key = log.exerciseId;
            if (!grouped[key]) {
                grouped[key] = {
                    date: getTodayStr(),
                    exerciseId: log.exerciseId,
                    exerciseName: log.exerciseName,
                    part: log.part,
                    sets: []
                };
            }
            grouped[key].sets.push({ weight: log.weight, reps: log.reps });
        });

        // 2. Upload
        const promises = Object.values(grouped).map(docData => DB.saveWorkoutLog(docData));
        await Promise.all(promises);

        alert("訓練已儲存！");
        currentLog = [];
        renderTodayLog();
        // 通知歷史頁面更新 (可選)
    });
}

async function loadSelectOptions() {
    allExercises = await DB.getExercises();
    
    // 提取所有部位 (去重)
    const parts = [...new Set(allExercises.map(e => e.part))];
    
    const partSelect = document.getElementById("partSelect");
    partSelect.innerHTML = parts.map(p => `<option value="${p}">${p}</option>`).join("");
    
    // 手動觸發一次 change 來填入動作選單
    partSelect.dispatchEvent(new Event("change"));
}

function updateNoteDisplay() {
    const exSelect = document.getElementById("exerciseSelect");
    const noteDisplay = document.getElementById("exerciseNoteDisplay");
    const noteText = document.getElementById("noteText");
    
    if (exSelect.selectedIndex < 0) {
        noteDisplay.classList.add("hidden");
        return;
    }

    const note = exSelect.options[exSelect.selectedIndex].dataset.note;
    if (note && note !== "undefined") {
        noteText.textContent = note;
        noteDisplay.classList.remove("hidden");
    } else {
        noteDisplay.classList.add("hidden");
    }
}

function renderTodayLog() {
    const list = document.getElementById("todayLogList");
    const finishBtn = document.getElementById("finishWorkoutBtn");
    
    list.innerHTML = "";
    if (currentLog.length > 0) {
        finishBtn.classList.remove("hidden");
        currentLog.forEach((log, idx) => {
            const div = document.createElement("div");
            div.className = "list-item";
            div.innerHTML = `
                <span>${log.exerciseName} - ${log.weight}kg x ${log.reps}</span>
                <button class="btn-step" onclick="window.removeLog(${idx})" style="color:red; font-size:12px;">✕</button>
            `;
            list.appendChild(div);
        });
    } else {
        finishBtn.classList.add("hidden");
        list.innerHTML = "<div style='text-align:center; color:#999;'>尚未有紀錄</div>";
    }
}

// 全域 helper 讓 HTML onclick 呼叫 (因為 module scope 隔離)
window.removeLog = (idx) => {
    currentLog.splice(idx, 1);
    renderTodayLog();
};

function getTodayStr() {
    const d = new Date();
    // 07:00 前算前一天 (你的邏輯)
    if (d.getHours() < 7) d.setDate(d.getDate() - 1);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}