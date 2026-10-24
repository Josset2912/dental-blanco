import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getDashboard } from '../api/dashboard';
import { getUser } from '../api/auth';
import { updateAppointment } from '../api/appointments';

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLOR: Record<string, { text: string; bg: string; dot: string }> = {
  SCHEDULED: { text: '#B45309', bg: '#FFFBEB', dot: '#F59E0B' },
  CONFIRMED: { text: '#005F8E', bg: '#E0F6FE', dot: '#00AEEF' },
  COMPLETED: { text: '#047857', bg: '#ECFDF5', dot: '#10B981' },
  CANCELLED:  { text: '#6B7280', bg: '#F9FAFB', dot: '#D1D5DB' },
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-PE', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
  });
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency', currency: 'PEN', maximumFractionDigits: 0,
  }).format(v);
}

const AVATAR_PALETTES = [
  { bg: '#EEF6FF', text: '#005F8E' },
  { bg: '#F5F0FF', text: '#6D28D9' },
  { bg: '#ECFDF5', text: '#047857' },
  { bg: '#FFFBEB', text: '#B45309' },
  { bg: '#FFF1F2', text: '#BE123C' },
];

function avatarPalette(name: string, lastName: string) {
  return AVATAR_PALETTES[(name.charCodeAt(0) + lastName.charCodeAt(0)) % AVATAR_PALETTES.length];
}

function initials(name: string, lastName: string) {
  return `${name[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  iconPath: string;
  path?: string;
}

function StatCard({ item, index, onNavigate }: { item: StatItem; index: number; onNavigate: (p: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.26, ease: 'easeOut' as const }}
      onClick={() => item.path && onNavigate(item.path)}
      className={`relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
        transition-all duration-200 group
        ${item.path ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}`}
    >
      <div className="p-5">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${item.accent}18` }}
        >
          <svg
            className="w-[17px] h-[17px]"
            style={{ color: item.accent }}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
          </svg>
        </div>

        {/* Number */}
        <p className="text-[26px] font-black text-gray-900 leading-none tabular-nums tracking-tight">
          {item.value}
        </p>
        <p className="text-[11px] text-gray-400 mt-2 font-semibold uppercase tracking-wide leading-tight">
          {item.label}
        </p>
        {item.sub && (
          <p className="text-xs font-semibold mt-1.5" style={{ color: item.accent }}>{item.sub}</p>
        )}
      </div>

      {/* Accent bottom bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[3px]"
        style={{ background: item.accent }}
      />

      {/* Arrow on hover */}
      {item.path && (
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-60 transition-opacity">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30_000,
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateAppointment(id, { status: status as 'CONFIRMED' | 'COMPLETED' }),
    onSuccess: (_data, { status }) => {
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(status === 'CONFIRMED' ? 'Cita confirmada' : 'Cita completada');
    },
  });

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = user?.name?.split(' ')[0] ?? 'Doctor';
  const today = now.toLocaleDateString('es-PE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  /* ── Error state ── */
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <p className="text-base font-bold text-gray-800">Error al cargar el dashboard</p>
        <p className="text-sm text-gray-400 mt-1">Verifica tu conexión e intenta nuevamente</p>
        <button
          onClick={() => refetch()}
          className="mt-5 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
          style={{ background: '#00AEEF' }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        {/* Hero skeleton */}
        <div className="h-[88px] rounded-2xl bg-gray-100" />
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-[110px]">
              <div className="w-9 h-9 rounded-xl bg-gray-100 mb-4" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
        {/* Bottom skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 h-72" />
          <div className="bg-white rounded-2xl border border-gray-100 h-72" />
        </div>
      </div>
    );
  }

  const { stats, todayAppointments, recentPatients } = data!;

  const upcomingAppt = todayAppointments
    .filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

  const totalToday = todayAppointments.length;
  const completedToday = todayAppointments.filter(a => a.status === 'COMPLETED').length;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const statItems: StatItem[] = [
    {
      label: 'Ingresos del mes',
      value: fmt(stats.monthRevenue),
      accent: '#10B981',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/pagos',
    },
    {
      label: 'Pacientes totales',
      value: stats.totalPatients,
      accent: '#00AEEF',
      iconPath: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z',
      path: '/pacientes',
    },
    {
      label: 'Citas hoy',
      value: stats.appointmentsToday,
      accent: '#8B5CF6',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      path: '/citas',
    },
    {
      label: 'Pendientes',
      value: stats.appointmentsPending,
      accent: '#F59E0B',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/citas',
    },
    {
      label: 'Completadas este mes',
      value: stats.completedThisMonth,
      accent: '#0D9488',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/citas',
    },
    {
      label: 'Tratamientos activos',
      value: stats.treatmentsInProgress,
      accent: '#F43F5E',
      iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      path: '/tratamientos',
    },
  ];

  return (
    <div className="space-y-5">

      {/* ── Hero: minimal strip ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="bg-white border border-gray-100 rounded-2xl shadow-sm px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-black text-lg"
            style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
          >
            {firstName[0]}
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{greeting}</p>
            <h2 className="text-xl font-black text-gray-900 leading-tight">Dr. {firstName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{todayCapitalized}</p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Nueva cita', path: '/citas', accent: '#00AEEF', iconPath: 'M12 4v16m8-8H4' },
            { label: 'Nuevo paciente', path: '/pacientes', accent: '#8B5CF6', iconPath: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
            { label: 'Registrar pago', path: '/pagos', accent: '#10B981', iconPath: 'M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z' },
          ].map(a => (
            <button
              key={a.path}
              onClick={() => navigate(a.path)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-gray-200 text-gray-600 transition-all hover:border-transparent hover:text-white"
              onMouseEnter={e => {
                e.currentTarget.style.background = a.accent;
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '';
                e.currentTarget.style.color = '';
                e.currentTarget.style.borderColor = '';
              }}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={a.iconPath} />
              </svg>
              {a.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Próxima cita + progreso ─────────────────────── */}
      {totalToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.26 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {upcomingAppt ? (
            <div
              onClick={() => navigate(`/pacientes/${upcomingAppt.patient.id}`)}
              className="flex-1 bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4
                flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
            >
              {/* Time block */}
              <div
                className="shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center"
                style={{ background: '#E0F6FE' }}
              >
                <span className="text-[15px] font-black leading-none" style={{ color: '#005F8E' }}>
                  {formatTime(upcomingAppt.date)}
                </span>
                <span className="text-[9px] font-bold mt-0.5" style={{ color: '#00AEEF' }}>PRÓXIMA</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#00AEEF] transition-colors">
                  {upcomingAppt.patient.name} {upcomingAppt.patient.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate mt-0.5">{upcomingAppt.reason}</p>
                <p className="text-[11px] text-gray-300 mt-1">{upcomingAppt.duration} min</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 group-hover:text-[#00AEEF] group-hover:translate-x-0.5 transition-all shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ) : (
            <div className="flex-1 bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-emerald-100">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-700">Todas las citas atendidas</p>
                <p className="text-xs text-emerald-500 mt-0.5">Sin citas pendientes por hoy</p>
              </div>
            </div>
          )}

          {/* Day progress */}
          <div className="sm:w-56 bg-white border border-gray-100 rounded-2xl shadow-sm px-5 py-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progreso</p>
              <span className="text-base font-black text-gray-900 tabular-nums">{completedToday}/{totalToday}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' as const }}
                className="h-full rounded-full"
                style={{ background: progressPct === 100 ? '#10B981' : '#00AEEF' }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-2 font-medium">
              {progressPct === 100 ? '¡Día completado!' : `${progressPct}% completado`}
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Stats grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, i) => (
          <StatCard key={item.label} item={item} index={i} onNavigate={navigate} />
        ))}
      </div>

      {/* ── Bottom: agenda + pacientes ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Agenda del día */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.26 }}
          className="lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ background: '#00AEEF' }}
              />
              <h3 className="text-sm font-bold text-gray-900">Agenda del día</h3>
              {todayAppointments.length > 0 && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ background: '#E0F6FE', color: '#005F8E' }}
                >
                  {todayAppointments.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/citas')}
              className="text-xs font-semibold text-gray-400 hover:text-[#00AEEF] transition-colors flex items-center gap-1"
            >
              Ver todas
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-700">Sin citas para hoy</p>
              <p className="text-xs text-gray-400 mt-1">Disfruta el día libre</p>
              <button
                onClick={() => navigate('/citas')}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white rounded-xl"
                style={{ background: '#00AEEF' }}
              >
                Agendar cita
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayAppointments.map((a) => {
                const sc = STATUS_COLOR[a.status] ?? STATUS_COLOR.SCHEDULED;
                const av = avatarPalette(a.patient.name, a.patient.lastName);
                return (
                  <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">

                    {/* Time */}
                    <div className="w-12 shrink-0 text-center">
                      <p className="text-sm font-black text-gray-900 tabular-nums">{formatTime(a.date)}</p>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{a.duration}m</p>
                    </div>

                    {/* Status dot + line */}
                    <div className="flex flex-col items-center self-stretch py-1 w-3">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sc.dot }} />
                      <div className="w-px flex-1 bg-gray-100 mt-1" />
                    </div>

                    {/* Patient avatar */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0"
                      style={{ background: av.bg, color: av.text }}
                    >
                      {initials(a.patient.name, a.patient.lastName)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => navigate(`/pacientes/${a.patient.id}`)}
                        className="text-sm font-semibold text-gray-900 truncate hover:text-[#00AEEF] transition-colors text-left block w-full"
                      >
                        {a.patient.name} {a.patient.lastName}
                      </button>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{a.reason}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {a.status === 'SCHEDULED' && (
                        <button
                          onClick={() => statusMut.mutate({ id: a.id, status: 'CONFIRMED' })}
                          disabled={statusMut.isPending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                          style={{ background: '#E0F6FE', color: '#005F8E' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#00AEEF'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#E0F6FE'; e.currentTarget.style.color = '#005F8E'; }}
                          title="Confirmar cita"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                          </svg>
                        </button>
                      )}
                      {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
                        <button
                          onClick={() => statusMut.mutate({ id: a.id, status: 'COMPLETED' })}
                          disabled={statusMut.isPending}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
                          style={{ background: '#ECFDF5', color: '#047857' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#10B981'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#ECFDF5'; e.currentTarget.style.color = '#047857'; }}
                          title="Marcar completada"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                        style={{ background: sc.bg, color: sc.text }}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pacientes recientes */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.26 }}
          className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <span className="inline-block w-2 h-2 rounded-full bg-violet-400" />
              <h3 className="text-sm font-bold text-gray-900">Pacientes recientes</h3>
            </div>
            <button
              onClick={() => navigate('/pacientes')}
              className="text-xs font-semibold text-gray-400 hover:text-[#00AEEF] transition-colors flex items-center gap-1"
            >
              Ver todos
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-500">Sin pacientes registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPatients.map((p) => {
                const av = avatarPalette(p.name, p.lastName);
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="flex items-center gap-3.5 px-5 py-3.5 cursor-pointer hover:bg-gray-50/70 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black shrink-0"
                      style={{ background: av.bg, color: av.text }}
                    >
                      {initials(p.name, p.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#00AEEF] transition-colors">
                        {p.name} {p.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{p.phone}</p>
                    </div>
                    <svg
                      className="w-3.5 h-3.5 text-gray-200 group-hover:text-[#00AEEF] group-hover:translate-x-0.5 transition-all shrink-0"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
