import { useState, useEffect } from 'react';
import type { Treatment } from '../api/treatments';
import PatientComboBox from './PatientComboBox';

interface Props {
  onClose: () => void;
  onSubmit: (data: {
    patientId: string; name: string; description?: string;
    cost: number; startDate: string; notes?: string;
  }) => void;
  loading: boolean;
  initial?: Partial<Treatment>;
  fixedPatientId?: string;
}

const TREATMENT_NAMES = [
  'Limpieza dental', 'Extracción simple', 'Extracción molar', 'Endodoncia',
  'Resina / Empaste', 'Corona dental', 'Ortodoncia', 'Blanqueamiento',
  'Implante dental', 'Puente dental', 'Cirugía periodontal', 'Otro',
];

const inputClass = 'w-full px-3 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all';

export default function TreatmentForm({ onClose, onSubmit, loading, initial, fixedPatientId }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    patientId: fixedPatientId ?? initial?.patientId ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    cost: initial?.cost ?? '',
    startDate: initial?.startDate ? initial.startDate.slice(0, 10) : today,
    notes: initial?.notes ?? '',
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId: form.patientId,
      name: form.name,
      description: form.description || undefined,
      cost: parseFloat(form.cost as string),
      startDate: new Date(form.startDate).toISOString(),
      notes: form.notes || undefined,
    });
  };

  const canSubmit = (fixedPatientId || form.patientId) && form.name && form.cost;
  const isEdit = !!initial;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-5 pb-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)' }}>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-violet-500/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{isEdit ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{isEdit ? 'Modifica los datos del tratamiento' : 'Completa los datos del tratamiento'}</p>
              </div>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700 transition-colors shadow-sm"
              onClick={onClose} type="button">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} id="treatment-form" className="flex flex-col gap-4">

            {!fixedPatientId && (
              <PatientComboBox
                patientId={form.patientId}
                onChange={id => setForm(f => ({ ...f, patientId: id }))}
                required
              />
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tratamiento *</label>
                <select className={inputClass} value={form.name} onChange={set('name')} required>
                  <option value="">Selecciona...</option>
                  {TREATMENT_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <input className={inputClass} value={form.description} onChange={set('description')} placeholder="Detalle del tratamiento..." />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Costo (S/) *</label>
                <input type="number" min="0" step="0.01" className={inputClass}
                  value={form.cost} onChange={set('cost')} required placeholder="0.00" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fecha inicio *</label>
                <input type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} required />
              </div>

              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <textarea className={`${inputClass} resize-y min-h-[70px]`}
                  value={form.notes} onChange={set('notes')} placeholder="Observaciones adicionales..." />
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
          <p className="text-xs text-gray-400">Los campos con * son obligatorios</p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
              Cancelar
            </button>
            <button type="submit" form="treatment-form" disabled={loading || !canSubmit}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#8b5cf6,#6d28d9)' }}>
              {loading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                  </svg>
                  {isEdit ? 'Guardar cambios' : 'Guardar tratamiento'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
