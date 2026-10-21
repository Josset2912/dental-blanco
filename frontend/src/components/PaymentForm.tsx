import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTreatments } from '../api/treatments';
import PatientComboBox from './PatientComboBox';

interface Props {
  onClose: () => void;
  onSubmit: (data: {
    patientId: string; treatmentId?: string;
    amount: number; method: string; concept: string; notes?: string;
  }) => void;
  loading: boolean;
  fixedPatientId?: string;
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white transition-all';

const METHODS = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'TRANSFER', label: 'Transferencia' },
];

const CONCEPTS_TREATMENT = ['Pago inicial', 'Abono', 'Cancelación'];
const CONCEPTS_GENERAL = ['Consulta', 'Pago inicial', 'Abono', 'Cancelación', 'Otro'];

export default function PaymentForm({ onClose, onSubmit, loading, fixedPatientId }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const [form, setForm] = useState({
    patientId: fixedPatientId ?? '',
    treatmentId: '',
    amount: '',
    method: 'CASH',
    concept: '',
    notes: '',
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', form.patientId],
    queryFn: () => getTreatments({ patientId: form.patientId }),
    enabled: !!form.patientId,
  });

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

  const canSubmit = (fixedPatientId || form.patientId) && form.amount && form.concept;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div className="relative overflow-hidden px-6 pt-5 pb-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)' }}>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-emerald-500/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Registrar pago</h3>
                <p className="text-xs text-gray-500 mt-0.5">Completa los datos del pago</p>
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
          <form onSubmit={handleSubmit} id="payment-form" className="flex flex-col gap-4">

            {!fixedPatientId && (
              <PatientComboBox
                patientId={form.patientId}
                onChange={id => setForm(f => ({ ...f, patientId: id, treatmentId: '' }))}
                required
              />
            )}

            {form.patientId && treatments.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  Vincular a tratamiento <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <select className={inputClass} value={form.treatmentId}
                  onChange={e => setForm(f => ({ ...f, treatmentId: e.target.value, concept: '' }))}>
                  <option value="">Sin vincular</option>
                  {treatments.filter(t => t.status !== 'CANCELLED').map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(t.cost))}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Monto (S/) *</label>
                <input
                  type="number" min="0.01" step="0.01" className={inputClass}
                  value={form.amount}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === '' || parseFloat(v) > 0) setForm(f => ({ ...f, amount: v }));
                  }}
                  required placeholder="0.00"
                  onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Método *</label>
                <div className="flex gap-2">
                  {METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, method: m.value as 'CASH' | 'CARD' | 'TRANSFER' }))}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${
                        form.method === m.value
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-400 hover:text-emerald-600'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Concepto *</label>
                <select className={inputClass} value={form.concept} onChange={set('concept')} required>
                  <option value="">Selecciona...</option>
                  {(form.treatmentId ? CONCEPTS_TREATMENT : CONCEPTS_GENERAL).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Notas</label>
                <textarea className={`${inputClass} resize-none h-[72px]`}
                  value={form.notes} onChange={set('notes')} placeholder="Observaciones opcionales..." />
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
            <button type="submit" form="payment-form" disabled={loading || !canSubmit}
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
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
                  Registrar pago
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
