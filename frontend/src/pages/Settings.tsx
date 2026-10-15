import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { getUser, changePassword } from '../api/auth';

export default function Settings() {
  const user = getUser();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [success, setSuccess] = useState(false);

  const changeMut = useMutation({
    mutationFn: () => changePassword(form.currentPassword, form.newPassword),
    onSuccess: () => {
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(false), 4000);
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
        <p className="text-sm text-gray-500 mt-0.5">Ajustes de tu cuenta</p>
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

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2.5 rounded-lg mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
              Contraseña actualizada correctamente
            </div>
          )}

          {changeMut.isError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2.5 rounded-lg mb-4">
              {(changeMut.error as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al cambiar contraseña'}
            </div>
          )}

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
