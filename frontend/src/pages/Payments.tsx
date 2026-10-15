import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayments, getPaymentSummary, createPayment, deletePayment } from '../api/payments';
import type { Payment } from '../api/payments';
import PaymentForm from '../components/PaymentForm';

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/>
  </svg>
);

const METHOD_LABEL: Record<string, string> = { CASH: 'Efectivo', CARD: 'Tarjeta', TRANSFER: 'Transferencia' };
const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700',
  CARD: 'bg-[#E6F7FD] text-blue-700',
  TRANSFER: 'bg-purple-50 text-purple-700',
};

function fmt(amount: number | string) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(amount));
}

export default function Payments() {
  const [showForm, setShowForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const qc = useQueryClient();

  const { data: payments = [], isLoading } = useQuery({ queryKey: ['payments'], queryFn: () => getPayments() });
  const { data: summary } = useQuery({ queryKey: ['payments-summary'], queryFn: getPaymentSummary });

  const createMut = useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payments-summary'] });
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: deletePayment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payments'] });
      qc.invalidateQueries({ queryKey: ['payments-summary'] });
      setConfirmDelete(null);
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pagos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{payments.length} registro{payments.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-1.5 px-4 py-2 text-white transition-colors" style={{ background: "linear-gradient(135deg,#00AEEF,#0077B6)" }}>
          <PlusIcon /> Registrar pago
        </button>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Ingresos este mes', value: fmt(summary.monthRevenue), color: 'bg-green-50 text-green-600', icon: '↑' },
            { label: 'Ingresos totales', value: fmt(summary.totalRevenue), color: 'bg-[#E6F7FD] text-[#0077B6]', icon: '$' },
            { label: 'Pagos este mes', value: String(summary.countMonth), color: 'bg-purple-50 text-purple-600', icon: '#' },
            { label: 'Pagos totales', value: String(summary.countTotal), color: 'bg-gray-100 text-gray-600', icon: '∑' },
          ].map(c => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-5 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-content text-lg font-bold shrink-0 ${c.color}`}>
                <span className="w-full text-center">{c.icon}</span>
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{c.value}</p>
                <p className="text-xs text-gray-500">{c.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Cargando pagos...</div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a5 5 0 00-10 0v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2z"/>
            </svg>
            <p className="text-sm text-gray-500 font-medium">Sin pagos registrados</p>
            <p className="text-xs text-gray-400 mt-1">Registra el primer pago con el botón de arriba</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['Fecha', 'Paciente', 'Concepto', 'Tratamiento', 'Método', 'Monto', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p: Payment, i) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${i < payments.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3.5 text-sm font-medium text-gray-900">
                      {p.patient.name} {p.patient.lastName}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-gray-700">{p.concept}</td>
                    <td className="px-4 py-3.5 text-sm text-gray-500">{p.treatment?.name ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${METHOD_COLORS[p.method]}`}>
                        {METHOD_LABEL[p.method]}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => setConfirmDelete(p.id)}
                        className="px-2.5 py-1 text-xs font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50">
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

      {showForm && (
        <PaymentForm
          onClose={() => setShowForm(false)}
          onSubmit={data => createMut.mutate(data)}
          loading={createMut.isPending}
          error={createMut.isError ? 'Error al registrar el pago' : ''}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">Eliminar pago</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-700 mb-5">¿Estás seguro de eliminar este registro de pago?</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100">Cancelar</button>
                <button onClick={() => deleteMut.mutate(confirmDelete)} disabled={deleteMut.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-60">
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
