import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { getUser, logout } from '../api/auth';
import { getPatients } from '../api/patients';
import { getDashboard } from '../api/dashboard';
import { logoBase64 } from '../utils/logoBase64';

// ─── Icons ────────────────────────────────────────────────────────────────────

const icons = {
  dashboard: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  ),
  patients: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5M12 12a4 4 0 100-8 4 4 0 000 8z"/>
    </svg>
  ),
  appointments: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  treatments: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
    </svg>
  ),
  payments: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  reports: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  settings: (
    <svg className="w-[18px] h-[18px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  logout: (
    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
    </svg>
  ),
  chevronLeft: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
    </svg>
  ),
  chevronRight: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
    </svg>
  ),
};

const mainNav = [
  { to: '/dashboard',    icon: icons.dashboard,    label: 'Dashboard' },
  { to: '/pacientes',    icon: icons.patients,     label: 'Pacientes' },
  { to: '/citas',        icon: icons.appointments, label: 'Citas' },
  { to: '/tratamientos', icon: icons.treatments,   label: 'Tratamientos' },
  { to: '/pagos',        icon: icons.payments,     label: 'Pagos' },
];

const secondaryNav = [
  { to: '/reportes',      icon: icons.reports,  label: 'Reportes' },
  { to: '/configuracion', icon: icons.settings, label: 'Configuración' },
];

// mobile bottom nav — 4 main items + "Más"
const bottomNav = [
  { to: '/dashboard',    icon: icons.dashboard,    label: 'Inicio' },
  { to: '/pacientes',    icon: icons.patients,     label: 'Pacientes' },
  { to: '/citas',        icon: icons.appointments, label: 'Citas' },
  { to: '/pagos',        icon: icons.payments,     label: 'Pagos' },
];

const moreNav = [
  { to: '/tratamientos',  icon: icons.treatments, label: 'Tratamientos' },
  { to: '/reportes',      icon: icons.reports,    label: 'Reportes' },
  { to: '/configuracion', icon: icons.settings,   label: 'Config' },
];

// ─── Global Search ─────────────────────────────────────────────────────────────

function GlobalSearch({ collapsed }: { collapsed: boolean }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await getPatients(query.trim());
        setResults(data.slice(0, 6));
        setOpen(true);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (collapsed) return null;

  return (
    <div className="relative px-3 pt-3 pb-1">
      <div className="relative flex items-center">
        <svg className="absolute left-3 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder="Buscar paciente..."
          className="pl-8 pr-3 py-2 border border-black/[0.08] rounded-lg text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 w-full bg-[#F6F8FA] placeholder-gray-400 transition-all"
        />
        {loading && (
          <svg className="absolute right-3 w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        )}
      </div>
      {open && results.length > 0 && (
        <div ref={dropdownRef} className="absolute top-full left-3 right-3 mt-1.5 bg-white rounded-xl shadow-popover z-50 overflow-hidden">
          {results.map(p => (
            <button key={p.id} onClick={() => { setQuery(''); setResults([]); setOpen(false); navigate(`/pacientes/${p.id}`); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#F6F8FA] transition-colors text-left border-b border-black/[0.04] last:border-0">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
                {(p.name[0] ?? '').toUpperCase()}{(p.lastName[0] ?? '').toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{p.name} {p.lastName}</p>
                <p className="text-xs text-gray-400 truncate">{p.phone}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !loading && results.length === 0 && query.trim().length > 1 && (
        <div ref={dropdownRef} className="absolute top-full left-3 right-3 mt-1.5 bg-white rounded-xl shadow-popover z-50 px-4 py-3">
          <p className="text-sm text-gray-500">Sin resultados para "{query}"</p>
        </div>
      )}
    </div>
  );
}

// ─── Mobile Search Overlay ────────────────────────────────────────────────────

function MobileSearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const data = await getPatients(query.trim());
        setResults(data.slice(0, 8));
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Header with search input */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar paciente..."
            className="pl-9 pr-9 py-2.5 border border-black/[0.08] rounded-xl text-sm outline-none focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/10 w-full bg-[#F6F8FA] focus:bg-white placeholder-gray-400 transition-all"
          />
          {loading && (
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          )}
        </div>
        <button onClick={onClose} className="text-sm font-semibold text-[#00AEEF] shrink-0 hover:text-[#005F8E] transition-colors">
          Cancelar
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 bg-white overflow-y-auto" onClick={e => e.stopPropagation()}>
        {results.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {results.map(p => (
              <li key={p.id}>
                <button
                  onClick={() => { onClose(); navigate(`/pacientes/${p.id}`); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
                    {(p.name[0] ?? '').toUpperCase()}{(p.lastName[0] ?? '').toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.name} {p.lastName}</p>
                    <p className="text-xs text-gray-500">{p.phone}</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        ) : query.trim().length > 1 && !loading ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">Sin resultados para "{query}"</p>
          </div>
        ) : (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-400">Escribe para buscar pacientes</p>
          </div>
        )}
      </div>

      {/* Tap outside to close */}
      <div className="flex-shrink-0 h-safe-bottom bg-white" onClick={onClose} />
    </div>
  );
}

// ─── Page transition ──────────────────────────────────────────────────────────

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' as const }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ─── Nav item (sidebar) ───────────────────────────────────────────────────────

function SideNavItem({ to, icon, label, collapsed, onClick, badge }: {
  to: string; icon: React.ReactNode; label: string; collapsed: boolean; onClick?: () => void; badge?: number;
}) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `relative flex items-center gap-2.5 rounded-lg text-[13px] font-semibold transition-all group
        ${collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5'}
        ${isActive
          ? 'bg-[#00AEEF]/[0.09] text-[#005F8E]'
          : 'text-gray-500 hover:bg-black/[0.04] hover:text-gray-800'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[22px] bg-[#00AEEF] rounded-r-full" />
          )}
          <span className="relative shrink-0">
            {icon}
            {collapsed && badge != null && badge > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#00AEEF] rounded-full" />
            )}
          </span>
          {!collapsed && <span>{label}</span>}
          {!collapsed && badge != null && badge > 0 && (
            <span className="ml-auto px-1.5 py-0.5 bg-[#00AEEF] text-white text-[10px] font-bold rounded-md min-w-[18px] text-center leading-[14px]">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-2 px-2.5 py-1.5 text-xs font-semibold text-white bg-gray-900/90 backdrop-blur-sm rounded-lg shadow-popover opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function Layout() {
  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMore, setShowMore] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
  });

  const { data: dashData } = useQuery({ queryKey: ['dashboard'], queryFn: getDashboard, staleTime: 60_000 });
  const pendingToday = dashData?.stats?.appointmentsPending ?? 0;

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'DR';

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };

  const sidebarW = collapsed ? 'w-[60px]' : 'w-60';
  const mainML  = collapsed ? 'md:ml-[60px]' : 'md:ml-60';

  return (
    <div className="flex min-h-screen bg-[#F6F8FA]">
      {showMobileSearch && <MobileSearchOverlay onClose={() => setShowMobileSearch(false)} />}

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full ${sidebarW} bg-white flex-col z-30 shadow-sidebar transition-all duration-200`}>

        {/* Brand + collapse toggle */}
        <div className={`flex items-center border-b border-black/[0.06] h-14 ${collapsed ? 'justify-center px-2' : 'px-4 gap-2'}`}>
          {!collapsed && (
            <button type="button" onClick={() => navigate('/dashboard')} className="flex items-center min-w-0 flex-1 hover:opacity-80 transition-opacity">
              <img src={logoBase64} alt="Blanco Dental" className="h-9 w-auto object-contain" />
            </button>
          )}
          {collapsed && (
            <button type="button" onClick={() => navigate('/dashboard')} className="hover:opacity-80 transition-opacity">
              <img src={logoBase64} alt="Blanco Dental" className="h-8 w-8 object-contain" />
            </button>
          )}
        </div>

        {/* Search */}
        <GlobalSearch collapsed={collapsed} />

        {/* Main nav */}
        <nav className="flex-1 px-2 py-2 flex flex-col gap-0.5 overflow-y-auto">
          {mainNav.map(({ to, icon, label }) => (
            <SideNavItem key={to} to={to} icon={icon} label={label} collapsed={collapsed}
              badge={to === '/citas' ? pendingToday : undefined}
            />
          ))}

          {/* Separator */}
          <div className={`my-2 ${collapsed ? 'mx-2' : 'mx-1'} border-t border-black/[0.05]`} />

          {secondaryNav.map(({ to, icon, label }) => (
            <SideNavItem key={to} to={to} icon={icon} label={label} collapsed={collapsed} />
          ))}
        </nav>

        {/* User + logout + collapse toggle */}
        <div className="border-t border-black/[0.06] p-2">
          {!collapsed && (
            <div className="flex items-center gap-3 px-2 py-2.5 mb-0.5 rounded-xl hover:bg-black/[0.03] transition-colors cursor-default">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0 shadow-sm"
                style={{ background: 'linear-gradient(135deg,#00AEEF,#005F8E)' }}>
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">{user?.name}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-[#00AEEF]/[0.09] text-[#005F8E] text-[10px] font-semibold rounded-md">
                  {user?.role === 'DOCTOR' ? 'Doctor' : user?.role === 'ADMIN' ? 'Administrador' : 'Recepcionista'}
                </span>
              </div>
            </div>
          )}

          {!collapsed && (
            <button onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2 py-2 text-[13px] text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors font-medium">
              {icons.logout} Cerrar sesión
            </button>
          )}

          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className="mt-0.5 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-gray-300 rounded-lg hover:bg-black/[0.04] hover:text-gray-500 transition-colors"
          >
            {collapsed ? icons.chevronRight : icons.chevronLeft}
            {!collapsed && <span className="font-medium">Colapsar</span>}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col ${mainML} min-h-screen min-w-0 transition-all duration-200`}>

        {/* Mobile top bar */}
        <header className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-sm border-b border-black/[0.06] px-4 h-14 flex items-center gap-3">
          <button type="button" onClick={() => navigate('/dashboard')} className="flex items-center hover:opacity-80 transition-opacity">
            <img src={logoBase64} alt="Blanco Dental" className="h-8 w-auto object-contain" />
          </button>
          <span className="flex-1" />
          <button
            onClick={() => setShowMobileSearch(true)}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            title="Buscar paciente"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors" title="Cerrar sesión">
            {icons.logout}
          </button>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden pb-24 md:pb-8 pt-[calc(3.5rem+1rem)] md:pt-8">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        {/* ── Mobile bottom nav ──────────────────────────────── */}
        {showMore && (
          <div className="md:hidden fixed inset-0 z-20" onClick={() => setShowMore(false)} />
        )}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-black/[0.06] z-30 flex safe-bottom">
          {bottomNav.map(({ to, icon, label }) => {
            const isActive = location.pathname === to || (to !== '/dashboard' && location.pathname.startsWith(to));
            const navBadge = to === '/citas' ? pendingToday : 0;
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setShowMore(false)}
                className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
              >
                <span className={`relative transition-colors ${isActive ? 'text-[#00AEEF]' : 'text-gray-400'}`}>
                  {icon}
                  {navBadge > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-[#00AEEF] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                      {navBadge > 9 ? '9+' : navBadge}
                    </span>
                  )}
                </span>
                <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-[#00AEEF]' : 'text-gray-400'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#00AEEF] rounded-full" />
                )}
              </NavLink>
            );
          })}

          {/* Botón Más */}
          <button
            onClick={() => setShowMore(prev => !prev)}
            className="relative flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors"
          >
            {showMore && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#00AEEF] rounded-full" />
            )}
            <span className={`transition-colors ${showMore ? 'text-[#00AEEF]' : 'text-gray-400'}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth={2.5}/>
              </svg>
            </span>
            <span className={`text-[10px] font-medium transition-colors ${showMore ? 'text-[#00AEEF]' : 'text-gray-400'}`}>
              Más
            </span>

            {/* Popup menú */}
            {showMore && (
              <div className="absolute bottom-full right-0 mb-2 mr-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[160px]">
                {moreNav.map(({ to, icon: navIcon, label }) => {
                  const isActive = location.pathname === to || location.pathname.startsWith(to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={(e) => { e.stopPropagation(); setShowMore(false); }}
                      className={`flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors ${isActive ? 'text-[#005F8E] bg-[#00AEEF]/[0.09]' : 'text-gray-700'}`}
                    >
                      <span className={isActive ? 'text-[#00AEEF]' : 'text-gray-400'}>{navIcon}</span>
                      <span>{label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </button>
        </nav>
      </div>
    </div>
  );
}
