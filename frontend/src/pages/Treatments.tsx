import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getTreatments, createTreatment, updateTreatment } from '../api/treatments';
import type { Treatment } from '../api/treatments';
import TreatmentForm from '../components/TreatmentForm';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};
const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-[#E6F7FD] text-[#0077B6]',
  COMPLETED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const FILTERS = [
  { label: 'Todos', value: '' },
  { label: 'En progreso', value: 'IN_PROGRESS' },
  { label: 'Completados', value: 'COMPLETED' },
  { label: 'Cancelados', value: 'CANCELLED' },
];

function formatCost(cost: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(cost));
}

type SortKey = 'patient' | 'cost' | 'startDate';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 ${active ? 'text-[#00AEEF]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
      {dir === 'asc' || !active ? <path d="M7 14l5-5 5 5H7z"/> : <path d="M7 10l5 5 5-5H7z"/>}
    </svg>
  );
}

export default function Treatments() {
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Treatment | null>(null);
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
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateTreatment>[1] }) =>
      updateTreatment(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments'] }); setEditItem(null); toast.success('Tratamiento actualizado'); },
    onError: () => toast.error('Error al actualizar el tratamiento'),
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => updateTreatment(id, { status: 'COMPLETED', endDate: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments'] }); toast.success('Tratamiento completado'); },
    onError: () => toast.error('Error al completar el tratamiento'),
  });

  const inProgress = treatments.filter(t => t.status === 'IN_PROGRESS').length;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Tratamientos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{inProgress} en progreso · {treatments.length} total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-white transition-colors rounded-lg text-sm font-medium" style={{ background: "linear-gradient(135deg,#00AEEF,#0077B6)" }}>
          <PlusIcon /> Nuevo tratamiento
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              statusFilter === f.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Cargando tratamientos...</div>
        ) : treatments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
            <p className="text-sm text-gray-500 font-medium">Sin tratamientos {statusFilter ? 'con ese filtro' : 'registrados'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[...treatments].sort((a, b) => {
                  const va = sortKey === 'cost' ? parseFloat(a.cost) : sortKey === 'patient' ? `${a.patient.name} ${a.patient.lastName}` : a.startDate;
                  const vb = sortKey === 'cost' ? parseFloat(b.cost) : sortKey === 'patient' ? `${b.patient.name} ${b.patient.lastName}` : b.startDate;
                  if (typeof va === 'number') return sortDir === 'asc' ? va - (vb as number) : (vb as number) - va;
                  return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
                }).map((t, i) => (
                  <tr key={t.id} className={`transition-colors hover:bg-[#E6F7FD]/40 border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}>
                    <td className="px-4 py-3.5 text-sm">
                      <p className="font-medium text-gray-900">{t.patient.name} {t.patient.lastName}</p>
                      <p className="text-xs text-gray-500">{t.patient.phone}</p>
                    </td>
                    <td className="px-4 py-3.5 text-sm">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      {t.description && <p className="text-xs text-gray-500 truncate max-w-[200px]">{t.description}</p>}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">{formatCost(t.cost)}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-600">
                      {new Date(t.startDate).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setEditItem(t)}
                          className="px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
                          Editar
                        </button>
                        {t.status === 'IN_PROGRESS' && (
                          <button onClick={() => completeMut.mutate(t.id)} disabled={completeMut.isPending}
                            className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-60">
                            Completar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </>
  );
}
