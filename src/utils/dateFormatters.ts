// src/utils/dateFormatters.ts

// UI tarafında tarih olarak kullanabileceğimiz tüm "karışık" tipler:
export type FirestoreDateInput =
  | Date
  | null
  | undefined
  | { toDate?: () => Date }   // Firestore Timestamp
  | { seconds: number }       // Bazı custom timestamp objeleri
  | number                    // ms veya saniye timestamp
  | string;                   // ISO string vb.

/** Her şeyi güvenli şekilde Date'e çevirir (başarısızsa null döner) */
export const toDateSafe = (v: FirestoreDateInput): Date | null => {
  if (!v) return null;

  // Zaten Date ise
  if (v instanceof Date) return v;

  // Firestore Timestamp benzeri: { toDate() }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyVal: any = v;
  if (typeof anyVal?.toDate === "function") {
    try {
      return anyVal.toDate();
    } catch {
      return null;
    }
  }

  // Firestore tarzı { seconds: number }
  if (typeof anyVal?.seconds === "number") {
    return new Date(anyVal.seconds * 1000);
  }

  // Düz number: ms mi, saniye mi?
  if (typeof v === "number") {
    const isMillis = v > 1e12; // 1e12 ms ≈ 2001 yılı civarı
    return new Date(isMillis ? v : v * 1000);
  }

  // String ise Date'e parse etmeyi dene
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

/**
 * Firestore/Date karışık tipleri okunabilir tarihe çevirir.
 * Örn:  formatFirestoreDate(doc.createdAt) → "27.11.2025"
 */
export const formatFirestoreDate = (
  v: FirestoreDateInput,
  locale: string = "tr-TR",
  options?: Intl.DateTimeFormatOptions
): string => {
  const d = toDateSafe(v);
  if (!d) return "";
  return d.toLocaleDateString(locale, options);
};
