import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getPatient, updatePatient, deletePatient } from '../api/patients';
import { getTreatments, createTreatment, updateTreatment } from '../api/treatments';
import { getPayments, createPayment, type Payment } from '../api/payments';
import { generatePaymentReceipt } from '../utils/generatePaymentReceipt';
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
  CANCELLED: 'bg-red-50 text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'En curso',
  COMPLETED: 'Completado',
  CANCELLED: 'Anulado',
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

function fmtCost(s: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(s));
}

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState<typeof treatments[number] | null>(null);
  const [editTreatment, setEditTreatment] = useState<typeof treatments[number] | null>(null);
  const [editTreatmentForm, setEditTreatmentForm] = useState<{ status: string; cost: string; description: string; notes: string }>({ status: '', cost: '', description: '', notes: '' });
  const [payTreatment, setPayTreatment] = useState<typeof treatments[number] | null>(null);
  const [payForm, setPayForm] = useState<{ amount: string; method: string; concept: string; notes: string }>({ amount: '', method: 'CASH', concept: 'Abono', notes: '' });
  const [lastPayment, setLastPayment] = useState<{ payment: Payment; treatment: typeof treatments[number] } | null>(null);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
  });

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof updatePatient>[1]) => updatePatient(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id] }); setShowEdit(false); toast.success('Paciente actualizado correctamente'); },
    onError: () => toast.error('Error al guardar el paciente'),
  });

  const deleteMut = useMutation({
    mutationFn: () => deletePatient(id!),
    onSuccess: () => { navigate('/pacientes'); toast.success('Paciente eliminado'); },
    onError: () => toast.error('Error al eliminar el paciente'),
  });

  const { data: treatments = [] } = useQuery({
    queryKey: ['treatments', id],
    queryFn: () => getTreatments({ patientId: id }),
    enabled: !!id,
  });

  const createTreatmentMut = useMutation({
    mutationFn: createTreatment,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments', id] }); setShowTreatmentForm(false); toast.success('Tratamiento creado correctamente'); },
    onError: () => toast.error('Error al guardar el tratamiento'),
  });

  const completeTreatmentMut = useMutation({
    mutationFn: (tid: string) => updateTreatment(tid, { status: 'COMPLETED', endDate: new Date().toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments', id] }); setConfirmComplete(null); toast.success('Tratamiento completado'); },
    onError: () => toast.error('Error al completar el tratamiento'),
  });

  const editTreatmentMut = useMutation({
    mutationFn: (tid: string) => updateTreatment(tid, {
      status: editTreatmentForm.status as 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
      cost: parseFloat(editTreatmentForm.cost),
      description: editTreatmentForm.description || undefined,
      notes: editTreatmentForm.notes || undefined,
      ...(editTreatmentForm.status === 'COMPLETED' ? { endDate: new Date().toISOString() } : {}),
      ...(editTreatmentForm.status === 'IN_PROGRESS' ? { endDate: undefined } : {}),
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments', id] }); setEditTreatment(null); toast.success('Tratamiento actualizado'); },
    onError: () => toast.error('Error al actualizar el tratamiento'),
  });

  const quickPayMut = useMutation({
    mutationFn: () => createPayment({
      patientId: id!,
      treatmentId: payTreatment!.id,
      amount: parseFloat(payForm.amount),
      method: payForm.method,
      concept: payForm.concept || 'Abono',
      notes: payForm.notes || undefined,
    }),
    onSuccess: (payment) => {
      qc.invalidateQueries({ queryKey: ['treatments', id] });
      qc.invalidateQueries({ queryKey: ['payments', id] });
      setLastPayment({ payment, treatment: payTreatment! });
      setPayTreatment(null);
      toast.success('Pago registrado correctamente');
    },
    onError: (e: { response?: { data?: { error?: string } } }) => {
      toast.error(e?.response?.data?.error ?? 'Error al registrar el pago');
    },
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
      {/* Header — mobile: 2 filas; desktop: 1 fila */}
      <div className="mb-6">
        {/* Fila superior: volver + acciones */}
        <div className="flex items-center justify-between mb-2">
          <button
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
            onClick={() => navigate('/pacientes')}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
            </svg>
            Pacientes
          </button>
          <div className="flex gap-2">
            <button
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              onClick={() => setShowEdit(true)}
            >
              Editar
            </button>
            <button
              className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
              onClick={() => setConfirmDelete(true)}
            >
              Eliminar
            </button>
          </div>
        </div>
        {/* Nombre y datos */}
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{patient.name} {patient.lastName}</h2>
        <p className="text-sm text-gray-500 mt-0.5">{calcAge(patient.birthDate)} años · {genderLabel[patient.gender]}</p>
      </div>

      {/* Info cards — 1 columna mobile, 2 columnas sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Información personal</h4>
          <InfoRow label="Teléfono" value={patient.phone} />
          {patient.email && <InfoRow label="Correo" value={patient.email} />}
          <InfoRow label="Fecha de nac." value={new Date(patient.birthDate).toLocaleDateString('es-PE')} />
          {patient.address && <InfoRow label="Dirección" value={patient.address} />}
          <InfoRow label="Registro" value={new Date(patient.createdAt).toLocaleDateString('es-PE')} last />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
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

      {/* Odontograma */}
      <div className="mb-5">
        <Odontogram patientId={id!} />
      </div>

      {/* Tratamientos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mb-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
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
            Nuevo
          </button>
        </div>

        {treatments.length === 0 ? (
          <div className="text-center py-10">
            <svg className="w-10 h-10 mx-auto mb-2 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            <p className="text-sm text-gray-500">Sin tratamientos registrados</p>
          </div>
        ) : (
          <>
            {/* Mobile: tarjetas */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {treatments.map(t => {
                const cost = parseFloat(t.cost);
                const pct = cost > 0 ? Math.min(100, (t.totalPaid / cost) * 100) : 0;
                const paid = pct >= 100;
                return (
                  <li key={t.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-sm font-medium text-gray-900">{t.name}</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[t.status]}`}>
                        {STATUS_LABEL[t.status]}
                      </span>
                    </div>
                    {t.description && <p className="text-xs text-gray-500 mb-1.5">{t.description}</p>}
                    {/* Barra de progreso */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{fmt(t.totalPaid)} pagado</span>
                        <span className={paid ? 'text-green-600 font-semibold' : 'text-amber-600 font-medium'}>
                          {paid ? 'Pagado ✓' : `S/ ${t.balance.toFixed(2)} pendiente`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${paid ? 'bg-green-400' : 'bg-[#00AEEF]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-gray-900">{fmtCost(t.cost)}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(t.startDate).toLocaleDateString('es-PE')}</span>
                        {t.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => { setEditTreatment(t); setEditTreatmentForm({ status: t.status, cost: t.cost, description: t.description ?? '', notes: t.notes ?? '' }); }}
                            className="p-1.5 rounded-md text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                          </button>
                        )}
                        {!paid && t.status !== 'CANCELLED' && (
                          <button
                            onClick={() => { setPayTreatment(t); setPayForm({ amount: t.balance.toFixed(2), method: 'CASH', concept: 'Abono', notes: '' }); }}
                            className="px-2.5 py-1 text-xs font-medium text-white rounded-md"
                            style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                          >
                            Pagar
                          </button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => setConfirmComplete(t)}
                            className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {/* Desktop: tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Tratamiento', 'Costo / Pago', 'Inicio', 'Estado', ''].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {treatments.map((t, i) => {
                    const cost = parseFloat(t.cost);
                    const pct = cost > 0 ? Math.min(100, (t.totalPaid / cost) * 100) : 0;
                    const paid = pct >= 100;
                    return (
                      <tr key={t.id} className={`hover:bg-gray-50 ${i < treatments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          {t.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[180px]">{t.description}</p>}
                        </td>
                        <td className="px-5 py-3.5 min-w-[160px]">
                          <p className="text-sm font-semibold text-gray-900 mb-1">{fmtCost(t.cost)}</p>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                            <div
                              className={`h-full rounded-full transition-all ${paid ? 'bg-green-400' : 'bg-[#00AEEF]'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <p className={`text-xs ${paid ? 'text-green-600 font-semibold' : 'text-amber-600'}`}>
                            {paid ? 'Pagado ✓' : `S/ ${t.balance.toFixed(2)} pendiente`}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{new Date(t.startDate).toLocaleDateString('es-PE')}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                            {STATUS_LABEL[t.status]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {t.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => { setEditTreatment(t); setEditTreatmentForm({ status: t.status, cost: t.cost, description: t.description ?? '', notes: t.notes ?? '' }); }}
                                className="p-1.5 rounded-md text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                                title="Editar tratamiento"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                              </button>
                            )}
                            {!paid && t.status !== 'CANCELLED' && (
                              <button
                                onClick={() => { setPayTreatment(t); setPayForm({ amount: t.balance.toFixed(2), method: 'CASH', concept: 'Abono', notes: '' }); }}
                                className="px-2.5 py-1 text-xs font-medium text-white rounded-md"
                                style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                              >
                                Pagar
                              </button>
                            )}
                            {t.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => setConfirmComplete(t)}
                                className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50"
                              >
                                Completar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Notas clinicas */}
      <ClinicalNotes patientId={id!} />

      {/* Imagenes */}
      <PatientImages patientId={id!} patientName={`${patient.name} ${patient.lastName}`} />

      {/* Pagos */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden mt-5">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
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
          <>
            {/* Mobile: tarjetas */}
            <ul className="sm:hidden divide-y divide-gray-100">
              {payments.map(p => (
                <li key={p.id} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">{p.concept}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-gray-900">{fmt(parseFloat(p.amount))}</span>
                      <button
                        onClick={() => generatePaymentReceipt(p, patient, p.treatment ? treatments.find(t => t.id === p.treatment?.id) ?? null : null)}
                        className="p-1.5 rounded-md text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                        title="Descargar comprobante"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                      {METHOD_LABEL[p.method]}
                    </span>
                    {p.treatment && <span className="text-xs text-gray-400">{p.treatment.name}</span>}
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {/* Desktop: tabla */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Fecha', 'Concepto', 'Tratamiento', 'Método', 'Monto', ''].map(h => (
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
                      <td className="px-5 py-3">
                        <button
                          onClick={() => generatePaymentReceipt(p, patient, p.treatment ? treatments.find(t => t.id === p.treatment?.id) ?? null : null)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors"
                          title="Descargar comprobante"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Banner descarga de comprobante tras pago exitoso */}
      {lastPayment && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="bg-gray-900 text-white rounded-xl shadow-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Pago registrado</p>
              <p className="text-xs text-gray-300 mt-0.5 truncate">¿Descargar comprobante?</p>
            </div>
            <button
              onClick={() => {
                generatePaymentReceipt(lastPayment.payment, patient, lastPayment.treatment);
                setLastPayment(null);
              }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100 shrink-0"
            >
              Descargar
            </button>
            <button onClick={() => setLastPayment(null)} className="text-gray-400 hover:text-white shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Modal pago rápido por tratamiento */}
      {payTreatment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setPayTreatment(null); }}>
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Registrar pago</h3>
              </div>
              <button onClick={() => setPayTreatment(null)} className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Info del tratamiento */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                <p className="font-semibold text-gray-900">{payTreatment.name}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total: {fmtCost(payTreatment.cost)}</span>
                  <span>Pagado: {fmt(payTreatment.totalPaid)}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#00AEEF] rounded-full"
                    style={{ width: `${Math.min(100, (payTreatment.totalPaid / parseFloat(payTreatment.cost)) * 100)}%` }}
                  />
                </div>
                <p className="text-amber-600 font-semibold text-xs">Saldo: {fmt(payTreatment.balance)}</p>
              </div>

              {/* Monto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto a pagar (S/)</label>
                <input
                  type="number" min="0.01" step="0.01"
                  max={payTreatment.balance}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>

              {/* Método */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Método de pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { value: 'CASH', label: 'Efectivo' },
                    { value: 'CARD', label: 'Tarjeta' },
                    { value: 'TRANSFER', label: 'Transferencia' },
                  ] as const).map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPayForm(f => ({ ...f, method: m.value }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${payForm.method === m.value ? 'bg-[#E6F7FD] text-[#0077B6] border-[#00AEEF]' : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concepto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Pago inicial', 'Abono', 'Cancelación'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setPayForm(f => ({ ...f, concept: c }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${payForm.concept === c ? 'bg-[#E6F7FD] text-[#0077B6] border-[#00AEEF]' : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas (opcional)</label>
                <input
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones opcionales..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
                  onClick={() => setPayTreatment(null)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                  onClick={() => quickPayMut.mutate()}
                  disabled={quickPayMut.isPending || !payForm.amount || parseFloat(payForm.amount) <= 0}
                >
                  {quickPayMut.isPending ? 'Guardando...' : 'Registrar pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar completar tratamiento */}
      {confirmComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h3 className="text-base font-bold text-gray-900">Completar tratamiento</h3>
            </div>
            <div className="px-6 py-5">
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm space-y-1">
                <p className="font-semibold text-gray-900">{confirmComplete.name}</p>
                {confirmComplete.description && <p className="text-gray-500 text-xs">{confirmComplete.description}</p>}
                <p className="text-gray-700 font-medium">{fmtCost(confirmComplete.cost)}</p>
              </div>
              <p className="text-sm text-gray-600 mb-5">¿Confirmas que este tratamiento ha sido completado? Se registrará la fecha de hoy como fecha de término.</p>
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
                  onClick={() => setConfirmComplete(null)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 disabled:opacity-60"
                  onClick={() => completeTreatmentMut.mutate(confirmComplete.id)}
                  disabled={completeTreatmentMut.isPending}
                >
                  {completeTreatmentMut.isPending ? 'Guardando...' : 'Sí, completar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar tratamiento */}
      {editTreatment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Editar tratamiento</h3>
              <button onClick={() => setEditTreatment(null)} className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm font-semibold text-gray-800">{editTreatment.name}</p>

              {/* Estado */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { value: 'IN_PROGRESS', label: 'En curso', color: 'bg-[#E6F7FD] text-[#0077B6] border-[#00AEEF]' },
                    { value: 'COMPLETED', label: 'Completado', color: 'bg-green-50 text-green-700 border-green-400' },
                    { value: 'CANCELLED', label: 'Anulado', color: 'bg-red-50 text-red-500 border-red-400' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEditTreatmentForm(f => ({ ...f, status: opt.value }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${editTreatmentForm.status === opt.value ? opt.color + ' border-opacity-100' : 'bg-white text-gray-400 border-gray-200'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Costo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo (S/)</label>
                <input
                  type="number" min="0" step="0.01"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={editTreatmentForm.cost}
                  onChange={e => setEditTreatmentForm(f => ({ ...f, cost: e.target.value }))}
                />
              </div>

              {/* Descripción */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</label>
                <input
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={editTreatmentForm.description}
                  onChange={e => setEditTreatmentForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descripción del tratamiento..."
                />
              </div>

              {/* Notas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</label>
                <textarea
                  rows={2}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white resize-none"
                  value={editTreatmentForm.notes}
                  onChange={e => setEditTreatmentForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Observaciones..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100"
                  onClick={() => setEditTreatment(null)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
                  onClick={() => editTreatmentMut.mutate(editTreatment.id)}
                  disabled={editTreatmentMut.isPending || !editTreatmentForm.cost}
                >
                  {editTreatmentMut.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showTreatmentForm && (
        <TreatmentForm
          onClose={() => setShowTreatmentForm(false)}
          onSubmit={data => createTreatmentMut.mutate(data)}
          loading={createTreatmentMut.isPending}
          fixedPatientId={id}
        />
      )}

      {showEdit && (
        <PatientForm
          title="Editar paciente"
          initial={patient}
          isEdit
          onClose={() => setShowEdit(false)}
          onSubmit={data => updateMut.mutate(data)}
          loading={updateMut.isPending}
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
    <div className={`py-2.5 text-sm ${last ? '' : 'border-b border-gray-100'}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-medium text-gray-900 break-words">{value}</p>
    </div>
  );
}
