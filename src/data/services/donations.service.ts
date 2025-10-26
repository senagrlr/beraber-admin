// src/data/services/donations.service.ts
import { z } from "zod";
import { DonationWriteSchema, type Donation, type DonationWrite } from "@/domain/donations/donation.schema";
import type { IDonationsRepo } from "@/data/repositories/donations.repo";
import type { Unsubscribe } from "firebase/firestore";

const UpdateSchema = DonationWriteSchema.partial();

export class DonationsService {
  constructor(private repo: IDonationsRepo) {}

  /* -------------------- Create / Update / Delete -------------------- */
  async create(input: unknown, uid: string): Promise<{ id: string }> {
    const parsed = DonationWriteSchema.parse(input);
    const id = await this.repo.add(parsed, uid);
    return { id };
  }

  async update(id: string, patch: unknown): Promise<void> {
    const parsed = UpdateSchema.parse(patch);
    return this.repo.update(id, parsed);
  }

  async setPhotoUrl(id: string, url: unknown): Promise<void> {
    if (typeof url !== "string") throw new Error("Geçersiz fotoğraf URL'si.");
    return this.repo.setPhotoUrl(id, url);
  }

  async uploadPhoto(id: string, file: File): Promise<string> {
    if (!(file instanceof File) || file.size <= 0) throw new Error("Geçersiz dosya.");
    return this.repo.uploadPhoto(id, file);
  }

  async deleteById(id: string): Promise<void> {
    return this.repo.deleteById(id);
  }

  /* -------------------- Reads -------------------- */
  getById(id: string): Promise<Donation | null> {
    return this.repo.getById(id);
  }

  listenById(id: string, cb: (row: Donation | null) => void): Unsubscribe {
    return this.repo.listenById(id, cb);
  }

  /* -------------------- Dashboard / Reports helpers -------------------- */
  fetchMonthToDateTotal(): Promise<number> {
    return this.repo.fetchMonthToDateTotal();
  }
  fetchYearToDateTotal(year: number): Promise<number> {
    return this.repo.fetchYearToDateTotal(year);
  }
  fetchCompleted(limitN: number): Promise<Array<{ id: string; name?: string }>> {
    return this.repo.fetchCompleted(limitN);
  }
  fetchCategoryRatios(): Promise<Array<{ name: string; value: number; color: string }>> {
    return this.repo.fetchCategoryRatios();
  }
  searchByName(q: string, limitN: number): Promise<Array<{ id: string; name: string }>> {
    return this.repo.searchByName(q, limitN);
  }
  fetchCompletedCampaigns(limitN: number) {
    return this.repo.fetchCompletedCampaigns(limitN);
  }
  fetchPhotoPending(limitN: number) {
    return this.repo.fetchPhotoPending(limitN);
  }
  fetchDashboardCounts() {
    return this.repo.fetchDashboardCounts();
  }

  /* -------------------- Realtime lists -------------------- */
  listenRecent(limitN: number, cb: (rows: Donation[]) => void): Unsubscribe {
    return this.repo.listenRecent(limitN, cb);
  }
  // Alias
  listenRecentDonations(limitN: number, cb: (rows: Donation[]) => void): Unsubscribe {
    return this.listenRecent(limitN, cb);
  }

  /** Navbar’da kullanılan: son tamamlanan N bağış — repo varsa onu kullan, yoksa fallback */
  listenRecentCompleted(
    limitN: number,
    cb: (rows: Array<{ id: string; name?: string }>) => void
  ): Unsubscribe {
    const maybe = (this.repo as any)?.listenRecentCompleted;
    if (typeof maybe === "function") {
      return (maybe as IDonationsRepo["listenRecentCompleted"]).call(this.repo, limitN, cb);
    }
    // Fallback: listenRecent üzerinden filtrele
    const take = Math.max(limitN * 3, limitN);
    return this.repo.listenRecent(take, (rows) => {
      const completed = rows
        .filter((r) => r?.status === "completed")
        .slice(0, limitN)
        .map((r) => ({ id: r.id, name: r.name }));
      cb(completed);
    });
  }

  // Alias
  listenRecentCompletedDonations(
    limitN: number,
    cb: (rows: Array<{ id: string; name?: string }>) => void
  ): Unsubscribe {
    return this.listenRecentCompleted(limitN, cb);
  }
}
