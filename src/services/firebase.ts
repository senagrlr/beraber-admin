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
  apiKey: "AIzaSyA5BOtIx2daIQaI5pBavx0H5Rm9zG2OgEg",
  authDomain: "beraber-app.firebaseapp.com",
  projectId: "beraber-app",
  storageBucket: "beraber-app.firebasestorage.app",
  messagingSenderId: "777997741491",
  appId: "1:777997741491:web:aa75e378d86442240fafc6",
  measurementId: "G-LJEL4JS7K0"
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
