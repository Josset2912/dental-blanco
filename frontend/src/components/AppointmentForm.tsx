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
const HOURS   = Array.from({ length: 14 }, (_, i) => String(i + 7).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

const dateFieldClass = 'flex items-center gap-0.5 px-3 h-[38px] border border-gray-200 rounded-lg bg-white text-sm transition-all outline-none focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#E6F7FD]';
const segmentClass   = 'px-px rounded tabular-nums text-gray-900 outline-none focus:bg-[#00AEEF] focus:text-white data-[placeholder]:text-gray-300 data-[type=literal]:text-gray-300 data-[type=literal]:select-none';

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

  const [hh, mm] = form.time.split(':');

  const setHour = (h: string) => setForm(f => ({ ...f, time: `${h}:${f.time.split(':')[1]}` }));
  const setMin  = (m: string) => setForm(f => ({ ...f, time: `${f.time.split(':')[0]}:${m}` }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const datetime = `${form.date}T${form.time}:00-05:00`;
    onSubmit({
      patientId: form.patientId,
      doctorId: form.doctorId,
      date: datetime,
      duration: Number(form.duration),
      reason: form.reason,
      notes: form.notes || undefined,
    });
  };

  const chipBase  = 'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all';
  const chipOn    = 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-sm';
  const chipOff   = 'bg-white border-gray-200 text-gray-600 hover:border-[#00AEEF] hover:text-[#00AEEF]';
  const durOn     = 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-sm';
  const durOff    = 'bg-white border-gray-200 text-gray-600 hover:border-[#00AEEF] hover:text-[#00AEEF]';

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Header */}
        <div
          className="relative overflow-hidden px-5 pt-5 pb-4 border-b border-gray-100"
          style={{ background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)' }}
        >
          {/* Drag handle — solo mobile */}
          <div className="sm:hidden w-10 h-1 rounded-full bg-gray-300/70 mx-auto mb-4" />
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#00AEEF]/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
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
              onClick={onClose} type="button"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto flex-1 space-y-4">
          <form onSubmit={handleSubmit} id="appt-form" className="space-y-4">

            {/* Paciente */}
            <PatientComboBox
              patientId={form.patientId}
              onChange={id => setForm(f => ({ ...f, patientId: id }))}
              required
            />

            {/* Fecha + Hora */}
            <div className="grid grid-cols-2 gap-3">
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

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Hora *</label>
                <div className="flex items-center h-[38px] border border-gray-200 rounded-lg bg-white overflow-hidden focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#E6F7FD] transition-all">
                  <select
                    value={hh}
                    onChange={e => setHour(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-center outline-none appearance-none cursor-pointer font-semibold text-gray-900 pl-2"
                  >
                    {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <span className="text-gray-300 font-bold select-none shrink-0">:</span>
                  <select
                    value={mm}
                    onChange={e => setMin(e.target.value)}
                    className="flex-1 h-full bg-transparent text-sm text-center outline-none appearance-none cursor-pointer font-semibold text-gray-900 pr-2"
                  >
                    {MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Duración */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Duración *</label>
              <div className="flex gap-2">
                {DURATION_OPTIONS.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, duration: d }))}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all ${form.duration === d ? durOn : durOff}`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>

            {/* Motivo */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700">Motivo *</label>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, reason: r }))}
                    className={`${chipBase} ${form.reason === r ? chipOn : chipOff}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Notas adicionales</label>
              <textarea
                className="px-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 w-full bg-[#F6F8FA] focus:bg-white resize-none h-[72px] placeholder-gray-400 transition-all"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Observaciones, instrucciones especiales..."
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-3 bg-gray-50/60">
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
              style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
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
