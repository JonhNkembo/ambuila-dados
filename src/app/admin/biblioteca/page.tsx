import { requireProfile } from '@/lib/session';
import { loadPublications } from '@/lib/data';

export default async function BibliotecaPage() {
  const { supabase } = await requireProfile();
  const pubs = await loadPublications(supabase);
  return (
    <div className="row g-3">
      {pubs.length === 0 && <div className="col-12"><div className="alert alert-light border mb-0">A biblioteca ainda não tem documentos.</div></div>}
      {pubs.map((p) => (
        <div className="col-md-6" key={p.id}>
          <div className="inst-card p-4 h-100">
            <div className="d-flex justify-content-between mb-2">
              <span className="badge bg-light text-inst-primary border">{p.type}</span>
              <span className="badge-demo">Documento de Referência</span>
            </div>
            <h4 className="h6 fw-bold text-inst-dark">{p.title}</h4>
            <p className="small text-muted mb-0">Categoria: {p.category} &bull; Autor: {p.author} &bull; Ano: {p.year}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
