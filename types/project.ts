export type ProjectStatus = 'active' | 'completed' | 'pending' | 'cancelled';

import type { DeliveryOrder } from './deliveryOrder';

export interface Project {
  id: string;
  client: string;
  site: string;
  gondolas: number;
  created: string;
  status: ProjectStatus;
  endDate?: string;
  deliveryOrders: DeliveryOrder[];
}
