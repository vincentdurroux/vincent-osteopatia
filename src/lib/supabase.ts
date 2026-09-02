import { createClient } from '@supabase/supabase-js';
import { Client, ClientNote, Invoice, CalendarEvent } from '../types';

const getEnvVar = (key: string): string => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[key]) return metaEnv[key];
  if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key] as string;
  return '';
};

const supabaseUrl = 
  getEnvVar('SUPABASE_URL') || 
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
  '';

const supabaseAnonKey = 
  getEnvVar('SUPABASE_ANON_KEY') || 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('SUPABASE_PUBLISHABLE_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  '';

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
  try {
    return JSON.parse(data);
  } catch {
    return seed;
  }
};

const saveLocal = <T>(key: string, data: T[]) => {
  localStorage.setItem(`vincent_osteo_${key}`, JSON.stringify(data));
};

// ==========================================
// COLUMN MAPPERS (HANDLES BOTH SNAKE_CASE & CAMELCASE)
// ==========================================

export function mapClientFromDB(c: any): Client {
  const firstName = c.firstName || c.first_name || (c.name ? c.name.split(' ')[0] : '');
  const lastName = c.lastName || c.last_name || (c.name ? c.name.split(' ').slice(1).join(' ') : '');
  const name = c.name || `${lastName.toUpperCase()} ${firstName}`.trim();
  return {
    id: String(c.id),
    firstName,
    lastName,
    name,
    email: c.email || '',
    phone: c.phone || '',
    birthDate: c.birthDate || c.birth_date || '',
    address: c.address || '',
    createdAt: c.createdAt || c.created_at || new Date().toISOString(),
    lastSessionAt: c.lastSessionAt || c.last_session_at,
  };
}

export function mapNoteFromDB(n: any): ClientNote {
  return {
    id: String(n.id),
    clientId: String(n.clientId || n.client_id || n.clientid || ''),
    date: n.date || n.created_at || new Date().toISOString(),
    motif: n.motif || '',
    anamnese: n.anamnese || '',
    treatment: n.treatment || '',
    content: n.content || `Anamnèse :\n${n.anamnese || ''}\n\nTraitement :\n${n.treatment || ''}`,
    category: n.category || 'treatment',
  };
}

export function mapInvoiceFromDB(i: any): Invoice {
  return {
    id: String(i.id),
    invoiceNumber: i.invoiceNumber || i.invoice_number || i.invoicenumber || `FAC-${i.id}`,
    clientId: String(i.clientId || i.client_id || i.clientid || ''),
    clientName: i.clientName || i.client_name || i.clientname || '',
    date: i.date || new Date().toISOString().split('T')[0],
    amount: Number(i.amount) || 0,
    status: i.status || 'paid',
    paymentMethod: i.paymentMethod || i.payment_method || i.paymentmethod || 'card',
    description: i.description || "Séance d'Ostéopathie",
    language: i.language || 'fr',
  };
}

export function mapEventFromDB(e: any): CalendarEvent {
  return {
    id: String(e.id),
    summary: e.summary || '',
    description: e.description || '',
    start: e.start || '',
    end: e.end || '',
    clientId: e.clientId || e.client_id || e.clientid,
    clientName: e.clientName || e.client_name || e.clientname,
  };
}

// SQL SCRIPT FOR SUPABASE SETUP
export const SUPABASE_SQL_SETUP = `-- ==============================================================================
-- SCRIPT COMPLET DE CRÉATION DES TABLES SUPABASE (CABINET D'OSTÉOPATHIE)
-- À exécuter dans Supabase : Menu gauche > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABLE DES PATIENTS (CLIENTS)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    "birthDate" TEXT,
    birth_date TEXT,
    address TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    "lastSessionAt" TIMESTAMPTZ,
    last_session_at TIMESTAMPTZ
);

-- 2. TABLE DES NOTES CLINIQUES & CONSULTATIONS
CREATE TABLE IF NOT EXISTS public.client_notes (
    id TEXT PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    client_id TEXT,
    date TIMESTAMPTZ NOT NULL,
    motif TEXT,
    anamnese TEXT,
    treatment TEXT,
    content TEXT,
    category TEXT DEFAULT 'treatment',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE DES FACTURES & REÇUS D'HONORAIRES
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    invoice_number TEXT,
    "clientId" TEXT NOT NULL,
    client_id TEXT,
    "clientName" TEXT NOT NULL,
    client_name TEXT,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'paid',
    "paymentMethod" TEXT DEFAULT 'card',
    payment_method TEXT DEFAULT 'card',
    description TEXT,
    language TEXT DEFAULT 'fr',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLE DE L'AGENDA & RENDEZ-VOUS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    description TEXT,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    "clientId" TEXT,
    client_id TEXT,
    "clientName" TEXT,
    client_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACTIVATION RLS & AUTORISATIONS EN LECTURE/ÉCRITURE
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Accès total clients" ON public.clients;
    CREATE POLICY "Accès total clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Accès total notes" ON public.client_notes;
    CREATE POLICY "Accès total notes" ON public.client_notes FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Accès total factures" ON public.invoices;
    CREATE POLICY "Accès total factures" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Accès total agenda" ON public.calendar_events;
    CREATE POLICY "Accès total agenda" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);
END $$;
`;

// ==========================================
// UNIFIED DATA API PROVIDER
// ==========================================
export const api = {
  // DIAGNOSTIC DE CONNEXION SUPABASE
  async checkTablesStatus(): Promise<{
    isConfigured: boolean;
    clients: boolean;
    clientNotes: boolean;
    invoices: boolean;
    calendarEvents: boolean;
    errorSummary?: string;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        isConfigured: false,
        clients: false,
        clientNotes: false,
        invoices: false,
        calendarEvents: false,
        errorSummary: 'Variables Supabase manquantes dans Vercel (.env)',
      };
    }

    const results = {
      isConfigured: true,
      clients: false,
      clientNotes: false,
      invoices: false,
      calendarEvents: false,
      errorSummary: '',
    };

    const errors: string[] = [];

    // Test clients
    try {
      const { error } = await supabase.from('clients').select('id').limit(1);
      results.clients = !error;
      if (error) errors.push(`clients: ${error.message}`);
    } catch (e: any) {
      errors.push(`clients: ${e.message}`);
    }

    // Test client_notes
    try {
      const { error } = await supabase.from('client_notes').select('id').limit(1);
      results.clientNotes = !error;
      if (error) errors.push(`client_notes: ${error.message}`);
    } catch (e: any) {
      errors.push(`client_notes: ${e.message}`);
    }

    // Test invoices
    try {
      const { error } = await supabase.from('invoices').select('id').limit(1);
      results.invoices = !error;
      if (error) errors.push(`invoices: ${error.message}`);
    } catch (e: any) {
      errors.push(`invoices: ${e.message}`);
    }

    // Test calendar_events
    try {
      const { error } = await supabase.from('calendar_events').select('id').limit(1);
      results.calendarEvents = !error;
      if (error) errors.push(`calendar_events: ${error.message}`);
    } catch (e: any) {
      errors.push(`calendar_events: ${e.message}`);
    }

    if (errors.length > 0) {
      results.errorSummary = errors.join(' | ');
    }

    return results;
  },

  // SYNCHRONISATION INITIALE VERS SUPABASE
  async syncAllToSupabase(): Promise<{ success: boolean; count: number; message: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, count: 0, message: 'Supabase n\'est pas configuré' };
    }

    try {
      const localClients = loadLocal('clients', mockClients);
      const localNotes = loadLocal('notes', mockNotes);
      const localInvoices = loadLocal('invoices', mockInvoices);
      const localEvents = loadLocal('events', mockEvents);

      let syncedCount = 0;

      // 1. Sync Clients
      for (const client of localClients) {
        await this.createClient(client);
        syncedCount++;
      }

      // 2. Sync Notes
      for (const note of localNotes) {
        await this.createClientNote(note);
        syncedCount++;
      }

      // 3. Sync Invoices
      for (const inv of localInvoices) {
        await this.createInvoice(inv);
        syncedCount++;
      }

      // 4. Sync Events
      for (const ev of localEvents) {
        await this.createLocalEvent(ev);
        syncedCount++;
      }

      return { 
        success: true, 
        count: syncedCount, 
        message: `${syncedCount} éléments synchronisés avec succès dans Supabase !` 
      };
    } catch (err: any) {
      return { success: false, count: 0, message: err.message || 'Erreur lors de la synchronisation' };
    }
  },

  // CLIENTS
  async getClients(): Promise<Client[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('clients').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapClientFromDB);
        saveLocal('clients', mapped);
        return mapped.sort((a, b) => a.name.localeCompare(b.name));
      }
      if (error) {
        console.warn('Supabase clients fetch failed, using local storage:', error.message);
      }
    }
    return loadLocal('clients', mockClients).sort((a, b) => a.name.localeCompare(b.name));
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<Client> {
    const newClient: Client = {
      ...client,
      id: client.id || crypto.randomUUID(),
      createdAt: client.createdAt || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      // Primary payload with both camelCase & snake_case support
      const primaryPayload: any = {
        id: newClient.id,
        name: newClient.name,
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        first_name: newClient.firstName,
        last_name: newClient.lastName,
        email: newClient.email,
        phone: newClient.phone,
        birthDate: newClient.birthDate,
        birth_date: newClient.birthDate,
        address: newClient.address,
        createdAt: newClient.createdAt,
        created_at: newClient.createdAt,
        lastSessionAt: newClient.lastSessionAt,
        last_session_at: newClient.lastSessionAt,
      };

      let insertRes = await supabase.from('clients').upsert(primaryPayload).select().single();

      // If failed due to unknown column, fallback to pure snake_case or base fields
      if (insertRes.error) {
        const fallbackPayload: any = {
          id: newClient.id,
          name: newClient.name,
          email: newClient.email,
          phone: newClient.phone,
          address: newClient.address,
        };
        if (newClient.firstName) fallbackPayload.first_name = newClient.firstName;
        if (newClient.lastName) fallbackPayload.last_name = newClient.lastName;
        if (newClient.birthDate) fallbackPayload.birth_date = newClient.birthDate;
        if (newClient.lastSessionAt) fallbackPayload.last_session_at = newClient.lastSessionAt;
        
        insertRes = await supabase.from('clients').upsert(fallbackPayload).select().single();
      }

      if (!insertRes.error && insertRes.data) {
        const mapped = mapClientFromDB(insertRes.data);
        const current = loadLocal('clients', mockClients);
        const existsIdx = current.findIndex(c => c.id === mapped.id);
        if (existsIdx !== -1) current[existsIdx] = mapped;
        else current.push(mapped);
        saveLocal('clients', current);
        return mapped;
      }
      console.warn('Supabase client insert failed, saving locally:', insertRes.error);
    }

    const current = loadLocal('clients', mockClients);
    const existsIdx = current.findIndex(c => c.id === newClient.id);
    if (existsIdx !== -1) current[existsIdx] = newClient;
    else current.push(newClient);
    saveLocal('clients', current);
    return newClient;
  },

  async updateClient(client: Client): Promise<Client> {
    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        id: client.id,
        name: client.name,
        firstName: client.firstName,
        lastName: client.lastName,
        first_name: client.firstName,
        last_name: client.lastName,
        email: client.email,
        phone: client.phone,
        birthDate: client.birthDate,
        birth_date: client.birthDate,
        address: client.address,
        lastSessionAt: client.lastSessionAt,
        last_session_at: client.lastSessionAt,
      };

      let updateRes = await supabase.from('clients').update(payload).eq('id', client.id).select().single();
      
      if (updateRes.error) {
        const fallbackPayload: any = {
          name: client.name,
          first_name: client.firstName,
          last_name: client.lastName,
          email: client.email,
          phone: client.phone,
          address: client.address,
          birth_date: client.birthDate,
          last_session_at: client.lastSessionAt,
        };
        updateRes = await supabase.from('clients').update(fallbackPayload).eq('id', client.id).select().single();
      }

      if (!updateRes.error && updateRes.data) {
        const mapped = mapClientFromDB(updateRes.data);
        const current = loadLocal('clients', mockClients);
        const index = current.findIndex(c => c.id === client.id);
        if (index !== -1) current[index] = mapped;
        saveLocal('clients', current);
        return mapped;
      }
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
      let { data, error } = await supabase.from('client_notes').select('*').eq('clientId', clientId).order('date', { ascending: false });
      
      if (error) {
        // Retry with client_id column
        const res = await supabase.from('client_notes').select('*').eq('client_id', clientId).order('date', { ascending: false });
        data = res.data;
        error = res.error;
      }

      if (!error && data) {
        return data.map(mapNoteFromDB);
      }
    }
    return loadLocal('notes', mockNotes)
      .filter(n => n.clientId === clientId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createClientNote(note: Omit<ClientNote, 'id'> & { id?: string; date?: string }): Promise<ClientNote> {
    const newNote: ClientNote = {
      ...note,
      id: note.id || crypto.randomUUID(),
      date: note.date || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        id: newNote.id,
        clientId: newNote.clientId,
        client_id: newNote.clientId,
        date: newNote.date,
        motif: newNote.motif,
        anamnese: newNote.anamnese,
        treatment: newNote.treatment,
        content: newNote.content,
        category: newNote.category,
      };

      let insertRes = await supabase.from('client_notes').upsert(payload).select().single();
      
      if (insertRes.error) {
        const fallbackPayload: any = {
          id: newNote.id,
          client_id: newNote.clientId,
          date: newNote.date,
          motif: newNote.motif,
          anamnese: newNote.anamnese,
          treatment: newNote.treatment,
          content: newNote.content,
          category: newNote.category,
        };
        insertRes = await supabase.from('client_notes').upsert(fallbackPayload).select().single();
      }

      if (!insertRes.error && insertRes.data) {
        // Also update lastSessionAt in Supabase for this client
        await supabase.from('clients').update({ 
          lastSessionAt: newNote.date,
          last_session_at: newNote.date 
        }).eq('id', note.clientId);

        const mapped = mapNoteFromDB(insertRes.data);
        const current = loadLocal('notes', mockNotes);
        const idx = current.findIndex(n => n.id === mapped.id);
        if (idx !== -1) current[idx] = mapped;
        else current.push(mapped);
        saveLocal('notes', current);
        return mapped;
      }
      console.warn('Supabase note insert failed:', insertRes.error);
    }

    const current = loadLocal('notes', mockNotes);
    const idx = current.findIndex(n => n.id === newNote.id);
    if (idx !== -1) current[idx] = newNote;
    else current.push(newNote);
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
      const payload: any = {
        id: note.id,
        clientId: note.clientId,
        client_id: note.clientId,
        date: note.date,
        motif: note.motif,
        anamnese: note.anamnese,
        treatment: note.treatment,
        content: note.content,
        category: note.category,
      };

      let updateRes = await supabase.from('client_notes').update(payload).eq('id', note.id).select().single();
      if (updateRes.error) {
        const fallback: any = {
          client_id: note.clientId,
          date: note.date,
          motif: note.motif,
          anamnese: note.anamnese,
          treatment: note.treatment,
          content: note.content,
          category: note.category,
        };
        updateRes = await supabase.from('client_notes').update(fallback).eq('id', note.id).select().single();
      }

      if (!updateRes.error && updateRes.data) {
        const mapped = mapNoteFromDB(updateRes.data);
        const current = loadLocal('notes', mockNotes);
        const index = current.findIndex(n => n.id === note.id);
        if (index !== -1) current[index] = mapped;
        saveLocal('notes', current);
        return mapped;
      }
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
      if (!error) {
        const current = loadLocal('notes', mockNotes);
        const filtered = current.filter(n => n.id !== id);
        saveLocal('notes', filtered);
        return true;
      }
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
      if (!error && data && data.length > 0) {
        const mapped = data.map(mapInvoiceFromDB);
        saveLocal('invoices', mapped);
        return mapped;
      }
      if (error) {
        console.warn('Supabase invoices fetch failed, using local storage:', error.message);
      }
    }
    return loadLocal('invoices', mockInvoices).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string; invoiceNumber?: string }): Promise<Invoice> {
    const currentInvoices = loadLocal('invoices', mockInvoices);
    const nextNum = 100 + currentInvoices.length + 1;
    const invoiceNumber = invoice.invoiceNumber || `FAC-${new Date().getFullYear()}-${nextNum}`;

    const newInvoice: Invoice = {
      ...invoice,
      id: invoice.id || crypto.randomUUID(),
      invoiceNumber,
    };

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        id: newInvoice.id,
        invoiceNumber: newInvoice.invoiceNumber,
        invoice_number: newInvoice.invoiceNumber,
        clientId: newInvoice.clientId,
        client_id: newInvoice.clientId,
        clientName: newInvoice.clientName,
        client_name: newInvoice.clientName,
        date: newInvoice.date,
        amount: newInvoice.amount,
        status: newInvoice.status,
        paymentMethod: newInvoice.paymentMethod,
        payment_method: newInvoice.paymentMethod,
        description: newInvoice.description,
        language: newInvoice.language || 'fr',
      };

      let insertRes = await supabase.from('invoices').upsert(payload).select().single();

      if (insertRes.error) {
        const fallback: any = {
          id: newInvoice.id,
          invoice_number: newInvoice.invoiceNumber,
          client_id: newInvoice.clientId,
          client_name: newInvoice.clientName,
          date: newInvoice.date,
          amount: newInvoice.amount,
          status: newInvoice.status,
          payment_method: newInvoice.paymentMethod,
          description: newInvoice.description,
          language: newInvoice.language || 'fr',
        };
        insertRes = await supabase.from('invoices').upsert(fallback).select().single();
      }

      if (!insertRes.error && insertRes.data) {
        const mapped = mapInvoiceFromDB(insertRes.data);
        const idx = currentInvoices.findIndex(i => i.id === mapped.id);
        if (idx !== -1) currentInvoices[idx] = mapped;
        else currentInvoices.push(mapped);
        saveLocal('invoices', currentInvoices);
        return mapped;
      }
      console.warn('Supabase invoice insertion failed:', insertRes.error);
    }

    const idx = currentInvoices.findIndex(i => i.id === newInvoice.id);
    if (idx !== -1) currentInvoices[idx] = newInvoice;
    else currentInvoices.push(newInvoice);
    saveLocal('invoices', currentInvoices);
    return newInvoice;
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        invoice_number: invoice.invoiceNumber,
        clientId: invoice.clientId,
        client_id: invoice.clientId,
        clientName: invoice.clientName,
        client_name: invoice.clientName,
        date: invoice.date,
        amount: invoice.amount,
        status: invoice.status,
        paymentMethod: invoice.paymentMethod,
        payment_method: invoice.paymentMethod,
        description: invoice.description,
        language: invoice.language || 'fr',
      };

      let updateRes = await supabase.from('invoices').update(payload).eq('id', invoice.id).select().single();
      if (updateRes.error) {
        const fallback: any = {
          invoice_number: invoice.invoiceNumber,
          client_id: invoice.clientId,
          client_name: invoice.clientName,
          date: invoice.date,
          amount: invoice.amount,
          status: invoice.status,
          payment_method: invoice.paymentMethod,
          description: invoice.description,
          language: invoice.language || 'fr',
        };
        updateRes = await supabase.from('invoices').update(fallback).eq('id', invoice.id).select().single();
      }

      if (!updateRes.error && updateRes.data) {
        const mapped = mapInvoiceFromDB(updateRes.data);
        const current = loadLocal('invoices', mockInvoices);
        const index = current.findIndex(i => i.id === invoice.id);
        if (index !== -1) current[index] = mapped;
        saveLocal('invoices', current);
        return mapped;
      }
    }

    const current = loadLocal('invoices', mockInvoices);
    const index = current.findIndex(i => i.id === invoice.id);
    if (index !== -1) {
      current[index] = invoice;
      saveLocal('invoices', current);
    }
    return invoice;
  },

  // LOCAL & SUPABASE CALENDAR EVENTS
  async getLocalEvents(): Promise<CalendarEvent[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('calendar_events').select('*').order('start', { ascending: true });
      if (!error && data) {
        const mapped = data.map(mapEventFromDB);
        saveLocal('events', mapped);
        return mapped;
      }
    }
    return loadLocal('events', mockEvents).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },

  async createLocalEvent(event: Omit<CalendarEvent, 'id'> & { id?: string }): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: event.id || crypto.randomUUID(),
    };

    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        id: newEvent.id,
        summary: newEvent.summary,
        description: newEvent.description,
        start: newEvent.start,
        end: newEvent.end,
        clientId: newEvent.clientId,
        client_id: newEvent.clientId,
        clientName: newEvent.clientName,
        client_name: newEvent.clientName,
      };

      let insertRes = await supabase.from('calendar_events').upsert(payload).select().single();
      if (insertRes.error) {
        const fallback: any = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description,
          start: newEvent.start,
          end: newEvent.end,
          client_id: newEvent.clientId,
          client_name: newEvent.clientName,
        };
        insertRes = await supabase.from('calendar_events').upsert(fallback).select().single();
      }

      if (!insertRes.error && insertRes.data) {
        const mapped = mapEventFromDB(insertRes.data);
        const current = loadLocal('events', mockEvents);
        const idx = current.findIndex(e => e.id === mapped.id);
        if (idx !== -1) current[idx] = mapped;
        else current.push(mapped);
        saveLocal('events', current);
        return mapped;
      }
    }

    const current = loadLocal('events', mockEvents);
    const idx = current.findIndex(e => e.id === newEvent.id);
    if (idx !== -1) current[idx] = newEvent;
    else current.push(newEvent);
    saveLocal('events', current);
    return newEvent;
  },

  async updateLocalEvent(event: CalendarEvent): Promise<CalendarEvent> {
    if (isSupabaseConfigured && supabase) {
      const payload: any = {
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        clientId: event.clientId,
        client_id: event.clientId,
        clientName: event.clientName,
        client_name: event.clientName,
      };

      let updateRes = await supabase.from('calendar_events').update(payload).eq('id', event.id).select().single();
      if (updateRes.error) {
        const fallback: any = {
          summary: event.summary,
          description: event.description,
          start: event.start,
          end: event.end,
          client_id: event.clientId,
          client_name: event.clientName,
        };
        updateRes = await supabase.from('calendar_events').update(fallback).eq('id', event.id).select().single();
      }

      if (!updateRes.error && updateRes.data) {
        const mapped = mapEventFromDB(updateRes.data);
        const current = loadLocal('events', mockEvents);
        const index = current.findIndex(e => e.id === event.id);
        if (index !== -1) current[index] = mapped;
        saveLocal('events', current);
        return mapped;
      }
    }

    const current = loadLocal('events', mockEvents);
    const index = current.findIndex(e => e.id === event.id);
    if (index !== -1) {
      current[index] = event;
      saveLocal('events', current);
    }
    return event;
  },

  async deleteLocalEvent(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (!error) {
        const current = loadLocal('events', mockEvents);
        const filtered = current.filter(e => e.id !== id);
        saveLocal('events', filtered);
        return true;
      }
    }

    const current = loadLocal('events', mockEvents);
    const filtered = current.filter(e => e.id !== id);
    saveLocal('events', filtered);
    return true;
  }
};
