import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPatientsPaged, createPatient, updatePatient } from '../api/patients';
import type { Patient } from '../api/patients';
import PatientForm from '../components/PatientForm';
import Pagination from '../components/Pagination';

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
  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"/>
  </svg>
);

function calcAge(birthDate: string) {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

const genderBadgeClass: Record<string, string> = {
  MASCULINO: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-[#E6F7FD] text-[#0077B6]',
  FEMENINO: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-600',
  OTRO: 'inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600',
};
const genderLabel: Record<string, string> = { MASCULINO: 'Masculino', FEMENINO: 'Femenino', OTRO: 'Otro' };

function PatientInitial({ name }: { name: string }) {
  const letter = name.trim().charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
      style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
      {letter}
    </div>
  );
}

const LIMIT = 20;

type SortKey = 'name' | 'createdAt' | 'birthDate';

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg className={`w-3 h-3 inline ml-1 transition-colors ${active ? 'text-[#00AEEF]' : 'text-gray-300'}`} viewBox="0 0 24 24" fill="currentColor">
      {dir === 'asc' || !active
        ? <path d="M7 14l5-5 5 5H7z"/>
        : <path d="M7 10l5 5 5-5H7z"/>}
    </svg>
  );
}

export default function Patients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const [showForm, setShowForm] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['patients', page, search],
    queryFn: () => getPatientsPaged(page, search || undefined, LIMIT),
  });

  const patients: Patient[] = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const createMut = useMutation({
    mutationFn: createPatient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setShowForm(false); toast.success('Paciente creado correctamente'); },
    onError: () => toast.error('Error al guardar el paciente'),
  });

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof updatePatient>[1]) => updatePatient(editPatient!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setEditPatient(null); toast.success('Paciente actualizado correctamente'); },
    onError: () => toast.error('Error al actualizar el paciente'),
  });

  const empty = (
    <div className="text-center py-16 text-gray-500">
      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
      </svg>
      <p className="text-sm font-medium text-gray-700">No hay pacientes {search ? 'con esa búsqueda' : 'registrados'}</p>
      {!search && <span className="text-xs text-gray-400">Crea el primer paciente con el botón de arriba</span>}
    </div>
  );

  return (
    <>
      {/* Header — apilado en mobile, fila en sm+ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {total} paciente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-white transition-colors rounded-lg text-sm font-medium sm:w-auto"
          style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
        >
          <PlusIcon /> Nuevo paciente
        </button>
      </div>

      {/* Busqueda */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
          placeholder="Buscar por nombre o teléfono..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
      </div>

      {/* MOBILE: lista de tarjetas */}
      <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <ul className="animate-pulse divide-y divide-gray-100">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </li>
            ))}
          </ul>
        ) : patients.length === 0 ? empty : (
          <ul>
            {patients.map((p: Patient, idx: number) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${idx < patients.length - 1 ? 'border-b border-gray-100' : ''}`}
              >
                <div className="cursor-pointer flex items-center gap-3 flex-1 min-w-0" onClick={() => navigate(`/pacientes/${p.id}`)}>
                  <PatientInitial name={p.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 text-sm truncate">{p.name} {p.lastName}</span>
                      <span className={genderBadgeClass[p.gender]}>{genderLabel[p.gender]}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <PhoneIcon />
                      <span className="text-xs text-gray-500">{p.phone}</span>
                      <span className="text-gray-300 text-xs">·</span>
                      <span className="text-xs text-gray-500">{calcAge(p.birthDate)} años</span>
                    </div>
                    {p.email && (
                      <div className="text-xs text-gray-400 truncate mt-0.5">{p.email}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setEditPatient(p); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors shrink-0"
                  title="Editar paciente"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
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
                <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
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
        ) : patients.length === 0 ? empty : (
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
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {[...patients].sort((a, b) => {
                  let va: string | number = sortKey === 'name' ? `${a.name} ${a.lastName}` : sortKey === 'birthDate' ? a.birthDate : a.createdAt;
                  let vb: string | number = sortKey === 'name' ? `${b.name} ${b.lastName}` : sortKey === 'birthDate' ? b.birthDate : b.createdAt;
                  return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
                }).map((p: Patient, idx: number) => (
                  <tr
                    key={p.id}
                    className={`transition-colors hover:bg-[#E6F7FD]/40 ${idx % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
                  >
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      <div className="flex items-center gap-2.5">
                        <PatientInitial name={p.name} />
                        <div>
                          <div className="font-medium text-gray-900">{p.name} {p.lastName}</div>
                          {p.email && <div className="text-xs text-gray-400 mt-0.5">{p.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>{p.phone}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      <span className={genderBadgeClass[p.gender]}>{genderLabel[p.gender]}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>{calcAge(p.birthDate)} años</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-500 cursor-pointer" onClick={() => navigate(`/pacientes/${p.id}`)}>
                      {new Date(p.createdAt).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-4 py-3.5 border-b border-gray-100">
                      <button
                        onClick={() => setEditPatient(p)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                        title="Editar paciente"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
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
