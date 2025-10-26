// src\domain\donations\donation.schema.ts
export interface Donation {
  id: string;
  name: string;                 // (projede "title" değil "name" kullanıyorsun)
  amount: number;
  category:
    | "Eğitim Yardımı"
    | "Beslenme Yardımı"
    | "Sağlık Yardımı"
    | "Giyecek Yardımı"
    | "Afet Yardımı"
    | "Temel İhtiyaç Yardımı"
    | "Hayvanlara Destek Yardımı"
    | "Çevresel Yardım";
  description?: string;
  status?: "active" | "completed" | "photo_pending";

  // türev/sayımsal alanlar:
  collected?: number;

  // zamanlar domain’de Date
  createdAt?: Date;
  updatedAt?: Date;

  // kim tarafından oluşturuldu (varsa)
  createdBy?: string; // uid
}
