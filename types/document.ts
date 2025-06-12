export interface Document {
  id: string;
  gondolaId: string;
  type: string;
  name: string;
  uploaded: string;
  expiry: string;
  status: 'Valid' | 'Expiring' | 'Expired';
  category?:string
  title?:string
  notes?:string
}
