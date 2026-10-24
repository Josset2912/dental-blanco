import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPatientsPaged, createPatient, updatePatient, getPatientStats } from '../api/patients';
import type { Patient } from '../api/patients';
import PatientForm from '../components/PatientForm';
import Pagination from '../components/Pagination';

// ── Icons ────────────────────────────────────────────────────────────────────

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);
const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
  </svg>
);
const PhoneIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"/>
  </svg>
);
const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
  </svg>
);
const ArrowIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
  </svg>
);
const CalendarIcon = () => (
  <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
  </svg>
);

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

function isNew(createdAt: string) {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 30;
}

// ── Gender config ─────────────────────────────────────────────────────────────

const GENDER_CONFIG = {
  MASCULINO: {
    badge: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#EEF6FF] text-[#005F8E]',
    palette: { bg: '#EEF6FF', text: '#005F8E' },
    label: 'Masculino',
  },
  FEMENINO: {
    badge: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FDF4FF] text-[#9333EA]',
    palette: { bg: '#FDF4FF', text: '#9333EA' },
    label: 'Femenino',
  },
  OTRO: {
    badge: 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600',
    palette: { bg: '#F3F4F6', text: '#6B7280' },
    label: 'Otro',
  },
};

function PatientInitial({ name, gender }: { name: string; gender: Patient['gender'] }) {
  const letter = name.trim().charAt(0).toUpperCase();
  const { bg, text } = GENDER_CONFIG[gender]?.palette ?? { bg: '#EEF6FF', text: '#005F8E' };
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
      style={{ background: bg, color: text }}
    >
      {letter}
    </div>
  );
}

// ── Sort ──────────────────────────────────────────────────────────────────────

type SortKey = 'name' | 'createdAt' | 'birthDate';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 transition-colors ${active ? 'text-[#00AEEF]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
      {dir === 'asc' || !active ? <path d="M7 14l5-5 5 5H7z"/> : <path d="M7 10l5 5 5-5H7z"/>}
    </svg>
  );
}

// ── Stats bar ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, iconPath }: {
  label: string; value: string | number; sub?: string; accent: string; iconPath: string;
}) {
  return (
    <div className="relative bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${accent}18` }}
        >
          <svg className="w-[17px] h-[17px]" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.9}>
            <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
          </svg>
        </div>
        <p className="text-[26px] font-black text-gray-900 leading-none tabular-nums tracking-tight">{value}</p>
        <p className="text-[11px] text-gray-400 mt-2 font-semibold uppercase tracking-wide leading-tight">{label}</p>
        {sub && <p className="text-xs font-semibold mt-1.5" style={{ color: accent }}>{sub}</p>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ background: accent }} />
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ search, genderFilter }: { search: string; genderFilter: string }) {
  const hasFilter = search || genderFilter !== 'TODOS';
  return (
    <div className="text-center py-20 px-6">
      <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
        <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
        </svg>
      </div>
      <p className="text-base font-semibold text-gray-700">
        {hasFilter ? 'Sin resultados' : 'Aún no hay pacientes'}
      </p>
      <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
        {hasFilter
          ? 'Prueba cambiando los filtros o el término de búsqueda.'
          : 'Registra el primer paciente con el botón de arriba.'}
      </p>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

const LIMIT = 20;
type GenderFilter = 'TODOS' | 'MASCULINO' | 'FEMENINO' | 'OTRO';

export default function Patients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('TODOS');
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleGender = (g: GenderFilter) => { setGenderFilter(g); setPage(1); };

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => getPatientsPaged(page, search || undefined, LIMIT),
  });

  const { data: stats } = useQuery({
    queryKey: ['patients-stats'],
    queryFn: getPatientStats,
    staleTime: 60_000,
  });

  const allPatients: Patient[] = data?.data ?? [];
  const total = data?.total ?? 0;

  // client-side gender filter + sort (sobre la página actual)
  const patients = [...allPatients]
    .filter(p => genderFilter === 'TODOS' || p.gender === genderFilter)
    .sort((a, b) => {
      const va = sortKey === 'name' ? `${a.name} ${a.lastName}` : sortKey === 'birthDate' ? a.birthDate : a.createdAt;
      const vb = sortKey === 'name' ? `${b.name} ${b.lastName}` : sortKey === 'birthDate' ? b.birthDate : b.createdAt;
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });

  const createMut = useMutation({
    mutationFn: createPatient,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patients-stats'] });
      setShowForm(false);
      toast.success('Paciente creado correctamente');
    },
    onError: () => toast.error('Error al guardar el paciente'),
  });

  const updateMut = useMutation({
    mutationFn: (d: Parameters<typeof updatePatient>[1]) => updatePatient(editPatient!.id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['patients-stats'] });
      setEditPatient(null);
      toast.success('Paciente actualizado correctamente');
    },
    onError: () => toast.error('Error al actualizar el paciente'),
  });

  const genderChips: { key: GenderFilter; label: string }[] = [
    { key: 'TODOS', label: 'Todos' },
    { key: 'MASCULINO', label: 'Masculino' },
    { key: 'FEMENINO', label: 'Femenino' },
    { key: 'OTRO', label: 'Otro' },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-[3px] h-8 rounded-full shrink-0" style={{ background: '#00AEEF' }} />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Pacientes</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {total} paciente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-white rounded-xl text-sm font-semibold sm:w-auto transition-all hover:brightness-110 shadow-sm"
          style={{ background: '#00AEEF' }}
        >
          <PlusIcon /> Nuevo paciente
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <StatCard
          label="Total pacientes"
          value={stats?.total ?? '—'}
          accent="#00AEEF"
          iconPath="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"
        />
        <StatCard
          label="Nuevos este mes"
          value={stats?.newThisMonth ?? '—'}
          sub={stats?.newThisMonth ? `+${stats.newThisMonth} este mes` : undefined}
          accent="#10B981"
          iconPath="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
        />
        <StatCard
          label="Masculino"
          value={stats?.byGender.MASCULINO ?? '—'}
          accent="#005F8E"
          iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
        <StatCard
          label="Femenino"
          value={stats?.byGender.FEMENINO ?? '—'}
          accent="#9333EA"
          iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </div>

      {/* Búsqueda + filtros de género */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <SearchIcon />
          </span>
          <input
            className="w-full pl-9 pr-3 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all placeholder-gray-400"
            placeholder="Buscar por nombre o teléfono..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {genderChips.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleGender(key)}
              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                genderFilter === key
                  ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-[#00AEEF] hover:text-[#00AEEF]'
              }`}
            >
              {label}
              {key !== 'TODOS' && stats
                ? <span className="ml-1 opacity-70">({stats.byGender[key as keyof typeof stats.byGender]})</span>
                : null}
            </button>
          ))}
        </div>
      </div>

      {/* Result counter */}
      {(search.trim() !== '' || genderFilter !== 'TODOS') && !isLoading && (
        <p className="text-xs text-gray-500 mb-3">
          {patients.length} resultado{patients.length !== 1 ? 's' : ''} encontrado{patients.length !== 1 ? 's' : ''}
          {search.trim() ? ` para "${search}"` : ''}
        </p>
      )}

      {/* MOBILE: lista de tarjetas */}
      <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <ul className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : patients.length === 0 ? (
          <EmptyState search={search} genderFilter={genderFilter} />
        ) : (
          <ul>
            {patients.map((p, idx) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${idx < patients.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="cursor-pointer flex items-center gap-3 flex-1 min-w-0" onClick={() => navigate(`/pacientes/${p.id}`)}>
                  <div className="relative">
                    <PatientInitial name={p.name} gender={p.gender} />
                    {isNew(p.createdAt) && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" title="Nuevo este mes" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">{p.name} {p.lastName}</span>
                      <span className={GENDER_CONFIG[p.gender].badge}>{GENDER_CONFIG[p.gender].label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <PhoneIcon />{p.phone}
                      </span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-500">{calcAge(p.birthDate)} años</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                      <CalendarIcon />
                      <span>Desde {new Date(p.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setEditPatient(p); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors shrink-0"
                  title="Editar paciente"
                >
                  <EditIcon />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DESKTOP: tabla */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="animate-pulse">
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 grid grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-3 bg-gray-200 rounded w-3/4" />
              ))}
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={`flex items-center gap-4 px-4 py-4 border-b border-gray-100 ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
                <div className="h-3 bg-gray-200 rounded w-24" />
                <div className="h-5 bg-gray-200 rounded-full w-20" />
                <div className="h-3 bg-gray-200 rounded w-12" />
                <div className="h-3 bg-gray-100 rounded w-20" />
              </div>
            ))}
          </div>
        ) : patients.length === 0 ? (
          <EmptyState search={search} genderFilter={genderFilter} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                      Paciente <SortIcon active={sortKey === 'name'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Género</th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('birthDate')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                      Edad <SortIcon active={sortKey === 'birthDate'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <button onClick={() => handleSort('createdAt')} className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors">
                      Registro <SortIcon active={sortKey === 'createdAt'} dir={sortDir} />
                    </button>
                  </th>
                  <th className="px-4 py-3 w-28" />
                </tr>
              </thead>
              <tbody>
                {patients.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`group transition-colors hover:bg-[#E6F7FD]/50 ${idx % 2 === 1 ? 'bg-gray-50/40' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <PatientInitial name={p.name} gender={p.gender} />
                          {isNew(p.createdAt) && (
                            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" title="Nuevo este mes" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{p.name} {p.lastName}</div>
                          {p.email && <div className="text-xs text-gray-400 mt-0.5">{p.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>{p.phone}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      <span className={GENDER_CONFIG[p.gender].badge}>{GENDER_CONFIG[p.gender].label}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>{calcAge(p.birthDate)} años</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-500 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      {new Date(p.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-100">
                      {/* Acciones visibles al hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/pacientes/${p.id}`)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                          title="Ver perfil"
                        >
                          <ArrowIcon /> Ver
                        </button>
                        <button
                          onClick={() => setEditPatient(p)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                          title="Editar paciente"
                        >
                          <EditIcon />
                        </button>
                      </div>
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
        <PatientForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
        />
      )}

      {editPatient && (
        <PatientForm
          title="Editar paciente"
          initial={editPatient}
          isEdit
          onClose={() => setEditPatient(null)}
          onSubmit={(data) => updateMut.mutate(data)}
          loading={updateMut.isPending}
        />
      )}
    </>
  );
}
