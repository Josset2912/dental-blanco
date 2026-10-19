import { useState } from 'react';
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

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white';

export default function TreatmentForm({ onClose, onSubmit, loading, initial, fixedPatientId }: Props) {
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{initial ? 'Editar tratamiento' : 'Nuevo tratamiento'}</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Patient selector */}
            {!fixedPatientId && (
              <PatientComboBox
                patientId={form.patientId}
                onChange={id => setForm(f => ({ ...f, patientId: id }))}
                required
              />
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Tratamiento *</label>
                <select className={inputClass} value={form.name} onChange={set('name')} required>
                  <option value="">Selecciona...</option>
                  {TREATMENT_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Descripción</label>
                <input className={inputClass} value={form.description} onChange={set('description')} placeholder="Detalle del tratamiento..." />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Costo (S/) *</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={form.cost} onChange={set('cost')} required placeholder="0.00" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fecha inicio *</label>
                <input type="date" className={inputClass} value={form.startDate} onChange={set('startDate')} required />
              </div>

              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <textarea className={`${inputClass} resize-y min-h-[70px]`} value={form.notes} onChange={set('notes')} placeholder="Observaciones adicionales..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={loading || (!fixedPatientId && !form.patientId) || !form.name || !form.cost}
                className="px-4 py-2 text-sm font-medium text-white bg-[#00AEEF] rounded-lg hover:bg-[#0077B6] disabled:opacity-60">
                {loading ? 'Guardando...' : 'Guardar tratamiento'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
