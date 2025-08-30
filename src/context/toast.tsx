import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';

type ToastVariant = 'success' | 'info' | 'warning' | 'error';

interface ToastItem {
  id: number;
  message: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, variant }]);
  }, []);

  const handleClose = (id: number) => {
    setToasts((t) => t.filter(x => x.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Render snackbars */}
      {toasts.map((t) => (
        <Snackbar
          key={t.id}
          open
          autoHideDuration={5000}
          onClose={() => handleClose(t.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => handleClose(t.id)} severity={t.variant || 'info'} sx={{ width: '100%' }}>
            {t.message}
          </Alert>
        </Snackbar>
      ))}
    </ToastContext.Provider>
  );
};

export default ToastProvider;
