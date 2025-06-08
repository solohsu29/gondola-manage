export type ProjectStatus = 'active' | 'completed' | 'pending' | 'cancelled';

import type { DeliveryOrder } from './deliveryOrder';
import { Gondola } from './gondola';

export interface Project {
  id: string;
  client: string;
  site: string;
  gondolas: Gondola[];
  created: string;
  status: ProjectStatus;
  endDate?: string;
  deliveryOrders: DeliveryOrder[];
}
