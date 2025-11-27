// src/hooks/useImageValidation.ts
import { useCallback } from "react";
import { ALLOWED_IMAGE_MIME, IMAGE_MAX_BYTES } from "@/constants/validation";

/**
 * Ortak görsel doğrulama hook'u.
 * - MIME type ALLOWED_IMAGE_MIME içinde mi?
 * - Boyut IMAGE_MAX_BYTES sınırını aşıyor mu?
 *
 * Hata varsa string döner, yoksa null döner.
 */
export function useImageValidation() {
  const validateImage = useCallback((file?: File | null): string | null => {
    if (!file) {
      return "Lütfen bir dosya seçin.";
    }

    // MIME tipi kontrolü
    if (!ALLOWED_IMAGE_MIME.includes(file.type as (typeof ALLOWED_IMAGE_MIME)[number])) {
      return "Lütfen JPG, PNG veya WEBP formatında bir görsel yükleyin.";
    }

    // Boyut kontrolü
    if (file.size > IMAGE_MAX_BYTES) {
      const maxMb = (IMAGE_MAX_BYTES / (1024 * 1024)).toFixed(1);
      return `Dosya boyutu en fazla ${maxMb} MB olabilir.`;
    }

    return null;
  }, []);

  return { validateImage };
}
