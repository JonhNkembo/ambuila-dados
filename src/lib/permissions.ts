import { CULTURE_CATEGORY, ROLE_RANK, ROLES } from './constants';
import type { Profile, Role } from './types';

type P = Pick<Profile, 'role' | 'sector'>;

const ADMIN_LEVEL: Role[] = ['Superadministrador', 'Administrador Municipal', 'Administrador Adjunto'];

export const isSuper = (p?: P | null) => p?.role === 'Superadministrador';
export const isAdminLevel = (p?: P | null) => !!p && ADMIN_LEVEL.includes(p.role);

/** Categoria em que o utilizador trabalha (null = todas, para a administração). */
export const effectiveSector = (p: P): string | null =>
  p.role === 'Director de Turismo e Cultura' ? CULTURE_CATEGORY : p.role === 'Funcionário de Sector' ? p.sector : null;

/** Categorias em que o utilizador pode submeter dados. */
export function submitCategories(p: P, all: string[]): string[] {
  if (isAdminLevel(p)) return all;
  if (p.role === 'Director de Turismo e Cultura') return [CULTURE_CATEGORY];
  if (p.role === 'Funcionário de Sector') return p.sector ? [p.sector] : [];
  return [];
}
export const canSubmit = (p?: P | null) => !!p && (isAdminLevel(p) || p.role === 'Director de Turismo e Cultura' || p.role === 'Funcionário de Sector');

/** Validar / publicar / rejeitar. Sem categoria = "tem esse poder em geral". */
export function canValidate(p?: P | null, category?: string): boolean {
  if (!p) return false;
  if (isAdminLevel(p)) return true;
  if (p.role === 'Director de Turismo e Cultura') return !category || category === CULTURE_CATEGORY;
  return false;
}

export const canDelete = (p?: P | null) => p?.role === 'Superadministrador' || p?.role === 'Administrador Municipal';
export const canManageTerritory = (p?: P | null) => isAdminLevel(p) || p?.role === 'Director de Turismo e Cultura';
export const canManageInstitutions = (p?: P | null) => isAdminLevel(p);
export const canManageCommunes = (p?: P | null) => p?.role === 'Superadministrador' || p?.role === 'Administrador Municipal';
export const canManageUsers = canManageCommunes;
export const canManageHeroAndRegistration = canManageCommunes;
/** Destaques, números em grande, notícias e logótipo: só o Superadministrador. */
export const canManageContent = (p?: P | null) => p?.role === 'Superadministrador';
export const canViewAudit = (p?: P | null) => isAdminLevel(p);

/** Funções que o utilizador pode atribuir (só abaixo da sua; o Superadministrador atribui todas). */
export function assignableRoles(p: P): Role[] {
  if (p.role === 'Superadministrador') return ROLES;
  return ROLES.filter((r) => ROLE_RANK[r] < ROLE_RANK[p.role]);
}
export const canAssign = (p: P, target: Role) => assignableRoles(p).includes(target);
