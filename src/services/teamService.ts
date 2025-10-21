import { db } from "./firebase";
import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { COLLECTIONS } from "../constants/firestore";

export type TeamMember = {
  id?: string;          // Firestore doc id (UID)
  name: string;
  email: string;        // orijinal e-posta
  emailLower?: string;  // normalleştirilmiş e-posta (opsiyonel)
  phone?: string;
  role?: string;        // "Admin", "Gönüllü" vb.
  isAdmin?: boolean;    // opsiyonel alan
  active?: boolean;     // whitelist: true/undefined = izinli, false = engelli
  order?: number;       // listeleme sırası (opsiyonel)
};

/** Ekip listesini sırayla getirir; index yoksa client-side sıralar. */
export async function fetchTeamMembers(): Promise<TeamMember[]> {
  try {
    const qy = query(collection(db, COLLECTIONS.TEAM_MEMBERS), orderBy("order", "asc"));
    const snap = await getDocs(qy);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TeamMember[];
  } catch {
    const snap = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as TeamMember[];
    rows.sort(
      (a, b) =>
        (a.order ?? Number.POSITIVE_INFINITY) - (b.order ?? Number.POSITIVE_INFINITY)
    );
    return rows;
  }
}

/**
 * UID ile tek atışta ekip üyesi getirir.
 * Doküman ID'si = UID olduğundan en doğru yöntem budur.
 */
export async function getTeamMemberByUid(uid: string): Promise<TeamMember | null> {
  if (!uid) return null;
  const ref = doc(db, COLLECTIONS.TEAM_MEMBERS, uid);
  const s = await getDoc(ref);
  if (!s.exists()) return null;
  return { id: s.id, ...(s.data() as any) } as TeamMember;
}

/**
 * Kullanıcı izinli mi? (UID’e göre)
 * - Doküman varsa ve active !== false ise true kabul ederiz.
 * - Doküman yoksa false.
 */
export async function isUserAllowed(uid: string): Promise<boolean> {
  const m = await getTeamMemberByUid(uid);
  if (!m) return false;
  return m.active === undefined ? true : !!m.active;
}

/**
 * E-posta whitelist kontrolü (geri uyumluluk – UID’e göre değil).
 * Küçük dataset’te çalışır; mümkün olduğunda isUserAllowed(uid) kullan.
 */
export async function isEmailAllowed(emailRaw: string): Promise<boolean> {
  const raw = (emailRaw || "").trim();
  const normalized = raw.toLowerCase();
  if (!normalized) return false;

  // 1) emailLower ile kontrol
  try {
    const q1 = query(
      collection(db, COLLECTIONS.TEAM_MEMBERS),
      where("emailLower", "==", normalized),
      limit(1)
    );
    const s1 = await getDocs(q1);
    if (s1.size > 0) {
      const data = s1.docs[0].data() as any;
      return data.active === undefined ? true : !!data.active;
    }
  } catch {
    // pas
  }

  // 2) email ile kontrol
  try {
    const q2 = query(
      collection(db, COLLECTIONS.TEAM_MEMBERS),
      where("email", "==", raw),
      limit(1)
    );
    const s2 = await getDocs(q2);
    if (s2.size > 0) {
      const data = s2.docs[0].data() as any;
      return data.active === undefined ? true : !!data.active;
    }
  } catch {
    // pas
  }

  // 3) full-scan fallback
  try {
    const snap = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
    for (const d of snap.docs) {
      const m = d.data() as TeamMember;
      const stored = (m.emailLower ?? m.email ?? "")
        .toString()
        .trim()
        .toLowerCase();
      if (stored === normalized) {
        return m.active === undefined ? true : !!m.active;
      }
    }
  } catch {
    // pas
  }

  return false;
}

/** Debug: tüm team_members’ı logla */
export async function debugListTeamMembers(): Promise<void> {
  const snap = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
  console.log("[debugListTeamMembers] count:", snap.size);
  for (const d of snap.docs) {
    console.log(" -", d.id, d.data());
  }
}

/** Debug: e-posta ile üye getir (geri uyumluluk); mümkünse getTeamMemberByUid kullan */
export async function getTeamMemberByEmail(email: string): Promise<TeamMember | null> {
  const raw = (email || "").trim();
  const normalized = raw.toLowerCase();
  try {
    const q1 = query(
      collection(db, COLLECTIONS.TEAM_MEMBERS),
      where("emailLower", "==", normalized),
      limit(1)
    );
    const s1 = await getDocs(q1);
    if (s1.size > 0) return { id: s1.docs[0].id, ...(s1.docs[0].data() as any) } as TeamMember;

    const q2 = query(
      collection(db, COLLECTIONS.TEAM_MEMBERS),
      where("email", "==", raw),
      limit(1)
    );
    const s2 = await getDocs(q2);
    if (s2.size > 0) return { id: s2.docs[0].id, ...(s2.docs[0].data() as any) } as TeamMember;

    const all = await getDocs(collection(db, COLLECTIONS.TEAM_MEMBERS));
    for (const d of all.docs) {
      const m = d.data() as TeamMember;
      const stored = (m.emailLower ?? m.email ?? "")
        .toString()
        .trim()
        .toLowerCase();
      if (stored === normalized) return { id: d.id, ...(m as any) };
    }
  } catch {
    // pas
  }
  return null;
}
