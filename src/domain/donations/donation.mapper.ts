// src\domain\donations\donation.mapper.ts
// Tipleri schema dosyasından import ediyoruz
import type { Donation } from "./donation.schema";
import { DONATION_CATEGORIES } from "./donation.schema";

/** Firestore Timestamp | string | number (seconds) | Date -> Date */
const toDate = (v: any | undefined): Date | undefined => {
  if (!v) return undefined;
  // Firestore Timestamp ise .toDate() kullan
  if (typeof v?.toDate === "function") return v.toDate();
  // Zaten Date ise doğrudan döndür
  if (v instanceof Date) return v;
  // Sayı ise (genelde saniye) milisaniyeye çevir
  if (typeof v === 'number') return new Date(v * 1000);
  // String ise Date'e çevir
  if (typeof v === 'string') {
      try {
          const d = new Date(v);
          // Geçersiz tarih kontrolü
          if (isNaN(d.getTime())) return undefined;
          return d;
      } catch { return undefined; }
  }
  return undefined;
};

/** Firestore doc -> Domain Tipi (Donation) */
export const toDonation = (id: string, doc: any): Donation => {
    // Güvenli okuma için varsayılan değerler
    const name = String(doc?.name ?? "");
    const category = doc?.category ?? "";
    const status = doc?.status ?? "active";

    return {
      id,
      name,
      nameLower: name.toLowerCase(), // nameLower alanı eklendi
      amount: Number(doc?.amount ?? 0),
      // Kategori enum tipine uygunluk kontrolü
      category: DONATION_CATEGORIES.includes(category)
                ? category
                : DONATION_CATEGORIES[6], // Fallback: "Temel İhtiyaç Yardımı" (veya istediğiniz başka bir varsayılan)
      description: doc?.description || undefined,
      // Status enum tipine uygunluk kontrolü
      status: ["active", "completed", "photo_pending", "deleted"].includes(status)
              ? status
              : "active", // Fallback: "active"
      collected: Number(doc?.collected ?? 0),
      createdAt: toDate(doc?.createdAt),
      updatedAt: toDate(doc?.updatedAt),
      createdBy: doc?.createdBy || undefined,
      photoUrl: doc?.photoUrl || undefined,
    };
};

/** Domain write objesi -> Firestore'a yazılacak obje */
export const fromDonationWrite = (payload: DonationWrite) => ({
  name: payload.name.trim(),
  nameLower: payload.name.trim().toLowerCase(), // nameLower alanı eklendi
  amount: Number(payload.amount),
  category: payload.category,
  description: (payload.description ?? "").trim(),
});

// Hatırlatma: src/domain/donations/index.ts dosyasının
// export type { Donation, DonationWrite } from "./donation.schema";
// satırını içerdiğinden emin ol. donation.types.ts dosyasını silebilirsin.