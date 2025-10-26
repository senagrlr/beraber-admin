// src/components/AppErrorBoundary.tsx
import React from "react";
import { Box, Button, Typography, Stack } from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import RefreshIcon from "@mui/icons-material/Refresh";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";

// Eğer DI container kullanıyorsan şu şekilde de alabilirsin:
// import { auth, nukeFirestoreCache } from "@/data/container";
import { auth } from "@/services/firebase";
import { nukeFirestoreCache } from "@/services/firebase";

type State = { hasError: boolean; err?: any; detailsOpen: boolean };

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false, err: undefined, detailsOpen: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, err };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("[AppErrorBoundary]", error, info);
  }

  // (Opsiyonel) Rota değişince toparlan: parent <Routes> içine konduysa,
  // key değişimlerinde boundary yeniden mount edilir; ama yine de güvence:
  componentDidUpdate(_: any, prevState: State) {
    // farklı bir çocuk ağacı render edildiyse ve önce hata vardıysa toparlan
    if (this.state.hasError && this.props.children !== (this as any)._prevChildren) {
      this.setState({ hasError: false, err: undefined, detailsOpen: false });
    }
    (this as any)._prevChildren = this.props.children;
  }

  handleRetry = () => {
    this.setState({ hasError: false, err: undefined, detailsOpen: false });
  };

  handleReload = () => {
    location.reload();
  };

  handleClearCacheAndReload = async () => {
    try {
      await nukeFirestoreCache();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("Önbellek temizlenirken uyarı:", e);
    } finally {
      location.reload();
    }
  };

  handleSignOut = async () => {
    try {
      await auth.signOut();
    } finally {
      location.href = "/login";
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const msg =
      (this.state.err?.message && String(this.state.err.message)) ||
      String(this.state.err || "Bilinmeyen hata");

    // Firebase permission/claim vb. ipuçları
    const maybePerm =
      /permission|denied|unauthorized|not\s*authorized/i.test(msg) ||
      this.state.err?.code === "permission-denied";

    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} color="error" gutterBottom>
          Bir şeyler ters gitti.
        </Typography>

        <Typography sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          {msg}
        </Typography>

        {maybePerm && (
          <Typography sx={{ mb: 2 }} color="text.secondary">
            Bu hata genellikle yetki/rol/claim veya güvenlik kuralı nedeniyle oluşur. Gerekirse yeniden
            oturum açmayı deneyebilirsin.
          </Typography>
        )}

        {/* Hata detaylarını aç/kapa */}
        <details
          open={this.state.detailsOpen}
          onToggle={(e) => this.setState({ detailsOpen: (e.target as HTMLDetailsElement).open })}
          style={{ marginBottom: 16 }}
        >
          <summary style={{ cursor: "pointer", fontWeight: 600 }}>Ayrıntıları göster/gizle</summary>
          <pre style={{ marginTop: 8, background: "#fafafa", padding: 12, borderRadius: 8, overflow: "auto" }}>
            {this.state.err?.stack || this.state.err?.toString?.() || "(Stack yok)"}
          </pre>
        </details>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button variant="contained" onClick={this.handleRetry} startIcon={<RefreshIcon />}>
            Yeniden Dene
          </Button>
          <Button variant="outlined" onClick={this.handleReload}>
            Sayfayı Yenile
          </Button>
          <Button
            variant="outlined"
            onClick={this.handleClearCacheAndReload}
            startIcon={<CleaningServicesIcon />}
          >
            Önbelleği Temizle & Yenile
          </Button>
          <Button
            color="warning"
            variant="text"
            onClick={this.handleSignOut}
            startIcon={<LogoutIcon />}
          >
            Oturumu Kapat
          </Button>
        </Stack>
      </Box>
    );
  }
}
