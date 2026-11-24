'use client';
import { Suspense, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, UserPlus, BarChart3, Map as MapIcon, ShieldCheck } from 'lucide-react';
import Brand from './Brand';
import { createClient } from '@/lib/supabase/client';
import { recordAuth } from '@/app/admin/actions';
import { registerSelf } from '@/app/login/actions';
import { ROLES } from '@/lib/constants';
import type { Role } from '@/lib/types';

function Inner({ allowRegistration, firstUser, mode, categories, logoUrl }: { allowRegistration: boolean; firstUser: boolean; mode: 'email' | 'approval'; categories: string[]; logoUrl: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(firstUser || (allowRegistration && params.get('cadastro') === '1') ? 'register' : 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const erro = params.get('erro');
  const [error, setError] = useState(
    erro === 'inactivo' ? 'A sua conta está inactiva ou a aguardar aprovação de um administrador.'
    : erro === 'pendente' ? 'Email confirmado. A conta aguarda aprovação de um administrador.'
    : erro === 'link' ? 'Ligação de confirmação inválida ou expirada. Faça novo cadastro ou peça reenvio.' : '');
  const [info, setInfo] = useState('');
  const [notConfirmed, setNotConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [wantedRole, setWantedRole] = useState<Role>('Funcionário Normal');
  const [pending, start] = useTransition();

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setInfo(''); setNotConfirmed(false);
    const { error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      if (/not confirmed/i.test(error.message)) { setNotConfirmed(true); setError('Ainda não confirmou o email. Abra a ligação que lhe enviámos.'); }
      else setError('Credenciais inválidas. Verifique o email e a palavra-passe.');
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
      if (r.ok && r.redirect) { router.push('/admin'); router.refresh(); return; }
      if (r.ok) { setInfo(r.message); form.reset(); setTab('login'); } else setError(r.message);
    });
  }

  return (
    <div className="auth-shell">
      <aside className="auth-side">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white rounded-3 p-2 d-flex"><Brand logoUrl={logoUrl} height={44} /></div>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.16em', color: '#F7DE8B', fontWeight: 800 }}>GOVERNO DE ANGOLA</div>
            <div className="fw-bold text-uppercase" style={{ fontFamily: 'var(--font-head)', letterSpacing: '0.02em' }}>Portal de Dados de Ambuíla</div>
          </div>
        </div>

        <div>
          <h2 className="fw-bold mb-3" style={{ fontSize: 'clamp(1.8rem, 2.6vw, 2.5rem)', letterSpacing: '-0.03em', lineHeight: 1.12 }}>
            Dados fiáveis para <span style={{ color: '#F7DE8B' }}>decisões públicas</span> melhores.
          </h2>
          <p style={{ color: '#CFE3D6', maxWidth: 440 }} className="mb-4">
            Painel de submissão, validação e publicação da informação estatística, geográfica e sectorial do Município de Ambuíla.
          </p>
          <div className="d-flex flex-column gap-2" style={{ maxWidth: 460 }}>
            <div className="auth-feature"><span className="ic"><BarChart3 size={18} /></span><div><div className="fw-semibold">Indicadores em tempo real</div><div className="small" style={{ color: '#CFE3D6' }}>Dashboards e relatórios calculados a partir dos dados validados.</div></div></div>
            <div className="auth-feature"><span className="ic"><MapIcon size={18} /></span><div><div className="fw-semibold">Mapa territorial</div><div className="small" style={{ color: '#CFE3D6' }}>Escolas, unidades sanitárias e projectos georreferenciados.</div></div></div>
            <div className="auth-feature"><span className="ic"><ShieldCheck size={18} /></span><div><div className="fw-semibold">Validação e auditoria</div><div className="small" style={{ color: '#CFE3D6' }}>Cada submissão é revista e fica registada.</div></div></div>
          </div>
        </div>

        <div className="small" style={{ color: '#A9C4B4' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#F6E7B5' }}>&ldquo;Conhecer os dados. Compreender o território. Promover o desenvolvimento.&rdquo;</span>
          <div className="mt-2">&copy; 2026 Administração Municipal de Ambuíla</div>
        </div>
      </aside>

      <main className="auth-panel">
        <div className="auth-card">
          <div className="d-flex align-items-center gap-3 mb-4 d-lg-none">
            <Brand logoUrl={logoUrl} height={48} />
            <div>
              <div className="gov-kicker">Governo de Angola</div>
              <div className="portal-title" style={{ fontSize: '1rem' }}>Portal de Dados de Ambuíla</div>
            </div>
          </div>
          <div className="mb-4">
            <h1 className="h4 fw-bold text-inst-dark mb-1">{tab === 'register' && allowRegistration ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
            <small className="text-muted">Painel Administrativo • Acesso restrito</small>
          </div>

        {firstUser && (
          <div className="alert alert-info py-2 small">
            <strong>Primeiro acesso:</strong> ainda não existe nenhum utilizador. O primeiro cadastro (confirmado por email) cria o <strong>Superadministrador</strong> do portal.
          </div>
        )}

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
            {notConfirmed && (
              <button type="button" className="btn btn-link btn-sm px-0 mb-2" onClick={async () => { await createClient().auth.resend({ type: 'signup', email: email.trim() }); setInfo('Email de confirmação reenviado.'); setError(''); }}>Reenviar email de confirmação</button>
            )}
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
            {!firstUser && (
              <div className="mb-2">
                <label className="form-label small fw-semibold">Perfil pretendido *</label>
                <select name="requested_role" className="form-select" value={wantedRole} onChange={(e) => setWantedRole(e.target.value as Role)}>
                  {[...ROLES].reverse().map((r) => <option key={r}>{r}</option>)}
                </select>
                {wantedRole === 'Funcionário de Sector' && (
                  <select name="requested_sector" className="form-select mt-2" required defaultValue="">
                    <option value="" disabled>Sector…</option>{categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                )}
                <div className="form-text">{mode === 'email' ? 'Ao confirmar o email, a conta fica activa com este perfil.' : 'O perfil é um pedido: só é atribuído quando um administrador com nível suficiente o aprovar.'}</div>
              </div>
            )}
            <div className="mb-3"><label className="form-label small fw-semibold">Palavra-passe * (mín. 8)</label><input name="password" type="password" minLength={8} className="form-control" required autoComplete="new-password" /></div>
            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            <button className="btn btn-inst-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={pending}>
              <UserPlus size={16} /> {pending ? 'A enviar…' : firstUser ? 'Criar Superadministrador' : 'Cadastrar e confirmar por email'}
            </button>
            <p className="small text-muted text-center mt-3 mb-0">{firstUser || mode === 'email' ? 'Enviaremos um email para confirmar a conta.' : 'Depois de confirmar o email, a conta aguarda aprovação de um administrador.'}</p>
          </form>
        )}
        <div className="text-center mt-3"><Link href="/" className="small text-muted">← Voltar ao portal público</Link></div>
        </div>
      </main>
    </div>
  );
}

export default function LoginForm(props: { allowRegistration: boolean; firstUser: boolean; mode: 'email' | 'approval'; categories: string[]; logoUrl: string }) {
  return <Suspense><Inner {...props} /></Suspense>;
}
