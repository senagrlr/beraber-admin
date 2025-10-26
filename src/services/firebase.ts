// src/services/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  initializeFirestore,
  memoryLocalCache,
  persistentSingleTabManager,
  setLogLevel,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

/** Vite env — eksikse derhal belli olsun */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: import.meta.env.VITE_FIREBASE_APP_ID!,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Tekil app (HMR/StrictMode çoğalmasını engelle)
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Dev/Prod bayrağı
const isDev = !!import.meta.env.DEV;

/** Firestore — DEV: RAM cache (+ long polling), PROD: single-tab kalıcı cache */
export const db = (() => {
  // SSR ve HMR güvenliği: aynı instansı paylaş
  if (typeof window !== "undefined" && (window as any).__FIRE_DB__) {
    return (window as any).__FIRE_DB__;
  }

  const db = initializeFirestore(app, {
    localCache: isDev ? memoryLocalCache() : persistentSingleTabManager(),
    ignoreUndefinedProperties: true,
    // Sürüm farklarında isimler değişebiliyor; TS uyarısı bastırılıyor
    // @ts-ignore
    experimentalForceLongPolling: true,
    // @ts-ignore
    useFetchStreams: false,
  });

  try {
    (setLogLevel as any)?.("error"); // gürültüyü azalt
  } catch {
    /* no-op */
  }

  if (typeof window !== "undefined") (window as any).__FIRE_DB__ = db;
  return db;
})();

// Auth + kalıcı oturum
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});

// Storage
export const storage = getStorage(app);

/** Bozulmuş IndexedDB cache’i temizlemek için helper */
export async function nukeFirestoreCache() {
  try {
    await clearIndexedDbPersistence(db);
    // Not: aktif listener varken çalışmaz.
  } catch (e) {
    console.warn("Cache temizlenemedi (aktif listener olabilir):", e);
  }
}
