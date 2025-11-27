// src/data/repositories/community.repo.ts
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
  setDoc,
  updateDoc,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";
import type { CommunityPost, Highlight } from "@/domain/community/post.types";
import { toCommunityPost, toHighlight } from "@/domain/community/post.mapper";
import { PAGE_20, RECENT_10 } from "@/constants/pagination";

// Firestore highlight dokümanı
export interface HighlightDoc {
  monthKey?: string;
  photoUrl?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
}

// Firestore community post dokümanı
export interface CommunityPostDoc {
  text?: string;
  photoUrl?: string;
  status?: string;
  createdBy?: string | null;
  createdByEmailLower?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface ICommunityRepo {
  // highlights
  setMonthlyHighlightUrl(monthKey: string, url: string): Promise<void>;
  addHighlightUrl(input: { monthKey: string; photoUrl: string }): Promise<string>;
  updateMonthlyHighlight(idOrMonthKey: string, patch: { photoUrl?: string }): Promise<void>;
  listenLatestHighlights(limitN: number, cb: (rows: Highlight[]) => void): Unsubscribe;
  deleteHighlight(idOrMonthKey: string): Promise<void>;

  // posts
  addPostUrl(input: {
    text?: string;
    photoUrl: string;
    createdBy?: string | null;
    createdByEmailLower?: string | null;
  }): Promise<string>;
  updatePost(id: string, patch: { text?: string; photoUrl?: string }): Promise<void>;
  listenPosts(limitN: number, cb: (rows: CommunityPost[]) => void): Unsubscribe;
  deletePost(id: string): Promise<void>;
}

export class FirestoreCommunityRepo implements ICommunityRepo {
  constructor(private db: Firestore) {}

  // ───────────── HIGHLIGHTS ─────────────
  async setMonthlyHighlightUrl(monthKey: string, url: string) {
    const ref = doc(this.db, COLLECTIONS.HIGHLIGHTS, monthKey);
    const snap = await getDoc(ref);

    const base: HighlightDoc = {
      monthKey,
      photoUrl: url.trim(),
      status: "active",
      updatedAt: serverTimestamp(),
    };

    if (!snap.exists()) {
      await setDoc(
        ref,
        { ...base, createdAt: serverTimestamp() } as HighlightDoc,
        { merge: true }
      );
    } else {
      const hasCreatedAt = !!(snap.data() as HighlightDoc)?.createdAt;
      const payload: HighlightDoc = hasCreatedAt
        ? base
        : { ...base, createdAt: serverTimestamp() };
      await setDoc(ref, payload, { merge: true });
    }
  }

  async addHighlightUrl(input: { monthKey: string; photoUrl: string }) {
    const payload: HighlightDoc = {
      monthKey: input.monthKey,
      photoUrl: input.photoUrl.trim(),
      status: "active",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const refDoc = await addDoc(collection(this.db, COLLECTIONS.HIGHLIGHTS), payload);
    return refDoc.id;
  }

  async updateMonthlyHighlight(idOrMonthKey: string, patch: { photoUrl?: string }) {
    const toUpdate: Partial<HighlightDoc> = { updatedAt: serverTimestamp() };
    if (typeof patch.photoUrl === "string") {
      toUpdate.photoUrl = patch.photoUrl.trim();
    }

    const tryId = doc(this.db, COLLECTIONS.HIGHLIGHTS, idOrMonthKey);
    const snap = await getDoc(tryId);
    if (snap.exists()) {
      await updateDoc(tryId, toUpdate);
      return;
    }
    await updateDoc(doc(this.db, COLLECTIONS.HIGHLIGHTS, idOrMonthKey), toUpdate);
  }

  listenLatestHighlights(limitN: number, cb: (rows: Highlight[]) => void): Unsubscribe {
    const colRef = collection(this.db, COLLECTIONS.HIGHLIGHTS);
    const n = Number.isFinite(limitN) && limitN > 0 ? limitN : RECENT_10;

    return onSnapshot(
      colRef,
      (snap) => {
        const all = snap.docs.map((d) =>
          toHighlight(d.id, d.data() as HighlightDoc)
        );
        // updatedAt → createdAt → monthKey(YYYY-MM)
        all.sort((a, b) => {
          const ta = a.updatedAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
          const tb = b.updatedAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
          if (tb !== ta) return tb - ta;
          return String(b.monthKey ?? "").localeCompare(String(a.monthKey ?? ""));
        });
        cb(all.slice(0, n));
      },
      (err) => {
        console.error("[CommunityRepo.listenLatestHighlights] error:", err);
        // Hata olsa bile UI'nin yükleniyor durumunda kalmaması için
        cb([]);
      }
    );
  }

  async deleteHighlight(idOrMonthKey: string) {
    const byId = doc(this.db, COLLECTIONS.HIGHLIGHTS, idOrMonthKey);
    const snap = await getDoc(byId);
    if (snap.exists()) {
      await deleteDoc(byId);
      return;
    }
    await deleteDoc(doc(this.db, COLLECTIONS.HIGHLIGHTS, idOrMonthKey));
  }

  // ───────────── POSTS ─────────────
  async addPostUrl(input: {
    text?: string;
    photoUrl: string;
    createdBy?: string | null;
    createdByEmailLower?: string | null;
  }) {
    const payload: CommunityPostDoc = {
      text: (input.text ?? "").trim(),
      photoUrl: input.photoUrl.trim(),
      status: "active",
      createdBy: input.createdBy ?? null,
      createdByEmailLower: input.createdByEmailLower ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const refDoc = await addDoc(
      collection(this.db, COLLECTIONS.COMMUNITY_POSTS),
      payload
    );
    return refDoc.id;
  }

  async updatePost(id: string, patch: { text?: string; photoUrl?: string }) {
    const toUpdate: Partial<CommunityPostDoc> = { updatedAt: serverTimestamp() };
    if (typeof patch.text === "string") toUpdate.text = patch.text.trim();
    if (typeof patch.photoUrl === "string") toUpdate.photoUrl = patch.photoUrl.trim();
    await updateDoc(doc(this.db, COLLECTIONS.COMMUNITY_POSTS, id), toUpdate);
  }

  listenPosts(limitN: number, cb: (rows: CommunityPost[]) => void): Unsubscribe {
    const safeLimit = Number.isFinite(limitN) && limitN > 0 ? limitN : PAGE_20;
    const qy = query(
      collection(this.db, COLLECTIONS.COMMUNITY_POSTS),
      orderBy("createdAt", "desc"),
      qLimit(safeLimit)
    );
    return onSnapshot(
      qy,
      (snap) => {
        const rows = snap.docs.map((d) =>
          toCommunityPost(d.id, d.data() as CommunityPostDoc)
        );
        cb(rows);
      },
      (err) => {
        console.error("[CommunityRepo.listenPosts] error:", err);
        // Hata durumunda da callback'i boş listeyle çağır
        cb([]);
      }
    );
  }

  async deletePost(id: string) {
    await deleteDoc(doc(this.db, COLLECTIONS.COMMUNITY_POSTS, id));
  }
}

// (opsiyonel) eski highlight kayıtlarına createdAt ekler
export async function backfillHighlightsCreatedAt(db: Firestore) {
  const snap = await getDocs(collection(db, COLLECTIONS.HIGHLIGHTS));
  let fixed = 0;
  await Promise.all(
    snap.docs.map(async (d) => {
      const data = d.data() as HighlightDoc;
      if (!("createdAt" in data)) {
        const patch: HighlightDoc = {
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        await updateDoc(doc(db, COLLECTIONS.HIGHLIGHTS, d.id), patch);
        fixed++;
      }
    })
  );
  return { fixed };
}
