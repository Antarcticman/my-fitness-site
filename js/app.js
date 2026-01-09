// js/app.js
import { initWorkoutView } from "./view-workout.js";
import { initManageView } from "./view-manage.js";
import { initHistoryView } from "./view-history.js";

// 頁面載入後初始化
document.addEventListener("DOMContentLoaded", async () => {
    console.log("App Starting...");
    
    // 初始化各頁面邏輯
    initManageView();
    initWorkoutView();
    initHistoryView();

    // Tab 切換邏輯
    const buttons = document.querySelectorAll(".nav-btn");
    const sections = document.querySelectorAll(".tab-view");
    const title = document.getElementById("pageTitle");

    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            // 1. UI Active 狀態切換
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // 2. 內容顯示切換
            const targetId = btn.dataset.target;
            sections.forEach(sec => sec.classList.remove("active"));
            document.getElementById(targetId).classList.add("active");

            // 3. 標題切換
            title.textContent = btn.textContent.trim().split(" ")[1]; // 取 emoji 後面的文字
        });
    });
});