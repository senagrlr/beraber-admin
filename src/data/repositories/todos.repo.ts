// src/data/repositories/todos.repo.ts
import {
  addDoc,
  collection,
  doc,
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

// UI’nin beklediği basit Todo tipi
export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export interface ITodosRepo {
  /** Yalnızca tamamlanmamış görevleri dinle (realtime) */
  listenActive(cb: (rows: Todo[]) => void): Unsubscribe;

  /** Tüm görevleri (aktif + tamamlanmış) dinle (realtime) */
  listenAll(cb: (rows: Todo[]) => void): Unsubscribe;

  /** Yeni todo ekle (başlangıçta done=false) */
  add(text: string): Promise<void>;

  /** done flag’ini tersine çevir (UI toggle) */
  toggle(todo: Todo): Promise<void>;
}

export class FirestoreTodosRepo implements ITodosRepo {
  constructor(private db: Firestore) {}

  listenActive(cb: (rows: Todo[]) => void): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.TODOS),
      where("done", "==", false),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Todo[];
      cb(rows);
    });
  }

  listenAll(cb: (rows: Todo[]) => void): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.TODOS),
      orderBy("createdAt", "desc")
    );
    return onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Todo[];
      cb(rows);
    });
  }

  async add(text: string): Promise<void> {
    await addDoc(collection(this.db, COLLECTIONS.TODOS), {
      text: (text ?? "").trim(),
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async toggle(todo: Todo): Promise<void> {
    await updateDoc(doc(this.db, COLLECTIONS.TODOS, todo.id), {
      done: !todo.done,
      updatedAt: serverTimestamp(),
    });
  }
}
