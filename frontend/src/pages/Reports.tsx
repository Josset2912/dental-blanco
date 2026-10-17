import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getOverview, getRevenue, getPatientsReport, getTreatments } from '../api/reports';

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Reports() {
  const { data: overview } = useQuery({ queryKey: ['reports-overview'], queryFn: getOverview });
  const { data: revenue } = useQuery({ queryKey: ['reports-revenue'], queryFn: getRevenue });
  const { data: patients } = useQuery({ queryKey: ['reports-patients'], queryFn: getPatientsReport });
  const { data: treatments } = useQuery({ queryKey: ['reports-treatments'], queryFn: getTreatments });

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reportes y estadísticas</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen del mes actual y tendencias de los últimos 12 meses</p>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Pacientes totales" value={overview?.totalPatients ?? '—'} />
        <StatCard label="Nuevos este mes" value={overview?.newPatientsMonth ?? '—'} />
        <StatCard label="Citas este mes" value={overview?.appointmentsMonth ?? '—'} />
        <StatCard
          label="Ingresos este mes"
          value={overview ? fmt(overview.revenueMonth) : '—'}
        />
        <StatCard label="Tratamientos en curso" value={overview?.pendingTreatments ?? '—'} />
      </div>

      {/* Revenue chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos mensuales (últimos 12 meses)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={revenue ?? []} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v) => [fmt(Number(v)), 'Ingresos']}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Patients + Treatment status row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Patients trend */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Nuevos pacientes (últimos 12 meses)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={patients ?? []} margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line
                type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }} name="Pacientes"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Treatments by status pie */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tratamientos por estado</h2>
          {treatments?.byStatus?.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={treatments.byStatus}
                  dataKey="value"
                  nameKey="label"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ label, percent }: { label?: string; percent?: number }) => `${label ?? ''} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {treatments.byStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
          )}
        </div>
      </div>

      {/* Payment methods */}
      {treatments?.byMethod?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Ingresos por método de pago</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 pb-2 uppercase">Método</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 uppercase">Pagos</th>
                  <th className="text-right text-xs font-medium text-gray-500 pb-2 uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {treatments.byMethod.map(m => (
                  <tr key={m.label} className="border-b border-gray-50 last:border-0">
                    <td className="py-2.5 font-medium text-gray-800">{m.label}</td>
                    <td className="py-2.5 text-right text-gray-600">{m.count}</td>
                    <td className="py-2.5 text-right font-semibold text-gray-900">{fmt(m.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
