// js/view-history.js
import * as DB from "./db.js";

let currYear = new Date().getFullYear();
let currMonth = new Date().getMonth() + 1;

export async function initHistoryView() {
    document.getElementById("calPrev").addEventListener("click", () => changeMonth(-1));
    document.getElementById("calNext").addEventListener("click", () => changeMonth(1));
    
    // 初始化時渲染本月
    await renderCalendar();
}

async function changeMonth(delta) {
    currMonth += delta;
    if (currMonth > 12) { currMonth = 1; currYear++; }
    if (currMonth < 1) { currMonth = 12; currYear--; }
    await renderCalendar();
}

async function renderCalendar() {
    const label = document.getElementById("calMonthLabel");
    const grid = document.getElementById("calendarGrid");
    const list = document.getElementById("historyList");
    
    label.textContent = `${currYear} / ${String(currMonth).padStart(2,'0')}`;
    grid.innerHTML = "讀取中...";
    list.innerHTML = "";

    // 1. 取得該月所有資料
    const logs = await DB.getWorkoutsByMonth(currYear, currMonth);
    
    // 整理資料：哪幾天有練？ { "2026/01/10": [Logs...] }
    const logsByDate = {};
    logs.forEach(log => {
        if (!logsByDate[log.date]) logsByDate[log.date] = [];
        logsByDate[log.date].push(log);
    });

    // 2. 繪製日曆格子
    grid.innerHTML = "";
    const daysInMonth = new Date(currYear, currMonth, 0).getDate();
    // 該月1號是星期幾 (0=週日)
    const firstDayDow = new Date(currYear, currMonth - 1, 1).getDay();

    // 填空白
    for (let i = 0; i < firstDayDow; i++) {
        const cell = document.createElement("div");
        grid.appendChild(cell);
    }

    // 填日期
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${currYear}/${String(currMonth).padStart(2,'0')}/${String(d).padStart(2,'0')}`;
        const cell = document.createElement("div");
        cell.className = "cal-day";
        cell.textContent = d;
        
        if (logsByDate[dateStr]) {
            cell.classList.add("has-data");
            cell.onclick = () => renderDayDetails(dateStr, logsByDate[dateStr]);
        }
        grid.appendChild(cell);
    }
}

function renderDayDetails(dateStr, dayLogs) {
    const list = document.getElementById("historyList");
    list.innerHTML = `<h4>${dateStr} 的訓練</h4>`;
    
    dayLogs.forEach(log => {
        const div = document.createElement("div");
        div.className = "list-item";
        // 組合 sets 字串
        const setsStr = log.sets.map(s => `${s.weight}kg x${s.reps}`).join(", ");
        
        div.innerHTML = `
            <div class="list-item-col">
                <strong>${log.exerciseName} (${log.part})</strong>
                <span class="sub-text">${setsStr}</span>
            </div>
        `;
        list.appendChild(div);
    });
    
    // 滾動到下方查看
    list.scrollIntoView({ behavior: "smooth" });
}