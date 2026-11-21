'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, FolderKanban, BarChart3, Users, GraduationCap, HeartPulse, Briefcase, Sprout, Construction,
  Trees, Landmark, Building2, Microscope, Map as MapIcon, ClipboardList, FileSpreadsheet, BookOpen, UserCog,
  Bot, History, Settings, UserCircle, LogOut, Menu, X, Globe, Plus, Images, type LucideIcon,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import Brand from './Brand';
import { canManageHeroAndRegistration, canManageUsers, canSubmit, canViewAudit, isAdminLevel } from '@/lib/permissions';
import { createClient } from '@/lib/supabase/client';
import { recordAuth } from '@/app/admin/actions';

interface NavItem { href: string; label: string; icon: LucideIcon; title: string; sub: string; show?: (p: Profile) => boolean }

const mod = (n: number, cat: string, icon: LucideIcon, label = cat): NavItem => ({
  href: `/admin/modulos/${encodeURIComponent(cat)}`, label: `${n}. ${label}`, icon, title: cat,
  sub: `Módulo Temático Sectorial • ${cat} em Ambuíla`,
});

const SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Principal', items: [
    { href: '/admin', label: '1. Visão geral', icon: LayoutDashboard, title: 'Visão Geral', sub: 'Dashboard Executivo e Inteligência Territorial • Município de Ambuíla' },
    { href: '/admin/conjuntos-dados', label: '2. Conjuntos de dados', icon: FolderKanban, title: 'Conjuntos de Dados e Submissões', sub: 'Gestão do ciclo de vida: Submissão, Validação, Publicação e Exportação' },
    { href: '/admin/indicadores', label: '3. Indicadores estatísticos', icon: BarChart3, title: 'Indicadores Estatísticos Municipais', sub: 'Consolidação de séries e metas sectoriais por comuna' },
  ] },
  { title: 'Módulos Temáticos', items: [
    mod(4, 'Demografia', Users), mod(5, 'Educação', GraduationCap), mod(6, 'Saúde', HeartPulse),
    mod(7, 'Economia e negócios', Briefcase), mod(8, 'Agricultura', Sprout), mod(9, 'Infraestruturas', Construction),
    mod(10, 'Ambiente e recursos naturais', Trees, 'Ambiente e recursos'), mod(11, 'Cultura e património', Landmark),
    mod(12, 'Administração pública', Building2), mod(13, 'Ciência e investigação', Microscope),
  ] },
  { title: 'Território & Gestão', items: [
    { href: '/admin/mapa', label: '14. Mapa interactivo', icon: MapIcon, title: 'Mapa Interactivo Territorial', sub: 'Georreferenciação e registo de coordenadas reais de infraestruturas' },
    { href: '/admin/projectos', label: '15. Projectos municipais', icon: ClipboardList, title: 'Projectos Municipais', sub: 'Carteira de investimentos, obras públicas e programas de desenvolvimento' },
    { href: '/admin/relatorios', label: '16. Relatórios', icon: FileSpreadsheet, title: 'Gerador de Relatórios Institucionais', sub: 'Emissão de relatórios oficiais em PDF, Excel/CSV com fontes e datas de referência' },
    { href: '/admin/biblioteca', label: '17. Biblioteca digital', icon: BookOpen, title: 'Biblioteca Digital Municipal', sub: 'Repositório de anuários, estudos técnicos, planos e legislação local' },
    { href: '/admin/instituicoes', label: '18. Instituições', icon: Landmark, title: 'Instituições Parceiras e Órgãos', sub: 'Entidades produtoras e validadoras de informação municipal' },
    { href: '/admin/utilizadores', label: '19. Utilizadores', icon: UserCog, title: 'Gestão de Utilizadores e Perfis', sub: 'Controlo de acessos, funções institucionais, cadastro e permissões', show: canManageUsers },
  ] },
  { title: 'Inteligência & Controlo', items: [
    { href: '/admin/agente-ai', label: '20. Agente inteligente', icon: Bot, title: 'AMBÚILA AI – Agente Inteligente', sub: 'Consulta em linguagem natural fundamentada exclusivamente nos dados registados' },
    { href: '/admin/auditoria', label: '21. Auditoria', icon: History, title: 'Auditoria e Registo de Actividades', sub: 'Rastreabilidade completa de submissões, validações, edições e acessos', show: canViewAudit },
    { href: '/admin/configuracoes', label: '22. Configurações', icon: Settings, title: 'Configurações do Sistema', sub: 'Gestão de comunas e parâmetros institucionais', show: isAdminLevel },
    { href: '/admin/portal', label: '23. Conteúdo do portal', icon: Images, title: 'Conteúdo do Portal', sub: 'Fotos do painel principal, destaques, números em grande, notícias e logótipo', show: canManageHeroAndRegistration },
  ] },
];

const PROFILE_ITEM = { title: 'Meu Perfil', sub: 'Dados pessoais, segurança da conta e histórico de actividade' };

export default function AdminShell({ profile, logoUrl, children }: { profile: Profile; logoUrl: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const sections = SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => !i.show || i.show(profile)) })).filter((s) => s.items.length);
  const all = SECTIONS.flatMap((s) => s.items);
  const current =
    pathname === '/admin/perfil' ? PROFILE_ITEM
    : all.find((i) => decodeURIComponent(pathname) === decodeURIComponent(i.href)) ?? all[0];
  const isActive = (href: string) => decodeURIComponent(pathname) === decodeURIComponent(href);

  async function logout() {
    await recordAuth('logout');
    await createClient().auth.signOut();
    router.push('/');
    router.refresh();
  }

  const initials = profile.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div id="admin-wrapper">
      <aside id="admin-sidebar" className={`no-print ${open ? 'show' : ''}`}>
        <div className="sidebar-header d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <div className="bg-white rounded p-1 d-flex"><Brand logoUrl={logoUrl} height={32} /></div>
            <div>
              <div className="text-white lh-1" style={{ fontSize: '0.62rem', letterSpacing: '0.12em', color: '#FDE68A' }}>GOVERNO DE ANGOLA</div>
              <div className="fw-bold text-white lh-1 mt-1" style={{ fontSize: '0.82rem' }}>DADOS DE AMBUÍLA</div>
            </div>
          </div>
          <button className="btn btn-sm text-white d-lg-none p-0" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        <div className="sidebar-scroll">
          {sections.map((s) => (
            <div key={s.title}>
              <div className="sidebar-section-title">{s.title}</div>
              {s.items.map((i) => (
                <Link key={i.href} href={i.href} className={`sidebar-link ${isActive(i.href) ? 'active' : ''}`} onClick={() => setOpen(false)}>
                  <i.icon size={17} /><span>{i.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="sidebar-footer">
          <Link href="/admin/perfil" className={`sidebar-link ${pathname === '/admin/perfil' ? 'active' : ''}`} onClick={() => setOpen(false)}>
            <UserCircle size={17} /><span>Meu perfil</span>
          </Link>
          <a className="sidebar-link text-danger" role="button" onClick={logout}><LogOut size={17} /><span>Terminar sessão</span></a>
        </div>
      </aside>

      <div id="admin-main">
        <header className="admin-topbar d-flex align-items-center justify-content-between gap-3 no-print">
          <div className="d-flex align-items-center gap-3">
            <button className="btn btn-sm btn-outline-secondary d-lg-none" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={18} /></button>
            <div>
              <h1 className="h5 fw-bold text-inst-dark mb-0">{current.title}</h1>
              <small className="text-muted">{current.sub}</small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-3">
            <Link href="/" className="btn btn-sm btn-outline-secondary d-none d-sm-inline-flex align-items-center gap-1"><Globe size={15} /><span>Ver Portal Público</span></Link>
            {canSubmit(profile) && (
              <Link href="/admin/conjuntos-dados?novo=1" className="btn btn-sm btn-inst-primary d-flex align-items-center gap-1">
                <Plus size={16} /><span className="d-none d-md-inline">Submeter Dados</span>
              </Link>
            )}
            <Link href="/admin/perfil" className="d-flex align-items-center gap-2 border-start ps-3 text-decoration-none">
              <div className="bg-inst-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 34, height: 34, fontSize: '0.8rem' }}>{initials}</div>
              <div className="d-none d-md-block lh-1">
                <div className="fw-semibold small text-inst-dark">{profile.name}</div>
                <small className="text-muted" style={{ fontSize: '0.72rem' }}>{profile.role}</small>
              </div>
            </Link>
          </div>
        </header>
        <main className="p-3 p-md-4 flex-grow-1">{children}</main>
      </div>
    </div>
  );
}
