import api from './axios';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  reason: string;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  patient: { id: string; name: string; lastName: string; phone: string };
  doctor: { id: string; name: string };
}

export const getAppointments = (date?: string) =>
  api.get<Appointment[]>('/appointments', { params: date ? { date } : {} }).then(r => r.data);

export const getAppointmentsByMonth = (month: string) =>
  api.get<Appointment[]>('/appointments', { params: { month } }).then(r => r.data);

export const createAppointment = (data: {
  patientId: string;
  doctorId: string;
  date: string;
  duration: number;
  reason: string;
  notes?: string;
}) => api.post<Appointment>('/appointments', data).then(r => r.data);

export const updateAppointment = (id: string, data: Partial<Appointment>) =>
  api.put<Appointment>(`/appointments/${id}`, data).then(r => r.data);

export const cancelAppointment = (id: string) =>
  api.delete(`/appointments/${id}`).then(r => r.data);
