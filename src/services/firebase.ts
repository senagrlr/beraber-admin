// src/services/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  memoryLocalCache,
  persistentSingleTabManager,
  // bazı sürümlerde mevcut; yoksa TS için problem değil
  setLogLevel,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Tekil app (HMR/StrictMode çoğalmasını engelle)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Dev/Prod bayrağı
const isDev = import.meta.env?.DEV === true;

// 🔧 Firestore — DEV: RAM cache (+ long polling), PROD: single-tab kalıcı cache
export const db = (() => {
  // Tarafımızdan tekil kalsın diye pencereye pin’liyoruz
  if (typeof window !== "undefined" && (window as any).__FIRE_DB__) {
    return (window as any).__FIRE_DB__;
  }

  const db = initializeFirestore(app, {
    localCache: isDev
      ? memoryLocalCache()                 // DEV: HMR ile güvenli
      : persistentSingleTabManager(),      // PROD: tek sekme kalıcı cache
    ignoreUndefinedProperties: true,
    // Ağ/proxy ve 400/transport hataları için güvenli seçimler:
    // @ts-ignore opsiyon isimleri sürüme göre değişebiliyor
    experimentalForceLongPolling: true,
    // @ts-ignore
    useFetchStreams: false,
  });

  try {
    // Gürültüyü azalt
    (setLogLevel as any)?.("error");
  } catch {}

  if (typeof window !== "undefined") (window as any).__FIRE_DB__ = db;
  return db;
})();

// Auth + kalıcı oturum
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Storage
export const storage = getStorage(app);

// 🧹 Bozulmuş IndexedDB cache’i temizlemek için helper
export async function nukeFirestoreCache() {
  try {
    await clearIndexedDbPersistence(db);
    // Not: aktif listener varken çalışmaz; çalışmadıysa DevTools > Application > Clear site data ile temizle.
  } catch (e) {
    console.warn("Cache temizlenemedi (aktif listener olabilir):", e);
  }
}
