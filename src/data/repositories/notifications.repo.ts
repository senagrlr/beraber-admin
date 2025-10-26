// src\data\repositories\notifications.repo.ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
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

export interface INotificationsRepo {
  // create / update / delete
  create(input: { title: string; body: string; target: any; scheduledAt?: any }): Promise<{ id: string }>;
  update(id: string, patch: any): Promise<void>;
  delete(id: string): Promise<void>;

  // listing
  fetchCampaignOptions(): Promise<{ id: string; name: string; status: string }[]>;
  listenRealtime(cb: (rows: any[]) => void, limitN: number): Unsubscribe;
  fetchPage(limitN: number, cursor?: any): Promise<{ items: any[]; cursor?: any }>;

  // read single
  getById(id: string): Promise<any | null>;
}

export class FirestoreNotificationsRepo implements INotificationsRepo {
  constructor(private db: Firestore) {}

  async create(input: { title: string; body: string; target: any; scheduledAt?: any }) {
    const ref = await addDoc(collection(this.db, COLLECTIONS.NOTIFICATIONS), {
      title: (input.title ?? "").trim(),
      body: (input.body ?? "").trim(),
      target: input.target ?? null,
      // Firestore timestamp (server tarafında atılmasını istiyorsan UI’dan null bırakabilirsin)
      scheduledAt: input.scheduledAt ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { id: ref.id };
  }

  async update(id: string, patch: any) {
    const toUpdate: Record<string, any> = { updatedAt: serverTimestamp() };
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
      const data = d.data() as any;
      return {
        id: d.id,
        name: data?.name ?? "(İsimsiz)",
        status: data?.status ?? "",
      };
    });
  }

  listenRealtime(cb: (rows: any[]) => void, limitN: number) {
    const qy = query(
      collection(this.db, COLLECTIONS.NOTIFICATIONS),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    return onSnapshot(
      qy,
      (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))),
      (err) => {
        console.error("[NotificationsRepo.listenRealtime] error:", err);
        cb([]);
      }
    );
  }

  async fetchPage(limitN: number, cursor?: any) {
    let qy = query(
      collection(this.db, COLLECTIONS.NOTIFICATIONS),
      orderBy("createdAt", "desc"),
      limit(limitN)
    );
    if (cursor) qy = query(qy, startAfter(cursor));
    const snap = await getDocs(qy);
    const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
    const nextCursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : undefined;
    return { items, cursor: nextCursor };
  }

  async getById(id: string) {
    const s = await getDoc(doc(this.db, COLLECTIONS.NOTIFICATIONS, id));
    return s.exists() ? ({ id: s.id, ...(s.data() as any) }) : null;
  }
}
