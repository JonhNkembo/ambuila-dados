'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const ToastCtx = createContext<(msg: string, ok?: boolean) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [t, setT] = useState<{ msg: string; ok: boolean } | null>(null);
  const show = useCallback((msg: string, ok = true) => {
    setT({ msg, ok });
    setTimeout(() => setT(null), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {t && (
        <div className="toast-container position-fixed bottom-0 end-0 p-3 no-print" style={{ zIndex: 2000 }}>
          <div className="toast show align-items-center text-white border-0" style={{ background: t.ok ? '#1B5E3B' : '#B4412E', borderRadius: 12, boxShadow: '0 14px 30px -10px rgba(15,61,38,.55)' }} role="status">
            <div className="d-flex"><div className="toast-body">{t.msg}</div></div>
          </div>
        </div>
      )}
    </ToastCtx.Provider>
  );
}
