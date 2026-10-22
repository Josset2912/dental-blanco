import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getAppointments, createAppointment, updateAppointment, cancelAppointment,
  getAppointmentsByMonth,
} from '../api/appointments';
import type { Appointment } from '../api/appointments';
import AppointmentForm from '../components/AppointmentForm';
import { getBlockedSlots, createBlockedSlot, deleteBlockedSlot } from '../api/blocked-slots';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_CLASS: Record<string, string> = {
  SCHEDULED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600',
  CONFIRMED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#00AEEF]/[0.09] text-[#005F8E]',
  COMPLETED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600',
  CANCELLED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500',
};

const STATUS_BORDER: Record<string, string> = {
  SCHEDULED: '#f59e0b',
  CONFIRMED: '#00AEEF',
  COMPLETED: '#10b981',
  CANCELLED: '#d1d5db',
};

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-amber-400',
  CONFIRMED: 'bg-[#00AEEF]',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-gray-300',
};

const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' });
}

function toMonthStr(y: number, m: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

// ─── Block Slot Modal ────────────────────────────────────────────────────────

function BlockSlotModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: { date: string; startTime: string; endTime: string; reason?: string }) => void;
  loading: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ date, startTime, endTime, reason: reason || undefined });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Bloquear horario</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Ej: Vacaciones, reunión, descanso..."
              className="w-full px-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-colors"
              style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
            >
              {loading ? 'Guardando...' : 'Bloquear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Calendar View ────────────────────────────────────────────────────────────

function CalendarView({
  appointments,
  blockedSlots,
  year,
  month,
  onDayClick,
}: {
  appointments: Appointment[];
  blockedSlots: { id: string; date: string; startTime: string; endTime: string; reason?: string }[];
  year: number;
  month: number;
  onDayClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const byDay: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const key = new Date(a.date).toISOString().slice(0, 10);
    (byDay[key] ??= []).push(a);
  }

  const blockedByDay: Record<string, typeof blockedSlots> = {};
  for (const s of blockedSlots) {
    (blockedByDay[s.date] ??= []).push(s);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d, i) => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-gray-400 uppercase">
            <span className="md:hidden">{DAYS_SHORT[i]}</span>
            <span className="hidden md:inline">{d}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`e-${idx}`} className="min-h-[46px] md:min-h-[90px] border-b border-r border-gray-100 last:border-r-0" />;
          }
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayAppts = byDay[key] ?? [];
          const dayBlocked = blockedByDay[key] ?? [];
          const isToday = key === today;
          const hasBlocked = dayBlocked.length > 0;

          return (
            <div
              key={key}
              className={`min-h-[46px] md:min-h-[90px] border-b border-r border-gray-100 last:border-r-0 p-1 md:p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-[#00AEEF]/[0.07]' : hasBlocked ? 'bg-red-50/40' : ''
              }`}
              onClick={() => onDayClick(key)}
            >
              <span
                className={`inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 rounded-full text-xs font-semibold mb-0.5 ${
                  isToday ? 'bg-[#00AEEF] text-white' : 'text-gray-700'
                }`}
              >
                {day}
              </span>

              {/* Blocked indicator (mobile) */}
              {hasBlocked && (
                <div className="md:hidden flex gap-0.5 mt-0.5">
                  {dayBlocked.slice(0, 2).map(s => (
                    <span key={s.id} className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  ))}
                </div>
              )}

              {/* Mobile: dots for appointments */}
              {dayAppts.length > 0 && (
                <div className="md:hidden flex flex-wrap gap-0.5 mt-0.5">
                  {dayAppts.slice(0, 3).map(a => (
                    <span key={a.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[a.status]}`} />
                  ))}
                  {dayAppts.length > 3 && (
                    <span className="text-[8px] text-gray-400 leading-none">+{dayAppts.length - 3}</span>
                  )}
                </div>
              )}

              {/* Desktop: blocked slots */}
              <div className="hidden md:block space-y-0.5">
                {dayBlocked.slice(0, 1).map(s => (
                  <div key={s.id} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-600 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <span className="truncate">Bloqueado {s.startTime}-{s.endTime}</span>
                  </div>
                ))}
                {dayAppts.slice(0, dayBlocked.length > 0 ? 2 : 3).map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 truncate"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status]}`} />
                    <span className="truncate">{formatTime(a.date)} {a.patient.name}</span>
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-gray-400 pl-1">+{dayAppts.length - 3} más</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function Appointments() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [date, setDate] = useState(todayStr);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [showBlockList, setShowBlockList] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const qc = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', date],
    queryFn: () => getAppointments(date),
    enabled: view === 'list',
  });

  const monthStr = toMonthStr(calYear, calMonth);
  const { data: monthAppointments = [], isLoading: calLoading } = useQuery({
    queryKey: ['appointments-month', monthStr],
    queryFn: () => getAppointmentsByMonth(monthStr),
    enabled: view === 'calendar',
  });

  const { data: blockedSlots = [] } = useQuery({
    queryKey: ['blocked-slots', monthStr],
    queryFn: () => getBlockedSlots(monthStr),
    enabled: view === 'calendar',
  });

  const createMut = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-month'] });
      setShowForm(false);
      toast.success('Cita agendada correctamente');
    },
    onError: () => toast.error('Error al agendar la cita'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointment(id, { status: status as Appointment['status'] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-month'] });
      toast.success('Estado de cita actualizado');
    },
    onError: () => toast.error('Error al actualizar la cita'),
  });

  const cancelMut = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-month'] });
      setConfirmCancel(null);
      toast.success('Cita cancelada');
    },
    onError: () => toast.error('Error al cancelar la cita'),
  });

  const blockMut = useMutation({
    mutationFn: createBlockedSlot,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blocked-slots'] });
      setShowBlockForm(false);
      toast.success('Horario bloqueado');
    },
    onError: () => toast.error('Error al bloquear el horario'),
  });

  const unblockMut = useMutation({
    mutationFn: deleteBlockedSlot,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['blocked-slots'] }); toast.success('Bloqueo eliminado'); },
    onError: () => toast.error('Error al eliminar el bloqueo'),
  });

  const visibleAppointments = statusFilter ? appointments.filter(a => a.status === statusFilter) : appointments;
  const active = visibleAppointments.filter(a => a.status !== 'CANCELLED');
  const cancelled = visibleAppointments.filter(a => a.status === 'CANCELLED');

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
  };

  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-[#00AEEF] to-[#005F8E] rounded-full shrink-0" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Citas</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {view === 'list'
                  ? `${active.length} cita${active.length !== 1 ? 's' : ''} para este día`
                  : `${MONTHS_ES[calMonth]} ${calYear}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {view === 'calendar' && (
              <button
                onClick={() => setShowBlockForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                </svg>
                <span className="hidden sm:inline">Bloquear horario</span>
                <span className="sm:hidden">Bloquear</span>
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 text-white rounded-lg text-sm font-semibold hover:brightness-110 transition-all" style={{ background: "linear-gradient(135deg,#00AEEF,#005F8E)" }}>
              <PlusIcon /> <span className="hidden sm:inline">Nueva cita</span><span className="sm:hidden">Nueva</span>
            </button>
          </div>
        </div>

        {/* Row 2: view toggle + date/nav */}
        <div className="flex items-center gap-2">
          <div className="flex border border-gray-200 rounded-lg overflow-hidden text-sm">
            <button
              className={`px-3 py-2 font-medium transition-colors ${view === 'list' ? 'bg-[#00AEEF] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setView('list')}
            >
              Lista
            </button>
            <button
              className={`px-3 py-2 font-medium transition-colors ${view === 'calendar' ? 'bg-[#00AEEF] text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              onClick={() => setView('calendar')}
            >
              Calendario
            </button>
          </div>

          {view === 'list' ? (
            <div className="flex-1 min-w-0 flex gap-2">
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all"
              />
              {date !== todayStr && (
                <button
                  onClick={() => setDate(todayStr)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-[#00AEEF] text-[#00AEEF] hover:bg-[#00AEEF]/[0.09] whitespace-nowrap transition-all"
                >
                  Hoy
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <span className="text-sm font-medium text-gray-700 px-1 whitespace-nowrap">
                {MONTHS_ES[calMonth].slice(0, 3)} {calYear}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Status filter chips — list view */}
        {view === 'list' && (
          <div className="flex gap-1 overflow-x-auto pb-0.5 mt-2">
            {[
              { label: 'Todas', value: '' },
              { label: 'Agendadas', value: 'SCHEDULED' },
              { label: 'Confirmadas', value: 'CONFIRMED' },
              { label: 'Completadas', value: 'COMPLETED' },
              { label: 'Canceladas', value: 'CANCELLED' },
            ].map(f => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all ${
                  statusFilter === f.value
                    ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-[#00AEEF] hover:text-[#00AEEF]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* Blocked slots list (calendar view) */}
        {view === 'calendar' && blockedSlots.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowBlockList(v => !v)}
              className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
              </svg>
              {blockedSlots.length} horario{blockedSlots.length !== 1 ? 's' : ''} bloqueado{blockedSlots.length !== 1 ? 's' : ''} este mes
              <svg className={`w-3.5 h-3.5 transition-transform ${showBlockList ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            {showBlockList && (
              <div className="mt-2 bg-red-50 border border-red-100 rounded-lg divide-y divide-red-100 overflow-hidden">
                {blockedSlots.map(slot => (
                  <div key={slot.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div>
                      <span className="font-medium text-red-700">{slot.date}</span>
                      <span className="text-red-500 ml-2">{slot.startTime} - {slot.endTime}</span>
                      {slot.reason && <span className="text-gray-500 ml-2">· {slot.reason}</span>}
                    </div>
                    <button
                      onClick={() => unblockMut.mutate(slot.id)}
                      disabled={unblockMut.isPending}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Calendar view */}
      {view === 'calendar' && (
        calLoading ? (
          <div className="animate-pulse space-y-2">
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['L','M','X','J','V','S','D'].map(d => (
                <div key={d} className="h-7 bg-gray-100 rounded text-center" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, week) => (
              <div key={week} className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, day) => (
                  <div key={day} className="h-20 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <CalendarView
            appointments={monthAppointments}
            blockedSlots={blockedSlots}
            year={calYear}
            month={calMonth}
            onDayClick={key => { setDate(key); setView('list'); }}
          />
        )
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-10 bg-gray-50 border-b border-gray-100 px-4 flex items-center gap-4">
                {['w-16','w-28','w-24','w-16','w-20','w-16'].map((w, i) => (
                  <div key={i} className={`h-3 bg-gray-200 rounded ${w}`} />
                ))}
              </div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={`flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                  <div className="space-y-1.5 w-16 shrink-0">
                    <div className="h-3.5 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-50 rounded w-3/4" />
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-gray-100 rounded w-2/5" />
                    <div className="h-3 bg-gray-50 rounded w-1/4" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-24" />
                  <div className="h-3 bg-gray-100 rounded w-12" />
                  <div className="h-6 bg-gray-100 rounded-full w-20" />
                  <div className="h-7 bg-gray-100 rounded-md w-16" />
                </div>
              ))}
            </div>
          ) : appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Sin citas para este día</p>
              <p className="text-xs text-gray-400 mt-1">El calendario está libre — agrega una cita nueva</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
              >
                Agendar cita
              </button>
            </div>
          ) : (
            <>
            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-50">
              {[...active, ...cancelled].map(a => (
                <div key={a.id} className="p-4 border-l-[3px]" style={{ opacity: a.status === 'CANCELLED' ? 0.55 : 1, borderLeftColor: STATUS_BORDER[a.status] }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <button onClick={() => navigate(`/pacientes/${a.patient.id}`)} className="text-left min-w-0 group">
                      <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-[#005F8E] transition-colors">{a.patient.name} {a.patient.lastName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.patient.phone}</p>
                    </button>
                    <span className={`${STATUS_CLASS[a.status]} shrink-0`}>{STATUS_LABEL[a.status]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
                    <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    {formatTime(a.date)} · {formatDate(a.date)} · {a.duration} min
                  </div>
                  <p className="text-xs text-gray-600 mb-3 line-clamp-1">{a.reason}</p>
                  {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                    <div className="flex gap-1.5 flex-wrap">
                      {a.status === 'SCHEDULED' && (
                        <button
                          className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
                          onClick={() => statusMut.mutate({ id: a.id, status: 'CONFIRMED' })}
                          disabled={statusMut.isPending}
                        >Confirmar</button>
                      )}
                      {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
                        <button
                          className="text-xs px-3 py-1.5 border border-green-300 rounded-lg text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-60"
                          onClick={() => statusMut.mutate({ id: a.id, status: 'COMPLETED' })}
                          disabled={statusMut.isPending}
                        >Completar</button>
                      )}
                      <button
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                        onClick={() => setConfirmCancel(a)}
                      >Cancelar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Hora', 'Paciente', 'Motivo', 'Duración', 'Estado', 'Acciones'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...active, ...cancelled].map((a, idx, arr) => (
                    <tr
                      key={a.id}
                      className="hover:bg-[#F6F8FA] transition-colors"
                      style={{ opacity: a.status === 'CANCELLED' ? 0.55 : 1 }}
                    >
                      <td className={`px-4 py-3.5 text-sm ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="font-medium text-gray-900">{formatTime(a.date)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(a.date)}</div>
                      </td>
                      <td className={`px-4 py-3.5 text-sm ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <button onClick={() => navigate(`/pacientes/${a.patient.id}`)} className="text-left group">
                          <div className="font-medium text-gray-900 group-hover:text-[#005F8E] transition-colors">{a.patient.name} {a.patient.lastName}</div>
                          <div className="text-xs text-gray-500 mt-0.5">{a.patient.phone}</div>
                        </button>
                      </td>
                      <td className={`px-4 py-3.5 text-sm text-gray-700 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        {a.reason}
                      </td>
                      <td className={`px-4 py-3.5 text-sm text-gray-700 ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        {a.duration} min
                      </td>
                      <td className={`px-4 py-3.5 text-sm ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <span className={STATUS_CLASS[a.status]}>{STATUS_LABEL[a.status]}</span>
                      </td>
                      <td className={`px-4 py-3.5 text-sm ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        {a.status !== 'CANCELLED' && a.status !== 'COMPLETED' && (
                          <div className="flex gap-1.5 flex-wrap">
                            {a.status === 'SCHEDULED' && (
                              <button
                                className="text-xs px-2.5 py-1 border border-gray-200 rounded-md text-gray-600 bg-white hover:bg-gray-50 transition-colors disabled:opacity-60"
                                onClick={() => statusMut.mutate({ id: a.id, status: 'CONFIRMED' })}
                                disabled={statusMut.isPending}
                              >
                                Confirmar
                              </button>
                            )}
                            {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
                              <button
                                className="text-xs px-2.5 py-1 border border-green-300 rounded-md text-green-600 bg-green-50 hover:bg-green-100 transition-colors disabled:opacity-60"
                                onClick={() => statusMut.mutate({ id: a.id, status: 'COMPLETED' })}
                                disabled={statusMut.isPending}
                              >
                                Completar
                              </button>
                            )}
                            <button
                              className="text-xs px-2.5 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                              onClick={() => setConfirmCancel(a)}
                            >
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          onClose={() => setShowForm(false)}
          onSubmit={data => createMut.mutate(data)}
          loading={createMut.isPending}
          defaultDate={date}
        />
      )}

      {showBlockForm && (
        <BlockSlotModal
          onClose={() => setShowBlockForm(false)}
          onSubmit={data => blockMut.mutate(data)}
          loading={blockMut.isPending}
        />
      )}

      {confirmCancel && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setConfirmCancel(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Cancelar cita</h3>
              <button onClick={() => setConfirmCancel(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              {/* Resumen de la cita */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1.5">
                <p className="text-sm font-semibold text-gray-900">
                  {confirmCancel.patient.name} {confirmCancel.patient.lastName}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  {formatTime(confirmCancel.date)} · {formatDate(confirmCancel.date)} · {confirmCancel.duration} min
                </div>
                <p className="text-xs text-gray-600 line-clamp-1">{confirmCancel.reason}</p>
              </div>
              <p className="text-sm text-gray-700 mb-5">
                ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  onClick={() => setConfirmCancel(null)}
                >
                  Volver
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors"
                  onClick={() => cancelMut.mutate(confirmCancel.id)}
                  disabled={cancelMut.isPending}
                >
                  {cancelMut.isPending ? 'Cancelando...' : 'Sí, cancelar cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
