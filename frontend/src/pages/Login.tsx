import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../api/auth';

export default function Login() {
  const [email, setEmail]       = useState('doctor@dentalblanco.com');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      toast.error('Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo (branding) — solo desktop ─────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(145deg, #0077B6 0%, #00AEEF 60%, #48CAE4 100%)' }}
      >
        {/* Círculos decorativos */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute -bottom-32 -right-20 w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'white' }} />
        <div className="absolute top-1/2 -right-16 w-48 h-48 rounded-full opacity-10" style={{ background: 'white' }} />

        <div className="relative z-10 text-center text-white max-w-sm">
          {/* Logo grande */}
          <div className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5 5.5 3.5 3.5 2 2 3c-2 1.5-1.5 5 0 7l4 9c.5 1 1.5 1.5 2.5 1 .5-.3 1-.8 1.2-1.5l.8-3a1.5 1.5 0 013 0l.8 3c.2.7.7 1.2 1.2 1.5 1 .5 2 0 2.5-1l4-9c1.5-2 2-5.5 0-7-1.5-1-3.5.5-4.5 2.5C14.5 3.5 12.5 2 12 2z"/>
            </svg>
          </div>

          <h1 className="text-4xl font-bold mb-2 tracking-tight">Blanco Dental</h1>
          <p className="text-blue-100 text-sm tracking-widest uppercase mb-10">Creamos arte en tu sonrisa</p>

          {/* Feature list */}
          <div className="flex flex-col gap-4 text-left">
            {[
              { icon: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z', label: 'Gestión de pacientes' },
              { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Control de citas' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Tratamientos y pagos' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon}/>
                  </svg>
                </div>
                <span className="text-sm text-blue-50 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-gray-50 lg:bg-white">

        {/* Logo mobile */}
        <div className="lg:hidden text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #00AEEF, #0077B6)' }}>
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5 5.5 3.5 3.5 2 2 3c-2 1.5-1.5 5 0 7l4 9c.5 1 1.5 1.5 2.5 1 .5-.3 1-.8 1.2-1.5l.8-3a1.5 1.5 0 013 0l.8 3c.2.7.7 1.2 1.2 1.5 1 .5 2 0 2.5-1l4-9c1.5-2 2-5.5 0-7-1.5-1-3.5.5-4.5 2.5C14.5 3.5 12.5 2 12 2z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0077B6' }}>Blanco Dental</h1>
          <p className="text-xs text-gray-400 mt-0.5 tracking-widest uppercase">Creamos arte en tu sonrisa</p>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido de nuevo</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Correo electrónico</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 transition-all focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] focus:bg-white"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Contraseña</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-xl text-sm outline-none bg-gray-50 transition-all focus:border-[#00AEEF] focus:ring-2 focus:ring-[#E6F7FD] focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 text-white font-semibold rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #00AEEF, #0077B6)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-[11px] text-gray-300 mt-8">
            Sistema de gestión clínica · v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
