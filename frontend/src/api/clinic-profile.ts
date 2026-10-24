import api from './axios';

export interface ClinicProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  schedule: string;
}

export const getClinicProfile = () =>
  api.get<ClinicProfile>('/clinic-profile').then(r => r.data);

export const updateClinicProfile = (data: Omit<ClinicProfile, 'id'>) =>
  api.put<ClinicProfile>('/clinic-profile', data).then(r => r.data);
