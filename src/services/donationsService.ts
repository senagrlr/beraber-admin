import { db, storage } from "./firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  updateDoc,
  doc,
  getDocs,
  getDoc,
  getCountFromServer,
  serverTimestamp,
  startAt,
  endAt,
  QueryDocumentSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { COLLECTIONS } from "../constants/firestore";

/* --------------------------------------------------
  Tipler
-------------------------------------------------- */
export type DonationDoc = {
  id: string;
  name: string;
  category: string;
  amount: number;        // hedef
  collected: number;     // toplanan (UI'da asla düzenlenmez)
  description?: string;
  status: "active" | "photo_pending" | "completed";
  photoUrl?: string;
  photoUpdatedAt?: Timestamp; // ⬅️ eklendi (cache yenileme için)
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

/* Little helpers */
const n = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);

/* --------------------------------------------------
  1) Bağış ekle
-------------------------------------------------- */
export async function addDonation({
  name,
  category,
  amount,
  description,
}: {
  name: string;
  category: string;
  amount: number | string;
  description?: string;
}) {
  const refDoc = await addDoc(collection(db, COLLECTIONS.DONATIONS), {
    name,
    category,
    amount: n(amount),
    collected: 0,
    description: description ?? "",
    createdAt: serverTimestamp(),
    status: "active",
    photoUrl: "",
  });
  return { id: refDoc.id };
}

/* --------------------------------------------------
  1.5) Bağış sil (detay sayfasındaki "Sil" butonu)
-------------------------------------------------- */
export async function deleteDonationById(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.DONATIONS, id));
}
// Eski adla kullananlar için alias:
export const deleteDonation = deleteDonationById;

/* --------------------------------------------------
  2) Son 10 bağış – realtime
-------------------------------------------------- */
export function listenRecentDonations(callback: (donations: DonationDoc[]) => void) {
  try {
    const qy = query(collection(db, COLLECTIONS.DONATIONS), orderBy("createdAt", "desc"), limit(10));
    const unsubscribe = onSnapshot(
      qy,
      (snapshot) => {
        const donations = snapshot.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data?.name ?? "",
            category: data?.category ?? "",
            amount: n(data?.amount),
            collected: n(data?.collected),
            description: data?.description ?? "",
            status: (data?.status as DonationDoc["status"]) ?? "active",
            photoUrl: data?.photoUrl,
            photoUpdatedAt: data?.photoUpdatedAt,
            createdAt: data?.createdAt,
            updatedAt: data?.updatedAt,
          } as DonationDoc;
        });
        callback(donations);
      },
      (err) => console.error("[listenRecentDonations] error:", err)
    );
    return unsubscribe;
  } catch (err) {
    console.error("listenRecentDonations error:", err);
    return () => {};
  }
}

/* --------------------------------------------------
  3) Fotoğraf bekleyenler (index fallback’li)
-------------------------------------------------- */
export async function fetchPhotoPendingDonations() {
  try {
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      where("status", "==", "photo_pending"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DonationDoc[];
  } catch (err: any) {
    if (err?.code === "failed-precondition") {
      console.warn("[fetchPhotoPendingDonations] No index; falling back to client-side sort.");
      const qy2 = query(collection(db, COLLECTIONS.DONATIONS), where("status", "==", "photo_pending"));
      const snap2 = await getDocs(qy2);
      const rows = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DonationDoc[];
      rows.sort((a, b) => (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0));
      return rows.reverse();
    }
    console.error("fetchPhotoPendingDonations error:", err);
    return [];
  }
}

/* --------------------------------------------------
  4) Bağış güncelle (UI'dan collected asla gönderme!)
-------------------------------------------------- */
export async function updateDonation(id: string, data: Partial<DonationDoc>) {
  try {
    // collected alanını force-drop (UI güvenliği)
    const { collected, id: _id, createdAt, updatedAt, photoUpdatedAt, ...rest } = data as any;
    const refDoc = doc(db, COLLECTIONS.DONATIONS, id);
    await updateDoc(refDoc, { ...rest, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error("updateDonation error:", err);
    throw err;
  }
}

/* --------------------------------------------------
  5) Fotoğraf yükle (status değiştirmez; sadece photoUrl yazar)
     Ayrıca photoUpdatedAt yazar → UI cache-bust için kullanabilir.
-------------------------------------------------- */
export async function uploadDonationPhoto(id: string, file: File) {
  try {
    const storageRef = ref(storage, `donations/${id}/${file.name}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    await updateDoc(doc(db, COLLECTIONS.DONATIONS, id), {
      photoUrl: downloadURL,
      photoUpdatedAt: serverTimestamp(), // ⬅️ eklendi
      updatedAt: serverTimestamp(),
    });

    return downloadURL;
  } catch (err) {
    console.error("uploadDonationPhoto error:", err);
    throw err;
  }
}

/* --------------------------------------------------
  6) Kategori oranları (son 30 gün)
-------------------------------------------------- */
export async function fetchCategoryRatios() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      where("createdAt", ">=", Timestamp.fromDate(thirtyDaysAgo))
    );
    const snapshot = await getDocs(qy);
    return _buildCategoryRatiosFromSnapshot(snapshot);
  } catch (err: any) {
    if (err?.code === "failed-precondition") {
      console.warn("[fetchCategoryRatios] No index; falling back to status-only + client date filter.");
      const snap2 = await getDocs(query(collection(db, COLLECTIONS.DONATIONS), where("status", "==", "completed")));
      const thirtyDaysAgoMs = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const filteredDocs = {
        docs: snap2.docs.filter((d) => {
          const ct = (d.data() as any)?.createdAt;
          const ms = ct?.toMillis?.() ?? 0;
          return ms >= thirtyDaysAgoMs;
        }),
      } as any;
      return _buildCategoryRatiosFromSnapshot(filteredDocs);
    }
    console.error("fetchCategoryRatios error:", err);
    return [];
  }
}

function _buildCategoryRatiosFromSnapshot(snapshot: { docs: QueryDocumentSnapshot[] } | any) {
  const categoryCount: Record<string, number> = {};
  snapshot.docs.forEach((d: any) => {
    const data = d.data() as any;
    const category = data?.category || "Bilinmiyor";
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  const total = Object.values(categoryCount).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const ratios = Object.entries(categoryCount)
    .map(([name, count]) => ({ name, value: Math.round((count / total) * 100) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4);

  const colors = ["#B60707", "#7A0E0E", "#A76F49", "#D9A679"];
  return ratios.map((item, i) => ({ ...item, color: colors[i % colors.length] }));
}

/* --------------------------------------------------
  7) Biten kampanyalar
-------------------------------------------------- */
export async function fetchCompletedCampaigns(limitN = 10) {
  try {
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DonationDoc[];
  } catch (err: any) {
    if (err?.code === "failed-precondition") {
      console.warn("[fetchCompletedCampaigns] No index; falling back to status-only + client-side sort.");
      const snap2 = await getDocs(query(collection(db, COLLECTIONS.DONATIONS), where("status", "==", "completed")));
      const rows = snap2.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as DonationDoc[];
      rows.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      return rows.slice(0, limitN);
    }
    console.error("fetchCompletedCampaigns error:", err);
    return [];
  }
}

/* --------------------------------------------------
  8) İlerleme güncelle
-------------------------------------------------- */
export async function updateDonationProgress(id: string, newCollected: number) {
  try {
    const refDoc = doc(db, COLLECTIONS.DONATIONS, id);
    const current = await getDoc(refDoc);
    if (!current.exists()) return;

    const data = current.data() as any;
    const amount = n(data?.amount);
    const completed = amount > 0 && n(newCollected) >= amount;

    await updateDoc(refDoc, {
      collected: n(newCollected),
      status: completed ? "completed" : (data?.status ?? "active"),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("updateDonationProgress error:", err);
  }
}

/* --------------------------------------------------
  9) Dashboard sayacı
-------------------------------------------------- */
export async function fetchDashboardCounts() {
  try {
    const donationsRef = collection(db, COLLECTIONS.DONATIONS);
    const qCompleted = query(donationsRef, where("status", "==", "completed"));
    const qActive = query(donationsRef, where("status", "==", "active"));

    const [completedSnap, activeSnap] = await Promise.all([
      getCountFromServer(qCompleted),
      getCountFromServer(qActive),
    ]);

    const statsSnap = await getDoc(doc(db, COLLECTIONS.USER_STATS, "global"));
    const totalUsers = statsSnap.exists()
      ? Number((statsSnap.data() as any)?.totalUsers ?? 0)
      : 0;

    return {
      completedDonations: completedSnap.data().count || 0,
      activeDonations: activeSnap.data().count || 0,
      totalUsers,
    };
  } catch (err) {
    console.error("fetchDashboardCounts error:", err);
    return { completedDonations: 0, activeDonations: 0, totalUsers: 0 };
  }
}

/* --------------------------------------------------
  10) İsimle arama (prefix)
-------------------------------------------------- */
export async function searchDonationsByName(prefix: string, limitN = 8) {
  const p = (prefix ?? "").trim();
  if (!p) return [];
  try {
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      orderBy("name"),
      startAt(p),
      endAt(p + "\uf8ff"),
      limit(limitN)
    );
    const snap = await getDocs(qy);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return { id: d.id, name: data?.name ?? "(İsimsiz)" };
    });
  } catch (err: any) {
    console.warn("[searchDonationsByName] fallback:", err?.code || err);
    const all = await getDocs(collection(db, COLLECTIONS.DONATIONS));
    const rows = all.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((x: any) =>
        String(x?.name ?? "").toLocaleLowerCase("tr-TR").startsWith(p.toLocaleLowerCase("tr-TR"))
      )
      .slice(0, limitN)
      .map((x: any) => ({ id: x.id, name: x.name ?? "(İsimsiz)" }));
    return rows;
  }
}

/* --------------------------------------------------
  11) Son tamamlanan bağışlar — realtime
-------------------------------------------------- */
export function listenRecentCompletedDonations(
  limitN = 10,
  cb: (rows: { id: string; name: string }[]) => void
) {
  try {
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    const unsub = onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() as any;
          return { id: d.id, name: data?.name ?? "(İsimsiz)" };
        });
        cb(rows);
      },
      (err) => console.error("[listenRecentCompletedDonations] error:", err)
    );
    return unsub;
  } catch (err: any) {
    console.warn("[listenRecentCompletedDonations] error:", err?.code || err);
    return () => {};
  }
}

/* --------------------------------------------------
  12) Tek bağış getir/dinle (detay)
-------------------------------------------------- */
export async function getDonationById(id: string): Promise<DonationDoc | null> {
  try {
    const s = await getDoc(doc(db, COLLECTIONS.DONATIONS, id));
    if (!s.exists()) return null;
    const data = s.data() as any;
    return {
      id: s.id,
      name: data?.name ?? "",
      category: data?.category ?? "",
      amount: n(data?.amount),
      collected: n(data?.collected),
      description: data?.description ?? "",
      status: (data?.status as DonationDoc["status"]) ?? "active",
      photoUrl: data?.photoUrl,
      photoUpdatedAt: data?.photoUpdatedAt,
      createdAt: data?.createdAt,
      updatedAt: data?.updatedAt,
    };
  } catch (err) {
    console.error("[getDonationById] error:", err);
    return null;
  }
}

export function listenDonationById(id: string, cb: (doc: DonationDoc | null) => void) {
  try {
    const unsub = onSnapshot(
      doc(db, COLLECTIONS.DONATIONS, id),
      (s) => {
        if (!s.exists()) return cb(null);
        const data = s.data() as any;
        cb({
          id: s.id,
          name: data?.name ?? "",
          category: data?.category ?? "",
          amount: n(data?.amount),
          collected: n(data?.collected),
          description: data?.description ?? "",
          status: (data?.status as DonationDoc["status"]) ?? "active",
          photoUrl: data?.photoUrl,
          photoUpdatedAt: data?.photoUpdatedAt,
          createdAt: data?.createdAt,
          updatedAt: data?.updatedAt,
        });
      },
      (err) => console.error("[listenDonationById] error:", err)
    );
    return unsub;
  } catch (err) {
    console.error("[listenDonationById] error:", err);
    return () => {};
  }
}

/* --------------------------------------------------
  13) RAPORLAR — Aylık toplamlar / MTD / YTD
     (tamamlanan kayıtlar; collected üstünden)
-------------------------------------------------- */

/** Seçilen yılda ay ay TOPLANAN (collected) toplamı */
export async function fetchMonthlyDonationSums(
  year: number
): Promise<{ month: string; total: number }[]> {
  const MONTHS_TR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const jan1 = new Date(year, 0, 1, 0, 0, 0);
  const jan1Next = new Date(year + 1, 0, 1, 0, 0, 0);

  const buckets: Record<number, number> = {};
  for (let i = 0; i < 12; i++) buckets[i] = 0;

  try {
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      where("createdAt", ">=", Timestamp.fromDate(jan1)),
      where("createdAt", "<", Timestamp.fromDate(jan1Next))
    );
    const snap = await getDocs(qy);
    snap.docs.forEach((d) => {
      const data = d.data() as any;
      const createdAt: Date | undefined = data?.createdAt?.toDate?.();
      const collected = n(data?.collected);
      if (!createdAt || !Number.isFinite(collected)) return;
      buckets[createdAt.getMonth()] += collected;
    });
  } catch (err: any) {
    // Fallback: status-only → client-side tarih aralığı
    if (err?.code !== "failed-precondition") {
      console.warn("[fetchMonthlyDonationSums] fallback:", err?.code || err);
    }
    const snap2 = await getDocs(query(collection(db, COLLECTIONS.DONATIONS), where("status", "==", "completed")));
    const start = jan1.getTime();
    const end = jan1Next.getTime();
    snap2.docs.forEach((d) => {
      const data = d.data() as any;
      const ms = data?.createdAt?.toMillis?.() ?? 0;
      const collected = n(data?.collected);
      if (ms >= start && ms < end && Number.isFinite(collected)) {
        const m = new Date(ms).getMonth();
        buckets[m] += collected;
      }
    });
  }

  return MONTHS_TR.map((label, i) => ({ month: label, total: buckets[i] || 0 }));
}

/** Bu ay (MTD) – bugüne kadar toplanan (collected) */
export async function fetchMonthToDateTotal(): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

  try {
    const qy = query(
      collection(db, COLLECTIONS.DONATIONS),
      where("status", "==", "completed"),
      where("createdAt", ">=", Timestamp.fromDate(monthStart)),
      where("createdAt", "<=", Timestamp.fromDate(now))
    );
    const snap = await getDocs(qy);
    let sum = 0;
    snap.docs.forEach((d) => (sum += n((d.data() as any)?.collected)));
    return sum;
  } catch (_e) {
    const snap2 = await getDocs(query(collection(db, COLLECTIONS.DONATIONS), where("status", "==", "completed")));
    let sum = 0;
    const start = monthStart.getTime();
    const end = now.getTime();
    snap2.docs.forEach((d) => {
      const data = d.data() as any;
      const dt = data?.createdAt?.toMillis?.() ?? 0;
      if (dt >= start && dt <= end) sum += n(data?.collected);
    });
    return sum;
  }
}

/** Yıl başından bugüne (YTD) – seçili yıl: ay ay collected toplamı */
export async function fetchYearToDateTotal(year: number): Promise<number> {
  const rows = await fetchMonthlyDonationSums(year);
  const now = new Date();
  const stopIdx = year === now.getFullYear() ? now.getMonth() : 11;
  return rows.slice(0, stopIdx + 1).reduce((a, b) => a + (b.total || 0), 0);
}
