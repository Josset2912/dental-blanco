import api from './axios';

export interface PatientImage {
  id: string;
  patientId: string;
  url: string;
  publicId: string;
  name: string;
  type: string;
  createdAt: string;
}

export function getPatientImages(patientId: string) {
  return api.get<PatientImage[]>(`/images/${patientId}`).then(r => r.data);
}

export function uploadPatientImage(patientId: string, file: File, type: string) {
  const form = new FormData();
  form.append('file', file);
  form.append('type', type);
  return api.post<PatientImage>(`/images/${patientId}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
}

export function deletePatientImage(imageId: string) {
  return api.delete(`/images/item/${imageId}`).then(r => r.data);
}
