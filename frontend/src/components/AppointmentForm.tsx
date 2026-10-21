import { useState, useEffect } from 'react';
import { getUser } from '../api/auth';
import PatientComboBox from './PatientComboBox';
import { DateField, DateInput, DateSegment, Label } from 'react-aria-components';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';

interface FormData {
  patientId: string;
  doctorId: string;
  date: string;
  time: string;
  duration: number;
  reason: string;
  notes: string;
}

interface Props {
  onClose: () => void;
  onSubmit: (data: { patientId: string; doctorId: string; date: string; duration: number; reason: string; notes?: string }) => void;
  loading: boolean;
  defaultDate?: string;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const REASONS = ['Consulta general', 'Limpieza dental', 'Extracción', 'Ortodoncia', 'Endodoncia', 'Revisión', 'Urgencia', 'Otro'];

const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] w-full bg-white';

export default function AppointmentForm({ onClose, onSubmit, loading, defaultDate = '' }: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const user = getUser();
  const todayStr = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormData>({
    patientId: '',
    doctorId: user?.id ?? '',
    date: defaultDate || todayStr,
    time: '09:00',
    duration: 30,
    reason: '',
    notes: '',
  });

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datetime = `${form.date}T${form.time}:00`;
    onSubmit({
      patientId: form.patientId,
      doctorId: form.doctorId,
      date: datetime,
      duration: Number(form.duration),
      reason: form.reason,
      notes: form.notes || undefined,
    });
  };

  const dateFieldClass = 'flex items-center gap-0.5 px-3 h-[38px] border border-gray-200 rounded-lg bg-white text-sm transition-all outline-none focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#E6F7FD]';
  const segmentClass = 'px-px rounded tabular-nums text-gray-900 outline-none focus:bg-[#00AEEF] focus:text-white data-[placeholder]:text-gray-300 data-[type=literal]:text-gray-300 data-[type=literal]:select-none';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header con acento */}
        <div className="relative overflow-hidden px-6 pt-5 pb-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)' }}>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#00AEEF]/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Nueva cita</h3>
                <p className="text-xs text-gray-500 mt-0.5">Completa los datos de la cita</p>
              </div>
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/70 text-gray-500 hover:bg-white hover:text-gray-700 transition-colors shadow-sm"
              onClick={onClose}
              type="button"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} id="appt-form">
            <div className="mb-4">
              <PatientComboBox
                patientId={form.patientId}
                onChange={id => setForm(f => ({ ...f, patientId: id }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <DateField
                  value={form.date ? parseDate(form.date) : null}
                  onChange={(date: DateValue | null) => setForm(f => ({ ...f, date: date?.toString() ?? todayStr }))}
                  minValue={today(getLocalTimeZone())}
                  isRequired
                  className="flex flex-col gap-1.5"
                >
                  <Label className="text-sm font-medium text-gray-700">Fecha *</Label>
                  <DateInput className={dateFieldClass}>
                    {(segment) => <DateSegment segment={segment} className={segmentClass} />}
                  </DateInput>
                </DateField>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Hora *</label>
                <input className={inputClass} type="time" value={form.time} onChange={set('time')} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Duración *</label>
                <select className={inputClass} value={form.duration} onChange={set('duration')}>
                  {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} minutos</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Motivo *</label>
                <div className="flex flex-wrap gap-1.5">
                  {REASONS.map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, reason: r }))}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                        form.reason === r
                          ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-[#00AEEF] hover:text-[#00AEEF]'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Notas adicionales</label>
                <textarea
                  className={`${inputClass} resize-y min-h-[80px]`}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Observaciones, instrucciones especiales..."
                />
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
          <p className="text-xs text-gray-400">Los campos con * son obligatorios</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="appt-form"
              className="px-5 py-2 text-sm font-semibold text-white rounded-xl disabled:opacity-60 transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
              disabled={loading || !form.patientId || !form.reason}
            >
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
                  Agendar cita
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
