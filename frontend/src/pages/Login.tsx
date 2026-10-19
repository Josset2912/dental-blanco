import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { login } from '../api/auth';

export default function Login() {
  const [email, setEmail]       = useState('doctor@dentalblanco.com');
  const [password, setPassword] = useState('');
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
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #E6F7FD 0%, #f0f9ff 50%, #FEF3E2 100%)' }}
    >
      <div className="bg-white rounded-2xl border border-gray-100 p-10 w-full max-w-sm shadow-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00AEEF 0%, #0077B6 100%)' }}
          >
            <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C9.5 2 7.5 3.5 6.5 5.5 5.5 3.5 3.5 2 2 3c-2 1.5-1.5 5 0 7l4 9c.5 1 1.5 1.5 2.5 1 .5-.3 1-.8 1.2-1.5l.8-3a1.5 1.5 0 013 0l.8 3c.2.7.7 1.2 1.2 1.5 1 .5 2 0 2.5-1l4-9c1.5-2 2-5.5 0-7-1.5-1-3.5.5-4.5 2.5C14.5 3.5 12.5 2 12 2z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#0077B6' }}>Blanco Dental</h1>
          <p className="text-xs text-gray-400 mt-0.5 tracking-wide uppercase">Creamos arte en tu sonrisa</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="doctor@dentalblanco.com"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none transition-all"
              style={{ '--tw-ring-color': '#00AEEF' } as React.CSSProperties}
              onFocus={e => { e.target.style.borderColor = '#00AEEF'; e.target.style.boxShadow = '0 0 0 3px rgba(0,174,239,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none transition-all"
              onFocus={e => { e.target.style.borderColor = '#00AEEF'; e.target.style.boxShadow = '0 0 0 3px rgba(0,174,239,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none'; }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-2.5 text-white font-semibold rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            style={{ background: loading ? '#0090CC' : 'linear-gradient(135deg, #00AEEF, #0077B6)' }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #0090CC, #005A90)'; }}
            onMouseLeave={e => { if (!loading) (e.target as HTMLElement).style.background = 'linear-gradient(135deg, #00AEEF, #0077B6)'; }}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="text-center text-[11px] text-gray-300 mt-6">
          Sistema de gestión clínica · v1.0
        </p>
      </div>
    </div>
  );
}
