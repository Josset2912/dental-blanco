import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getUser, changePassword } from '../api/auth';

function loadClinic() {
  try {
    return JSON.parse(localStorage.getItem('clinic_profile') ?? '{}');
  } catch { return {}; }
}

export default function Settings() {
  const user = getUser();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  interface ClinicProfile { name: string; phone: string; email: string; address: string; city: string; schedule: string; }
  const [clinic, setClinic] = useState<ClinicProfile>({
    name: 'Blanco Dental',
    phone: '',
    email: '',
    address: '',
    city: '',
    schedule: 'Lun–Vie 8:00–18:00',
    ...loadClinic(),
  });
  const [clinicSaved, setClinicSaved] = useState(false);

  const saveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    try { localStorage.setItem('clinic_profile', JSON.stringify(clinic)); } catch {}
    setClinicSaved(true);
    setTimeout(() => setClinicSaved(false), 2000);
    toast.success('Perfil de clínica guardado');
  };

  const changeMut = useMutation({
    mutationFn: () => changePassword(form.currentPassword, form.newPassword),
    onSuccess: () => {
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Contraseña actualizada correctamente');
    },
    onError: (err: { response?: { data?: { error?: string } } }) => {
      toast.error(err?.response?.data?.error ?? 'Error al cambiar contraseña');
    },
  });

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }));

  const mismatch = form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword;
  const canSubmit = form.currentPassword && form.newPassword.length >= 6 && form.newPassword === form.confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    changeMut.mutate();
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] bg-white';

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ajustes de cuenta y clínica</p>
      </div>

      {/* Clinic profile */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
            <svg className="w-4.5 h-4.5 text-white w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Perfil de la clínica</h3>
        </div>
        <form onSubmit={saveClinic} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Nombre de la clínica</label>
            <input className={inputClass} value={clinic.name} onChange={e => setClinic(c => ({ ...c, name: e.target.value }))} placeholder="Blanco Dental" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Teléfono</label>
            <input className={inputClass} value={clinic.phone} onChange={e => setClinic(c => ({ ...c, phone: e.target.value }))} placeholder="+51 999 999 999" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Correo de contacto</label>
            <input type="email" className={inputClass} value={clinic.email} onChange={e => setClinic(c => ({ ...c, email: e.target.value }))} placeholder="contacto@blancodental.com" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Horario de atención</label>
            <input className={inputClass} value={clinic.schedule} onChange={e => setClinic(c => ({ ...c, schedule: e.target.value }))} placeholder="Lun–Vie 8:00–18:00" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Dirección</label>
            <input className={inputClass} value={clinic.address} onChange={e => setClinic(c => ({ ...c, address: e.target.value }))} placeholder="Av. Principal 123" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-600">Ciudad</label>
            <input className={inputClass} value={clinic.city} onChange={e => setClinic(c => ({ ...c, city: e.target.value }))} placeholder="Lima" />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <button type="submit"
              className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all"
              style={{ background: clinicSaved ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#00AEEF,#0077B6)' }}>
              {clinicSaved ? '✓ Guardado' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile info */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Información de la cuenta</h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-[#E6F7FD] text-[#0077B6] flex items-center justify-center text-lg font-bold shrink-0">
              {user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 bg-[#E6F7FD] text-[#0077B6] text-xs font-semibold rounded-full">
                {user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
              </span>
            </div>
          </div>
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm py-2">
              <span className="text-gray-500">Nombre</span>
              <span className="font-medium text-gray-900">{user?.name}</span>
            </div>
            <div className="flex justify-between text-sm py-2">
              <span className="text-gray-500">Correo</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-5">Cambiar contraseña</h3>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Contraseña actual</label>
              <input type="password" className={inputClass} value={form.currentPassword} onChange={set('currentPassword')} placeholder="••••••••" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nueva contraseña</label>
              <input type="password" className={inputClass} value={form.newPassword} onChange={set('newPassword')} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
              <input type="password"
                className={`${inputClass} ${mismatch ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''}`}
                value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repite la nueva contraseña" required />
              {mismatch && <p className="text-xs text-red-500">Las contraseñas no coinciden</p>}
            </div>
            <div className="pt-2">
              <button type="submit" disabled={!canSubmit || changeMut.isPending}
                className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50" style={{ background: 'linear-gradient(135deg,#00AEEF,#0077B6)' }} onMouseEnter={e=>(e.currentTarget.style.background='linear-gradient(135deg,#0090CC,#005A90)')} onMouseLeave={e=>(e.currentTarget.style.background='linear-gradient(135deg,#00AEEF,#0077B6)')}>
                {changeMut.isPending ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
