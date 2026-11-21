'use client';
import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import Brand from './Brand';
import { createClient } from '@/lib/supabase/client';
import { recordAuth } from '@/app/admin/actions';
import { registerSelf } from '@/app/login/actions';

function Inner({ allowRegistration, logoUrl }: { allowRegistration: boolean; logoUrl: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(params.get('erro') === 'inactivo' ? 'A sua conta está inactiva ou a aguardar aprovação de um administrador.' : '');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, start] = useTransition();

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setInfo('');
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      setError('Credenciais inválidas. Verifique o email e a palavra-passe.');
      return;
    }
    await recordAuth('login').catch(() => {});
    router.push('/admin');
    router.refresh();
  }

  function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setError(''); setInfo('');
    start(async () => {
      const r = await registerSelf(fd);
      if (r.ok) { setInfo(r.message); form.reset(); setTab('login'); } else setError(r.message);
    });
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3" style={{ background: 'linear-gradient(160deg,#0B2545,#13315C)' }}>
      <div className="inst-card p-4 p-md-5 w-100" style={{ maxWidth: 460, borderTop: '4px solid #CC092F' }}>
        <div className="d-flex align-items-center gap-3 mb-4">
          <Brand logoUrl={logoUrl} height={52} />
          <div>
            <div className="gov-kicker">Governo de Angola</div>
            <div className="portal-title" style={{ fontSize: '1rem' }}>Portal de Dados de Ambuíla</div>
            <small className="text-muted">Painel Administrativo • Acesso restrito</small>
          </div>
        </div>

        {allowRegistration && (
          <ul className="nav nav-pills nav-fill mb-3 small">
            <li className="nav-item"><button type="button" className={`nav-link ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Entrar</button></li>
            <li className="nav-item"><button type="button" className={`nav-link ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setError(''); }}>Cadastrar</button></li>
          </ul>
        )}

        {tab === 'login' || !allowRegistration ? (
          <form onSubmit={onLogin}>
            <div className="mb-3">
              <label className="form-label small fw-semibold" htmlFor="email">Email institucional</label>
              <input id="email" type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@ambuila.uige.gov.ao" autoComplete="username" required />
            </div>
            <div className="mb-3">
              <label className="form-label small fw-semibold" htmlFor="password">Palavra-passe</label>
              <input id="password" type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            {info && <div className="alert alert-success py-2 small" role="status">{info}</div>}
            <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
              <LogIn size={16} /> {loading ? 'A autenticar…' : 'Entrar no Painel'}
            </button>
            {!allowRegistration && <p className="small text-muted text-center mt-3 mb-0">O acesso é concedido pela administração municipal.</p>}
          </form>
        ) : (
          <form onSubmit={onRegister}>
            <div className="mb-2"><label className="form-label small fw-semibold">Nome completo *</label><input name="name" className="form-control" required minLength={3} /></div>
            <div className="mb-2"><label className="form-label small fw-semibold">Email *</label><input name="email" type="email" className="form-control" required autoComplete="email" /></div>
            <div className="row g-2 mb-2">
              <div className="col-7"><label className="form-label small fw-semibold">Instituição / Sector</label><input name="institution" className="form-control" /></div>
              <div className="col-5"><label className="form-label small fw-semibold">Telefone</label><input name="phone" className="form-control" /></div>
            </div>
            <div className="mb-3"><label className="form-label small fw-semibold">Palavra-passe * (mín. 8)</label><input name="password" type="password" minLength={8} className="form-control" required autoComplete="new-password" /></div>
            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={pending}>
              <UserPlus size={16} /> {pending ? 'A enviar…' : 'Pedir acesso'}
            </button>
            <p className="small text-muted text-center mt-3 mb-0">A conta só fica activa depois de aprovada por um administrador.</p>
          </form>
        )}
        <div className="text-center mt-3"><Link href="/" className="small text-muted">← Voltar ao portal público</Link></div>
      </div>
    </div>
  );
}

export default function LoginForm(props: { allowRegistration: boolean; logoUrl: string }) {
  return <Suspense><Inner {...props} /></Suspense>;
}
