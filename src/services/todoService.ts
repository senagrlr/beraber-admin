import { db, auth } from "../services/firebase";
import type { Todo } from "../types/Todo";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { COLLECTIONS } from "../constants/firestore";

/** Firestore koleksiyon referansı */
const todosCol = collection(db, COLLECTIONS.TODOS);

/** Firestore -> Todo map helper */
function mapTodo(snap: any): Todo {
  const d = snap.data() || {};
  return {
    id: snap.id,
    text: (d.text ?? "") as string,
    done: Boolean(d.done),
    createdAt: (d.createdAt ?? null) as Timestamp | null,
    completedAt: (d.completedAt ?? null) as Timestamp | null,
    createdBy: d.createdBy as string | undefined,
  };
}

/**
 * Yeni görev ekle
 * - Kullanıcı yoksa hata fırlat (kurallarla tutarlı)
 */
export async function addTodo(text: string): Promise<void> {
  const user = auth.currentUser;
  if (!user?.uid) throw new Error("Giriş yapmadan görev eklenemez.");
  await addDoc(todosCol, {
    text,
    done: false,
    createdAt: serverTimestamp(),
    completedAt: null,
    createdBy: user.uid,
  });
}

/**
 * Görevi tamamla / geri al
 */
export async function toggleTodo(todo: Todo): Promise<void> {
  const ref = doc(db, COLLECTIONS.TODOS, todo.id);
  const willBeDone = !todo.done;

  await updateDoc(ref, {
    done: willBeDone,
    completedAt: willBeDone ? serverTimestamp() : null,
  });
}

/**
 * Aktif görevleri gerçek zamanlı izle (yalnızca currentUser’a ait)
 *
 * 🔹 Kompozit index istememek için Firestore'da SIRALAMA YAPMIYORUZ.
 * where('createdBy'=='uid') + limit(100) ile çekip
 * client-side DESC sıralıyoruz. Böylece
 * “The query requires an index” uyarısı kesilir.
 *
 * 🔹 useEffect içinde aç → return () => unsub() ile kapat.
 */
export function watchActiveTodos(
  onChange: (todos: Todo[]) => void
): () => void {
  const uid = auth.currentUser?.uid ?? "__no_user__";
  const q = query(
    todosCol,
    where("createdBy", "==", uid),
    limit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const all = snap.docs.map(mapTodo);
      // createdAt DESC (client-side)
      all.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      );
      const actives = all.filter((t) => !t.done).slice(0, 10);
      onChange(actives);
    },
    (err) => {
      console.error("[watchActiveTodos] ERROR:", err);
      onChange([]);
    }
  );
}

/**
 * Tüm görevleri (aktif + tamamlanan) gerçek zamanlı izle
 * - Yine index gerektirmemek için Firestore orderBy KULLANMIYORUZ.
 * - Client-side createdAt DESC yapıyoruz.
 */
export function watchAllTodos(
  onChange: (todos: Todo[]) => void
): () => void {
  const uid = auth.currentUser?.uid ?? "__no_user__";
  const q = query(
    todosCol,
    where("createdBy", "==", uid),
    limit(100)
  );

  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map(mapTodo);
      list.sort(
        (a, b) =>
          (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      );
      onChange(list);
    },
    (err) => {
      console.error("[watchAllTodos] ERROR:", err);
      onChange([]);
    }
  );
}
