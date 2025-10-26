// src/data/repositories/donations.repo.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  startAt,
  endAt,
  type Unsubscribe,
  type Firestore,
  getCountFromServer,
  Timestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";
import { COLLECTIONS } from "@/constants/firestore";
import { toDonation, fromDonationWrite } from "@/domain/donations/donation.mapper";
import type { Donation, DonationWrite } from "@/domain/donations/donation.schema";

export interface IDonationsRepo {
  add(input: DonationWrite, uid: string): Promise<string>;
  getById(id: string): Promise<Donation | null>;
  listenById(id: string, cb: (row: Donation | null) => void): Unsubscribe;
  update(id: string, patch: Partial<DonationWrite>): Promise<void>;
  setPhotoUrl(id: string, url: string): Promise<void>;
  uploadPhoto(id: string, file: File): Promise<string>;
  deleteById(id: string): Promise<void>;
  listenRecent(limitN: number, cb: (rows: Donation[]) => void): Unsubscribe;
  listenRecentCompleted(
    limitN: number,
    cb: (rows: Array<{ id: string; name: string }>) => void
  ): Unsubscribe;
  fetchMonthToDateTotal(): Promise<number>;
  fetchYearToDateTotal(year: number): Promise<number>;
  fetchCompleted(limitN: number): Promise<Array<{ id: string; name?: string }>>;
  fetchCategoryRatios(): Promise<Array<{ name: string; value: number; color: string }>>;
  searchByName(q: string, limitN: number): Promise<Array<{ id:string; name: string }>>;
  fetchCompletedCampaigns(limitN: number): Promise<Array<{ id: string; name?: string }>>;
  fetchPhotoPending(limitN: number): Promise<Array<{ id: string; name?: string }>>;
  fetchDashboardCounts(): Promise<{
    total: number;
    active: number;
    completed: number;
    photoPending: number;
  }>;
}

export class FirestoreDonationsRepo implements IDonationsRepo {
  constructor(private db: Firestore, private storage: FirebaseStorage) {}

  async add(input: DonationWrite, uid: string): Promise<string> {
    const firestoreData = fromDonationWrite(input);
    const refDoc = await addDoc(collection(this.db, COLLECTIONS.DONATIONS), {
      ...firestoreData,
      collected: 0,
      status: "active",
      photoUrl: "",
      createdBy: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return refDoc.id;
  }

  async getById(id: string): Promise<Donation | null> {
    const s = await getDoc(doc(this.db, COLLECTIONS.DONATIONS, id));
    if (!s.exists() || s.data()?.status === "deleted") return null;
    return toDonation(s.id, s.data() as any);
  }

  listenById(id: string, cb: (row: Donation | null) => void): Unsubscribe {
    return onSnapshot(
      doc(this.db, COLLECTIONS.DONATIONS, id),
      (s) => {
        if (!s.exists() || s.data()?.status === "deleted") cb(null);
        else cb(toDonation(s.id, s.data() as any));
      },
      (err) => {
        console.error("[DonationsRepo.listenById] error:", err);
        cb(null);
      }
    );
  }

  async update(id: string, patch: Partial<DonationWrite>): Promise<void> {
    const firestorePatch: Record<string, any> = {};
    if (patch.name !== undefined) {
      const trimmedName = patch.name.trim();
      if (trimmedName.length >= 3) {
        firestorePatch.name = trimmedName;
        firestorePatch.nameLower = trimmedName.toLowerCase();
      } else {
        console.warn(`[DonationsRepo.update] invalid name for ${id}, skipped.`);
      }
    }
    if (patch.amount !== undefined) {
      const amt = Number(patch.amount);
      if (Number.isFinite(amt) && amt > 0) firestorePatch.amount = amt;
      else console.warn(`[DonationsRepo.update] invalid amount for ${id}, skipped.`);
    }
    if (patch.category !== undefined) firestorePatch.category = patch.category;
    if (patch.description !== undefined) firestorePatch.description = (patch.description ?? "").trim();

    // photoUrl bu metodla güncellenmez
    delete (firestorePatch as any).photoUrl;

    await updateDoc(doc(this.db, COLLECTIONS.DONATIONS, id), {
      ...firestorePatch,
      updatedAt: serverTimestamp(),
    });
  }

  async setPhotoUrl(id: string, url: string): Promise<void> {
    await updateDoc(doc(this.db, COLLECTIONS.DONATIONS, id), {
      photoUrl: url.trim(),
      updatedAt: serverTimestamp(),
    });
  }

  async uploadPhoto(id: string, file: File): Promise<string> {
    const safeFileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const storageRef = ref(this.storage, `donations/${id}/${safeFileName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    await this.setPhotoUrl(id, downloadURL);
    return downloadURL;
  }

  async deleteById(id: string): Promise<void> {
    await updateDoc(doc(this.db, COLLECTIONS.DONATIONS, id), {
      status: "deleted",
      updatedAt: serverTimestamp(),
    });
  }

  /* ---------------- Realtime listeler ---------------- */

  // ✅ DÜZELTİLDİ: status IN + createdAt DESC
  listenRecent(limitN: number, cb: (rows: Donation[]) => void): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "in", ["active", "completed", "photo_pending"]),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    return onSnapshot(
      qy,
      (snap) => cb(snap.docs.map((d) => toDonation(d.id, d.data() as any))),
      (err) => {
        console.error("[DonationsRepo.listenRecent] error:", err);
        cb([]);
      }
    );
  }

  listenRecentCompleted(
    limitN: number,
    cb: (rows: Array<{ id: string; name: string }>) => void
  ): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    return onSnapshot(
      qy,
      (snap) =>
        cb(
          snap.docs.map((d) => ({
            id: d.id,
            name: String(d.data()?.name ?? ""),
          }))
        ),
      (err) => {
        console.error("[DonationsRepo.listenRecentCompleted] error:", err);
        cb([]);
      }
    );
  }

  /* ---------------- Rapor / Yardımcılar ---------------- */

  async fetchMonthToDateTotal(): Promise<number> {
    const now = new Date();
    const firstOfMonth = Timestamp.fromDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      where("createdAt", ">=", firstOfMonth)
    );
    try {
      const snap = await getDocs(qy);
      let sum = 0;
      snap.docs.forEach((d) => (sum += Number(d.data()?.collected ?? 0)));
      return sum;
    } catch (e) {
      console.error("[fetchMonthToDateTotal] index?", e);
      return 0;
    }
  }

  async fetchYearToDateTotal(year: number): Promise<number> {
    const startOfYear = Timestamp.fromDate(new Date(year, 0, 1));
    const startOfNextYear = Timestamp.fromDate(new Date(year + 1, 0, 1));
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      where("createdAt", ">=", startOfYear),
      where("createdAt", "<", startOfNextYear)
    );
    try {
      const snap = await getDocs(qy);
      let sum = 0;
      snap.docs.forEach((d) => (sum += Number(d.data()?.collected ?? 0)));
      return sum;
    } catch (e) {
      console.error("[fetchYearToDateTotal] index?", e);
      return 0;
    }
  }

  async fetchCompleted(limitN: number): Promise<Array<{ id: string; name?: string }>> {
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    try {
      const snap = await getDocs(qy);
      return snap.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? "") }));
    } catch (e) {
      console.error("[fetchCompleted] index?", e);
      return [];
    }
  }
  fetchCompletedCampaigns(limitN: number) {
    return this.fetchCompleted(limitN);
  }

  async fetchCategoryRatios(): Promise<Array<{ name: string; value: number; color: string }>> {
    const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      where("createdAt", ">=", thirtyDaysAgo)
    );
    try {
      const snap = await getDocs(qy);
      const counts: Record<string, number> = {};
      let total = 0;
      snap.docs.forEach((d) => {
        const cat = String(d.data()?.category ?? "Diğer");
        counts[cat] = (counts[cat] ?? 0) + 1;
        total += 1;
      });
      if (total === 0) return [];
      const palette: string[] = [
        "#B60707",
        "#E67E22",
        "#2980B9",
        "#27AE60",
        "#8E44AD",
        "#D35400",
        "#16A085",
        "#2C3E50",
        "#C0392B",
        "#7F8C8D",
      ];
      return Object.entries(counts).map(([name, c], i) => ({
        name,
        value: Math.round((c / total) * 100),
        color: palette[i % palette.length],
      }));
    } catch (e) {
      console.error("[fetchCategoryRatios] index?", e);
      return [];
    }
  }

  async searchByName(qstr: string, limitN: number): Promise<Array<{ id: string; name: string }>> {
    const q = (qstr || "").trim().toLowerCase();
    if (!q) return [];
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "in", ["active", "completed", "photo_pending"]),
      orderBy("nameLower", "asc"),
      startAt(q),
      endAt(q + "\uf8ff"),
      limit(limitN)
    );
    try {
      const snap = await getDocs(qy);
      return snap.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? "") }));
    } catch (e) {
      console.warn("[searchByName] index yok; fallback client filter:", e);
      const allSnap = await getDocs(
        query(
          collection(this.db, COLLECTIONS.DONATIONS),
          where("status", "in", ["active", "completed", "photo_pending"])
        )
      );
      return allSnap.docs
        .map((d) => ({ id: d.id, name: String(d.data()?.name ?? "") }))
        .filter((it) => it.name.toLowerCase().startsWith(q))
        .slice(0, limitN);
    }
  }

  async fetchPhotoPending(limitN: number): Promise<Array<{ id: string; name?: string }>> {
    const qy = query(
      collection(this.db, COLLECTIONS.DONATIONS),
      where("status", "in", ["completed", "photo_pending"]),
      where("photoUrl", "==", ""), // Boş string mantığını koruyoruz
      orderBy("updatedAt", "desc"),
      limit(limitN)
    );
    try {
      const snap = await getDocs(qy);
      return snap.docs.map((d) => ({ id: d.id, name: String(d.data()?.name ?? "") }));
    } catch (e) {
      console.warn("[fetchPhotoPending] index yok; fallback:", e);
      const allSnap = await getDocs(
        query(
          collection(this.db, COLLECTIONS.DONATIONS),
          where("status", "in", ["completed", "photo_pending"])
        )
      );
      return allSnap.docs
        .map((d) => ({ id: d.id, data: d.data() as any }))
        .filter((it) => (it.data.photoUrl ?? "") === "")
        .sort(
          (a, b) =>
            (b.data.updatedAt?.toMillis?.() ?? 0) -
            (a.data.updatedAt?.toMillis?.() ?? 0)
        )
        .slice(0, limitN)
        .map((it) => ({ id: it.id, name: String(it.data.name ?? "") }));
    }
  }

  async fetchDashboardCounts(): Promise<{
    total: number;
    active: number;
    completed: number;
    photoPending: number;
  }> {
    const col = collection(this.db, COLLECTIONS.DONATIONS);
    try {
      const [totalAgg, activeAgg, completedAgg, photoPendingAgg] = await Promise.all([
        getCountFromServer(query(col, where("status", "in", ["active", "completed", "photo_pending"]))),
        getCountFromServer(query(col, where("status", "==", "active"))),
        getCountFromServer(query(col, where("status", "==", "completed"))),
        getCountFromServer(
          query(
            col,
            where("status", "in", ["completed", "photo_pending"]),
            where("photoUrl", "==", "")
          )
        ),
      ]);
      return {
        total: totalAgg.data().count,
        active: activeAgg.data().count,
        completed: completedAgg.data().count,
        photoPending: photoPendingAgg.data().count,
      };
    } catch (e) {
      console.error("[fetchDashboardCounts] error:", e);
      return { total: 0, active: 0, completed: 0, photoPending: 0 };
    }
  }
}
