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

const STATUS_DOT: Record<string, string> = {
  SCHEDULED: 'bg-amber-400',
  CONFIRMED: 'bg-blue-400',
  COMPLETED: 'bg-green-400',
  CANCELLED: 'bg-gray-300',
};

const STATUS_TEXT: Record<string, string> = {
  SCHEDULED: 'text-amber-600',
  CONFIRMED: 'text-blue-600',
  COMPLETED: 'text-green-600',
  CANCELLED: 'text-gray-400',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(v);
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.28, ease: 'easeOut' as const } }),
};

interface StatItem {
  label: string;
  value: string | number;
  sub?: string;
  gradient: string;
  iconPath: string;
  path?: string;
}

function StatCard({ item, index, onNavigate }: { item: StatItem; index: number; onNavigate: (path: string) => void }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="show"
      variants={cardVariants}
      onClick={() => item.path && onNavigate(item.path)}
      className={`relative bg-white rounded-xl overflow-hidden shadow-card transition-all duration-200 group
        ${item.path ? 'cursor-pointer hover:shadow-card-hover' : 'cursor-default'}`}
    >
      {/* Top accent line — el único elemento de color, preciso e intencional */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: item.gradient }} />

      <div className="p-4 md:p-5 pt-5 md:pt-6">
        {/* Icon — pequeño, secundario */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center mb-3 opacity-90"
          style={{ background: item.gradient }}
        >
          <svg className="w-[15px] h-[15px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
          </svg>
        </div>

        {/* Número — el héroe visual */}
        <p className="text-2xl md:text-[28px] font-black text-gray-900 leading-none tracking-tight tabular-nums">
          {item.value}
        </p>
        <p className="text-[11px] text-gray-400 mt-1.5 leading-tight font-medium uppercase tracking-wide">
          {item.label}
        </p>
        {item.sub && (
          <p className="text-xs font-semibold mt-1" style={{ color: '#00AEEF' }}>{item.sub}</p>
        )}
      </div>

      {/* Hover arrow — feedback sutil de que es clickable */}
      {item.path && (
        <div className="absolute top-5 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
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

  const today = now.toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        </div>
        <p className="text-base font-semibold text-gray-900">Error al cargar el dashboard</p>
        <p className="text-sm text-gray-500 mt-1">Verifica tu conexión e intenta nuevamente</p>
        <button
          onClick={() => refetch()}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-colors"
          style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Hero skeleton */}
        <div className="rounded-2xl h-28 bg-gradient-to-r from-gray-200 to-gray-100" />
        {/* Stat cards skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-gray-100 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
        {/* Bottom grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex gap-3 items-center">
              <div className="w-2 h-2 rounded-full bg-gray-200" />
              <div className="h-3.5 bg-gray-200 rounded w-28" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0">
                <div className="w-12 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-2.5 bg-gray-100 rounded w-3/4 mx-auto" />
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-2/5" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/3" />
                </div>
                <div className="h-6 bg-gray-100 rounded-lg w-20" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex gap-3 items-center">
              <div className="w-2 h-2 rounded-full bg-gray-200" />
              <div className="h-3.5 bg-gray-200 rounded w-36" />
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3.5 border-b border-gray-50 last:border-0">
                <div className="w-9 h-9 rounded-xl bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { stats, todayAppointments, recentPatients } = data!;

  // Próxima cita: la más cercana que no está cancelada ni completada
  const upcomingAppt = todayAppointments
    .filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0] ?? null;

  // Progreso del día
  const totalToday = todayAppointments.length;
  const completedToday = todayAppointments.filter(a => a.status === 'COMPLETED').length;
  const progressPct = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const statItems: StatItem[] = [
    {
      label: 'Ingresos este mes',
      value: fmt(stats.monthRevenue),
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/pagos',
    },
    {
      label: 'Pacientes totales',
      value: stats.totalPatients,
      gradient: 'linear-gradient(135deg,#00AEEF,#005F8E)',
      iconPath: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z',
      path: '/pacientes',
    },
    {
      label: 'Citas hoy',
      value: stats.appointmentsToday,
      gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      path: '/citas',
    },
    {
      label: 'Pendientes',
      value: stats.appointmentsPending,
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/citas',
    },
    {
      label: 'Completadas este mes',
      value: stats.completedThisMonth,
      gradient: 'linear-gradient(135deg,#10b981,#0d9488)',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      path: '/citas',
    },
    {
      label: 'Tratamientos en curso',
      value: stats.treatmentsInProgress,
      gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)',
      iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      path: '/tratamientos',
    },
  ];

  const quickActions = [
    { label: 'Nueva cita', path: '/citas', gradient: 'linear-gradient(135deg,#00AEEF,#005F8E)', iconPath: 'M12 4v16m8-8H4' },
    { label: 'Nuevo paciente', path: '/pacientes', gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)', iconPath: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
    { label: 'Registrar pago', path: '/pagos', gradient: 'linear-gradient(135deg,#10b981,#059669)', iconPath: 'M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z' },
  ];

  return (
    <div className="space-y-6">

      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg, #0090D4 0%, #006EA6 55%, #004F7A 100%)' }}
      >
        {/* Cuadrícula arquitectónica — deliberada, no aleatoria */}
        <div className="absolute inset-0 bg-grid-white opacity-100" />

        {/* Anillos concéntricos — punto focal, no blobs random */}
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full border border-white/[0.08]" />
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full border border-white/[0.10]" />
        <div className="absolute right-8 top-8 w-20 h-20 rounded-full border border-white/[0.07]" />

        {/* Glow accent abajo-izquierda */}
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,174,239,0.25) 0%, transparent 70%)' }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <p className="text-[#93D4F0] text-sm font-semibold tracking-wide">{greeting}</p>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1 leading-tight tracking-tight">
              {firstName}
            </h2>
            <p className="text-white/50 text-sm mt-1.5 font-medium">{todayCapitalized}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {quickActions.map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-2 px-3.5 py-2.5 sm:py-2 bg-white/[0.12] hover:bg-white/[0.22] text-white text-xs font-semibold rounded-lg transition-all backdrop-blur-sm border border-white/[0.12] hover:border-white/[0.2] min-h-[40px] sm:min-h-0 shadow-sm"
              >
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.iconPath} />
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Próxima cita + progreso del día */}
      {totalToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.28 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          {/* Próxima cita */}
          {upcomingAppt ? (
            <div
              onClick={() => navigate(`/pacientes/${upcomingAppt.patient.id}`)}
              className="flex-1 bg-white rounded-xl shadow-card px-5 py-4 flex items-center gap-4 cursor-pointer hover:shadow-card-hover transition-all group"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Próxima cita</p>
                <p className="text-sm font-bold text-gray-900 truncate group-hover:text-[#00AEEF] transition-colors">
                  {upcomingAppt.patient.name} {upcomingAppt.patient.lastName}
                </p>
                <p className="text-xs text-gray-400 truncate">{upcomingAppt.reason}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-black text-gray-900 tabular-nums">{formatTime(upcomingAppt.date)}</p>
                <p className="text-[11px] font-medium text-gray-400">{upcomingAppt.duration} min</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-green-50 rounded-xl px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-4.5 h-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-green-700">Todas las citas atendidas</p>
                <p className="text-xs text-green-600">Sin citas pendientes por hoy</p>
              </div>
            </div>
          )}

          {/* Progreso del día */}
          <div className="sm:w-56 bg-white rounded-xl shadow-card px-5 py-4 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Progreso del día</p>
              <span className="text-xs font-black text-gray-900 tabular-nums">{completedToday}/{totalToday}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: progressPct === 100 ? 'linear-gradient(90deg,#10b981,#059669)' : 'linear-gradient(90deg,#00AEEF,#005F8E)' }}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">
              {progressPct === 100 ? '¡Día completado!' : `${progressPct}% completado`}
            </p>
          </div>
        </motion.div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statItems.map((item, i) => (
          <StatCard key={item.label} item={item} index={i} onNavigate={navigate} />
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's appointments — timeline style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.28 }}
          className="lg:col-span-2 bg-white rounded-xl shadow-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#00AEEF]" />
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Citas de hoy</h3>
              {todayAppointments.length > 0 && (
                <span className="px-2 py-0.5 bg-[#00AEEF]/10 text-[#005F8E] text-[11px] font-bold rounded-md">
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-12 h-12 rounded-xl bg-[#F6F8FA] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">Sin citas para hoy</p>
              <p className="text-xs text-gray-400 mt-1">Disfruta el día libre</p>
              <button
                onClick={() => navigate('/citas')}
                className="mt-4 px-4 py-2 text-xs font-semibold text-white rounded-lg shadow-sm"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
              >
                Agendar cita
              </button>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04]">
              {todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#F6F8FA]/80 transition-colors">
                  {/* Time column */}
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-sm font-black text-gray-900 tabular-nums">{formatTime(a.date)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{a.duration}m</p>
                  </div>

                  {/* Divider line + dot */}
                  <div className="flex flex-col items-center self-stretch py-1">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[a.status]}`} />
                    <div className="w-px flex-1 bg-black/[0.06] mt-1" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => navigate(`/pacientes/${a.patient.id}`)}
                      className="text-sm font-semibold text-gray-900 truncate hover:text-[#00AEEF] transition-colors text-left w-full"
                    >
                      {a.patient.name} {a.patient.lastName}
                    </button>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{a.reason}</p>
                  </div>

                  {/* Quick actions + status */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {a.status === 'SCHEDULED' && (
                      <button
                        onClick={() => statusMut.mutate({ id: a.id, status: 'CONFIRMED' })}
                        disabled={statusMut.isPending}
                        className="w-7 h-7 rounded-lg bg-[#00AEEF]/10 text-[#005F8E] hover:bg-[#00AEEF] hover:text-white transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                        title="Confirmar cita"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
                        </svg>
                      </button>
                    )}
                    {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') && (
                      <button
                        onClick={() => statusMut.mutate({ id: a.id, status: 'COMPLETED' })}
                        disabled={statusMut.isPending}
                        className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                        title="Marcar como completada"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                        </svg>
                      </button>
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-md bg-black/[0.03] ${STATUS_TEXT[a.status]}`}>
                      {STATUS_LABEL[a.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent patients */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, duration: 0.28 }}
          className="bg-white rounded-xl shadow-card overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <h3 className="text-sm font-bold text-gray-900 tracking-tight">Pacientes recientes</h3>
            </div>
            <button
              onClick={() => navigate('/pacientes')}
              className="text-xs font-semibold text-gray-400 hover:text-[#00AEEF] transition-colors flex items-center gap-1"
            >
              Ver todos
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#F6F8FA] flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-500">Sin pacientes registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-black/[0.04]">
              {recentPatients.map((p) => {
                const initials = `${p.name[0]}${p.lastName[0]}`.toUpperCase();
                const colors = [
                  'linear-gradient(135deg,#00AEEF,#005F8E)',
                  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
                  'linear-gradient(135deg,#10b981,#059669)',
                  'linear-gradient(135deg,#f59e0b,#d97706)',
                ];
                const colorIdx = (p.name.charCodeAt(0) + p.lastName.charCodeAt(0)) % colors.length;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-[#F6F8FA]/80 transition-colors group"
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black text-white shrink-0"
                      style={{ background: colors[colorIdx] }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#00AEEF] transition-colors">
                        {p.name} {p.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{p.phone}</p>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-200 group-hover:text-[#00AEEF] group-hover:translate-x-0.5 transition-all shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
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
