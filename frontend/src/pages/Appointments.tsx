import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAppointments, createAppointment, updateAppointment, cancelAppointment,
  getAppointmentsByMonth,
} from '../api/appointments';
import type { Appointment } from '../api/appointments';
import AppointmentForm from '../components/AppointmentForm';

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
  CONFIRMED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7FD] text-[#0077B6]',
  COMPLETED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-600',
  CANCELLED: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500',
};

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-amber-400',
  CONFIRMED: 'bg-[#E6F7FD]0',
  COMPLETED: 'bg-green-500',
  CANCELLED: 'bg-gray-300',
};

const DAYS_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const DAYS = ['Dom', 'Lun', 'Mar', 'MiÃ©', 'Jue', 'Vie', 'SÃ¡b'];
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

// â”€â”€â”€ Calendar View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CalendarView({
  appointments,
  year,
  month,
  onDayClick,
}: {
  appointments: Appointment[];
  year: number;
  month: number;
  onDayClick: (date: string) => void;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  // group appointments by date string "YYYY-MM-DD"
  const byDay: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const key = new Date(a.date).toISOString().slice(0, 10);
    (byDay[key] ??= []).push(a);
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Day headers â€” single letter on mobile, abbreviation on desktop */}
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
          const isToday = key === today;

          return (
            <div
              key={key}
              className={`min-h-[46px] md:min-h-[90px] border-b border-r border-gray-100 last:border-r-0 p-1 md:p-1.5 cursor-pointer hover:bg-gray-50 transition-colors ${
                isToday ? 'bg-[#E6F7FD]/60' : ''
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

              {/* Mobile: dots only */}
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

              {/* Desktop: pills with text */}
              <div className="hidden md:block space-y-0.5">
                {dayAppts.slice(0, 3).map(a => (
                  <div
                    key={a.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 truncate"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[a.status]}`} />
                    <span className="truncate">{formatTime(a.date)} {a.patient.name}</span>
                  </div>
                ))}
                {dayAppts.length > 3 && (
                  <p className="text-[10px] text-gray-400 pl-1">+{dayAppts.length - 3} mÃ¡s</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function Appointments() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [date, setDate] = useState(todayStr);
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [showForm, setShowForm] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const qc = useQueryClient();

  // list view query
  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', date],
    queryFn: () => getAppointments(date),
    enabled: view === 'list',
  });

  // calendar view query
  const monthStr = toMonthStr(calYear, calMonth);
  const { data: monthAppointments = [], isLoading: calLoading } = useQuery({
    queryKey: ['appointments-month', monthStr],
    queryFn: () => getAppointmentsByMonth(monthStr),
    enabled: view === 'calendar',
  });

  const createMut = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-month'] });
      setShowForm(false);
    },
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointment(id, { status: status as Appointment['status'] }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-month'] });
    },
  });

  const cancelMut = useMutation({
    mutationFn: cancelAppointment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['appointments-month'] });
      setConfirmCancel(null);
    },
  });

  const active = appointments.filter(a => a.status !== 'CANCELLED');
  const cancelled = appointments.filter(a => a.status === 'CANCELLED');

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
        {/* Row 1: title + Nueva cita */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Citas</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {view === 'list'
                ? `${active.length} cita${active.length !== 1 ? 's' : ''} para este dÃ­a`
                : `${MONTHS_ES[calMonth]} ${calYear}`}
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 md:px-4 text-white transition-colors rounded-lg text-sm font-medium shrink-0" style={{ background: "linear-gradient(135deg,#00AEEF,#0077B6)" }}>
            <PlusIcon /> <span className="hidden sm:inline">Nueva cita</span><span className="sm:hidden">Nueva</span>
          </button>
        </div>

        {/* Row 2: view toggle + date/nav */}
        <div className="flex items-center gap-2">
          {/* View toggle */}
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
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD]"
            />
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
      </div>

      {/* Calendar view */}
      {view === 'calendar' && (
        calLoading ? (
          <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Cargando...</div>
        ) : (
          <CalendarView
            appointments={monthAppointments}
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
            <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
              Cargando citas...
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p className="text-sm font-medium text-gray-700">Sin citas para este dÃ­a</p>
              <span className="text-xs">Agenda una nueva cita con el botÃ³n de arriba</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Hora', 'Paciente', 'Motivo', 'DuraciÃ³n', 'Estado', 'Acciones'].map(h => (
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
                      className="hover:bg-gray-50"
                      style={{ opacity: a.status === 'CANCELLED' ? 0.55 : 1 }}
                    >
                      <td className={`px-4 py-3.5 text-sm ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="font-medium text-gray-900">{formatTime(a.date)}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{formatDate(a.date)}</div>
                      </td>
                      <td className={`px-4 py-3.5 text-sm ${idx < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <div className="font-medium text-gray-900">{a.patient.name} {a.patient.lastName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{a.patient.phone}</div>
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
                              onClick={() => setConfirmCancel(a.id)}
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
          )}
        </div>
      )}

      {showForm && (
        <AppointmentForm
          onClose={() => setShowForm(false)}
          onSubmit={data => createMut.mutate(data)}
          loading={createMut.isPending}
          error={createMut.isError ? 'Error al agendar la cita' : ''}
          defaultDate={date}
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
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 mb-5">
                Â¿EstÃ¡s seguro de que deseas cancelar esta cita? Esta acciÃ³n no se puede deshacer.
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
                  onClick={() => cancelMut.mutate(confirmCancel)}
                  disabled={cancelMut.isPending}
                >
                  {cancelMut.isPending ? 'Cancelando...' : 'SÃ­, cancelar cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

