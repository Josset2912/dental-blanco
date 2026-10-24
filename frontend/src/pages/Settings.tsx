import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getUser, changePassword } from '../api/auth';
import { getClinicProfile, updateClinicProfile } from '../api/clinic-profile';
import type { ClinicProfile } from '../api/clinic-profile';

function CardSection({ icon, gradient, title, children }: {
  icon: string; gradient: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-card overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: gradient }}>
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon}/>
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

export default function Settings() {
  const user = getUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [clinic, setClinic] = useState<Omit<ClinicProfile, 'id'>>({
    name: 'Blanco Dental',
    phone: '',
    email: '',
    address: '',
    city: '',
    schedule: 'Lun–Vie 8:00–18:00',
  });

  const { data: clinicData } = useQuery({
    queryKey: ['clinic-profile'],
    queryFn: getClinicProfile,
  });

  useEffect(() => {
    if (clinicData) {
      setClinic({ name: clinicData.name, phone: clinicData.phone, email: clinicData.email, address: clinicData.address, city: clinicData.city, schedule: clinicData.schedule });
    }
  }, [clinicData]);

  const saveClinicMut = useMutation({
    mutationFn: () => updateClinicProfile(clinic),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clinic-profile'] });
      toast.success('Perfil de clínica guardado');
    },
    onError: () => toast.error('Error al guardar el perfil'),
  });

  const saveClinic = (e: React.FormEvent) => {
    e.preventDefault();
    saveClinicMut.mutate();
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const inputClass = 'w-full px-3 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 bg-[#F6F8FA] focus:bg-white transition-all';
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?';

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-1 h-8 bg-gradient-to-b from-[#00AEEF] to-[#005F8E] rounded-full shrink-0" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Configuración</h2>
          <p className="text-sm text-gray-500 mt-0.5">Ajustes de cuenta y clínica</p>
        </div>
      </div>

      {/* Perfil de la clínica */}
      <CardSection
        icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        gradient="linear-gradient(135deg,#00AEEF,#005F8E)"
        title="Perfil de la clínica"
      >
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
          <div className="sm:col-span-2 flex justify-end pt-1">
            <button type="submit" disabled={saveClinicMut.isPending}
              className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all flex items-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
              {saveClinicMut.isPending ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </CardSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Información de la cuenta */}
        <CardSection
          icon="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)"
          title="Información de la cuenta"
        >
          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold text-white shrink-0 shadow-md"
              style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 truncate">{user?.name}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 bg-[#00AEEF]/[0.09] text-[#005F8E] text-xs font-semibold rounded-md">
                {user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
              </span>
            </div>
          </div>
          <div className="space-y-0 divide-y divide-gray-50 border-t border-gray-100 pt-4">
            {[
              { label: 'Nombre completo', value: user?.name },
              { label: 'Correo electrónico', value: user?.email },
              { label: 'Rol', value: user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-gray-500 text-xs font-medium">{row.label}</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{row.value}</span>
              </div>
            ))}
          </div>
        </CardSection>

        {/* Cambiar contraseña */}
        <CardSection
          icon="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          gradient="linear-gradient(135deg,#f59e0b,#d97706)"
          title="Cambiar contraseña"
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Contraseña actual</label>
              <input type="password" className={inputClass} value={form.currentPassword} onChange={set('currentPassword')} placeholder="••••••••" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Nueva contraseña</label>
              <input type="password" className={inputClass} value={form.newPassword} onChange={set('newPassword')} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600">Confirmar contraseña</label>
              <input type="password"
                className={`${inputClass} ${mismatch ? '!border-red-300 focus:!border-red-400 focus:!ring-red-100' : ''}`}
                value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repite la nueva contraseña" required />
              {mismatch && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Las contraseñas no coinciden
                </p>
              )}
            </div>
            <button type="submit" disabled={!canSubmit || changeMut.isPending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
              {changeMut.isPending ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Guardando...
                </>
              ) : 'Actualizar contraseña'}
            </button>
          </form>
        </CardSection>
      </div>

      {/* Sesión */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900">Sesión</h3>
        </div>
        <div className="px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Cerrar sesión</p>
            <p className="text-xs text-gray-500 mt-0.5">Saldrás de la cuenta en este dispositivo</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors shrink-0"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <p className="text-center text-[11px] text-gray-300 pb-2">Sistema de gestión clínica · v1.0</p>
    </div>
  );
}
