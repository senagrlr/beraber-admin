import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as qLimit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";

export interface IUsersRepo {
  /** team_members: emailLower (doc id) + active == true */
  isWhitelisted(emailLower: string): Promise<boolean>;
  /** users/{uid}.role */
  getUserRole(uid: string): Promise<"admin" | "user" | null>;
}

export class FirestoreUsersRepo implements IUsersRepo {
  constructor(private db: Firestore) {}

  async isWhitelisted(emailLower: string): Promise<boolean> {
    const id = (emailLower || "").trim().toLowerCase();
    if (!id) return false;

    // 1) Önce doc id == emailLower (normalize edilmiş) kontrolü
    try {
      const s = await getDoc(doc(this.db, COLLECTIONS.TEAM_MEMBERS, id));
      if (s.exists()) {
        const d = s.data() as any;
        return d?.active === true;
      }
    } catch {
      /* yoksay */
    }

    // 2) Eski veri düzeni için fallback: email alanına bak
    try {
      const qy = query(
        collection(this.db, COLLECTIONS.TEAM_MEMBERS),
        where("email", "==", id),
        where("active", "==", true),
        qLimit(1)
      );
      const snap = await getDocs(qy);
      return snap.size > 0;
    } catch {
      return false;
    }
  }

  async getUserRole(uid: string): Promise<"admin" | "user" | null> {
    try {
      const s = await getDoc(doc(this.db, COLLECTIONS.USERS, uid));
      if (!s.exists()) return null;
      const role = (s.data() as any)?.role;
      return role === "admin" ? "admin" : role === "user" ? "user" : null;
    } catch {
      return null;
    }
  }
}
