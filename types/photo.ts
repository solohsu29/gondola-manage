export interface Photo {
  id: string;
  gondolaId: string;
  fileName: string;
  mimeType: string;
  uploaded: string; // ISO date string
  fileData?: ArrayBuffer; // Only used if fetching the binary
  description?: string;
  category?: string;
}
