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

export const getOverview    = () => api.get<Overview>('/reports/overview').then(r => r.data);
export const getRevenue     = () => api.get<MonthlyRevenue[]>('/reports/revenue').then(r => r.data);
export const getPatientsReport = () => api.get<MonthlyPatients[]>('/reports/patients').then(r => r.data);
export const getTreatments  = () => api.get<TreatmentsReport>('/reports/treatments').then(r => r.data);
