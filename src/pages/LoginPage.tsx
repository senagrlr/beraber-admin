// src/pages/LoginPage.tsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth } from "../services/firebase";
import "./LoginPage.css";
import logo from "../assets/beraber_logo.png";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { isEmailAllowed } from "../services/teamService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert("Lütfen e-posta ve şifre girin.");
      return;
    }

    setLoading(true);
    try {
      // 1) Firebase Auth
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // 2) Whitelist (team_members)
      const normalized = (cred.user.email || "").trim().toLowerCase();
      const ok = await isEmailAllowed(normalized);

      if (!ok) {
        await signOut(auth);
        alert("Bu hesap için yetki bulunamadı. Lütfen Beraber ekibi ile iletişime geçin.");
        return;
      }

      // 3) Başarılı
      window.location.href = "/dashboard";
    } catch (error: any) {
      let msg = "Giriş başarısız.";
      switch (error?.code) {
        case "auth/invalid-email":
          msg = "Geçersiz e-posta formatı.";
          break;
        case "auth/user-not-found":
          msg = "Bu e-posta ile kullanıcı bulunamadı.";
          break;
        case "auth/wrong-password":
        case "auth/invalid-credential":
          msg = "E-posta veya şifre hatalı.";
          break;
        case "auth/too-many-requests":
          msg = "Çok fazla deneme. Lütfen daha sonra tekrar deneyin.";
          break;
        case "auth/operation-not-allowed":
          msg = "E-posta/Şifre ile giriş yöntemi etkin değil.";
          break;
        case "auth/invalid-api-key":
          msg = "Geçersiz API anahtarı. Firebase yapılandırmasını kontrol edin.";
          break;
        default:
          msg = error?.message || msg;
      }
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Lütfen e-posta adresinizi girin.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      alert("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!");
    } catch (error: any) {
      let msg = "Bir hata oluştu.";
      switch (error?.code) {
        case "auth/invalid-email":
          msg = "Geçersiz e-posta formatı.";
          break;
        case "auth/user-not-found":
          msg = "Bu e-posta ile kullanıcı bulunamadı.";
          break;
        default:
          msg = error?.message || msg;
      }
      alert(msg);
    }
  };

  return (
    <div className="login-container">
      {/* Sol Kısım */}
      <div className="login-left">
        <img src={logo} alt="Beraber Logo" className="logo" />
        <h1 className="brand">Beraber</h1>
      </div>

      {/* Dikey Çizgi */}
      <div className="divider"></div>

      {/* Sağ Kısım */}
      <div className="login-right">
        <div className="login-card">
          <h2>Hoş Geldiniz</h2>
          <p>Lütfen yönetici paneline giriş yapın.</p>

          <form onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="E-posta"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={loading}
            />

            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                aria-label="Şifreyi göster/gizle"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </span>
            </div>

            <button type="submit" disabled={loading}>
              {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
            </button>
          </form>

          <a onClick={loading ? undefined : handleForgotPassword} className="forgot">
            Şifrenizi mi unuttunuz?
          </a>
        </div>
      </div>
    </div>
  );
}
