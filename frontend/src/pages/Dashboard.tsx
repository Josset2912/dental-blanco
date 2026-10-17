import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getDashboard } from '../api/dashboard';

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-amber-50 text-amber-600',
  CONFIRMED: 'bg-blue-50 text-blue-600',
  COMPLETED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(v);
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard });

  const today = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  const todayCapitalized = today.charAt(0).toUpperCase() + today.slice(1);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-gray-500 text-sm">Cargando...</div>;
  }

  const { stats, todayAppointments, recentPatients } = data!;

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">{todayCapitalized}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          label="Ingresos este mes"
          value={fmt(stats.monthRevenue)}
          color="bg-green-50 text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <StatCard
          label="Pacientes totales"
          value={stats.totalPatients}
          color="bg-[#E6F7FD] text-[#0077B6]"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
            </svg>
          }
        />
        <StatCard
          label="Citas hoy"
          value={stats.appointmentsToday}
          color="bg-purple-50 text-purple-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
          }
        />
        <StatCard
          label="Citas pendientes"
          value={stats.appointmentsPending}
          color="bg-amber-50 text-amber-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
        <StatCard
          label="Completadas este mes"
          value={stats.completedThisMonth}
          color="bg-green-50 text-green-600"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's appointments */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Citas de hoy</h3>
            <button
              onClick={() => navigate('/citas')}
              className="text-xs font-medium hover:opacity-80"
              style={{ color: '#00AEEF' }}
            >
              Ver todas â†’
            </button>
          </div>
          {todayAppointments.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              <p className="text-sm text-gray-500">Sin citas para hoy</p>
            </div>
          ) : (
            <div>
              {todayAppointments.map((a, i) => (
                <div
                  key={a.id}
                  className={`flex items-center gap-4 px-6 py-3.5 ${i < todayAppointments.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="w-14 shrink-0 text-center">
                    <p className="text-sm font-semibold text-gray-900">{formatTime(a.date)}</p>
                    <p className="text-xs text-gray-400">{a.duration} min</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {a.patient.name} {a.patient.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{a.reason}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_COLORS[a.status]}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent patients */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Pacientes recientes</h3>
            <button
              onClick={() => navigate('/pacientes')}
              className="text-xs font-medium hover:opacity-80"
              style={{ color: '#00AEEF' }}
            >
              Ver todos â†’
            </button>
          </div>
          {recentPatients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-gray-500">Sin pacientes registrados</p>
            </div>
          ) : (
            <div>
              {recentPatients.map((p, i) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/pacientes/${p.id}`)}
                  className={`flex items-center gap-3 px-6 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${i < recentPatients.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
                    {p.name[0]}{p.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{p.name} {p.lastName}</p>
                    <p className="text-xs text-gray-500">{p.phone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

