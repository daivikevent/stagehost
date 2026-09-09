'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ToastMessage } from '@/types';
import { generateId } from '@/lib/utils';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = generateId();
      const newToast: ToastMessage = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      // Auto-dismiss after duration (default 3s)
      const duration = toast.duration ?? 3000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string) => addToast({ type: 'success', message }),
    [addToast]
  );
  const error = useCallback(
    (message: string) => addToast({ type: 'error', message, duration: 5000 }),
    [addToast]
  );
  const warning = useCallback(
    (message: string) => addToast({ type: 'warning', message }),
    [addToast]
  );
  const info = useCallback(
    (message: string) => addToast({ type: 'info', message }),
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
