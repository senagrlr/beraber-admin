// scripts/setAdmin.ts
import * as admin from "firebase-admin";
import path from "path";

const saPath = path.resolve(__dirname, "../secret/serviceAccount.json");
admin.initializeApp({
  credential: admin.credential.cert(require(saPath)),
});

async function setAdminByEmail(email: string, isAdmin: boolean) {
  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { admin: isAdmin });
  console.log(`✅ ${email} => admin: ${isAdmin}`);
}

async function setAdminByUid(uid: string, isAdmin: boolean) {
  await admin.auth().setCustomUserClaims(uid, { admin: isAdmin });
  console.log(`✅ uid:${uid} => admin: ${isAdmin}`);
}

const [mode, identifier, flag] = process.argv.slice(2);
const isAdmin = String(flag).toLowerCase() === "true";

(async () => {
  try {
    if (mode === "email") await setAdminByEmail(identifier, isAdmin);
    else if (mode === "uid") await setAdminByUid(identifier, isAdmin);
    else console.log("Kullanım: email <mail> <true|false>  veya  uid <uid> <true|false>");
  } catch (e: any) {
    console.error("❌ Hata:", e?.message || e);
  } finally {
    process.exit(0);
  }
})();
