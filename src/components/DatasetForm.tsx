'use client';
import { useState, useTransition } from 'react';
import Modal from './Modal';
import { useToast } from './Toast';
import { saveDataset } from '@/app/admin/actions';
import { CATEGORY_FIELDS, LICENSES, STATUSES } from '@/lib/constants';
import { canValidate, submitCategories } from '@/lib/permissions';
import type { Category, Commune, Dataset, Institution, Profile } from '@/lib/types';

interface Props {
  open: boolean; onClose: () => void; profile: Profile;
  dataset: Dataset | null; presetCategory?: string;
  categories: Category[]; communes: Commune[]; institutions: Institution[];
}

export default function DatasetForm({ open, onClose, profile, dataset, presetCategory, categories, communes, institutions }: Props) {
  const toast = useToast();
  const [pending, start] = useTransition();
  const allowedCats = dataset ? categories.map((c) => c.id) : submitCategories(profile, categories.map((c) => c.id));
  const [category, setCategory] = useState(dataset?.category ?? (presetCategory && allowedCats.includes(presetCategory) ? presetCategory : allowedCats[0] ?? ''));
  const validator = canValidate(profile, category);
  const fields = CATEGORY_FIELDS[category] ?? [];
  const statuses = validator ? STATUSES : (['Rascunho', 'Submetido'] as const);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const r = await saveDataset(fd);
      toast(r.message, r.ok);
      if (r.ok) onClose();
    });
  }

  const label = (t: string) => <label className="form-label small fw-semibold mb-1">{t}</label>;
  const v = dataset;

  return (
    <Modal open={open} onClose={onClose} size="xl" title={v ? 'Editar Conjunto de Dados' : 'Submeter Novo Conjunto de Dados'}>
      <form onSubmit={onSubmit} id="dataset-form">
        <input type="hidden" name="id" value={v?.id ?? ''} />
        <div className="row g-3">
          <div className="col-md-8">{label('Nome do conjunto de dados *')}
            <input name="name" className="form-control form-control-sm" defaultValue={v?.name} required maxLength={200} /></div>
          <div className="col-md-4">{label('Categoria *')}
            <select name="category" className="form-select form-select-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.filter((c) => allowedCats.includes(c.id)).map((c) => <option key={c.id} value={c.id}>{c.id}</option>)}
            </select></div>
          <div className="col-12">{label('Descrição')}
            <textarea name="description" rows={2} className="form-control form-control-sm" defaultValue={v?.description} /></div>
          <div className="col-md-4">{label('Comuna *')}
            <select name="commune" className="form-select form-select-sm" defaultValue={v?.commune ?? communes[0]?.name} required>
              {communes.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select></div>
          <div className="col-md-5">{label('Instituição produtora *')}
            <select name="institution" className="form-select form-select-sm" defaultValue={v?.institution ?? ''} required>
              <option value="" disabled>Seleccionar…</option>
              {institutions.map((i) => <option key={i.id} value={i.name}>{i.name}</option>)}
            </select></div>
          <div className="col-md-3">{label('Ano de referência *')}
            <input name="year" type="number" min={1900} max={2100} className="form-control form-control-sm" defaultValue={v?.year ?? new Date().getFullYear()} required /></div>
          <div className="col-md-5">{label('Fonte dos dados *')}
            <input name="source" className="form-control form-control-sm" defaultValue={v?.source ?? profile.institution ?? ''} required /></div>
          <div className="col-md-4">{label('Licença de utilização')}
            <select name="license" className="form-select form-select-sm" defaultValue={v?.license ?? LICENSES[0]}>
              {LICENSES.map((l) => <option key={l}>{l}</option>)}
            </select></div>
          <div className="col-md-3">{label('Classificação')}
            <select name="is_demo" className="form-select form-select-sm" defaultValue={String(v?.is_demo ?? false)}>
              <option value="false">Dados oficiais</option>
              <option value="true">Demonstração</option>
            </select></div>
          <div className="col-md-6">{label('Estado')}
            <select name="status" className="form-select form-select-sm" defaultValue={v?.status ?? (validator ? 'Publicado' : 'Submetido')}>
              {statuses.map((s) => <option key={s}>{s}</option>)}
            </select>
            {!validator && <div className="form-text">O seu perfil submete para validação; a publicação é feita por quem valida esta categoria.</div>}</div>
          <div className="col-md-6">{label('Ficheiro anexo (CSV, XLSX, PDF — máx. 10 MB)')}
            <input name="file" type="file" accept=".csv,.xlsx,.xls,.pdf,.json" className="form-control form-control-sm" />
            {v?.file_name && <div className="form-text">Actual: {v.file_name}</div>}</div>

          <div className="col-12">
            <div className="border rounded p-3 bg-light">
              <div className="small fw-bold text-inst-dark mb-2">Campos Específicos: {category}</div>
              <div className="row g-2" key={category}>
                {fields.map((f) => (
                  <div className="col-md-6" key={f.key}>
                    <label className="form-label small mb-1">{f.label}</label>
                    <input type={f.type} step={f.step ?? (f.type === 'number' ? 'any' : undefined)} name={`metric:${f.key}`}
                      className="form-control form-control-sm" placeholder={f.placeholder}
                      defaultValue={category === v?.category ? String(v?.metrics?.[f.key] ?? '') : ''} />
                    <input type="hidden" name={`metrictype:${f.key}`} value={f.type} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-3">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-sm btn-inst-primary" disabled={pending}>{pending ? 'A guardar…' : 'Guardar'}</button>
        </div>
      </form>
    </Modal>
  );
}
