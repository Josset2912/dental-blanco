import api from './axios';

export interface ClinicalNote {
  id: string;
  patientId: string;
  doctorId: string;
  content: string;
  createdAt: string;
  doctor: { id: string; name: string };
}

export const getClinicalNotes = (patientId: string) =>
  api.get<ClinicalNote[]>(`/clinical-notes/${patientId}`).then(r => r.data);

export const createClinicalNote = (patientId: string, content: string) =>
  api.post<ClinicalNote>(`/clinical-notes/${patientId}`, { content }).then(r => r.data);

export const deleteClinicalNote = (noteId: string) =>
  api.delete(`/clinical-notes/${noteId}`).then(r => r.data);
