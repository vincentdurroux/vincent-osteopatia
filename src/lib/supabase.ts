import { createClient } from '@supabase/supabase-js';
import { Client, ClientNote, Invoice, CalendarEvent } from '../types';

// Default Supabase project credentials as robust production fallback
const DEFAULT_SUPABASE_URL = 'https://lnlemynayesjduntoran.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGVteW5heWVzamR1bnRvcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDAyMDgsImV4cCI6MjA4MjkxNjIwOH0.3b9fFgeWTXen1fsOO0xMdM5Fd3PTxYs41UxlPapo0ZU';

// Note: Vite bundler requires explicit static property access (import.meta.env.VITE_...)
const metaEnv = (import.meta as any).env || {};

export const supabaseUrl = 
  metaEnv.VITE_SUPABASE_URL ||
  metaEnv.SUPABASE_URL ||
  metaEnv.NEXT_PUBLIC_SUPABASE_URL ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  DEFAULT_SUPABASE_URL;

export const supabaseAnonKey = 
  metaEnv.VITE_SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_ANON_KEY ||
  metaEnv.SUPABASE_PUBLISHABLE_KEY ||
  metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  DEFAULT_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

// Track last Supabase write status for UI diagnostics
export let lastSupabaseStatus: {
  lastAction?: string;
  success?: boolean;
  error?: string;
  timestamp?: string;
} = {};

// ==========================================
// SEED DATA FOR LOCAL STORAGE FALLBACK
// ==========================================
export function capitalizeFirstName(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/([\s-]+)/)
    .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1) : '')
    .join('');
}

const mockClients: Client[] = [
  {
    id: 'c1',
    firstName: 'Marie',
    lastName: 'LAURENT',
    name: 'LAURENT Marie',
    dni: '48765432A',
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
    lastName: 'PETIT',
    name: 'PETIT Jean-Pierre',
    dni: 'Y1234567X',
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
    lastName: 'MERCIER (BÉBÉ)',
    name: 'MERCIER (BÉBÉ) Lucas',
    dni: '',
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
    lastName: 'BENÍTEZ',
    name: 'BENÍTEZ Sofía',
    dni: '53987123K',
    email: 'sofia.benitez@outlook.com',
    phone: '+34 654 321 098',
    birthDate: '1995-07-22',
    address: 'Gran Vía de les Corts 112, Valencia',
    createdAt: '2026-03-05T11:00:00Z',
    lastSessionAt: '2026-08-20T17:00:00Z',
    hasBono: true,
    bonoType: 'Bono 3 séances',
    defaultDiscount: 10,
    bonoSessionsRemaining: 2,
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
    noteId: 'n1',
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
    noteId: 'n2',
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
    noteId: 'n3',
  },
  {
    id: 'i4',
    invoiceNumber: 'FAC-2026-098',
    clientId: 'c4',
    clientName: 'Sofía Benítez',
    date: '2026-08-20',
    amount: 160,
    originalAmount: 180,
    discountAmount: 20,
    discountType: 'bono',
    discountLabel: 'Bono 3 séances',
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
    summary: 'Séance de suivi',
    description: 'Charnière thoraco-lombaire, psoas et bassin.',
    start: '2026-09-03T10:00:00Z',
    end: '2026-09-03T11:00:00Z',
    clientId: 'c1',
    clientName: 'LAURENT Marie',
  },
  {
    id: 'e2',
    summary: 'Cervicales',
    description: 'Suivi cervicalgie chronique et trapèzes.',
    start: '2026-09-04T14:30:00Z',
    end: '2026-09-04T15:30:00Z',
    clientId: 'c2',
    clientName: 'PETIT Jean-Pierre',
  },
  {
    id: 'e3',
    summary: 'Séance pédiatrique',
    description: 'Bébé coliques, sphère viscérale.',
    start: '2026-09-05T09:30:00Z',
    end: '2026-09-05T10:30:00Z',
    clientId: 'c3',
    clientName: 'MERCIER (BÉBÉ) Lucas',
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
  let firstName = c.firstName || c.first_name || c.firstname || c.prenom || c.prenom_patient || c.prenomPatient || '';
  let lastName = c.lastName || c.last_name || c.lastname || c.nom || c.nom_patient || c.nomPatient || '';

  const rawName = c.name || c.full_name || c.fullName || c.fullname || c.client_name || c.clientName || c.clientname || c.patient_name || c.patientName || '';

  if ((!firstName || !lastName) && rawName) {
    const parts = String(rawName).trim().split(/\s+/);
    lastName = lastName || parts[0] || '';
    firstName = firstName || parts.slice(1).join(' ') || '';
  }

  if (lastName) lastName = lastName.trim().toUpperCase();
  if (firstName) firstName = capitalizeFirstName(firstName);

  let finalName = `${lastName} ${firstName}`.trim();
  if (!finalName || finalName.toLowerCase() === 'patient sans nom' || finalName.toLowerCase() === 'sans nom') {
    finalName = 'Patient sans nom';
  }

  return {
    id: String(c.id),
    firstName: firstName || '',
    lastName: lastName || '',
    name: finalName,
    dni: c.dni || c.nie || c.nif || c["dni"] || '',
    email: c.email || '',
    phone: c.phone || c.telephone || c.tel || '',
    birthDate: c.birthDate || c.birth_date || c.birthdate || c.date_de_naissance || c.date_naissance || '',
    address: c.address || c.adresse || '',
    createdAt: c.createdAt || c.created_at || new Date().toISOString(),
    lastSessionAt: c.lastSessionAt || c.last_session_at,
    hasBono: Boolean(c.hasBono || c.has_bono),
    bonoType: c.bonoType || c.bono_type || '',
    defaultDiscount: c.defaultDiscount !== undefined ? Number(c.defaultDiscount) : (c.default_discount !== undefined ? Number(c.default_discount) : undefined),
    bonoSessionsRemaining: c.bonoSessionsRemaining !== undefined ? Number(c.bonoSessionsRemaining) : (c.bono_sessions_remaining !== undefined ? Number(c.bono_sessions_remaining) : undefined),
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
    paymentDate: i.paymentDate || i.payment_date || i.paymentdate || undefined,
    amount: Number(i.amount) || 0,
    originalAmount: i.originalAmount !== undefined ? Number(i.originalAmount) : (i.original_amount !== undefined ? Number(i.original_amount) : undefined),
    discountAmount: i.discountAmount !== undefined ? Number(i.discountAmount) : (i.discount_amount !== undefined ? Number(i.discount_amount) : undefined),
    discountType: i.discountType || i.discount_type || undefined,
    discountLabel: i.discountLabel || i.discount_label || undefined,
    status: i.status || 'paid',
    paymentMethod: i.paymentMethod || i.payment_method || i.paymentmethod || 'card',
    description: i.description || "Séance d'Ostéopathie",
    language: i.language || 'fr',
    noteId: i.noteId || i.note_id || undefined,
  };
}

export function mapEventFromDB(e: any): CalendarEvent {
  return {
    id: String(e.id),
    summary: e.summary || e.title || e.intitule || '',
    description: e.description || e.notes || e.note || '',
    start: e.start || e.start_time || e.startTime || '',
    end: e.end || e.end_time || e.endTime || '',
    clientId: e.clientId || e.client_id || e.clientid || e.patient_id || e.patientId || undefined,
    clientName: e.clientName || e.client_name || e.clientname || e.patient_name || e.patientName || undefined,
    eventType: e.eventType || e.event_type || e.type || (e.clientId || e.client_id ? 'appointment' : undefined),
  };
}

// ==========================================
// RESILIENT SELF-HEALING DATABASE EXECUTOR
// ==========================================

/**
 * Extracts a missing column name from PostgreSQL / PostgREST error messages.
 * Examples:
 * - 'column "dni" of relation "clients" does not exist'
 * - "Could not find the 'dni' column of 'clients' in the schema cache"
 * - 'column "birth_date" does not exist'
 */
function extractMissingColumn(errorMsg: string): string | null {
  if (!errorMsg) return null;
  const match1 = errorMsg.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation/i);
  if (match1 && match1[1]) return match1[1];

  const match2 = errorMsg.match(/Could not find the ['"]([a-zA-Z0-9_]+)['"] column/i);
  if (match2 && match2[1]) return match2[1];

  const match3 = errorMsg.match(/column ["']?([a-zA-Z0-9_]+)["']? does not exist/i);
  if (match3 && match3[1]) return match3[1];

  return null;
}

/**
 * Executes an insert or upsert operation with automated self-healing retry.
 * If Supabase complains about non-existent columns in the table, it removes the missing column
 * and retries automatically until successful.
 */
async function executeResilientInsert(
  table: string,
  candidatePayloads: Record<string, any>[]
): Promise<{ data: any | null; error: any | null; success: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase client not initialized'), success: false };
  }

  let lastError: any = null;

  for (const initialPayload of candidatePayloads) {
    let currentPayload = { ...initialPayload };
    let attempts = 0;
    const maxAttempts = Object.keys(currentPayload).length + 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Try insert with .select().single()
        const res = await supabase.from(table).insert(currentPayload).select().single();
        if (!res.error && res.data) {
          lastSupabaseStatus = {
            lastAction: `Insert ${table}`,
            success: true,
            timestamp: new Date().toISOString(),
          };
          return { data: res.data, error: null, success: true };
        }

        // If .select() failed (e.g. RLS SELECT restriction), try a plain insert
        if (res.error) {
          lastError = res.error;
          const msg = res.error.message || '';

          // 1. Missing column error -> strip column & retry
          const missingCol = extractMissingColumn(msg);
          if (missingCol && missingCol in currentPayload) {
            console.warn(`[Supabase Auto-Heal] Column "${missingCol}" does not exist in "${table}". Stripping and retrying.`);
            delete currentPayload[missingCol];
            continue;
          }

          // 2. Try plain insert without .select() if it was an RLS policy issue with select
          if (msg.includes('row-level security') || res.error.code === 'PGRST116' || res.error.code === '42501') {
            const plainRes = await supabase.from(table).insert(currentPayload);
            if (!plainRes.error) {
              lastSupabaseStatus = {
                lastAction: `Plain insert ${table}`,
                success: true,
                timestamp: new Date().toISOString(),
              };
              return { data: currentPayload, error: null, success: true };
            }
          }

          // 3. UUID or syntax error -> strip offending ID/FK columns and retry
          if (msg.includes('invalid input syntax for type uuid') || msg.includes('22P02')) {
            if (currentPayload.client_id && typeof currentPayload.client_id === 'string' && !currentPayload.client_id.includes('-')) {
              console.warn(`[Supabase Auto-Heal] client_id "${currentPayload.client_id}" is not a valid UUID. Stripping.`);
              delete currentPayload.client_id;
              continue;
            }
            if (currentPayload.clientId && typeof currentPayload.clientId === 'string' && !currentPayload.clientId.includes('-')) {
              console.warn(`[Supabase Auto-Heal] clientId "${currentPayload.clientId}" is not a valid UUID. Stripping.`);
              delete currentPayload.clientId;
              continue;
            }
            if ('id' in currentPayload && typeof currentPayload.id === 'string' && !currentPayload.id.includes('-')) {
              console.warn(`[Supabase Auto-Heal] id "${currentPayload.id}" is not a valid UUID. Regenerating UUID.`);
              currentPayload.id = crypto.randomUUID();
              continue;
            }
          }

          // 4. Foreign key violation -> strip foreign key column & retry
          if (msg.includes('foreign key constraint') || res.error.code === '23503') {
            if ('client_id' in currentPayload) { delete currentPayload.client_id; continue; }
            if ('clientId' in currentPayload) { delete currentPayload.clientId; continue; }
          }

          // 5. ID type mismatch (e.g. integer primary key) -> try without id if generated
          if (msg.includes('invalid input syntax for type integer') || msg.includes('invalid input syntax for type bigint')) {
            if ('id' in currentPayload) {
              console.warn(`[Supabase Auto-Heal] Table "${table}" uses integer IDs. Stripping string UUID and retrying.`);
              delete currentPayload.id;
              continue;
            }
          }

          // Non-recoverable error for this payload, break to next candidate payload
          break;
        }
      } catch (err: any) {
        lastError = err;
        break;
      }
    }
  }

  lastSupabaseStatus = {
    lastAction: `Insert ${table}`,
    success: false,
    error: lastError?.message || 'Database error',
    timestamp: new Date().toISOString(),
  };

  return { data: null, error: lastError, success: false };
}

/**
 * Executes an update operation with automated self-healing retry.
 */
async function executeResilientUpdate(
  table: string,
  id: string,
  candidatePayloads: Record<string, any>[]
): Promise<{ data: any | null; error: any | null; success: boolean }> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: null, error: new Error('Supabase client not initialized'), success: false };
  }

  let lastError: any = null;

  for (const initialPayload of candidatePayloads) {
    let currentPayload = { ...initialPayload };
    let attempts = 0;
    const maxAttempts = Object.keys(currentPayload).length + 2;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await supabase.from(table).update(currentPayload).eq('id', id).select().single();
        if (!res.error && res.data) {
          lastSupabaseStatus = {
            lastAction: `Update ${table}`,
            success: true,
            timestamp: new Date().toISOString(),
          };
          return { data: res.data, error: null, success: true };
        }

        if (res.error) {
          lastError = res.error;
          const msg = res.error.message || '';

          const missingCol = extractMissingColumn(msg);
          if (missingCol && missingCol in currentPayload) {
            console.warn(`[Supabase Auto-Heal] Column "${missingCol}" does not exist in "${table}". Stripping and retrying.`);
            delete currentPayload[missingCol];
            continue;
          }

          // Plain update without select
          if (msg.includes('row-level security') || res.error.code === 'PGRST116' || res.error.code === '42501') {
            const plainRes = await supabase.from(table).update(currentPayload).eq('id', id);
            if (!plainRes.error) {
              return { data: { id, ...currentPayload }, error: null, success: true };
            }
          }

          break;
        }
      } catch (err: any) {
        lastError = err;
        break;
      }
    }
  }

  lastSupabaseStatus = {
    lastAction: `Update ${table}`,
    success: false,
    error: lastError?.message || 'Update error',
    timestamp: new Date().toISOString(),
  };

  return { data: null, error: lastError, success: false };
}

// ==========================================
// SQL SCRIPT FOR SUPABASE SETUP & UPGRADE
// ==========================================
export const SUPABASE_SQL_SETUP = `-- ==============================================================================
-- SCRIPT ULTIMATE / FAIL-SAFE D'INITIALISATION SUPABASE
-- À exécuter dans Supabase : Menu gauche > SQL Editor > New query > Run
-- ==============================================================================

-- 1. TABLE DES PATIENTS (CLIENTS)
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    dni TEXT,
    email TEXT,
    phone TEXT,
    birth_date TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_session_at TIMESTAMPTZ,
    has_bono BOOLEAN DEFAULT FALSE,
    bono_type TEXT,
    default_discount NUMERIC DEFAULT 0,
    bono_sessions_remaining NUMERIC DEFAULT 0
);

DO $$
BEGIN
    BEGIN ALTER TABLE public.clients ADD COLUMN first_name TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN last_name TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "firstName" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "lastName" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN dni TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN email TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN phone TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN birth_date TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "birthDate" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN address TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "createdAt" TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN last_session_at TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "lastSessionAt" TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN has_bono BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "hasBono" BOOLEAN DEFAULT FALSE; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN bono_type TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "bonoType" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN default_discount NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "defaultDiscount" NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN bono_sessions_remaining NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "bonoSessionsRemaining" NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 2. TABLE DES NOTES CLINIQUES & DOSSIERS PATIENTS
CREATE TABLE IF NOT EXISTS public.client_notes (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    motif TEXT,
    anamnese TEXT,
    treatment TEXT,
    content TEXT,
    category TEXT DEFAULT 'treatment',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    BEGIN ALTER TABLE public.client_notes ADD COLUMN client_id TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN "clientId" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN date TIMESTAMPTZ DEFAULT NOW(); EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN motif TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN anamnese TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN treatment TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN content TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.client_notes ADD COLUMN category TEXT DEFAULT 'treatment'; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 3. TABLE DES FACTURES & REÇUS D'HONORAIRES
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT,
    client_id TEXT,
    client_name TEXT,
    date TEXT,
    amount NUMERIC,
    original_amount NUMERIC,
    discount_amount NUMERIC,
    discount_type TEXT,
    discount_label TEXT,
    status TEXT DEFAULT 'paid',
    payment_method TEXT DEFAULT 'card',
    description TEXT,
    language TEXT DEFAULT 'fr',
    note_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    BEGIN ALTER TABLE public.invoices ADD COLUMN invoice_number TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "invoiceNumber" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN client_id TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "clientId" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN client_name TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "clientName" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN date TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN amount NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN original_amount NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "originalAmount" NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN discount_amount NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "discountAmount" NUMERIC; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN discount_type TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "discountType" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN discount_label TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "discountLabel" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN status TEXT DEFAULT 'paid'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN payment_method TEXT DEFAULT 'card'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "paymentMethod" TEXT DEFAULT 'card'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN description TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN language TEXT DEFAULT 'fr'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN note_id TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "noteId" TEXT; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 4. TABLE DE L'AGENDA & RENDEZ-VOUS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    summary TEXT,
    description TEXT,
    start TIMESTAMPTZ,
    "end" TIMESTAMPTZ,
    client_id TEXT,
    client_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN summary TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN description TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN start TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN "end" TIMESTAMPTZ; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN client_id TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN "clientId" TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN client_name TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.calendar_events ADD COLUMN "clientName" TEXT; EXCEPTION WHEN duplicate_column THEN END;
END $$;

-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Accès total clients" ON public.clients;
CREATE POLICY "Accès total clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès total notes" ON public.client_notes;
CREATE POLICY "Accès total notes" ON public.client_notes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès total factures" ON public.invoices;
CREATE POLICY "Accès total factures" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Accès total agenda" ON public.calendar_events;
CREATE POLICY "Accès total agenda" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

-- 6. ACCÈS ROLES ANON ET AUTHENTICATED
GRANT ALL ON public.clients TO anon, authenticated;
GRANT ALL ON public.client_notes TO anon, authenticated;
GRANT ALL ON public.invoices TO anon, authenticated;
GRANT ALL ON public.calendar_events TO anon, authenticated;
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
    projectUrl?: string;
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        isConfigured: false,
        clients: false,
        clientNotes: false,
        invoices: false,
        calendarEvents: false,
        errorSummary: 'Variables de connexion Supabase manquantes.',
      };
    }

    const results = {
      isConfigured: true,
      clients: false,
      clientNotes: false,
      invoices: false,
      calendarEvents: false,
      errorSummary: '',
      projectUrl: supabaseUrl,
    };

    const errors: string[] = [];

    // Test clients
    try {
      const { error } = await supabase.from('clients').select('id').limit(1);
      results.clients = !error;
      if (error) errors.push(`Table clients : ${error.message}`);
    } catch (e: any) {
      errors.push(`Table clients : ${e.message}`);
    }

    // Test client_notes
    try {
      const { error } = await supabase.from('client_notes').select('id').limit(1);
      results.clientNotes = !error;
      if (error) errors.push(`Table client_notes : ${error.message}`);
    } catch (e: any) {
      errors.push(`Table client_notes : ${e.message}`);
    }

    // Test invoices
    try {
      const { error } = await supabase.from('invoices').select('id').limit(1);
      results.invoices = !error;
      if (error) errors.push(`Table invoices : ${error.message}`);
    } catch (e: any) {
      errors.push(`Table invoices : ${e.message}`);
    }

    // Test calendar_events
    try {
      const { error } = await supabase.from('calendar_events').select('id').limit(1);
      results.calendarEvents = !error;
      if (error) errors.push(`Table calendar_events : ${error.message}`);
    } catch (e: any) {
      errors.push(`Table calendar_events : ${e.message}`);
    }

    if (errors.length > 0) {
      results.errorSummary = errors.join(' • ');
    }

    return results;
  },

  // SYNCHRONISATION TOUTES DONNÉES LOCALES VERS SUPABASE
  async syncAllToSupabase(): Promise<{ success: boolean; count: number; message: string; details?: string }> {
    if (!isSupabaseConfigured || !supabase) {
      return { success: false, count: 0, message: 'Supabase n\'est pas configuré' };
    }

    try {
      const localClients = loadLocal('clients', mockClients);
      const localNotes = loadLocal('notes', mockNotes);
      const localInvoices = loadLocal('invoices', mockInvoices);
      const localEvents = loadLocal('events', mockEvents);

      let syncedCount = 0;
      const errors: string[] = [];

      // 1. Sync Clients
      for (const client of localClients) {
        try {
          await this.createClient(client);
          syncedCount++;
        } catch (e: any) {
          errors.push(`Client ${client.name}: ${e.message}`);
        }
      }

      // 2. Sync Notes
      for (const note of localNotes) {
        try {
          await this.createClientNote(note);
          syncedCount++;
        } catch (e: any) {
          errors.push(`Note: ${e.message}`);
        }
      }

      // 3. Sync Invoices
      for (const inv of localInvoices) {
        try {
          await this.createInvoice(inv);
          syncedCount++;
        } catch (e: any) {
          errors.push(`Facture ${inv.invoiceNumber}: ${e.message}`);
        }
      }

      // 4. Sync Events
      for (const ev of localEvents) {
        try {
          await this.createLocalEvent(ev);
          syncedCount++;
        } catch (e: any) {
          errors.push(`RDV: ${e.message}`);
        }
      }

      const success = errors.length === 0;
      return { 
        success, 
        count: syncedCount, 
        message: success 
          ? `${syncedCount} enregistrements synchronisés avec succès dans Supabase !`
          : `${syncedCount} enregistrements synchronisés avec des avertissements.`,
        details: errors.join(' | '),
      };
    } catch (err: any) {
      return { success: false, count: 0, message: err.message || 'Erreur lors de la synchronisation' };
    }
  },

  // ==========================================
  // CLIENTS
  // ==========================================
  async getClients(): Promise<Client[]> {
    const localClients = loadLocal('clients', mockClients);
    const localMap = new Map(localClients.map(c => [c.id, c]));

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('clients').select('*');
        if (!error && data) {
          const remoteClients = data.map(row => {
            const mapped = mapClientFromDB(row);
            const local = localMap.get(mapped.id);
            // If remote is missing name or is 'Patient sans nom', restore from local cache if known
            if (local && (mapped.name === 'Patient sans nom' || !mapped.name) && local.name && local.name !== 'Patient sans nom') {
              mapped.name = local.name;
              mapped.firstName = mapped.firstName || local.firstName;
              mapped.lastName = mapped.lastName || local.lastName;
            }
            return mapped;
          });
          
          // If Supabase is active, the server is the absolute single source of truth.
          // Save remote data as read-only cache and return it directly (no local "unsynced" merge
          // to prevent resurrecting deleted clients or duplicating them).
          saveLocal('clients', remoteClients);
          return remoteClients;
        }
        if (error) {
          console.warn('Supabase clients fetch failed, using local storage:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase clients fetch exception:', err);
      }
    }
    return localClients.sort((a, b) => a.name.localeCompare(b.name));
  },

  async createClient(client: Omit<Client, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): Promise<Client> {
    const cleanFirstName = (client.firstName || '').trim();
    const cleanLastName = (client.lastName || '').trim();
    const fullName = (client.name && client.name.trim()) || `${cleanLastName.toUpperCase()} ${cleanFirstName}`.trim() || 'Patient sans nom';

    const newClient: Client = {
      ...client,
      id: client.id || crypto.randomUUID(),
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: fullName,
      createdAt: client.createdAt || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Candidate 1: Standard comprehensive snake_case payload
        const snakePayload: Record<string, any> = {
          id: newClient.id,
          name: newClient.name,
          first_name: newClient.firstName,
          last_name: newClient.lastName,
          nom: newClient.lastName,
          prenom: newClient.firstName,
          full_name: newClient.name,
          client_name: newClient.name,
          patient_name: newClient.name,
          email: newClient.email || '',
          phone: newClient.phone || '',
          address: newClient.address || '',
          created_at: newClient.createdAt,
        };
        if (newClient.dni) snakePayload.dni = newClient.dni;
        if (newClient.birthDate) snakePayload.birth_date = newClient.birthDate;
        if (newClient.lastSessionAt) snakePayload.last_session_at = newClient.lastSessionAt;
        if (newClient.hasBono !== undefined) snakePayload.has_bono = newClient.hasBono;
        if (newClient.bonoType) snakePayload.bono_type = newClient.bonoType;
        if (newClient.defaultDiscount !== undefined) snakePayload.default_discount = newClient.defaultDiscount;
        if (newClient.bonoSessionsRemaining !== undefined) snakePayload.bono_sessions_remaining = newClient.bonoSessionsRemaining;

        // Candidate 2: camelCase payload
        const camelPayload: Record<string, any> = {
          id: newClient.id,
          name: newClient.name,
          firstName: newClient.firstName,
          lastName: newClient.lastName,
          fullName: newClient.name,
          clientName: newClient.name,
          patientName: newClient.name,
          email: newClient.email || '',
          phone: newClient.phone || '',
          address: newClient.address || '',
          createdAt: newClient.createdAt,
        };
        if (newClient.dni) camelPayload.dni = newClient.dni;
        if (newClient.birthDate) camelPayload.birthDate = newClient.birthDate;
        if (newClient.lastSessionAt) camelPayload.lastSessionAt = newClient.lastSessionAt;
        if (newClient.hasBono !== undefined) camelPayload.hasBono = newClient.hasBono;
        if (newClient.bonoType) camelPayload.bonoType = newClient.bonoType;
        if (newClient.defaultDiscount !== undefined) camelPayload.defaultDiscount = newClient.defaultDiscount;
        if (newClient.bonoSessionsRemaining !== undefined) camelPayload.bonoSessionsRemaining = newClient.bonoSessionsRemaining;

        // Candidate 3: Minimal essential payload with guaranteed name
        const minimalPayload: Record<string, any> = {
          id: newClient.id,
          name: newClient.name,
          email: newClient.email || '',
          phone: newClient.phone || '',
        };

        const result = await executeResilientInsert('clients', [snakePayload, camelPayload, minimalPayload]);

        if (result.success && result.data) {
          const mapped = mapClientFromDB(result.data);
          const finalClient: Client = {
            ...newClient,
            ...mapped,
            name: (mapped.name && mapped.name !== 'Patient sans nom') ? mapped.name : newClient.name,
            firstName: mapped.firstName || newClient.firstName,
            lastName: mapped.lastName || newClient.lastName,
          };
          const current = loadLocal('clients', mockClients);
          const existsIdx = current.findIndex(c => c.id === finalClient.id);
          if (existsIdx !== -1) current[existsIdx] = finalClient;
          else current.push(finalClient);
          saveLocal('clients', current);
          return finalClient;
        }
      } catch (err: any) {
        console.error('Exception during Supabase client insertion:', err);
      }
    }

    // Save locally as reliable fallback
    const current = loadLocal('clients', mockClients);
    const existsIdx = current.findIndex(c => c.id === newClient.id);
    if (existsIdx !== -1) current[existsIdx] = newClient;
    else current.push(newClient);
    saveLocal('clients', current);
    return newClient;
  },

  async updateClient(client: Client): Promise<Client> {
    const cleanFirstName = (client.firstName || '').trim();
    const cleanLastName = (client.lastName || '').trim();
    const fullName = (client.name && client.name.trim()) || `${cleanLastName.toUpperCase()} ${cleanFirstName}`.trim() || 'Patient sans nom';

    const normalizedClient: Client = {
      ...client,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      name: fullName,
    };

    // Find previous client name before updating
    const existingClients = loadLocal('clients', mockClients);
    const prevClient = existingClients.find(c => c.id === normalizedClient.id);
    const oldName = prevClient?.name;

    // Helper: Cascade patient name updates to related appointments (invoices are preserved for accounting integrity)
    const syncRelatedEventsAndInvoices = async () => {
      // 1. Local Events Sync
      const localEvents = loadLocal('events', mockEvents);
      let eventsModified = false;
      const updatedEvents = localEvents.map(ev => {
        const isMatching = 
          ev.clientId === normalizedClient.id ||
          (oldName && (
            ev.clientName?.trim().toLowerCase() === oldName.trim().toLowerCase() ||
            ev.summary?.trim().toLowerCase() === oldName.trim().toLowerCase() ||
            ev.summary?.trim().toLowerCase().startsWith(oldName.trim().toLowerCase() + ' -')
          )) ||
          (prevClient && prevClient.lastName && prevClient.firstName && (
            ev.clientName?.toLowerCase().includes(prevClient.lastName.toLowerCase()) &&
            ev.clientName?.toLowerCase().includes(prevClient.firstName.toLowerCase())
          )) ||
          (cleanLastName && cleanFirstName && (
            ev.clientName?.toLowerCase().includes(cleanLastName.toLowerCase()) &&
            ev.clientName?.toLowerCase().includes(cleanFirstName.toLowerCase())
          ));

        if (isMatching) {
          eventsModified = true;
          let newSummary = ev.summary;
          if (ev.summary && ev.summary.includes(' - ')) {
            const parts = ev.summary.split(' - ');
            newSummary = `${fullName} - ${parts.slice(1).join(' - ')}`;
          } else if (!ev.summary || ev.summary === ev.clientName || (oldName && ev.summary === oldName) || (prevClient && ev.summary === prevClient.name)) {
            newSummary = fullName;
          }
          return {
            ...ev,
            clientId: normalizedClient.id,
            clientName: fullName,
            summary: newSummary,
          };
        }
        return ev;
      });
      if (eventsModified) {
        saveLocal('events', updatedEvents);
      }

      // 2. Local Invoices Sync - Disabled to preserve historical name at the time of issuance for accounting integrity
      /*
      const localInvoices = loadLocal('invoices', mockInvoices);
      let invoicesModified = false;
      const updatedInvoices = localInvoices.map(inv => {
        if (inv.clientId === normalizedClient.id || (oldName && inv.clientName === oldName)) {
          invoicesModified = true;
          return {
            ...inv,
            clientId: normalizedClient.id,
            clientName: fullName,
          };
        }
        return inv;
      });
      if (invoicesModified) {
        saveLocal('invoices', updatedInvoices);
      }
      */

      // 3. Supabase Cloud Sync for Calendar Events (Invoices are excluded to preserve historical records)
      if (isSupabaseConfigured && supabase) {
        try {
          // Update calendar_events & events by clientId
          if (normalizedClient.id) {
            await supabase
              .from('calendar_events')
              .update({ client_name: fullName, clientName: fullName, patient_name: fullName })
              .or(`client_id.eq.${normalizedClient.id},clientId.eq.${normalizedClient.id}`);

            await supabase
              .from('events')
              .update({ client_name: fullName, clientName: fullName, patient_name: fullName })
              .or(`client_id.eq.${normalizedClient.id},clientId.eq.${normalizedClient.id}`);
          }

          // Update calendar_events & events by oldName if available
          if (oldName && oldName !== fullName) {
            await supabase
              .from('calendar_events')
              .update({ client_name: fullName, clientName: fullName, patient_name: fullName, client_id: normalizedClient.id, clientId: normalizedClient.id })
              .or(`client_name.eq.${oldName},clientName.eq.${oldName},patient_name.eq.${oldName}`);

            await supabase
              .from('events')
              .update({ client_name: fullName, clientName: fullName, patient_name: fullName, client_id: normalizedClient.id, clientId: normalizedClient.id })
              .or(`client_name.eq.${oldName},clientName.eq.${oldName},patient_name.eq.${oldName}`);
          }
        } catch (cloudErr) {
          console.warn('[Supabase] Cascade update failed silently:', cloudErr);
        }
      }
    };

    // Perform cascade sync
    await syncRelatedEventsAndInvoices();

    if (isSupabaseConfigured && supabase) {
      try {
        const snakePayload: Record<string, any> = {
          name: normalizedClient.name,
          first_name: normalizedClient.firstName,
          last_name: normalizedClient.lastName,
          nom: normalizedClient.lastName,
          prenom: normalizedClient.firstName,
          full_name: normalizedClient.name,
          client_name: normalizedClient.name,
          email: normalizedClient.email || '',
          phone: normalizedClient.phone || '',
          address: normalizedClient.address || '',
        };
        if (normalizedClient.dni !== undefined) snakePayload.dni = normalizedClient.dni;
        if (normalizedClient.birthDate) snakePayload.birth_date = normalizedClient.birthDate;
        if (normalizedClient.lastSessionAt) snakePayload.last_session_at = normalizedClient.lastSessionAt;
        if (normalizedClient.hasBono !== undefined) snakePayload.has_bono = normalizedClient.hasBono;
        if (normalizedClient.bonoType !== undefined) snakePayload.bono_type = normalizedClient.bonoType;
        if (normalizedClient.defaultDiscount !== undefined) snakePayload.default_discount = normalizedClient.defaultDiscount;
        if (normalizedClient.bonoSessionsRemaining !== undefined) snakePayload.bono_sessions_remaining = normalizedClient.bonoSessionsRemaining;

        const camelPayload: Record<string, any> = {
          name: normalizedClient.name,
          firstName: normalizedClient.firstName,
          lastName: normalizedClient.lastName,
          fullName: normalizedClient.name,
          clientName: normalizedClient.name,
          email: normalizedClient.email || '',
          phone: normalizedClient.phone || '',
          address: normalizedClient.address || '',
        };
        if (normalizedClient.dni !== undefined) camelPayload.dni = normalizedClient.dni;
        if (normalizedClient.birthDate) camelPayload.birthDate = normalizedClient.birthDate;
        if (normalizedClient.lastSessionAt) camelPayload.lastSessionAt = normalizedClient.lastSessionAt;
        if (normalizedClient.hasBono !== undefined) camelPayload.hasBono = normalizedClient.hasBono;
        if (normalizedClient.bonoType !== undefined) camelPayload.bonoType = normalizedClient.bonoType;
        if (normalizedClient.defaultDiscount !== undefined) camelPayload.defaultDiscount = normalizedClient.defaultDiscount;
        if (normalizedClient.bonoSessionsRemaining !== undefined) camelPayload.bonoSessionsRemaining = normalizedClient.bonoSessionsRemaining;

        const result = await executeResilientUpdate('clients', normalizedClient.id, [snakePayload, camelPayload]);

        if (result.success && result.data) {
          const mapped = mapClientFromDB(result.data);
          const finalClient: Client = {
            ...normalizedClient,
            ...mapped,
            name: (mapped.name && mapped.name !== 'Patient sans nom') ? mapped.name : normalizedClient.name,
            firstName: mapped.firstName || normalizedClient.firstName,
            lastName: mapped.lastName || normalizedClient.lastName,
          };
          const current = loadLocal('clients', mockClients);
          const index = current.findIndex(c => c.id === finalClient.id);
          if (index !== -1) current[index] = finalClient;
          saveLocal('clients', current);
          return finalClient;
        }
      } catch (err) {
        console.warn('Supabase updateClient exception:', err);
      }
    }

    const current = loadLocal('clients', mockClients);
    const index = current.findIndex(c => c.id === normalizedClient.id);
    if (index !== -1) {
      current[index] = normalizedClient;
      saveLocal('clients', current);
    }
    return normalizedClient;
  },

  async deleteClient(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('client_notes').delete().or(`clientId.eq.${id},client_id.eq.${id}`);
        await supabase.from('invoices').delete().or(`clientId.eq.${id},client_id.eq.${id}`);
        await supabase.from('clients').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete client exception:', err);
      }
    }

    const current = loadLocal('clients', mockClients);
    const filtered = current.filter(c => c.id !== id);
    saveLocal('clients', filtered);
    return true;
  },

  // ==========================================
  // CLIENT NOTES & CLINICAL RECORDS
  // ==========================================
  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    const localNotes = loadLocal('notes', mockNotes).filter(n => n.clientId === clientId);

    if (isSupabaseConfigured && supabase) {
      try {
        let { data, error } = await supabase.from('client_notes').select('*').eq('client_id', clientId).order('date', { ascending: false });
        
        if (error || !data || data.length === 0) {
          const res = await supabase.from('client_notes').select('*').eq('clientId', clientId).order('date', { ascending: false });
          if (!res.error && res.data) {
            data = res.data;
            error = null;
          }
        }

        if (!error && data) {
          const remoteNotes = data.map(mapNoteFromDB);
          // If Supabase is active, it is the single source of truth. No unsynced merge to avoid undead items.
          return remoteNotes;
        }
      } catch (err) {
        console.warn('Supabase getClientNotes exception:', err);
      }
    }
    return localNotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async createClientNote(note: Omit<ClientNote, 'id'> & { id?: string; date?: string }): Promise<ClientNote> {
    const newNote: ClientNote = {
      ...note,
      id: note.id || crypto.randomUUID(),
      date: note.date || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const snakePayload: Record<string, any> = {
          id: newNote.id,
          client_id: newNote.clientId,
          date: newNote.date,
          motif: newNote.motif || '',
          anamnese: newNote.anamnese || '',
          treatment: newNote.treatment || '',
          content: newNote.content || '',
          category: newNote.category || 'treatment',
        };

        const camelPayload: Record<string, any> = {
          id: newNote.id,
          clientId: newNote.clientId,
          date: newNote.date,
          motif: newNote.motif || '',
          anamnese: newNote.anamnese || '',
          treatment: newNote.treatment || '',
          content: newNote.content || '',
          category: newNote.category || 'treatment',
        };

        const result = await executeResilientInsert('client_notes', [snakePayload, camelPayload]);

        if (result.success && result.data) {
          // Also update lastSessionAt on client
          try {
            await supabase.from('clients').update({ last_session_at: newNote.date, lastSessionAt: newNote.date }).eq('id', note.clientId);
          } catch {
            // non-fatal
          }

          const mapped = mapNoteFromDB(result.data);
          const current = loadLocal('notes', mockNotes);
          const idx = current.findIndex(n => n.id === mapped.id);
          if (idx !== -1) current[idx] = mapped;
          else current.push(mapped);
          saveLocal('notes', current);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase createClientNote exception:', err);
      }
    }

    const current = loadLocal('notes', mockNotes);
    const idx = current.findIndex(n => n.id === newNote.id);
    if (idx !== -1) current[idx] = newNote;
    else current.push(newNote);
    saveLocal('notes', current);

    // Update lastSessionAt in Client record locally
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
      try {
        const payload: Record<string, any> = {
          date: note.date,
          motif: note.motif || '',
          anamnese: note.anamnese || '',
          treatment: note.treatment || '',
          content: note.content || '',
          category: note.category || 'treatment',
        };

        const result = await executeResilientUpdate('client_notes', note.id, [payload]);
        if (result.success && result.data) {
          const mapped = mapNoteFromDB(result.data);
          const current = loadLocal('notes', mockNotes);
          const index = current.findIndex(n => n.id === note.id);
          if (index !== -1) current[index] = mapped;
          saveLocal('notes', current);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase updateClientNote exception:', err);
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
      try {
        await supabase.from('client_notes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete note exception:', err);
      }
    }

    const current = loadLocal('notes', mockNotes);
    const filtered = current.filter(n => n.id !== id);
    saveLocal('notes', filtered);
    return true;
  },

  // ==========================================
  // INVOICES & BILLING
  // ==========================================
  async getInvoices(): Promise<Invoice[]> {
    const localInvoices = loadLocal('invoices', mockInvoices);

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
        if (!error && data) {
          const remoteInvoices = data.map(mapInvoiceFromDB);
          // If Supabase is active, it is the single source of truth. No unsynced merge to avoid undead items.
          saveLocal('invoices', remoteInvoices);
          return remoteInvoices;
        }
        if (error) {
          console.warn('Supabase invoices fetch failed, using local storage:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase invoices fetch exception:', err);
      }
    }
    return localInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      try {
        const snakePayload: Record<string, any> = {
          id: newInvoice.id,
          invoice_number: newInvoice.invoiceNumber,
          client_id: newInvoice.clientId,
          client_name: newInvoice.clientName,
          date: newInvoice.date,
          amount: newInvoice.amount,
          status: newInvoice.status || 'paid',
          payment_method: newInvoice.paymentMethod || 'card',
          description: newInvoice.description || "Séance d'Ostéopathie",
          language: newInvoice.language || 'fr',
          ...(newInvoice.paymentDate ? { payment_date: newInvoice.paymentDate } : {}),
          ...(newInvoice.originalAmount !== undefined ? { original_amount: newInvoice.originalAmount } : {}),
          ...(newInvoice.discountAmount !== undefined ? { discount_amount: newInvoice.discountAmount } : {}),
          ...(newInvoice.discountType ? { discount_type: newInvoice.discountType } : {}),
          ...(newInvoice.discountLabel ? { discount_label: newInvoice.discountLabel } : {}),
          ...(newInvoice.noteId ? { note_id: newInvoice.noteId } : {}),
        };

        const camelPayload: Record<string, any> = {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          clientId: newInvoice.clientId,
          clientName: newInvoice.clientName,
          date: newInvoice.date,
          amount: newInvoice.amount,
          status: newInvoice.status || 'paid',
          paymentMethod: newInvoice.paymentMethod || 'card',
          description: newInvoice.description || "Séance d'Ostéopathie",
          language: newInvoice.language || 'fr',
          ...(newInvoice.paymentDate ? { paymentDate: newInvoice.paymentDate } : {}),
          ...(newInvoice.originalAmount !== undefined ? { originalAmount: newInvoice.originalAmount } : {}),
          ...(newInvoice.discountAmount !== undefined ? { discountAmount: newInvoice.discountAmount } : {}),
          ...(newInvoice.discountType ? { discountType: newInvoice.discountType } : {}),
          ...(newInvoice.discountLabel ? { discountLabel: newInvoice.discountLabel } : {}),
          ...(newInvoice.noteId ? { noteId: newInvoice.noteId } : {}),
        };

        const result = await executeResilientInsert('invoices', [snakePayload, camelPayload]);

        if (result.success && result.data) {
          const mapped = mapInvoiceFromDB(result.data);
          const idx = currentInvoices.findIndex(i => i.id === mapped.id);
          if (idx !== -1) currentInvoices[idx] = mapped;
          else currentInvoices.push(mapped);
          saveLocal('invoices', currentInvoices);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase createInvoice exception:', err);
      }
    }

    const idx = currentInvoices.findIndex(i => i.id === newInvoice.id);
    if (idx !== -1) currentInvoices[idx] = newInvoice;
    else currentInvoices.push(newInvoice);
    saveLocal('invoices', currentInvoices);
    return newInvoice;
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    if (isSupabaseConfigured && supabase) {
      try {
        const snakePayload: Record<string, any> = {
          invoice_number: invoice.invoiceNumber,
          client_id: invoice.clientId,
          client_name: invoice.clientName,
          date: invoice.date,
          amount: invoice.amount,
          status: invoice.status,
          payment_method: invoice.paymentMethod,
          description: invoice.description,
          language: invoice.language,
          ...(invoice.paymentDate !== undefined ? { payment_date: invoice.paymentDate } : {}),
          ...(invoice.originalAmount !== undefined ? { original_amount: invoice.originalAmount } : {}),
          ...(invoice.discountAmount !== undefined ? { discount_amount: invoice.discountAmount } : {}),
          ...(invoice.discountType ? { discount_type: invoice.discountType } : {}),
          ...(invoice.discountLabel ? { discount_label: invoice.discountLabel } : {}),
        };

        const camelPayload: Record<string, any> = {
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          date: invoice.date,
          amount: invoice.amount,
          status: invoice.status,
          paymentMethod: invoice.paymentMethod,
          description: invoice.description,
          language: invoice.language,
          ...(invoice.paymentDate !== undefined ? { paymentDate: invoice.paymentDate } : {}),
          ...(invoice.originalAmount !== undefined ? { originalAmount: invoice.originalAmount } : {}),
          ...(invoice.discountAmount !== undefined ? { discountAmount: invoice.discountAmount } : {}),
          ...(invoice.discountType ? { discountType: invoice.discountType } : {}),
          ...(invoice.discountLabel ? { discountLabel: invoice.discountLabel } : {}),
        };

        const result = await executeResilientUpdate('invoices', invoice.id, [snakePayload, camelPayload]);
        if (result.success && result.data) {
          const mapped = mapInvoiceFromDB(result.data);
          const current = loadLocal('invoices', mockInvoices);
          const index = current.findIndex(i => i.id === invoice.id);
          if (index !== -1) current[index] = mapped;
          saveLocal('invoices', current);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase updateInvoice exception:', err);
      }
    }

    const current = loadLocal('invoices', mockInvoices);
    const index = current.findIndex(c => c.id === invoice.id);
    if (index !== -1) {
      current[index] = invoice;
      saveLocal('invoices', current);
    }
    return invoice;
  },

  async deleteInvoice(id: string): Promise<boolean> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('invoices').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase delete invoice exception:', err);
      }
    }

    const current = loadLocal('invoices', mockInvoices);
    const filtered = current.filter(i => i.id !== id);
    saveLocal('invoices', filtered);
    return true;
  },

  // ==========================================
  // LOCAL & SUPABASE CALENDAR EVENTS
  // ==========================================
  async getLocalEvents(): Promise<CalendarEvent[]> {
    const localEvents = loadLocal('events', mockEvents);
    let allClients: Client[] = [];
    try {
      allClients = await this.getClients();
    } catch {
      allClients = loadLocal('clients', mockClients);
    }
    const clientMap = new Map(allClients.map(c => [c.id, c.name]));
    const clientByNameMap = new Map<string, Client>();
    allClients.forEach(c => {
      if (c.name) clientByNameMap.set(c.name.toLowerCase().trim(), c);
      if (c.firstName && c.lastName) {
        clientByNameMap.set(`${c.firstName} ${c.lastName}`.toLowerCase().trim(), c);
        clientByNameMap.set(`${c.lastName} ${c.firstName}`.toLowerCase().trim(), c);
      }
    });

    const enrichEvent = (ev: CalendarEvent): CalendarEvent => {
      let resolvedClientId = ev.clientId;
      let resolvedClientName = ev.clientName;

      // 1. If we have a valid clientId pointing to an existing client, ALWAYS resolve to current up-to-date name
      if (resolvedClientId && clientMap.has(resolvedClientId)) {
        resolvedClientName = clientMap.get(resolvedClientId);
      } else if (resolvedClientName) {
        // If no valid clientId or not found, try matching by name to link clientId
        const matched = clientByNameMap.get(resolvedClientName.toLowerCase().trim());
        if (matched) {
          resolvedClientId = matched.id;
          resolvedClientName = matched.name;
        }
      } else if (ev.summary) {
        // Try resolving from summary (e.g. "LAURENT Marie - Consultation")
        const parts = ev.summary.split(' - ');
        const candidate = parts[0].trim();
        const matched = clientByNameMap.get(candidate.toLowerCase());
        if (matched) {
          resolvedClientId = matched.id;
          resolvedClientName = matched.name;
        } else if (parts.length > 1 && candidate.length > 1) {
          resolvedClientName = candidate;
        }
      }

      return {
        ...ev,
        clientId: resolvedClientId,
        clientName: resolvedClientName || ev.summary,
      };
    };

    if (isSupabaseConfigured && supabase) {
      try {
        let { data, error } = await supabase.from('calendar_events').select('*').order('start', { ascending: true });
        if (error && (error.message?.includes('relation') || error.code === '42P01')) {
          const fallback = await supabase.from('events').select('*').order('start', { ascending: true });
          data = fallback.data;
          error = fallback.error;
        }

        if (!error && data) {
          const remoteEvents = data.map(row => enrichEvent(mapEventFromDB(row)));
          const sortedEvents = remoteEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

          // If Supabase is active, it is the single source of truth.
          saveLocal('events', sortedEvents);
          return sortedEvents;
        }
      } catch (err) {
        console.warn('Supabase getLocalEvents exception:', err);
      }
    }
    return localEvents.map(enrichEvent).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },

  async createLocalEvent(event: Omit<CalendarEvent, 'id'> & { id?: string }): Promise<CalendarEvent> {
    const validId = (event.id && event.id.length > 10) ? event.id : crypto.randomUUID();
    const newEvent: CalendarEvent = {
      ...event,
      id: validId,
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const snakePayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description || '',
          start: newEvent.start,
          end: newEvent.end,
          client_id: (newEvent.clientId && newEvent.clientId.includes('-')) ? newEvent.clientId : null,
          client_name: newEvent.clientName || '',
          patient_name: newEvent.clientName || '',
          event_type: newEvent.eventType || 'appointment',
        };

        const camelPayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description || '',
          start: newEvent.start,
          end: newEvent.end,
          clientId: (newEvent.clientId && newEvent.clientId.includes('-')) ? newEvent.clientId : null,
          clientName: newEvent.clientName || '',
          eventType: newEvent.eventType || 'appointment',
        };

        const timePayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description || '',
          start_time: newEvent.start,
          end_time: newEvent.end,
          client_id: (newEvent.clientId && newEvent.clientId.includes('-')) ? newEvent.clientId : null,
          client_name: newEvent.clientName || '',
        };

        const minimalPayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          start: newEvent.start,
          end: newEvent.end,
        };

        let result = await executeResilientInsert('calendar_events', [snakePayload, camelPayload, timePayload, minimalPayload]);

        if (!result.success && result.error && (result.error.message?.includes('relation') || result.error.code === '42P01')) {
          console.warn('[Supabase] calendar_events missing, retrying with table "events"');
          result = await executeResilientInsert('events', [snakePayload, camelPayload, timePayload, minimalPayload]);
        }

        if (result.success && result.data) {
          const mapped = mapEventFromDB(result.data);
          const finalEvent: CalendarEvent = {
            ...newEvent,
            ...mapped,
            clientId: mapped.clientId || newEvent.clientId,
            clientName: mapped.clientName || newEvent.clientName,
            summary: mapped.summary || newEvent.summary,
            eventType: mapped.eventType || newEvent.eventType,
          };
          const current = loadLocal('events', mockEvents);
          const idx = current.findIndex(e => e.id === finalEvent.id);
          if (idx !== -1) current[idx] = finalEvent;
          else current.push(finalEvent);
          saveLocal('events', current);
          return finalEvent;
        } else {
          console.error('[Supabase createLocalEvent error]', result.error);
        }
      } catch (err) {
        console.warn('Supabase createLocalEvent exception:', err);
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
      try {
        const snakePayload: Record<string, any> = {
          summary: event.summary,
          description: event.description || '',
          start: event.start,
          end: event.end,
          client_id: (event.clientId && event.clientId.includes('-')) ? event.clientId : null,
          client_name: event.clientName || '',
          patient_name: event.clientName || '',
          event_type: event.eventType || 'appointment',
        };

        const camelPayload: Record<string, any> = {
          summary: event.summary,
          description: event.description || '',
          start: event.start,
          end: event.end,
          clientId: (event.clientId && event.clientId.includes('-')) ? event.clientId : null,
          clientName: event.clientName || '',
          eventType: event.eventType || 'appointment',
        };

        const timePayload: Record<string, any> = {
          summary: event.summary,
          description: event.description || '',
          start_time: event.start,
          end_time: event.end,
        };

        let result = await executeResilientUpdate('calendar_events', event.id, [snakePayload, camelPayload, timePayload]);

        if (!result.success && result.error && (result.error.message?.includes('relation') || result.error.code === '42P01')) {
          result = await executeResilientUpdate('events', event.id, [snakePayload, camelPayload, timePayload]);
        }

        if (result.success && result.data) {
          const mapped = mapEventFromDB(result.data);
          const finalEvent: CalendarEvent = {
            ...event,
            ...mapped,
            clientId: mapped.clientId || event.clientId,
            clientName: mapped.clientName || event.clientName,
            summary: mapped.summary || event.summary,
            eventType: mapped.eventType || event.eventType,
          };
          const current = loadLocal('events', mockEvents);
          const index = current.findIndex(e => e.id === event.id);
          if (index !== -1) current[index] = finalEvent;
          saveLocal('events', current);
          return finalEvent;
        } else {
          console.error('[Supabase updateLocalEvent error]', result.error);
        }
      } catch (err) {
        console.warn('Supabase updateLocalEvent exception:', err);
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
      try {
        const { error } = await supabase.from('calendar_events').delete().eq('id', id);
        if (error && (error.message?.includes('relation') || error.code === '42P01')) {
          await supabase.from('events').delete().eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase deleteLocalEvent exception:', err);
      }
    }

    const current = loadLocal('events', mockEvents);
    const filtered = current.filter(e => e.id !== id);
    saveLocal('events', filtered);
    return true;
  }
};
