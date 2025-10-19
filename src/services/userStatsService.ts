import { db } from "../services/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

const usersCol = collection(db, "users");

// 🔹 Ay başlangıcı ve bitişi hesapla
function monthRange(year: number, monthIndex: number) {
  const start = new Date(year, monthIndex, 1, 0, 0, 0);
  const end = new Date(year, monthIndex + 1, 1, 0, 0, 0);
  return {
    startTs: Timestamp.fromDate(start),
    endTs: Timestamp.fromDate(end),
  };
}

// 🔹 Seçilen yıl için 12 aylık kullanıcı sayısı hesapla
export async function fetchMonthlyUserCounts(year: number) {
  const monthsTR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

  const results = await Promise.all(
    monthsTR.map(async (_m, idx) => {
      const { startTs, endTs } = monthRange(year, idx);
      const q = query(
        usersCol,
        where("createdAt", ">=", startTs),
        where("createdAt", "<", endTs)
      );
      const snap = await getDocs(q);
      return { month: monthsTR[idx], count: snap.size }; // 📊 belge sayısı
    })
  );

  return results;
}
