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
  const p = path.resolve(__dirname, "../secret");
  const files = fs.existsSync(p) ? fs.readdirSync(p).filter(f => f.endsWith(".json")) : [];
  if (files.length !== 1) {
    throw new Error("Service account bulunamadı. ENV ayarla veya secret/ altında tek .json bırak.");
  }
  const sa = JSON.parse(fs.readFileSync(path.join(p, files[0]), "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}

initAdmin();
const db = admin.firestore();

function toEmailLower(doc) {
  const d = doc.data() || {};
  const email = (d.email || doc.id || "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

async function commitInChunks(ops) {
  const chunkSize = 450;
  for (let i = 0; i < ops.length; i += chunkSize) {
    const batch = db.batch();
    for (const fn of ops.slice(i, i + chunkSize)) fn(batch);
    await batch.commit();
  }
}

async function run() {
  const snap = await db.collection("team_members").get();
  const ops = [];

  for (const doc of snap.docs) {
    const d = doc.data() || {};
    const emailLower = toEmailLower(doc);
    if (!emailLower) {
      console.warn("✖ Geçersiz email/ID, atlanıyor:", doc.id, d);
      continue;
    }

    const newRef = db.collection("team_members").doc(emailLower);
    const name = d.name ?? null;
    const phone = d.phone ?? null;
    const active = typeof d.active === "boolean" ? d.active : true;

    let roles = Array.isArray(d.roles) ? d.roles : [];
    if (!roles.length && typeof d.role === "string" && d.role.trim()) {
      roles = [d.role.trim()];
    }
    if (!roles.length) roles = ["editor"];

    const payload = {
      email: emailLower,
      name,
      phone,
      active,
      roles,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: null,
    };

    ops.push((b) => b.set(newRef, payload, { merge: true }));
    if (doc.id !== emailLower) ops.push((b) => b.delete(doc.ref));
  }

  await commitInChunks(ops);
  console.log("✔ team_members normalize + createdAt set bitti.");
}

run().catch(e => { console.error(e); process.exit(1); });
