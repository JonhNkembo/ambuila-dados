import type { Commune, Dataset, Institution, Project } from './types';

const sum = (ds: Dataset[], key: string) =>
  ds.reduce((s, d) => s + (Number(d.metrics?.[key]) || 0), 0);

export interface MetricFilters {
  year?: string;
  category?: string;
  commune?: string;
  onlyPublished?: boolean;
}

export function computeMunicipalMetrics(
  data: { datasets: Dataset[]; communes: Commune[]; institutions: Institution[]; projects: Project[] },
  f: MetricFilters = {},
) {
  const { year = 'ALL', category = 'ALL', commune = 'ALL', onlyPublished = false } = f;

  const filteredDatasets = data.datasets.filter(
    (d) =>
      (year === 'ALL' || String(d.year) === year) &&
      (category === 'ALL' || d.category === category) &&
      (commune === 'ALL' || d.commune === commune) &&
      (!onlyPublished || d.status === 'Publicado'),
  );

  return {
    filteredDatasets,
    totalPopulation: sum(filteredDatasets, 'populacao'),
    totalCommunes: commune === 'ALL' ? data.communes.length : 1,
    totalSchools: sum(filteredDatasets, 'escolas'),
    totalStudents: sum(filteredDatasets, 'alunos'),
    totalTeachers: sum(filteredDatasets, 'professores'),
    totalHealthUnits: sum(filteredDatasets, 'unidadesSanitarias'),
    totalHealthStaff: sum(filteredDatasets, 'profissionaisSaude'),
    totalCompanies: sum(filteredDatasets, 'empresas'),
    totalCooperatives: sum(filteredDatasets, 'cooperativas'),
    totalProductionTons: sum(filteredDatasets, 'producaoToneladas'),
    totalInstitutions: data.institutions.length,
    totalProjects:
      commune === 'ALL' ? data.projects.length : data.projects.filter((p) => p.commune === commune).length,
    publishedCount: filteredDatasets.filter((d) => d.status === 'Publicado').length,
    pendingSubmissionsCount: filteredDatasets.filter((d) => d.status === 'Submetido').length,
    toValidateCount: filteredDatasets.filter((d) => d.status === 'Submetido' || d.status === 'Em Validação').length,
  };
}
