import api from './axios';

export type ToothCondition = 'SANO' | 'CARIES' | 'OBTURADO' | 'CORONA' | 'ENDODONCIA' | 'AUSENTE' | 'FRACTURA' | 'IMPLANTE';

export interface ToothState {
  w: ToothCondition;  // whole tooth
  v: ToothCondition;  // vestibular
  o: ToothCondition;  // oclusal
  l: ToothCondition;  // lingual
  m: ToothCondition;  // mesial
  d: ToothCondition;  // distal
}

export interface OdontogramConditions { [tooth: string]: Partial<ToothState> }

export const getOdontogram = (patientId: string) =>
  api.get<{ conditions: OdontogramConditions }>(`/odontogram/${patientId}`).then(r => r.data.conditions);

export const saveOdontogram = (patientId: string, conditions: OdontogramConditions) =>
  api.put(`/odontogram/${patientId}`, { conditions }).then(r => r.data);
