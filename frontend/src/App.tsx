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

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 bg-gray-100 rounded-xl w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
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
            <Route path="dashboard"      element={<Suspense fallback={<PageSkeleton />}><Dashboard /></Suspense>} />
            <Route path="pacientes"      element={<Suspense fallback={<PageSkeleton />}><Patients /></Suspense>} />
            <Route path="pacientes/:id"  element={<Suspense fallback={<PageSkeleton />}><PatientDetail /></Suspense>} />
            <Route path="citas"          element={<Suspense fallback={<PageSkeleton />}><Appointments /></Suspense>} />
            <Route path="tratamientos"   element={<Suspense fallback={<PageSkeleton />}><Treatments /></Suspense>} />
            <Route path="pagos"          element={<Suspense fallback={<PageSkeleton />}><Payments /></Suspense>} />
            <Route path="reportes"       element={<Suspense fallback={<PageSkeleton />}><Reports /></Suspense>} />
            <Route path="configuracion"  element={<Suspense fallback={<PageSkeleton />}><Settings /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
