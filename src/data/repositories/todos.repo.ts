// src\data\repositories\todos.repo.ts
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
  limit as qLimit,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";
import { PAGE_20 } from "@/constants/pagination";

// UI’nin beklediği basit Todo tipi
export type Todo = {
  id: string;
  text: string;
  done: boolean;
  createdAt?: any;
  updatedAt?: any;
};

export interface ITodosRepo {
  listenActive(cb: (rows: Todo[]) => void): Unsubscribe;
  listenAll(cb: (rows: Todo[]) => void): Unsubscribe;
  add(text: string): Promise<void>;
  toggle(todo: Todo): Promise<void>;
}

export class FirestoreTodosRepo implements ITodosRepo {
  constructor(private db: Firestore) {}

  listenActive(cb: (rows: Todo[]) => void): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.TODOS),
      where("done", "==", false),
      orderBy("createdAt", "desc"),
      qLimit(PAGE_20) // anlık dinlemeyi sınırlayalım
    );
    return onSnapshot(qy, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as Todo[];
      cb(rows);
    });
  }

  listenAll(cb: (rows: Todo[]) => void): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.TODOS),
      orderBy("createdAt", "desc"),
      qLimit(PAGE_20)
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
