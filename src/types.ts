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
  defaultDiscount?: number;
  profileNote?: string;
  hasBono?: boolean;
  bonoSessionsRemaining?: number;
  bonoType?: string;
  bonoRedeemedDates?: string[];
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
  eventId?: string;
  isBonoRedeemed?: boolean;
  bonoType?: string;
}

export interface ClinicalNoteDraftItem {
  clientId: string;
  clientName?: string;
  anamnese: string;
  treatment: string;
  category: ClientNote['category'];
  date: string;
  motif: string;
  eventId?: string;
  updatedAt: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  date: string;
  paymentDate?: string;
  amount: number;
  originalAmount?: number;
  discountAmount?: number;
  discountType?: 'custom' | 'none' | 'bono';
  discountLabel?: string;
  status: 'paid' | 'pending';
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'not_applicable';
  description: string;
  language?: 'fr' | 'en' | 'es';
  noteId?: string;
  eventId?: string;
  quantity?: number;
  isBonoRedemption?: boolean;
}

export type EventType = 'appointment' | 'blocked';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO string
  end: string;   // ISO string
  clientId?: string;
  clientName?: string;
  isGoogleEvent?: boolean;
  eventType?: EventType;
}

export interface GoogleReview {
  id?: string;
  author: string;
  initials: string;
  date: number; // timestamp
  rating: number;
  text: string;
  created_at?: string;
}

export interface TelegramAppointmentItem {
  id: string;
  start: string;
  end: string;
  timeRange: string;
  clientId?: string;
  clientName: string;
  phone?: string;
  motif?: string;
  hasBono?: boolean;
  bonoSessionsRemaining?: number;
  bonoType?: string;
}

export interface TelegramConfigResponse {
  enabled: boolean;
  hasBotToken: boolean;
  botTokenMasked: string;
  envBotTokenConfigured: boolean;
  chatId: string;
  chatLabel: string;
  envChatIdConfigured: boolean;
  sendTime: string;
  timezone: string;
  language: 'fr' | 'es' | 'en';
  includePhone: boolean;
  includeMotif: boolean;
  includeBono: boolean;
  lastSentDate: string | null;
  lastSentAt: string | null;
  lastSentCount: number;
  lastStatus: 'sent' | 'skipped_no_patients' | 'error' | null;
  lastError: string | null;
  cronSecret: string;
  botUsername?: string;
  ntfyTopic?: string;
  ntfyEnabled?: boolean;
}

export interface TelegramPreviewResponse {
  dateStr: string;
  dateFormatted: string;
  timezone: string;
  appointments: TelegramAppointmentItem[];
  messageText: string;
}
