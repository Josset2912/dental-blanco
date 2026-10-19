import api from './axios';

export interface Payment {
  id: string;
  patientId: string;
  treatmentId?: string;
  amount: string;
  method: 'CASH' | 'CARD' | 'TRANSFER';
  concept: string;
  notes?: string;
  createdAt: string;
  patient: { id: string; name: string; lastName: string };
  treatment?: { id: string; name: string };
}

export interface PaymentSummary {
  totalRevenue: number;
  monthRevenue: number;
  countMonth: number;
  countTotal: number;
}

export interface PaginatedPayments {
  data: Payment[];
  total: number;
  page: number;
  limit: number;
}

export const getPayments = (patientId?: string) =>
  api.get<Payment[]>('/payments', { params: patientId ? { patientId } : {} }).then(r => r.data);

export const getPaymentsPaged = (page: number, patientId?: string, limit = 20, from?: string, to?: string) =>
  api.get<PaginatedPayments>('/payments', { params: { page, limit, ...(patientId ? { patientId } : {}), ...(from ? { from } : {}), ...(to ? { to } : {}) } }).then(r => r.data);

export const getPaymentSummary = () =>
  api.get<PaymentSummary>('/payments/summary').then(r => r.data);

export const createPayment = (data: {
  patientId: string; treatmentId?: string;
  amount: number; method: string; concept: string; notes?: string;
}) => api.post<Payment>('/payments', data).then(r => r.data);

export const deletePayment = (id: string) =>
  api.delete(`/payments/${id}`).then(r => r.data);
