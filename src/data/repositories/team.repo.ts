// src/data/repositories/team.repo.ts
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
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";

export type TeamMember = {
  id: string;
  name?: string;
  email?: string;
  emailLower?: string;
  phone?: string;
  role?: "admin" | "editor" | "viewer";
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export interface ITeamRepo {
  add(input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">): Promise<string>;
  update(id: string, patch: Partial<Omit<TeamMember, "id">>): Promise<void>;
  delete(id: string): Promise<void>;
  listActive(limitN: number): Promise<TeamMember[]>;
  listenActive(limitN: number, cb: (rows: TeamMember[]) => void): Unsubscribe;
  findByEmailLower(emailLower: string): Promise<TeamMember | null>;
}

export class FirestoreTeamRepo implements ITeamRepo {
  constructor(private db: Firestore) {}

  async add(input: Omit<TeamMember, "id" | "createdAt" | "updatedAt">) {
    const payload = {
      name: (input.name ?? "").trim(),
      email: (input.email ?? "").trim(),
      emailLower: (input.email ?? "").trim().toLowerCase(),
      phone: (input.phone ?? "").trim(),
      role: input.role ?? "viewer",
      active: input.active ?? true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(this.db, COLLECTIONS.TEAM_MEMBERS), payload);
    return ref.id;
  }

  async update(id: string, patch: Partial<Omit<TeamMember, "id">>) {
    const toUpdate: Record<string, any> = { updatedAt: serverTimestamp() };
    if (patch.name !== undefined) toUpdate.name = (patch.name ?? "").trim();
    if (patch.email !== undefined) {
      toUpdate.email = (patch.email ?? "").trim();
      toUpdate.emailLower = (patch.email ?? "").trim().toLowerCase();
    }
    if (patch.phone !== undefined) toUpdate.phone = (patch.phone ?? "").trim();
    if (patch.role !== undefined) toUpdate.role = patch.role;
    if (patch.active !== undefined) toUpdate.active = !!patch.active;
    await updateDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, id), toUpdate);
  }

  async delete(id: string) {
    await deleteDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, id));
  }

  async listActive(limitN: number) {
    // Indexli sürüm: active==true + orderBy(createdAt desc)
    const qy = query(
      collection(this.db, COLLECTIONS.TEAM_MEMBERS),
      where("active", "==", true),
      orderBy("createdAt", "desc"),
      qLimit(limitN)
    );
    try {
      const snap = await getDocs(qy);
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TeamMember[];
    } catch (e) {
      // Fallback (index yoksa): tümünü çek → filtrele/sırala → limit
      console.warn("[TeamRepo.listActive] index yok, fallback’a geçiliyor:", e);
      const allSnap = await getDocs(collection(this.db, COLLECTIONS.TEAM_MEMBERS));
      const all = allSnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TeamMember[];
      const filtered = all.filter((x) => x.active !== false);
      filtered.sort((a, b) => {
        const ao = (a as any).order ?? Number.POSITIVE_INFINITY;
        const bo = (b as any).order ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return (a.name ?? "").localeCompare(b.name ?? "", "tr");
      });
      return filtered.slice(0, limitN);
    }
  }

  listenActive(limitN: number, cb: (rows: TeamMember[]) => void) {
    const col = collection(this.db, COLLECTIONS.TEAM_MEMBERS);

    let off: Unsubscribe | null = null;

    // 1) Indexli dene
    const qIndexed = query(col, where("active", "==", true), orderBy("createdAt", "desc"), qLimit(limitN));
    off = onSnapshot(
      qIndexed,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TeamMember[];
        cb(rows);
      },
      (err) => {
        console.error("[TeamRepo.listenActive] indexli sorgu hata verdi, fallback’a geçiliyor:", err);
        try { off && off(); } catch {}

        // 2) Fallback: indexsiz — sadece active filtresi; sırayı client’ta ver
        const qIndexless = query(col, where("active", "==", true));
        off = onSnapshot(
          qIndexless,
          (snap) => {
            const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TeamMember[];
            all.sort((a, b) => {
              const ao = (a as any).order ?? Number.POSITIVE_INFINITY;
              const bo = (b as any).order ?? Number.POSITIVE_INFINITY;
              if (ao !== bo) return ao - bo;
              return (a.name ?? "").localeCompare(b.name ?? "", "tr");
            });
            cb(all.slice(0, limitN));
          },
          (err2) => {
            console.error("[TeamRepo.listenActive:fallback] hata:", err2);
            cb([]);
          }
        );
      }
    );

    // Dışarı tek unsubscribe ver
    return () => {
      try { off && off(); } catch {}
    };
  }

  // Hızlı yol: doc id = emailLower ise direkt oku; değilse sorgulara düş
  async findByEmailLower(emailLower: string) {
    const normalized = emailLower.trim().toLowerCase();

    // 0) Doc-by-id (en hızlı)
    try {
      const s = await getDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, normalized));
      if (s.exists()) {
        const x = s.data() as any;
        return { id: s.id, ...(x as any) } as TeamMember;
      }
    } catch (_) {
      // geç; sorgulara düşeceğiz
    }

    // 1) emailLower + active==true
    try {
      const q1 = query(
        collection(this.db, COLLECTIONS.TEAM_MEMBERS),
        where("emailLower", "==", normalized),
        where("active", "==", true),
        qLimit(1)
      );
      const s1 = await getDocs(q1);
      if (s1.size > 0) {
        const d = s1.docs[0];
        return { id: d.id, ...(d.data() as any) } as TeamMember;
      }
    } catch (_) {}

    // 2) sadece emailLower
    try {
      const q2 = query(
        collection(this.db, COLLECTIONS.TEAM_MEMBERS),
        where("emailLower", "==", normalized),
        qLimit(1)
      );
      const s2 = await getDocs(q2);
      if (s2.size > 0) {
        const d = s2.docs[0];
        return { id: d.id, ...(d.data() as any) } as TeamMember;
      }
    } catch (_) {}

    // 3) fallback: email eşitliği (eski veriler)
    try {
      const q3 = query(
        collection(this.db, COLLECTIONS.TEAM_MEMBERS),
        where("email", "==", emailLower.trim()),
        qLimit(1)
      );
      const s3 = await getDocs(q3);
      if (s3.size > 0) {
        const d = s3.docs[0];
        return { id: d.id, ...(d.data() as any) } as TeamMember;
      }
    } catch (_) {}

    return null;
  }
}
