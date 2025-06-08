import { GondolaStatus } from './gondolaStatus';
import { Project } from './project';
import { ShiftHistory } from './shiftHistory';

export interface Gondola {
  id: string;
  serialNumber: string;
  location: string;
  locationDetail: string;
  lastInspection: string;
  nextInspection: string;
  status: GondolaStatus;
  shiftHistory?: ShiftHistory[];
  projectId?: string;
  photoName?: string;
  photoData?: { type: string; data: number[] };
  projects?:Project[];
  photoDataBase64?:string
}
