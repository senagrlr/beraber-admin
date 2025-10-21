// src\contexts\NotificationContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';

// Bildirim fonksiyonlarının tiplerini tanımlıyoruz
interface NotificationContextType {
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void; // Eklendi: Uyarılar için
  showConfirm: (title: string, message: string) => Promise<boolean>;
}

// Context'i oluşturuyoruz
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Context'i kolayca kullanmamızı sağlayacak olan custom hook
export const useNotifier = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }
  return context;
};

// Provider bileşenimiz
export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  // Snackbar state'i
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' } | null>(null);
  
  // Dialog (onay) state'i
  const [dialog, setDialog] = useState<{ open: boolean; title: string; message: string; resolve: (value: boolean) => void; } | null>(null);

  const showSuccess = (message: string) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const showError = (message: string) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const showWarning = (message: string) => { // Eklendi
    setSnackbar({ open: true, message, severity: 'warning' });
  };

  const showConfirm = (title: string, message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({ open: true, title, message, resolve });
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(null);
  };

  const handleDialogClose = (confirmed: boolean) => {
    if (dialog) {
      dialog.resolve(confirmed);
      setDialog(null);
    }
  };

  const value = { showSuccess, showError, showWarning, showConfirm };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Snackbar Bileşeni */}
      <Snackbar
        open={!!snackbar?.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar?.severity} sx={{ width: '100%' }} variant="filled">
          {snackbar?.message}
        </Alert>
      </Snackbar>

      {/* Dialog (Onay) Bileşeni */}
      <Dialog
        open={!!dialog?.open}
        onClose={() => handleDialogClose(false)}
      >
        <DialogTitle>{dialog?.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{dialog?.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDialogClose(false)}>Vazgeç</Button>
          <Button onClick={() => handleDialogClose(true)} variant="contained" autoFocus>
            Onayla
          </Button>
        </DialogActions>
      </Dialog>
    </NotificationContext.Provider>
  );
};

