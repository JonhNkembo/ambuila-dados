export type Role =
  | 'Superadministrador'
  | 'Administrador Municipal'
  | 'Administrador Adjunto'
  | 'Director de Turismo e Cultura'
  | 'Funcionário de Sector'
  | 'Funcionário Normal';

export type DatasetStatus = 'Rascunho' | 'Submetido' | 'Em Validação' | 'Publicado' | 'Rejeitado';

export type Metrics = Record<string, number | string>;

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: Role;
  sector: string | null;
  requested_role: Role | null;
  requested_sector: string | null;
  institution: string | null;
  phone: string | null;
  active: boolean;
}

export interface Commune { id: string; name: string; code: string; area_km2: number | null; status: string }
export interface Institution { id: string; name: string; type: string; commune: string | null; contact: string | null }
export interface Category { id: string; icon: string; description: string; sort_order: number }

export interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  institution: string | null;
  commune: string | null;
  source: string;
  year: number;
  collected_at: string;
  updated_at: string;
  author: string;
  author_id: string | null;
  file_name: string | null;
  file_path: string | null;
  license: string;
  status: DatasetStatus;
  is_demo: boolean;
  metrics: Metrics;
}

export interface Project {
  id: string; name: string; sector: string; commune: string | null; year: number;
  budget: string; progress: number; status: string; is_demo: boolean;
}

export interface LocationPoint {
  id: string; name: string; category: string; commune: string | null;
  lat: number; lng: number; description: string; is_demo: boolean;
}

export interface Publication {
  id: string; title: string; type: string; category: string; author: string; year: number;
}

export interface AuditLog {
  id: number; created_at: string; user_name: string; role: string; module: string; action: string;
}

export type RegistrationMode = 'email' | 'approval';
export interface SiteSettings { id: number; allow_registration: boolean; registration_mode: RegistrationMode; logo_path: string | null }
export interface HeroImage { id: string; path: string; caption: string; sort_order: number; active: boolean }
export type ContentKind = 'destaque' | 'numero' | 'noticia';
export interface PortalContent {
  id: string; kind: ContentKind; title: string; body: string; big_value: string | null; big_label: string | null;
  image_path: string | null; sort_order: number; published: boolean; created_at: string;
}
