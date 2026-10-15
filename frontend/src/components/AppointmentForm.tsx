import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPatients } from '../api/patients';
import { getUser } from '../api/auth';

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
  error: string;
  defaultDate?: string;
}

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const REASONS = ['Consulta general', 'Limpieza dental', 'Extracción', 'Ortodoncia', 'Endodoncia', 'Revisión', 'Urgencia', 'Otro'];

const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] w-full bg-white';

export default function AppointmentForm({ onClose, onSubmit, loading, error, defaultDate = '' }: Props) {
  const user = getUser();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState<FormData>({
    patientId: '',
    doctorId: user?.id ?? '',
    date: defaultDate || today,
    time: '09:00',
    duration: 30,
    reason: '',
    notes: '',
  });
  const [patientSearch, setPatientSearch] = useState('');

  const { data: patients = [] } = useQuery({
    queryKey: ['patients', patientSearch],
    queryFn: () => getPatients(patientSearch || undefined),
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

  const selectedPatient = patients.find(p => p.id === form.patientId);

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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-sm font-medium text-gray-700">Paciente *</label>
              <div className="relative">
                <input
                  className={inputClass}
                  placeholder="Buscar paciente..."
                  value={patientSearch}
                  onChange={e => { setPatientSearch(e.target.value); setForm(f => ({ ...f, patientId: '' })); }}
                />
                {patientSearch && !selectedPatient && (
                  <div className="absolute left-0 right-0 top-full mt-1 border border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-md z-10">
                    {patients.length === 0 ? (
                      <div className="px-3 py-2.5 text-sm text-gray-500">Sin resultados</div>
                    ) : (
                      patients.map(p => (
                        <div
                          key={p.id}
                          className="px-3 py-2 cursor-pointer text-sm hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          onClick={() => { setForm(f => ({ ...f, patientId: p.id })); setPatientSearch(`${p.name} ${p.lastName}`); }}
                        >
                          <span className="font-medium text-gray-900">{p.name} {p.lastName}</span>
                          <span className="text-gray-500 ml-2">{p.phone}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {selectedPatient && (
                <div className="px-3 py-2 bg-[#E6F7FD] text-blue-700 text-sm rounded-lg flex justify-between items-center">
                  <span>✓ {selectedPatient.name} {selectedPatient.lastName}</span>
                  <button
                    type="button"
                    className="text-[#0077B6] text-sm hover:text-blue-800 bg-transparent border-0 cursor-pointer"
                    onClick={() => { setForm(f => ({ ...f, patientId: '' })); setPatientSearch(''); }}
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fecha *</label>
                <input className={inputClass} type="date" value={form.date} onChange={set('date')} min={today} required />
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
