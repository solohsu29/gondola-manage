export interface Inspection {
  id: string;
  gondolaId: string;
  type: string;
  date: string; // ISO string
  inspector: string;
  priority?: string;
  notes?: string;
  notifyClient?: string;
  createdAt: string; // ISO string
  time?:string;
  completedDate?:string;
  status?:string;
  duration?:string;
  findings?:string;
  recommendations?:string;
}
