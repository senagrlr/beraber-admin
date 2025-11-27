// src/domain/donations/donation.schema.ts
import { z } from "zod";

export const DONATION_CATEGORIES = [
  "Eğitim Yardımı",
  "Beslenme Yardımı",
  "Sağlık Yardımı",
  "Giyecek Yardımı",
  "Afet Yardımı",
  "Temel İhtiyaç Yardımı",
  "Hayvanlara Destek Yardımı",
  "Çevresel Yardım",
] as const;

export type DonationCategory = (typeof DONATION_CATEGORIES)[number];

export const DONATION_STATUSES = [
  "active",
  "completed",
  "photo_pending",
  "deleted",
] as const;

export type DonationStatus = (typeof DONATION_STATUSES)[number];

export interface Donation {
  id: string;
  name: string;
  nameLower?: string;
  amount: number;
  category: DonationCategory;
  description?: string;
  status?: DonationStatus;
  collected?: number;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  photoUrl?: string;
}

export const DonationWriteSchema = z.object({
  name: z.string().min(3, "Bağış ismi en az 3 karakter olmalı"),
  amount: z.number().positive("Hedef miktar pozitif olmalı"),
  category: z.enum(DONATION_CATEGORIES),
  description: z.string().optional(),
});

export type DonationWrite = z.infer<typeof DonationWriteSchema>;
