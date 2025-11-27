// src/domain/donations/donation.mapper.ts
import type { Donation, DonationWrite, DonationCategory, DonationStatus } from "./donation.schema";
import { DONATION_CATEGORIES, DONATION_STATUSES } from "./donation.schema";

/** Firestore Timestamp | string | number (seconds/ms) | Date -> Date */
const toDate = (v: any | undefined): Date | undefined => {
  if (!v) return undefined;
  if (typeof v?.toDate === "function") return v.toDate();
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    // saniye/milisaniye karışıklığına çok takılmıyoruz, genelde Timestamp.toMillis geliyor
    return new Date(v);
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
};

/** Firestore doc -> Domain Tipi (Donation) */
export const toDonation = (id: string, doc: any): Donation => {
  const rawName = doc?.name ?? "";
  const name = String(rawName);

  const rawCategory = doc?.category;
  const category: DonationCategory =
    DONATION_CATEGORIES.includes(rawCategory)
      ? rawCategory
      : "Temel İhtiyaç Yardımı"; // fallback

  const rawStatus = doc?.status;
  const status: DonationStatus =
    DONATION_STATUSES.includes(rawStatus) ? rawStatus : "active";

  return {
    id,
    name,
    nameLower: name ? name.toLowerCase() : undefined,
    amount: Number(doc?.amount ?? 0),
    category,
    description: doc?.description || undefined,
    status,
    collected: Number(doc?.collected ?? 0),
    createdAt: toDate(doc?.createdAt),
    updatedAt: toDate(doc?.updatedAt),
    createdBy: doc?.createdBy || undefined,
    photoUrl: doc?.photoUrl || undefined,
  };
};

/** Domain write objesi -> Firestore'a yazılacak obje */
export const fromDonationWrite = (payload: DonationWrite) => {
  const trimmedName = payload.name.trim();
  return {
    name: trimmedName,
    nameLower: trimmedName.toLowerCase(),
    amount: Number(payload.amount),
    category: payload.category,
    description: (payload.description ?? "").trim(),
  };
};
