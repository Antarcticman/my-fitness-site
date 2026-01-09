// js/db.js
import { db } from "./config.js";
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const EXERCISES_COL = "exercises";
const WORKOUTS_COL = "workouts";

// --- 動作 (Exercises) ---

// 取得所有動作 (通常變動不大，可以快取，但先簡單做)
export async function getExercises() {
    const q = query(collection(db, EXERCISES_COL), orderBy("part"), orderBy("name"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// 新增動作
export async function addExercise(part, name, note) {
    await addDoc(collection(db, EXERCISES_COL), { part, name, note });
}

// 刪除動作
export async function deleteExercise(id) {
    await deleteDoc(doc(db, EXERCISES_COL, id));
}

// --- 紀錄 (Workouts) ---

// 儲存一次訓練 (可能包含多個 Sets)
// 資料結構建議: { date: "2026/01/10", exerciseId: "xyz", exerciseName: "臥推", sets: [{weight:10, reps:10}, ...] }
export async function saveWorkoutLog(logData) {
    await addDoc(collection(db, WORKOUTS_COL), logData);
}

// 取得指定月份的紀錄 (給日曆用)
export async function getWorkoutsByMonth(year, month) {
    // 簡單實作：抓全部再 filter，若資料量大建議用 Firestore 的 where date >= ...
    // 為了簡單起見，我們這裡抓全部依日期排序
    const q = query(collection(db, WORKOUTS_COL), orderBy("date", "desc")); 
    const snapshot = await getDocs(q);
    const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    
    // 過濾月份 (格式預設 YYYY/MM/DD)
    const prefix = `${year}/${String(month).padStart(2, '0')}`;
    return all.filter(log => log.date.startsWith(prefix));
}