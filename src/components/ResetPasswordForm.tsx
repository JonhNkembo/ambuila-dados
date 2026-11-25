'use client';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound } from 'lucide-react';
import Brand from './Brand';
import { PasswordField } from './ui';
import { completePasswordReset } from '@/app/login/actions';

export default function ResetPasswordForm({ logoUrl, valid }: { logoUrl: string; valid: boolean }) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError('');
    start(async () => {
      const r = await completePasswordReset(fd);
      if (r.ok) router.push('/login?ok=senha');
      else setError(r.message);
    });
  }

  return (
    <div className="auth-panel min-vh-100" style={{ background: 'var(--inst-bg)' }}>
      <div className="auth-card">
        <div className="d-flex align-items-center gap-3 mb-4">
          <Brand logoUrl={logoUrl} height={48} />
          <div>
            <div className="gov-kicker">Governo de Angola</div>
            <div className="portal-title" style={{ fontSize: '1rem' }}>Portal de Dados de Ambuíla</div>
          </div>
        </div>
        <h1 className="h4 fw-bold text-inst-dark mb-1">Definir nova palavra-passe</h1>
        {valid ? (
          <form onSubmit={onSubmit} className="mt-3">
            <PasswordField name="password" label="Nova palavra-passe (mín. 8)" minLength={8} meter />
            <PasswordField name="confirm_password" label="Confirmar nova palavra-passe" minLength={8} />
            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={pending}>
              <KeyRound size={16} /> {pending ? 'A guardar…' : 'Guardar palavra-passe'}
            </button>
          </form>
        ) : (
          <div className="mt-3">
            <div className="alert alert-danger small" role="alert">A ligação é inválida, expirou ou já foi usada. Peça uma nova em &ldquo;Esqueceu a senha?&rdquo;.</div>
            <Link href="/login" className="btn btn-inst-primary w-100">Voltar ao login</Link>
          </div>
        )}
        <div className="text-center mt-3"><Link href="/login" className="small text-muted">← Voltar ao login</Link></div>
      </div>
    </div>
  );
}
