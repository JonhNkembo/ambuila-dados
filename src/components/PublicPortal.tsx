'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck, MapPin, Search, Building2, Mail, Clock, FileText, ArrowRight, Database, Layers, Hammer,
} from 'lucide-react';
import Icon from './Icon';
import Brand from './Brand';
import { siteUrl } from '@/lib/site';
import ChartCanvas from './ChartCanvas';
import Map from './Map';
import DatasetDetailModal from './DatasetDetailModal';
import { BackToTop, CountUp, ProgressBar, Reveal, ScrollProgress } from './ui';
import { computeMunicipalMetrics } from '@/lib/metrics';
import { formatNumber, formatDate } from '@/lib/format';
import { MAP_CATEGORIES } from '@/lib/constants';
import { PALETTE } from '@/lib/theme';
import type { Category, Commune, Dataset, HeroImage, LocationPoint, PortalContent, Project, Publication } from '@/lib/types';

interface Props {
  datasets: Dataset[]; communes: Commune[]; categories: Category[]; projects: Project[];
  locations: LocationPoint[]; publications: Publication[]; loggedIn: boolean;
  logoUrl: string; hero: HeroImage[]; content: PortalContent[]; allowRegistration: boolean;
}

/** "12.500" ou "1500" sobem animados; qualquer outro texto (ex.: "98%") aparece tal como foi inserido. */
function BigValue({ value }: { value: string | null }) {
  const raw = (value ?? '').trim();
  if (/^\d{1,3}([.\s]\d{3})*$|^\d+$/.test(raw)) {
    return <CountUp value={Number(raw.replace(/[.\s]/g, ''))} format={(n) => formatNumber(Math.round(n))} />;
  }
  return <>{raw}</>;
}

export default function PublicPortal({ datasets, communes, categories, projects, locations, publications, loggedIn, logoUrl, hero, content, allowRegistration }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [comFilter, setComFilter] = useState('ALL');
  const [mapCat, setMapCat] = useState('ALL');
  const [mapCom, setMapCom] = useState('ALL');
  const [selected, setSelected] = useState<Dataset | null>(null);
  const [slide, setSlide] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    if (hero.length < 2) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % hero.length), 6500);
    return () => clearInterval(t);
  }, [hero.length]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const destaques = content.filter((c) => c.kind === 'destaque');
  const numeros = content.filter((c) => c.kind === 'numero');
  const noticias = content.filter((c) => c.kind === 'noticia');

  const stats = useMemo(
    () => computeMunicipalMetrics({ datasets, communes, institutions: [], projects }, { onlyPublished: true }),
    [datasets, communes, projects],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return datasets.filter(
      (d) =>
        (catFilter === 'ALL' || d.category === catFilter) &&
        (comFilter === 'ALL' || d.commune === comFilter) &&
        (!q || [d.name, d.description, d.category, d.commune, d.source].some((t) => (t ?? '').toLowerCase().includes(q))),
    );
  }, [datasets, search, catFilter, comFilter]);

  const mapPoints = locations.filter(
    (l) => (mapCat === 'ALL' || l.category === mapCat) && (mapCom === 'ALL' || l.commune === mapCom),
  );

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const pickCategory = (id: string) => { setCatFilter(id); go('sec-datasets-publicos'); };

  const kpis = [
    { label: 'População registada', num: stats.totalPopulation, sub: 'Habitantes', icon: 'users', cls: '' },
    { label: 'Rede escolar', num: stats.totalSchools, sub: `${formatNumber(stats.totalStudents)} alunos`, icon: 'graduation-cap', cls: 'kpi-success' },
    { label: 'Unidades sanitárias', num: stats.totalHealthUnits, sub: `${formatNumber(stats.totalHealthStaff)} profissionais`, icon: 'heart-pulse', cls: 'kpi-danger' },
    { label: 'Empresas', num: stats.totalCompanies, sub: 'Estabelecimentos formais', icon: 'briefcase', cls: 'kpi-dark' },
    { label: 'Cooperativas agrícolas', num: stats.totalCooperatives, sub: `${formatNumber(stats.totalProductionTons)} t produzidas`, icon: 'sprout', cls: 'kpi-warning' },
    { label: 'Datasets publicados', num: datasets.length, sub: `${communes.length} comunas`, icon: 'landmark', cls: '' },
  ];

  const communeNames = communes.map((c) => c.name);

  const navItems: [string, string][] = [
    ...(destaques.length || numeros.length ? [['sec-destaques', 'Destaques'] as [string, string]] : []),
    ['sec-indicadores', 'Indicadores'],
    ['sec-categorias', 'Categorias'],
    ...(projects.length ? [['sec-projectos', 'Projectos'] as [string, string]] : []),
    ['sec-mapa-publico', 'Mapa Territorial'],
    ['sec-datasets-publicos', 'Conjuntos de Dados'],
    ['sec-publicacoes', 'Relatórios & Notícias'],
    ['sec-sobre', 'Sobre'],
  ];

  // Destaca no menu a secção que está a ser lida
  const navKey = navItems.map(([id]) => id).join('|');
  useEffect(() => {
    const onScroll = () => {
      const line = window.innerHeight * 0.35;
      let cur = '';
      for (const id of navKey.split('|')) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) cur = id;
      }
      setActive(cur);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [navKey]);

  const sectionTitle = (kicker: string, title: string, sub?: string) => (
    <div className="mb-4">
      <span className="section-kicker">{kicker}</span>
      <h2 className="section-title">{title}</h2>
      {sub && <p className="text-muted mb-0" style={{ maxWidth: 640 }}>{sub}</p>}
    </div>
  );

  const projColor = (p: Project) => (p.progress >= 100 ? PALETTE.forest : p.progress >= 50 ? PALETTE.ochre : PALETTE.clay);
  const totalDs = Math.max(datasets.length, 1);

  return (
    <div id="public-portal-view">
      <ScrollProgress />

      {/* Faixa oficial */}
      <div className="gov-top-ribbon no-print">
        <div className="container py-1 d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="d-inline-block rounded-circle" style={{ width: 9, height: 9, background: 'linear-gradient(180deg,#CC092F 50%,#000 50%)', border: '1px solid #EAB308' }} />
            <span className="fw-semibold text-uppercase" style={{ letterSpacing: '0.04em' }}>
              República de Angola &bull; Governo Provincial do Uíge &bull; Administração Municipal de Ambuíla
            </span>
          </div>
          <a href="https://governo.gov.ao/" target="_blank" rel="noopener noreferrer" className="d-none d-md-inline text-white-50 text-decoration-none">
            Portal do Governo de Angola (governo.gov.ao)
          </a>
        </div>
      </div>

      {/* Navbar */}
      <nav className={`navbar navbar-expand-lg public-navbar sticky-top ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-3" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>
            <Brand logoUrl={logoUrl} height={52} />
            <div>
              <div className="gov-kicker">Governo de Angola</div>
              <div className="portal-title">Portal de Dados de Ambuíla</div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Província do Uíge &bull; Administração Municipal de Ambuíla</div>
            </div>
          </a>
          <button className="navbar-toggler" type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu" aria-expanded={menuOpen}>
            <span className="navbar-toggler-icon" />
          </button>
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto me-3 mb-2 mb-lg-0 gap-lg-1">
              {navItems.map(([id, label]) => (
                <li className="nav-item" key={id}>
                  <a className={`nav-link ${active === id ? 'active' : ''}`} href={`#${id}`} onClick={(e) => { e.preventDefault(); setMenuOpen(false); go(id); }}>{label}</a>
                </li>
              ))}
            </ul>
            {!loggedIn && allowRegistration && (
              <Link href="/login?cadastro=1" className="btn btn-inst-outline btn-sm px-3 py-2 me-2">Cadastrar</Link>
            )}
            <Link href={loggedIn ? '/admin' : '/login'} className="btn btn-inst-primary btn-sm px-3 py-2 d-flex align-items-center gap-2">
              <ShieldCheck size={16} /> <span>Painel Administrativo</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="top" className="public-hero">
        {hero.length > 0 && (
          <div className="hero-bg" aria-hidden>
            {hero.map((h, i) => (
              <div key={h.id} className={`hero-slide ${i === slide % hero.length ? 'active' : ''}`} style={{ backgroundImage: `url(${siteUrl(h.path)})` }} />
            ))}
            <div className="hero-overlay" />
          </div>
        )}
        <span className="hero-orb o1" aria-hidden />
        <span className="hero-orb o2" aria-hidden />
        <div className="container position-relative" style={{ zIndex: 3 }}>
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="hero-chip mb-3 anim-fade-up">
                <span className="dot" />
                <span>República de Angola &bull; Província do Uíge &bull; Município de Ambuíla</span>
              </div>
              <h1 className="hero-title mb-3 anim-fade-up anim-d1">
                Portal Municipal de <em>Dados Abertos</em> e Inteligência Territorial
              </h1>
              <p className="hero-quote mb-3 anim-fade-up anim-d2">
                &ldquo;Conhecer os dados. Compreender o território. Promover o desenvolvimento.&rdquo;
              </p>
              <p className="mb-4 anim-fade-up anim-d3" style={{ color: '#D5E4DB', maxWidth: 660 }}>
                Plataforma oficial de centralização, validação e disponibilização de informação estatística, geográfica e sectorial da
                Administração Municipal de Ambuíla para apoio à decisão pública, investigação científica e cidadania.
              </p>
              <div className="hero-search anim-fade-up anim-d4">
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
                  <input type="search" className="form-control border-0 shadow-none" value={search}
                    onChange={(e) => { setSearch(e.target.value); go('sec-datasets-publicos'); }}
                    placeholder="Pesquisar conjuntos de dados, escolas, saúde, agricultura, comunas..." aria-label="Pesquisa global" />
                </div>
                <button className="btn btn-inst-primary px-4" onClick={() => go('sec-datasets-publicos')}>Pesquisar</button>
              </div>
              <div className="hero-stats anim-fade-up anim-d4">
                <div className="hero-stat"><b><CountUp value={datasets.length} format={formatNumber} /></b><span>Conjuntos publicados</span></div>
                <div className="hero-stat"><b><CountUp value={communes.length} format={formatNumber} /></b><span>Comunas</span></div>
                <div className="hero-stat"><b><CountUp value={locations.length} format={formatNumber} /></b><span>Locais no mapa</span></div>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="glass-panel p-4 anim-fade-up anim-d3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-bold text-uppercase" style={{ fontSize: '0.74rem', letterSpacing: '0.08em', color: '#F7DE8B' }}>Divisão Administrativa</span>
                  <span className="badge" style={{ backgroundColor: '#CC092F', color: '#fff' }}>Uíge • Angola</span>
                </div>
                <ul className="list-unstyled mb-0 small" style={{ color: '#E6F0EA' }}>
                  {[['Município:', 'Ambuíla'], ['Sede Municipal:', 'Nova Ambuíla'], ['Comunas Oficiais:', communeNames.join(', ') || '—']].map(([k, v]) => (
                    <li key={k} className="py-2 border-bottom border-light border-opacity-10 d-flex justify-content-between gap-2">
                      <span style={{ color: '#A9C4B4' }}>{k}</span><span className="fw-semibold text-end">{v}</span>
                    </li>
                  ))}
                  <li className="py-2 d-flex justify-content-between">
                    <span style={{ color: '#A9C4B4' }}>Datasets Publicados:</span><span className="fw-bold" style={{ color: '#F7DE8B' }}>{datasets.length}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        {hero.length > 1 && (
          <div className="hero-dots">
            {hero.map((h, i) => <button key={h.id} className={i === slide % hero.length ? 'on' : ''} onClick={() => setSlide(i)} aria-label={`Foto ${i + 1}`} />)}
          </div>
        )}
        {hero[slide % Math.max(hero.length, 1)]?.caption && (
          <div className="container position-relative small mt-3" style={{ zIndex: 3, color: '#E2EDE6' }}>{hero[slide % hero.length].caption}</div>
        )}
      </section>

      {/* Município em destaque (inserido pelo Superadministrador) */}
      {(destaques.length > 0 || numeros.length > 0) && (
        <section id="sec-destaques" className="py-5">
          <div className="container">
            <Reveal>{sectionTitle('Município de Ambuíla', 'Ambuíla em Destaque')}</Reveal>
            {numeros.length > 0 && (
              <div className="row g-3 mb-4">
                {numeros.map((n, i) => (
                  <Reveal className="col-6 col-lg-3" key={n.id} delay={i * 90}>
                    <div className="inst-card inst-card-hover p-4 h-100" style={{ borderTop: '4px solid var(--inst-gold)' }}>
                      <div className="big-number"><BigValue value={n.big_value} /></div>
                      {n.big_label && <div className="text-uppercase fw-bold small text-muted mt-1" style={{ letterSpacing: '0.04em' }}>{n.big_label}</div>}
                      <div className="fw-bold text-inst-dark small mt-2">{n.title}</div>
                      {n.body && <div className="small text-muted mt-1">{n.body}</div>}
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
            {destaques.length > 0 && (
              <div className="row g-3">
                {destaques.map((d, i) => (
                  <Reveal className="col-md-6 col-xl-4" key={d.id} delay={(i % 3) * 100}>
                    <div className="inst-card inst-card-hover h-100 overflow-hidden">
                      {d.image_path && (
                        <div className="img-frame">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img className="destaque-img" src={siteUrl(d.image_path)!} alt={d.title} />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="h6 fw-bold text-inst-dark">{d.title}</h3>
                        <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{d.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Indicadores */}
      <section id="sec-indicadores" className={`py-5 ${destaques.length > 0 || numeros.length > 0 ? 'section-alt' : ''}`}>
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
            <Reveal>{sectionTitle('Monitorização Municipal', 'Indicadores Estatísticos em Destaque')}</Reveal>
            <span className="badge-demo mb-4">Apenas registos publicados</span>
          </div>
          <div className="row g-3">
            {kpis.map((k, i) => (
              <Reveal className="col-6 col-md-4 col-xl-2" key={k.label} delay={i * 70}>
                <div className={`kpi-card h-100 ${k.cls}`}>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                    <span className="kpi-label" style={{ fontSize: '0.68rem' }}>{k.label}</span>
                    <span className="kpi-icon"><Icon name={k.icon} size={17} /></span>
                  </div>
                  <div className="kpi-value"><CountUp value={k.num} format={formatNumber} /></div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>{k.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="row g-4 mt-1">
            <Reveal className="col-lg-6">
              <div className="inst-card p-4 h-100">
                <h3 className="h6 fw-bold text-inst-dark mb-3">Conjuntos de Dados Publicados por Categoria</h3>
                <ChartCanvas height={260} legend={false} integer labels={categories.map((c) => c.id)}
                  series={[{ label: 'Datasets Publicados', color: PALETTE.forest, data: categories.map((c) => datasets.filter((d) => d.category === c.id).length) }]} />
              </div>
            </Reveal>
            <Reveal className="col-lg-6" delay={120}>
              <div className="inst-card p-4 h-100">
                <h3 className="h6 fw-bold text-inst-dark mb-3">Infraestruturas e Serviços por Comuna</h3>
                <ChartCanvas height={260} labels={communeNames} series={[
                  { label: 'Escolas', color: PALETTE.forest, data: communeNames.map((c) => datasets.filter((d) => d.commune === c).reduce((s, d) => s + (Number(d.metrics?.escolas) || 0), 0)) },
                  { label: 'Unidades sanitárias', color: PALETTE.clay, data: communeNames.map((c) => datasets.filter((d) => d.commune === c).reduce((s, d) => s + (Number(d.metrics?.unidadesSanitarias) || 0), 0)) },
                  { label: 'Cooperativas', color: PALETTE.ochre, data: communeNames.map((c) => datasets.filter((d) => d.commune === c).reduce((s, d) => s + (Number(d.metrics?.cooperativas) || 0), 0)) },
                ]} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="sec-categorias" className={`py-5 ${destaques.length > 0 || numeros.length > 0 ? '' : 'section-alt'}`}>
        <div className="container">
          <Reveal>{sectionTitle('Taxonomia Sectorial', 'Explorar por Categoria de Dados', 'Seleccione uma área temática para filtrar os conjuntos de dados públicos disponíveis.')}</Reveal>
          <div className="row g-3">
            {categories.map((c, i) => {
              const n = datasets.filter((d) => d.category === c.id).length;
              return (
                <Reveal className="col-sm-6 col-lg-4 col-xl" key={c.id} delay={(i % 5) * 70} style={{ minWidth: 200 }}>
                  <button type="button" className="category-tile w-100 h-100" onClick={() => pickCategory(c.id)}>
                    <div className="inst-card inst-card-hover p-3 h-100">
                      <div className="category-icon-box mb-2"><Icon name={c.icon} size={21} /></div>
                      <div className="fw-bold text-inst-dark small">{c.id}</div>
                      <div className="text-muted mb-3" style={{ fontSize: '0.72rem' }}>{c.description}</div>
                      <ProgressBar value={(n / totalDs) * 100} color={PALETTE.forest}
                        label={`${n} ${n === 1 ? 'conjunto' : 'conjuntos'}`} display={`${Math.round((n / totalDs) * 100)}%`} />
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Projectos municipais (execução real, vinda da base de dados) */}
      {projects.length > 0 && (
        <section id="sec-projectos" className="py-5 section-alt">
          <div className="container">
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-2">
              <Reveal>{sectionTitle('Investimento Público', 'Execução dos Projectos Municipais', 'Acompanhe o estado de execução física das obras e programas de desenvolvimento do município.')}</Reveal>
              <div className="d-flex gap-3 small text-muted mb-4">
                <span className="d-inline-flex align-items-center gap-1"><Hammer size={14} /> {projects.length} projecto{projects.length === 1 ? '' : 's'}</span>
                <span className="d-inline-flex align-items-center gap-1"><Layers size={14} /> {projects.filter((p) => p.progress >= 100).length} concluído{projects.filter((p) => p.progress >= 100).length === 1 ? '' : 's'}</span>
              </div>
            </div>
            <div className="row g-3">
              {projects.map((p, i) => (
                <Reveal className="col-md-6 col-xl-4" key={p.id} delay={(i % 3) * 90}>
                  <div className="inst-card inst-card-hover project-card h-100">
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <h3 className="h6 fw-bold text-inst-dark mb-0">{p.name}</h3>
                      {p.is_demo && <span className="badge-demo flex-shrink-0">Demo</span>}
                    </div>
                    <div className="meta mb-3">{[p.sector, p.commune, p.year].filter(Boolean).join(' • ')}{p.budget ? ` • ${p.budget}` : ''}</div>
                    <ProgressBar large value={p.progress} color={projColor(p)} label={p.status} sub="Execução física" />
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mapa */}
      <section id="sec-mapa-publico" className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
            <Reveal>{sectionTitle('Georreferenciação Municipal', 'Mapa Interactivo do Território de Ambuíla', 'Escolas, unidades sanitárias, infraestruturas, zonas agrícolas e projectos municipais.')}</Reveal>
            <div className="d-flex flex-wrap gap-2 mb-4">
              <select className="form-select form-select-sm w-auto" value={mapCat} onChange={(e) => setMapCat(e.target.value)} aria-label="Categoria do mapa">
                <option value="ALL">Todas as Categorias</option>
                {MAP_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className="form-select form-select-sm w-auto" value={mapCom} onChange={(e) => setMapCom(e.target.value)} aria-label="Comuna do mapa">
                <option value="ALL">Todas as Comunas</option>
                {communeNames.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <Reveal variant="scale">
            <div className="inst-card p-3">
              <div className="alert alert-light border py-2 px-3 mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2 small">
                <span><MapPin size={14} className="text-inst-primary me-1" /> Clique num marcador para consultar detalhes e coordenadas registadas.</span>
                <span className="badge-demo">Coordenadas de referência / demonstração</span>
              </div>
              <Map locations={mapPoints} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Datasets */}
      <section id="sec-datasets-publicos" className="py-5 section-alt">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <Reveal>{sectionTitle('Catálogo de Dados Abertos', 'Conjuntos de Dados Publicados')}</Reveal>
            <div className="d-flex flex-wrap gap-2">
              <select className="form-select form-select-sm w-auto" value={catFilter} onChange={(e) => setCatFilter(e.target.value)} aria-label="Categoria">
                <option value="ALL">Todas as Categorias</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
              </select>
              <select className="form-select form-select-sm w-auto" value={comFilter} onChange={(e) => setComFilter(e.target.value)} aria-label="Comuna">
                <option value="ALL">Todas as Comunas</option>
                {communeNames.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setCatFilter('ALL'); setComFilter('ALL'); }}>Limpar Filtros</button>
            </div>
          </div>
          {(search.trim() || catFilter !== 'ALL' || comFilter !== 'ALL') && (
            <div className="small text-muted mb-3 d-flex align-items-center gap-2">
              <Database size={14} /> {filtered.length} de {datasets.length} conjuntos
              <div style={{ width: 140 }}><ProgressBar value={(filtered.length / totalDs) * 100} color={PALETTE.ochre} display="" /></div>
            </div>
          )}
          <div className="row g-3">
            {filtered.length === 0 && (
              <div className="col-12"><div className="alert alert-light border mb-0">Nenhum conjunto de dados publicado corresponde aos filtros seleccionados.</div></div>
            )}
            {filtered.map((d, i) => (
              <Reveal className="col-md-6 col-xl-4" key={d.id} delay={(i % 3) * 80}>
                <div className="inst-card inst-card-hover p-3 h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-inst-primary border">{d.category}</span>
                    {d.is_demo && <span className="badge-demo">Demo</span>}
                  </div>
                  <h3 className="h6 fw-bold text-inst-dark">{d.name}</h3>
                  <p className="small text-muted flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.description}</p>
                  <div className="small text-muted mb-3">{d.commune} &bull; {d.year} &bull; Actualizado em {formatDate(d.updated_at)}</div>
                  <button className="btn btn-sm btn-inst-outline align-self-start d-inline-flex align-items-center gap-1" onClick={() => setSelected(d)}>
                    Ver detalhes <ArrowRight size={14} />
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Publicações e notícias (só aparece o que foi inserido) */}
      {(publications.length > 0 || noticias.length > 0) && (
        <section id="sec-publicacoes" className="py-5">
          <div className="container">
            <div className="row g-4">
              {publications.length > 0 && (
                <div className="col-lg-7">
                  <Reveal>{sectionTitle('Biblioteca Técnica', 'Publicações e Relatórios Oficiais')}</Reveal>
                  <div className="d-flex flex-column gap-3">
                    {publications.map((p, i) => (
                      <Reveal key={p.id} delay={(i % 4) * 70}>
                        <div className="inst-card inst-card-hover pub-card p-3 d-flex gap-3 align-items-start">
                          <div className="category-icon-box flex-shrink-0 mb-0"><FileText size={20} /></div>
                          <div>
                            <span className="badge bg-light text-inst-primary border mb-1">{p.type}</span>
                            <h4 className="h6 fw-bold text-inst-dark mb-1">{p.title}</h4>
                            <div className="small text-muted">{p.category} &bull; {p.author} &bull; {p.year}</div>
                          </div>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
              {noticias.length > 0 && (
                <div className={publications.length > 0 ? 'col-lg-5' : 'col-12'}>
                  <Reveal>{sectionTitle('Actualidade Institucional', 'Notícias e Comunicados')}</Reveal>
                  <div className="d-flex flex-column gap-3">
                    {noticias.map((n, i) => (
                      <Reveal key={n.id} delay={(i % 4) * 70}>
                        <div className="inst-card inst-card-hover news-card p-3">
                          <div className="small text-muted mb-1 d-flex align-items-center gap-1"><Clock size={13} /> {formatDate(n.created_at)}</div>
                          <h4 className="h6 fw-bold text-inst-dark mb-1">{n.title}</h4>
                          <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{n.body}</p>
                        </div>
                      </Reveal>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sobre */}
      <section id="sec-sobre" className="py-5 section-alt">
        <div className="container">
          <div className="row g-4">
            <Reveal className="col-lg-7">
              {sectionTitle('Sobre a Plataforma', 'Sobre o Projecto AMBÚILA DATA')}
              <p className="text-muted">
                O <strong className="text-inst-dark">AMBÚILA DATA – Portal Municipal de Dados e Inteligência Territorial</strong> é uma iniciativa institucional concebida para dotar o
                Município de Ambuíla (Província do Uíge, Angola) de um ecossistema moderno de governação baseada em evidências.
              </p>
              <p className="text-muted mb-0">
                A plataforma articula a recolha descentralizada junto das direcções municipais, instituições públicas, investigadores e parceiros locais com
                um fluxo rigoroso de validação técnica, auditoria e disponibilização pública, promovendo transparência administrativa e desenvolvimento sustentável.
              </p>
            </Reveal>
            <Reveal className="col-lg-5" delay={120}>
              <div className="inst-card p-4" style={{ background: 'linear-gradient(160deg,#FBF9F3,#fff)' }}>
                <h3 className="h6 fw-bold text-inst-dark mb-3">Contactos Institucionais</h3>
                <ul className="list-unstyled small text-muted mb-0 d-flex flex-column gap-3">
                  <li className="d-flex align-items-start gap-3"><span className="kpi-icon" style={{ ['--kpi-accent' as string]: PALETTE.forest }}><Building2 size={16} /></span>
                    <span><strong className="text-inst-dark">Administração Municipal de Ambuíla</strong><br />Gabinete de Estudos, Planeamento e Estatística (GEPE)</span></li>
                  <li className="d-flex align-items-center gap-3"><span className="kpi-icon" style={{ ['--kpi-accent' as string]: PALETTE.clay }}><MapPin size={16} /></span><span>Sede Municipal de Ambuíla, Província do Uíge, Angola</span></li>
                  <li className="d-flex align-items-center gap-3"><span className="kpi-icon" style={{ ['--kpi-accent' as string]: PALETTE.ochre }}><Mail size={16} /></span><span>dados@ambuila.uige.gov.ao</span></li>
                  <li className="d-flex align-items-center gap-3"><span className="kpi-icon" style={{ ['--kpi-accent' as string]: PALETTE.river }}><Clock size={16} /></span><span></span></li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="row align-items-center gy-3">
            <div className="col-md-6">
              <div className="fw-bold text-uppercase" style={{ letterSpacing: '0.1em', fontFamily: 'var(--font-head)' }}>Governo de Angola</div>
              <div className="small" style={{ color: '#A9C4B4' }}>Portal de Dados de Ambuíla &bull; Administração Municipal de Ambuíla, Província do Uíge.</div>
            </div>
            <div className="col-md-6 text-md-end small" style={{ color: '#A9C4B4' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: '#F6E7B5' }}>&ldquo;Conhecer os dados. Compreender o território. Promover o desenvolvimento.&rdquo;</div>
              <div className="mt-1">&copy;</div>
            </div>
          </div>
        </div>
      </footer>
      <div className="flag-stripe" />

      <BackToTop />
      <DatasetDetailModal dataset={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
