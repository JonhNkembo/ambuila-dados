'use client';
import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  open, title, onClose, children, size = 'lg', footer,
}: {
  open: boolean; title: string; onClose: () => void; children: ReactNode;
  size?: 'md' | 'lg' | 'xl'; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
    };
  }, [open, onClose]);

  if (!open) return null;
  const dialogCls = size === 'xl' ? 'modal-xl' : size === 'lg' ? 'modal-lg' : '';
  return (
    <>
      <div className="modal d-block" tabIndex={-1} role="dialog" aria-modal="true" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className={`modal-dialog modal-dialog-scrollable modal-dialog-centered ${dialogCls} modal-fullscreen-sm-down`}>
          <div className="modal-content" style={{ borderTop: '3px solid var(--inst-red)' }}>
            <div className="modal-header">
              <h5 className="modal-title h6 fw-bold text-inst-dark mb-0">{title}</h5>
              <button type="button" className="btn btn-sm p-0" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer">{footer}</div>}
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
