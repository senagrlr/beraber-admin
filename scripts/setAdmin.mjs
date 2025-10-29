import admin from "firebase-admin";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function initAdmin() {
  if (admin.apps.length > 0) return;

  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credPath && fs.existsSync(credPath)) {
    admin.initializeApp();
    return;
  }
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const saDir = path.resolve(__dirname, "../secret");
  const files = fs.existsSync(saDir) ? fs.readdirSync(saDir).filter(f => f.endsWith(".json")) : [];
  if (files.length !== 1) throw new Error("Service account bulunamadı.");
  const sa = JSON.parse(fs.readFileSync(path.join(saDir, files[0]), "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

initAdmin();

async function setClaimsByEmail(email, claims) {
  const user = await admin.auth().getUserByEmail(email);
  const prev = (await admin.auth().getUser(user.uid)).customClaims || {};
  await admin.auth().setCustomUserClaims(user.uid, { ...prev, ...claims });
  console.log(`✔ ${email} ->`, { ...prev, ...claims });
}

async function setClaimsByUid(uid, claims) {
  const prev = (await admin.auth().getUser(uid)).customClaims || {};
  await admin.auth().setCustomUserClaims(uid, { ...prev, ...claims });
  console.log(`✔ uid:${uid} ->`, { ...prev, ...claims });
}

/**
 * Kullanım:
 *  node scripts/set-admin.mjs email someone@x.com admin=true wl=true
 *  node scripts/set-admin.mjs uid   ABC123            admin=false
 */
const [mode, identifier, ...kv] = process.argv.slice(2);
const claims = {};
for (const pair of kv) {
  const [k, v] = String(pair).split("=");
  if (!k) continue;
  claims[k] = String(v).toLowerCase() === "true";
}

(async () => {
  try {
    if (mode === "email") await setClaimsByEmail(identifier, claims);
    else if (mode === "uid") await setClaimsByUid(identifier, claims);
    else console.log('Kullanım: email <mail> key=val ...  veya  uid <uid> key=val ... (ör: admin=true wl=true)');
  } catch (e) {
    console.error("✖ Hata:", e?.message || e);
  } finally {
    process.exit(0);
  }
})();
