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
  limit as qLimit,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import { COLLECTIONS } from "@/constants/firestore";
import { PAGE_20 } from "@/constants/pagination";
import type { Todo, TodoDoc } from "@/domain/todos/todo.schema";

/** Okuma / dinleme tarafı */
export interface ITodosReader {
  listenActive(cb: (rows: Todo[]) => void): Unsubscribe;
  listenAll(cb: (rows: Todo[]) => void): Unsubscribe;
}

/** Yazma / güncelleme tarafı */
export interface ITodosWriter {
  add(text: string): Promise<void>;
  toggle(todo: Todo): Promise<void>;
}

/** Geriye dönük uyum için birleşik interface */
export interface ITodosRepo extends ITodosReader, ITodosWriter {}

export class FirestoreTodosRepo implements ITodosRepo {
  constructor(private db: Firestore) {}

  listenActive(cb: (rows: Todo[]) => void): Unsubscribe {
    const qy = query(
      collection(this.db, COLLECTIONS.TODOS),
      where("done", "==", false),
      orderBy("createdAt", "desc"),
      qLimit(PAGE_20)
    );
    return onSnapshot(qy, (snap) => {
      const rows: Todo[] = snap.docs.map((d) => {
        const data = d.data() as TodoDoc;
        return { id: d.id, ...data };
      });
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
      const rows: Todo[] = snap.docs.map((d) => {
        const data = d.data() as TodoDoc;
        return { id: d.id, ...data };
      });
      cb(rows);
    });
  }

  async add(text: string): Promise<void> {
    const payload: TodoDoc = {
      text: (text ?? "").trim(),
      done: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await addDoc(collection(this.db, COLLECTIONS.TODOS), payload);
  }

  async toggle(todo: Todo): Promise<void> {
    await updateDoc(doc(this.db, COLLECTIONS.TODOS, todo.id), {
      done: !todo.done,
      updatedAt: serverTimestamp(),
    });
  }
}
