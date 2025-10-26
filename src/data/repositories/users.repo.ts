// src/data/repositories/users.repo.ts
import { collection, doc, getDoc, getDocs, limit, query, where, type Firestore } from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";

export interface IUsersRepo {
  /** team_members: emailLower + active == true */
  isWhitelisted(emailLower: string): Promise<boolean>;
  /** users/{uid}.role */
  getUserRole(uid: string): Promise<"admin" | "user" | null>;
}

export class FirestoreUsersRepo implements IUsersRepo {
  constructor(private db: Firestore) {}

  async isWhitelisted(emailLower: string): Promise<boolean> {
    if (!emailLower) return false;
    try {
      const qy = query(
        collection(this.db, COLLECTIONS.TEAM_MEMBERS),
        where("emailLower", "==", emailLower),
        where("active", "==", true),
        limit(1)
      );
      const snap = await getDocs(qy);
      return snap.size > 0;
    } catch {
      // index eksikse false’a düşer; guard diğer yollarla devam eder
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
