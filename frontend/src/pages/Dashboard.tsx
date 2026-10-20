import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getDashboard } from '../api/dashboard';
import { getUser } from '../api/auth';

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
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
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
}

function StatCard({ item, index }: { item: StatItem; index: number }) {
  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="show"
      variants={cardVariants}
      className="relative bg-white rounded-2xl border border-gray-100 p-4 md:p-5 overflow-hidden shadow-sm"
    >
      <div
        className="absolute top-0 right-0 w-20 h-20 md:w-24 md:h-24 rounded-bl-full opacity-10"
        style={{ background: item.gradient }}
      />
      <div
        className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center mb-2.5"
        style={{ background: item.gradient }}
      >
        <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
        </svg>
      </div>
      <p className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">{item.value}</p>
      <p className="text-[11px] md:text-xs text-gray-500 mt-1 leading-tight">{item.label}</p>
      {item.sub && <p className="text-[11px] md:text-xs font-medium mt-1" style={{ color: '#00AEEF' }}>{item.sub}</p>}
    </motion.div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    refetchInterval: 30_000,
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
          style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
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

  const statItems: StatItem[] = [
    {
      label: 'Ingresos este mes',
      value: fmt(stats.monthRevenue),
      gradient: 'linear-gradient(135deg,#10b981,#059669)',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Pacientes totales',
      value: stats.totalPatients,
      gradient: 'linear-gradient(135deg,#00AEEF,#0077B6)',
      iconPath: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z',
    },
    {
      label: 'Citas hoy',
      value: stats.appointmentsToday,
      gradient: 'linear-gradient(135deg,#8b5cf6,#6d28d9)',
      iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    },
    {
      label: 'Pendientes',
      value: stats.appointmentsPending,
      gradient: 'linear-gradient(135deg,#f59e0b,#d97706)',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Completadas este mes',
      value: stats.completedThisMonth,
      gradient: 'linear-gradient(135deg,#10b981,#0d9488)',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Tratamientos en curso',
      value: stats.treatmentsInProgress,
      gradient: 'linear-gradient(135deg,#f43f5e,#e11d48)',
      iconPath: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    },
  ];

  const quickActions = [
    { label: 'Nueva cita', path: '/citas', gradient: 'linear-gradient(135deg,#00AEEF,#0077B6)', iconPath: 'M12 4v16m8-8H4' },
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
        style={{ background: 'linear-gradient(135deg,#00AEEF 0%,#0077B6 60%,#005a90 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -right-2 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-4 right-16 w-12 h-12 rounded-full bg-white/10" />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-blue-100 text-sm font-medium">{greeting},</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-0.5">{firstName} 👋</h2>
            <p className="text-blue-200 text-sm mt-1">{todayCapitalized}</p>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 flex-wrap">
            {quickActions.map(a => (
              <button
                key={a.path}
                onClick={() => navigate(a.path)}
                className="flex items-center gap-1.5 px-3 py-2.5 sm:py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-xl transition-colors backdrop-blur-sm border border-white/20 min-h-[40px] sm:min-h-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.iconPath} />
                </svg>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {statItems.map((item, i) => (
          <StatCard key={item.label} item={item} index={i} />
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's appointments — timeline style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, duration: 0.28 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-[#00AEEF]" />
              <h3 className="text-sm font-semibold text-gray-900">Citas de hoy</h3>
              {todayAppointments.length > 0 && (
                <span className="px-2 py-0.5 bg-[#E6F7FD] text-[#0077B6] text-xs font-semibold rounded-full">
                  {todayAppointments.length}
                </span>
              )}
            </div>
            <button
              onClick={() => navigate('/citas')}
              className="text-xs font-medium text-[#00AEEF] hover:text-[#0077B6] transition-colors flex items-center gap-1"
            >
              Ver todas
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {todayAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-700">Sin citas para hoy</p>
              <p className="text-xs text-gray-400 mt-1">Disfruta el día libre</p>
              <button
                onClick={() => navigate('/citas')}
                className="mt-4 px-4 py-2 text-xs font-medium text-white rounded-xl"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
              >
                Agendar cita
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todayAppointments.map((a) => (
                <div key={a.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors">
                  {/* Time column */}
                  <div className="w-12 shrink-0 text-center">
                    <p className="text-sm font-bold text-gray-900">{formatTime(a.date)}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.duration}m</p>
                  </div>

                  {/* Divider line + dot */}
                  <div className="flex flex-col items-center self-stretch py-1">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${STATUS_DOT[a.status]}`} />
                    <div className="w-px flex-1 bg-gray-100 mt-1" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {a.patient.name} {a.patient.lastName}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{a.reason}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-50 shrink-0 ${STATUS_TEXT[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
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
          className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <h3 className="text-sm font-semibold text-gray-900">Pacientes recientes</h3>
            </div>
            <button
              onClick={() => navigate('/pacientes')}
              className="text-xs font-medium text-[#00AEEF] hover:text-[#0077B6] transition-colors flex items-center gap-1"
            >
              Ver todos
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          {recentPatients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
                </svg>
              </div>
              <p className="text-sm text-gray-500">Sin pacientes registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentPatients.map((p) => {
                const initials = `${p.name[0]}${p.lastName[0]}`.toUpperCase();
                const colors = ['linear-gradient(135deg,#00AEEF,#0077B6)', 'linear-gradient(135deg,#8b5cf6,#6d28d9)', 'linear-gradient(135deg,#10b981,#059669)', 'linear-gradient(135deg,#f59e0b,#d97706)'];
                const colorIdx = (p.name.charCodeAt(0) + p.lastName.charCodeAt(0)) % colors.length;
                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                    className="flex items-center gap-3 px-6 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors group"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: colors[colorIdx] }}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#0077B6] transition-colors">
                        {p.name} {p.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{p.phone}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-[#00AEEF] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
