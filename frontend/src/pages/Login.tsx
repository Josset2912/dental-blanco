import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { login } from '../api/auth';
import { logoBase64 } from '../utils/logoBase64';

function LeftPanelDecor() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 420 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Large organic arc — tooth-silhouette inspired */}
      <path
        d="M260 830 C345 745 420 640 420 518 C420 415 370 336 288 308 C238 292 192 316 178 360"
        stroke="white" strokeWidth="1.5" strokeOpacity="0.07"
      />
      {/* Smile arc — mid panel */}
      <path
        d="M25 490 C100 558 215 578 345 536"
        stroke="white" strokeWidth="1.2" strokeOpacity="0.06"
      />
      {/* Top-right concentric circles */}
      <circle cx="385" cy="98" r="72" stroke="white" strokeWidth="1" strokeOpacity="0.055" />
      <circle cx="385" cy="98" r="48" stroke="white" strokeWidth="0.7" strokeOpacity="0.04" />
      {/* Dot cluster — lower left */}
      <circle cx="45"  cy="752" r="4"   fill="white" fillOpacity="0.06" />
      <circle cx="68"  cy="774" r="2.5" fill="white" fillOpacity="0.05" />
      <circle cx="38"  cy="792" r="2"   fill="white" fillOpacity="0.055" />
      <circle cx="83"  cy="759" r="3"   fill="white" fillOpacity="0.045" />
      <circle cx="55"  cy="812" r="2"   fill="white" fillOpacity="0.04" />
      <circle cx="93"  cy="786" r="1.5" fill="white" fillOpacity="0.035" />
      {/* Top-left corner fill */}
      <path d="M0 0 L96 0 C68 38 38 68 0 88 Z" fill="white" fillOpacity="0.025" />
    </svg>
  );
}

export default function Login() {
  const [email, setEmail]       = useState('doctor@dentalblanco.com');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
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

  const inputBase: React.CSSProperties = {
    background: '#F3F2EF',
    border: '1.5px solid #E4E2DD',
    color: '#111827',
  };

  function onInputFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.border = '1.5px solid #0D2137';
    e.currentTarget.style.background = '#FFFFFF';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(13,33,55,0.06)';
  }
  function onInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    e.currentTarget.style.border = '1.5px solid #E4E2DD';
    e.currentTarget.style.background = '#F3F2EF';
    e.currentTarget.style.boxShadow = 'none';
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left panel: brand identity ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="relative lg:w-[42%] overflow-hidden flex flex-col"
        style={{ background: '#0D2137', minHeight: '190px' }}
      >
        <LeftPanelDecor />

        <div className="relative z-10 flex flex-col justify-between flex-1 px-8 py-10 lg:px-14 lg:py-14">
          {/* Logo */}
          <div>
            <img
              src={logoBase64}
              alt="Blanco Dental"
              className="h-10 lg:h-[66px] w-auto object-contain select-none"
            />
          </div>

          {/* Headline — desktop only */}
          <div className="hidden lg:flex flex-col gap-4 max-w-[285px]">
            <h1
              className="text-[2.35rem] font-bold leading-[1.2]"
              style={{ color: 'rgba(255,255,255,0.94)' }}
            >
              Tu clínica,<br />en buenas manos.
            </h1>
            <p
              className="text-[15px] leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.40)' }}
            >
              Gestiona tu clínica con una experiencia simple, segura y eficiente.
            </p>
          </div>

          {/* Copyright — desktop */}
          <p className="hidden lg:block text-[11px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
            © {new Date().getFullYear()} Blanco Dental
          </p>
        </div>
      </motion.div>

      {/* ── Right panel: form ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.18 }}
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16"
        style={{ background: '#FAFAF9' }}
      >
        <div className="w-full max-w-[400px]">

          <div className="mb-8">
            <h2
              className="text-[1.75rem] font-bold leading-tight mb-2"
              style={{ color: '#111827' }}
            >
              Bienvenido de nuevo
            </h2>
            <p className="text-[14px]" style={{ color: '#6B7280' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">

            {/* Email */}
            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: '#374151' }}
              >
                Correo electrónico
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9CA3AF' }}
                >
                  <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-[14px] outline-none transition-all"
                  style={inputBase}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[13px] font-medium mb-1.5"
                style={{ color: '#374151' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <span
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#9CA3AF' }}
                >
                  <svg className="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl text-[14px] outline-none transition-all"
                  style={inputBase}
                  onFocus={onInputFocus}
                  onBlur={onInputBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
                  style={{ color: '#9CA3AF' }}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={e => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                  style={{ accentColor: '#0D2137' }}
                />
                <span className="text-[13px]" style={{ color: '#4B5563' }}>Recordarme</span>
              </label>
              <button
                type="button"
                className="text-[13px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: '#0D2137' }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full py-3 rounded-xl text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#0D2137' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth={4}/>
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Ingresando...
                </span>
              ) : 'Iniciar sesión'}
            </button>

            {/* Footer */}
            <p
              className="text-center text-[11.5px] mt-1"
              style={{ color: '#B0ADAA' }}
            >
              Acceso exclusivo para personal autorizado
            </p>

          </form>
        </div>
      </motion.div>

    </div>
  );
}
