import api from './axios';

export interface Treatment {
  id: string;
  patientId: string;
  name: string;
  description?: string;
  cost: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  notes?: string;
  patient: { id: string; name: string; lastName: string; phone: string };
}

export type TreatmentInput = {
  patientId: string;
  name: string;
  description?: string;
  cost: number;
  startDate: string;
  notes?: string;
};

export const getTreatments = (params?: { patientId?: string; status?: string }) =>
  api.get<Treatment[]>('/treatments', { params }).then(r => r.data);

export const createTreatment = (data: TreatmentInput) =>
  api.post<Treatment>('/treatments', data).then(r => r.data);

export const updateTreatment = (id: string, data: Partial<TreatmentInput & { status: Treatment['status']; endDate: string }>) =>
  api.put<Treatment>(`/treatments/${id}`, data).then(r => r.data);

export const cancelTreatment = (id: string) =>
  api.delete(`/treatments/${id}`).then(r => r.data);
