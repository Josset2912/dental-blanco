import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import Treatments from './pages/Treatments';
import Payments from './pages/Payments';
import Settings from './pages/Settings';
import Reports from './pages/Reports';
import { getUser } from './api/auth';

const queryClient = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactNode }) {
  return getUser() ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="pacientes" element={<Patients />} />
            <Route path="pacientes/:id" element={<PatientDetail />} />
            <Route path="citas" element={<Appointments />} />
            <Route path="tratamientos" element={<Treatments />} />
            <Route path="pagos" element={<Payments />} />
            <Route path="reportes" element={<Reports />} />
            <Route path="configuracion" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
