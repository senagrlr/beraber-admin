// src\domain\donations\index.ts
// ⬇️ Donation tipini schema dosyasından export et
export type { Donation, DonationWrite } from "./donation.schema";
export { DONATION_CATEGORIES, DonationWriteSchema } from "./donation.schema";
export * from "./donation.mapper";