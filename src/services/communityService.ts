// src\services\communityService.ts
import { db, storage } from "./firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { COLLECTIONS } from "../constants/firestore";

/** Storage klasörleri */
const HIGHLIGHTS_FOLDER = "community_highlights";
const POSTS_FOLDER = "community_posts";

/** Tipler */
export type BeraberdeDoc = {
  id: string;
  monthKey?: string;
  photoUrl?: string;
  createdAt?: any;
  updatedAt?: any;
};

export type ToplulukDoc = {
  id: string;
  text?: string;
  photoUrl?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
};

/** YYYY-MM biçiminde ay anahtarı */
const monthKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/* ──────────────────────────────
   BERABER’DE BU AY (HIGHLIGHTS)
   ────────────────────────────── */

/** Bu ayın görselini YÜKLE + doc yaz (doc id = YYYY-MM) */
export async function setMonthlyHighlight(file: File) {
  const key = monthKey();
  const storageRef = ref(storage, `${HIGHLIGHTS_FOLDER}/${key}/${file.name}`);
  await uploadBytes(storageRef, file);
  const photoUrl = await getDownloadURL(storageRef);

  await setDoc(
    doc(db, COLLECTIONS.HIGHLIGHTS, key),
    {
      monthKey: key,
      photoUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { monthKey: key, photoUrl };
}

/** Var olan bir ayın görselini **dosya** ile güncelle */
export async function updateMonthlyHighlightWithFile(monthKeyStr: string, file: File) {
  const storageRef = ref(storage, `${HIGHLIGHTS_FOLDER}/${monthKeyStr}/${file.name}`);
  await uploadBytes(storageRef, file);
  const photoUrl = await getDownloadURL(storageRef);

  await updateDoc(doc(db, COLLECTIONS.HIGHLIGHTS, monthKeyStr), {
    photoUrl,
    updatedAt: serverTimestamp(),
  });

  return { monthKey: monthKeyStr, photoUrl };
}

/** Var olan bir highlight’ı **URL yazarak** güncelle (dosya yok) */
export async function updateMonthlyHighlight(monthKeyStr: string, payload: { photoUrl?: string }) {
  const toUpdate: Record<string, any> = { updatedAt: serverTimestamp() };
  if (typeof payload.photoUrl === "string") toUpdate.photoUrl = payload.photoUrl;
  await updateDoc(doc(db, COLLECTIONS.HIGHLIGHTS, monthKeyStr), toUpdate);
  return { id: monthKeyStr, ...toUpdate };
}

/** En güncel N highlight (liste) */
export async function fetchLatestHighlights(limitN = 10) {
  const qy = query(collection(db, COLLECTIONS.HIGHLIGHTS), orderBy("createdAt", "desc"), limit(limitN));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as BeraberdeDoc[];
}

/** En güncel tek highlight (widget için) */
export async function fetchLatestHighlight() {
  const list = await fetchLatestHighlights(1);
  return list[0] ?? null;
}

/** Realtime: son N highlight dinle */
export function listenLatestHighlights(limitN = 10, cb: (rows: BeraberdeDoc[]) => void) {
  const qy = query(collection(db, COLLECTIONS.HIGHLIGHTS), orderBy("createdAt", "desc"), limit(limitN));
  return onSnapshot(
    qy,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as BeraberdeDoc[]),
    (err) => console.error("[listenLatestHighlights] error:", err)
  );
}

/** Highlight sil */
export async function deleteHighlight(monthKeyStr: string) {
  await deleteDoc(doc(db, COLLECTIONS.HIGHLIGHTS, monthKeyStr));
}

/* ──────────────────────────────
   TOPLULUK GÖNDERİLERİ (POSTS)
   ────────────────────────────── */

/** Yeni gönderi (foto **zorunlu**, metin opsiyonel) */
export async function addCommunityPost({ text, file }: { text?: string; file: File }) {
  const tmpRef = await addDoc(collection(db, COLLECTIONS.COMMUNITY_POSTS), {
    text: text ?? "",
    photoUrl: "",
    status: "active",
    createdAt: serverTimestamp(),
  });

  const storageRef = ref(storage, `${POSTS_FOLDER}/${tmpRef.id}/${file.name}`);
  await uploadBytes(storageRef, file);
  const photoUrl = await getDownloadURL(storageRef);

  await updateDoc(tmpRef, {
    photoUrl,
    updatedAt: serverTimestamp(),
  });

  return { id: tmpRef.id, photoUrl };
}

/** Gönderiyi güncelle:
 * - Sadece metin değişecekse: { text }
 * - Mevcut URL’yi elle değiştireceksen: { photoUrl }
 * - Yeni dosya yüklenecekse: { file }
 */
export async function updateCommunityPost(
  id: string,
  payload: { text?: string; photoUrl?: string; file?: File }
) {
  let nextPhotoUrl: string | undefined = payload.photoUrl;

  // Dosya verilmişse Storage’a yükle, downloadURL al
  if (payload.file) {
    const storageRef = ref(storage, `${POSTS_FOLDER}/${id}/${payload.file.name}`);
    await uploadBytes(storageRef, payload.file);
    nextPhotoUrl = await getDownloadURL(storageRef);
  }

  const toUpdate: Record<string, any> = { updatedAt: serverTimestamp() };
  if (typeof payload.text === "string") toUpdate.text = payload.text;
  if (typeof nextPhotoUrl === "string") toUpdate.photoUrl = nextPhotoUrl;

  await updateDoc(doc(db, COLLECTIONS.COMMUNITY_POSTS, id), toUpdate);
  return { id, ...toUpdate };
}

/** Gönderi sil */
export async function deleteCommunityPost(id: string) {
  await deleteDoc(doc(db, COLLECTIONS.COMMUNITY_POSTS, id));
}

/** Son N gönderi (liste) */
export async function fetchCommunityPosts(limitN = 10) {
  const qy = query(collection(db, COLLECTIONS.COMMUNITY_POSTS), orderBy("createdAt", "desc"), limit(limitN));
  const snap = await getDocs(qy);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ToplulukDoc[];
}

/** Realtime: son N gönderi dinle */
export function listenCommunityPosts(limitN = 10, cb: (rows: ToplulukDoc[]) => void) {
  const qy = query(collection(db, COLLECTIONS.COMMUNITY_POSTS), orderBy("createdAt", "desc"), limit(limitN));
  return onSnapshot(
    qy,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ToplulukDoc[]),
    (err) => console.error("[listenCommunityPosts] error:", err)
  );
}

/* ──────────────────────────────
   GERİYE UYUMLULUK (alias’lar)
   ──────────────────────────────
   Mevcut component’lerin beklediği isimlerle export ediyoruz.
*/

// Beraberde Bu Ay (Highlights)
export const listenLastBeraberde = listenLatestHighlights;
export async function updateBeraberde(id: string, payload: { photoUrl?: string }) {
  return updateMonthlyHighlight(id, payload); // string URL güncelleme
}
export const deleteBeraberde = deleteHighlight;

// Topluluk (Posts)
export const listenLastTopluluk = listenCommunityPosts;
export async function updateTopluluk(
  id: string,
  payload: { text?: string; photoUrl?: string; file?: File }
) {
  return updateCommunityPost(id, payload);
}
export const deleteTopluluk = deleteCommunityPost;


