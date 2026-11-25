'use server';

import { revalidatePath } from 'next/cache';
import { requireProfile } from '@/lib/session';
import { createClient as createProbeClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  canAssign, canDelete, canManageCommunes, isSuper, canManageContent, canManageHeroAndRegistration,
  canManageInstitutions, canManageTerritory, canManageUsers, canSubmit, canValidate, submitCategories,
} from '@/lib/permissions';
import { ROLES, ROLE_RANK, STATUSES } from '@/lib/constants';
import type { ContentKind, DatasetStatus, Metrics, Role } from '@/lib/types';

export interface ActionResult { ok: boolean; message: string }

const fail = (message: string): ActionResult => ({ ok: false, message });
const done = (message: string): ActionResult => ({ ok: true, message });

async function audit(
  ctx: Awaited<ReturnType<typeof requireProfile>>,
  module: string,
  action: string,
) {
  await ctx.supabase.from('audit_logs').insert({
    user_id: ctx.user.id,
    user_name: ctx.profile.name,
    role: ctx.profile.role,
    module,
    action,
  });
}

const refresh = () => {
  revalidatePath('/admin', 'layout');
  revalidatePath('/');
  revalidatePath('/login');
};

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

/* ------------------------------ Datasets ------------------------------ */
export async function saveDataset(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  const { supabase, user, profile } = ctx;
  if (!canSubmit(profile)) return fail('O seu perfil não tem permissão para submeter dados.');

  const id = str(fd, 'id');
  const name = str(fd, 'name');
  const year = Number(str(fd, 'year'));
  if (!name || !Number.isInteger(year) || year < 1900 || year > 2100) return fail('Nome e ano válidos são obrigatórios.');

  // Métricas dinâmicas: campos "metric:<chave>"; só números são convertidos
  const metrics: Metrics = {};
  for (const [k, v] of fd.entries()) {
    if (!k.startsWith('metric:') || typeof v !== 'string' || v === '') continue;
    const key = k.slice(7);
    const n = Number(v);
    metrics[key] = fd.get(`metrictype:${key}`) === 'number' && Number.isFinite(n) ? n : v;
  }

  const category = str(fd, 'category');
  const { data: cats } = await supabase.from('categories').select('id');
  const allowed = submitCategories(profile, (cats ?? []).map((c: { id: string }) => c.id));
  if (!allowed.includes(category)) return fail(`O seu perfil só pode registar dados em: ${allowed.join(', ') || '—'}.`);

  let status = str(fd, 'status') as DatasetStatus;
  if (!STATUSES.includes(status)) status = 'Submetido';
  if (!canValidate(profile, category) && status !== 'Rascunho') status = 'Submetido';

  // Ficheiro opcional → Storage (bucket privado 'datasets')
  let filePath: string | undefined;
  let fileName: string | undefined;
  const file = fd.get('file');
  if (file instanceof File && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return fail('O ficheiro excede o limite de 10 MB.');
    const safe = file.name.replace(/[^\w.\-]+/g, '_');
    filePath = `${user.id}/${Date.now()}_${safe}`;
    const { error: upErr } = await supabase.storage.from('datasets').upload(filePath, file, { upsert: false });
    if (upErr) return fail(`Falha ao carregar o ficheiro: ${upErr.message}`);
    fileName = file.name;
  }

  const today = new Date().toISOString().slice(0, 10);
  const payload = {
    name,
    description: str(fd, 'description'),
    category,
    commune: str(fd, 'commune') || null,
    institution: str(fd, 'institution') || null,
    year,
    source: str(fd, 'source'),
    license: str(fd, 'license'),
    is_demo: str(fd, 'is_demo') === 'true',
    status,
    metrics,
    updated_at: today,
    ...(filePath ? { file_path: filePath, file_name: fileName } : {}),
  };

  if (id) {
    const { error } = await supabase.from('datasets').update(payload).eq('id', id);
    if (error) return fail(error.message);
    await audit(ctx, 'Conjuntos de dados', `Editou o conjunto de dados "${name}".`);
    refresh();
    return done('Conjunto de dados actualizado com sucesso.');
  }

  const { error } = await supabase.from('datasets').insert({
    ...payload,
    author: profile.name,
    author_id: user.id,
    collected_at: today,
    file_name: fileName ?? null,
    file_path: filePath ?? null,
  });
  if (error) return fail(error.message);
  await audit(ctx, 'Conjuntos de dados', `Submeteu novo conjunto de dados "${name}" (${status}).`);
  refresh();
  return done('Novo conjunto de dados registado com sucesso.');
}

export async function changeDatasetStatus(id: string, status: DatasetStatus): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!STATUSES.includes(status)) return fail('Estado inválido.');
  const { data: cur } = await ctx.supabase.from('datasets').select('category').eq('id', id).single();
  if (!cur || !canValidate(ctx.profile, cur.category)) return fail('Sem permissão para validar ou publicar dados desta categoria.');

  const { data, error } = await ctx.supabase
    .from('datasets')
    .update({ status, updated_at: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
    .select('name')
    .single();
  if (error) return fail(error.message);
  await audit(ctx, 'Validação', `Alterou estado de "${data.name}" para "${status}".`);
  refresh();
  return done(`Estado actualizado para: ${status}`);
}

export async function deleteDataset(id: string): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canDelete(ctx.profile)) return fail('Apenas o Superadministrador e o Administrador Municipal podem eliminar registos.');

  const { data: ds } = await ctx.supabase.from('datasets').select('name,file_path').eq('id', id).single();
  const { error } = await ctx.supabase.from('datasets').delete().eq('id', id);
  if (error) return fail(error.message);
  if (ds?.file_path) await ctx.supabase.storage.from('datasets').remove([ds.file_path]);
  await audit(ctx, 'Conjuntos de dados', `Eliminou o conjunto de dados "${ds?.name ?? id}".`);
  refresh();
  return done('Conjunto de dados eliminado.');
}

/** URL assinada (60 s) para descarregar o ficheiro original — apenas utilizadores autenticados. */
export async function getDatasetFileUrl(id: string): Promise<{ url?: string; message?: string }> {
  const { supabase } = await requireProfile();
  const { data: ds } = await supabase.from('datasets').select('file_path').eq('id', id).single();
  if (!ds?.file_path) return { message: 'Este registo não tem ficheiro anexo.' };
  const { data, error } = await supabase.storage.from('datasets').createSignedUrl(ds.file_path, 60);
  if (error) return { message: error.message };
  return { url: data.signedUrl };
}

/* ------------------------------ Território ------------------------------ */
export async function addLocation(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageTerritory(ctx.profile)) return fail('Sem permissão para registar localizações.');
  const lat = Number(str(fd, 'lat'));
  const lng = Number(str(fd, 'lng'));
  const name = str(fd, 'name');
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)
    return fail('Nome e coordenadas WGS84 válidas são obrigatórios.');

  const { error } = await ctx.supabase.from('locations').insert({
    name, lat, lng,
    category: str(fd, 'category'),
    commune: str(fd, 'commune') || null,
    description: str(fd, 'description'),
    is_demo: false,
  });
  if (error) return fail(error.message);
  await audit(ctx, 'Mapa interactivo', `Registou a localização "${name}" (${lat.toFixed(4)}, ${lng.toFixed(4)}).`);
  refresh();
  return done('Ponto geográfico guardado.');
}

export async function addProject(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageTerritory(ctx.profile)) return fail('Sem permissão para registar projectos.');
  const name = str(fd, 'name');
  const progress = Math.min(100, Math.max(0, Number(str(fd, 'progress')) || 0));
  if (!name) return fail('O nome do projecto é obrigatório.');

  const { error } = await ctx.supabase.from('projects').insert({
    name,
    sector: str(fd, 'sector'),
    commune: str(fd, 'commune') || null,
    year: Number(str(fd, 'year')) || new Date().getFullYear(),
    budget: str(fd, 'budget'),
    progress,
    status: progress === 100 ? 'Concluído' : str(fd, 'status') || 'Planeado',
    is_demo: false,
  });
  if (error) return fail(error.message);
  await audit(ctx, 'Projectos', `Registou o projecto "${name}".`);
  refresh();
  return done('Projecto registado.');
}

export async function addInstitution(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageInstitutions(ctx.profile)) return fail('Sem permissão para registar instituições.');
  const name = str(fd, 'name');
  if (!name) return fail('O nome da instituição é obrigatório.');
  const { error } = await ctx.supabase.from('institutions').insert({
    name, type: str(fd, 'type') || 'Órgão Municipal',
    commune: str(fd, 'commune') || null, contact: str(fd, 'contact') || null,
  });
  if (error) return fail(error.message);
  await audit(ctx, 'Instituições', `Registou a instituição "${name}".`);
  refresh();
  return done('Instituição registada.');
}

const COMMUNE_STATUS = ['Activa', 'Inactiva'];

function communeFields(fd: FormData): { name: string; area_km2: number | null; status: string } | string {
  const name = str(fd, 'name');
  if (name.length < 2) return 'O nome da comuna é obrigatório.';
  const rawArea = str(fd, 'area_km2').replace(',', '.');
  let area: number | null = null;
  if (rawArea) {
    area = Number(rawArea);
    if (!Number.isFinite(area) || area < 0) return 'A área deve ser um número positivo (km²).';
  }
  const status = COMMUNE_STATUS.includes(str(fd, 'status')) ? str(fd, 'status') : 'Activa';
  return { name, area_km2: area, status };
}

const communeError = (e: { code?: string; message: string }) =>
  e.code === '23505' ? 'Já existe uma comuna com esse nome.' : e.message;

export async function addCommune(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageCommunes(ctx.profile)) return fail('Sem permissão para gerir comunas.');
  const f = communeFields(fd);
  if (typeof f === 'string') return fail(f);
  const { data: rows } = await ctx.supabase.from('communes').select('code');
  const max = Math.max(0, ...(rows ?? []).map((r: { code: string }) => Number(String(r.code).replace(/\D/g, '')) || 0));
  const code = `AMB-${String(max + 1).padStart(2, '0')}`;
  const { error } = await ctx.supabase.from('communes').insert({ ...f, code });
  if (error) return fail(communeError(error));
  await audit(ctx, 'Configurações', `Adicionou a comuna "${f.name}" (${code}).`);
  refresh();
  return done('Comuna adicionada.');
}

/** Edita nome, área e estado. Se o nome mudar, as referências (datasets, projectos, mapa…) acompanham-no (ON UPDATE CASCADE). */
export async function updateCommune(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageCommunes(ctx.profile)) return fail('Sem permissão para gerir comunas.');
  const id = str(fd, 'id');
  if (!id) return fail('Comuna inválida.');
  const f = communeFields(fd);
  if (typeof f === 'string') return fail(f);
  const { data: before } = await ctx.supabase.from('communes').select('name').eq('id', id).maybeSingle();
  if (!before) return fail('Comuna não encontrada.');
  const { error } = await ctx.supabase.from('communes').update(f).eq('id', id);
  if (error) return fail(communeError(error));
  await audit(ctx, 'Configurações', before.name === f.name ? `Editou a comuna "${f.name}".` : `Editou a comuna "${before.name}" → "${f.name}".`);
  refresh();
  return done('Comuna actualizada.');
}

/* ------------------------------ Utilizadores ------------------------------ */
/** Só nome e telefone. O email é fixo (identifica a conta) e a função é atribuída pela administração. */
export async function updateOwnProfile(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  const name = str(fd, 'name');
  if (name.length < 3) return fail('Indique o nome completo.');
  const { error } = await ctx.supabase
    .from('profiles')
    .update({ name, phone: str(fd, 'phone') || null })
    .eq('id', ctx.user.id);
  if (error) return fail(error.message);
  await audit(ctx, 'Meu perfil', 'Actualizou os dados do próprio perfil.');
  refresh();
  return done('Perfil actualizado com sucesso.');
}

/** Palavra-passe actual → nova → confirmação. A actual é verificada com um cliente isolado (não mexe na sessão). */
export async function changePassword(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  const current = String(fd.get('current_password') ?? '');
  const next = String(fd.get('new_password') ?? '');
  const confirm = String(fd.get('confirm_password') ?? '');
  if (!current) return fail('Indique a palavra-passe actual.');
  if (next.length < 8) return fail('A nova palavra-passe deve ter pelo menos 8 caracteres.');
  if (next !== confirm) return fail('A confirmação não coincide com a nova palavra-passe.');
  if (next === current) return fail('A nova palavra-passe tem de ser diferente da actual.');
  const email = ctx.user.email;
  if (!email) return fail('Esta conta não tem palavra-passe definida.');

  const probe = createProbeClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { error: badCurrent } = await probe.auth.signInWithPassword({ email, password: current });
  if (badCurrent) return fail('A palavra-passe actual está incorrecta.');

  const { error } = await ctx.supabase.auth.updateUser({ password: next });
  if (error) return fail(/same|different/i.test(error.message) ? 'A nova palavra-passe tem de ser diferente da actual.' : 'Não foi possível alterar a palavra-passe.');
  await audit(ctx, 'Meu perfil', 'Alterou a própria palavra-passe.');
  return done('Palavra-passe alterada com sucesso.');
}

/** Altera função, sector e estado de uma conta (service role: a RLS não deixa editar perfis alheios). */
export async function updateUserAccess(userId: string, role: Role, sector: string | null, active: boolean): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageUsers(ctx.profile)) return fail('Sem permissão para gerir acessos.');
  if (!ROLES.includes(role)) return fail('Perfil inválido.');
  if (!canAssign(ctx.profile, role)) return fail('Não pode atribuir este perfil.');
  if (userId === ctx.user.id) return fail('Não pode alterar o seu próprio acesso.');
  if (role === 'Funcionário de Sector' && !sector) return fail('Indique o sector do funcionário.');

  const admin = createAdminClient();
  const { data: target } = await admin.from('profiles').select('name, role, active').eq('id', userId).single();
  if (!target) return fail('Utilizador não encontrado.');
  if (active && !target.active && !isSuper(ctx.profile)) return fail('Só o Superadministrador pode aprovar contas novas.');
  if (!canAssign(ctx.profile, target.role as Role)) return fail('Não pode alterar um utilizador com este perfil.');

  const { error } = await admin.from('profiles')
    .update({ role, active, sector: role === 'Funcionário de Sector' ? sector : null, ...(active ? { requested_role: null, requested_sector: null } : {}) }).eq('id', userId);
  if (error) return fail(error.message);
  await audit(ctx, 'Utilizadores', `Definiu ${target.name} como "${role}" (${active ? 'activo' : 'inactivo/pendente'}).`);
  refresh();
  return done('Acesso actualizado.');
}

/** Cria uma conta já activa, com a função escolhida (só quem pode gerir utilizadores). */
export async function createUser(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageUsers(ctx.profile)) return fail('Sem permissão para criar utilizadores.');
  const role = str(fd, 'role') as Role;
  const sector = str(fd, 'sector') || null;
  const email = str(fd, 'email').toLowerCase();
  const password = str(fd, 'password');
  const name = str(fd, 'name');
  if (!name || !email) return fail('Nome e email são obrigatórios.');
  if (password.length < 8) return fail('A palavra-passe deve ter pelo menos 8 caracteres.');
  if (!canAssign(ctx.profile, role)) return fail('Não pode criar uma conta com este perfil.');
  if (role === 'Funcionário de Sector' && !sector) return fail('Indique o sector do funcionário.');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { name, institution: str(fd, 'institution'), phone: str(fd, 'phone') },
  });
  if (error || !data.user) return fail(error?.message ?? 'Não foi possível criar a conta.');

  const { error: pErr } = await admin.from('profiles').upsert({
    id: data.user.id, name, email, role, active: true,
    sector: role === 'Funcionário de Sector' ? sector : null,
    institution: str(fd, 'institution') || null, phone: str(fd, 'phone') || null,
  });
  if (pErr) return fail(pErr.message);
  await audit(ctx, 'Utilizadores', `Criou a conta de ${name} (${email}) como "${role}".`);
  refresh();
  return done(`Conta criada: ${email}`);
}

/* ------------------------------ Cadastro público ------------------------------ */
export async function setRegistration(enabled: boolean): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageHeroAndRegistration(ctx.profile)) return fail('Sem permissão para alterar o cadastro.');
  const { error } = await ctx.supabase.from('site_settings')
    .update({ allow_registration: enabled, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) return fail(error.message);
  await audit(ctx, 'Configurações', `${enabled ? 'Activou' : 'Ocultou'} a tela de cadastro na página de login.`);
  refresh();
  return done(enabled ? 'Tela de cadastro ACTIVA no login.' : 'Tela de cadastro OCULTA. Só entra quem já tem conta.');
}

export async function setRegistrationMode(mode: 'email' | 'approval'): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageHeroAndRegistration(ctx.profile)) return fail('Sem permissão para alterar o modo de cadastro.');
  if (mode !== 'email' && mode !== 'approval') return fail('Modo inválido.');
  const { error } = await ctx.supabase.from('site_settings').update({ registration_mode: mode, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) return fail(error.message);
  await audit(ctx, 'Configurações', `Modo de cadastro: ${mode === 'email' ? 'confirmação por email' : 'aprovação por administrador'}.`);
  refresh();
  return done(mode === 'email' ? 'Cadastro: confirmar o email activa a conta.' : 'Cadastro: depois do email, um administrador aprova.');
}

/* ------------------------------ Imagens do portal ------------------------------ */
const IMG_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

async function uploadSiteImage(
  ctx: Awaited<ReturnType<typeof requireProfile>>, folder: string, file: FormDataEntryValue | null, allowSvg = false,
): Promise<{ path?: string; error?: string }> {
  if (!(file instanceof File) || file.size === 0) return { error: 'Seleccione uma imagem.' };
  const types = allowSvg ? [...IMG_TYPES, 'image/svg+xml'] : IMG_TYPES;
  if (!types.includes(file.type)) return { error: `Formato inválido. Use ${allowSvg ? 'JPG, PNG, WEBP ou SVG' : 'JPG, PNG ou WEBP'}.` };
  if (file.size > 8 * 1024 * 1024) return { error: 'A imagem excede 8 MB.' };
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/svg+xml': 'svg' } as Record<string, string>)[file.type];
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await ctx.supabase.storage.from('site').upload(path, file, { contentType: file.type, upsert: false });
  return error ? { error: `Falha no carregamento: ${error.message}` } : { path };
}

export async function addHeroImage(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageHeroAndRegistration(ctx.profile)) return fail('Sem permissão para gerir as fotos do painel principal.');
  const up = await uploadSiteImage(ctx, 'hero', fd.get('file'));
  if (up.error) return fail(up.error);
  const { count } = await ctx.supabase.from('hero_images').select('*', { count: 'exact', head: true });
  const { error } = await ctx.supabase.from('hero_images').insert({ path: up.path, caption: str(fd, 'caption'), sort_order: count ?? 0 });
  if (error) return fail(error.message);
  await audit(ctx, 'Conteúdo do portal', 'Adicionou uma foto ao painel principal.');
  refresh();
  return done('Foto adicionada ao painel principal.');
}

export async function toggleHeroImage(id: string, active: boolean): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageHeroAndRegistration(ctx.profile)) return fail('Sem permissão.');
  const { error } = await ctx.supabase.from('hero_images').update({ active }).eq('id', id);
  if (error) return fail(error.message);
  await audit(ctx, 'Conteúdo do portal', `${active ? 'Mostrou' : 'Ocultou'} uma foto do painel principal.`);
  refresh();
  return done(active ? 'Foto visível no portal.' : 'Foto oculta do portal.');
}

export async function deleteHeroImage(id: string): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageHeroAndRegistration(ctx.profile)) return fail('Sem permissão.');
  const { data } = await ctx.supabase.from('hero_images').select('path').eq('id', id).single();
  const { error } = await ctx.supabase.from('hero_images').delete().eq('id', id);
  if (error) return fail(error.message);
  if (data?.path) await ctx.supabase.storage.from('site').remove([data.path]);
  await audit(ctx, 'Conteúdo do portal', 'Removeu uma foto do painel principal.');
  refresh();
  return done('Foto removida.');
}

/* ---- Destaques, números em grande ("ponto grande") e notícias: só o Superadministrador ---- */
export async function savePortalContent(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageContent(ctx.profile)) return fail('Apenas o Superadministrador pode inserir informação no portal.');
  const kind = str(fd, 'kind') as ContentKind;
  if (!['destaque', 'numero', 'noticia'].includes(kind)) return fail('Tipo inválido.');
  const title = str(fd, 'title');
  if (!title) return fail('O título é obrigatório.');
  if (kind === 'numero' && !str(fd, 'big_value')) return fail('Indique o valor em grande (ex.: 38.700).');

  const id = str(fd, 'id');
  let image_path: string | undefined;
  const file = fd.get('file');
  if (file instanceof File && file.size > 0) {
    const up = await uploadSiteImage(ctx, 'content', file);
    if (up.error) return fail(up.error);
    image_path = up.path;
  }
  const row = {
    kind, title, body: str(fd, 'body'),
    big_value: kind === 'numero' ? str(fd, 'big_value') : null,
    big_label: kind === 'numero' ? str(fd, 'big_label') : null,
    published: str(fd, 'published') !== 'false',
    ...(image_path ? { image_path } : {}),
  };
  const { error } = id
    ? await ctx.supabase.from('portal_content').update(row).eq('id', id)
    : await ctx.supabase.from('portal_content').insert(row);
  if (error) return fail(error.message);
  await audit(ctx, 'Conteúdo do portal', `${id ? 'Editou' : 'Inseriu'} ${kind}: "${title}".`);
  refresh();
  return done('Conteúdo guardado.');
}

export async function deletePortalContent(id: string): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageContent(ctx.profile)) return fail('Apenas o Superadministrador pode remover conteúdo.');
  const { data } = await ctx.supabase.from('portal_content').select('title,image_path').eq('id', id).single();
  const { error } = await ctx.supabase.from('portal_content').delete().eq('id', id);
  if (error) return fail(error.message);
  if (data?.image_path) await ctx.supabase.storage.from('site').remove([data.image_path]);
  await audit(ctx, 'Conteúdo do portal', `Removeu o conteúdo "${data?.title ?? id}".`);
  refresh();
  return done('Conteúdo removido.');
}

export async function uploadLogo(fd: FormData): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageContent(ctx.profile)) return fail('Apenas o Superadministrador pode alterar o logótipo.');
  const up = await uploadSiteImage(ctx, 'brand', fd.get('file'), true);
  if (up.error) return fail(up.error);
  const { data: old } = await ctx.supabase.from('site_settings').select('logo_path').eq('id', 1).single();
  const { error } = await ctx.supabase.from('site_settings').update({ logo_path: up.path, updated_at: new Date().toISOString() }).eq('id', 1);
  if (error) return fail(error.message);
  if (old?.logo_path) await ctx.supabase.storage.from('site').remove([old.logo_path]);
  await audit(ctx, 'Conteúdo do portal', 'Alterou o logótipo do portal.');
  refresh();
  return done('Logótipo actualizado.');
}

export async function resetLogo(): Promise<ActionResult> {
  const ctx = await requireProfile();
  if (!canManageContent(ctx.profile)) return fail('Apenas o Superadministrador pode alterar o logótipo.');
  const { data: old } = await ctx.supabase.from('site_settings').select('logo_path').eq('id', 1).single();
  const { error } = await ctx.supabase.from('site_settings').update({ logo_path: null }).eq('id', 1);
  if (error) return fail(error.message);
  if (old?.logo_path) await ctx.supabase.storage.from('site').remove([old.logo_path]);
  await audit(ctx, 'Conteúdo do portal', 'Repôs o logótipo oficial do Governo de Angola.');
  refresh();
  return done('Logótipo oficial reposto.');
}

export async function recordAuth(event: 'login' | 'logout'): Promise<void> {
  const ctx = await requireProfile();
  await audit(
    ctx,
    'Autenticação',
    event === 'login'
      ? `Início de sessão no Painel Administrativo como ${ctx.profile.role}.`
      : 'Terminou sessão no Painel Administrativo.',
  );
}
