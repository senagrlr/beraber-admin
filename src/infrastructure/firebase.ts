// src/infrastructure/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import {
  initializeFirestore,
  memoryLocalCache,
  persistentSingleTabManager,
  setLogLevel,
  clearIndexedDbPersistence,
} from "firebase/firestore";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getStorage } from "firebase/storage";

/** Vite env */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY!,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN!,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID!,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID!,
  appId: import.meta.env.VITE_FIREBASE_APP_ID!,
  ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID }
    : {}),
};

// Tekil app
export const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const isDev = !!import.meta.env.DEV;

/** App Check (reCAPTCHA v3) — initializeApp’tan hemen sonra */
declare global {
  interface Window {
    __APP_CHECK_INIT__?: boolean;
  }
}

(() => {
  if (typeof window === "undefined") return;
  if (window.__APP_CHECK_INIT__) return;
  window.__APP_CHECK_INIT__ = true;

  // Sadece DEV’te debug token kullan (prod’da .env’de tanımlama)
  if (isDev) {
    const debugToken = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN as string | undefined;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken || undefined;
  }

  const siteKey = import.meta.env.VITE_APPCHECK_KEY as string | undefined;
  if (!siteKey) return;

  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
})();

/** Firestore/Auth/Storage */
export const db = (() => {
  if (typeof window !== "undefined" && (window as any).__FIRE_DB__) {
    return (window as any).__FIRE_DB__;
  }
  const db = initializeFirestore(app, {
    localCache: isDev ? memoryLocalCache() : persistentSingleTabManager(),
    ignoreUndefinedProperties: true,
    // @ts-ignore – sdk versiyon farkı
    experimentalForceLongPolling: true,
    // @ts-ignore
    useFetchStreams: false,
  });
  try {
    (setLogLevel as any)?.("error");
  } catch {}
  if (typeof window !== "undefined") (window as any).__FIRE_DB__ = db;
  return db;
})();

export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const storage = getStorage(app);

/** IndexedDB cache temizleme helper */
export async function nukeFirestoreCache() {
  try {
    await clearIndexedDbPersistence(db);
  } catch {
    /* no-op */
  }
}
