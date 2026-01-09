// js/view-manage.js
import * as DB from "./db.js";

export async function initManageView() {
    renderExerciseList();

    document.getElementById("saveExerciseBtn").addEventListener("click", async () => {
        const part = document.getElementById("mPart").value.trim();
        const name = document.getElementById("mName").value.trim();
        const note = document.getElementById("mNote").value.trim();

        if (!part || !name) return alert("部位與名稱為必填");

        await DB.addExercise(part, name, note);
        alert("動作已儲存");
        
        // 清空輸入並重整列表
        document.getElementById("mPart").value = "";
        document.getElementById("mName").value = "";
        document.getElementById("mNote").value = "";
        renderExerciseList();
        
        // 觸發全域事件通知其他頁面更新選單 (Optional, 或簡單重整頁面)
        window.dispatchEvent(new Event("exercises-updated"));
    });
}

async function renderExerciseList() {
    const list = document.getElementById("exerciseList");
    list.innerHTML = "載入中...";
    const exercises = await DB.getExercises();
    
    list.innerHTML = "";
    exercises.forEach(ex => {
        const div = document.createElement("div");
        div.className = "list-item";
        div.innerHTML = `
            <div class="list-item-col">
                <strong>${ex.part} - ${ex.name}</strong>
                <span class="sub-text">${ex.note || "無備註"}</span>
            </div>
            <button class="btn-step" style="font-size:14px; color:red;">🗑️</button>
        `;
        // 刪除功能
        div.querySelector("button").addEventListener("click", async () => {
            if(confirm(`確定刪除 ${ex.name}?`)) {
                await DB.deleteExercise(ex.id);
                renderExerciseList();
                window.dispatchEvent(new Event("exercises-updated"));
            }
        });
        list.append(div);
    });
}