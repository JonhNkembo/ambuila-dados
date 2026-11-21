'use client';
import { useState, useTransition } from 'react';
import { Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import ActionForm from './ActionForm';
import Brand from './Brand';
import { useToast } from './Toast';
import {
  addHeroImage, deleteHeroImage, deletePortalContent, resetLogo, savePortalContent, toggleHeroImage, uploadLogo,
} from '@/app/admin/actions';
import type { HeroImage, PortalContent } from '@/lib/types';

const KIND_LABEL = { destaque: 'Destaque', numero: 'Número em grande', noticia: 'Notícia' } as const;

export default function PortalManager({
  hero, content, isSuper, logoUrl, hasCustomLogo, baseUrl,
}: { hero: HeroImage[]; content: PortalContent[]; isSuper: boolean; logoUrl: string; hasCustomLogo: boolean; baseUrl: string }) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState<PortalContent | null>(null);
  const [kind, setKind] = useState<PortalContent['kind']>('destaque');
  const img = (p: string) => `${baseUrl}/storage/v1/object/public/site/${p}`;
  const run = (fn: () => Promise<{ ok: boolean; message: string }>) => start(async () => { const r = await fn(); toast(r.message, r.ok); });
  const curKind = editing?.kind ?? kind;

  return (
    <div className="d-flex flex-column gap-4">
      {/* ---------- Fotos do painel principal ---------- */}
      <div className="inst-card p-4">
        <h3 className="h6 fw-bold text-inst-dark mb-1">Fotos do painel principal</h3>
        <p className="small text-muted">Aparecem em rotação no topo da página inicial. JPG, PNG ou WEBP, até 8 MB (recomendado 1920×800).</p>
        <ActionForm action={addHeroImage} submitLabel="Adicionar foto" className="row g-2 align-items-end mb-3">
          <div className="col-md-5"><label className="form-label small fw-semibold">Imagem *</label>
            <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="form-control form-control-sm" required /></div>
          <div className="col-md-5"><label className="form-label small fw-semibold">Legenda (opcional)</label>
            <input name="caption" className="form-control form-control-sm" maxLength={140} /></div>
          <div className="col-md-2 d-grid"><span /></div>
        </ActionForm>
        <div className="row g-3">
          {hero.length === 0 && <div className="col-12"><div className="alert alert-light border small mb-0">Ainda não há fotos. Sem fotos, o portal mostra o fundo institucional azul.</div></div>}
          {hero.map((h) => (
            <div className="col-sm-6 col-lg-3" key={h.id}>
              <div className="border rounded overflow-hidden h-100 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(h.path)} alt={h.caption || 'Foto do portal'} style={{ width: '100%', height: 120, objectFit: 'cover', opacity: h.active ? 1 : 0.4 }} />
                <div className="p-2 small">
                  <div className="text-truncate text-muted" title={h.caption}>{h.caption || 'Sem legenda'}</div>
                  <div className="d-flex gap-1 mt-1">
                    <button className="btn btn-sm btn-light border" disabled={pending} onClick={() => run(() => toggleHeroImage(h.id, !h.active))} title={h.active ? 'Ocultar' : 'Mostrar'}>
                      {h.active ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                    <button className="btn btn-sm btn-light border text-danger" disabled={pending} title="Eliminar"
                      onClick={() => confirm('Eliminar esta foto?') && run(() => deleteHeroImage(h.id))}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {!isSuper ? (
        <div className="alert alert-light border small mb-0">
          Os destaques do município, números em grande, notícias e o logótipo são inseridos apenas pelo <strong>Superadministrador</strong>.
        </div>
      ) : (
        <>
          {/* ---------- Logótipo ---------- */}
          <div className="inst-card p-4">
            <h3 className="h6 fw-bold text-inst-dark mb-1">Logótipo do Governo de Angola</h3>
            <p className="small text-muted">Por defeito usa o logótipo publicado em governo.gov.ao. Para não depender desse site, descarregue-o e carregue aqui uma cópia (PNG, SVG ou WEBP).</p>
            <div className="d-flex flex-wrap align-items-center gap-4">
              <div className="border rounded p-3 bg-white"><Brand logoUrl={logoUrl} height={64} /></div>
              <ActionForm action={uploadLogo} submitLabel="Carregar logótipo" className="d-flex gap-2 align-items-end">
                <input type="file" name="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" className="form-control form-control-sm" required />
              </ActionForm>
              {hasCustomLogo && <button className="btn btn-sm btn-outline-secondary" disabled={pending} onClick={() => run(resetLogo)}>Repor logótipo oficial</button>}
            </div>
          </div>

          {/* ---------- Destaques / números / notícias ---------- */}
          <div className="row g-4">
            <div className="col-xl-5">
              <div className="inst-card p-4">
                <h3 className="h6 fw-bold text-inst-dark mb-3">{editing ? 'Editar conteúdo' : 'Inserir conteúdo'}</h3>
                <ActionForm key={editing?.id ?? 'novo'} action={savePortalContent} submitLabel={editing ? 'Guardar alterações' : 'Publicar no portal'}
                  buttonClass="btn btn-sm btn-inst-primary" onSuccess={() => setEditing(null)}>
                  <input type="hidden" name="id" value={editing?.id ?? ''} />
                  <div className="mb-2"><label className="form-label small fw-semibold">Tipo *</label>
                    <select name="kind" className="form-select form-select-sm" value={curKind} disabled={!!editing}
                      onChange={(e) => setKind(e.target.value as PortalContent['kind'])}>
                      <option value="destaque">Destaque do município</option>
                      <option value="numero">Número em grande (ponto de destaque)</option>
                      <option value="noticia">Notícia / comunicado</option>
                    </select>
                    {editing && <input type="hidden" name="kind" value={editing.kind} />}
                  </div>
                  <div className="mb-2"><label className="form-label small fw-semibold">Título *</label>
                    <input name="title" className="form-control form-control-sm" defaultValue={editing?.title} required maxLength={160} /></div>
                  {curKind === 'numero' && (
                    <div className="row g-2 mb-2">
                      <div className="col-5"><label className="form-label small fw-semibold">Valor *</label>
                        <input name="big_value" className="form-control form-control-sm" placeholder="38.700" defaultValue={editing?.big_value ?? ''} /></div>
                      <div className="col-7"><label className="form-label small fw-semibold">Legenda</label>
                        <input name="big_label" className="form-control form-control-sm" placeholder="habitantes" defaultValue={editing?.big_label ?? ''} /></div>
                    </div>
                  )}
                  <div className="mb-2"><label className="form-label small fw-semibold">Texto</label>
                    <textarea name="body" rows={4} className="form-control form-control-sm" defaultValue={editing?.body} /></div>
                  {curKind !== 'numero' && (
                    <div className="mb-2"><label className="form-label small fw-semibold">Imagem (opcional)</label>
                      <input type="file" name="file" accept="image/jpeg,image/png,image/webp" className="form-control form-control-sm" /></div>
                  )}
                  <div className="mb-3"><label className="form-label small fw-semibold">Visibilidade</label>
                    <select name="published" className="form-select form-select-sm" defaultValue={String(editing?.published ?? true)}>
                      <option value="true">Visível no portal</option><option value="false">Oculto (rascunho)</option></select></div>
                </ActionForm>
                {editing && <button className="btn btn-sm btn-link mt-2 px-0" onClick={() => setEditing(null)}>Cancelar edição</button>}
              </div>
            </div>
            <div className="col-xl-7">
              <div className="inst-card overflow-hidden">
                <div className="table-responsive">
                  <table className="table table-hover align-middle small mb-0">
                    <thead className="table-light"><tr><th>Tipo</th><th>Título</th><th>Estado</th><th /></tr></thead>
                    <tbody>
                      {content.length === 0 && <tr><td colSpan={4} className="text-center text-muted py-4">Nada inserido ainda. O portal só mostra o que o Superadministrador inserir.</td></tr>}
                      {content.map((c) => (
                        <tr key={c.id}>
                          <td><span className="badge bg-light text-inst-primary border">{KIND_LABEL[c.kind]}</span></td>
                          <td className="fw-medium">{c.title}{c.kind === 'numero' && <span className="text-muted"> — {c.big_value} {c.big_label}</span>}</td>
                          <td>{c.published ? <span className="badge-status-publicado px-2 py-1 rounded">Visível</span> : <span className="badge-status-submetido px-2 py-1 rounded">Oculto</span>}</td>
                          <td className="text-end text-nowrap">
                            <button className="btn btn-sm btn-light border me-1" onClick={() => setEditing(c)} title="Editar"><Pencil size={14} /></button>
                            <button className="btn btn-sm btn-light border text-danger" disabled={pending} title="Eliminar"
                              onClick={() => confirm(`Eliminar "${c.title}"?`) && run(() => deletePortalContent(c.id))}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
