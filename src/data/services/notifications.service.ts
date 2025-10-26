// src/data/services/notifications.service.ts
import type { Unsubscribe } from "firebase/firestore";
import type { INotificationsRepo } from "@/data/repositories/notifications.repo";

export type NotificationTargetAll = { type: "all" };
export type NotificationTargetCampaign = {
  type: "campaign";
  campaignId: string;
  campaignName: string;
};
export type NotificationTarget = NotificationTargetAll | NotificationTargetCampaign;

export type NotificationDoc = {
  id: string;
  title: string;
  body: string;
  target: NotificationTarget;
  scheduledAt?: any; // Firestore Timestamp veya Date
  createdAt?: any;
  updatedAt?: any;
};

export class NotificationsService {
  constructor(private repo: INotificationsRepo) {}

  // ---- CRUD ----
  create(input: {
    title: string;
    body: string;
    target: NotificationTarget;
    scheduledAt?: any;
  }) {
    return this.repo.create(input);
  }

  update(id: string, patch: Partial<{ title: string; body: string; target: NotificationTarget; scheduledAt: any }>) {
    return this.repo.update(id, patch);
  }

  delete(id: string) {
    return this.repo.delete(id);
  }

  // ---- LISTING / READING ----
  fetchCampaignOptions() {
    return this.repo.fetchCampaignOptions();
  }

  listenRealtime(limitN: number, cb: (rows: NotificationDoc[]) => void): Unsubscribe {
    return this.repo.listenRealtime(cb, limitN);
  }

  fetchPage(limitN: number, cursor?: any) {
    return this.repo.fetchPage(limitN, cursor);
  }

  getById(id: string) {
    return this.repo.getById(id);
  }

  // ====== GERİYE DÖNÜK UYUMLULUK (UI eski adları kullanıyorsa) ======
  // SonBildirimler.tsx `notificationsService.listenRecent(...)` çağırıyor
  listenRecent(limitN: number, cb: (rows: NotificationDoc[]) => void): Unsubscribe {
    return this.listenRealtime(limitN, cb);
  }

  // Eğer bir yerde `createNotification / updateNotification / deleteNotificationById`
  // gibi isimler kullanıldıysa aşağıdaki alias'lar da çalışır:
  createNotification(input: { title: string; body: string; target: NotificationTarget; scheduledAt?: any }) {
    return this.create(input);
  }
  updateNotification(id: string, patch: Partial<{ title: string; body: string; target: NotificationTarget; scheduledAt: any }>) {
    return this.update(id, patch);
  }
  deleteNotificationById(id: string) {
    return this.delete(id);
  }
  listenNotificationsRealtime(cb: (rows: NotificationDoc[]) => void, limitN = 20): Unsubscribe {
    return this.listenRealtime(limitN, cb);
  }
  fetchNotificationsPage(limitN: number, cursor?: any) {
    return this.fetchPage(limitN, cursor);
  }
  getNotificationById(id: string) {
    return this.getById(id);
  }
}

