import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function initAdmin() {
  if (admin.apps.length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) { admin.initializeApp(); return; }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dir = path.resolve(__dirname, "../secret");
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => f.endsWith(".json")) : [];
  if (files.length !== 1) throw new Error("Service account yok.");
  const sa = JSON.parse(fs.readFileSync(path.join(dir, files[0]), "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

initAdmin();

// DÜZENLE: tek tek atamak istediğinler
const CLAIMS_BATCH = [
  ["admin@beraber.app",  { admin: true, wl: true }],
  ["editor@beraber.app", { wl: true }],
  ["sellygg92@gmail.com",{ wl: true }],
];

async function ensureUserByEmail(email) {
  try { return await admin.auth().getUserByEmail(email); }
  catch (e) {
    if (e?.errorInfo?.code === "auth/user-not-found") {
      const user = await admin.auth().createUser({ email, emailVerified: false, disabled: false });
      const link = await admin.auth().generatePasswordResetLink(email);
      console.log(`ℹ ${email} oluşturuldu. Reset link: ${link}`);
      return user;
    }
    throw e;
  }
}

async function setClaimsByEmail(email, claims) {
  const user = await ensureUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, claims);
  console.log(`✔ Claims set for ${email}:`, claims);
}

(async () => {
  try {
    for (const [email, claims] of CLAIMS_BATCH) {
      await setClaimsByEmail(email, claims);
    }
  } catch (e) {
    console.error("✖ set-claims error:", e);
    process.exit(1);
  } finally {
    process.exit(0);
  }
})();
