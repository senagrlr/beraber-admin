// src/data/services/community.service.ts
import type { Firestore } from "firebase/firestore";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { FirestoreCommunityRepo } from "@/data/repositories/community.repo";
import type { CommunityPost, Highlight } from "@/domain/community/post.types";
import { COLLECTIONS } from "@/constants/firestore";
import { auth } from "@/infrastructure/firebase";


// (Opsiyonel) dosyadan yükleme desteği için Storage
import type { FirebaseStorage } from "firebase/storage";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export class CommunityService {
  constructor(
    private repo: FirestoreCommunityRepo,
    private db: Firestore,
    private storage?: FirebaseStorage
  ) {}

  // ── Highlights ──────────────────────────────────────────────────────────────
  setMonthlyHighlightUrl(monthKey: string, url: string) {
    console.warn("[CommunityService.setMonthlyHighlightUrl] LEGACY çağrı — yeni eklemelerde kullanma!");
    return this.repo.setMonthlyHighlightUrl(monthKey, url);
  }

  addHighlightUrl(input: { monthKey: string; photoUrl: string }) {
    return this.repo.addHighlightUrl(input);
  }

  /**
   * YENİ: Beraber’de Bu Ay için DOSYADAN highlight ekleme
   * 1) Dosyayı Storage'a yükler: beraberde_bu_ay/{something}.jpg
   * 2) URL'i Firestore HIGHLIGHTS koleksiyonuna yazar
   */
  async addHighlightFile(input: { monthKey: string; file: File }) {
    if (!this.storage) {
      throw new Error(
        "[CommunityService.addHighlightFile] Storage tanımlı değil. DI ile FirebaseStorage örneği geçir veya URL yolunu (addHighlightUrl) kullan."
      );
    }

    const ext = (input.file.name.split(".").pop() || "jpg").toLowerCase();
    const safeName = `${input.monthKey}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    // PATH: beraberde_bu_ay/...  → storage.rules'taki
    // match /beraberde_bu_ay/{fileName} ile birebir uyumlu
    const path = `${COLLECTIONS.HIGHLIGHTS}/${safeName}`;

    const r = ref(this.storage, path);
    await uploadBytes(r, input.file);
    const url = await getDownloadURL(r);

    return this.repo.addHighlightUrl({
      monthKey: input.monthKey,
      photoUrl: url,
    });
  }

  updateMonthlyHighlight(idOrMonthKey: string, patch: { photoUrl?: string }) {
    return this.repo.updateMonthlyHighlight(idOrMonthKey, patch);
  }

  listenLatestHighlights(limitN: number, cb: (rows: Highlight[]) => void) {
    return this.repo.listenLatestHighlights(limitN, cb);
  }

  deleteHighlight(idOrMonthKey: string) {
    return this.repo.deleteHighlight(idOrMonthKey);
  }

  // ── Posts ──────────────────────────────────────────────────────────────────
  /** URL ile topluluk gönderisi ekleme (tercih edilen yol) */
  async addCommunityPostUrl(input: { text?: string; photoUrl: string }) {
    const u = auth.currentUser;
    if (!u) throw new Error("community/addPost failed: not-authenticated");

    const emailLower = u.email ? u.email.toLowerCase() : null;

    try {
      // 1) Kullanıcıyı whitelist’e (id=email_lower) ekle/merge et
      if (emailLower) {
        const tmRef = doc(this.db, COLLECTIONS.TEAM_MEMBERS, emailLower);
        await setDoc(
          tmRef,
          {
            email: u.email ?? null,
            email_lower: emailLower, // ← Regeln’de bu kullanılıyor
            emailLower,              // ← camelCase yedek alan (opsiyonel faydalı)
            active: true,
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      // 2) Gönderiyi ekle
      return await this.repo.addPostUrl({
        text: input.text,
        photoUrl: input.photoUrl,
        createdBy: u.uid,
        createdByEmailLower: emailLower,
      });
    } catch (e: any) {
      const code = e?.code ?? "unknown";
      const msg = e?.message ?? String(e);
      console.error("[CommunityService.addCommunityPostUrl] failed:", code, msg);
      throw new Error(`community/addPost failed: ${code} - ${msg}`);
    }
  }

  /** ALIAS: Eski UI çağrılarını kırmamak için */
  addCommunityPost(input: { text?: string; photoUrl: string }) {
    return this.addCommunityPostUrl(input);
  }

  /** Dosyadan topluluk gönderisi ekleme (çalışan kısım) */
  async addCommunityPostFile(input: { text?: string; file: File }) {
    if (!this.storage) {
      throw new Error(
        "[CommunityService.addCommunityPostFile] Storage tanımlı değil. DI ile FirebaseStorage örneği geçir veya URL yolunu (addCommunityPostUrl) kullan."
      );
    }

    const ext = (input.file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${COLLECTIONS.COMMUNITY_POSTS}/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const r = ref(this.storage, path);
    await uploadBytes(r, input.file);
    const url = await getDownloadURL(r);

    return this.addCommunityPostUrl({ text: input.text, photoUrl: url });
  }

  updateCommunityPost(id: string, patch: { text?: string; photoUrl?: string }) {
    return this.repo.updatePost(id, patch);
  }

  listenCommunityPosts(limitN: number, cb: (rows: CommunityPost[]) => void) {
    return this.repo.listenPosts(limitN, cb);
  }

  deleteCommunityPost(id: string) {
    return this.repo.deletePost(id);
  }

  // ── DIAGNOSE (opsiyonel) ───────────────────────────────────────────────────
  async diagnoseCommunityPostPermissions() {
    const u = auth.currentUser;
    const emailLower = u?.email ? u.email.toLowerCase() : null;

    const report: Record<string, any> = {
      auth: {
        uid: u?.uid ?? null,
        email: u?.email ?? null,
        emailLower,
        isAuthenticated: !!u,
      },
      writeTest: null as null | { ok: boolean; errorCode?: string; errorMessage?: string },
    };

    try {
      const testId = `DIAGNOSE_${Date.now()}`;
      const testRef = doc(this.db, COLLECTIONS.COMMUNITY_POSTS, testId);
      await setDoc(testRef, {
        text: "[diagnose] test",
        photoUrl: "about:blank",
        status: "active",
        createdBy: u?.uid ?? null,
        createdByEmailLower: emailLower ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await deleteDoc(testRef);
      report.writeTest = { ok: true };
    } catch (e: any) {
      report.writeTest = {
        ok: false,
        errorCode: e?.code ?? "unknown",
        errorMessage: e?.message ?? String(e),
      };
    }

    console.log("[diagnoseCommunityPostPermissions] report:", report);
    return report;
  }
}
