'use client';
import { useState } from 'react';
import Map from './Map';
import ActionForm from './ActionForm';
import { addLocation } from '@/app/admin/actions';
import { canManageTerritory } from '@/lib/permissions';
import { MAP_CATEGORIES } from '@/lib/constants';
import type { Commune, LocationPoint, Profile } from '@/lib/types';

export default function AdminMap({ locations, communes, profile }: { locations: LocationPoint[]; communes: Commune[]; profile: Profile }) {
  const [cat, setCat] = useState('ALL');
  const [com, setCom] = useState('ALL');
  const pts = locations.filter((l) => (cat === 'ALL' || l.category === cat) && (com === 'ALL' || l.commune === com));

  return (
    <div className="row g-4">
      <div className="col-lg-8">
        <div className="inst-card p-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <span className="fw-bold small text-inst-dark">Cartografia Municipal de Ambuíla (OpenStreetMap) • {pts.length} pontos</span>
            <div className="d-flex flex-wrap gap-2">
              <select className="form-select form-select-sm w-auto" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
                <option value="ALL">Todas Categorias</option>
                {MAP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select className="form-select form-select-sm w-auto" value={com} onChange={(e) => setCom(e.target.value)} aria-label="Comuna">
                <option value="ALL">Todas Comunas</option>
                {communes.map((c) => <option key={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <Map locations={pts} height={480} />
        </div>
      </div>
      <div className="col-lg-4">
        <div className="inst-card p-4">
          <h4 className="h6 fw-bold text-inst-dark mb-1">Registar Nova Localização</h4>
          <p className="small text-muted mb-3">Insira as coordenadas geográficas reais (WGS84) da infraestrutura ou equipamento.</p>
          {!canManageTerritory(profile) ? (
            <div className="alert alert-light border small mb-0">O seu perfil tem acesso de leitura ao mapa.</div>
          ) : (
            <ActionForm action={addLocation} submitLabel="Guardar Ponto Geográfico" buttonClass="btn btn-sm btn-inst-primary w-100">
              <div className="mb-2"><label className="form-label small fw-semibold">Nome da Infraestrutura / Local *</label>
                <input name="name" className="form-control form-control-sm" placeholder="Ex: Posto de Saúde do Bairro Novo" required /></div>
              <div className="row g-2 mb-2">
                <div className="col-6"><label className="form-label small fw-semibold">Categoria *</label>
                  <select name="category" className="form-select form-select-sm">{MAP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="col-6"><label className="form-label small fw-semibold">Comuna *</label>
                  <select name="commune" className="form-select form-select-sm">{communes.map((c) => <option key={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="row g-2 mb-2">
                <div className="col-6"><label className="form-label small fw-semibold">Latitude *</label>
                  <input name="lat" type="number" step="any" min={-90} max={90} className="form-control form-control-sm" placeholder="-7.4400" required /></div>
                <div className="col-6"><label className="form-label small fw-semibold">Longitude *</label>
                  <input name="lng" type="number" step="any" min={-180} max={180} className="form-control form-control-sm" placeholder="14.6600" required /></div>
              </div>
              <div className="mb-3"><label className="form-label small fw-semibold">Descrição</label>
                <textarea name="description" rows={2} className="form-control form-control-sm" placeholder="Detalhes operacionais..." /></div>
            </ActionForm>
          )}
        </div>
      </div>
    </div>
  );
}
