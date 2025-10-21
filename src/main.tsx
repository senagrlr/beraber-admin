// src/main.tsx
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { theme } from "./theme";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { NotificationProvider } from "./contexts/NotificationContext"; // Bu import'un olduğundan emin ol

const Root = (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* 👇 Bildirim Sistemi burada başlatılıyor */}
      <NotificationProvider>
        <AppErrorBoundary>
          <Suspense
            fallback={
              <Box minHeight="60vh" display="grid" sx={{ placeItems: "center" }}>
                <CircularProgress />
              </Box>
            }
          >
            <App />
          </Suspense>
        </AppErrorBoundary>
      </NotificationProvider>
      {/* 👆 Bildirim Sistemi burada bitiyor */}
    </ThemeProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? Root : Root
);


