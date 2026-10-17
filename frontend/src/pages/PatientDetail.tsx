import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPatient, updatePatient, deletePatient } from '../api/patients';
import { getTreatments, createTreatment, updateTreatment } from '../api/treatments';
import { getPayments } from '../api/payments';
import PatientForm from '../components/PatientForm';
import TreatmentForm from '../components/TreatmentForm';
import Odontogram from '../components/Odontogram';
import PatientImages from '../components/PatientImages';
import ClinicalNotes from '../components/ClinicalNotes';

function calcAge(birthDate: string) {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

const genderLabel: Record<string, string> = { MASCULINO: 'Masculino', FEMENINO: 'Femenino', OTRO: 'Otro' };

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-[#E6F7FD] text-[#0077B6]',
  COMPLETED: 'bg-green-50 text-green-600',
  CANCELLED: 'bg-gray-100 text-gray-500',
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};
const METHOD_LABEL: Record<string, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  CARD: 'bg-[#E6F7FD] text-blue-700',
  TRANSFER: 'bg-purple-50 text-purple-700',
};

function fmt(v: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(v);
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
  });

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof updatePatient>[1]) => updatePatient(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id] }); setShowEdit(false); },
  });

  const deleteMut = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: () => navigate('/pacientes'),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', id],
    queryFn: () => getTreatments({ patientId: id }),
    enabled: !!id,
  });

  const createTreatmentMut = useMutation({
    mutationFn: createTreatment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments', id] }); setShowTreatmentForm(false); },
  });

  const completeTreatmentMut = useMutation({
    mutationFn: (tid: string) => updateTreatment(tid, { status: 'COMPLETED', endDate: new Date().toISOString() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['treatments', id] }),
  });

  const { data: payments = [] } = useQuery({
    queryKey: ['payments', id],
    queryFn: () => getPayments(id),
    enabled: !!id,
  });

  const totalPaid = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Cargando paciente...</div>
  );
  if (!patient) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Paciente no encontrado</div>
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            onClick={() => navigate('/pacientes')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Pacientes
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{patient.name} {patient.lastName}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{calcAge(patient.birthDate)} años · {genderLabel[patient.gender]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowEdit(true)}
          >
            Editar
          </button>
          <button
            className="px-4 py-2 bg-red-50 text-red-500 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información personal</h4>
          <InfoRow label="Teléfono" value={patient.phone} />
          {patient.email && <InfoRow label="Correo" value={patient.email} />}
          <InfoRow label="Fecha de nac." value={new Date(patient.birthDate).toLocaleDateString('es-PE')} />
          {patient.address && <InfoRow label="Dirección" value={patient.address} />}
          <InfoRow label="Registro" value={new Date(patient.createdAt).toLocaleDateString('es-PE')} last />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Notas clínicas</h4>
          <InfoRow label="Alergias" value={patient.allergies || 'Ninguna registrada'} last={!patient.notes} />
          {patient.notes && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Observaciones</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{patient.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Odontogram */}
      <div className="mb-5">
        <Odontogram patientId={id!} />
      </div>

      {/* Treatments */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tratamientos</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {treatments.filter(t => t.status === 'IN_PROGRESS').length} en progreso · {treatments.length} total
            </p>
          </div>
          <button
            onClick={() => setShowTreatmentForm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white transition-colors rounded-lg text-xs font-medium"
            style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
            </svg>
            Nuevo tratamiento
          </button>
        </div>
        {treatments.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <p className="text-sm text-gray-500">Sin tratamientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Tratamiento', 'Descripción', 'Costo', 'Inicio', 'Estado', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {treatments.map((t, i) => (
                  <tr key={t.id} className={`hover:bg-gray-50 ${i < treatments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{t.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 max-w-[200px] truncate">{t.description || '—'}</td>
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(t.cost))}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {new Date(t.startDate).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {t.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => completeTreatmentMut.mutate(t.id)}
                          disabled={completeTreatmentMut.isPending}
                          className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-60"
                        >
                          Completar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Clinical Notes */}
      <ClinicalNotes patientId={id!} />

      {/* Images */}
      <PatientImages patientId={id!} patientName={`${patient.name} ${patient.lastName}`} />

      {/* Payments */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Historial de pagos</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {payments.length} pago{payments.length !== 1 ? 's' : ''} · Total: {fmt(totalPaid)}
            </p>
          </div>
        </div>
        {payments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">Sin pagos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Fecha', 'Concepto', 'Tratamiento', 'Método', 'Monto'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${i < payments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700">{p.concept}</td>
                    <td className="px-5 py-3 text-sm text-gray-500">{p.treatment?.name ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                        {METHOD_LABEL[p.method]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm font-bold text-gray-900">{fmt(parseFloat(p.amount))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showTreatmentForm && (
        <TreatmentForm
          onClose={() => setShowTreatmentForm(false)}
          onSubmit={data => createTreatmentMut.mutate(data)}
          loading={createTreatmentMut.isPending}
          error={createTreatmentMut.isError ? 'Error al guardar el tratamiento' : ''}
          fixedPatientId={id}
        />
      )}

      {showEdit && (
        <PatientForm
          title="Editar paciente"
          initial={patient}
          onClose={() => setShowEdit(false)}
          onSubmit={data => updateMut.mutate(data)}
          loading={updateMut.isPending}
          error={updateMut.isError ? 'Error al guardar' : ''}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Eliminar paciente</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 mb-5">
                ¿Estás seguro de eliminar a <strong>{patient.name} {patient.lastName}</strong>? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
                  onClick={() => setConfirmDelete(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60"
                  onClick={() => deleteMut.mutate()}
                  disabled={deleteMut.isPending}
                >
                  {deleteMut.isPending ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`flex justify-between py-2.5 text-sm ${last ? '' : 'border-b border-gray-100'}`}>
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-[200px]">{value}</span>
    </div>
  );
}
