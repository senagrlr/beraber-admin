import { db } from "./firebase";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
  QueryDocumentSnapshot,
  updateDoc,
  doc,
  deleteDoc,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

const NOTIFICATIONS = "notifications";
const DONATIONS = "donations";

/** 🔔 UI'ye haber vermek için basit bir event bus */
export const notificationsBus = new EventTarget();

export type NotificationTarget =
  | { type: "all" }
  | { type: "campaign"; campaignId: string; campaignName: string };

export interface NotificationDoc {
  id: string;
  title: string;
  body: string;
  target: NotificationTarget;
  scheduledAt: Timestamp; // planlanan gönderim zamanı
  status: "queued" | "sent" | "canceled";
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* --------------------------------------------------
  Kampanya seçenekleri (donations)
-------------------------------------------------- */
export async function fetchCampaignOptions() {
  try {
    const qy = query(collection(db, DONATIONS), orderBy("createdAt", "desc"));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => {
      const data = d.data() as any;
      return {
        id: d.id,
        name: data?.name || "(İsimsiz)",
        status: data?.status || "unknown",
      };
    });
  } catch (err) {
    console.error("[fetchCampaignOptions] ERROR:", err);
    return [];
  }
}

/* --------------------------------------------------
  Bildirim oluştur (planlı)
-------------------------------------------------- */
export async function createNotification(params: {
  title: string;
  body: string;
  target: NotificationTarget;
  scheduledAt: Date; // JS Date
}) {
  try {
    const ref = await addDoc(collection(db, NOTIFICATIONS), {
      title: params.title,
      body: params.body,
      target: params.target,
      scheduledAt: Timestamp.fromDate(params.scheduledAt),
      status: "queued",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 🔔 UI'ye “yeni kayıt var” sinyali gönder
    notificationsBus.dispatchEvent(
      new CustomEvent("created", { detail: { id: ref.id } })
    );

    return { id: ref.id };
  } catch (err) {
    console.error("[createNotification] ERROR:", err);
    throw err;
  }
}

/* --------------------------------------------------
  Tek bildirim getir
-------------------------------------------------- */
export async function getNotificationById(id: string): Promise<NotificationDoc | null> {
  try {
    const snap = await getDoc(doc(db, NOTIFICATIONS, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as any) } as NotificationDoc;
  } catch (err) {
    console.error("[getNotificationById] ERROR:", err);
    return null;
  }
}

/* --------------------------------------------------
  Sayfalama (sonsuz kaydırma) – scheduledAt DESC
  - Aynı sayfa içinde de-dup (id bazlı)
-------------------------------------------------- */
export async function fetchNotificationsPage(
  pageSize = 20,
  last?: QueryDocumentSnapshot
) {
  try {
    const base = [orderBy("scheduledAt", "desc"), limit(pageSize)] as const;
    const qy = last
      ? query(collection(db, NOTIFICATIONS), ...base, startAfter(last))
      : query(collection(db, NOTIFICATIONS), ...base);

    const snap = await getDocs(qy);

    const raw = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((x) => !!x.scheduledAt) as NotificationDoc[];

    const uniqMap = new Map<string, NotificationDoc>();
    for (const it of raw) uniqMap.set(it.id, it);
    const items = Array.from(uniqMap.values());

    const cursor = snap.docs.length ? snap.docs[snap.docs.length - 1] : undefined;
    return { items, cursor };
  } catch (err) {
    console.error("[fetchNotificationsPage] ERROR:", err);
    return { items: [], cursor: undefined };
  }
}

/* --------------------------------------------------
  İlk N kaydı gerçek zamanlı izle – scheduledAt DESC
  - scheduledAt olmayanları eler
  - 🔁 HATA/FALLBACK: orderBy çalışmazsa düz koleksiyona düşer ve client-side sıralar
-------------------------------------------------- */
export function listenNotificationsRealtime(
  cb: (items: NotificationDoc[]) => void,
  limitN = 20
): () => void {
  try {
    const qy = query(
      collection(db, NOTIFICATIONS),
      orderBy("scheduledAt", "desc"),
      limit(limitN)
    );

    const unsub = onSnapshot(
      qy,
      (snap) => {
        const items = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((x) => !!x.scheduledAt) as NotificationDoc[];
        cb(items);
      },
      (err) => {
        console.warn("[listenNotificationsRealtime] ordered listener failed:", err);
        // 🔁 Fallback: düz koleksiyon dinle + client-side sort
        const unsubFallback = onSnapshot(
          collection(db, NOTIFICATIONS),
          (snap2) => {
            const arr = snap2.docs
              .map((d) => ({ id: d.id, ...(d.data() as any) }))
              .filter((x: any) => !!x.scheduledAt) as NotificationDoc[];
            arr.sort(
              (a, b) =>
                (b.scheduledAt?.toMillis?.() ?? 0) -
                (a.scheduledAt?.toMillis?.() ?? 0)
            );
            cb(arr.slice(0, limitN));
          },
          (e2) => console.error("[listenNotificationsRealtime][fallback] ERROR:", e2)
        );
        // ordered listener error anında fallback’ı return et
        return unsubFallback;
      }
    );

    return unsub;
  } catch (err) {
    console.error("[listenNotificationsRealtime] setup ERROR:", err);
    // en kötü ihtimal no-op
    return () => {};
  }
}

/* --------------------------------------------------
  Status güncelle (queued/sent/canceled)
-------------------------------------------------- */
export async function markNotificationStatus(
  id: string,
  status: NotificationDoc["status"]
) {
  try {
    await updateDoc(doc(db, NOTIFICATIONS, id), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error("[markNotificationStatus] ERROR:", err);
    throw err;
  }
}

/* --------------------------------------------------
  İçerik/target güncelle
-------------------------------------------------- */
export async function updateNotification(
  id: string,
  patch: Partial<Pick<NotificationDoc, "title" | "body" | "target">>
) {
  try {
    const ref = doc(db, NOTIFICATIONS, id);
    await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
  } catch (err) {
    console.error("[updateNotification] ERROR:", err);
    throw err;
  }
}

/* --------------------------------------------------
  Sil
-------------------------------------------------- */
export async function deleteNotificationById(id: string) {
  try {
    await deleteDoc(doc(db, NOTIFICATIONS, id));
  } catch (err) {
    console.error("[deleteNotificationById] ERROR:", err);
    throw err;
  }
}

/* --------------------------------------------------
  Event bus abone/çık helper (UI için)
-------------------------------------------------- */
export function subscribeCreated(handler: (id: string) => void) {
  const fn = (ev: Event) => {
    const detail = (ev as CustomEvent).detail as { id: string };
    if (detail?.id) handler(detail.id);
  };
  notificationsBus.addEventListener("created", fn as EventListener);
  return () => notificationsBus.removeEventListener("created", fn as EventListener);
}

