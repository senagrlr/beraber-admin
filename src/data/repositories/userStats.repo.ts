// src/data/repositories/userStats.repo.ts
import { doc, getDoc, type Firestore } from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";

/** UI’da Aylık Kullanıcı grafiği için beklenen satır tipi */
export type MonthlyUserCount = { month: string; count: number };

export interface IUserStatsRepo {
  /** Belirli bir yıl için 12 aylık kullanıcı sayıları (0’lar dahil) */
  fetchMonthlyUserCounts(year: number): Promise<MonthlyUserCount[]>;
  /** Dashboard’daki toplam kullanıcı sayısı */
  getGlobalTotalUsers(): Promise<number>;
}

interface UserStatsDoc {
  totalUsers?: number;
  monthlyUsers?: Record<string, unknown>;
}

/**
 * Beklenen veri yapısı (önerilen):
 * userStats/global belgesinde:
 * {
 *   totalUsers: number,
 *   monthlyUsers: {
 *     "2025-01": number,
 *     "2025-02": number,
 *     ...
 *   }
 * }
 */
export class FirestoreUserStatsRepo implements IUserStatsRepo {
  constructor(private db: Firestore) {}

  async fetchMonthlyUserCounts(year: number): Promise<MonthlyUserCount[]> {
    const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    const ref = doc(this.db, COLLECTIONS.USER_STATS, "global");
    const snap = await getDoc(ref);

    const stats = snap.exists() ? (snap.data() as UserStatsDoc) : undefined;
    const monthlyUsers = stats?.monthlyUsers ?? {};

    // Eksik aylar için 0 döndür
    const rows: MonthlyUserCount[] = MONTHS_TR.map((label, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      const raw = monthlyUsers[key];
      const count = Number(raw ?? 0);
      return { month: label, count: Number.isFinite(count) ? count : 0 };
    });

    return rows;
  }

  async getGlobalTotalUsers(): Promise<number> {
    const ref = doc(this.db, COLLECTIONS.USER_STATS, "global");
    const snap = await getDoc(ref);
    if (!snap.exists()) return 0;
    const data = snap.data() as UserStatsDoc;
    const total = Number(data.totalUsers ?? 0);
    return Number.isFinite(total) ? total : 0;
  }
}
