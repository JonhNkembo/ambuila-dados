import { requireProfile } from '@/lib/session';
import { loadCore } from '@/lib/data';
import { computeMunicipalMetrics } from '@/lib/metrics';
import { formatNumber } from '@/lib/format';

export default async function IndicadoresPage() {
  const { supabase } = await requireProfile();
  const core = await loadCore(supabase);
  const s = computeMunicipalMetrics(core);
  const cobertura = `${core.communes.length} comunas`;
  const rows: [string, string, number, string][] = [
    ['Demografia', 'População Total Registada', s.totalPopulation, 'Habitantes'],
    ['Educação', 'Estabelecimentos de Ensino', s.totalSchools, 'Escolas'],
    ['Educação', 'Efectivo Discente (Alunos)', s.totalStudents, 'Alunos'],
    ['Educação', 'Corpo Docente', s.totalTeachers, 'Professores'],
    ['Saúde', 'Unidades Sanitárias Activas', s.totalHealthUnits, 'Unidades'],
    ['Saúde', 'Profissionais de Saúde', s.totalHealthStaff, 'Profissionais'],
    ['Economia', 'Empresas / Estabelecimentos', s.totalCompanies, 'Empresas'],
    ['Agricultura', 'Cooperativas Agrícolas', s.totalCooperatives, 'Cooperativas'],
    ['Agricultura', 'Produção Agrícola Registada', s.totalProductionTons, 'Toneladas'],
  ];
  return (
    <div className="inst-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="h6 fw-bold text-inst-dark mb-0">Matriz Consolidada de Indicadores Municipais</h3>
        <span className="badge-demo">Calculados automaticamente a partir dos datasets registados</span>
      </div>
      <div className="table-responsive">
        <table className="table table-bordered align-middle small mb-0">
          <thead className="table-light"><tr><th>Domínio</th><th>Indicador</th><th>Valor Consolidado</th><th>Unidade</th><th>Cobertura</th></tr></thead>
          <tbody>
            {rows.map(([dom, ind, val, un]) => (
              <tr key={ind}><td>{dom}</td><td>{ind}</td><td className="fw-bold">{formatNumber(val)}</td><td>{un}</td><td>Municipal ({cobertura})</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
