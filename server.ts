import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

import { createRequire } from 'node:module';
import type webPushType from 'web-push';

const require = createRequire(import.meta.url);
const webpush = require('web-push') as typeof webPushType;

const PORT = Number(process.env.PORT) || 3000;
const DEFAULT_SUPABASE_URL = 'https://lnlemynayesjduntoran.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGVteW5heWVzamR1bnRvcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDAyMDgsImV4cCI6MjA4MjkxNjIwOH0.3b9fFgeWTXen1fsOO0xMdM5Fd3PTxYs41UxlPapo0ZU';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL;

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_ANON_KEY;

const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DATA_DIR = path.resolve(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'morning-briefing.json');
const VAPID_FILE = path.join(DATA_DIR, 'vapid-keys.json');
const SUBS_FILE = path.join(DATA_DIR, 'push-subscriptions.json');

interface StoredPushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceLabel?: string;
  createdAt?: string;
}

interface MorningBriefingConfig {
  enabled: boolean;
  sendTime: string; // HH:mm
  timezone: string;
  onlyIfAppointments: boolean;
  includePhone: boolean;
  includeRemarks: boolean;
  lang: 'fr' | 'es' | 'en';
  lastSentDate?: string;
  lastSentStatus?: string;
  lastSentAt?: string;
}

interface EnrichedAppointment {
  id: string;
  start: string;
  end: string;
  startTime: string;
  endTime: string;
  patientName: string;
  phone?: string;
  email?: string;
  profileNote?: string;
  description?: string;
  hasBono?: boolean;
  bonoSessionsRemaining?: number;
}

const DEFAULT_CONFIG: MorningBriefingConfig = {
  enabled: true,
  sendTime: '08:00',
  timezone: 'Europe/Madrid',
  onlyIfAppointments: true,
  includePhone: true,
  includeRemarks: true,
  lang: 'fr',
};

function readJsonFile<T>(filePath: string): T | null {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch (err) {
    console.warn(`[MorningBriefing] Failed to read ${path.basename(filePath)}:`, err);
  }
  return null;
}

function writeJsonFile(filePath: string, data: unknown) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.warn(`[MorningBriefing] Failed to write ${path.basename(filePath)}:`, err);
  }
}

async function getOrCreateVapidKeys(): Promise<{ publicKey: string; privateKey: string }> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'vapid_keys')
        .maybeSingle();
      if (!error && data?.value?.publicKey && data?.value?.privateKey) {
        writeJsonFile(VAPID_FILE, data.value);
        return data.value;
      }
    } catch {
      // Optional table
    }
  }

  const localKeys = readJsonFile<{ publicKey: string; privateKey: string }>(VAPID_FILE);
  if (localKeys?.publicKey && localKeys?.privateKey) {
    return localKeys;
  }

  const generated = webpush.generateVAPIDKeys();
  writeJsonFile(VAPID_FILE, generated);

  if (supabase) {
    try {
      await supabase.from('app_settings').upsert({
        id: 'vapid_keys',
        value: generated,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Optional table
    }
  }

  return generated;
}

async function loadPushSubscriptions(): Promise<StoredPushSubscription[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'push_subscriptions')
        .maybeSingle();
      if (!error && Array.isArray(data?.value)) {
        writeJsonFile(SUBS_FILE, data.value);
        return data.value;
      }
    } catch {
      // Optional table
    }
  }

  const local = readJsonFile<StoredPushSubscription[]>(SUBS_FILE);
  return Array.isArray(local) ? local : [];
}

async function savePushSubscriptions(subs: StoredPushSubscription[]): Promise<StoredPushSubscription[]> {
  writeJsonFile(SUBS_FILE, subs);
  if (supabase) {
    try {
      await supabase.from('app_settings').upsert({
        id: 'push_subscriptions',
        value: subs,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Optional table
    }
  }
  return subs;
}

async function loadBriefingConfig(): Promise<MorningBriefingConfig> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('id', 'morning_briefing')
        .maybeSingle();
      if (!error && data && data.value) {
        const merged: MorningBriefingConfig = {
          ...DEFAULT_CONFIG,
          enabled: data.value.enabled ?? DEFAULT_CONFIG.enabled,
          sendTime: data.value.sendTime || DEFAULT_CONFIG.sendTime,
          timezone: data.value.timezone || DEFAULT_CONFIG.timezone,
          onlyIfAppointments: data.value.onlyIfAppointments ?? DEFAULT_CONFIG.onlyIfAppointments,
          includePhone: data.value.includePhone ?? DEFAULT_CONFIG.includePhone,
          includeRemarks: data.value.includeRemarks ?? DEFAULT_CONFIG.includeRemarks,
          lang: data.value.lang || DEFAULT_CONFIG.lang,
          lastSentDate: data.value.lastSentDate,
          lastSentStatus: data.value.lastSentStatus,
          lastSentAt: data.value.lastSentAt,
        };
        writeJsonFile(CONFIG_FILE, merged);
        return merged;
      }
    } catch {
      // Optional table
    }
  }

  const local = readJsonFile<MorningBriefingConfig>(CONFIG_FILE);
  if (local) {
    return {
      ...DEFAULT_CONFIG,
      enabled: local.enabled ?? DEFAULT_CONFIG.enabled,
      sendTime: local.sendTime || DEFAULT_CONFIG.sendTime,
      timezone: local.timezone || DEFAULT_CONFIG.timezone,
      onlyIfAppointments: local.onlyIfAppointments ?? DEFAULT_CONFIG.onlyIfAppointments,
      includePhone: local.includePhone ?? DEFAULT_CONFIG.includePhone,
      includeRemarks: local.includeRemarks ?? DEFAULT_CONFIG.includeRemarks,
      lang: local.lang || DEFAULT_CONFIG.lang,
      lastSentDate: local.lastSentDate,
      lastSentStatus: local.lastSentStatus,
      lastSentAt: local.lastSentAt,
    };
  }

  writeJsonFile(CONFIG_FILE, DEFAULT_CONFIG);
  return DEFAULT_CONFIG;
}

async function saveBriefingConfig(partial: Partial<MorningBriefingConfig>): Promise<MorningBriefingConfig> {
  const existing = await loadBriefingConfig();
  const cleanPartial: Partial<MorningBriefingConfig> = {};
  (Object.keys(partial) as (keyof MorningBriefingConfig)[]).forEach(key => {
    if (partial[key] !== undefined) {
      (cleanPartial as any)[key] = partial[key];
    }
  });

  const merged: MorningBriefingConfig = {
    ...existing,
    ...cleanPartial,
  };
  writeJsonFile(CONFIG_FILE, merged);

  if (supabase) {
    try {
      await supabase.from('app_settings').upsert({
        id: 'morning_briefing',
        value: merged,
        updated_at: new Date().toISOString(),
      });
    } catch {
      // Optional table
    }
  }
  return merged;
}

function getDatePartsInTz(date: Date, timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find(p => p.type === type)?.value || '';
    const dateStr = `${get('year')}-${get('month')}-${get('day')}`;
    const hour = get('hour') === '24' ? '00' : get('hour');
    const minute = get('minute');
    return { dateStr, timeStr: `${hour}:${minute}` };
  } catch {
    const iso = date.toISOString();
    return { dateStr: iso.slice(0, 10), timeStr: iso.slice(11, 16) };
  }
}

function formatTimeInTz(dateInput: string, timeZone: string): string {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);
  } catch {
    return '';
  }
}

function formatHumanDate(dateStr: string, lang: 'fr' | 'es' | 'en', timeZone: string): string {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const locale = lang === 'es' ? 'es-ES' : lang === 'en' ? 'en-US' : 'fr-FR';
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(dt);
  } catch {
    return dateStr;
  }
}

async function fetchTodayAppointments(targetDateStr: string, timeZone: string): Promise<EnrichedAppointment[]> {
  if (!supabase) return [];

  let eventsRows: any[] = [];
  let clientRows: any[] = [];

  try {
    const [evRes, clRes] = await Promise.all([
      supabase.from('calendar_events').select('*').order('start', { ascending: true }),
      supabase.from('clients').select('*'),
    ]);

    if (!evRes.error && evRes.data) {
      eventsRows = evRes.data;
    } else if (evRes.error && (evRes.error.message?.includes('relation') || evRes.error.code === '42P01')) {
      const fallback = await supabase.from('events').select('*').order('start', { ascending: true });
      eventsRows = fallback.data || [];
    }

    if (!clRes.error && clRes.data) {
      clientRows = clRes.data;
    }
  } catch (err) {
    console.warn('[MorningBriefing] Error querying Supabase:', err);
    return [];
  }

  const clientsById = new Map<string, any>();
  const clientsByName = new Map<string, any>();

  clientRows.forEach((c: any) => {
    const firstName = (c.firstName || c.first_name || '').trim();
    const lastName = (c.lastName || c.last_name || '').trim().toUpperCase();
    const fullName = (c.name || `${lastName} ${firstName}`).trim() || 'Patient';
    const enrichedClient = {
      id: String(c.id),
      name: fullName,
      phone: c.phone || c.telephone || c.tel || '',
      email: c.email || '',
      profileNote: c.profileNote || c.profile_note || c.remarque || c.note || '',
      hasBono: Boolean(c.hasBono || c.has_bono || false),
      bonoSessionsRemaining: Number(c.bonoSessionsRemaining ?? c.bono_sessions_remaining ?? 0),
    };
    clientsById.set(enrichedClient.id, enrichedClient);
    clientsByName.set(fullName.toLowerCase(), enrichedClient);
    if (firstName && lastName) {
      clientsByName.set(`${firstName} ${lastName}`.toLowerCase(), enrichedClient);
      clientsByName.set(`${lastName} ${firstName}`.toLowerCase(), enrichedClient);
    }
  });

  const appointments: EnrichedAppointment[] = [];

  for (const row of eventsRows) {
    const startRaw = row.start || row.start_time || row.startTime || '';
    const endRaw = row.end || row.end_time || row.endTime || '';
    if (!startRaw) continue;

    const startDateObj = new Date(startRaw);
    if (isNaN(startDateObj.getTime())) continue;

    const evTzDate = getDatePartsInTz(startDateObj, timeZone).dateStr;
    if (evTzDate !== targetDateStr) continue;

    const rawDesc = row.description || row.notes || row.note || '';
    let eventType: string | undefined = row.eventType || row.event_type || row.type;
    if (!eventType && rawDesc) {
      const match = rawDesc.match(/\[eventType:([a-z]+)\]/i) || rawDesc.match(/\[type:([a-z]+)\]/i);
      if (match && match[1]) {
        eventType = match[1].toLowerCase() === 'appointment' ? 'appointment' : 'blocked';
      }
    }

    const summaryStr = (row.summary || row.title || row.intitule || '').trim();
    const rawClientId = row.clientId || row.client_id || row.clientid || row.patient_id || row.patientId;
    const rawClientName = (row.clientName || row.client_name || row.clientname || row.patient_name || row.patientName || '').trim();

    if (!eventType) {
      if (rawClientId || rawClientName) {
        eventType = 'appointment';
      } else {
        const lowerSum = summaryStr.toLowerCase();
        if (!summaryStr || ['rdv patient', 'rendez-vous', 'cita', 'appointment', 'sesión de osteopatía', "séance d'ostéopathie"].includes(lowerSum)) {
          eventType = 'appointment';
        } else {
          eventType = 'blocked';
        }
      }
    }

    if (eventType !== 'appointment') continue;

    let matchedClient = rawClientId ? clientsById.get(String(rawClientId)) : undefined;
    if (!matchedClient && rawClientName) {
      matchedClient = clientsByName.get(rawClientName.toLowerCase());
    }
    if (!matchedClient && summaryStr) {
      const candidate = summaryStr.split(' - ')[0].trim().toLowerCase();
      matchedClient = clientsByName.get(candidate);
    }

    const cleanDesc = rawDesc.replace(/\[eventType:[a-z]+\]/gi, '').replace(/\[type:[a-z]+\]/gi, '').trim();
    const patientName = matchedClient?.name || rawClientName || summaryStr || 'Patient';

    appointments.push({
      id: String(row.id),
      start: startRaw,
      end: endRaw || startRaw,
      startTime: formatTimeInTz(startRaw, timeZone),
      endTime: endRaw ? formatTimeInTz(endRaw, timeZone) : '',
      patientName,
      phone: matchedClient?.phone || undefined,
      email: matchedClient?.email || undefined,
      profileNote: matchedClient?.profileNote || undefined,
      description: cleanDesc && cleanDesc.toLowerCase() !== patientName.toLowerCase() ? cleanDesc : undefined,
      hasBono: matchedClient?.hasBono,
      bonoSessionsRemaining: matchedClient?.bonoSessionsRemaining,
    });
  }

  return appointments.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

function buildBriefingPayload(
  appointments: EnrichedAppointment[],
  dateStr: string,
  config: MorningBriefingConfig,
  isTestWithoutAppointments = false
) {
  const humanDate = formatHumanDate(dateStr, config.lang, config.timezone);
  const count = appointments.length;

  const titleAscii =
    count > 0
      ? config.lang === 'es'
        ? `Vincent Osteo - ${count} paciente(s) hoy`
        : config.lang === 'en'
        ? `Vincent Osteo - ${count} patient(s) today`
        : `Vincent Osteo - ${count} patient(s) aujourd'hui`
      : config.lang === 'es'
      ? 'Vincent Osteo - Test del resumen matinal'
      : config.lang === 'en'
      ? 'Vincent Osteo - Morning briefing test'
      : 'Vincent Osteo - Test du briefing matinal';

  if (count === 0 && isTestWithoutAppointments) {
    const emptyText =
      config.lang === 'es'
        ? `Test OK (${humanDate}) : No hay ningun paciente programado hoy. En modo automatico no se enviara ninguna notificacion los dias sin citas.`
        : config.lang === 'en'
        ? `Test OK (${humanDate}): No patients scheduled today. In automatic mode, no message will be sent on days with no appointments.`
        : `Test réussi (${humanDate}) : Aucun patient n'est programmé aujourd'hui. En mode automatique, aucune notification ne vous est envoyée les jours sans rendez-vous.`;

    return {
      titleAscii,
      text: emptyText,
    };
  }

  const headerLine =
    config.lang === 'es'
      ? `Agenda del ${humanDate} (${count} paciente${count > 1 ? 's' : ''}) :`
      : config.lang === 'en'
      ? `Schedule for ${humanDate} (${count} patient${count > 1 ? 's' : ''}) :`
      : `Programme du ${humanDate} (${count} patient${count > 1 ? 's' : ''}) :`;

  const lines: string[] = [headerLine, ''];

  appointments.forEach((appt, idx) => {
    const timeRange = appt.endTime ? `${appt.startTime} - ${appt.endTime}` : appt.startTime;
    lines.push(`${idx + 1}. ${timeRange} : ${appt.patientName}`);
    if (config.includePhone && appt.phone) {
      lines.push(`   Tel: ${appt.phone}`);
    }
    if (config.includeRemarks && appt.description) {
      lines.push(`   Note RDV: ${appt.description}`);
    }
    if (config.includeRemarks && appt.profileNote) {
      lines.push(`   Attention dossier: ${appt.profileNote}`);
    }
    if (appt.hasBono && (appt.bonoSessionsRemaining ?? 0) > 0) {
      lines.push(`   Bono: ${appt.bonoSessionsRemaining} seance(s) restante(s)`);
    }
  });

  const text = lines.join('\n');

  return { titleAscii, text };
}

async function dispatchMorningBriefing(options: {
  config: MorningBriefingConfig;
  forceTest?: boolean;
  appUrl?: string;
}) {
  const { config, forceTest = false, appUrl } = options;
  const { dateStr } = getDatePartsInTz(new Date(), config.timezone);
  const appointments = await fetchTodayAppointments(dateStr, config.timezone);

  if (appointments.length === 0 && config.onlyIfAppointments && !forceTest) {
    return {
      ok: true,
      sent: false,
      skipped: true,
      reason: 'no_appointments_today',
      date: dateStr,
      appointmentsCount: 0,
      results: {},
    };
  }

  const payload = buildBriefingPayload(appointments, dateStr, config, forceTest && appointments.length === 0);
  const results: Record<string, { ok: boolean; detail?: string }> = {};

  // Native Web Push API (VAPID) — sends directly to all subscribed devices
  const subs = await loadPushSubscriptions();
  if (subs.length > 0) {
    try {
      const vapid = await getOrCreateVapidKeys();
      webpush.setVapidDetails('mailto:vincentdurroux@gmail.com', vapid.publicKey, vapid.privateKey);
      const pushPayload = JSON.stringify({
        title: payload.titleAscii,
        body: payload.text,
        url: appUrl || '/',
        tag: `vincent-briefing-${dateStr}`,
      });

      let deliveredCount = 0;
      const aliveSubs: StoredPushSubscription[] = [];
      for (const sub of subs) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, expirationTime: sub.expirationTime ?? null, keys: sub.keys },
            pushPayload
          );
          deliveredCount++;
          aliveSubs.push(sub);
        } catch (err: any) {
          if (err?.statusCode === 404 || err?.statusCode === 410) {
            // Subscription expired; remove it
          } else {
            aliveSubs.push(sub);
          }
        }
      }
      if (aliveSubs.length !== subs.length) {
        await savePushSubscriptions(aliveSubs);
      }
      results.webPush =
        deliveredCount > 0
          ? { ok: true, detail: `Notification push VAPID envoyée à ${deliveredCount} appareil(s)` }
          : { ok: false, detail: `Échec de l'envoi Web Push sur les appareils enregistrés` };
    } catch (err: any) {
      results.webPush = { ok: false, detail: err?.message || 'Web Push error' };
    }
  } else {
    results.webPush = {
      ok: false,
      detail: 'Aucun appareil abonné (cliquez sur "Activer sur cet appareil").',
    };
  }

  const anySuccess = Object.values(results).some(r => r.ok);
  if (anySuccess && !forceTest) {
    await saveBriefingConfig({
      lastSentDate: dateStr,
      lastSentAt: new Date().toISOString(),
      lastSentStatus: `${appointments.length} patient(s)`,
    });
  }

  return {
    ok: anySuccess,
    sent: anySuccess,
    skipped: false,
    date: dateStr,
    appointmentsCount: appointments.length,
    appointments,
    previewText: payload.text,
    results,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API: Get Morning Briefing Config + VAPID public key
  app.get('/api/morning-briefing/config', async (_req: Request, res: Response) => {
    const [config, vapid, subs] = await Promise.all([
      loadBriefingConfig(),
      getOrCreateVapidKeys(),
      loadPushSubscriptions(),
    ]);
    res.json({
      config,
      capabilities: {
        webPushReady: true,
        vapidPublicKey: vapid.publicKey,
        subscriptionsCount: subs.length,
        supabaseConnected: Boolean(supabase),
      },
    });
  });

  // API: Register a device for VAPID Web Push notifications
  app.post('/api/morning-briefing/subscribe', async (req: Request, res: Response) => {
    const body = req.body || {};
    const sub = body.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ ok: false, error: 'Invalid push subscription payload' });
    }
    const existing = await loadPushSubscriptions();
    const filtered = existing.filter(s => s.endpoint !== sub.endpoint);
    filtered.push({
      endpoint: sub.endpoint,
      expirationTime: sub.expirationTime ?? null,
      keys: sub.keys,
      deviceLabel: typeof body.deviceLabel === 'string' ? body.deviceLabel : undefined,
      createdAt: new Date().toISOString(),
    });
    await savePushSubscriptions(filtered);
    res.json({ ok: true, subscriptionsCount: filtered.length });
  });

  // API: Unregister a device from VAPID Web Push notifications
  app.post('/api/morning-briefing/unsubscribe', async (req: Request, res: Response) => {
    const endpoint = req.body?.endpoint;
    const existing = await loadPushSubscriptions();
    const filtered = endpoint ? existing.filter(s => s.endpoint !== endpoint) : existing;
    await savePushSubscriptions(filtered);
    res.json({ ok: true, subscriptionsCount: filtered.length });
  });

  // API: Save Morning Briefing Config
  app.post('/api/morning-briefing/config', async (req: Request, res: Response) => {
    const body = req.body || {};
    const updated = await saveBriefingConfig({
      enabled: body.enabled !== undefined ? Boolean(body.enabled) : undefined,
      sendTime: typeof body.sendTime === 'string' ? body.sendTime : undefined,
      timezone: typeof body.timezone === 'string' ? body.timezone : undefined,
      onlyIfAppointments: body.onlyIfAppointments !== undefined ? Boolean(body.onlyIfAppointments) : undefined,
      includePhone: body.includePhone !== undefined ? Boolean(body.includePhone) : undefined,
      includeRemarks: body.includeRemarks !== undefined ? Boolean(body.includeRemarks) : undefined,
      lang: body.lang === 'es' || body.lang === 'en' || body.lang === 'fr' ? body.lang : undefined,
    });
    res.json({ ok: true, config: updated });
  });

  // API: Preview today's patients list
  app.get('/api/morning-briefing/preview', async (req: Request, res: Response) => {
    const config = await loadBriefingConfig();
    const tz = (typeof req.query.tz === 'string' && req.query.tz) || config.timezone || 'Europe/Madrid';
    const langParam = req.query.lang;
    const lang = langParam === 'es' || langParam === 'en' || langParam === 'fr' ? langParam : config.lang;
    const { dateStr } = getDatePartsInTz(new Date(), tz);
    const appointments = await fetchTodayAppointments(dateStr, tz);
    const payload = buildBriefingPayload(appointments, dateStr, { ...config, lang, timezone: tz }, appointments.length === 0);

    res.json({
      date: dateStr,
      timezone: tz,
      appointmentsCount: appointments.length,
      appointments,
      previewText: appointments.length > 0 ? payload.text : '',
    });
  });

  // API: Send now (manual test or manual dispatch)
  app.post('/api/morning-briefing/send', async (req: Request, res: Response) => {
    const saved = await loadBriefingConfig();
    const body = req.body || {};
    const effectiveConfig: MorningBriefingConfig = {
      ...saved,
      ...body,
    };
    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const result = await dispatchMorningBriefing({
      config: effectiveConfig,
      forceTest: Boolean(body.forceTest ?? true),
      appUrl,
    });
    res.json(result);
  });

  // API: Cron Endpoint (GET or POST) for external daily scheduler (cron-job.org / Supabase pg_cron)
  const handleCron = async (req: Request, res: Response) => {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && req.query.secret !== cronSecret && req.headers['x-cron-secret'] !== cronSecret) {
      return res.status(401).json({ ok: false, error: 'Invalid cron secret' });
    }

    const saved = await loadBriefingConfig();
    const tzParam = typeof req.query.tz === 'string' ? req.query.tz.trim() : '';
    const langParam = req.query.lang;
    const forceParam = req.query.force === '1' || req.query.force === 'true';

    const effectiveConfig: MorningBriefingConfig = {
      ...saved,
      timezone: tzParam || saved.timezone || 'Europe/Madrid',
      lang: langParam === 'es' || langParam === 'en' || langParam === 'fr' ? langParam : saved.lang,
    };

    const { dateStr } = getDatePartsInTz(new Date(), effectiveConfig.timezone);
    if (!forceParam && saved.lastSentDate === dateStr) {
      return res.json({
        ok: true,
        sent: false,
        skipped: true,
        reason: 'already_sent_today',
        date: dateStr,
      });
    }

    const appUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const result = await dispatchMorningBriefing({
      config: effectiveConfig,
      forceTest: false,
      appUrl,
    });
    res.json(result);
  };

  app.get('/api/morning-briefing/cron', handleCron);
  app.post('/api/morning-briefing/cron', handleCron);

  // Built-in background morning scheduler (runs when server stays awake)
  setInterval(async () => {
    try {
      const config = await loadBriefingConfig();
      if (!config.enabled) return;
      const { dateStr, timeStr } = getDatePartsInTz(new Date(), config.timezone || 'Europe/Madrid');
      if (config.lastSentDate === dateStr) return;

      const targetTime = config.sendTime || '08:00';
      if (timeStr >= targetTime) {
        const res = await dispatchMorningBriefing({
          config,
          forceTest: false,
          appUrl: process.env.APP_URL,
        });
        if (res.skipped && res.reason === 'no_appointments_today') {
          await saveBriefingConfig({
            lastSentDate: dateStr,
            lastSentAt: new Date().toISOString(),
            lastSentStatus: '0 patient (non envoyé)',
          });
        }
      }
    } catch (err) {
      console.warn('[MorningBriefing] Scheduler check error:', err);
    }
  }, 60 * 1000);

  // Vite / Static Frontend
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vincent Osteopatia server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
