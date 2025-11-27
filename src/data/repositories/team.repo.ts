// src/data/repositories/team.repo.ts
import {
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
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";
import { PAGE_20 } from "@/constants/pagination";

/** Tek tip rol seti */
export type TeamRole = "admin" | "editor" | "viewer";

export type TeamMember = {
  id: string;                 // doc id = emailLower
  email: string;              // emailLower ile aynı değeri tutar
  name?: string | null;
  phone?: string | null;
  roles: TeamRole[];          // ["admin"] | ["editor"] | ["viewer"]
  active: boolean;
  createdAt?: any;
  updatedAt?: any;
  createdBy?: string | null;  // ekleyen admin uid
};

/** Firestore dokümanı (id hariç) */
export type TeamMemberDoc = Omit<TeamMember, "id">;

/** Yazma / güncelleme / silme operasyonları */
export interface ITeamWriter {
  upsertByEmailLower(
    emailLower: string,
    payload: Omit<TeamMember, "id" | "createdAt" | "updatedAt">
  ): Promise<void>;
  update(id: string, patch: Partial<Omit<TeamMember, "id">>): Promise<void>;
  delete(id: string): Promise<void>;
}

/** Okuma / listeleme / arama operasyonları */
export interface ITeamReader {
  listActive(limitN: number): Promise<TeamMember[]>;
  listenActive(limitN: number, cb: (rows: TeamMember[]) => void): Unsubscribe;
  findByEmailLower(emailLower: string): Promise<TeamMember | null>;
}

/** Geriye dönük uyum için birleşik interface */
export interface ITeamRepo extends ITeamWriter, ITeamReader {}

export class FirestoreTeamRepo implements ITeamRepo {
  constructor(private db: Firestore) {}

  async upsertByEmailLower(
    emailLower: string,
    payload: Omit<TeamMember, "id" | "createdAt" | "updatedAt">
  ) {
    const id = emailLower.trim().toLowerCase();
    const ref = doc(this.db, COLLECTIONS.TEAM_MEMBERS, id);

    const exists = (await getDoc(ref)).exists();

    const base: TeamMemberDoc = {
      email: id,
      name: payload.name ?? null,
      phone: payload.phone ?? null,
      roles: (payload.roles?.length ? payload.roles : ["editor"]) as TeamRole[],
      active: payload.active ?? true,
      createdBy: payload.createdBy ?? null,
      updatedAt: serverTimestamp(),
      ...(exists ? {} : { createdAt: serverTimestamp() }),
    };

    await setDoc(ref, base, { merge: true });
  }

  async update(id: string, patch: Partial<Omit<TeamMember, "id">>) {
    const toUpdate: Partial<TeamMemberDoc> = { updatedAt: serverTimestamp() };
    if (patch.name !== undefined) toUpdate.name = (patch.name ?? "").trim() || null;
    if (patch.phone !== undefined) toUpdate.phone = (patch.phone ?? "").trim() || null;
    if (patch.roles !== undefined) toUpdate.roles = patch.roles;
    if (patch.active !== undefined) toUpdate.active = !!patch.active;
    await updateDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, id), toUpdate);
  }

  async delete(id: string) {
    await deleteDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, id));
  }

  async listActive(limitN: number) {
    const n = Number.isFinite(limitN) && limitN > 0 ? limitN : PAGE_20;
    const col = collection(this.db, COLLECTIONS.TEAM_MEMBERS);
    const qy = query(col, where("active", "==", true), orderBy("createdAt", "desc"), qLimit(n));
    try {
      const snap = await getDocs(qy);
      return snap.docs.map((d) => {
        const data = d.data() as TeamMemberDoc;
        return { id: d.id, ...data };
      });
    } catch (e) {
      console.warn("[TeamRepo.listActive] index yok (fallback):", e);
      const allSnap = await getDocs(col);
      const all = allSnap.docs.map((d) => {
        const data = d.data() as TeamMemberDoc;
        return { id: d.id, ...data };
      });
      const filtered = all.filter((x) => x.active !== false);
      filtered.sort((a, b) => {
        const ad = a.createdAt?.toMillis?.() ?? 0;
        const bd = b.createdAt?.toMillis?.() ?? 0;
        return bd - ad; // desc
      });
      return filtered.slice(0, n);
    }
  }

  listenActive(limitN: number, cb: (rows: TeamMember[]) => void) {
    const n = Number.isFinite(limitN) && limitN > 0 ? limitN : PAGE_20;
    const col = collection(this.db, COLLECTIONS.TEAM_MEMBERS);
    const qIndexed = query(col, where("active", "==", true), orderBy("createdAt", "desc"), qLimit(n));
    let off: Unsubscribe | null = null;

    off = onSnapshot(
      qIndexed,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const data = d.data() as TeamMemberDoc;
          return { id: d.id, ...data };
        });
        cb(rows);
      },
      (err) => {
        console.error("[TeamRepo.listenActive] indexli sorgu hata:", err);
        try { off && off(); } catch {}

        const qIndexless = query(col, where("active", "==", true));
        off = onSnapshot(
          qIndexless,
          (snap2) => {
            const rows = snap2.docs.map((d) => {
              const data = d.data() as TeamMemberDoc;
              return { id: d.id, ...data };
            });
            rows.sort((a, b) => {
              const ad = a.createdAt?.toMillis?.() ?? 0;
              const bd = b.createdAt?.toMillis?.() ?? 0;
              return bd - ad;
            });
            cb(rows.slice(0, n));
          },
          (err2) => {
            console.error("[TeamRepo.listenActive:fallback] hata:", err2);
            cb([]);
          }
        );
      }
    );

    return () => {
      try { off && off(); } catch {}
    };
  }

  async findByEmailLower(emailLower: string) {
    const id = emailLower.trim().toLowerCase();
    try {
      const s = await getDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, id));
      if (s.exists()) {
        const data = s.data() as TeamMemberDoc;
        return { id: s.id, ...data } as TeamMember;
      }
    } catch {}

    try {
      const s2 = await getDocs(
        query(collection(this.db, COLLECTIONS.TEAM_MEMBERS), where("email", "==", id), qLimit(1))
      );
      if (s2.size > 0) {
        const d = s2.docs[0];
        const data = d.data() as TeamMemberDoc;
        return { id: d.id, ...data } as TeamMember;
      }
    } catch {}

    return null;
  }
}
