import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPatients } from '../api/patients';
import { getTreatments } from '../api/treatments';

interface Props {
  onClose: () => void;
  onSubmit: (data: {
    patientId: string; treatmentId?: string;
    amount: number; method: string; concept: string; notes?: string;
  }) => void;
  loading: boolean;
  error: string;
  fixedPatientId?: string;
}

const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white';

const METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
];

const CONCEPTS = [
  'Consulta general', 'Limpieza dental', 'Extracción', 'Endodoncia',
  'Ortodoncia', 'Blanqueamiento', 'Implante', 'Corona', 'Pago de tratamiento', 'Otro',
];

export default function PaymentForm({ onClose, onSubmit, loading, error, fixedPatientId }: Props) {
  const [patientSearch, setPatientSearch] = useState('');
  const [form, setForm] = useState({
    patientId: fixedPatientId ?? '',
    treatmentId: '',
    amount: '',
    method: 'CASH',
    concept: '',
    notes: '',
  });

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients(patientSearch || undefined),
    enabled: !fixedPatientId,
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', form.patientId],
    queryFn: () => getTreatments({ patientId: form.patientId }),
    enabled: !!form.patientId,
  });

  const selectedPatient = patients.find(p => p.id === form.patientId);
  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      patientId: form.patientId,
      treatmentId: form.treatmentId || undefined,
      amount: parseFloat(form.amount),
      method: form.method,
      concept: form.concept,
      notes: form.notes || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Registrar pago</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">{error}</div>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Patient */}
            {!fixedPatientId && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Paciente *</label>
                <input className={inputClass} placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setForm(f => ({ ...f, patientId: '', treatmentId: '' })); }} />
                {patientSearch && !selectedPatient && patients.length > 0 && (
                  <div className="relative">
                    <div className="absolute top-0 left-0 right-0 border border-gray-200 rounded-lg max-h-36 overflow-y-auto bg-white shadow-md z-10">
                      {patients.map(p => (
                        <div key={p.id}
                          className="px-3 py-2.5 cursor-pointer text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => { setForm(f => ({ ...f, patientId: p.id, treatmentId: '' })); setPatientSearch(`${p.name} ${p.lastName}`); }}>
                          <span className="font-medium">{p.name} {p.lastName}</span>
                          <span className="text-gray-500 ml-2">{p.phone}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPatient && (
                  <div className="flex justify-between items-center px-3 py-2 bg-[#E6F7FD] text-blue-700 text-sm rounded-lg">
                    <span>✓ {selectedPatient.name} {selectedPatient.lastName}</span>
                    <button type="button" className="text-[#0077B6] hover:text-blue-800 text-xs"
                      onClick={() => { setForm(f => ({ ...f, patientId: '', treatmentId: '' })); setPatientSearch(''); }}>
                      Cambiar
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Link to treatment (optional) */}
            {form.patientId && treatments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Vincular a tratamiento <span className="text-gray-400 font-normal">(opcional)</span></label>
                <select className={inputClass} value={form.treatmentId} onChange={set('treatmentId')}>
                  <option value="">Sin vincular</option>
                  {treatments.filter(t => t.status !== 'CANCELLED').map(t => (
                    <option key={t.id} value={t.id}>{t.name} — {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(t.cost))}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Monto (S/) *</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={form.amount} onChange={set('amount')} required placeholder="0.00" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Método *</label>
                <select className={inputClass} value={form.method} onChange={set('method')}>
                  {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Concepto *</label>
                <select className={inputClass} value={form.concept} onChange={set('concept')} required>
                  <option value="">Selecciona...</option>
                  {CONCEPTS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <textarea className={`${inputClass} resize-y min-h-[60px]`} value={form.notes} onChange={set('notes')} placeholder="Observaciones opcionales..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">Cancelar</button>
              <button type="submit" disabled={loading || (!fixedPatientId && !form.patientId) || !form.amount || !form.concept}
                className="px-4 py-2 text-sm font-medium text-white bg-[#00AEEF] rounded-lg hover:bg-[#0077B6] disabled:opacity-60">
                {loading ? 'Guardando...' : 'Registrar pago'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
