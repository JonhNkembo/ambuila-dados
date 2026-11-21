import { computeMunicipalMetrics } from './metrics';
import { esc, formatNumber } from './format';
import type { Category, Commune, Dataset, Institution, Project } from './types';

export interface AIContext { datasets: Dataset[]; communes: Commune[]; institutions: Institution[]; projects: Project[]; categories: Category[] }

const head = (t: string, cls = 'text-inst-dark') => `<div class="fw-bold ${cls} mb-1">${t}</div>`;
const src = (t: string) => `<small class="text-muted">${t}</small>`;

/**
 * Agente "AMBÚILA AI": responde EXCLUSIVAMENTE com base nos registos da base de dados
 * (sem modelo externo, sem invenção de números). Todo o texto vindo da BD é escapado.
 * Devolve HTML seguro para dangerouslySetInnerHTML.
 */
export function generateGroundedAIResponse(question: string, ctx: AIContext): string {
  const q = question.toLowerCase();
  const stats = computeMunicipalMetrics(ctx);
  const { datasets, communes, institutions, projects, categories } = ctx;
  const ofCat = (c: string) => datasets.filter((d) => d.category === c);
  const m = (d: Dataset, k: string) => Number(d.metrics?.[k]) || 0;

  if (q.includes('uípedro') || q.includes('uipedro')) {
    return head('Esclarecimento de Divisão Administrativa Oficial', 'text-inst-red') +
      `<p class="mb-0">De acordo com a divisão político-administrativa registada nesta plataforma, <strong>Uípedro não faz parte do Município de Ambuíla</strong>. As comunas oficiais registadas são: <strong>${communes.map((c) => esc(c.name)).join(' e ')}</strong>.</p>`;
  }

  if (q.includes('escola') || q.includes('educa')) {
    const ds = ofCat('Educação');
    if (!ds.length) return 'Os dados disponíveis na base de dados são insuficientes para responder sobre a rede escolar.';
    return head('Resumo do Sector da Educação (Base Registada)') +
      `<p class="mb-2">Existem actualmente <strong>${formatNumber(stats.totalSchools)} escolas</strong> registadas, com <strong>${formatNumber(stats.totalStudents)} alunos</strong> e <strong>${formatNumber(stats.totalTeachers)} professores</strong>.</p>` +
      `<ul class="mb-2 ps-3">${ds.map((d) => `<li><strong>${esc(d.commune)}</strong> (${d.year}): ${m(d, 'escolas')} escolas, ${formatNumber(m(d, 'alunos'))} alunos, ${m(d, 'professores')} professores.</li>`).join('')}</ul>` +
      src('Fonte: conjuntos de dados de Educação registados no AMBÚILA DATA.');
  }

  if (q.includes('saúde') || q.includes('saude') || q.includes('sanit') || q.includes('hospital')) {
    const ds = ofCat('Saúde');
    if (!ds.length) return 'Os dados disponíveis são insuficientes para apresentar a distribuição das unidades sanitárias.';
    return head('Distribuição das Unidades Sanitárias') +
      `<p class="mb-2">Estão registadas <strong>${formatNumber(stats.totalHealthUnits)} unidades sanitárias</strong> e <strong>${formatNumber(stats.totalHealthStaff)} profissionais de saúde</strong>.</p>` +
      `<ul class="mb-2 ps-3">${ds.map((d) => `<li><strong>${esc(d.commune)}</strong>: ${m(d, 'unidadesSanitarias')} unidades, ${m(d, 'profissionaisSaude')} profissionais, ${m(d, 'camas')} camas [${esc(d.status)}].</li>`).join('')}</ul>` +
      src('Nota: inclui registos validados e ainda em validação.');
  }

  if (q.includes('agríc') || q.includes('agric') || q.includes('produto')) {
    const ds = ofCat('Agricultura');
    if (!ds.length) return 'Dados insuficientes no módulo de Agricultura.';
    const culturas = ds.map((d) => d.metrics?.principaisCulturas).filter(Boolean).map((c) => esc(c)).join('; ');
    return head('Indicadores de Produção Agrícola') +
      `<p class="mb-2">Principais produtos registados: <strong>${culturas || 'Não especificado'}</strong>.</p>` +
      `<ul class="mb-2 ps-3"><li>Cooperativas / Associações: <strong>${formatNumber(stats.totalCooperatives)}</strong></li><li>Produção total estimada: <strong>${formatNumber(stats.totalProductionTons)} toneladas</strong></li></ul>`;
  }

  if (q.includes('demogr') || q.includes('popula')) {
    const ds = ofCat('Demografia');
    return head('Síntese Demográfica por Comuna') +
      `<p class="mb-2">A população total registada é de <strong>${formatNumber(stats.totalPopulation)} habitantes</strong>:</p>` +
      `<ul class="mb-2 ps-3">${ds.map((d) => `<li><strong>${esc(d.commune)}</strong> (${d.year}): ${formatNumber(m(d, 'populacao'))} habitantes (${formatNumber(m(d, 'agregados'))} agregados familiares).</li>`).join('')}</ul>`;
  }

  if (q.includes('comuna') || q.includes('institui')) {
    return head('Instituições e Cobertura por Comuna') +
      `<ul class="mb-0 ps-3">${communes.map((c) =>
        `<li><strong>${esc(c.name)}</strong>: ${institutions.filter((i) => i.commune === c.name).length} instituições sediadas e ${datasets.filter((d) => d.commune === c.name).length} conjuntos de dados associados.</li>`).join('')}</ul>`;
  }

  if (q.includes('projecto') || q.includes('projeto') || q.includes('obra')) {
    return head(`Projectos Municipais Registados (${projects.length})`) +
      `<ul class="mb-0 ps-3">${projects.map((p) => `<li><strong>${esc(p.name)}</strong> (${esc(p.commune)}) – Execução: <strong>${p.progress}%</strong> [${esc(p.status)}].</li>`).join('')}</ul>`;
  }

  if (q.includes('desactualiz') || q.includes('falta') || q.includes('pendente') || q.includes('lacuna')) {
    const outdated = datasets.filter((d) => d.year < new Date().getFullYear());
    const missing = categories.filter((c) => !datasets.some((d) => d.category === c.id)).map((c) => esc(c.id));
    return head('Diagnóstico de Actualização e Lacunas de Dados') +
      `<p class="mb-1"><strong>Conjuntos com ano de referência anterior a ${new Date().getFullYear()} (${outdated.length}):</strong></p>` +
      `<ul class="mb-2 ps-3">${outdated.map((d) => `<li>${esc(d.name)} (${d.year})</li>`).join('') || '<li>Nenhum</li>'}</ul>` +
      `<p class="mb-0"><strong>Categorias sem conjuntos registados:</strong> ${missing.length ? missing.join(', ') : 'todas as categorias possuem pelo menos um registo.'}</p>`;
  }

  return head('Consulta Processada na Base AMBÚILA DATA') +
    `<p class="mb-2">Não foi identificada uma correspondência sectorial directa para <em>&ldquo;${esc(question)}&rdquo;</em>, mas o estado actual da base municipal apresenta:</p>` +
    `<ul class="mb-2 ps-3"><li><strong>${datasets.length}</strong> conjuntos de dados (${stats.publishedCount} publicados).</li>` +
    `<li><strong>${formatNumber(stats.totalPopulation)}</strong> habitantes registados em ${stats.totalCommunes} comunas.</li>` +
    `<li><strong>${formatNumber(stats.totalSchools)}</strong> escolas e <strong>${formatNumber(stats.totalHealthUnits)}</strong> unidades sanitárias.</li></ul>` +
    src('Experimente perguntar sobre Educação, Saúde, Demografia, Agricultura, Projectos ou dados desactualizados.');
}
