// src/data/repositories/notifications.repo.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as qLimit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";
import { RECENT_10, PAGE_20 } from "@/constants/pagination";

// Firestore tarafındaki bildirim dokümanı (id hariç)
export interface NotificationRecord {
  title: string;
  body: string;
  target: any;
  scheduledAt?: any;
  createdAt?: any;
  updatedAt?: any;
}

export interface INotificationsRepo {
  create(input: { title: string; body: string; target: any; scheduledAt?: any }): Promise<{ id: string }>;
  update(id: string, patch: any): Promise<void>;
  delete(id: string): Promise<void>;

  fetchCampaignOptions(): Promise<{ id: string; name: string; status: string }[]>;
  listenRealtime(cb: (rows: any[]) => void, limitN: number): Unsubscribe;
  fetchPage(limitN: number, cursor?: any): Promise<{ items: any[]; cursor?: any }>;

  getById(id: string): Promise<any | null>;
}

export class FirestoreNotificationsRepo implements INotificationsRepo {
  constructor(private db: Firestore) {}

  async create(input: { title: string; body: string; target: any; scheduledAt?: any }) {
    const payload: NotificationRecord = {
      title: (input.title ?? "").trim(),
      body: (input.body ?? "").trim(),
      target: input.target ?? null,
      scheduledAt: input.scheduledAt ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(this.db, COLLECTIONS.NOTIFICATIONS), payload);
    return { id: ref.id };
  }

  async update(id: string, patch: any) {
    const toUpdate: Partial<NotificationRecord> = { updatedAt: serverTimestamp() };
    if (typeof patch.title === "string") toUpdate.title = patch.title.trim();
    if (typeof patch.body === "string") toUpdate.body = patch.body.trim();
    if (patch.target !== undefined) toUpdate.target = patch.target ?? null;
    if (patch.scheduledAt !== undefined) toUpdate.scheduledAt = patch.scheduledAt ?? null;
    await updateDoc(doc(this.db, COLLECTIONS.NOTIFICATIONS, id), toUpdate);
  }

  async delete(id: string) {
    await deleteDoc(doc(this.db, COLLECTIONS.NOTIFICATIONS, id));
  }

  async fetchCampaignOptions() {
    const snap = await getDocs(collection(this.db, COLLECTIONS.DONATIONS));
    return snap.docs.map((d) => {
      const data = d.data() as { name?: string; status?: string } | undefined;
      return {
        id: d.id,
        name: data?.name ?? "(İsimsiz)",
        status: data?.status ?? "",
      };
    });
  }

  listenRealtime(cb: (rows: any[]) => void, limitN: number) {
    const n = Number.isFinite(limitN) && limitN > 0 ? limitN : RECENT_10;
    const qy = query(
      collection(this.db, COLLECTIONS.NOTIFICATIONS),
      orderBy("createdAt", "desc"),
      qLimit(n)
    );
    return onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as NotificationRecord),
        }));
        cb(rows as any[]);
      },
      (err) => {
        console.error("[NotificationsRepo.listenRealtime] error:", err);
        cb([]);
      }
    );
  }

  async fetchPage(limitN: number, cursor?: any) {
    const n = Number.isFinite(limitN) && limitN > 0 ? limitN : PAGE_20;
    let qy = query(
      collection(this.db, COLLECTIONS.NOTIFICATIONS),
      orderBy("createdAt", "desc"),
      qLimit(n)
    );
    if (cursor) qy = query(qy, startAfter(cursor));
    const snap = await getDocs(qy);
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as NotificationRecord),
    }));
    const nextCursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;
    return { items: items as any[], cursor: nextCursor };
  }

  async getById(id: string) {
    const s = await getDoc(doc(this.db, COLLECTIONS.NOTIFICATIONS, id));
    if (!s.exists()) return null;
    const data = s.data() as NotificationRecord;
    return { id: s.id, ...data } as any;
  }
}
