// scripts/sync-claims-from-team.mjs
import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Init (ENV varsa onu kullan; yoksa secret/*.json'ı otomatik bul) ──
function initAdmin() {
  if (admin.apps.length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) {
    admin.initializeApp(); // ENV üzerinden okur
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const secretDir = path.resolve(__dirname, "../secret");
  if (!fs.existsSync(secretDir)) {
    throw new Error(
      "Service account bulunamadı. GOOGLE_APPLICATION_CREDENTIALS ayarla ya da secret/ klasörüne .json anahtar koy."
    );
  }
  const candidates = fs.readdirSync(secretDir).filter(f => f.endsWith(".json"));
  if (candidates.length !== 1) {
    throw new Error(
      `secret/ içinde tam 1 adet .json anahtar olmalı. Bulunan: ${candidates.length}`
    );
  }
  const p = path.join(secretDir, candidates[0]);
  const serviceAccount = JSON.parse(fs.readFileSync(p, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

initAdmin();
const db = admin.firestore();

// Opsiyon: yeni oluşturulan user'lar için reset linki basılsın mı?
const GENERATE_RESET_LINKS = process.env.SYNC_GENERATE_RESET_LINKS === "1";

async function ensureUser(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    return { user, created: false };
  } catch (e) {
    if (e?.errorInfo?.code === "auth/user-not-found") {
      const user = await admin.auth().createUser({
        email,
        emailVerified: false,
        disabled: false,
      });
      return { user, created: true };
    }
    throw e;
  }
}

async function run() {
  const snap = await db.collection("team_members").get();
  let total = 0, created = 0, updated = 0;

  for (const doc of snap.docs) {
    const d = doc.data() || {};
    const email = (d.email || doc.id || "").trim().toLowerCase();
    if (!email.includes("@")) {
      console.warn("✖ Geçersiz email, atlanıyor:", doc.id, d);
      continue;
    }

    const active = d.active === true;
    const isAdmin = Array.isArray(d.roles) && d.roles.includes("admin");

    try {
      const { user, created: isCreated } = await ensureUser(email);
      if (isCreated) created++;

      await admin.auth().setCustomUserClaims(user.uid, { wl: active, admin: isAdmin });
      updated++;

      if (isCreated && GENERATE_RESET_LINKS) {
        const link = await admin.auth().generatePasswordResetLink(email);
        console.log(`ℹ Parola sıfırlama linki (${email}): ${link}`);
      }

      console.log("✔ claims sync:", email, { wl: active, admin: isAdmin });
      total++;
    } catch (e) {
      console.error("✖ Hata (", email, "):", e?.message || e);
    }
  }

  console.log(`\nDone. total=${total}, created=${created}, claimsUpdated=${updated}`);
}

run().catch(e => {
  console.error("✖ sync error:", e);
  process.exit(1);
});
