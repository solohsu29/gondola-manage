export interface DeliveryOrder {
  id: string;
  number: string;
  date: string;
  fileUrl?: string;
  client: string;
  site: string;
  orderDate: string;
  deliveryDate: string;
  poReference: string;
  status: 'pending' | 'delivered' | 'cancelled';
  amount: string;
  items: number;
  projectId:string;
  documentId:string
}
