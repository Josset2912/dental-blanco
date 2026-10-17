import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getOverview, getRevenue, getPatientsReport, getTreatments } from '../api/reports';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

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
    new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n);

  const exportPDF = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleDateString('es-PE');

    doc.setFontSize(18);
    doc.setTextColor(0, 119, 182);
    doc.text('Blanco Dental - Reporte General', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generado: ${now}`, 14, 28);

    doc.setFontSize(13);
    doc.setTextColor(30, 30, 30);
    doc.text('Resumen del mes actual', 14, 40);

    const kpis = [
      ['Pacientes totales', String(overview?.totalPatients ?? 0)],
      ['Nuevos este mes', String(overview?.newPatientsMonth ?? 0)],
      ['Citas este mes', String(overview?.appointmentsMonth ?? 0)],
      ['Ingresos este mes', fmt(overview?.revenueMonth ?? 0)],
      ['Tratamientos en curso', String(overview?.pendingTreatments ?? 0)],
    ];

    let y = 50;
    doc.setFontSize(10);
    for (const [label, value] of kpis) {
      doc.setTextColor(80, 80, 80);
      doc.text(label + ':', 14, y);
      doc.setTextColor(30, 30, 30);
      doc.setFont(undefined as any, 'bold');
      doc.text(value, 80, y);
      doc.setFont(undefined as any, 'normal');
      y += 8;
    }

    if (revenue && revenue.length > 0) {
      y += 6;
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text('Ingresos mensuales (últimos 12 meses)', 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('Mes', 14, y);
      doc.text('Total (S/)', 80, y);
      y += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, 196, y);
      y += 4;
      for (const row of revenue) {
        doc.setTextColor(40, 40, 40);
        doc.text(row.label, 14, y);
        doc.text(fmt(row.total), 80, y);
        y += 6;
        if (y > 270) { doc.addPage(); y = 20; }
      }
    }

    if (treatments?.byMethod && treatments.byMethod.length > 0) {
      y += 6;
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text('Ingresos por método de pago', 14, y);
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('Método', 14, y);
      doc.text('Pagos', 80, y);
      doc.text('Total', 120, y);
      y += 5;
      doc.line(14, y, 196, y);
      y += 4;
      for (const m of treatments.byMethod) {
        doc.setTextColor(40, 40, 40);
        doc.text(m.label, 14, y);
        doc.text(String(m.count), 80, y);
        doc.text(fmt(m.total), 120, y);
        y += 6;
      }
    }

    doc.save(`reporte-blanco-dental-${now.replace(/\//g, '-')}.pdf`);
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    // KPIs sheet
    const kpiData = [
      ['Indicador', 'Valor'],
      ['Pacientes totales', overview?.totalPatients ?? 0],
      ['Nuevos este mes', overview?.newPatientsMonth ?? 0],
      ['Citas este mes', overview?.appointmentsMonth ?? 0],
      ['Ingresos este mes (S/)', overview?.revenueMonth ?? 0],
      ['Tratamientos en curso', overview?.pendingTreatments ?? 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), 'Resumen');

    // Revenue sheet
    if (revenue && revenue.length > 0) {
      const revData = [['Mes', 'Total (S/)'], ...revenue.map(r => [r.label, r.total])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(revData), 'Ingresos Mensuales');
    }

    // Patients sheet
    if (patients && patients.length > 0) {
      const patData = [['Mes', 'Nuevos Pacientes'], ...patients.map(p => [p.label, p.count])];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(patData), 'Nuevos Pacientes');
    }

    // Payment methods sheet
    if (treatments?.byMethod && treatments.byMethod.length > 0) {
      const methodData = [
        ['Método', 'Cantidad de Pagos', 'Total (S/)'],
        ...treatments.byMethod.map(m => [m.label, m.count, m.total]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(methodData), 'Métodos de Pago');
    }

    // Treatment status sheet
    if (treatments?.byStatus && treatments.byStatus.length > 0) {
      const statusData = [
        ['Estado', 'Cantidad'],
        ...treatments.byStatus.map(s => [s.label, s.value]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusData), 'Estado Tratamientos');
    }

    const now = new Date().toLocaleDateString('es-PE').replace(/\//g, '-');
    XLSX.writeFile(wb, `reporte-blanco-dental-${now}.xlsx`);
  };

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes y estadísticas</h1>
          <p className="text-sm text-gray-500 mt-1">Resumen del mes actual y tendencias de los últimos 12 meses</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <span className="hidden sm:inline">Exportar Excel</span>
            <span className="sm:hidden">Excel</span>
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <span className="hidden sm:inline">Exportar PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
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
            <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `S/${(v/1000).toFixed(0)}k`} />
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
