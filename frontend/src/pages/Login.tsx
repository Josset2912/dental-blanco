import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { toast } from 'sonner';
import { login } from '../api/auth';
import { logoBase64 } from '../utils/logoBase64';

// ── Grid texture for left panel ─────────────────────────────────────────
function GridTexture() {
  return (
    <svg
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M44 0L0 0 0 44" fill="none" stroke="white" strokeWidth="0.4" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" opacity="0.04" />
    </svg>
  );
}

// ── 3D Tooth hero illustration ──────────────────────────────────────────
function ToothHero({ reduced }: { reduced: boolean }) {
  const floatAnim = reduced ? {} : { y: [0, -10, 0] };
  const floatTrans = { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const };
  const orbitTrans = (d: number) => ({ duration: d, repeat: Infinity, ease: 'linear' as const });

  return (
    <div className="relative flex items-center justify-center select-none"
      style={{ width: 300, height: 340 }}>

      {/* Ambient glow blob */}
      <div className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 52%, rgba(0,174,239,0.28) 0%, rgba(0,84,166,0.1) 50%, transparent 72%)',
          filter: 'blur(22px)',
        }}
      />

      {/* Outer orbit ring */}
      {!reduced && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 220, height: 220,
            border: '1px solid rgba(0,174,239,0.18)',
            top: '50%', left: '50%',
            marginTop: -110, marginLeft: -110,
          }}
          animate={{ rotate: 360 }}
          transition={orbitTrans(28)}
        >
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #00AEEF, #0054A6)',
              boxShadow: '0 0 14px rgba(0,174,239,0.7)',
            }}
          />
          <div className="absolute -bottom-2 right-10 w-3 h-3 rounded-full"
            style={{ background: '#F7941D', boxShadow: '0 0 10px rgba(247,148,29,0.6)' }}
          />
        </motion.div>
      )}

      {/* Inner dashed ring */}
      {!reduced && (
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 155, height: 155,
            border: '1px dashed rgba(0,174,239,0.14)',
            top: '50%', left: '50%',
            marginTop: -77.5, marginLeft: -77.5,
          }}
          animate={{ rotate: -360 }}
          transition={orbitTrans(20)}
        />
      )}

      {/* Floating tooth */}
      <motion.div className="relative z-10"
        animate={floatAnim}
        transition={floatTrans}
      >
        <svg viewBox="0 0 160 210" width={155} height={210} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="tb" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#B8E8FF" />
              <stop offset="30%" stopColor="#38B8F0" />
              <stop offset="70%" stopColor="#0080C6" />
              <stop offset="100%" stopColor="#004F96" />
            </linearGradient>
            <linearGradient id="ts" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFD050" />
              <stop offset="100%" stopColor="#E07810" />
            </linearGradient>
            <linearGradient id="tband" x1="0%" y1="0%" x2="100%" y2="60%">
              <stop offset="0%" stopColor="#0054A6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00AEEF" stopOpacity="0.25" />
            </linearGradient>
            <filter id="tg" x="-30%" y="-20%" width="160%" height="150%">
              <feDropShadow dx="0" dy="8" stdDeviation="16" floodColor="#00AEEF" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Ground glow */}
          <ellipse cx="80" cy="205" rx="50" ry="7" fill="#00AEEF" opacity="0.16" />

          {/* Tooth body */}
          <path
            filter="url(#tg)"
            d="M44 46 C44 18 60 5 80 5 C100 5 116 18 116 46 C116 68 130 112 130 146 C130 168 118 177 103 177 C94 177 86 167 80 167 C74 167 66 177 57 177 C42 177 30 168 30 146 C30 112 44 68 44 46Z"
            fill="url(#tb)"
          />

          {/* Blue swirl band inspired by logo */}
          <path
            d="M26 115 C48 88 72 83 98 98 C118 110 132 106 143 92"
            stroke="url(#tband)" strokeWidth="10" fill="none"
            strokeLinecap="round"
          />

          {/* Upper gloss highlight */}
          <path
            d="M52 40 C52 20 63 10 77 8 C92 6 105 17 106 36"
            stroke="white" strokeWidth="8" strokeLinecap="round" fill="none" strokeOpacity="0.52"
          />
          {/* Secondary gloss dot */}
          <ellipse cx="61" cy="25" rx="10" ry="6" fill="white" fillOpacity="0.2"
            transform="rotate(-28 61 25)" />

          {/* Cusp detail lines */}
          <line x1="80" y1="82" x2="80" y2="164" stroke="rgba(0,55,110,0.14)" strokeWidth="1.5" />
          <line x1="53" y1="102" x2="107" y2="102" stroke="rgba(0,55,110,0.11)" strokeWidth="1.5" />

          {/* Implant screw */}
          <rect x="64" y="177" width="32" height="8" rx="3.5" fill="url(#ts)" />
          <rect x="66" y="185" width="28" height="7" rx="3" fill="#E57E12" />
          <rect x="68" y="192" width="24" height="6" rx="2.5" fill="#D56C0A" />
          <rect x="70" y="198" width="20" height="5" rx="2" fill="#C55E08" />
          <line x1="64" y1="181" x2="96" y2="181" stroke="white" strokeWidth="0.7" strokeOpacity="0.28" />
          <line x1="66" y1="188" x2="94" y2="188" stroke="white" strokeWidth="0.7" strokeOpacity="0.22" />
          <line x1="68" y1="195" x2="92" y2="195" stroke="white" strokeWidth="0.7" strokeOpacity="0.17" />
        </svg>
      </motion.div>

      {/* Sparkle dots */}
      {!reduced && ([
        { x: 14,  y: 65,  s: 6, c: '#00AEEF', d: 0 },
        { x: 272, y: 85,  s: 4, c: '#F7941D', d: 0.9 },
        { x: 8,   y: 210, s: 4, c: '#00AEEF', d: 1.6 },
        { x: 278, y: 230, s: 5, c: '#FFD04D', d: 0.4 },
        { x: 40,  y: 280, s: 3, c: '#00AEEF', d: 2.1 },
      ]).map((dot, i) => (
        <motion.div key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: dot.s, height: dot.s,
            background: dot.c,
            left: dot.x, top: dot.y,
            boxShadow: `0 0 ${dot.s * 2}px ${dot.c}`,
          }}
          animate={{ y: [0, -9, 0], opacity: [0.35, 0.95, 0.35] }}
          transition={{ duration: 2.8 + i * 0.35, repeat: Infinity, ease: 'easeInOut', delay: dot.d }}
        />
      ))}

      {/* Plus decoratives */}
      {!reduced && ([
        { x: 22,  y: 148, c: 'rgba(0,174,239,0.45)', d: 1 },
        { x: 266, y: 162, c: 'rgba(247,148,29,0.4)', d: 0.6 },
      ]).map((p, i) => (
        <motion.svg key={i} width={14} height={14} viewBox="0 0 14 14"
          className="absolute pointer-events-none"
          style={{ left: p.x, top: p.y }}
          animate={{ rotate: [0, 90, 0], opacity: [0.28, 0.7, 0.28] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: p.d }}
        >
          <line x1="7" y1="0" x2="7" y2="14" stroke={p.c} strokeWidth="2.2" />
          <line x1="0" y1="7" x2="14" y2="7" stroke={p.c} strokeWidth="2.2" />
        </motion.svg>
      ))}
    </div>
  );
}

// ── Main Login ──────────────────────────────────────────────────────────
export default function Login() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [remember, setRemember]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [focused, setFocused]     = useState<string | null>(null);
  const navigate                  = useNavigate();
  const reduced                   = useReducedMotion() ?? false;

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

  const inputStyle = (field: string): React.CSSProperties => ({
    background: focused === field ? '#FFFFFF' : '#EEF5FF',
    border: `1.5px solid ${focused === field ? '#00AEEF' : '#C8DEFF'}`,
    boxShadow: focused === field ? '0 0 0 3px rgba(0,174,239,0.13)' : 'none',
    color: '#0D1B2E',
    outline: 'none',
    transition: 'all 0.2s ease',
  });

  // Animation variants
  const panelLeft = {
    hidden:  { opacity: 0, x: reduced ? 0 : -28 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  };
  const panelRight = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
  };
  const formContainer = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.08, delayChildren: 0.35 } },
  };
  const formItem = {
    hidden:  { opacity: 0, y: reduced ? 0 : 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">

      {/* ══ LEFT — Visual panel ══════════════════════════════════════════ */}
      <motion.div
        variants={panelLeft}
        initial="hidden"
        animate="visible"
        className="relative lg:w-[56%] flex flex-col overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 25% 45%, #0B3D70 0%, #051A35 50%, #020C1B 100%)',
          minHeight: '200px',
        }}
      >
        <GridTexture />

        {/* Colored ambient orbs */}
        <div className="absolute top-[-80px] right-[-60px] w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,174,239,0.14) 0%, transparent 65%)', filter: 'blur(30px)' }}
        />
        <div className="absolute bottom-[-60px] left-[-40px] w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(247,148,29,0.10) 0%, transparent 65%)', filter: 'blur(25px)' }}
        />
        <div className="absolute bottom-[20%] right-[10%] w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,100,200,0.12) 0%, transparent 70%)', filter: 'blur(20px)' }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-8 py-8 lg:px-14 lg:py-12 flex-1">

          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <img
              src={logoBase64}
              alt="Blanco Dental"
              className="h-10 lg:h-14 w-auto object-contain select-none"
              draggable={false}
            />
          </motion.div>

          {/* Center content — desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center flex-1 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: reduced ? 1 : 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.25, ease: 'easeOut' }}
            >
              <ToothHero reduced={reduced} />
            </motion.div>

            <motion.div
              className="text-center max-w-[320px]"
              initial={{ opacity: 0, y: reduced ? 0 : 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.45 }}
            >
              <h1 className="text-3xl font-bold mb-3 leading-tight"
                style={{ color: 'rgba(255,255,255,0.95)' }}>
                Tu sonrisa,<br />
                <span style={{ color: '#00AEEF' }}>nuestra prioridad.</span>
              </h1>
              <p className="text-[14px] leading-relaxed"
                style={{ color: 'rgba(255,255,255,0.42)' }}>
                Gestiona tu clínica con una plataforma simple, segura y diseñada para profesionales.
              </p>
            </motion.div>

            {/* Trust pills — glassmorphism */}
            <motion.div
              className="flex gap-3 flex-wrap justify-center"
              initial={{ opacity: 0, y: reduced ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              {[
                { icon: '🦷', value: '247+', label: 'Pacientes' },
                { icon: '⭐', value: '98%', label: 'Satisfacción' },
                { icon: '🔒', value: 'SSL', label: 'Seguro' },
              ].map((stat) => (
                <div key={stat.value}
                  className="px-4 py-3 rounded-2xl flex items-center gap-2.5"
                  style={{
                    background: 'rgba(255,255,255,0.055)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.09)',
                  }}
                >
                  <span className="text-lg">{stat.icon}</span>
                  <div>
                    <p className="text-white font-bold text-sm leading-none">{stat.value}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{stat.label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Mobile tagline */}
          <div className="lg:hidden mt-3">
            <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
              Tu sonrisa, nuestra prioridad.
            </p>
          </div>

          {/* Footer copyright */}
          <p className="hidden lg:block text-[11px] mt-auto pt-6" style={{ color: 'rgba(255,255,255,0.16)' }}>
            © {new Date().getFullYear()} Blanco Dental · Todos los derechos reservados
          </p>
        </div>

        {/* Smile arc decoration */}
        <svg aria-hidden="true"
          className="absolute bottom-0 left-0 w-full pointer-events-none opacity-[0.04]"
          viewBox="0 0 600 100" preserveAspectRatio="none">
          <path d="M0 80 Q150 10 300 50 Q450 90 600 20" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      </motion.div>

      {/* ══ RIGHT — Auth panel ═══════════════════════════════════════════ */}
      <motion.div
        variants={panelRight}
        initial="hidden"
        animate="visible"
        className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-16"
        style={{ background: '#F4F8FF' }}
      >
        {/* Subtle top-right decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none hidden lg:block"
          style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(0,174,239,0.07) 0%, transparent 60%)',
          }}
        />

        <motion.div
          className="w-full max-w-[400px] relative"
          variants={formContainer}
          initial="hidden"
          animate="visible"
        >

          {/* Header */}
          <motion.div variants={formItem} className="mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(0,174,239,0.08)', border: '1px solid rgba(0,174,239,0.18)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#00AEEF] animate-pulse" />
              <span className="text-[11px] font-semibold" style={{ color: '#0080C6' }}>
                Sistema de Gestión Clínica
              </span>
            </div>
            <h2 className="text-[1.85rem] font-bold leading-tight mb-2" style={{ color: '#0D1B2E' }}>
              Bienvenido de nuevo
            </h2>
            <p className="text-[14px]" style={{ color: '#6B7280' }}>
              Accede a tu espacio de Blanco Dental
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Email */}
            <motion.div variants={formItem}>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#374151' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                  style={{ color: focused === 'email' ? '#00AEEF' : '#9CA3AF' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="correo@ejemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-[14px]"
                  style={inputStyle('email')}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={formItem}>
              <label className="block text-[13px] font-semibold mb-1.5" style={{ color: '#374151' }}>
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors"
                  style={{ color: focused === 'pass' ? '#00AEEF' : '#9CA3AF' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-xl text-[14px]"
                  style={inputStyle('pass')}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-60 transition-opacity"
                  style={{ color: '#9CA3AF' }}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Remember + forgot */}
            <motion.div variants={formItem} className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="sr-only"
                  />
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                    style={{
                      background: remember ? '#00AEEF' : 'white',
                      border: `1.5px solid ${remember ? '#00AEEF' : '#C8DEFF'}`,
                      boxShadow: remember ? '0 0 0 2px rgba(0,174,239,0.2)' : 'none',
                    }}
                    onClick={() => setRemember(r => !r)}
                  >
                    {remember && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[13px]" style={{ color: '#4B5563' }}>Recordarme</span>
              </label>
              <button type="button"
                className="text-[13px] font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#0080C6' }}>
                ¿Olvidaste tu contraseña?
              </button>
            </motion.div>

            {/* Submit button */}
            <motion.div variants={formItem}>
              <motion.button
                type="submit"
                disabled={loading}
                className="relative w-full py-3.5 rounded-xl text-[14px] font-bold text-white overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #00AEEF 0%, #0075C9 55%, #004FA6 100%)' }}
                whileHover={reduced ? {} : { scale: 1.01, boxShadow: '0 8px 28px rgba(0,174,239,0.35)' }}
                whileTap={reduced ? {} : { scale: 0.99 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {/* Shimmer sweep */}
                {!loading && !reduced && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
                    }}
                    animate={{ x: ['-100%', '220%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 0.8 }}
                  />
                )}
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Verificando acceso...
                  </span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    Iniciar sesión
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </motion.button>
            </motion.div>

          </form>

          {/* Secure badge */}
          <motion.div
            variants={formItem}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,174,239,0.06)', border: '1px solid rgba(0,174,239,0.14)' }}>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="#00AEEF" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-[11px] font-medium" style={{ color: '#0080C6' }}>
                Acceso seguro y cifrado
              </span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

    </div>
  );
}
