import api from './axios';

export interface BlockedSlot {
  id: string;
  doctorId: string;
  date: string;
  startTime: string;
  endTime: string;
  reason?: string;
  createdAt: string;
}

export const getBlockedSlots = (month: string) =>
  api.get<BlockedSlot[]>(`/blocked-slots?month=${month}`).then(r => r.data);

export const createBlockedSlot = (data: Omit<BlockedSlot, 'id' | 'doctorId' | 'createdAt'>) =>
  api.post<BlockedSlot>('/blocked-slots', data).then(r => r.data);

export const deleteBlockedSlot = (id: string) =>
  api.delete(`/blocked-slots/${id}`).then(r => r.data);
