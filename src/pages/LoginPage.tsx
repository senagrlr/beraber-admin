import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { auth, teamService } from "@/data/container";
import "./LoginPage.css";
import logo from "../assets/beraber_logo.png";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNotifier } from "../contexts/NotificationContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const notifier = useNotifier();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🟢 Login attempt:", email);

    if (!email || !password) {
      notifier.showWarning("Lütfen e-posta ve şifre girin.");
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      const normalized = (cred.user.email || "").trim().toLowerCase();
      const ok = await teamService.isEmailAllowed(normalized);

      if (!ok) {
        await signOut(auth);
        notifier.showError("Bu hesap için yetki bulunamadı. Lütfen Beraber ekibi ile iletişime geçin.");
        return;
      }

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
        default:
          msg = "E-posta veya şifre hatalı.";
      }
      notifier.showError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      notifier.showWarning("Lütfen e-posta adresinizi girin.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      notifier.showSuccess("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi!");
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
          msg = "İşlem sırasında bir hata oluştu.";
      }
      notifier.showError(msg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={logo} alt="Beraber Logo" className="logo" />
        <h1 className="brand">Beraber</h1>
      </div>

      <div className="divider"></div>

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
