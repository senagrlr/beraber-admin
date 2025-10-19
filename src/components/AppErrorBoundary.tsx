import React from "react";
import { Box, Button, Typography } from "@mui/material";

type State = { hasError: boolean; err?: any };

export default class AppErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, err };
  }

  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error("[AppErrorBoundary]", error, info);
  }

  handleReload = () => {
    // bazen IndexedDB’deki eski listener state’i kalıyor
    location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" fontWeight={700} color="error" gutterBottom>
          Bir şeyler ters gitti.
        </Typography>
        <Typography sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
          {String(this.state.err?.message || this.state.err || "Bilinmeyen hata")}
        </Typography>
        <Button variant="contained" onClick={this.handleReload}>Sayfayı Yenile</Button>
      </Box>
    );
  }
}
