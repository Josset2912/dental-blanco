import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patients'] }); setShowForm(false); }
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pacientes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {patients.length} paciente{patients.length !== 1 ? 's' : ''} registrado{patients.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-white transition-colors rounded-lg text-sm font-medium" style={{ background: "linear-gradient(135deg,#00AEEF,#0077B6)" }}>
          <PlusIcon /> Nuevo paciente
        </button>
      </div>

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <SearchIcon />
        </span>
        <input
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
          placeholder="Buscar por nombre o telÃ©fono..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            Cargando pacientes...
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
            </svg>
            <p className="text-sm font-medium text-gray-700">No hay pacientes {search ? 'con esa bÃºsqueda' : 'registrados'}</p>
            <span className="text-xs">{!search && 'Crea el primer paciente con el botÃ³n de arriba'}</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Paciente', 'TelÃ©fono', 'GÃ©nero', 'Edad', 'Registro'].map(h => (
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
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">{p.phone}</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">
                      <span className={genderBadgeClass[p.gender]}>{genderLabel[p.gender]}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">{calcAge(p.birthDate)} aÃ±os</td>
                    <td className="px-4 py-3.5 text-sm border-b border-gray-100">
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
          error={createMut.isError ? 'Error al guardar el paciente' : ''}
        />
      )}
    </>
  );
}

