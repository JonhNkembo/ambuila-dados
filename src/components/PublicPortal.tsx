'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Landmark, ShieldCheck, MapPin, Search, Info, Building2, Mail, Clock, FileText, ArrowRight,
} from 'lucide-react';
import Icon from './Icon';
import Brand from './Brand';
import { siteUrl } from '@/lib/site';
import ChartCanvas from './ChartCanvas';
import Map from './Map';
import DatasetDetailModal from './DatasetDetailModal';
import { computeMunicipalMetrics } from '@/lib/metrics';
import { formatNumber, formatDate } from '@/lib/format';
import { MAP_CATEGORIES } from '@/lib/constants';
import type { Category, Commune, Dataset, HeroImage, LocationPoint, PortalContent, Project, Publication } from '@/lib/types';

interface Props {
  datasets: Dataset[]; communes: Commune[]; categories: Category[]; projects: Project[];
  locations: LocationPoint[]; publications: Publication[]; loggedIn: boolean;
  logoUrl: string; hero: HeroImage[]; content: PortalContent[]; allowRegistration: boolean;
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
  useEffect(() => {
    if (hero.length < 2) return;
    const t = setInterval(() => setSlide((i) => (i + 1) % hero.length), 6500);
    return () => clearInterval(t);
  }, [hero.length]);

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
    { label: 'População registada', val: formatNumber(stats.totalPopulation), sub: 'Habitantes', icon: 'users' },
    { label: 'Rede escolar', val: formatNumber(stats.totalSchools), sub: `${formatNumber(stats.totalStudents)} alunos`, icon: 'graduation-cap' },
    { label: 'Unidades sanitárias', val: formatNumber(stats.totalHealthUnits), sub: `${formatNumber(stats.totalHealthStaff)} profissionais`, icon: 'heart-pulse' },
    { label: 'Empresas', val: formatNumber(stats.totalCompanies), sub: 'Estabelecimentos formais', icon: 'briefcase' },
    { label: 'Cooperativas agrícolas', val: formatNumber(stats.totalCooperatives), sub: `${formatNumber(stats.totalProductionTons)} t produzidas`, icon: 'sprout' },
    { label: 'Datasets publicados', val: formatNumber(datasets.length), sub: `${communes.length} comunas`, icon: 'landmark' },
  ];

  const communeNames = communes.map((c) => c.name);
  const sectionTitle = (kicker: string, title: string, sub?: string) => (
    <div className="mb-4">
      <span className="text-uppercase fw-bold text-inst-primary" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>{kicker}</span>
      <h2 className="h4 fw-bold text-inst-dark mb-1">{title}</h2>
      {sub && <p className="text-muted small mb-0">{sub}</p>}
    </div>
  );

  return (
    <div id="public-portal-view">
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
      <nav className="navbar navbar-expand-lg public-navbar sticky-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-3" href="#top" onClick={(e) => { e.preventDefault(); go('top'); }}>
            <Brand logoUrl={logoUrl} height={52} />
            <div>
              <div className="gov-kicker">Governo de Angola</div>
              <div className="portal-title">Portal de Dados de Ambuíla</div>
              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Província do Uíge &bull; Administração Municipal de Ambuíla</div>
            </div>
          </a>
          <button className="navbar-toggler" type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <span className="navbar-toggler-icon" />
          </button>
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
            <ul className="navbar-nav ms-auto me-3 mb-2 mb-lg-0 gap-lg-2">
              {[...(destaques.length || numeros.length ? [['sec-destaques', 'Destaques']] : []), ['sec-indicadores', 'Indicadores'], ['sec-categorias', 'Categorias'], ['sec-mapa-publico', 'Mapa Territorial'],
                ['sec-datasets-publicos', 'Conjuntos de Dados'], ['sec-publicacoes', 'Relatórios & Notícias'], ['sec-sobre', 'Sobre']].map(([id, label]) => (
                <li className="nav-item" key={id}>
                  <a className="nav-link fw-medium text-inst-dark" href={`#${id}`} onClick={(e) => { e.preventDefault(); setMenuOpen(false); go(id); }}>{label}</a>
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
        <div className="container position-relative" style={{ zIndex: 2 }}>
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded mb-3" style={{ background: 'rgba(255,255,255,0.08)', borderLeft: '3px solid #EAB308', fontSize: '0.8rem' }}>
                <MapPin size={14} color="#EAB308" />
                <span>República de Angola &bull; Província do Uíge &bull; Município de Ambuíla</span>
              </div>
              <h1 className="display-6 fw-bold mb-2">Portal Municipal de Dados Abertos e Inteligência Territorial</h1>
              <p className="lead mb-3" style={{ color: '#FDE68A', fontSize: '1.02rem' }}>
                <em>&ldquo;Conhecer os dados. Compreender o território. Promover o desenvolvimento.&rdquo;</em>
              </p>
              <p className="mb-4" style={{ color: '#CBD5E1', maxWidth: 680 }}>
                Plataforma oficial de centralização, validação e disponibilização de informação estatística, geográfica e sectorial da
                Administração Municipal de Ambuíla para apoio à decisão pública, investigação científica e cidadania.
              </p>
              <div className="bg-white p-2 rounded shadow-sm d-flex flex-column flex-sm-row gap-2" style={{ maxWidth: 680 }}>
                <div className="input-group">
                  <span className="input-group-text bg-transparent border-0 text-muted"><Search size={18} /></span>
                  <input type="search" className="form-control border-0 shadow-none" value={search}
                    onChange={(e) => { setSearch(e.target.value); go('sec-datasets-publicos'); }}
                    placeholder="Pesquisar conjuntos de dados, escolas, saúde, agricultura, comunas..." aria-label="Pesquisa global" />
                </div>
                <button className="btn btn-inst-primary px-4" onClick={() => go('sec-datasets-publicos')}>Pesquisar</button>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="p-4 rounded" style={{ background: 'rgba(7,25,48,0.75)', border: '1px solid rgba(255,255,255,0.15)', borderTop: '3px solid #CC092F' }}>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em', color: '#FDE68A' }}>Divisão Administrativa</span>
                  <span className="badge" style={{ backgroundColor: '#CC092F', color: '#fff' }}>Uíge • Angola</span>
                </div>
                <ul className="list-unstyled mb-0 small" style={{ color: '#E2E8F0' }}>
                  {[['Município:', 'Ambuíla'], ['Sede Municipal:', 'Nova Ambuíla'], ['Comunas Oficiais:', communeNames.join(', ') || '—']].map(([k, v]) => (
                    <li key={k} className="py-2 border-bottom border-secondary border-opacity-25 d-flex justify-content-between gap-2">
                      <span className="text-white-50">{k}</span><span className="fw-semibold text-end">{v}</span>
                    </li>
                  ))}
                  <li className="py-2 d-flex justify-content-between">
                    <span className="text-white-50">Datasets Publicados:</span><span className="fw-semibold text-warning">{datasets.length}</span>
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
          <div className="container position-relative small mt-3" style={{ zIndex: 2, color: '#E2E8F0' }}>{hero[slide % hero.length].caption}</div>
        )}
      </section>

      {/* Município em destaque (inserido pelo Superadministrador) */}
      {(destaques.length > 0 || numeros.length > 0) && (
        <section id="sec-destaques" className="py-5 bg-white border-bottom">
          <div className="container">
            {sectionTitle('Município de Ambuíla', 'Ambuíla em Destaque')}
            {numeros.length > 0 && (
              <div className="row g-3 mb-4">
                {numeros.map((n) => (
                  <div className="col-6 col-lg-3" key={n.id}>
                    <div className="inst-card p-4 h-100" style={{ borderTop: '3px solid #CC092F' }}>
                      <div className="big-number">{n.big_value}</div>
                      {n.big_label && <div className="text-uppercase fw-semibold small text-muted mt-1">{n.big_label}</div>}
                      <div className="fw-bold text-inst-dark small mt-2">{n.title}</div>
                      {n.body && <div className="small text-muted mt-1">{n.body}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {destaques.length > 0 && (
              <div className="row g-3">
                {destaques.map((d) => (
                  <div className="col-md-6 col-xl-4" key={d.id}>
                    <div className="inst-card h-100 overflow-hidden">
                      {d.image_path && /* eslint-disable-next-line @next/next/no-img-element */ <img className="destaque-img" src={siteUrl(d.image_path)!} alt={d.title} />}
                      <div className="p-3">
                        <h3 className="h6 fw-bold text-inst-dark">{d.title}</h3>
                        <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{d.body}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Indicadores */}
      <section id="sec-indicadores" className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-2">
            {sectionTitle('Monitorização Municipal', 'Indicadores Estatísticos em Destaque')}
            <span className="badge-demo">Apenas registos publicados</span>
          </div>
          <div className="row g-3">
            {kpis.map((k) => (
              <div className="col-6 col-md-4 col-xl-2" key={k.label}>
                <div className="kpi-card h-100">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <span className="kpi-label" style={{ fontSize: '0.7rem' }}>{k.label}</span>
                    <Icon name={k.icon} size={15} className="text-muted" />
                  </div>
                  <div className="kpi-value" style={{ fontSize: '1.35rem' }}>{k.val}</div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }}>{k.sub}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="row g-4 mt-2">
            <div className="col-lg-6">
              <div className="inst-card p-4 h-100">
                <h3 className="h6 fw-bold text-inst-dark mb-3">Conjuntos de Dados Publicados por Categoria</h3>
                <ChartCanvas height={260} legend={false} integer labels={categories.map((c) => c.id)}
                  series={[{ label: 'Datasets Publicados', color: '#13315C', data: categories.map((c) => datasets.filter((d) => d.category === c.id).length) }]} />
              </div>
            </div>
            <div className="col-lg-6">
              <div className="inst-card p-4 h-100">
                <h3 className="h6 fw-bold text-inst-dark mb-3">Infraestruturas e Serviços por Comuna</h3>
                <ChartCanvas height={260} labels={communeNames} series={[
                  { label: 'Escolas', color: '#15803D', data: communeNames.map((c) => datasets.filter((d) => d.commune === c).reduce((s, d) => s + (Number(d.metrics?.escolas) || 0), 0)) },
                  { label: 'Unidades sanitárias', color: '#CC092F', data: communeNames.map((c) => datasets.filter((d) => d.commune === c).reduce((s, d) => s + (Number(d.metrics?.unidadesSanitarias) || 0), 0)) },
                  { label: 'Cooperativas', color: '#D97706', data: communeNames.map((c) => datasets.filter((d) => d.commune === c).reduce((s, d) => s + (Number(d.metrics?.cooperativas) || 0), 0)) },
                ]} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categorias */}
      <section id="sec-categorias" className="py-5 bg-white border-top border-bottom">
        <div className="container">
          {sectionTitle('Taxonomia Sectorial', 'Explorar por Categoria de Dados', 'Seleccione uma área temática para filtrar os conjuntos de dados públicos disponíveis.')}
          <div className="row g-3">
            {categories.map((c) => {
              const n = datasets.filter((d) => d.category === c.id).length;
              return (
                <div className="col-sm-6 col-lg-4 col-xl" key={c.id} style={{ minWidth: 200 }}>
                  <button type="button" className="category-tile w-100 text-start h-100 border-0 bg-transparent p-0" onClick={() => pickCategory(c.id)}>
                    <div className="inst-card inst-card-hover p-3 h-100">
                      <div className="category-icon-box mb-2"><Icon name={c.icon} size={20} /></div>
                      <div className="fw-bold text-inst-dark small">{c.id}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{c.description}</div>
                      <div className="mt-2 small text-inst-primary fw-semibold">{n} {n === 1 ? 'conjunto' : 'conjuntos'}</div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Mapa */}
      <section id="sec-mapa-publico" className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-3 gap-2">
            {sectionTitle('Georreferenciação Municipal', 'Mapa Interactivo do Território de Ambuíla', 'Escolas, unidades sanitárias, infraestruturas, zonas agrícolas e projectos municipais.')}
            <div className="d-flex flex-wrap gap-2">
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
          <div className="inst-card p-3">
            <div className="alert alert-light border py-2 px-3 mb-2 d-flex align-items-center justify-content-between flex-wrap gap-2 small">
              <span><MapPin size={14} className="text-inst-primary me-1" /> Clique num marcador para consultar detalhes e coordenadas registadas.</span>
              <span className="badge-demo">Coordenadas de referência / demonstração</span>
            </div>
            <Map locations={mapPoints} />
          </div>
        </div>
      </section>

      {/* Datasets */}
      <section id="sec-datasets-publicos" className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            {sectionTitle('Catálogo de Dados Abertos', 'Conjuntos de Dados Publicados')}
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
          <div className="row g-3">
            {filtered.length === 0 && (
              <div className="col-12"><div className="alert alert-light border mb-0">Nenhum conjunto de dados publicado corresponde aos filtros seleccionados.</div></div>
            )}
            {filtered.map((d) => (
              <div className="col-md-6 col-xl-4" key={d.id}>
                <div className="inst-card inst-card-hover p-3 h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-inst-primary border">{d.category}</span>
                    {d.is_demo && <span className="badge-demo">Demo</span>}
                  </div>
                  <h3 className="h6 fw-bold text-inst-dark">{d.name}</h3>
                  <p className="small text-muted flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.description}</p>
                  <div className="small text-muted mb-2">{d.commune} &bull; {d.year} &bull; Actualizado em {formatDate(d.updated_at)}</div>
                  <button className="btn btn-sm btn-inst-outline align-self-start" onClick={() => setSelected(d)}>
                    Ver detalhes <ArrowRight size={14} />
                  </button>
                </div>
              </div>
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
                  {sectionTitle('Biblioteca Técnica', 'Publicações e Relatórios Oficiais')}
                  <div className="d-flex flex-column gap-3">
                    {publications.map((p) => (
                      <div className="inst-card p-3 d-flex gap-3 align-items-start" key={p.id}>
                        <div className="category-icon-box flex-shrink-0"><FileText size={20} /></div>
                        <div>
                          <span className="badge bg-light text-inst-primary border mb-1">{p.type}</span>
                          <h4 className="h6 fw-bold text-inst-dark mb-1">{p.title}</h4>
                          <div className="small text-muted">{p.category} &bull; {p.author} &bull; {p.year}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {noticias.length > 0 && (
                <div className={publications.length > 0 ? 'col-lg-5' : 'col-12'}>
                  {sectionTitle('Actualidade Institucional', 'Notícias e Comunicados')}
                  <div className="d-flex flex-column gap-3">
                    {noticias.map((n) => (
                      <div className="inst-card p-3" key={n.id}>
                        <div className="small text-muted mb-1">{formatDate(n.created_at)}</div>
                        <h4 className="h6 fw-bold text-inst-dark mb-1">{n.title}</h4>
                        <p className="small text-muted mb-0" style={{ whiteSpace: 'pre-line' }}>{n.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Sobre */}
      <section id="sec-sobre" className="py-5 bg-white border-top">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-7">
              {sectionTitle('Sobre a Plataforma', 'Sobre o Projecto AMBÚILA DATA')}
              <p className="text-muted">
                O <strong>AMBÚILA DATA – Portal Municipal de Dados e Inteligência Territorial</strong> é uma iniciativa institucional concebida para dotar o
                Município de Ambuíla (Província do Uíge, Angola) de um ecossistema moderno de governação baseada em evidências.
              </p>
              <p className="text-muted mb-0">
                A plataforma articula a recolha descentralizada junto das direcções municipais, instituições públicas, investigadores e parceiros locais com
                um fluxo rigoroso de validação técnica, auditoria e disponibilização pública, promovendo transparência administrativa e desenvolvimento sustentável.
              </p>
            </div>
            <div className="col-lg-5">
              <div className="inst-card p-4 bg-inst-light">
                <h3 className="h6 fw-bold text-inst-dark mb-3">Contactos Institucionais</h3>
                <ul className="list-unstyled small text-muted mb-0 d-flex flex-column gap-2">
                  <li className="d-flex align-items-start gap-2"><Building2 size={16} className="text-inst-primary mt-1" />
                    <span><strong>Administração Municipal de Ambuíla</strong><br />Gabinete de Estudos, Planeamento e Estatística (GEPE)</span></li>
                  <li className="d-flex align-items-center gap-2"><MapPin size={16} className="text-inst-primary" /><span>Sede Municipal de Ambuíla, Província do Uíge, Angola</span></li>
                  <li className="d-flex align-items-center gap-2"><Mail size={16} className="text-inst-primary" /><span>dados@ambuila.uige.gov.ao</span></li>
                  <li className="d-flex align-items-center gap-2"><Clock size={16} className="text-inst-primary" /><span>Segunda a Sexta-feira, 08h00 – 15h30</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-inst-dark text-white py-4">
        <div className="container">
          <div className="row align-items-center gy-3">
            <div className="col-md-6">
              <div className="fw-bold text-uppercase" style={{ letterSpacing: '0.08em' }}>Governo de Angola</div>
              <div className="small text-white-50">Portal de Dados de Ambuíla &bull; Administração Municipal de Ambuíla, Província do Uíge.</div>
            </div>
            <div className="col-md-6 text-md-end small text-white-50">
              <div><em>&ldquo;Conhecer os dados. Compreender o território. Promover o desenvolvimento.&rdquo;</em></div>
              <div className="mt-1">&copy; 2026 Administração Municipal de Ambuíla. Todos os direitos reservados.</div>
            </div>
          </div>
        </div>
      </footer>
      <div style={{ height: 4, background: 'linear-gradient(90deg,#CC092F 0%,#CC092F 50%,#EAB308 50%,#EAB308 100%)' }} />

      <DatasetDetailModal dataset={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
