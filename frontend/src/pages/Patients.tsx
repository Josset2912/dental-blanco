import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getPatients, createPatient } from '../api/patients';
import type { Patient } from '../api/patients';
import PatientForm from '../components/PatientForm';

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
const ChevronIcon = () => (
  <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
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

export default function Patients() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['patients', search],
    queryFn: () => getPatients(search || undefined),
  });

  const createMut = useMutation({
    mutationFn: createPatient,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setShowForm(false); toast.success('Paciente creado correctamente'); },
    onError: () => toast.error('Error al guardar el paciente'),
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
            {patients.length} paciente{patients.length !== 1 ? 's' : ''} registrado{patients.length !== 1 ? 's' : ''}
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
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* MOBILE: lista de tarjetas */}
      <div className="md:hidden bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Cargando pacientes...</div>
        ) : patients.length === 0 ? empty : (
          <ul>
            {patients.map((p: Patient, idx: number) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer active:bg-gray-50 hover:bg-gray-50 ${idx < patients.length - 1 ? 'border-b border-gray-100' : ''}`}
                onClick={() => navigate(`/pacientes/${p.id}`)}
              >
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
                <ChevronIcon />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* DESKTOP: tabla */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Cargando pacientes...</div>
        ) : patients.length === 0 ? empty : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Paciente', 'Teléfono', 'Género', 'Edad', 'Registro'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map((p: Patient, idx: number) => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer hover:bg-gray-50 ${idx < patients.length - 1 ? '' : '[&>td]:border-b-0'}`}
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                  >
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                      <div className="font-medium text-gray-900">{p.name} {p.lastName}</div>
                      {p.email && <div className="text-xs text-gray-500 mt-0.5">{p.email}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600">{p.phone}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                      <span className={genderBadgeClass[p.gender]}>{genderLabel[p.gender]}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600">{calcAge(p.birthDate)} años</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100 text-gray-600">
                      {new Date(p.createdAt).toLocaleDateString('es-PE')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <PatientForm
          onClose={() => setShowForm(false)}
          onSubmit={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
        />
      )}
    </>
  );
}
