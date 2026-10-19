import { useState } from 'react';
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
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Nueva cita</h3>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <PatientComboBox
                patientId={form.patientId}
                onChange={id => setForm(f => ({ ...f, patientId: id }))}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Motivo *</label>
                <select className={inputClass} value={form.reason} onChange={set('reason')} required>
                  <option value="">Selecciona...</option>
                  {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
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

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#00AEEF] rounded-lg hover:bg-[#0077B6] disabled:opacity-60 transition-colors"
                disabled={loading || !form.patientId || !form.reason}
              >
                {loading ? 'Guardando...' : 'Agendar cita'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
