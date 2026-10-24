import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DateField, DateInput, DateSegment } from 'react-aria-components';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';
import type { DateValue } from '@internationalized/date';
import { getPaymentsPaged, getPaymentSummary, createPayment, deletePayment } from '../api/payments';
import type { Payment } from '../api/payments';
import PaymentForm from '../components/PaymentForm';
import Pagination from '../components/Pagination';

const LIMIT = 20;

type SortKey = 'createdAt' | 'amount' | 'patient';
type MethodFilter = '' | 'CASH' | 'CARD' | 'TRANSFER';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 ${active ? 'text-[#00AEEF]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
      {dir === 'asc' || !active ? <path d="M7 14l5-5 5 5H7z"/> : <path d="M7 10l5 5 5-5H7z"/>}
    </svg>
  );
}

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

const METHOD_LABEL: Record<string, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  CARD: 'bg-[#00AEEF]/[0.09] text-[#005F8E]',
  TRANSFER: 'bg-purple-50 text-purple-700',
};
const METHOD_BORDER: Record<string, string> = {
  CASH: 'border-l-green-400',
  CARD: 'border-l-[#00AEEF]',
  TRANSFER: 'border-l-purple-400',
};
const METHOD_FILTERS = [
  { label: 'Todos', value: '' as MethodFilter },
  { label: 'Efectivo', value: 'CASH' as MethodFilter },
  { label: 'Tarjeta', value: 'CARD' as MethodFilter },
  { label: 'Transferencia', value: 'TRANSFER' as MethodFilter },
];

function fmt(amount: number | string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(amount));
}

function NotesTooltip({ notes }: { notes: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-6 h-6 rounded-full bg-amber-50 text-amber-500 hover:bg-amber-100 flex items-center justify-center transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </button>
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg pointer-events-none">
          {notes}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}

export default function Payments() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Payment | null>(null);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('');
  const [showDateFilters, setShowDateFilters] = useState(false);
  const qc = useQueryClient();

  const hasFilters = !!(dateFrom || dateTo || search || methodFilter);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const clearFilters = () => {
    setDateFrom(''); setDateTo(''); setSearch(''); setMethodFilter(''); setPage(1);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payments', page, dateFrom, dateTo],
    queryFn: () => getPaymentsPaged(page, undefined, LIMIT, dateFrom || undefined, dateTo || undefined),
  });

  const allPayments: Payment[] = data?.data ?? [];
  const total = data?.total ?? 0;
  const { data: summary } = useQuery({ queryKey: ['payments-summary'], queryFn: getPaymentSummary });

  // Client-side search + method filter on current page
  const payments = allPayments
    .filter(p => {
      if (methodFilter && p.method !== methodFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        `${p.patient.name} ${p.patient.lastName}`.toLowerCase().includes(q) ||
        p.concept.toLowerCase().includes(q) ||
        (p.treatment?.name ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const va = sortKey === 'amount' ? Number(a.amount) : sortKey === 'patient' ? `${a.patient.name} ${a.patient.lastName}` : a.createdAt;
      const vb = sortKey === 'amount' ? Number(b.amount) : sortKey === 'patient' ? `${b.patient.name} ${b.patient.lastName}` : b.createdAt;
      if (typeof va === 'number') return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const createMut = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payments-summary'] });
      setShowForm(false);
      toast.success('Pago registrado correctamente');
    },
    onError: () => toast.error('Error al registrar el pago'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePayment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payments-summary'] });
      setConfirmDelete(null);
      toast.success('Pago eliminado');
    },
    onError: () => toast.error('Error al eliminar el pago'),
  });

  const summaryCards = summary ? [
    {
      label: 'Ingresos este mes',
      value: fmt(summary.monthRevenue),
      accent: '#10B981',
      iconPath: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    },
    {
      label: 'Ingresos totales',
      value: fmt(summary.totalRevenue),
      accent: '#00AEEF',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Pagos este mes',
      value: String(summary.countMonth),
      accent: '#8B5CF6',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    },
    {
      label: 'Pagos totales',
      value: String(summary.countTotal),
      accent: '#6B7280',
      iconPath: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    },
  ] : [];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full shrink-0" style={{ background: '#00AEEF' }} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pagos</h2>
            <p className="text-sm text-gray-500 mt-0.5">{total} registro{total !== 1 ? 's' : ''} en total</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-white rounded-xl text-sm font-semibold hover:brightness-110 transition-all" style={{ background: '#00AEEF' }}>
          <PlusIcon /> Registrar pago
        </button>
      </div>

      {/* Summary cards */}
      {summaryCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {summaryCards.map(c => (
            <div key={c.label} className="relative bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-4" style={{ background: `${c.accent}18` }}>
                  <svg className="w-[17px] h-[17px]" style={{ color: c.accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={c.iconPath}/>
                  </svg>
                </div>
                <p className="text-[26px] font-black text-gray-900 leading-none tabular-nums tracking-tight">{c.value}</p>
                <p className="text-[11px] text-gray-400 mt-2 font-semibold uppercase tracking-wide leading-tight">{c.label}</p>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: c.accent }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      {/* Fila 1: búsqueda + botón fechas (mobile) / completo (desktop) */}
      <div className="flex gap-2 mb-2">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar paciente o concepto..."
            className="w-full pl-9 pr-4 py-2.5 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white placeholder-gray-400 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </div>

        {/* Botón de fechas — solo mobile */}
        <button
          onClick={() => setShowDateFilters(v => !v)}
          className={`sm:hidden flex items-center gap-1.5 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
            (dateFrom || dateTo)
              ? 'bg-[#00AEEF]/[0.09] border-[#00AEEF] text-[#005F8E]'
              : 'bg-white border-black/[0.08] text-gray-500 hover:border-gray-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          {(dateFrom || dateTo) ? 'Fechas ●' : 'Fechas'}
        </button>
      </div>

      {/* Fila 2: método chips */}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {METHOD_FILTERS.map(f => (
          <button key={f.value} onClick={() => { setMethodFilter(f.value); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all ${
              methodFilter === f.value
                ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-sm'
                : 'bg-white border-black/[0.08] text-gray-500 hover:border-[#00AEEF] hover:text-[#00AEEF]'
            }`}>
            {f.label}
          </button>
        ))}
        {hasFilters && (
          <button onClick={clearFilters}
            className="ml-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-dashed border-gray-300 text-gray-400 hover:text-gray-600 hover:border-gray-400 whitespace-nowrap transition-all flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            Limpiar
          </button>
        )}
      </div>

      {/* Fechas — siempre visible en sm+; colapsable en mobile */}
      <div className={`sm:flex gap-3 mb-4 items-center flex-wrap ${showDateFilters ? 'flex' : 'hidden sm:flex'}`}>
        <DateField
          value={dateFrom ? parseDate(dateFrom) : null}
          onChange={(d: DateValue | null) => { setDateFrom(d?.toString() ?? ''); setPage(1); }}
          maxValue={dateTo ? parseDate(dateTo) : today(getLocalTimeZone())}
          className="flex items-center gap-2 bg-[#F6F8FA] border border-black/[0.08] rounded-lg px-3 py-2 outline-none focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#00AEEF]/10 focus-within:bg-white transition-all"
        >
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span className="text-xs text-gray-400 shrink-0">Desde</span>
          <DateInput className="flex items-center gap-0.5">
            {seg => (
              <DateSegment segment={seg}
                className="px-px rounded tabular-nums text-sm text-gray-700 outline-none focus:bg-[#00AEEF] focus:text-white data-[placeholder]:text-gray-300 data-[type=literal]:text-gray-300 data-[type=literal]:select-none" />
            )}
          </DateInput>
          {dateFrom && (
            <button type="button" onClick={() => { setDateFrom(''); setPage(1); }}
              className="ml-1 text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </DateField>

        <DateField
          value={dateTo ? parseDate(dateTo) : null}
          onChange={(d: DateValue | null) => { setDateTo(d?.toString() ?? ''); setPage(1); }}
          minValue={dateFrom ? parseDate(dateFrom) : undefined}
          maxValue={today(getLocalTimeZone())}
          className="flex items-center gap-2 bg-[#F6F8FA] border border-black/[0.08] rounded-lg px-3 py-2 outline-none focus-within:border-[#00AEEF] focus-within:ring-2 focus-within:ring-[#00AEEF]/10 focus-within:bg-white transition-all"
        >
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span className="text-xs text-gray-400 shrink-0">Hasta</span>
          <DateInput className="flex items-center gap-0.5">
            {seg => (
              <DateSegment segment={seg}
                className="px-px rounded tabular-nums text-sm text-gray-700 outline-none focus:bg-[#00AEEF] focus:text-white data-[placeholder]:text-gray-300 data-[type=literal]:text-gray-300 data-[type=literal]:select-none" />
            )}
          </DateInput>
          {dateTo && (
            <button type="button" onClick={() => { setDateTo(''); setPage(1); }}
              className="ml-1 text-gray-300 hover:text-gray-500 transition-colors shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          )}
        </DateField>
      </div>

      {/* ── Estado vacío ────────────────────────────────────────────────── */}
      {!isLoading && payments.length === 0 && (
        <div className="bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-700">
            {hasFilters ? 'Sin resultados con estos filtros' : 'Sin pagos registrados'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {hasFilters ? 'Prueba cambiando el método, la búsqueda o el rango de fechas' : 'Los pagos registrados aparecerán aquí'}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="mt-3 text-xs text-[#00AEEF] hover:text-[#005F8E] font-medium transition-colors">
              Limpiar todos los filtros
            </button>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white rounded-xl"
              style={{ background: '#10B981' }}
            >
              Registrar primer pago
            </button>
          )}
        </div>
      )}

      {/* ── MOBILE: skeleton ─────────────────────────────────────────── */}
      {isLoading && (
        <div className="sm:hidden bg-white shadow-card rounded-xl overflow-hidden">
          <ul className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="px-4 py-4 space-y-2.5">
                <div className="flex justify-between">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-3.5 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="flex gap-2 items-center">
                  <div className="h-5 bg-gray-100 rounded-full w-16" />
                  <div className="h-3 bg-gray-100 rounded w-24" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── MOBILE: tarjetas ──────────────────────────────────────────── */}
      {!isLoading && payments.length > 0 && (
        <div className="sm:hidden bg-white shadow-card rounded-xl overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {payments.map((p: Payment) => (
              <li key={p.id} className={`px-4 py-4 border-l-[3px] ${METHOD_BORDER[p.method] ?? 'border-l-gray-200'}`}>
                {/* Fila 1: paciente + monto */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <button
                    onClick={() => navigate(`/pacientes/${p.patient.id}`)}
                    className="text-sm font-bold text-gray-900 hover:text-[#005F8E] transition-colors text-left leading-tight"
                  >
                    {p.patient.name} {p.patient.lastName}
                  </button>
                  <span className="text-base font-bold text-emerald-600 shrink-0">{fmt(p.amount)}</span>
                </div>

                {/* Fila 2: concepto + notas */}
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-sm text-gray-700">{p.concept}</span>
                  {p.notes && <NotesTooltip notes={p.notes} />}
                </div>

                {/* Fila 3: método + tratamiento */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                    {METHOD_LABEL[p.method]}
                  </span>
                  {p.treatment?.name && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                      {p.treatment.name}
                    </span>
                  )}
                </div>

                {/* Fila 4: fecha + eliminar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <button
                    onClick={() => setConfirmDelete(p)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Eliminar pago"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── DESKTOP: tabla ────────────────────────────────────────────── */}
      <div className={`hidden sm:block bg-white shadow-card rounded-xl overflow-hidden ${isLoading || payments.length === 0 ? 'sm:hidden' : ''}`}>
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-50 border-b border-gray-100 px-4 flex items-center gap-4">
              {['w-16','w-28','w-24','w-20','w-16','w-16'].map((w, i) => (
                <div key={i} className={`h-3 bg-gray-200 rounded ${w}`} />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <div className="w-16 h-3 bg-gray-100 rounded shrink-0" />
                <div className="w-32 h-3.5 bg-gray-200 rounded" />
                <div className="flex-1 h-3 bg-gray-100 rounded" />
                <div className="w-20 h-3 bg-gray-100 rounded" />
                <div className="w-16 h-6 bg-gray-100 rounded-full" />
                <div className="w-16 h-3.5 bg-gray-200 rounded" />
                <div className="w-14 h-7 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                      Fecha <SortIcon active={sortKey === 'createdAt'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('patient')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                      Paciente <SortIcon active={sortKey === 'patient'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Concepto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tratamiento</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Método</th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('amount')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                      Monto <SortIcon active={sortKey === 'amount'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p: Payment, i) => (
                  <tr key={p.id} className={`transition-colors hover:bg-[#F6F8FA] border-b border-black/[0.04] last:border-0 ${i % 2 === 1 ? 'bg-gray-50/30' : 'bg-white'}`}>
                    <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => navigate(`/pacientes/${p.patient.id}`)}
                        className="text-sm font-semibold text-gray-900 hover:text-[#005F8E] transition-colors text-left">
                        {p.patient.name} {p.patient.lastName}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">{p.concept}</span>
                        {p.notes && <NotesTooltip notes={p.notes} />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-400">{p.treatment?.name ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                        {METHOD_LABEL[p.method]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => setConfirmDelete(p)}
                        className="px-2.5 py-1 text-xs font-medium text-red-400 border border-red-100 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} total={total} limit={LIMIT} onChange={setPage} />

      {showForm && (
        <PaymentForm
          onClose={() => setShowForm(false)}
          onSubmit={data => createMut.mutate(data)}
          loading={createMut.isPending}
        />
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-6 pb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Eliminar pago</h3>
              <p className="text-sm text-gray-500 mb-3">
                ¿Estás seguro de eliminar este registro de{' '}
                <span className="font-semibold text-gray-700">{confirmDelete.patient.name} {confirmDelete.patient.lastName}</span>?
              </p>
              <div className="bg-gray-50 rounded-lg px-4 py-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Concepto</span>
                  <span className="font-medium text-gray-700">{confirmDelete.concept}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Método</span>
                  <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${METHOD_COLORS[confirmDelete.method]}`}>
                    {METHOD_LABEL[confirmDelete.method]}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Monto</span>
                  <span className="font-bold text-gray-900">{fmt(confirmDelete.amount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Fecha</span>
                  <span className="text-gray-700">
                    {new Date(confirmDelete.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={() => deleteMut.mutate(confirmDelete.id)} disabled={deleteMut.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                {deleteMut.isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
