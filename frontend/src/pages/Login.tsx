import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../api/auth';
import { logoBase64 } from '../utils/logoBase64';

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
        className="hidden lg:flex lg:w-[52%] flex-col items-center justify-center relative overflow-hidden p-12"
        style={{ background: 'linear-gradient(160deg, #003A5C 0%, #005F8E 45%, #0090D4 100%)' }}
      >
        {/* Cuadrícula arquitectónica — deliberada */}
        <div className="absolute inset-0 bg-grid-white" />

        {/* Anillos concéntricos centrados — elemento focal único */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full border border-white/[0.07]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-white/[0.09]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white/[0.10]" />

        {/* Glow sutil centrado */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,174,239,0.18) 0%, transparent 70%)' }} />

        <div className="relative z-10 text-center text-white max-w-xs">
          {/* Logo */}
          <div className="mb-8">
            <img src={logoBase64} alt="Blanco Dental" className="h-24 w-auto object-contain mx-auto drop-shadow-2xl" />
          </div>

          <p className="text-white/40 text-xs tracking-[0.2em] uppercase mb-10 font-medium">Sistema de gestión clínica</p>

          {/* Features — estilo minimal, línea horizontal */}
          <div className="flex flex-col gap-3 text-left">
            {[
              { icon: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z', label: 'Gestión de pacientes' },
              { icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', label: 'Control de citas' },
              { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', label: 'Tratamientos y pagos' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(0,174,239,0.2)' }}>
                  <svg className="w-4 h-4 text-[#7DCFEE]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon}/>
                  </svg>
                </div>
                <span className="text-[13px] text-white/75 font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ─────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white">

        {/* Logo mobile */}
        <div className="lg:hidden text-center mb-10">
          <div className="w-14 h-14 rounded-xl mx-auto mb-3 flex items-center justify-center shadow-card"
            style={{ background: 'linear-gradient(135deg, #00AEEF, #005F8E)' }}>
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5 5.5 3.5 3.5 2 2 3c-2 1.5-1.5 5 0 7l4 9c.5 1 1.5 1.5 2.5 1 .5-.3 1-.8 1.2-1.5l.8-3a1.5 1.5 0 013 0l.8 3c.2.7.7 1.2 1.2 1.5 1 .5 2 0 2.5-1l4-9c1.5-2 2-5.5 0-7-1.5-1-3.5.5-4.5 2.5C14.5 3.5 12.5 2 12 2z"/>
            </svg>
          </div>
          <h1 className="text-lg font-black" style={{ color: '#005F8E' }}>Blanco Dental</h1>
          <p className="text-[11px] text-gray-400 mt-0.5 tracking-[0.15em] uppercase font-medium">Sistema clínico</p>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8">
            <h2 className="text-[1.75rem] font-black text-gray-900 tracking-tight leading-tight">Bienvenido</h2>
            <p className="text-sm text-gray-400 mt-1.5 font-medium">Ingresa tus credenciales para continuar</p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Correo electrónico</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">
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
                  className="w-full pl-10 pr-4 py-3 border border-black/[0.1] rounded-xl text-sm outline-none bg-[#F6F8FA] transition-all focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 focus:bg-white placeholder-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Contraseña</label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300">
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
                  className="w-full pl-10 pr-11 py-3 border border-black/[0.1] rounded-xl text-sm outline-none bg-[#F6F8FA] transition-all focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 focus:bg-white placeholder-gray-300"
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
              className="mt-1 py-3.5 text-white font-bold rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md hover:brightness-110 active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #00AEEF, #005F8E)' }}
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

          <p className="text-center text-[11px] text-gray-300 mt-8 font-medium tracking-wide">
            Blanco Dental · Sistema clínico
          </p>
        </div>
      </div>
    </div>
  );
}
