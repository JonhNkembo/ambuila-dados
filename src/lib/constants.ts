import type { DatasetStatus, Role } from './types';

/** Do mais alto para o mais baixo. */
export const ROLES: Role[] = [
  'Superadministrador',
  'Administrador Municipal',
  'Administrador Adjunto',
  'Director de Turismo e Cultura',
  'Funcionário de Sector',
  'Funcionário Normal',
];

export const ROLE_RANK: Record<Role, number> = {
  Superadministrador: 100,
  'Administrador Municipal': 80,
  'Administrador Adjunto': 60,
  'Director de Turismo e Cultura': 50,
  'Funcionário de Sector': 30,
  'Funcionário Normal': 10,
};

export const CULTURE_CATEGORY = 'Cultura e património';

export const STATUSES: DatasetStatus[] = ['Rascunho', 'Submetido', 'Em Validação', 'Publicado', 'Rejeitado'];

export const LICENSES = [
  'Dados Abertos Governamentais (CC-BY 4.0)',
  'Uso Interno Institucional',
  'Acesso Restrito',
];

export interface MetricField {
  key: string;
  label: string;
  type: 'number' | 'text';
  step?: string;
  placeholder?: string;
}

/** Campos específicos de cada categoria (guardados em datasets.metrics - jsonb). */
export const CATEGORY_FIELDS: Record<string, MetricField[]> = {
  Demografia: [
    { key: 'populacao', label: 'População residente', type: 'number' },
    { key: 'agregados', label: 'Agregados familiares', type: 'number' },
    { key: 'taxaCrescimento', label: 'Taxa de crescimento (%)', type: 'number', step: '0.1' },
  ],
  'Educação': [
    { key: 'escolas', label: 'Número de escolas', type: 'number' },
    { key: 'alunos', label: 'Alunos matriculados', type: 'number' },
    { key: 'professores', label: 'Professores', type: 'number' },
    { key: 'salas', label: 'Salas de aula', type: 'number' },
  ],
  'Saúde': [
    { key: 'unidadesSanitarias', label: 'Unidades sanitárias', type: 'number' },
    { key: 'profissionaisSaude', label: 'Profissionais de saúde', type: 'number' },
    { key: 'camas', label: 'Camas de internamento', type: 'number' },
  ],
  'Economia e negócios': [
    { key: 'empresas', label: 'Empresas / estabelecimentos', type: 'number' },
    { key: 'mercados', label: 'Mercados municipais', type: 'number' },
    { key: 'empregosFormais', label: 'Empregos formais', type: 'number' },
  ],
  Agricultura: [
    { key: 'cooperativas', label: 'Cooperativas / associações', type: 'number' },
    { key: 'areaCultivadaHa', label: 'Área cultivada (ha)', type: 'number' },
    { key: 'producaoToneladas', label: 'Produção (toneladas)', type: 'number' },
    { key: 'principaisCulturas', label: 'Principais culturas', type: 'text', placeholder: 'Mandioca, Café Robusta, ...' },
  ],
  Infraestruturas: [
    { key: 'estradasKm', label: 'Estradas (km)', type: 'number', step: '0.1' },
    { key: 'pontosAgua', label: 'Pontos de água', type: 'number' },
    { key: 'edificiosPublicos', label: 'Edifícios públicos', type: 'number' },
  ],
  'Ambiente e recursos naturais': [
    { key: 'areasFlorestaisHa', label: 'Áreas florestais (ha)', type: 'number' },
    { key: 'cursosAgua', label: 'Cursos de água inventariados', type: 'number' },
    { key: 'pontosRecolhaResiduos', label: 'Pontos de recolha de resíduos', type: 'number' },
  ],
  'Cultura e património': [
    { key: 'sitiosHistoricos', label: 'Sítios históricos', type: 'number' },
    { key: 'gruposCulturais', label: 'Grupos culturais', type: 'number' },
  ],
  'Administração pública': [
    { key: 'funcionarios', label: 'Funcionários públicos', type: 'number' },
    { key: 'servicosPublicos', label: 'Serviços públicos', type: 'number' },
    { key: 'registosCivis', label: 'Registos civis efectuados', type: 'number' },
  ],
  'Ciência e investigação': [
    { key: 'estudosPublicados', label: 'Estudos publicados', type: 'number' },
    { key: 'projectosInvestigacao', label: 'Projectos de investigação', type: 'number' },
    { key: 'parceriasAcademicas', label: 'Parcerias académicas', type: 'number' },
  ],
};

export const MAP_CATEGORIES = ['Educação', 'Saúde', 'Infraestruturas', 'Agricultura', 'Projectos'] as const;

export const MAP_COLORS: Record<string, string> = {
  'Educação': '#1B5E3B',
  'Saúde': '#B4412E',
  Infraestruturas: '#2F6F8F',
  Agricultura: '#C28B1E',
  Projectos: '#7A4E8C',
};

export const AMBUILA_CENTER: [number, number] = [-7.455, 14.645];

/** Perfis que uma pessoa pode pedir no cadastro público. Os perfis de administração só são atribuídos pelo Superadministrador. */
export const REGISTER_ROLES: Role[] = ['Director de Turismo e Cultura', 'Funcionário de Sector', 'Funcionário Normal'];

/** Ponto central do mapa: sede municipal. Ajuste `position` se tiver as coordenadas oficiais exactas. */
export const MUNICIPAL_SEAT = {
  name: 'Nova Ambuíla',
  subtitle: 'Sede Municipal de Ambuíla',
  position: AMBUILA_CENTER,
};
