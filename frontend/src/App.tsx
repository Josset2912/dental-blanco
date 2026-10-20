import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { lazy, Suspense, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import { getUser } from './api/auth';
import api from './api/axios';

const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Patients     = lazy(() => import('./pages/Patients'));
const PatientDetail = lazy(() => import('./pages/PatientDetail'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Treatments   = lazy(() => import('./pages/Treatments'));
const Payments     = lazy(() => import('./pages/Payments'));
const Settings     = lazy(() => import('./pages/Settings'));
const Reports      = lazy(() => import('./pages/Reports'));

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gray-100 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3.5 bg-gray-100 rounded w-2/5" />
        <div className="h-3 bg-gray-50 rounded w-1/4" />
      </div>
      <div className="h-3 bg-gray-100 rounded w-16" />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1,2,3,4,5].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-3 items-center">
        <div className="h-8 bg-gray-100 rounded-xl w-40" />
        <div className="h-4 bg-gray-100 rounded w-24" />
        <div className="ml-auto h-9 bg-gray-100 rounded-lg w-32" />
      </div>
      <div className="h-10 bg-gray-50 rounded-lg w-full" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-100" />
        {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-3 items-center">
        <div className="h-8 bg-gray-100 rounded-xl w-32" />
        <div className="ml-auto h-9 bg-gray-100 rounded-lg w-28" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-200" />
        <div className="space-y-2">
          <div className="h-5 bg-gray-200 rounded w-44" />
          <div className="h-3.5 bg-gray-100 rounded w-28" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-48 bg-gray-100 rounded-2xl" />
          <div className="h-48 bg-gray-100 rounded-2xl" />
        </div>
        <div className="h-80 bg-gray-100 rounded-2xl" />
      </div>
    </div>
  );
}

function KeepAlive() {
  useEffect(() => {
    const ping = () => api.get('/health').catch(() => {});
    const id = setInterval(ping, 14 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getUser() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <KeepAlive />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"      element={<Suspense fallback={<DashboardSkeleton />}><Dashboard /></Suspense>} />
            <Route path="pacientes"      element={<Suspense fallback={<TableSkeleton />}><Patients /></Suspense>} />
            <Route path="pacientes/:id"  element={<Suspense fallback={<DetailSkeleton />}><PatientDetail /></Suspense>} />
            <Route path="citas"          element={<Suspense fallback={<CalendarSkeleton />}><Appointments /></Suspense>} />
            <Route path="tratamientos"   element={<Suspense fallback={<TableSkeleton />}><Treatments /></Suspense>} />
            <Route path="pagos"          element={<Suspense fallback={<TableSkeleton />}><Payments /></Suspense>} />
            <Route path="reportes"       element={<Suspense fallback={<TableSkeleton rows={4} />}><Reports /></Suspense>} />
            <Route path="configuracion"  element={<Suspense fallback={<DetailSkeleton />}><Settings /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />
    </QueryClientProvider>
  );
}
