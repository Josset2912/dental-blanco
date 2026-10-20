import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getOverview, getRevenue, getPatientsReport, getTreatments, getMonthlyBalance } from '../api/reports';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const BRAND = '#00AEEF';
const BRAND_DARK = '#0077B6';
const PIE_COLORS = [BRAND, '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const METHOD_COLORS: Record<string, string> = {
  Efectivo: '#10b981',
  Tarjeta: BRAND,
  Transferencia: '#8b5cf6',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n);

const KPI_DEFS = [
  {
    key: 'totalPatients',
    label: 'Pacientes totales',
    color: 'from-[#00AEEF] to-[#0077B6]',
    iconPath: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z',
  },
  {
    key: 'newPatientsMonth',
    label: 'Nuevos este mes',
    color: 'from-violet-500 to-violet-600',
    iconPath: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  },
  {
    key: 'appointmentsMonth',
    label: 'Citas este mes',
    color: 'from-amber-400 to-amber-500',
    iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
  {
    key: 'revenueMonth',
    label: 'Ingresos este mes',
    color: 'from-emerald-500 to-emerald-600',
    iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    isMoney: true,
  },
  {
    key: 'pendingTreatments',
    label: 'Tratamientos en curso',
    color: 'from-rose-400 to-rose-500',
    iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
  },
];

function EmptyChart({ height = 220 }: { height?: number }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3`} style={{ height }}>
      <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
      </div>
      <p className="text-xs text-gray-400 font-medium">Sin datos suficientes</p>
    </div>
  );
}

function ChartCard({ title, children, loading }: { title: string; children: React.ReactNode; loading?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 min-w-0 overflow-hidden">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-1.5 h-4 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${BRAND}, ${BRAND_DARK})` }} />
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      </div>
      {loading ? (
        <div className="animate-pulse rounded-lg bg-gray-100" style={{ height: 220 }} />
      ) : children}
    </div>
  );
}

const METHOD_BADGE: Record<string, string> = {
  CASH: 'bg-emerald-50 text-emerald-700',
  CARD: 'bg-[#E6F7FD] text-[#0077B6]',
  TRANSFER: 'bg-violet-50 text-violet-700',
};
const METHOD_LABEL_MAP: Record<string, string> = {
  CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia',
};

export default function Reports() {
  const now = new Date();
  const [balanceYear,  setBalanceYear]  = useState(now.getFullYear());
  const [balanceMonth, setBalanceMonth] = useState(now.getMonth() + 1);

  const { data: overview,   isLoading: loadingOverview   } = useQuery({ queryKey: ['reports-overview'],   queryFn: getOverview });
  const { data: revenue,    isLoading: loadingRevenue    } = useQuery({ queryKey: ['reports-revenue'],    queryFn: getRevenue });
  const { data: patients,   isLoading: loadingPatients   } = useQuery({ queryKey: ['reports-patients'],   queryFn: getPatientsReport });
  const { data: treatments, isLoading: loadingTreatments } = useQuery({ queryKey: ['reports-treatments'], queryFn: getTreatments });
  const { data: balance,    isLoading: loadingBalance    } = useQuery({
    queryKey: ['reports-balance', balanceYear, balanceMonth],
    queryFn:  () => getMonthlyBalance(balanceYear, balanceMonth),
  });

  const generatedAt = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const generatedCapitalized = generatedAt.charAt(0).toUpperCase() + generatedAt.slice(1);

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
    const kpiData = [
      ['Indicador', 'Valor'],
      ['Pacientes totales', overview?.totalPatients ?? 0],
      ['Nuevos este mes', overview?.newPatientsMonth ?? 0],
      ['Citas este mes', overview?.appointmentsMonth ?? 0],
      ['Ingresos este mes (S/)', overview?.revenueMonth ?? 0],
      ['Tratamientos en curso', overview?.pendingTreatments ?? 0],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kpiData), 'Resumen');
    if (revenue?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Mes', 'Total (S/)'], ...revenue.map(r => [r.label, r.total])]), 'Ingresos Mensuales');
    }
    if (patients?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Mes', 'Nuevos Pacientes'], ...patients.map(p => [p.label, p.count])]), 'Nuevos Pacientes');
    }
    if (treatments?.byMethod?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Método', 'Cantidad', 'Total (S/)'], ...treatments.byMethod.map(m => [m.label, m.count, m.total])]), 'Métodos de Pago');
    }
    if (treatments?.byStatus?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Estado', 'Cantidad'], ...treatments.byStatus.map(s => [s.label, s.value])]), 'Estado Tratamientos');
    }
    XLSX.writeFile(wb, `reporte-blanco-dental-${new Date().toLocaleDateString('es-PE').replace(/\//g, '-')}.xlsx`);
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reportes y estadísticas</h1>
          <p className="text-sm text-gray-400 mt-0.5">{generatedCapitalized}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={exportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            </svg>
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button onClick={exportPDF}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {loadingOverview
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 animate-pulse">
                <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))
          : KPI_DEFS.map(kpi => {
              const raw = overview?.[kpi.key as keyof typeof overview] ?? 0;
              const value = kpi.isMoney ? fmt(Number(raw)) : raw;
              return (
                <div key={kpi.key} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shrink-0`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={kpi.iconPath}/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900 leading-tight truncate">{value}</p>
                    <p className="text-xs text-gray-500 truncate">{kpi.label}</p>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Revenue bar chart */}
      <ChartCard title="Ingresos mensuales (últimos 12 meses)" loading={loadingRevenue}>
        {revenue?.length ? (
          <div className="overflow-x-auto">
          <div style={{ minWidth: 320 }}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenue} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={v => `S/${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={42} />
              <Tooltip
                formatter={(v) => [fmt(Number(v)), 'Ingresos']}
                contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / .1)' }}
                cursor={{ fill: '#f0f9ff' }}
              />
              <Bar dataKey="total" fill={BRAND} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
          </div>
        ) : <EmptyChart height={240} />}
      </ChartCard>

      {/* Patients trend + Treatment status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Patients line chart */}
        <ChartCard title="Nuevos pacientes (últimos 12 meses)" loading={loadingPatients}>
          {patients?.length ? (
            <div className="overflow-x-auto">
            <div style={{ minWidth: 280 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={patients} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} axisLine={false} tickLine={false} width={28} />
                <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / .1)' }} />
                <Line
                  type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5}
                  dot={{ fill: '#10b981', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                  name="Pacientes"
                />
              </LineChart>
            </ResponsiveContainer>
            </div>
            </div>
          ) : <EmptyChart />}
        </ChartCard>

        {/* Treatment status — donut con leyenda lateral */}
        <ChartCard title="Tratamientos por estado" loading={loadingTreatments}>
          {treatments?.byStatus?.length ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="55%" height={220}>
                <PieChart>
                  <Pie
                    data={treatments.byStatus}
                    dataKey="value"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {treatments.byStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-3 min-w-0">
                {treatments.byStatus.map((s, i) => {
                  const total = treatments.byStatus.reduce((acc, x) => acc + x.value, 0);
                  const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                  return (
                    <div key={s.label} className="min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-xs text-gray-600 truncate">{s.label}</span>
                        </div>
                        <span className="text-xs font-semibold text-gray-800 ml-2 shrink-0">{s.value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <EmptyChart />}
        </ChartCard>
      </div>

      {/* ── Balance mensual detallado ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        {/* Header con selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-4 rounded-full shrink-0" style={{ background: `linear-gradient(to bottom, ${BRAND}, ${BRAND_DARK})` }} />
            <h2 className="text-sm font-semibold text-gray-800">Balance mensual detallado</h2>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={balanceMonth}
              onChange={e => setBalanceMonth(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
            >
              {['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
                .map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={balanceYear}
              onChange={e => setBalanceYear(Number(e.target.value))}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
            >
              {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingBalance ? (
          <div className="animate-pulse space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
            </div>
            <div className="h-48 bg-gray-100 rounded-xl mt-4" />
          </div>
        ) : (
          <>
            {/* KPI cards del mes */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                {
                  label: 'Total ingresado',
                  value: fmt(balance?.total ?? 0),
                  sub: balance?.growth != null
                    ? `${balance.growth >= 0 ? '+' : ''}${balance.growth.toFixed(1)}% vs mes anterior`
                    : 'Sin datos anteriores',
                  subColor: balance?.growth != null ? (balance.growth >= 0 ? 'text-emerald-500' : 'text-red-400') : 'text-gray-400',
                  color: 'from-emerald-500 to-emerald-600',
                  iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
                },
                {
                  label: 'Pagos realizados',
                  value: balance?.count ?? 0,
                  sub: 'transacciones',
                  subColor: 'text-gray-400',
                  color: 'from-[#00AEEF] to-[#0077B6]',
                  iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                },
                {
                  label: 'Promedio por pago',
                  value: fmt(balance?.average ?? 0),
                  sub: 'por transacción',
                  subColor: 'text-gray-400',
                  color: 'from-violet-500 to-violet-600',
                  iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                },
                {
                  label: 'Mes anterior',
                  value: fmt(balance?.prevTotal ?? 0),
                  sub: 'para comparación',
                  subColor: 'text-gray-400',
                  color: 'from-amber-400 to-amber-500',
                  iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                },
              ].map(c => (
                <div key={c.label} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0`}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={c.iconPath}/>
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900 leading-tight truncate">{c.value}</p>
                    <p className="text-xs text-gray-500 truncate">{c.label}</p>
                    <p className={`text-[10px] truncate ${c.subColor}`}>{c.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desglose por método */}
            {balance?.byMethod && balance.byMethod.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {balance.byMethod.map(m => (
                  <div key={m.method} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${METHOD_BADGE[m.method] ?? 'bg-gray-100 text-gray-600'}`}>
                    <span>{m.label}</span>
                    <span className="opacity-60">·</span>
                    <span>{m.count} pagos</span>
                    <span className="opacity-60">·</span>
                    <span className="font-bold">{fmt(m.total)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tabla de pagos */}
            {!balance?.payments?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600">Sin pagos en este mes</p>
                <p className="text-xs text-gray-400 mt-0.5">Selecciona otro mes o registra pagos</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Paciente</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Método</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.payments.map((p, i) => (
                      <tr key={p.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors ${i % 2 === 1 ? 'bg-gray-50/30' : ''}`}>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                          <span className="block text-gray-400">
                            {new Date(p.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{p.patient.name} {p.patient.lastName}</p>
                          {p.treatment && <p className="text-xs text-gray-400 truncate max-w-[140px]">{p.treatment.name}</p>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.concept}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${METHOD_BADGE[p.method] ?? 'bg-gray-100 text-gray-600'}`}>
                            {METHOD_LABEL_MAP[p.method] ?? p.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{fmt(p.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-gray-50">
                      <td colSpan={4} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Total del mes
                      </td>
                      <td className="px-4 py-3 text-right text-base font-bold" style={{ color: BRAND_DARK }}>
                        {fmt(balance.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment methods — donut + tabla */}
      <ChartCard title="Ingresos por método de pago" loading={loadingTreatments}>
        {treatments?.byMethod?.length ? (
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            {/* Donut */}
            <div className="w-full lg:w-64 shrink-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={treatments.byMethod}
                    dataKey="total"
                    nameKey="label"
                    cx="50%" cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {treatments.byMethod.map((m) => (
                      <Cell key={m.label} fill={METHOD_COLORS[m.label] ?? '#6b7280'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: unknown) => [fmt(Number(v)), 'Total']}
                    contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e5e7eb' }}
                  />
                  <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Tabla detalle */}
            <div className="flex-1 w-full overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-semibold text-gray-500 pb-2.5 uppercase tracking-wide">Método</th>
                    <th className="text-right text-xs font-semibold text-gray-500 pb-2.5 uppercase tracking-wide">Pagos</th>
                    <th className="text-right text-xs font-semibold text-gray-500 pb-2.5 uppercase tracking-wide">Total</th>
                    <th className="text-right text-xs font-semibold text-gray-500 pb-2.5 uppercase tracking-wide">%</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const grandTotal = treatments.byMethod.reduce((s, m) => s + m.total, 0);
                    return treatments.byMethod.map(m => (
                      <tr key={m.label} className="border-b border-gray-50 last:border-0">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: METHOD_COLORS[m.label] ?? '#6b7280' }} />
                            <span className="font-medium text-gray-800">{m.label}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right text-gray-600">{m.count}</td>
                        <td className="py-3 text-right font-semibold text-gray-900">{fmt(m.total)}</td>
                        <td className="py-3 text-right text-gray-400 text-xs">
                          {grandTotal > 0 ? `${Math.round((m.total / grandTotal) * 100)}%` : '—'}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td className="pt-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                    <td className="pt-2.5 text-right text-sm font-semibold text-gray-700">
                      {treatments.byMethod.reduce((s, m) => s + m.count, 0)}
                    </td>
                    <td className="pt-2.5 text-right text-sm font-bold text-gray-900">
                      {fmt(treatments.byMethod.reduce((s, m) => s + m.total, 0))}
                    </td>
                    <td className="pt-2.5 text-right text-xs text-gray-400">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : <EmptyChart height={200} />}
      </ChartCard>

    </div>
  );
}
