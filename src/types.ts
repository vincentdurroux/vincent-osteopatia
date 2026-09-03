export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  dni?: string;
  birthDate?: string;
  createdAt: string;
  lastSessionAt?: string;
  address?: string;
  hasBono?: boolean;
  bonoType?: string;
  defaultDiscount?: number;
  bonoSessionsRemaining?: number;
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
  originalAmount?: number;
  discountAmount?: number;
  discountType?: 'bono' | 'custom' | 'none';
  discountLabel?: string;
  status: 'paid' | 'pending';
  paymentMethod?: 'cash' | 'card' | 'transfer';
  description: string;
  language?: 'fr' | 'en' | 'es';
  noteId?: string;
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
