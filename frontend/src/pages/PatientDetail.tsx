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

// ── Helpers ────────────────────────────────────────────────────────────────────

function calcAge(birthDate: string) {
  return Math.floor((Date.now() - new Date(birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function fmt(v: number) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 }).format(v);
}
function fmtCost(s: string) {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(parseFloat(s));
}

// ── Gender config ─────────────────────────────────────────────────────────────

const GENDER_CONFIG = {
  MASCULINO: { label: 'Masculino', avatar: 'from-[#00AEEF] to-[#0077B6]', badge: 'bg-blue-50 text-blue-600' },
  FEMENINO:  { label: 'Femenino',  avatar: 'from-fuchsia-400 to-fuchsia-600', badge: 'bg-fuchsia-50 text-fuchsia-600' },
  OTRO:      { label: 'Otro',      avatar: 'from-gray-400 to-gray-500', badge: 'bg-gray-100 text-gray-600' },
};

// ── Status / method config ────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-[#E6F7FD] text-[#0077B6]',
  COMPLETED:   'bg-green-50 text-green-600',
  CANCELLED:   'bg-red-50 text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  IN_PROGRESS: 'En curso',
  COMPLETED:   'Completado',
  CANCELLED:   'Anulado',
};
const METHOD_LABEL: Record<string, string>  = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  CARD: 'bg-[#E6F7FD] text-blue-700',
  TRANSFER: 'bg-purple-50 text-purple-700',
};

// ── Icons (inline, named) ─────────────────────────────────────────────────────

const BackIcon    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;
const PhoneIcon   = () => <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"/></svg>;
const MailIcon    = () => <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;
const CalIcon     = () => <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const MapIcon     = () => <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const AlertIcon   = () => <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>;
const NoteIcon    = () => <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>;
const EditIcon    = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>;
const PrintIcon   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>;
const PlusIcon    = () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const CloseIcon   = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>;

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = 'info' | 'treatments' | 'payments' | 'clinical';

const TABS: { key: Tab; label: string }[] = [
  { key: 'info',       label: 'Información' },
  { key: 'treatments', label: 'Tratamientos' },
  { key: 'payments',   label: 'Pagos' },
  { key: 'clinical',   label: 'Clínico' },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function InfoField({ icon, label, value, copyable }: { icon: React.ReactNode; label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-gray-400 mt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 break-words">{value}</p>
          {copyable && (
            <button onClick={copy} className="text-gray-300 hover:text-[#00AEEF] transition-colors shrink-0" title="Copiar">
              {copied
                ? <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, colorClass }: { label: string; value: string; sub?: string; colorClass: string }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl px-2 py-3 text-center shadow-sm min-w-0 overflow-hidden">
      <p className={`text-sm sm:text-lg font-bold leading-tight ${colorClass}`}>{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>('info');
  const [showEdit, setShowEdit]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState<typeof treatments[number] | null>(null);
  const [editTreatment, setEditTreatment]     = useState<typeof treatments[number] | null>(null);
  const [editTreatmentForm, setEditTreatmentForm] = useState({ status: '', cost: '', description: '', notes: '' });
  const [payTreatment, setPayTreatment]   = useState<typeof treatments[number] | null>(null);
  const [payForm, setPayForm]             = useState({ amount: '', method: 'CASH', concept: 'Abono', notes: '' });
  const [lastPayment, setLastPayment]     = useState<{ payment: Payment; treatment: typeof treatments[number] } | null>(null);

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => getPatient(id!),
  });

  const updateMut = useMutation({
    mutationFn: (data: Parameters<typeof updatePatient>[1]) => updatePatient(id!, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['patient', id] }); setShowEdit(false); toast.success('Paciente actualizado'); },
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['treatments', id] }); setShowTreatmentForm(false); toast.success('Tratamiento creado'); },
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
      toast.success('Pago registrado');
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

  if (isLoading) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Cargando paciente...</div>
  );
  if (!patient) return (
    <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Paciente no encontrado</div>
  );

  // ── Derived stats ─────────────────────────────────────────────────────────
  const totalPaid       = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const totalCost       = treatments.reduce((s, t) => s + parseFloat(t.cost), 0);
  const totalPending    = Math.max(0, totalCost - totalPaid);
  const activeCount     = treatments.filter(t => t.status === 'IN_PROGRESS').length;
  const gender          = patient.gender as keyof typeof GENDER_CONFIG;
  const gCfg            = GENDER_CONFIG[gender] ?? GENDER_CONFIG.OTRO;
  const hasAllergies    = patient.allergies && patient.allergies.toLowerCase() !== 'ninguna';

  return (
    <>
      {/* ── Back + actions ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <button
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          onClick={() => navigate('/pacientes')}
        >
          <BackIcon /> Pacientes
        </button>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setShowEdit(true)}
          >
            <EditIcon /> <span className="hidden sm:inline">Editar</span>
          </button>
          <button
            className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
            onClick={() => setConfirmDelete(true)}
          >
            Eliminar
          </button>
        </div>
      </div>

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-5">
        {/* Accent bar */}
        <div className="h-2 w-full bg-gradient-to-r from-[#00AEEF] to-[#0077B6]" />
        <div className="px-5 py-5">
          <div className="flex items-center gap-4 mb-5">
            {/* Avatar */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 bg-gradient-to-br ${gCfg.avatar} shadow-sm`}>
              {patient.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900 leading-tight truncate">{patient.name} {patient.lastName}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${gCfg.badge}`}>
                  {gCfg.label}
                </span>
                <span className="text-sm text-gray-500">{calcAge(patient.birthDate)} años</span>
                {hasAllergies && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                    <AlertIcon /> Alergias
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2">
            <KpiCard
              label="Tratamientos activos"
              value={String(activeCount)}
              colorClass={activeCount > 0 ? 'text-[#0077B6]' : 'text-gray-400'}
            />
            <KpiCard
              label="Total pagado"
              value={fmt(totalPaid)}
              colorClass="text-emerald-600"
            />
            <KpiCard
              label="Saldo pendiente"
              value={fmt(totalPending)}
              colorClass={totalPending > 0 ? 'text-amber-500' : 'text-gray-400'}
            />
          </div>

          {/* Financial progress bar */}
          {totalCost > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Progreso de pago</span>
                <span>{Math.round(Math.min(100, (totalPaid / totalCost) * 100))}% cubierto</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all"
                  style={{ width: `${Math.min(100, (totalPaid / totalCost) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>{fmt(totalPaid)} pagado</span>
                <span>{fmt(totalCost)} total</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab nav ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {TABS.map(({ key, label }) => {
          const badge = key === 'treatments' ? treatments.length
            : key === 'payments' ? payments.length
            : undefined;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                tab === key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {badge !== undefined && badge > 0 && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  tab === key ? 'bg-[#E6F7FD] text-[#0077B6]' : 'bg-gray-200 text-gray-500'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ TAB: INFORMACIÓN ══════════════════════════════════════════════ */}
      {tab === 'info' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Personal */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Información personal</h4>
            <InfoField icon={<PhoneIcon />} label="Teléfono" value={patient.phone} copyable />
            {patient.email && <InfoField icon={<MailIcon />} label="Correo electrónico" value={patient.email} />}
            <InfoField icon={<CalIcon />} label="Fecha de nacimiento" value={`${new Date(patient.birthDate).toLocaleDateString('es-PE')} (${calcAge(patient.birthDate)} años)`} />
            {patient.address && <InfoField icon={<MapIcon />} label="Dirección" value={patient.address} />}
            <InfoField icon={<CalIcon />} label="Paciente desde" value={new Date(patient.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>

          {/* Clínico / alergias */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Notas clínicas</h4>
            {hasAllergies ? (
              <div className="flex items-start gap-3 py-3 border-b border-gray-100">
                <span className="text-amber-500 mt-0.5"><AlertIcon /></span>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Alergias registradas</p>
                  <p className="text-sm font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 mt-1">
                    {patient.allergies}
                  </p>
                </div>
              </div>
            ) : (
              <InfoField icon={<AlertIcon />} label="Alergias" value="Ninguna registrada" />
            )}
            {patient.notes && (
              <div className="flex items-start gap-3 py-3">
                <span className="text-gray-400 mt-0.5"><NoteIcon /></span>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Observaciones</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{patient.notes}</p>
                </div>
              </div>
            )}
            {!patient.notes && !hasAllergies && (
              <p className="text-sm text-gray-400 py-4 text-center">Sin observaciones clínicas</p>
            )}
          </div>
        </div>
      )}

      {/* ══ TAB: TRATAMIENTOS ════════════════════════════════════════════ */}
      {tab === 'treatments' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Tratamientos</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {activeCount} en progreso · {treatments.length} total
              </p>
            </div>
            <button
              onClick={() => setShowTreatmentForm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-white rounded-lg text-xs font-medium transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
            >
              <PlusIcon /> Nuevo
            </button>
          </div>

          {treatments.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Sin tratamientos</p>
              <p className="text-xs text-gray-400 mt-0.5">Agrega el primer tratamiento con el botón de arriba</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-gray-100">
                {treatments.map(t => {
                  const cost = parseFloat(t.cost);
                  const pct  = cost > 0 ? Math.min(100, (t.totalPaid / cost) * 100) : 0;
                  const paid = pct >= 100;
                  return (
                    <li key={t.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-gray-900">{t.name}</span>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_COLORS[t.status]}`}>
                          {STATUS_LABEL[t.status]}
                        </span>
                      </div>
                      {t.description && <p className="text-xs text-gray-500 mb-2">{t.description}</p>}
                      <div className="mb-2.5">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">{fmt(t.totalPaid)} pagado</span>
                          <span className={paid ? 'text-emerald-600 font-semibold' : 'text-amber-600 font-medium'}>
                            {paid ? 'Saldado ✓' : `S/ ${t.balance.toFixed(2)} pendiente`}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${paid ? 'bg-emerald-400' : 'bg-[#00AEEF]'}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">{fmtCost(t.cost)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{new Date(t.startDate).toLocaleDateString('es-PE')}</span>
                          {t.status === 'IN_PROGRESS' && (
                            <button onClick={() => { setEditTreatment(t); setEditTreatmentForm({ status: t.status, cost: t.cost, description: t.description ?? '', notes: t.notes ?? '' }); }}
                              className="p-1.5 rounded-md text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors">
                              <EditIcon />
                            </button>
                          )}
                          {!paid && t.status !== 'CANCELLED' && (
                            <button onClick={() => { setPayTreatment(t); setPayForm({ amount: t.balance.toFixed(2), method: 'CASH', concept: 'Abono', notes: '' }); }}
                              className="px-2.5 py-1 text-xs font-medium text-white rounded-md"
                              style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                              Pagar
                            </button>
                          )}
                          {t.status === 'IN_PROGRESS' && (
                            <button onClick={() => setConfirmComplete(t)}
                              className="px-2.5 py-1 text-xs font-medium text-green-600 border border-green-200 rounded-md hover:bg-green-50">
                              Completar
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      {['Tratamiento', 'Costo / Progreso', 'Inicio', 'Estado', ''].map(h => (
                        <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {treatments.map((t, i) => {
                      const cost = parseFloat(t.cost);
                      const pct  = cost > 0 ? Math.min(100, (t.totalPaid / cost) * 100) : 0;
                      const paid = pct >= 100;
                      return (
                        <tr key={t.id} className={`group hover:bg-[#E6F7FD]/30 transition-colors ${i < treatments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                            {t.description && <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{t.description}</p>}
                          </td>
                          <td className="px-5 py-4 min-w-[180px]">
                            <p className="text-sm font-bold text-gray-900 mb-1.5">{fmtCost(t.cost)}</p>
                            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-1">
                              <div className={`h-full rounded-full transition-all ${paid ? 'bg-emerald-400' : 'bg-[#00AEEF]'}`} style={{ width: `${pct}%` }} />
                            </div>
                            <p className={`text-xs ${paid ? 'text-emerald-600 font-semibold' : 'text-amber-600'}`}>
                              {paid ? 'Saldado ✓' : `S/ ${t.balance.toFixed(2)} pendiente`}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                            {new Date(t.startDate).toLocaleDateString('es-PE')}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}>
                              {STATUS_LABEL[t.status]}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              {t.status === 'IN_PROGRESS' && (
                                <button onClick={() => { setEditTreatment(t); setEditTreatmentForm({ status: t.status, cost: t.cost, description: t.description ?? '', notes: t.notes ?? '' }); }}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors" title="Editar">
                                  <EditIcon />
                                </button>
                              )}
                              {!paid && t.status !== 'CANCELLED' && (
                                <button onClick={() => { setPayTreatment(t); setPayForm({ amount: t.balance.toFixed(2), method: 'CASH', concept: 'Abono', notes: '' }); }}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-opacity hover:opacity-90"
                                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                                  Pagar
                                </button>
                              )}
                              {t.status === 'IN_PROGRESS' && (
                                <button onClick={() => setConfirmComplete(t)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
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
      )}

      {/* ══ TAB: PAGOS ═══════════════════════════════════════════════════ */}
      {tab === 'payments' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Historial de pagos</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {payments.length} pago{payments.length !== 1 ? 's' : ''} · Total: <span className="font-semibold text-emerald-600">{fmt(totalPaid)}</span>
              </p>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="text-center py-14">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-600">Sin pagos registrados</p>
            </div>
          ) : (
            <>
              {/* Mobile cards */}
              <ul className="sm:hidden divide-y divide-gray-100">
                {payments.map(p => (
                  <li key={p.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{p.concept}</p>
                        {p.treatment && <p className="text-xs text-gray-400 mt-0.5 truncate">{p.treatment.name}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-emerald-600">{fmt(parseFloat(p.amount))}</span>
                        <button onClick={() => generatePaymentReceipt(p, patient, p.treatment ? treatments.find(t => t.id === p.treatment?.id) ?? null : null)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors" title="Comprobante">
                          <PrintIcon />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                        {METHOD_LABEL[p.method]}
                      </span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop table */}
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
                      <tr key={p.id} className={`hover:bg-[#E6F7FD]/30 transition-colors ${i < payments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                        <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                          {new Date(p.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3.5 text-sm font-medium text-gray-800">{p.concept}</td>
                        <td className="px-5 py-3.5 text-sm text-gray-500">{p.treatment?.name ?? '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                            {METHOD_LABEL[p.method]}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm font-bold text-emerald-600">{fmt(parseFloat(p.amount))}</td>
                        <td className="px-5 py-3.5">
                          <button onClick={() => generatePaymentReceipt(p, patient, p.treatment ? treatments.find(t => t.id === p.treatment?.id) ?? null : null)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-[#00AEEF] hover:bg-[#E6F7FD] transition-colors" title="Descargar comprobante">
                            <PrintIcon />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={4} className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</td>
                      <td className="px-5 py-3 text-sm font-bold text-emerald-600">{fmt(totalPaid)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ TAB: CLÍNICO ════════════════════════════════════════════════ */}
      {tab === 'clinical' && (
        <div className="space-y-5">
          <Odontogram patientId={id!} />
          <ClinicalNotes patientId={id!} />
          <PatientImages patientId={id!} patientName={`${patient.name} ${patient.lastName}`} />
        </div>
      )}

      {/* ── Banner comprobante ─────────────────────────────────────────── */}
      {lastPayment && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="bg-gray-900 text-white rounded-xl shadow-xl px-5 py-4 flex items-center gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Pago registrado</p>
              <p className="text-xs text-gray-300 mt-0.5 truncate">¿Descargar comprobante?</p>
            </div>
            <button
              onClick={() => { generatePaymentReceipt(lastPayment.payment, patient, lastPayment.treatment); setLastPayment(null); }}
              className="px-3 py-1.5 text-xs font-semibold text-gray-900 bg-white rounded-lg hover:bg-gray-100 shrink-0"
            >
              Descargar
            </button>
            <button onClick={() => setLastPayment(null)} className="text-gray-400 hover:text-white shrink-0"><CloseIcon /></button>
          </div>
        </div>
      )}

      {/* ── Modal: pago rápido ─────────────────────────────────────────── */}
      {payTreatment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={e => { if (e.target === e.currentTarget) setPayTreatment(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)' }}>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Registrar pago</h3>
                </div>
                <button onClick={() => setPayTreatment(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/60 text-gray-500 hover:bg-white transition-colors"><CloseIcon /></button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
                <p className="font-semibold text-gray-900">{payTreatment.name}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total: {fmtCost(payTreatment.cost)}</span>
                  <span>Pagado: {fmt(payTreatment.totalPaid)}</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-[#00AEEF] rounded-full" style={{ width: `${Math.min(100, (payTreatment.totalPaid / parseFloat(payTreatment.cost)) * 100)}%` }} />
                </div>
                <p className="text-amber-600 font-semibold text-xs">Saldo: {fmt(payTreatment.balance)}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto a pagar (S/)</label>
                <input type="number" min="0.01" step="0.01" max={payTreatment.balance}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Método de pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([{ value: 'CASH', label: 'Efectivo' }, { value: 'CARD', label: 'Tarjeta' }, { value: 'TRANSFER', label: 'Transferencia' }] as const).map(m => (
                    <button key={m.value} type="button" onClick={() => setPayForm(f => ({ ...f, method: m.value }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${payForm.method === m.value ? 'bg-[#E6F7FD] text-[#0077B6] border-[#00AEEF]' : 'bg-white text-gray-400 border-gray-200'}`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo de pago</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Pago inicial', 'Abono', 'Cancelación'] as const).map(c => (
                    <button key={c} type="button" onClick={() => setPayForm(f => ({ ...f, concept: c }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${payForm.concept === c ? 'bg-[#E6F7FD] text-[#0077B6] border-[#00AEEF]' : 'bg-white text-gray-400 border-gray-200'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas (opcional)</label>
                <input className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones opcionales..." />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100" onClick={() => setPayTreatment(null)}>Cancelar</button>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                  onClick={() => quickPayMut.mutate()}
                  disabled={quickPayMut.isPending || !payForm.amount || parseFloat(payForm.amount) <= 0}>
                  {quickPayMut.isPending ? 'Guardando...' : 'Registrar pago'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: completar tratamiento ───────────────────────────────── */}
      {confirmComplete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)' }}>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }} />
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 className="text-base font-bold text-gray-900">Completar tratamiento</h3>
              </div>
            </div>
            <div className="px-6 py-5">
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm space-y-1">
                <p className="font-semibold text-gray-900">{confirmComplete.name}</p>
                {confirmComplete.description && <p className="text-gray-500 text-xs">{confirmComplete.description}</p>}
                <p className="text-gray-700 font-medium">{fmtCost(confirmComplete.cost)}</p>
              </div>
              <p className="text-sm text-gray-600 mb-5">¿Confirmas que este tratamiento ha sido completado? Se registrará la fecha de hoy como fecha de término.</p>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100" onClick={() => setConfirmComplete(null)}>Cancelar</button>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}
                  onClick={() => completeTreatmentMut.mutate(confirmComplete.id)} disabled={completeTreatmentMut.isPending} >
                  {completeTreatmentMut.isPending ? 'Guardando...' : 'Sí, completar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: editar tratamiento ──────────────────────────────────── */}
      {editTreatment && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%)' }}>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }} />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Editar tratamiento</h3>
                </div>
                <button onClick={() => setEditTreatment(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/60 text-gray-500 hover:bg-white transition-colors"><CloseIcon /></button>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm font-semibold text-gray-800">{editTreatment.name}</p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { value: 'IN_PROGRESS', label: 'En curso',   color: 'bg-[#E6F7FD] text-[#0077B6] border-[#00AEEF]' },
                    { value: 'COMPLETED',   label: 'Completado', color: 'bg-green-50 text-green-700 border-green-400' },
                    { value: 'CANCELLED',   label: 'Anulado',    color: 'bg-red-50 text-red-500 border-red-400' },
                  ] as const).map(opt => (
                    <button key={opt.value} type="button" onClick={() => setEditTreatmentForm(f => ({ ...f, status: opt.value }))}
                      className={`py-2 rounded-lg text-xs font-semibold border-2 transition-all ${editTreatmentForm.status === opt.value ? opt.color : 'bg-white text-gray-400 border-gray-200'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Costo (S/)</label>
                <input type="number" min="0" step="0.01"
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={editTreatmentForm.cost} onChange={e => setEditTreatmentForm(f => ({ ...f, cost: e.target.value }))} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Descripción</label>
                <input className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white"
                  value={editTreatmentForm.description} onChange={e => setEditTreatmentForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción del tratamiento..." />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notas</label>
                <textarea rows={2}
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white resize-none"
                  value={editTreatmentForm.notes} onChange={e => setEditTreatmentForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100" onClick={() => setEditTreatment(null)}>Cancelar</button>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-xl disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}
                  onClick={() => editTreatmentMut.mutate(editTreatment.id)}
                  disabled={editTreatmentMut.isPending || !editTreatmentForm.cost}>
                  {editTreatmentMut.isPending ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals de formularios ──────────────────────────────────────── */}
      {showTreatmentForm && (
        <TreatmentForm onClose={() => setShowTreatmentForm(false)} onSubmit={d => createTreatmentMut.mutate(d)} loading={createTreatmentMut.isPending} fixedPatientId={id} />
      )}

      {showEdit && (
        <PatientForm title="Editar paciente" initial={patient} isEdit onClose={() => setShowEdit(false)} onSubmit={d => updateMut.mutate(d)} loading={updateMut.isPending} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="px-6 py-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#fff5f5 0%,#fee2e2 100%)' }}>
              <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }} />
              <div className="flex items-center gap-3 relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Eliminar paciente</h3>
                  <p className="text-xs text-red-500 font-medium">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 mb-5">
                ¿Estás seguro de eliminar a <strong>{patient.name} {patient.lastName}</strong>? Se borrarán todos sus datos, tratamientos y pagos.
              </p>
              <div className="flex justify-end gap-2">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100" onClick={() => setConfirmDelete(false)}>Cancelar</button>
                <button className="px-4 py-2 text-sm font-medium text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}
                  onClick={() => deleteMut.mutate()} disabled={deleteMut.isPending}>
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
