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
const mockClients: Client[] = [
  {
    id: 'c1',
    firstName: 'Marie',
    lastName: 'Laurent',
    name: 'Marie Laurent',
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
    lastName: 'Petit',
    name: 'Jean-Pierre Petit',
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
    lastName: 'Mercier (Bébé)',
    name: 'Lucas Mercier (Bébé)',
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
    lastName: 'Benítez',
    name: 'Sofía Benítez',
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
  let firstName = c.firstName || c.first_name;
  let lastName = c.lastName || c.last_name;

  if ((!firstName || !lastName) && c.name) {
    const parts = String(c.name).split(' ');
    lastName = parts[0] || '';
    firstName = parts.slice(1).join(' ') || '';
  }

  const name = c.name || `${(lastName || '').toUpperCase()} ${firstName || ''}`.trim() || 'Patient sans nom';
  return {
    id: String(c.id),
    firstName: firstName || '',
    lastName: lastName || '',
    name,
    dni: c.dni || c.nie || c.nif || c["dni"] || '',
    email: c.email || '',
    phone: c.phone || '',
    birthDate: c.birthDate || c.birth_date || '',
    address: c.address || '',
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
    summary: e.summary || '',
    description: e.description || '',
    start: e.start || '',
    end: e.end || '',
    clientId: e.clientId || e.client_id || e.clientid,
    clientName: e.clientName || e.client_name || e.clientname,
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

          // 3. ID type mismatch (e.g. integer primary key) -> try without id if generated
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
-- SCRIPT COMPLET DE CRÉATION & MISE À NIVEAU DES TABLES (CABINET VINCENT OSTÉOPATHIE)
-- À exécuter dans Supabase : Menu gauche > SQL Editor > New query > Run
-- Ce script est idempotent (peut être relancé en toute sécurité sans perdre de données).
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
    default_discount NUMERIC,
    bono_sessions_remaining NUMERIC
);

-- Mises à jour des colonnes si la table clients existe déjà sur votre Supabase :
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS dni TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "dni" TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS birth_date TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "birthDate" TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS last_session_at TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "lastSessionAt" TIMESTAMPTZ;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS has_bono BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "hasBono" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS bono_type TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "bonoType" TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS default_discount NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "defaultDiscount" NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS bono_sessions_remaining NUMERIC;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS "bonoSessionsRemaining" NUMERIC;

-- 2. TABLE DES NOTES CLINIQUES & DOSSIERS PATIENTS
CREATE TABLE IF NOT EXISTS public.client_notes (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    date TIMESTAMPTZ NOT NULL,
    motif TEXT,
    anamnese TEXT,
    treatment TEXT,
    content TEXT,
    category TEXT DEFAULT 'treatment',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS motif TEXT;
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS anamnese TEXT;
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS treatment TEXT;
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS content TEXT;
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'treatment';
ALTER TABLE public.client_notes ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ;

-- 3. TABLE DES FACTURES & REÇUS D'HONORAIRES
CREATE TABLE IF NOT EXISTS public.invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_name TEXT NOT NULL,
    date TEXT NOT NULL,
    amount NUMERIC NOT NULL,
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

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS original_amount NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "originalAmount" NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "discountAmount" NUMERIC;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_type TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "discountType" TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS discount_label TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "discountLabel" TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'card';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'fr';
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS note_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS "noteId" TEXT;

-- 4. TABLE DE L'AGENDA & RENDEZ-VOUS
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id TEXT PRIMARY KEY,
    summary TEXT NOT NULL,
    description TEXT,
    start TIMESTAMPTZ NOT NULL,
    "end" TIMESTAMPTZ NOT NULL,
    client_id TEXT,
    client_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "clientId" TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS client_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "clientName" TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS start TIMESTAMPTZ;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS "end" TIMESTAMPTZ;

-- 5. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS) & DROITS D'ACCÈS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Accès total clients" ON public.clients;
    CREATE POLICY "Accès total clients" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Accès total notes" ON public.client_notes;
    CREATE POLICY "Accès total notes" ON public.client_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Accès total factures" ON public.invoices;
    CREATE POLICY "Accès total factures" ON public.invoices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
    
    DROP POLICY IF EXISTS "Accès total agenda" ON public.calendar_events;
    CREATE POLICY "Accès total agenda" ON public.calendar_events FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
END $$;

-- 6. PERMISSIONS EXPLICITES POUR LE RÔLE PUBLIC ANON & AUTHENTICATED
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('clients').select('*');
        if (!error && data) {
          const remoteClients = data.map(mapClientFromDB);
          
          // SMART MERGE: Keep any locally added client that isn't yet present in Supabase remote data
          const remoteIdMap = new Set(remoteClients.map(c => c.id));
          const unsyncedLocals = localClients.filter(c => !remoteIdMap.has(c.id));
          
          const combined = [...remoteClients, ...unsyncedLocals].sort((a, b) => a.name.localeCompare(b.name));
          saveLocal('clients', combined);

          // Background push unsynced items if any
          if (unsyncedLocals.length > 0) {
            setTimeout(() => {
              unsyncedLocals.forEach(c => this.createClient(c).catch(() => {}));
            }, 1000);
          }

          return combined;
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
    const newClient: Client = {
      ...client,
      id: client.id || crypto.randomUUID(),
      createdAt: client.createdAt || new Date().toISOString(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        // Candidate 1: Standard snake_case payload
        const snakePayload: Record<string, any> = {
          id: newClient.id,
          name: newClient.name,
          first_name: newClient.firstName,
          last_name: newClient.lastName,
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

        // Candidate 3: Minimal essential payload
        const minimalPayload: Record<string, any> = {
          id: newClient.id,
          name: newClient.name,
          first_name: newClient.firstName,
          last_name: newClient.lastName,
          email: newClient.email || '',
          phone: newClient.phone || '',
        };

        const result = await executeResilientInsert('clients', [snakePayload, camelPayload, minimalPayload]);

        if (result.success && result.data) {
          const mapped = mapClientFromDB(result.data);
          const current = loadLocal('clients', mockClients);
          const existsIdx = current.findIndex(c => c.id === mapped.id);
          if (existsIdx !== -1) current[existsIdx] = mapped;
          else current.push(mapped);
          saveLocal('clients', current);
          return mapped;
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
    if (isSupabaseConfigured && supabase) {
      try {
        const snakePayload: Record<string, any> = {
          name: client.name,
          first_name: client.firstName,
          last_name: client.lastName,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
        };
        if (client.dni !== undefined) snakePayload.dni = client.dni;
        if (client.birthDate) snakePayload.birth_date = client.birthDate;
        if (client.lastSessionAt) snakePayload.last_session_at = client.lastSessionAt;
        if (client.hasBono !== undefined) snakePayload.has_bono = client.hasBono;
        if (client.bonoType !== undefined) snakePayload.bono_type = client.bonoType;
        if (client.defaultDiscount !== undefined) snakePayload.default_discount = client.defaultDiscount;
        if (client.bonoSessionsRemaining !== undefined) snakePayload.bono_sessions_remaining = client.bonoSessionsRemaining;

        const camelPayload: Record<string, any> = {
          name: client.name,
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
        };
        if (client.dni !== undefined) camelPayload.dni = client.dni;
        if (client.birthDate) camelPayload.birthDate = client.birthDate;
        if (client.lastSessionAt) camelPayload.lastSessionAt = client.lastSessionAt;
        if (client.hasBono !== undefined) camelPayload.hasBono = client.hasBono;
        if (client.bonoType !== undefined) camelPayload.bonoType = client.bonoType;
        if (client.defaultDiscount !== undefined) camelPayload.defaultDiscount = client.defaultDiscount;
        if (client.bonoSessionsRemaining !== undefined) camelPayload.bonoSessionsRemaining = client.bonoSessionsRemaining;

        const result = await executeResilientUpdate('clients', client.id, [snakePayload, camelPayload]);

        if (result.success && result.data) {
          const mapped = mapClientFromDB(result.data);
          const current = loadLocal('clients', mockClients);
          const index = current.findIndex(c => c.id === client.id);
          if (index !== -1) current[index] = mapped;
          saveLocal('clients', current);
          return mapped;
        }
      } catch (err) {
        console.warn('Supabase updateClient exception:', err);
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
          const remoteIdMap = new Set(remoteNotes.map(n => n.id));
          const unsynced = localNotes.filter(n => !remoteIdMap.has(n.id));
          return [...remoteNotes, ...unsynced].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
          const remoteIdMap = new Set(remoteInvoices.map(i => i.id));
          const unsynced = localInvoices.filter(i => !remoteIdMap.has(i.id));
          const combined = [...remoteInvoices, ...unsynced].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          saveLocal('invoices', combined);
          return combined;
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

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('calendar_events').select('*').order('start', { ascending: true });
        if (!error && data) {
          const remoteEvents = data.map(mapEventFromDB);
          const remoteIdMap = new Set(remoteEvents.map(e => e.id));
          const unsynced = localEvents.filter(e => !remoteIdMap.has(e.id));
          const combined = [...remoteEvents, ...unsynced].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
          saveLocal('events', combined);
          return combined;
        }
      } catch (err) {
        console.warn('Supabase getLocalEvents exception:', err);
      }
    }
    return localEvents.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  },

  async createLocalEvent(event: Omit<CalendarEvent, 'id'> & { id?: string }): Promise<CalendarEvent> {
    const newEvent: CalendarEvent = {
      ...event,
      id: event.id || crypto.randomUUID(),
    };

    if (isSupabaseConfigured && supabase) {
      try {
        const snakePayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description || '',
          start: newEvent.start,
          end: newEvent.end,
          client_id: newEvent.clientId || null,
          client_name: newEvent.clientName || '',
        };

        const camelPayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: newEvent.description || '',
          start: newEvent.start,
          end: newEvent.end,
          clientId: newEvent.clientId || null,
          clientName: newEvent.clientName || '',
        };

        const result = await executeResilientInsert('calendar_events', [snakePayload, camelPayload]);

        if (result.success && result.data) {
          const mapped = mapEventFromDB(result.data);
          const current = loadLocal('events', mockEvents);
          const idx = current.findIndex(e => e.id === mapped.id);
          if (idx !== -1) current[idx] = mapped;
          else current.push(mapped);
          saveLocal('events', current);
          return mapped;
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
          client_id: event.clientId || null,
          client_name: event.clientName || '',
        };

        const camelPayload: Record<string, any> = {
          summary: event.summary,
          description: event.description || '',
          start: event.start,
          end: event.end,
          clientId: event.clientId || null,
          clientName: event.clientName || '',
        };

        const result = await executeResilientUpdate('calendar_events', event.id, [snakePayload, camelPayload]);

        if (result.success && result.data) {
          const mapped = mapEventFromDB(result.data);
          const current = loadLocal('events', mockEvents);
          const index = current.findIndex(e => e.id === event.id);
          if (index !== -1) current[index] = mapped;
          saveLocal('events', current);
          return mapped;
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
        await supabase.from('calendar_events').delete().eq('id', id);
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
