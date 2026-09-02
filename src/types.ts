export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: string;
  createdAt: string;
  lastSessionAt?: string;
  address?: string;
}

export interface ClientNote {
  id: string;
  clientId: string;
  date: string;
  motif?: string;
  anamnese: string;
  treatment: string;
  content: string;
  category: 'evaluation' | 'treatment' | 'follow-up' | 'general';
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending';
  paymentMethod?: 'cash' | 'card' | 'transfer';
  description: string;
  language?: 'fr' | 'en' | 'es';
}

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  clientId?: string;
  clientName?: string;
  isGoogleEvent?: boolean;
}
