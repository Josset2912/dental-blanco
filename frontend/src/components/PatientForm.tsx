import { useState } from 'react';
import type { Patient } from '../api/patients';

type FormData = Omit<Patient, 'id' | 'createdAt'>;

interface Props {
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  loading: boolean;
  initial?: Partial<FormData>;
  title?: string;
}

const inputClass = 'px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] w-full bg-white';

export default function PatientForm({ onClose, onSubmit, loading, initial = {}, title = 'Nuevo paciente' }: Props) {
  const [form, setForm] = useState<FormData>({
    name: initial.name ?? '',
    lastName: initial.lastName ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    birthDate: initial.birthDate ? initial.birthDate.slice(0, 10) : '',
    gender: initial.gender ?? 'MASCULINO',
    address: initial.address ?? '',
    allergies: initial.allergies ?? '',
    notes: initial.notes ?? '',
  });

  const set = (k: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          <button
            className="w-7 h-7 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            onClick={onClose}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Nombre *</label>
                <input className={inputClass} value={form.name} onChange={set('name')} required placeholder="Juan" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Apellidos *</label>
                <input className={inputClass} value={form.lastName} onChange={set('lastName')} required placeholder="Pérez García" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Teléfono *</label>
                <input className={inputClass} value={form.phone} onChange={set('phone')} required placeholder="555-1234" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
                <input className={inputClass} type="email" value={form.email} onChange={set('email')} placeholder="juan@email.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Fecha de nacimiento *</label>
                <input className={inputClass} type="date" value={form.birthDate} onChange={set('birthDate')} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Género *</label>
                <select className={inputClass} value={form.gender} onChange={set('gender')}>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Dirección</label>
                <input className={inputClass} value={form.address} onChange={set('address')} placeholder="Calle, colonia, ciudad" />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Alergias</label>
                <input className={inputClass} value={form.allergies} onChange={set('allergies')} placeholder="Penicilina, látex..." />
              </div>
              <div className="flex flex-col gap-1.5 col-span-2">
                <label className="text-sm font-medium text-gray-700">Notas adicionales</label>
                <textarea
                  className={`${inputClass} resize-y min-h-[80px]`}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="Observaciones importantes..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-[#00AEEF] rounded-lg hover:bg-[#0077B6] disabled:opacity-60 transition-colors"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar paciente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
