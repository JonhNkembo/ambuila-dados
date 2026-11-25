'use client';
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode, type RefObject } from 'react';
import { ArrowUp, Eye, EyeOff } from 'lucide-react';

/** Devolve [ref, visível]: fica true (uma só vez) quando o elemento entra no ecrã. */
export function useInView<T extends HTMLElement>(threshold = 0.15): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold, rootMargin: '0px 0px -40px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen];
}

/** Aparece com animação suave quando entra no ecrã. */
export function Reveal({
  children, delay = 0, variant, as: Tag = 'div', className = '', style,
}: {
  children: ReactNode; delay?: number; variant?: 'left' | 'scale'; as?: ElementType; className?: string; style?: CSSProperties;
}) {
  const [ref, seen] = useInView<HTMLElement>(0.12);
  const cls = ['reveal', variant ? `reveal-${variant}` : '', seen ? 'in' : '', className].filter(Boolean).join(' ');
  return <Tag ref={ref} className={cls} style={{ ...style, ['--reveal-delay' as string]: `${delay}ms` }}>{children}</Tag>;
}

/** Número que "sobe" até ao valor final quando fica visível. */
export function CountUp({ value, format = (n: number) => String(Math.round(n)), duration = 1400 }: {
  value: number; format?: (n: number) => string; duration?: number;
}) {
  const [ref, seen] = useInView<HTMLSpanElement>(0.3);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !isFinite(value)) { setN(value); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, duration]);
  return <span ref={ref}>{format(seen ? n : 0)}</span>;
}

/** Barra de progresso que enche com animação quando fica visível. `value` em 0–100. */
export function ProgressBar({ label, value, color, sub, display, large = false }: {
  label?: ReactNode; value: number; color?: string; sub?: ReactNode; display?: ReactNode; large?: boolean;
}) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  const pct = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
  return (
    <div ref={ref} className={`pbar ${large ? 'pbar-lg' : ''}`} style={color ? ({ ['--pbar-color' as string]: color } as CSSProperties) : undefined}>
      {(label || display !== undefined) && (
        <div className="pbar-head">
          <span className="pbar-label" title={typeof label === 'string' ? label : undefined}>{label}</span>
          <span className="pbar-value">{display ?? `${Math.round(pct)}%`}</span>
        </div>
      )}
      <div className="pbar-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={typeof label === 'string' ? label : 'Progresso'}>
        <div className="pbar-fill" style={{ width: seen ? `${pct}%` : '0%' }} />
      </div>
      {sub && <div className="pbar-sub">{sub}</div>}
    </div>
  );
}

/** Barra fina no topo que mostra o progresso de leitura da página. */
export function ScrollProgress() {
  const bar = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (bar.current) bar.current.style.width = `${max > 0 ? (h.scrollTop / max) * 100 : 0}%`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <div className="scroll-progress no-print" aria-hidden><span ref={bar} /></div>;
}

/** Botão "voltar ao topo" que aparece depois de descer a página. */
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button type="button" className={`to-top no-print ${show ? 'show' : ''}`} aria-label="Voltar ao topo"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <ArrowUp size={20} />
    </button>
  );
}

const STRENGTH = [
  { label: 'Muito fraca', color: '#B4412E' }, { label: 'Fraca', color: '#B4412E' }, { label: 'Razoável', color: '#C28B1E' },
  { label: 'Boa', color: '#6DAF7C' }, { label: 'Forte', color: '#1B5E3B' }, { label: 'Excelente', color: '#0F3D26' },
];
function passwordScore(p: string) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

/** Campo de palavra-passe com botão "mostrar/esconder" e (opcional) medidor de força. */
export function PasswordField({
  name, label, value, onChange, autoComplete = 'new-password', required = true, minLength, meter = false, id, placeholder, hint, className = 'mb-3',
}: {
  name: string; label: ReactNode; value?: string; onChange?: (v: string) => void; autoComplete?: string; required?: boolean;
  minLength?: number; meter?: boolean; id?: string; placeholder?: string; hint?: ReactNode; className?: string;
}) {
  const [show, setShow] = useState(false);
  const [inner, setInner] = useState('');
  const fid = id ?? name;
  const v = value ?? inner;
  const st = STRENGTH[passwordScore(v)];
  return (
    <div className={className}>
      <label className="form-label small fw-semibold" htmlFor={fid}>{label}</label>
      <div className="input-group">
        <input id={fid} name={name} type={show ? 'text' : 'password'} className="form-control" required={required} minLength={minLength}
          autoComplete={autoComplete} placeholder={placeholder} value={value}
          onChange={(e) => { setInner(e.target.value); onChange?.(e.target.value); }} />
        <button type="button" className="btn btn-outline-secondary" tabIndex={-1} onClick={() => setShow((x) => !x)}
          aria-label={show ? 'Esconder palavra-passe' : 'Mostrar palavra-passe'}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {meter && v && (
        <div className="mt-2">
          <div className="pbar-track" style={{ height: 6 }}>
            <div className="pbar-fill" style={{ width: `${(passwordScore(v) / 5) * 100}%`, ['--pbar-color' as string]: st.color, transition: 'width .3s' }} />
          </div>
          <div className="pbar-sub">Força: {st.label}</div>
        </div>
      )}
      {hint && <div className="form-text">{hint}</div>}
    </div>
  );
}
