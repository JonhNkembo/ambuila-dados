'use client';
import { useRef, useTransition, type ReactNode } from 'react';
import { useToast } from './Toast';
import type { ActionResult } from '@/app/admin/actions';

/** Formulário ligado a uma Server Action; mostra o resultado em toast e limpa o formulário em caso de sucesso. */
export default function ActionForm({
  action, children, submitLabel = 'Guardar', className, resetOnSuccess = true, disabled = false, buttonClass = 'btn btn-sm btn-inst-primary', onSuccess,
}: {
  onSuccess?: () => void;
  action: (fd: FormData) => Promise<ActionResult>;
  children: ReactNode; submitLabel?: string; className?: string; resetOnSuccess?: boolean; disabled?: boolean; buttonClass?: string;
}) {
  const toast = useToast();
  const ref = useRef<HTMLFormElement>(null);
  const [pending, start] = useTransition();

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const r = await action(fd);
          toast(r.message, r.ok);
          if (r.ok && resetOnSuccess) ref.current?.reset();
          if (r.ok) onSuccess?.();
        });
      }}
    >
      {children}
      <button className={buttonClass} disabled={pending || disabled}>{pending ? 'A guardar…' : submitLabel}</button>
    </form>
  );
}
