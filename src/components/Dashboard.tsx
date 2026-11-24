'use client';
import { useMemo, useState } from 'react';
import { Filter, Workflow, Users, MapPin, GraduationCap, HeartPulse, Briefcase, Landmark, ClipboardList, CheckCircle2, Clock, AlertCircle, type LucideIcon } from 'lucide-react';
import ChartCanvas from './ChartCanvas';
import { CountUp, ProgressBar, Reveal } from './ui';
import { PALETTE } from '@/lib/theme';
import { computeMunicipalMetrics } from '@/lib/metrics';
import { formatNumber } from '@/lib/format';
import type { Category, Commune, Dataset, Institution, Project } from '@/lib/types';

interface Props { datasets: Dataset[]; communes: Commune[]; institutions: Institution[]; projects: Project[]; categories: Category[] }

export default function Dashboard({ datasets, communes, institutions, projects, categories }: Props) {
  const [year, setYear] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [commune, setCommune] = useState('ALL');

  const years = useMemo(() => [...new Set(datasets.map((d) => d.year))].sort((a, b) => b - a), [datasets]);
  const s = useMemo(
    () => computeMunicipalMetrics({ datasets, communes, institutions, projects }, { year, category, commune }),
    [datasets, communes, institutions, projects, year, category, commune],
  );
  const ds = s.filteredDatasets;
  const comList = commune === 'ALL' ? communes.map((c) => c.name) : [commune];
  const sumBy = (c: string, k: string) => ds.filter((d) => d.commune === c).reduce((a, d) => a + (Number(d.metrics?.[k]) || 0), 0);
  const total = (k: string) => ds.reduce((a, d) => a + (Number(d.metrics?.[k]) || 0), 0);
  const prjs = commune === 'ALL' ? projects : projects.filter((p) => p.commune === commune);

  const kpis: { label: string; num: number; sub: string; icon: LucideIcon; cls: string }[] = [
    { label: '1. População Total', num: s.totalPopulation, sub: 'Habitantes registados', icon: Users, cls: '' },
    { label: '2. Número de Comunas', num: s.totalCommunes, sub: communes.map((c) => c.name).join(', '), icon: MapPin, cls: 'kpi-dark' },
    { label: '3. Número de Escolas', num: s.totalSchools, sub: `${formatNumber(s.totalStudents)} alunos`, icon: GraduationCap, cls: 'kpi-success' },
    { label: '4. Unidades Sanitárias', num: s.totalHealthUnits, sub: `${formatNumber(s.totalHealthStaff)} profissionais`, icon: HeartPulse, cls: 'kpi-danger' },
    { label: '5. Número de Empresas', num: s.totalCompanies, sub: 'Estabelecimentos formais', icon: Briefcase, cls: '' },
    { label: '6. Número de Instituições', num: s.totalInstitutions, sub: 'Órgãos e repartições', icon: Landmark, cls: 'kpi-dark' },
    { label: '7. Projectos Municipais', num: s.totalProjects, sub: 'Em curso e concluídos', icon: ClipboardList, cls: '' },
    { label: '8. Datasets Publicados', num: s.publishedCount, sub: 'Disponíveis no portal', icon: CheckCircle2, cls: 'kpi-success' },
    { label: '9. Submissões Pendentes', num: s.pendingSubmissionsCount, sub: 'Aguardam recepção', icon: Clock, cls: 'kpi-warning' },
    { label: '10. Dados por Validar', num: s.toValidateCount, sub: 'Submetidos / Em validação', icon: AlertCircle, cls: 'kpi-danger' },
  ];

  const card = (title: string, body: React.ReactNode, delay = 0) => (
    <Reveal className="col-lg-6" delay={delay}>
      <div className="inst-card p-4 h-100">
        <h3 className="h6 fw-bold text-inst-dark mb-3">{title}</h3>
        {body}
      </div>
    </Reveal>
  );

  // Ciclo de vida dos conjuntos de dados (valores reais, por estado)
  const flow: { status: string; color: string }[] = [
    { status: 'Publicado', color: PALETTE.forest },
    { status: 'Em Validação', color: PALETTE.river },
    { status: 'Submetido', color: PALETTE.ochre },
    { status: 'Rejeitado', color: PALETTE.clay },
    { status: 'Rascunho', color: PALETTE.slate },
  ];
  const dsTotal = Math.max(ds.length, 1);

  return (
    <>
      <div className="inst-card p-3 mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="small fw-bold text-inst-dark d-flex align-items-center gap-1"><Filter size={15} /> Filtros Analíticos:</span>
          <select className="form-select form-select-sm w-auto" value={year} onChange={(e) => setYear(e.target.value)} aria-label="Ano">
            <option value="ALL">Todos os Anos</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="form-select form-select-sm w-auto" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Categoria">
            <option value="ALL">Todas as Categorias</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
          </select>
          <select className="form-select form-select-sm w-auto" value={commune} onChange={(e) => setCommune(e.target.value)} aria-label="Comuna">
            <option value="ALL">Todas as Comunas</option>
            {communes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge-demo">Calculado a partir da base de dados</span>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => { setYear('ALL'); setCategory('ALL'); setCommune('ALL'); }}>Limpar</button>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {kpis.map((k, i) => (
          <Reveal className="col-6 col-sm-4 col-lg-3 col-xl-2" key={k.label} delay={i * 50}>
            <div className={`kpi-card h-100 ${k.cls}`}>
              <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                <span className="kpi-label" style={{ fontSize: '0.66rem' }}>{k.label}</span>
                <span className="kpi-icon"><k.icon size={16} /></span>
              </div>
              <div className="kpi-value"><CountUp value={k.num} format={formatNumber} /></div>
              <div className="text-muted text-truncate" style={{ fontSize: '0.72rem' }} title={k.sub}>{k.sub}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="row g-4">
        {card('1. Distribuição de Dados por Categoria',
          <ChartCanvas horizontal legend={false} integer labels={categories.map((c) => c.id)}
            series={[{ label: 'Conjuntos de Dados', color: PALETTE.forest, data: categories.map((c) => ds.filter((d) => d.category === c.id).length) }]} />)}
        {card('2. Evolução Demográfica Registada (por Comuna/Ano)',
          <ChartCanvas labels={comList} series={[
            { label: 'População (hab.)', color: PALETTE.forestDark, data: comList.map((c) => sumBy(c, 'populacao')) },
            { label: 'Agregados Familiares', color: PALETTE.river, data: comList.map((c) => sumBy(c, 'agregados')) },
          ]} />)}
        {card('3. Distribuição das Escolas e Alunos por Comuna',
          <ChartCanvas labels={comList} series={[
            { label: 'Escolas', color: PALETTE.forest, data: comList.map((c) => sumBy(c, 'escolas')) },
            { label: 'Professores', color: PALETTE.leaf, data: comList.map((c) => sumBy(c, 'professores')) },
          ]} />)}
        {card('4. Distribuição das Unidades Sanitárias e Profissionais',
          <ChartCanvas type="doughnut" labels={['Unidades Sanitárias', 'Profissionais de Saúde']}
            series={[{ label: 'Saúde', color: [PALETTE.clay, PALETTE.forest], data: [s.totalHealthUnits, s.totalHealthStaff] }]} />)}
        {card('5. Actividade Económica e Produção Agrícola',
          <ChartCanvas legend={false} labels={['Empresas Formais', 'Cooperativas Agrícolas', 'Mercados Municipais']}
            series={[{ label: 'Unidades Registadas', color: [PALETTE.forest, PALETTE.leaf, PALETTE.ochre], data: [total('empresas'), total('cooperativas'), total('mercados')] }]} />)}
        {card('6. Execução dos Projectos Municipais (% Execução)',
          prjs.length === 0 ? <div className="text-muted small">Sem projectos registados.</div> : (
            <div className="d-flex flex-column gap-3" style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
              {prjs.map((p) => (
                <ProgressBar key={p.id} label={p.name} value={p.progress} sub={`${p.status}${p.commune ? ` • ${p.commune}` : ''}`}
                  color={p.progress >= 100 ? PALETTE.forest : p.progress >= 50 ? PALETTE.ochre : PALETTE.clay} />
              ))}
            </div>
          ), 100)}
        {card('7. Fluxo de Validação dos Dados',
          <div className="d-flex flex-column gap-3">
            <div className="d-flex align-items-center gap-2 text-muted small"><Workflow size={15} /> {ds.length} conjunto{ds.length === 1 ? '' : 's'} na selecção actual</div>
            {flow.map((f) => {
              const n = ds.filter((d) => d.status === f.status).length;
              return <ProgressBar key={f.status} large label={f.status} color={f.color} value={(n / dsTotal) * 100} display={`${n} • ${Math.round((n / dsTotal) * 100)}%`} />;
            })}
          </div>, 200)}
      </div>
    </>
  );
}
