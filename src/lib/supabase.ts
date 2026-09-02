import { createClient } from '@supabase/supabase-js';
import { Client, ClientNote, Invoice, CalendarEvent } from '../types';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ==========================================
// SEED DATA FOR LOCAL STORAGE
// ==========================================
const mockClients: Client[] = [
  {
    id: 'c1',
    firstName: 'Marie',
    lastName: 'Laurent',
    name: 'Marie Laurent',
    email: 'marie.laurent@gmail.com',
    phone: '+33 6 12 34 56 78',
    birthDate: '1988-04-12',
    address: 'Calle del Mar 14, L\'Eliana',
    createdAt: '2026-01-10T10:00:00Z',
    lastSessionAt: '2026-08-25T14:30:00Z',
  },
  {
    id: 'c2',
    firstName: 'Jean-Pierre',
    lastName: 'Petit',
    name: 'Jean-Pierre Petit',
    email: 'jp.petit@yahoo.fr',
    phone: '+34 612 987 654',
    birthDate: '1964-11-03',
    address: 'Avenida de las Cortes 45, Valencia',
    createdAt: '2026-02-15T09:00:00Z',
    lastSessionAt: '2026-08-28T11:00:00Z',
  },
  {
    id: 'c3',
    firstName: 'Lucas',
    lastName: 'Mercier (Bébé)',
    name: 'Lucas Mercier (Bébé)',
    email: 'sophie.mercier@gmail.com',
    phone: '+33 6 88 55 44 22',
    birthDate: '2025-10-05',
    address: 'Calle Mayor 8, L\'Eliana',
    createdAt: '2026-05-20T16:00:00Z',
    lastSessionAt: '2026-08-30T10:00:00Z',
  },
  {
    id: 'c4',
    firstName: 'Sofía',
    lastName: 'Benítez',
    name: 'Sofía Benítez',
    email: 'sofia.benitez@outlook.com',
    phone: '+34 654 321 098',
    birthDate: '1995-07-22',
    address: 'Gran Vía de les Corts 112, Valencia',
    createdAt: '2026-03-05T11:00:00Z',
    lastSessionAt: '2026-08-20T17:00:00Z',
  }
];

const mockNotes: ClientNote[] = [
  {
    id: 'n1',
    clientId: 'c1',
    date: '2026-08-25T15:30:00Z',
    motif: 'Lombalgie aiguë',
    anamnese: 'Douleur lombaire basse gauche survenue après port de charge. Douleur irradiant fessier mais sans trajet radiculaire franc. Examen : Bloc de la sacro-iliaque gauche, tension importante du psoas homolatéral.',
    treatment: 'Libération de la charnière thoraco-lombaire, pompage sacré, étirement doux du psoas gauche. Recommandations : Étirements quotidiens, hydratation soutenue.',
    content: 'Anamnèse : Douleur lombaire basse gauche survenue après port de charge. Douleur irradiant fessier mais sans trajet radiculaire franc.\n\nExamen : Bloc de la sacro-iliaque gauche, tension importante du psoas homolatéral.\n\nTraitement : Libération de la charnière thoraco-lombaire, pompage sacré, étirement doux du psoas gauche.\n\nRecommandations : Étirements quotidiens, hydratation soutenue.',
    category: 'treatment',
  },
  {
    id: 'n2',
    clientId: 'c1',
    date: '2026-08-11T10:00:00Z',
    motif: 'Bilan postural initial',
    anamnese: 'Première consultation. Bilan complet postural : légère bascule du bassin à gauche. Chaîne descendante cervicale à investiguer.',
    treatment: 'Bilan et explications cliniques de début de parcours.',
    content: 'Première consultation. Bilan complet postural : légère bascule du bassin à gauche. Chaîne descendante cervicale à investiguer.',
    category: 'evaluation',
  },
  {
    id: 'n3',
    clientId: 'c2',
    date: '2026-08-28T12:00:00Z',
    motif: 'Cervicalgie chronique',
    anamnese: 'Suivi cervicalgie chronique. Tension persistante des trapèzes supérieurs.',
    treatment: 'Techniques d\'énergie musculaire sur les cervicaux moyens. Mobilisation des côtes hautes (C1-C2). Soulagement immédiat de 70% de la raideur lors des tests dynamiques de fin de séance.',
    content: 'Suivi cervicalgie chronique. Tension persistante des trapèzes supérieurs.\n\nTraitement : Techniques d\'énergie musculaire sur les cervicaux moyens. Mobilisation des côtes hautes (C1-C2).\n\nSoulagement immédiat de 70% de la raideur lors des tests dynamiques de fin de séance.',
    category: 'treatment',
  },
  {
    id: 'n4',
    clientId: 'c3',
    date: '2026-08-30T10:45:00Z',
    motif: 'Coliques et reflux gastro-œsophagien',
    anamnese: 'Coliques du nourrisson et reflux persistant. Examen crânien : Légère asymétrie de la SSB (Synchondrose Sphéno-Basilaire) liée à l\'accouchement par ventouse.',
    treatment: 'Relâchement de la base du crâne (occiput-atlas), massage doux de la sphère abdominale (côlon descendant). Bébé s\'est endormi détendu pendant les techniques viscérales.',
    content: 'Coliques du nourrisson et reflux persistant.\n\nExamen crânien : Légère asymétrie de la SSB (Synchondrose Sphéno-Basilaire) liée à l\'accouchement par ventouse.\n\nTraitement : Relâchement de la base du crâne (occiput-atlas), massage doux de la sphère abdominale (côlon descendant).\n\nBébé s\'est endormi détendu pendant les techniques viscérales.',
    category: 'treatment',
  }
];

const mockInvoices: Invoice[] = [
  {
    id: 'i1',
    invoiceNumber: 'FAC-2026-101',
    clientId: 'c1',
    clientName: 'Marie Laurent',
    date: '2026-08-25',
    amount: 60,
    status: 'paid',
    paymentMethod: 'card',
    description: 'Séance d\'Ostéopathie (1h)',
  },
  {
    id: 'i2',
    invoiceNumber: 'FAC-2026-102',
    clientId: 'c2',
    clientName: 'Jean-Pierre Petit',
    date: '2026-08-28',
    amount: 60,
    status: 'paid',
    paymentMethod: 'cash',
    description: 'Séance d\'Ostéopathie (1h)',
  },
  {
    id: 'i3',
    invoiceNumber: 'FAC-2026-103',
    clientId: 'c3',
    clientName: 'Lucas Mercier (Bébé)',
    date: '2026-08-30',
    amount: 60,
    status: 'paid',
    paymentMethod: 'transfer',
    description: 'Séance d\'Ostéopathie pédiatrique',
  },
  {
    id: 'i4',
    invoiceNumber: 'FAC-2026-098',
    clientId: 'c4',
    clientName: 'Sofía Benítez',
    date: '2026-08-20',
    amount: 160,
    status: 'paid',
    paymentMethod: 'card',
    description: 'Forfait Ostéopathie - 3 séances',
  },
  {
    id: 'i5',
    invoiceNumber: 'FAC-2026-095',
    clientId: 'c1',
    clientName: 'Marie Laurent',
    date: '2026-08-11',
    amount: 60,
    status: 'paid',
    paymentMethod: 'card',
    description: 'Séance d\'Ostéopathie (1h)',
  },
  // Adding historic bills for beautiful charts (monthly and annual distribution)
  {
    id: 'i_h1',
    invoiceNumber: 'FAC-2026-021',
    clientId: 'c1',
    clientName: 'Marie Laurent',
    date: '2026-02-15',
    amount: 60,
    status: 'paid',
    paymentMethod: 'cash',
    description: 'Séance d\'Ostéopathie',
  },
  {
    id: 'i_h2',
    invoiceNumber: 'FAC-2026-031',
    clientId: 'c2',
    clientName: 'Jean-Pierre Petit',
    date: '2026-03-20',
    amount: 160,
    status: 'paid',
    paymentMethod: 'transfer',
    description: 'Forfait 3 séances',
  },
  {
    id: 'i_h3',
    invoiceNumber: 'FAC-2026-041',
    clientId: 'c4',
    clientName: 'Sofía Benítez',
    date: '2026-04-10',
    amount: 250,
    status: 'paid',
    paymentMethod: 'card',
    description: 'Forfait 5 séances',
  },
  {
    id: 'i_h4',
    invoiceNumber: 'FAC-2026-051',
    clientId: 'c3',
    clientName: 'Lucas Mercier (Bébé)',
    date: '2026-05-22',
    amount: 60,
    status: 'paid',
    paymentMethod: 'cash',
    description: 'Séance pédiatrique',
  },
  {
    id: 'i_h5',
    invoiceNumber: 'FAC-2026-061',
    clientId: 'c2',
    clientName: 'Jean-Pierre Petit',
    date: '2026-06-12',
    amount: 60,
    status: 'paid',
    paymentMethod: 'card',
    description: 'Séance de suivi',
  },
  {
    id: 'i_h6',
    invoiceNumber: 'FAC-2026-071',
    clientId: 'c4',
    clientName: 'Sofía Benítez',
    date: '2026-07-05',
    amount: 160,
    status: 'paid',
    paymentMethod: 'card',
    description: 'Forfait 3 séances',
  }
];

const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    summary: 'Marie Laurent - Séance de suivi',
    description: 'Charnière thoraco-lombaire, psoas et bassin.',
    start: '2026-09-03T10:00:00Z',
    end: '2026-09-03T11:00:00Z',
    clientId: 'c1',
    clientName: 'Marie Laurent',
  },
  {
    id: 'e2',
    summary: 'Jean-Pierre Petit - Cervicales',
    description: 'Suivi cervicalgie chronique et trapèzes.',
    start: '2026-09-04T14:30:00Z',
    end: '2026-09-04T15:30:00Z',
    clientId: 'c2',
    clientName: 'Jean-Pierre Petit',
  },
  {
    id: 'e3',
    summary: 'Lucas Mercier - Séance pédiatrique',
    description: 'Bébé coliques, sphère viscérale.',
    start: '2026-09-05T09:30:00Z',
    end: '2026-09-05T10:30:00Z',
    clientId: 'c3',
    clientName: 'Lucas Mercier (Bébé)',
  }
];

// Helper to load or initialize from LocalStorage
const loadLocal = <T>(key: string, seed: T[]): T[] => {
  const data = localStorage.getItem(`vincent_osteo_${key}`);
  if (!data) {
    localStorage.setItem(`vincent_osteo_${key}`, JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const saveLocal = <T>(key: string, data: T[]) => {
  localStorage.setItem(`vincent_osteo_${key}`, JSON.stringify(data));
};

// ==========================================
// UNIFIED DATA API PROVIDER
// ==========================================
export const api = {
  // CLIENTS
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').select('*').order('name');
      if (!error && data) {
        return (data as Client[]).map(c => {
          if (!c.firstName || !c.lastName) {
            const parts = c.name.split(' ');
            return {
              ...c,
              firstName: parts[0] || '',
              lastName: parts.slice(1).join(' ') || '',
            };
          }
          return c;
        });
      }
      console.warn('Supabase fetch failed, falling back to LocalStorage', error);
    }
    return loadLocal('clients', mockClients).sort((a, b) => a.name.localeCompare(b.name));
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'>): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').insert(newClient).select().single();
      if (!error && data) return data as Client;
      console.warn('Supabase insert failed, falling back to LocalStorage', error);
    }

    const current = loadLocal('clients', mockClients);
    current.push(newClient);
    saveLocal('clients', current);
    return newClient;
  },

  async updateClient(client: Client): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').update(client).eq('id', client.id).select().single();
      if (!error && data) return data as Client;
      console.warn('Supabase update failed, falling back to LocalStorage', error);
    }

    const current = loadLocal('clients', mockClients);
    const index = current.findIndex(c => c.id === client.id);
    if (index !== -1) {
      current[index] = client;
      saveLocal('clients', current);
    }
    return client;
  },

  // CLIENT NOTES
  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('client_notes').select('*').eq('clientId', clientId).order('date', { ascending: false });
      if (!error && data) return data as ClientNote[];
      console.warn('Supabase notes fetch failed, falling back to LocalStorage', error);
    }
    return loadLocal('notes', mockNotes)
      .filter(n => n.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createClientNote(note: Omit<ClientNote, 'id'> & { date?: string }): Promise<ClientNote> {
    const newNote: ClientNote = {
      ...note,
      id: crypto.randomUUID(),
      date: note.date || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('client_notes').insert(newNote).select().single();
      if (!error && data) {
        // Update lastSessionAt in Supabase for this client
        await supabase.from('clients').update({ lastSessionAt: newNote.date }).eq('id', note.clientId);
        return data as ClientNote;
      }
      console.warn('Supabase note insertion failed, falling back to LocalStorage', error);
    }

    const current = loadLocal('notes', mockNotes);
    current.push(newNote);
    saveLocal('notes', current);

    // Update lastSessionAt in Client record
    const clients = loadLocal('clients', mockClients);
    const clientIdx = clients.findIndex(c => c.id === note.clientId);
    if (clientIdx !== -1) {
      clients[clientIdx].lastSessionAt = newNote.date;
      saveLocal('clients', clients);
    }

    return newNote;
  },

  async updateClientNote(note: ClientNote): Promise<ClientNote> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('client_notes').update(note).eq('id', note.id).select().single();
      if (!error && data) return data as ClientNote;
      console.warn('Supabase note update failed, falling back to LocalStorage', error);
    }

    const current = loadLocal('notes', mockNotes);
    const index = current.findIndex(n => n.id === note.id);
    if (index !== -1) {
      current[index] = note;
      saveLocal('notes', current);
    }
    return note;
  },

  async deleteClientNote(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('client_notes').delete().eq('id', id);
      if (!error) return true;
      console.warn('Supabase note deletion failed, falling back to LocalStorage', error);
    }

    const current = loadLocal('notes', mockNotes);
    const filtered = current.filter(n => n.id !== id);
    saveLocal('notes', filtered);
    return true;
  },

  // INVOICES
  async getInvoices(): Promise<Invoice[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
      if (!error && data) return data as Invoice[];
      console.warn('Supabase invoices fetch failed, falling back to LocalStorage', error);
    }
    return loadLocal('invoices', mockInvoices).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber'>): Promise<Invoice> {
    const currentInvoices = loadLocal('invoices', mockInvoices);
    const nextNum = 100 + currentInvoices.length + 1;
    const invoiceNumber = `FAC-${new Date().getFullYear()}-${nextNum}`;

    const newInvoice: Invoice = {
      ...invoice,
      id: crypto.randomUUID(),
      invoiceNumber,
    };

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('invoices').insert(newInvoice).select().single();
      if (!error && data) return data as Invoice;
      console.warn('Supabase invoice insertion failed, falling back to LocalStorage', error);
    }

    currentInvoices.push(newInvoice);
    saveLocal('invoices', currentInvoices);
    return newInvoice;
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('invoices').update(invoice).eq('id', invoice.id).select().single();
      if (!error && data) return data as Invoice;
      console.warn('Supabase invoice update failed, falling back to LocalStorage', error);
    }

    const current = loadLocal('invoices', mockInvoices);
    const index = current.findIndex(i => i.id === invoice.id);
    if (index !== -1) {
      current[index] = invoice;
      saveLocal('invoices', current);
    }
    return invoice;
  },

  // LOCAL CALENDAR EVENTS (FALLBACK OR SYNCHRONIZED ACROSS SYSTEM)
  async getLocalEvents(): Promise<CalendarEvent[]> {
    return loadLocal('events', mockEvents).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },

  async createLocalEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: crypto.randomUUID(),
    };
    const current = loadLocal('events', mockEvents);
    current.push(newEvent);
    saveLocal('events', current);
    return newEvent;
  },

  async deleteLocalEvent(id: string): Promise<boolean> {
    const current = loadLocal('events', mockEvents);
    const filtered = current.filter(e => e.id !== id);
    saveLocal('events', filtered);
    return true;
  }
};
