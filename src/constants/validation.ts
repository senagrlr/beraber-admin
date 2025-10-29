// src\constants\validation.ts
// Genel metin alanları
export const MIN_NAME = 3;
export const MAX_NAME = 50;

export const MIN_TITLE = 3;
export const MAX_TITLE = 80;

export const MAX_DESCRIPTION = 1000;

// Bağış tutarı
export const MIN_DONATION_AMOUNT = 1;          // en az 1 TL
export const MAX_DONATION_AMOUNT = 1_000_000;

// E-posta/Telefon
export const MAX_EMAIL = 254;                  // RFC’ye uygun tipik üst sınır
export const MAX_PHONE = 30;

// Dosya doğrulama (UI tarafı)
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
