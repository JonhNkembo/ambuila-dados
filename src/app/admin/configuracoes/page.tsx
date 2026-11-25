import { redirect } from 'next/navigation';
import { requireProfile } from '@/lib/session';
import { canManageCommunes, isAdminLevel } from '@/lib/permissions';
import { loadCore } from '@/lib/data';
import CommunesManager from '@/components/CommunesManager';

const TABLES = ['profiles', 'communes', 'institutions', 'categories', 'datasets', 'projects', 'locations', 'publications', 'audit_logs', 'storage: datasets'];

export default async function ConfiguracoesPage() {
  const { supabase, profile } = await requireProfile();
  if (!isAdminLevel(profile)) redirect('/admin');
  const { communes } = await loadCore(supabase);
  return (
    <div className="row g-4">
      <div className="col-xl-7">
        <CommunesManager communes={communes} canEdit={canManageCommunes(profile)} />
      </div>
      <div className="col-xl-5">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-2">Arquitectura Relacional (PostgreSQL / Supabase)</h4>
          <p className="small text-muted mb-2">Tabelas activas no modelo de dados, protegidas por Row Level Security:</p>
          <div className="p-3 bg-light border rounded font-monospace" style={{ fontSize: '0.75rem', overflowWrap: 'anywhere' }}>{TABLES.join(', ')}</div>
        </div>
      </div>
    </div>
  );
}
