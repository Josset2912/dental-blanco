import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: '#00111E' }}
    >
      {/* Glow cálido — extrae el naranja/dorado del logo "Blanco" */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '15%', left: '50%', transform: 'translateX(-50%)',
          width: '600px', height: '500px',
          background: 'radial-gradient(ellipse at 50% 30%, rgba(245,166,35,0.18) 0%, rgba(245,100,20,0.08) 35%, transparent 65%)',
        }}
      />
      {/* Glow frío — cyan de marca */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '5%', left: '50%', transform: 'translateX(-50%)',
          width: '700px', height: '400px',
          background: 'radial-gradient(ellipse at 50% 70%, rgba(0,174,239,0.10) 0%, transparent 65%)',
        }}
      />

      {/* Composición central */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[400px]">

        {/* Logo — héroe sobre el fondo oscuro, fuera de la card */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mb-8"
        >
          <img
            src={logoBase64}
            alt="Blanco Dental"
            className="w-auto object-contain select-none"
            style={{
              height: '100px',
              filter:
                'drop-shadow(0 0 28px rgba(245,166,35,0.30)) drop-shadow(0 6px 24px rgba(0,174,239,0.22))',
            }}
          />
        </motion.div>

        {/* Card de formulario — glass flotante */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut', delay: 0.12 }}
          className="w-full rounded-2xl px-7 py-8"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          <div className="mb-7">
            <h1
              className="text-[1.55rem] font-extrabold leading-tight"
              style={{ color: 'rgba(255,255,255,0.92)' }}
            >
              Bienvenido de vuelta
            </h1>
            <p className="text-sm mt-1.5 font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>

            {/* Correo */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[12px] font-semibold"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.88)',
                }}
                onFocus={e => {
                  e.currentTarget.style.border = '1px solid rgba(0,174,239,0.55)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,174,239,0.10)';
                }}
                onBlur={e => {
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[12px] font-semibold"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all placeholder:opacity-30"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    color: 'rgba(255,255,255,0.88)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1px solid rgba(0,174,239,0.55)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,174,239,0.10)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1px solid rgba(255,255,255,0.10)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-80"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
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

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="mt-1 py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
              style={{ background: 'linear-gradient(135deg, #00AEEF 0%, #005F8E 100%)' }}
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
        </motion.div>

        {/* Footer */}
        <p className="mt-6 text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.18)' }}>
          © {new Date().getFullYear()} Blanco Dental
        </p>
      </div>
    </div>
  );
}
