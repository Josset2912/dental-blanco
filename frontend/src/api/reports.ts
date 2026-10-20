import api from './axios';

export interface Overview {
  totalPatients: number;
  newPatientsMonth: number;
  appointmentsMonth: number;
  revenueMonth: number;
  pendingTreatments: number;
}

export interface MonthlyRevenue { label: string; total: number }
export interface MonthlyPatients { label: string; count: number }

export interface TreatmentsReport {
  byStatus: { label: string; value: number }[];
  byMethod: { label: string; count: number; total: number }[];
}

export interface BalancePayment {
  id: string;
  amount: number;
  method: string;
  concept: string;
  notes?: string;
  createdAt: string;
  patient: { name: string; lastName: string; phone: string };
  treatment: { name: string } | null;
}

export interface MonthlyBalance {
  total: number;
  count: number;
  average: number;
  prevTotal: number;
  growth: number | null;
  byMethod: { method: string; label: string; count: number; total: number }[];
  payments: BalancePayment[];
}

export const getOverview       = () => api.get<Overview>('/reports/overview').then(r => r.data);
export const getRevenue        = () => api.get<MonthlyRevenue[]>('/reports/revenue').then(r => r.data);
export const getPatientsReport = () => api.get<MonthlyPatients[]>('/reports/patients').then(r => r.data);
export const getTreatments     = () => api.get<TreatmentsReport>('/reports/treatments').then(r => r.data);
export const getMonthlyBalance = (year: number, month: number) =>
  api.get<MonthlyBalance>('/reports/balance', { params: { year, month } }).then(r => r.data);
