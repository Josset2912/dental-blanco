import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTreatments, createTreatment, updateTreatment, cancelTreatment } from '../api/treatments';
import type { Treatment } from '../api/treatments';
import TreatmentForm from '../components/TreatmentForm';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Anulado',
};
const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-[#E6F7FD] text-[#0077B6]',
  COMPLETED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-red-50 text-red-400',
};

const FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'En curso', value: 'IN_PROGRESS' },
  { label: 'Completados', value: 'COMPLETED' },
  { label: 'Anulados', value: 'CANCELLED' },
];

function formatCost(cost: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(cost));
}

function daysBetween(start: string, end?: string) {
  const a = new Date(start).getTime();
  const b = end ? new Date(end).getTime() : Date.now();
  return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
}

type SortKey = 'patient' | 'cost' | 'startDate';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 ${active ? 'text-[#00AEEF]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
      {dir === 'asc' || !active ? <path d="M7 14l5-5 5 5H7z"/> : <path d="M7 10l5 5 5-5H7z"/>}
    </svg>
  );
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
        title="Ver notas"
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

export default function Treatments() {
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Treatment | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<Treatment | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('startDate');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const qc = useQueryClient();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const { data: treatments = [], isLoading } = useQuery({
    queryKey: ['treatments', statusFilter],
    queryFn: () => getTreatments(statusFilter ? { status: statusFilter } : {}),
  });

  const createMut = useMutation({
    mutationFn: createTreatment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments'] }); setShowForm(false); toast.success('Tratamiento creado correctamente'); },
    onError: () => toast.error('Error al guardar el tratamiento'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTreatment>[1] }) => updateTreatment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments'] }); setEditItem(null); toast.success('Tratamiento actualizado'); },
    onError: () => toast.error('Error al actualizar el tratamiento'),
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => updateTreatment(id, { status: 'COMPLETED', endDate: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments'] }); toast.success('Tratamiento completado'); },
    onError: () => toast.error('Error al completar el tratamiento'),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelTreatment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['treatments'] });
      setConfirmCancel(null);
      toast.success('Tratamiento cancelado');
    },
    onError: () => toast.error('Error al cancelar el tratamiento'),
  });

  // Stats
  const inProgress = treatments.filter(t => t.status === 'IN_PROGRESS');
  const completed = treatments.filter(t => t.status === 'COMPLETED');
  const cancelled = treatments.filter(t => t.status === 'CANCELLED');
  const revenueExpected = inProgress.reduce((s, t) => s + parseFloat(t.cost), 0);
  const revenueCompleted = completed.reduce((s, t) => s + parseFloat(t.cost), 0);

  // Filter by search
  const filtered = [...treatments]
    .filter(t => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        `${t.patient.name} ${t.patient.lastName}`.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const va = sortKey === 'cost' ? parseFloat(a.cost) : sortKey === 'patient' ? `${a.patient.name} ${a.patient.lastName}` : a.startDate;
      const vb = sortKey === 'cost' ? parseFloat(b.cost) : sortKey === 'patient' ? `${b.patient.name} ${b.patient.lastName}` : b.startDate;
      if (typeof va === 'number') return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });

  const summaryCards = [
    {
      label: 'En curso',
      value: inProgress.length,
      sub: `S/ ${revenueExpected.toLocaleString('es-PE', { minimumFractionDigits: 0 })} esperado`,
      color: 'from-[#00AEEF] to-[#0077B6]',
      iconPath: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Completados',
      value: completed.length,
      sub: formatCost(String(revenueCompleted)) + ' cobrado',
      color: 'from-emerald-500 to-emerald-600',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Anulados',
      value: cancelled.length,
      sub: `de ${treatments.length} total`,
      color: 'from-red-400 to-red-500',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    {
      label: 'Ingresos completados',
      value: formatCost(String(revenueCompleted)),
      sub: `${completed.length} tratamiento${completed.length !== 1 ? 's' : ''}`,
      color: 'from-violet-500 to-violet-600',
      iconPath: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tratamientos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{inProgress.length} en progreso · {treatments.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-white transition-colors rounded-lg text-sm font-medium" style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
          <PlusIcon /> Nuevo tratamiento
        </button>
      </div>

      {/* Summary cards */}
      {!isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {summaryCards.map(c => (
            <div key={c.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center shrink-0`}>
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={c.iconPath}/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-gray-900 leading-tight truncate">{c.value}</p>
                <p className="text-xs text-gray-500 truncate">{c.label}</p>
                {c.sub && <p className="text-[10px] text-gray-400 truncate">{c.sub}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                statusFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar paciente o tratamiento..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white placeholder-gray-300"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-50 border-b border-gray-100 px-4 flex items-center gap-6">
              {['w-28','w-32','w-16','w-20','w-20','w-24'].map((w, i) => (
                <div key={i} className={`h-3 bg-gray-200 rounded ${w}`} />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-4 border-b border-gray-50 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <div className="w-36 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-full" />
                  <div className="h-2.5 bg-gray-100 rounded w-2/3" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
                <div className="w-16 h-3 bg-gray-100 rounded" />
                <div className="w-20 h-3 bg-gray-100 rounded" />
                <div className="w-16 h-3 bg-gray-100 rounded" />
                <div className="w-20 h-6 bg-gray-100 rounded-full" />
                <div className="w-24 h-7 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {search ? `Sin resultados para "${search}"` : `Sin tratamientos ${statusFilter ? 'con ese estado' : 'registrados'}`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {search ? 'Intenta con otro nombre o tratamiento' : 'Crea el primero con el botón de arriba'}
            </p>
            {search && (
              <button onClick={() => setSearch('')} className="mt-3 text-xs text-[#00AEEF] hover:text-[#0077B6] font-medium">
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards — scrollable container so header/filters quedan fijos */}
            <div className="sm:hidden overflow-y-auto max-h-[calc(100svh-26rem)]">
            <ul className="divide-y divide-gray-100">
              {filtered.map(t => (
                <li key={t.id} className="px-4 py-4 flex flex-col gap-3">
                  {/* Top row: patient + status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{t.patient.name} {t.patient.lastName}</p>
                      <p className="text-xs text-gray-400">{t.patient.phone}</p>
                    </div>
                    <span className={`shrink-0 inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </div>

                  {/* Treatment name + description */}
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800">{t.name}</p>
                      {t.description && <p className="text-xs text-gray-400 mt-0.5">{t.description}</p>}
                    </div>
                    {t.notes && <NotesTooltip notes={t.notes} />}
                  </div>

                  {/* Cost + dates row */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="font-bold text-gray-900 text-sm">{formatCost(t.cost)}</span>
                    <span>
                      {new Date(t.startDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span>
                      {t.status === 'COMPLETED' && t.endDate ? (
                        <span className="text-green-600 font-medium">{daysBetween(t.startDate, t.endDate)} días</span>
                      ) : t.status === 'IN_PROGRESS' ? (
                        <span className="text-[#0077B6]">{daysBetween(t.startDate)} días</span>
                      ) : '—'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setEditItem(t)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      Editar
                    </button>
                    {t.status === 'IN_PROGRESS' && (
                      <>
                        <button onClick={() => completeMut.mutate(t.id)} disabled={completeMut.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 disabled:opacity-60 transition-colors">
                          Completar
                        </button>
                        <button onClick={() => setConfirmCancel(t)}
                          className="px-3 py-1.5 text-xs font-medium text-red-400 border border-red-100 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors">
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => handleSort('patient')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                        Paciente <SortIcon active={sortKey === 'patient'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Tratamiento</th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => handleSort('cost')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                        Costo <SortIcon active={sortKey === 'cost'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <button onClick={() => handleSort('startDate')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                        Inicio <SortIcon active={sortKey === 'startDate'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Duración</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id} className={`transition-colors hover:bg-[#E6F7FD]/40 border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}>
                      <td className="px-4 py-3.5 text-sm">
                        <p className="font-medium text-gray-900">{t.patient.name} {t.patient.lastName}</p>
                        <p className="text-xs text-gray-400">{t.patient.phone}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-gray-900">{t.name}</p>
                            {t.description && <p className="text-xs text-gray-400 truncate max-w-[160px]">{t.description}</p>}
                          </div>
                          {t.notes && <NotesTooltip notes={t.notes} />}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{formatCost(t.cost)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                        {new Date(t.startDate).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                        {t.status === 'COMPLETED' && t.endDate ? (
                          <span className="text-green-600 font-medium">{daysBetween(t.startDate, t.endDate)} días</span>
                        ) : t.status === 'IN_PROGRESS' ? (
                          <span className="text-[#0077B6]">{daysBetween(t.startDate)} días</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex gap-1.5 flex-wrap">
                          <button onClick={() => setEditItem(t)}
                            className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                            Editar
                          </button>
                          {t.status === 'IN_PROGRESS' && (
                            <>
                              <button onClick={() => completeMut.mutate(t.id)} disabled={completeMut.isPending}
                                className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-60 transition-colors">
                                Completar
                              </button>
                              <button onClick={() => setConfirmCancel(t)}
                                className="px-2.5 py-1 text-xs font-medium text-red-400 border border-red-100 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors">
                                Cancelar
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <TreatmentForm
          onClose={() => setShowForm(false)}
          onSubmit={data => createMut.mutate(data)}
          loading={createMut.isPending}
        />
      )}

      {editItem && (
        <TreatmentForm
          onClose={() => setEditItem(null)}
          onSubmit={data => updateMut.mutate({ id: editItem.id, data })}
          loading={updateMut.isPending}
          initial={editItem}
          fixedPatientId={editItem.patientId}
        />
      )}

      {/* Cancel confirmation modal */}
      {confirmCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setConfirmCancel(null); }}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-6 pt-6 pb-4">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">Cancelar tratamiento</h3>
              <p className="text-sm text-gray-500 mb-1">
                ¿Estás seguro de cancelar el tratamiento de{' '}
                <span className="font-semibold text-gray-700">{confirmCancel.patient.name} {confirmCancel.patient.lastName}</span>?
              </p>
              <p className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mt-3">
                <span className="font-medium text-gray-600">{confirmCancel.name}</span> · {formatCost(confirmCancel.cost)}
              </p>
            </div>
            <div className="flex gap-2 px-6 pb-6">
              <button onClick={() => setConfirmCancel(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                No cancelar
              </button>
              <button onClick={() => cancelMut.mutate(confirmCancel.id)} disabled={cancelMut.isPending}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                {cancelMut.isPending ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
