// functions/src/index.ts
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();

export const sendNewNotification = onDocumentCreated(
  { document: "notifications/{id}", region: "europe-west1" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const data = snap.data() as {
      title?: string;
      body?: string;
      route?: string;
      collapseKey?: string; // opsiyonel alan (admin panelden gelir)
    } | undefined;
    if (!data) return;

    const title = (data.title || "Beraber").toString();
    const body  = (data.body  || "").toString();
    const route = (data.route || "/home").toString();

    // Bildirimi tekilleştirmek için bir key (aynı kampanya vs.)
    const collapse = (data.collapseKey || `notif-${snap.id}`).toString();

    // Kullanıcı token'larını topla
    const db = getFirestore();
    const usersSnap = await db.collection("users").get();

    const tokens: string[] = [];
    usersSnap.forEach((doc) => {
      const arr = doc.get("fcmTokens");
      if (Array.isArray(arr)) {
        for (const t of arr) {
          if (typeof t === "string" && t.trim()) tokens.push(t);
        }
      }
    });

    if (tokens.length === 0) {
      console.log("No FCM tokens found.");
      return;
    }

    // Çoklu gönderim + çakıştırma ayarları
    const res = await getMessaging().sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        route,
        notificationId: snap.id, // client dedup için
      },
      android: {
        collapseKey: collapse, // ❗ aynı key ile yenisi eskisini ezer
        priority: "high",
        ttl: 60 * 1000,  // 60 sn
        notification: {
          channelId: "beraber_default",
          icon: "ic_stat_beraber",
          color: "#B60707",
          tag: snap.id,   // ❗ tray tarafında da birleştirir
        },
      },
      apns: {
        headers: {
          "apns-priority": "10",
          // iOS'ta da yakın davranış için (Apple tarafında farklıdır ama yardımcı olur)
          "apns-collapse-id": collapse,
        },
        payload: {
          aps: {
            sound: "default",
          },
        },
      },
    });

    console.log(`Push sent. success=${res.successCount}, failure=${res.failureCount}`);
  }
);
