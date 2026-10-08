import { createClient } from '@supabase/supabase-js';
import { Client, ClientNote, Invoice, CalendarEvent, EventType } from '../types';

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
// DATA INITIALIZATION & LOCAL STORAGE HELPERS
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

// No mock data: empty defaults
const mockClients: Client[] = [];
const mockNotes: ClientNote[] = [];
const mockInvoices: Invoice[] = [];
const mockEvents: CalendarEvent[] = [];

// Known legacy mock IDs to purge from any browser localStorage cache
const LEGACY_MOCK_IDS = new Set([
  'c1', 'c2', 'c3', 'c4',
  'n1', 'n2', 'n3', 'n4',
  'i1', 'i2', 'i3', 'i4', 'i5', 'i_h1', 'i_h2', 'i_h3', 'i_h4', 'i_h5', 'i_h6',
  'e1', 'e2', 'e3'
]);

// Persistent tombstones so deleted entities stay deleted even across remote syncs
export const addDeletedTombstone = (entity: string, key?: string | null) => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined' || !key) return;
  try {
    const storageKey = `vincent_osteo_deleted_${entity}`;
    const raw = localStorage.getItem(storageKey);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch {}
};

export const isDeletedTombstone = (entity: string, ...keys: (string | undefined | null)[]): boolean => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  try {
    const storageKey = `vincent_osteo_deleted_${entity}`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return false;
    const list: string[] = JSON.parse(raw);
    return keys.some(k => k && list.includes(k));
  } catch {
    return false;
  }
};

// Helper to load or initialize from LocalStorage (with legacy mock filtering & tombstone support)
const loadLocal = <T>(key: string, seed: T[] = []): T[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return seed;
  const data = localStorage.getItem(`vincent_osteo_${key}`);
  if (!data) {
    if (seed.length > 0) {
      localStorage.setItem(`vincent_osteo_${key}`, JSON.stringify(seed));
    }
    return seed;
  }
  try {
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) {
      const cleaned = parsed.filter((item: any) => {
        if (!item) return false;
        if (LEGACY_MOCK_IDS.has(item.id)) return false;
        if (isDeletedTombstone(key, item.id, item.invoiceNumber, item.invoice_number, item.name)) return false;
        return true;
      });
      if (cleaned.length !== parsed.length) {
        localStorage.setItem(`vincent_osteo_${key}`, JSON.stringify(cleaned));
      }
      return cleaned as T[];
    }
    return parsed;
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
    profileNote: c.profileNote || c.profile_note || c.remarque || c.note || '',
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

export function normalizeInvoiceDescription(desc?: string): string {
  if (!desc) return "Sesión de osteopatía";
  const t = desc.trim().toLowerCase();

  // Bono packages
  if (t.includes('bono') && (t.includes('160') || t.includes('3 session') || t.includes('3 séance') || t.includes('3 sesion') || t.includes('3-session'))) {
    return "Bono Osteopatía - 3 sesiones (160 €)";
  }
  if (t.includes('bono') && (t.includes('250') || t.includes('5 session') || t.includes('5 séance') || t.includes('5 sesion') || t.includes('5-session'))) {
    return "Bono Osteopatía - 5 sesiones (250 €)";
  }
  if (t.includes('décompté') || t.includes('canjeada') || t.includes('redeemed') || t.includes('prise en compte')) {
    return "Sesión de osteopatía";
  }

  // Any single osteopathy session
  return "Sesión de osteopatía";
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
    description: normalizeInvoiceDescription(i.description),
    language: 'es',
    quantity: Number(i.quantity) || 1,
    noteId: i.noteId || i.note_id || undefined,
  };
}

/**
 * Sorts invoices by date (descending by default: most recent first).
 * If dates are equal, breaks ties with invoice number descending.
 */
export function sortInvoicesByDate(invoicesList: Invoice[], ascending: boolean = false): Invoice[] {
  return [...invoicesList].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : 0;
    const timeB = b.date ? new Date(b.date).getTime() : 0;
    if (timeA !== timeB) {
      return ascending ? timeA - timeB : timeB - timeA;
    }
    const numA = parseInt(String(a.invoiceNumber || '').match(/\d+$/)?.[0] || '0', 10);
    const numB = parseInt(String(b.invoiceNumber || '').match(/\d+$/)?.[0] || '0', 10);
    return ascending ? numA - numB : numB - numA;
  });
}

function prepareDescriptionWithMeta(description?: string, eventType?: EventType): string {
  const clean = (description || '').replace(/\[eventType:[a-z]+\]/gi, '').replace(/\[type:[a-z]+\]/gi, '').trim();
  if (eventType && eventType !== 'appointment') {
    return clean ? `${clean}\n[eventType:blocked]` : `[eventType:blocked]`;
  }
  return clean;
}

export function mapEventFromDB(e: any): CalendarEvent {
  const rawDesc = e.description || e.notes || e.note || '';
  let eventType: EventType | undefined = e.eventType || e.event_type || e.type;

  if (!eventType && rawDesc) {
    const match = rawDesc.match(/\[eventType:([a-z]+)\]/i) || rawDesc.match(/\[type:([a-z]+)\]/i);
    if (match && match[1]) {
      const parsed = match[1].toLowerCase();
      eventType = (parsed === 'appointment') ? 'appointment' : 'blocked';
    }
  }

  const cleanDesc = rawDesc.replace(/\[eventType:[a-z]+\]/gi, '').replace(/\[type:[a-z]+\]/gi, '').trim();
  const summaryStr = e.summary || e.title || e.intitule || '';

  if (!eventType) {
    if (e.clientId || e.client_id || e.clientid || e.patient_id || e.patientId) {
      eventType = 'appointment';
    } else {
      const lowerSummary = summaryStr.toLowerCase().trim();
      if (!summaryStr || ['rdv patient', 'rendez-vous', 'cita', 'appointment', 'sesión de osteopatía', "séance d'ostéopathie", 'osteopathy session'].includes(lowerSummary)) {
        eventType = 'appointment';
      } else {
        eventType = 'blocked';
      }
    }
  } else if (eventType !== 'appointment') {
    eventType = 'blocked';
  }

  const hasClient = Boolean(e.clientId || e.client_id || e.clientid || e.patient_id || e.patientId);

  return {
    id: String(e.id),
    summary: summaryStr,
    description: cleanDesc,
    start: e.start || e.start_time || e.startTime || '',
    end: e.end || e.end_time || e.endTime || '',
    clientId: hasClient ? (e.clientId || e.client_id || e.clientid || e.patient_id || e.patientId) : undefined,
    clientName: hasClient ? (e.clientName || e.client_name || e.clientname || e.patient_name || e.patientName) : undefined,
    eventType: eventType || 'appointment',
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
 * - "Could not find the column 'payment_date' of 'invoices' in the schema cache"
 * - 'column "birth_date" does not exist'
 * - 'column invoices.payment_date does not exist'
 */
function extractMissingColumn(errorMsg: string): string | null {
  if (!errorMsg) return null;
  const match1 = errorMsg.match(/column ["']?([a-zA-Z0-9_]+)["']? of relation/i);
  if (match1 && match1[1]) return match1[1];

  const match2 = errorMsg.match(/Could not find the (?:column )?['"‘]([a-zA-Z0-9_]+)['"’]/i);
  if (match2 && match2[1]) return match2[1];

  const match2b = errorMsg.match(/Could not find the ['"‘]([a-zA-Z0-9_]+)['"’] column/i);
  if (match2b && match2b[1]) return match2b[1];

  const match3 = errorMsg.match(/column ["']?([a-zA-Z0-9_]+)["']? does not exist/i);
  if (match3 && match3[1]) return match3[1];

  const match4 = errorMsg.match(/column [a-zA-Z0-9_]+\.([a-zA-Z0-9_]+) does not exist/i);
  if (match4 && match4[1]) return match4[1];

  const match5 = errorMsg.match(/schema cache lookup failed for column ["']?([a-zA-Z0-9_]+)["']?/i);
  if (match5 && match5[1]) return match5[1];

  return null;
}

/**
 * Finds the corresponding key in payload regardless of snake_case or camelCase.
 */
function findMatchingKey(payload: Record<string, any>, col: string): string | null {
  if (col in payload) return col;
  const colClean = col.toLowerCase().replace(/_/g, '');
  for (const k of Object.keys(payload)) {
    if (k.toLowerCase().replace(/_/g, '') === colClean) return k;
  }
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
    const maxAttempts = Object.keys(currentPayload).length + 4;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        // Try insert with .select() (array returned, never throws PGRST116)
        const res = await supabase.from(table).insert(currentPayload).select();
        if (!res.error) {
          const rowData = (res.data && res.data.length > 0) ? res.data[0] : currentPayload;
          lastSupabaseStatus = {
            lastAction: `Insert ${table}`,
            success: true,
            timestamp: new Date().toISOString(),
          };
          return { data: rowData, error: null, success: true };
        }

        // If insert failed, inspect error details and auto-heal
        if (res.error) {
          lastError = res.error;
          const fullMsg = [res.error.message, res.error.details, res.error.hint].filter(Boolean).join(' ');

          // 1. Missing column error -> strip column & retry
          const missingCol = extractMissingColumn(fullMsg);
          if (missingCol) {
            const keyToDelete = findMatchingKey(currentPayload, missingCol);
            if (keyToDelete && keyToDelete in currentPayload) {
              console.warn(`[Supabase Auto-Heal] Column "${keyToDelete}" does not exist in "${table}". Stripping and retrying.`);
              delete currentPayload[keyToDelete];
              continue;
            }
          }

          // 2. Try plain insert without .select() if it was an RLS policy issue with select
          if (fullMsg.includes('row-level security') || res.error.code === 'PGRST116' || res.error.code === '42501') {
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
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (fullMsg.includes('invalid input syntax for type uuid') || fullMsg.includes('22P02')) {
            let strippedAny = false;
            if (currentPayload.client_id && typeof currentPayload.client_id === 'string' && !UUID_REGEX.test(currentPayload.client_id)) {
              console.warn(`[Supabase Auto-Heal] client_id "${currentPayload.client_id}" is not a valid UUID. Stripping.`);
              delete currentPayload.client_id;
              strippedAny = true;
            }
            if (currentPayload.clientId && typeof currentPayload.clientId === 'string' && !UUID_REGEX.test(currentPayload.clientId)) {
              console.warn(`[Supabase Auto-Heal] clientId "${currentPayload.clientId}" is not a valid UUID. Stripping.`);
              delete currentPayload.clientId;
              strippedAny = true;
            }
            if (currentPayload.note_id && typeof currentPayload.note_id === 'string' && !UUID_REGEX.test(currentPayload.note_id)) {
              delete currentPayload.note_id;
              strippedAny = true;
            }
            if (currentPayload.noteId && typeof currentPayload.noteId === 'string' && !UUID_REGEX.test(currentPayload.noteId)) {
              delete currentPayload.noteId;
              strippedAny = true;
            }
            if ('id' in currentPayload && typeof currentPayload.id === 'string' && !UUID_REGEX.test(currentPayload.id)) {
              console.warn(`[Supabase Auto-Heal] id "${currentPayload.id}" is not a valid UUID. Regenerating UUID.`);
              currentPayload.id = crypto.randomUUID();
              strippedAny = true;
            }
            if (strippedAny) continue;
          }

          // 4. Foreign key violation -> strip foreign key column & retry
          if (fullMsg.includes('foreign key constraint') || res.error.code === '23503') {
            let strippedFk = false;
            if ('client_id' in currentPayload) { delete currentPayload.client_id; strippedFk = true; }
            if ('clientId' in currentPayload) { delete currentPayload.clientId; strippedFk = true; }
            if ('note_id' in currentPayload) { delete currentPayload.note_id; strippedFk = true; }
            if ('noteId' in currentPayload) { delete currentPayload.noteId; strippedFk = true; }
            if (strippedFk) continue;
          }

          // 5. ID type mismatch (e.g. integer primary key) -> try without id if generated
          if (fullMsg.includes('invalid input syntax for type integer') || fullMsg.includes('invalid input syntax for type bigint')) {
            if ('id' in currentPayload) {
              console.warn(`[Supabase Auto-Heal] Table "${table}" uses integer IDs. Stripping string UUID and retrying.`);
              delete currentPayload.id;
              continue;
            }
          }

          // 6. Duplicate key / primary key violation
          if (fullMsg.includes('duplicate key') || res.error.code === '23505') {
            // If invoice number collision: query actual max from DB to guarantee a non-colliding next invoice number
            if (table === 'invoices' && (fullMsg.includes('invoiceNumber') || fullMsg.includes('invoice_number') || fullMsg.includes('invoices_invoiceNumber_key') || fullMsg.includes('invoices_invoice_number_key'))) {
              let maxNum = 100;
              try {
                const { data: dbInvs } = await supabase.from('invoices').select('invoiceNumber, invoice_number');
                for (const r of dbInvs || []) {
                  const m = String(r.invoiceNumber || r.invoice_number || '').match(/\d+$/);
                  if (m) {
                    const val = parseInt(m[0], 10);
                    if (val > maxNum) maxNum = val;
                  }
                }
              } catch {}
              const rawNum = currentPayload.invoiceNumber || currentPayload.invoice_number || '';
              const match = String(rawNum).match(/\d+$/);
              const curVal = match ? parseInt(match[0], 10) : 100;
              const nextVal = `FAC-${new Date().getFullYear()}-${Math.max(maxNum + 1, curVal + 1)}`;
              console.warn(`[Supabase Auto-Heal] Invoice number collision on ${rawNum}. Retrying with ${nextVal}`);
              currentPayload.invoiceNumber = nextVal;
              currentPayload.invoice_number = nextVal;
              continue;
            }

            // Primary key id collision
            if (fullMsg.includes('_pkey') || fullMsg.includes('key (id)=')) {
              currentPayload.id = crypto.randomUUID();
              console.warn(`[Supabase Auto-Heal] Primary key collision on ${table}. Retrying with new UUID.`);
              continue;
            }

            try {
              const targetId = currentPayload.id || initialPayload.id;
              if (targetId) {
                const updRes = await supabase.from(table).update(currentPayload).eq('id', targetId).select();
                if (!updRes.error && updRes.data && updRes.data.length > 0) {
                  return { data: updRes.data[0] || currentPayload, error: null, success: true };
                }
              }
            } catch {
              // ignore
            }
          }

          // 7. Not-null constraint violation -> check if alternate case exists in payload
          if (fullMsg.includes('not-null constraint') || res.error.code === '23502') {
            const notNullColMatch = fullMsg.match(/null value in column ["']?([a-zA-Z0-9_]+)["']?/i);
            if (notNullColMatch && notNullColMatch[1]) {
              const neededCol = notNullColMatch[1];
              const matchingExistingKey = findMatchingKey(currentPayload, neededCol);
              if (matchingExistingKey && matchingExistingKey !== neededCol) {
                console.warn(`[Supabase Auto-Heal] Supplying ${neededCol} from ${matchingExistingKey} to satisfy not-null constraint.`);
                currentPayload[neededCol] = currentPayload[matchingExistingKey];
                continue;
              }
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
    const maxAttempts = Object.keys(currentPayload).length + 4;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const res = await supabase.from(table).update(currentPayload).eq('id', id).select();
        if (!res.error) {
          if (res.data && res.data.length > 0) {
            lastSupabaseStatus = {
              lastAction: `Update ${table}`,
              success: true,
              timestamp: new Date().toISOString(),
            };
            return { data: res.data[0], error: null, success: true };
          }

          // Zero rows updated by id -> try matching by invoiceNumber / invoice_number if table is invoices
          if (table === 'invoices' && (currentPayload.invoiceNumber || currentPayload.invoice_number)) {
            const invNum = currentPayload.invoiceNumber || currentPayload.invoice_number;
            const resByNum = await supabase.from(table).update(currentPayload).or(`invoiceNumber.eq.${invNum},invoice_number.eq.${invNum}`).select();
            if (!resByNum.error && resByNum.data && resByNum.data.length > 0) {
              lastSupabaseStatus = {
                lastAction: `Update ${table} by number`,
                success: true,
                timestamp: new Date().toISOString(),
              };
              return { data: resByNum.data[0], error: null, success: true };
            }
          }
        }

        if (res.error) {
          lastError = res.error;
          const fullMsg = [res.error.message, res.error.details, res.error.hint].filter(Boolean).join(' ');

          const missingCol = extractMissingColumn(fullMsg);
          if (missingCol) {
            const keyToDelete = findMatchingKey(currentPayload, missingCol);
            if (keyToDelete && keyToDelete in currentPayload) {
              console.warn(`[Supabase Auto-Heal] Column "${keyToDelete}" does not exist in "${table}". Stripping and retrying update.`);
              delete currentPayload[keyToDelete];
              continue;
            }
          }

          // Plain update without select (RLS)
          if (fullMsg.includes('row-level security') || res.error.code === 'PGRST116' || res.error.code === '42501') {
            const plainRes = await supabase.from(table).update(currentPayload).eq('id', id);
            if (!plainRes.error) {
              return { data: { id, ...currentPayload }, error: null, success: true };
            }
          }

          // Foreign key constraint violation on update
          if (fullMsg.includes('foreign key constraint') || res.error.code === '23503') {
            let stripped = false;
            if ('client_id' in currentPayload) { delete currentPayload.client_id; stripped = true; }
            if ('clientId' in currentPayload) { delete currentPayload.clientId; stripped = true; }
            if ('note_id' in currentPayload) { delete currentPayload.note_id; stripped = true; }
            if ('noteId' in currentPayload) { delete currentPayload.noteId; stripped = true; }
            if (stripped) continue;
          }

          // Fallback matching by invoice_number if id update failed
          if (currentPayload.invoice_number || currentPayload.invoiceNumber) {
            const invNum = currentPayload.invoice_number || currentPayload.invoiceNumber;
            const resByNum = await supabase.from(table).update(currentPayload).eq('invoice_number', invNum).select();
            if (!resByNum.error && resByNum.data && resByNum.data.length > 0) {
              return { data: resByNum.data[0], error: null, success: true };
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

  // If update did not find the row (e.g. was never inserted remotely), attempt resilient insert
  try {
    const insertPayload = candidatePayloads[0];
    const insertRes = await executeResilientInsert(table, [{ id, ...insertPayload }]);
    if (insertRes.success && insertRes.data) {
      return insertRes;
    }
  } catch {
    // ignore
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
    bono_sessions_remaining NUMERIC DEFAULT 0,
    profile_note TEXT
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
    BEGIN ALTER TABLE public.clients ADD COLUMN profile_note TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.clients ADD COLUMN "profileNote" TEXT; EXCEPTION WHEN duplicate_column THEN END;
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
    payment_date TEXT,
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
    BEGIN ALTER TABLE public.invoices ADD COLUMN payment_date TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.invoices ADD COLUMN "paymentDate" TEXT; EXCEPTION WHEN duplicate_column THEN END;
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
            if (local) {
              // If remote is missing name or is 'Patient sans nom', restore from local cache if known
              if ((mapped.name === 'Patient sans nom' || !mapped.name) && local.name && local.name !== 'Patient sans nom') {
                mapped.name = local.name;
                mapped.firstName = mapped.firstName || local.firstName;
                mapped.lastName = mapped.lastName || local.lastName;
              }
              // If local has active Bono with remaining sessions, preserve it if remote has 0 or undefined
              if (local.hasBono && typeof local.bonoSessionsRemaining === 'number' && local.bonoSessionsRemaining > 0) {
                if (!mapped.hasBono || mapped.bonoSessionsRemaining === undefined || mapped.bonoSessionsRemaining === 0) {
                  mapped.hasBono = true;
                  mapped.bonoType = mapped.bonoType || local.bonoType || 'Bono';
                  mapped.bonoSessionsRemaining = local.bonoSessionsRemaining;
                }
              }
              // Preserve profile note if local has it and remote is blank
              if (local.profileNote && !mapped.profileNote) {
                mapped.profileNote = local.profileNote;
              }
            }
            return mapped;
          });
          
          const activeRemoteClients = remoteClients.filter(c => !isDeletedTombstone('clients', c.id, c.name));
          // Clean up any deleted client that still lingers in Supabase in the background
          const deletedRemotes = remoteClients.filter(c => isDeletedTombstone('clients', c.id, c.name));
          for (const d of deletedRemotes) {
            supabase.from('clients').delete().eq('id', d.id).then(() => {});
          }

          // Merge local clients that haven't synced to remote yet
          const remoteIds = new Set(activeRemoteClients.map(c => c.id));
          const mergedClients = [...activeRemoteClients];
          for (const loc of localClients) {
            if (isDeletedTombstone('clients', loc.id, loc.name)) continue;
            if (!remoteIds.has(loc.id)) {
              mergedClients.push(loc);
            }
          }

          saveLocal('clients', mergedClients);
          return mergedClients.sort((a, b) => a.name.localeCompare(b.name));
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
        // Clean matching payload for Supabase schema
        const cleanPayload: Record<string, any> = {
          id: newClient.id,
          firstName: newClient.firstName,
          lastName: newClient.lastName,
          email: newClient.email || '',
          phone: newClient.phone || '',
          address: newClient.address || '',
          has_bono: Boolean(newClient.hasBono),
          bono_type: newClient.bonoType || null,
          default_discount: newClient.defaultDiscount ?? 0,
          defaultDiscount: newClient.defaultDiscount ?? 0,
          bono_sessions_remaining: newClient.bonoSessionsRemaining ?? 0,
          profile_note: newClient.profileNote || null,
          created_at: newClient.createdAt,
        };
        if (newClient.dni) cleanPayload.dni = newClient.dni;
        if (newClient.birthDate) {
          cleanPayload.birthDate = newClient.birthDate;
          cleanPayload.birth_date = newClient.birthDate;
        }
        if (newClient.lastSessionAt) {
          cleanPayload.lastSessionAt = newClient.lastSessionAt;
          cleanPayload.last_session_at = newClient.lastSessionAt;
        }

        const fallbackPayload: Record<string, any> = {
          id: newClient.id,
          name: newClient.name,
          first_name: newClient.firstName,
          last_name: newClient.lastName,
          email: newClient.email || '',
          phone: newClient.phone || '',
          address: newClient.address || '',
        };

        const result = await executeResilientInsert('clients', [cleanPayload, fallbackPayload]);

        if (result.success && result.data) {
          const mapped = mapClientFromDB(result.data);
          const finalClient: Client = {
            ...newClient,
            ...mapped,
            name: fullName,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            hasBono: newClient.hasBono !== undefined ? newClient.hasBono : mapped.hasBono,
            bonoType: newClient.bonoType || mapped.bonoType,
            bonoSessionsRemaining: newClient.bonoSessionsRemaining !== undefined ? newClient.bonoSessionsRemaining : mapped.bonoSessionsRemaining,
            profileNote: newClient.profileNote || mapped.profileNote,
          };
          const fresh = loadLocal('clients', mockClients);
          const fIdx = fresh.findIndex(c => c.id === finalClient.id);
          if (fIdx !== -1) fresh[fIdx] = finalClient;
          else fresh.unshift(finalClient);
          saveLocal('clients', fresh);
          return finalClient;
        }
      } catch (err) {
        console.warn('Supabase createClient exception:', err);
      }
    }

    const current = loadLocal('clients', mockClients);
    current.unshift(newClient);
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
        const cleanPayload: Record<string, any> = {
          firstName: normalizedClient.firstName,
          lastName: normalizedClient.lastName,
          email: normalizedClient.email || '',
          phone: normalizedClient.phone || '',
          address: normalizedClient.address || '',
          has_bono: Boolean(normalizedClient.hasBono),
          bono_type: normalizedClient.bonoType || null,
          default_discount: normalizedClient.defaultDiscount ?? 0,
          defaultDiscount: normalizedClient.defaultDiscount ?? 0,
          bono_sessions_remaining: normalizedClient.bonoSessionsRemaining ?? 0,
          profile_note: normalizedClient.profileNote || null,
        };
        if (normalizedClient.dni !== undefined) cleanPayload.dni = normalizedClient.dni;
        if (normalizedClient.birthDate) {
          cleanPayload.birthDate = normalizedClient.birthDate;
          cleanPayload.birth_date = normalizedClient.birthDate;
        }
        if (normalizedClient.lastSessionAt) {
          cleanPayload.lastSessionAt = normalizedClient.lastSessionAt;
          cleanPayload.last_session_at = normalizedClient.lastSessionAt;
        }

        const fallbackPayload: Record<string, any> = {
          name: normalizedClient.name,
          first_name: normalizedClient.firstName,
          last_name: normalizedClient.lastName,
          email: normalizedClient.email || '',
          phone: normalizedClient.phone || '',
          address: normalizedClient.address || '',
          has_bono: Boolean(normalizedClient.hasBono),
          bono_type: normalizedClient.bonoType || null,
          bono_sessions_remaining: normalizedClient.bonoSessionsRemaining ?? 0,
        };

        const result = await executeResilientUpdate('clients', normalizedClient.id, [cleanPayload, fallbackPayload]);

        if (result.success && result.data) {
          const mapped = mapClientFromDB(result.data);
          const finalClient: Client = {
            ...normalizedClient,
            ...mapped,
            name: fullName,
            firstName: cleanFirstName,
            lastName: cleanLastName,
            hasBono: normalizedClient.hasBono !== undefined ? normalizedClient.hasBono : mapped.hasBono,
            bonoType: normalizedClient.bonoType !== undefined ? normalizedClient.bonoType : mapped.bonoType,
            bonoSessionsRemaining: normalizedClient.bonoSessionsRemaining !== undefined
              ? normalizedClient.bonoSessionsRemaining
              : mapped.bonoSessionsRemaining,
            profileNote: normalizedClient.profileNote !== undefined
              ? normalizedClient.profileNote
              : mapped.profileNote,
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
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const current = loadLocal('clients', []);
    const target = current.find(c => c.id === id);

    addDeletedTombstone('clients', id);
    if (target?.name) addDeletedTombstone('clients', target.name);

    if (isSupabaseConfigured && supabase) {
      // 1. Delete associated notes without .or() that causes Postgres 42703 errors
      try {
        await supabase.from('client_notes').delete().eq('clientId', id);
      } catch {}
      try {
        await supabase.from('client_notes').delete().eq('client_id', id);
      } catch {}

      // 2. Delete associated invoices
      try {
        await supabase.from('invoices').delete().eq('clientId', id);
      } catch {}
      try {
        await supabase.from('invoices').delete().eq('client_id', id);
      } catch {}

      // 3. Delete associated events
      try {
        await supabase.from('calendar_events').delete().eq('clientId', id);
      } catch {}
      try {
        await supabase.from('calendar_events').delete().eq('client_id', id);
      } catch {}

      // 4. Delete client record itself
      try {
        if (UUID_REGEX.test(id)) {
          await supabase.from('clients').delete().eq('id', id);
        }
        if (target?.name) {
          const { data: dbClients } = await supabase.from('clients').select('id, name, firstName, lastName');
          if (dbClients) {
            for (const dbc of dbClients) {
              const fullName = `${dbc.firstName || ''} ${dbc.lastName || ''}`.trim();
              if (fullName === target.name || dbc.name === target.name) {
                await supabase.from('clients').delete().eq('id', dbc.id);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Supabase delete client exception:', err);
      }
    }

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
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    addDeletedTombstone('notes', id);

    if (isSupabaseConfigured && supabase) {
      try {
        if (UUID_REGEX.test(id)) {
          await supabase.from('client_notes').delete().eq('id', id);
        }
      } catch (err) {
        console.warn('Supabase delete note exception:', err);
      }
    }

    const current = loadLocal('notes', []);
    const filtered = current.filter(n => n.id !== id);
    saveLocal('notes', filtered);
    return true;
  },

  // ==========================================
  // INVOICES & BILLING
  // ==========================================
  async getNextInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    let maxNum = 100;

    // 1. Inspect Supabase invoices first to ensure no collision with existing remote records
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('invoices').select('invoiceNumber, invoice_number');
        for (const row of data || []) {
          const raw = row.invoiceNumber || row.invoice_number || '';
          const match = String(raw).match(/\d+$/);
          if (match) {
            const num = parseInt(match[0], 10);
            if (num > maxNum) maxNum = num;
          }
        }
      } catch (err) {
        console.warn('Error reading invoice numbers from Supabase:', err);
      }
    }

    // 2. Inspect local invoices
    const localInvoices = loadLocal('invoices', []);
    for (const inv of localInvoices) {
      const match = String(inv.invoiceNumber || '').match(/\d+$/);
      if (match) {
        const num = parseInt(match[0], 10);
        if (num > maxNum) maxNum = num;
      }
    }

    return `FAC-${year}-${maxNum + 1}`;
  },

  async getInvoices(): Promise<Invoice[]> {
    const rawLocal = loadLocal('invoices', mockInvoices);
    const localInvoices: Invoice[] = rawLocal.map(loc => ({
      ...loc,
      description: normalizeInvoiceDescription(loc.description),
      language: 'es' as const,
      quantity: 1,
    }));
    const localMap = new Map(localInvoices.map(i => [i.id, i]));
    const localNumMap = new Map(localInvoices.map(i => [i.invoiceNumber, i]));

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.from('invoices').select('*').order('date', { ascending: false });
        if (!error && data) {
          const remoteInvoices = data.map(row => {
            const mapped = mapInvoiceFromDB(row);
            const local = localMap.get(mapped.id) || (mapped.invoiceNumber ? localNumMap.get(mapped.invoiceNumber) : undefined);
            if (local) {
              if (!mapped.clientId && local.clientId) mapped.clientId = local.clientId;
              if (!mapped.clientName && local.clientName) mapped.clientName = local.clientName;
              if (!mapped.paymentDate && local.paymentDate) mapped.paymentDate = local.paymentDate;
              if (!mapped.noteId && local.noteId) mapped.noteId = local.noteId;
            }
            return {
              ...mapped,
              description: normalizeInvoiceDescription(mapped.description),
              language: 'es' as const,
              quantity: 1,
            };
          });
          
          const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const activeRemoteInvoices = remoteInvoices.filter(i => !isDeletedTombstone('invoices', i.id, i.invoiceNumber));
          
          // Background cleanup of any deleted invoice that might still be in remote DB
          const deletedRemotes = remoteInvoices.filter(i => isDeletedTombstone('invoices', i.id, i.invoiceNumber));
          for (const d of deletedRemotes) {
            if (UUID_REGEX.test(d.id)) supabase.from('invoices').delete().eq('id', d.id).then(() => {});
            if (d.invoiceNumber) supabase.from('invoices').delete().eq('invoiceNumber', d.invoiceNumber).then(() => {});
          }

          // Smart merge: retain local invoices that haven't synced yet or have distinct IDs
          const remoteIds = new Set(activeRemoteInvoices.map(r => r.id));
          const remoteNums = new Set(activeRemoteInvoices.map(r => r.invoiceNumber).filter(Boolean));
          const merged = [...activeRemoteInvoices];

          for (const loc of localInvoices) {
            if (isDeletedTombstone('invoices', loc.id, loc.invoiceNumber)) continue;
            // Never re-add if invoice number is already in remote records
            if (loc.invoiceNumber && remoteNums.has(loc.invoiceNumber)) continue;
            if (!remoteIds.has(loc.id)) {
              merged.push({
                ...loc,
                description: normalizeInvoiceDescription(loc.description),
                language: 'es',
                quantity: 1,
              });
            }
          }

          saveLocal('invoices', merged);
          return sortInvoicesByDate(merged, false);
        }
        if (error) {
          console.warn('Supabase invoices fetch failed, using local storage:', error.message);
        }
      } catch (err: any) {
        console.warn('Supabase invoices fetch exception:', err);
      }
    }
    saveLocal('invoices', localInvoices);
    return sortInvoicesByDate(localInvoices, false);
  },

  async createInvoice(invoice: Omit<Invoice, 'id' | 'invoiceNumber'> & { id?: string; invoiceNumber?: string }): Promise<Invoice> {
    const nextInvoiceNum = invoice.invoiceNumber || await this.getNextInvoiceNumber();
    const invoiceId = invoice.id || crypto.randomUUID();

    const newInvoice: Invoice = {
      ...invoice,
      id: invoiceId,
      invoiceNumber: nextInvoiceNum,
    };

    // Save locally immediately to guarantee persistence
    const currentInvoices = loadLocal('invoices', []);
    const idx = currentInvoices.findIndex(i => i.id === newInvoice.id);
    if (idx !== -1) currentInvoices[idx] = newInvoice;
    else currentInvoices.unshift(newInvoice);
    saveLocal('invoices', currentInvoices);

    if (isSupabaseConfigured && supabase) {
      try {
        // Resolve valid clientId for foreign key constraint in Supabase
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        let validClientId: string | null = null;
        if (newInvoice.clientId && UUID_REGEX.test(newInvoice.clientId)) {
          validClientId = newInvoice.clientId;
        } else if (newInvoice.clientName) {
          // Look up if client has a matching UUID in Supabase
          try {
            const { data: dbClients } = await supabase.from('clients').select('id, firstName, lastName');
            if (dbClients) {
              const cleanTarget = newInvoice.clientName.toLowerCase().replace(/[^a-z0-9]/g, '');
              const matched = dbClients.find(c => {
                const full = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
                return full.includes(cleanTarget) || cleanTarget.includes(full);
              });
              if (matched) validClientId = matched.id;
            }
          } catch {}
        }

        // Complete matching payload with BOTH camelCase and snake_case for full DB schema compatibility
        const cleanPayload: Record<string, any> = {
          id: newInvoice.id,
          invoiceNumber: newInvoice.invoiceNumber,
          invoice_number: newInvoice.invoiceNumber,
          clientId: validClientId,
          client_id: validClientId,
          clientName: newInvoice.clientName,
          client_name: newInvoice.clientName,
          date: newInvoice.date,
          amount: Number(newInvoice.amount) || 0,
          originalAmount: Number(newInvoice.originalAmount ?? newInvoice.amount) || 0,
          original_amount: Number(newInvoice.originalAmount ?? newInvoice.amount) || 0,
          discountAmount: Number(newInvoice.discountAmount ?? 0),
          discount_amount: Number(newInvoice.discountAmount ?? 0),
          discountType: newInvoice.discountType || null,
          discount_type: newInvoice.discountType || null,
          discountLabel: newInvoice.discountLabel || null,
          discount_label: newInvoice.discountLabel || null,
          status: newInvoice.status || 'paid',
          paymentMethod: newInvoice.paymentMethod || 'card',
          payment_method: newInvoice.paymentMethod || 'card',
          description: normalizeInvoiceDescription(newInvoice.description),
          language: 'es',
          quantity: 1,
          noteId: newInvoice.noteId || null,
          note_id: newInvoice.noteId || null,
        };

        const result = await executeResilientInsert('invoices', [cleanPayload]);

        if (result.success && result.data) {
          const mapped = mapInvoiceFromDB(result.data);
          const finalInvoice: Invoice = {
            ...newInvoice,
            ...mapped,
            id: mapped.id || newInvoice.id,
            invoiceNumber: mapped.invoiceNumber || newInvoice.invoiceNumber,
            clientId: newInvoice.clientId || mapped.clientId,
            clientName: newInvoice.clientName || mapped.clientName,
            paymentDate: newInvoice.paymentDate || mapped.paymentDate,
            noteId: newInvoice.noteId || mapped.noteId,
          };
          const fresh = loadLocal('invoices', []);
          const fIdx = fresh.findIndex(i => i.id === finalInvoice.id || (finalInvoice.invoiceNumber && i.invoiceNumber === finalInvoice.invoiceNumber));
          if (fIdx !== -1) fresh[fIdx] = finalInvoice;
          else fresh.unshift(finalInvoice);
          saveLocal('invoices', fresh);
          return finalInvoice;
        } else {
          console.warn('[createInvoice] Supabase resilient insert error:', result.error);
        }
      } catch (err) {
        console.warn('Supabase createInvoice exception:', err);
      }
    }

    return newInvoice;
  },

  async updateInvoice(invoice: Invoice): Promise<Invoice> {
    // Save locally immediately to guarantee persistence
    const current = loadLocal('invoices', []);
    const index = current.findIndex(c => c.id === invoice.id);
    if (index !== -1) {
      current[index] = invoice;
      saveLocal('invoices', current);
    } else {
      current.unshift(invoice);
      saveLocal('invoices', current);
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        let validClientId: string | null = null;
        if (invoice.clientId && UUID_REGEX.test(invoice.clientId)) {
          validClientId = invoice.clientId;
        } else if (invoice.clientName) {
          try {
            const { data: dbClients } = await supabase.from('clients').select('id, firstName, lastName');
            if (dbClients) {
              const cleanTarget = invoice.clientName.toLowerCase().replace(/[^a-z0-9]/g, '');
              const matched = dbClients.find(c => {
                const full = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase().replace(/[^a-z0-9]/g, '');
                return full.includes(cleanTarget) || cleanTarget.includes(full);
              });
              if (matched) validClientId = matched.id;
            }
          } catch {}
        }

        const cleanPayload: Record<string, any> = {
          invoiceNumber: invoice.invoiceNumber,
          invoice_number: invoice.invoiceNumber,
          clientId: validClientId,
          client_id: validClientId,
          clientName: invoice.clientName,
          client_name: invoice.clientName,
          date: invoice.date,
          amount: Number(invoice.amount) || 0,
          status: invoice.status || 'paid',
          paymentMethod: invoice.paymentMethod || 'card',
          payment_method: invoice.paymentMethod || 'card',
          description: normalizeInvoiceDescription(invoice.description),
          language: 'es',
          quantity: 1,
          originalAmount: Number(invoice.originalAmount ?? invoice.amount) || 0,
          original_amount: Number(invoice.originalAmount ?? invoice.amount) || 0,
          discountAmount: Number(invoice.discountAmount ?? 0),
          discount_amount: Number(invoice.discountAmount ?? 0),
          discountType: invoice.discountType || null,
          discount_type: invoice.discountType || null,
          discountLabel: invoice.discountLabel || null,
          discount_label: invoice.discountLabel || null,
          noteId: invoice.noteId || null,
          note_id: invoice.noteId || null,
        };

        const result = await executeResilientUpdate('invoices', invoice.id, [cleanPayload]);
        if (result.success && result.data) {
          const mapped = mapInvoiceFromDB(result.data);
          const finalInvoice: Invoice = {
            ...invoice,
            ...mapped,
            clientId: invoice.clientId || mapped.clientId,
            clientName: invoice.clientName || mapped.clientName,
            paymentDate: invoice.paymentDate || mapped.paymentDate,
            noteId: invoice.noteId || mapped.noteId,
          };
          const fresh = loadLocal('invoices', []);
          const fIdx = fresh.findIndex(i => i.id === invoice.id);
          if (fIdx !== -1) fresh[fIdx] = finalInvoice;
          saveLocal('invoices', fresh);
          return finalInvoice;
        } else {
          console.warn('[updateInvoice] Supabase update warning:', result.error);
        }
      } catch (err) {
        console.warn('Supabase updateInvoice exception:', err);
      }
    }

    return invoice;
  },

  async deleteInvoice(id: string, invoiceNumber?: string): Promise<boolean> {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const current = loadLocal('invoices', []);
    const target = current.find(i => i.id === id || i.invoiceNumber === id || (invoiceNumber && (i.invoiceNumber === invoiceNumber || i.id === invoiceNumber)));
    const targetNum = invoiceNumber || target?.invoiceNumber || (id.startsWith('FAC-') ? id : undefined);
    const targetId = target?.id || id;

    // Record tombstones immediately so it can never resurrect
    addDeletedTombstone('invoices', targetId);
    if (targetNum) addDeletedTombstone('invoices', targetNum);

    if (isSupabaseConfigured && supabase) {
      try {
        // 1. Delete by UUID if valid
        if (UUID_REGEX.test(targetId)) {
          const res = await supabase.from('invoices').delete().eq('id', targetId).select();
          if (res.error) console.warn('[deleteInvoice] by id warning:', res.error.message);
        }

        // 2. Delete by invoiceNumber and invoice_number columns
        if (targetNum) {
          const res1 = await supabase.from('invoices').delete().eq('invoiceNumber', targetNum).select();
          if (res1.error) console.warn('[deleteInvoice] by invoiceNumber warning:', res1.error.message);

          const res2 = await supabase.from('invoices').delete().eq('invoice_number', targetNum).select();
          if (res2.error) console.warn('[deleteInvoice] by invoice_number warning:', res2.error.message);
        }

        // 3. Fallback: find any row by invoiceNumber in remote DB and delete its specific ID
        if (targetNum) {
          try {
            const { data: found } = await supabase.from('invoices').select('id').or(`invoiceNumber.eq.${targetNum},invoice_number.eq.${targetNum}`);
            if (found && found.length > 0) {
              for (const row of found) {
                if (row.id) {
                  await supabase.from('invoices').delete().eq('id', row.id);
                }
              }
            }
          } catch {}
        }
      } catch (err: any) {
        console.warn('Supabase delete invoice exception:', err);
      }
    }

    const filtered = current.filter(i => i.id !== targetId && (!targetNum || i.invoiceNumber !== targetNum));
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
      // Non-appointment events (e.g. Pause déjeuner, Bloqué, Admin, Autre) should never be linked to clients
      if (ev.eventType && ev.eventType !== 'appointment') {
        return {
          ...ev,
          clientId: undefined,
          clientName: undefined,
        };
      }

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
        const descWithMeta = prepareDescriptionWithMeta(newEvent.description, newEvent.eventType);
        const snakePayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: descWithMeta,
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
          description: descWithMeta,
          start: newEvent.start,
          end: newEvent.end,
          clientId: (newEvent.clientId && newEvent.clientId.includes('-')) ? newEvent.clientId : null,
          clientName: newEvent.clientName || '',
          eventType: newEvent.eventType || 'appointment',
        };

        const timePayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: descWithMeta,
          start_time: newEvent.start,
          end_time: newEvent.end,
          client_id: (newEvent.clientId && newEvent.clientId.includes('-')) ? newEvent.clientId : null,
          client_name: newEvent.clientName || '',
          event_type: newEvent.eventType || 'appointment',
        };

        const minimalPayload: Record<string, any> = {
          id: newEvent.id,
          summary: newEvent.summary,
          description: descWithMeta,
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
        const descWithMeta = prepareDescriptionWithMeta(event.description, event.eventType);
        const snakePayload: Record<string, any> = {
          summary: event.summary,
          description: descWithMeta,
          start: event.start,
          end: event.end,
          client_id: (event.clientId && event.clientId.includes('-')) ? event.clientId : null,
          client_name: event.clientName || '',
          patient_name: event.clientName || '',
          event_type: event.eventType || 'appointment',
        };

        const camelPayload: Record<string, any> = {
          summary: event.summary,
          description: descWithMeta,
          start: event.start,
          end: event.end,
          clientId: (event.clientId && event.clientId.includes('-')) ? event.clientId : null,
          clientName: event.clientName || '',
          eventType: event.eventType || 'appointment',
        };

        const timePayload: Record<string, any> = {
          summary: event.summary,
          description: descWithMeta,
          start_time: event.start,
          end_time: event.end,
          event_type: event.eventType || 'appointment',
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
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    addDeletedTombstone('events', id);

    if (isSupabaseConfigured && supabase) {
      try {
        if (UUID_REGEX.test(id)) {
          const { error } = await supabase.from('calendar_events').delete().eq('id', id);
          if (error && (error.message?.includes('relation') || error.code === '42P01')) {
            await supabase.from('events').delete().eq('id', id);
          }
        }
      } catch (err) {
        console.warn('Supabase deleteLocalEvent exception:', err);
      }
    }

    const current = loadLocal('events', []);
    const filtered = current.filter(e => e.id !== id);
    saveLocal('events', filtered);
    return true;
  }
};
