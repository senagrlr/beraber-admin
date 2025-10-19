// src/main.tsx
import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline, Box, CircularProgress } from "@mui/material";
import { theme } from "./theme";
import AppErrorBoundary from "./components/AppErrorBoundary";

const Root = (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
    </ThemeProvider>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById("root")!).render(
  import.meta.env.DEV ? Root : Root // prod’da istersen StrictMode ekleyebilirsin
  // <React.StrictMode>{Root}</React.StrictMode> (istersen PROD’da)
);
