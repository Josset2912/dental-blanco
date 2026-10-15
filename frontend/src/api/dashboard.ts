import api from './axios';

export interface DashboardData {
  stats: {
    totalPatients: number;
    appointmentsToday: number;
    appointmentsPending: number;
    completedThisMonth: number;
    monthRevenue: number;
  };
  todayAppointments: {
    id: string;
    date: string;
    duration: number;
    reason: string;
    status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    patient: { name: string; lastName: string; phone: string };
  }[];
  recentPatients: {
    id: string;
    name: string;
    lastName: string;
    phone: string;
    createdAt: string;
  }[];
}

export const getDashboard = () =>
  api.get<DashboardData>('/dashboard').then(r => r.data);
