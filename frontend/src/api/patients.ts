import api from './axios';

export interface Patient {
  id: string;
  name: string;
  lastName: string;
  email?: string;
  phone: string;
  birthDate: string;
  gender: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  address?: string;
  allergies?: string;
  notes?: string;
  createdAt: string;
}

export interface PaginatedPatients {
  data: Patient[];
  total: number;
  page: number;
  limit: number;
}

export const getPatients = (search?: string) =>
  api.get<Patient[]>('/patients', { params: search ? { search } : {} }).then(r => r.data);

export const getPatientsPaged = (page: number, search?: string, limit = 20) =>
  api.get<PaginatedPatients>('/patients', { params: { page, limit, ...(search ? { search } : {}) } }).then(r => r.data);

export const getPatient = (id: string) =>
  api.get<Patient>(`/patients/${id}`).then(r => r.data);

export const createPatient = (data: Omit<Patient, 'id' | 'createdAt'>) =>
  api.post<Patient>('/patients', data).then(r => r.data);

export const updatePatient = (id: string, data: Partial<Patient>) =>
  api.put<Patient>(`/patients/${id}`, data).then(r => r.data);

export const deletePatient = (id: string) =>
  api.delete(`/patients/${id}`).then(r => r.data);

export interface PatientStats {
  total: number;
  newThisMonth: number;
  byGender: { MASCULINO: number; FEMENINO: number; OTRO: number };
}

export const getPatientStats = () =>
  api.get<PatientStats>('/patients/stats').then(r => r.data);
