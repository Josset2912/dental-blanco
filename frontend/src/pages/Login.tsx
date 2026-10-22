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

      {/* ── Panel izquierdo — branding desktop ────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
        style={{ background: '#00111E' }}
      >
        {/* Cuadrícula sutil de fondo */}
        <div className="absolute inset-0 bg-grid-white opacity-[0.03]" />

        {/* Glow cálido — extrae el naranja/dorado del logo */}
        <div
          className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.13) 0%, rgba(0,174,239,0.07) 55%, transparent 75%)' }}
        />

        {/* Glow azul secundario — abajo */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(0,174,239,0.09) 0%, transparent 70%)' }}
        />

        {/* Contenido principal */}
        <div className="relative z-10 flex flex-col h-full px-12 py-14">

          {/* Logo — zona focal superior */}
          <div className="flex-1 flex flex-col items-center justify-center">
            <img
              src={logoBase64}
              alt="Blanco Dental"
              className="w-auto object-contain select-none"
              style={{
                maxHeight: '160px',
                filter: 'drop-shadow(0 0 40px rgba(245,166,35,0.25)) drop-shadow(0 12px 40px rgba(0,174,239,0.2))',
              }}
            />

            {/* Tagline — tipografía como elemento de diseño */}
            <div className="mt-10 text-center">
              <p
                className="text-[11px] font-bold tracking-[0.35em] uppercase"
                style={{ color: 'rgba(255,255,255,0.25)' }}
              >
                Creamos arte en tu sonrisa
              </p>
              <div className="mt-4 flex items-center gap-3 justify-center">
                <div className="h-px flex-1 max-w-[60px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: 'rgba(0,174,239,0.5)' }} />
                <div className="h-px flex-1 max-w-[60px]" style={{ background: 'rgba(255,255,255,0.08)' }} />
              </div>
            </div>
          </div>

          {/* Features — zona inferior, minimalista */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: 'rgba(255,255,255,0.18)' }}>
              Plataforma clínica
            </p>
            {[
              { label: 'Pacientes, citas y tratamientos', icon: 'M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z' },
              { label: 'Pagos, reportes y odontograma', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { label: 'Imágenes clínicas y recibos PDF', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-3 py-2.5 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} style={{ color: 'rgba(0,174,239,0.6)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon}/>
                </svg>
                <span className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Panel derecho — formulario ─────────────────────────── */}
      <div className="flex-1 flex flex-col bg-[#F6F8FA]">

        {/* Barra superior sutil */}
        <div className="h-[3px] w-full shrink-0" style={{ background: 'linear-gradient(90deg, #00AEEF, #005F8E)' }} />

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">

          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-10">
            <img
              src={logoBase64}
              alt="Blanco Dental"
              className="h-14 w-auto object-contain mx-auto"
            />
          </div>

          {/* Card del formulario */}
          <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-card px-8 py-8">

            {/* Header */}
            <div className="mb-7">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-2" style={{ color: '#00AEEF' }}>
                Blanco Dental
              </p>
              <h2 className="text-[1.6rem] font-black text-gray-900 tracking-tight leading-tight">
                Bienvenido
              </h2>
              <p className="text-sm text-gray-400 mt-1 font-medium">
                Ingresa tus credenciales para continuar
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                    </svg>
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none bg-[#F6F8FA] transition-all focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 focus:bg-white placeholder-gray-300"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                    </svg>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none bg-[#F6F8FA] transition-all focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 focus:bg-white placeholder-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(p => !p)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
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
                className="mt-2 py-3 text-white font-bold rounded-xl text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:brightness-110 active:scale-[0.99] shadow-sm"
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
          </div>

          {/* Footer */}
          <p className="mt-6 text-[11px] text-gray-400 font-medium tracking-wide text-center">
            © {new Date().getFullYear()} Blanco Dental · Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
