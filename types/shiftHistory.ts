export interface ShiftHistory {
  id: string;
  gondolaId: string;
  fromLocation: string;
  fromLocationDetail: string;
  toLocation: string;
  toLocationDetail: string;
  shiftDate: string;
  reason: string;
  notes?: string;
  shiftedBy: string;
  createdAt: string;
}
