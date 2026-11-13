import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Supabase connection (same fallbacks as src/lib/supabase.ts)
const DEFAULT_SUPABASE_URL = 'https://lnlemynayesjduntoran.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGVteW5heWVzamR1bnRvcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDAyMDgsImV4cCI6MjA4MjkxNjIwOH0.3b9fFgeWTXen1fsOO0xMdM5Fd3PTxYs41UxlPapo0ZU';

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

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

const DATA_DIR = path.resolve(process.cwd(), '.data');
const CONFIG_FILE = path.join(DATA_DIR, 'notifications-config.json');
const LEGACY_CONFIG_FILE = path.join(DATA_DIR, 'telegram-config.json');
const SYS_CONFIG_EVENT_ID = '00000000-0000-4000-8000-743567000001';
const SYS_CONFIG_SUMMARY = '__SYS_TELEGRAM_CONFIG__';

interface StoredNotificationConfig {
  enabled: boolean;
  ntfyEnabled: boolean;
  ntfyTopic: string;
  botToken: string;
  botUsername?: string;
  chatId: string;
  chatLabel: string;
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
  updatedAt: number;
}

interface AppointmentItem {
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

function defaultConfig(): StoredNotificationConfig {
  return {
    enabled: false,
    ntfyEnabled: false,
    ntfyTopic: '',
    botToken: '',
    botUsername: '',
    chatId: '',
    chatLabel: '',
    sendTime: '08:00',
    timezone: 'Europe/Madrid',
    language: 'fr',
    includePhone: true,
    includeMotif: true,
    includeBono: true,
    lastSentDate: null,
    lastSentAt: null,
    lastSentCount: 0,
    lastStatus: null,
    lastError: null,
    cronSecret: crypto.randomBytes(12).toString('hex'),
    updatedAt: 0,
  };
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 10) return '••••••••';
  return `${token.slice(0, 6)}••••••${token.slice(-4)}`;
}

function readLocalConfigFile(): Partial<StoredNotificationConfig> | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
    if (fs.existsSync(LEGACY_CONFIG_FILE)) {
      const raw = fs.readFileSync(LEGACY_CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to read local config file:', err);
  }
  return null;
}

function writeLocalConfigFile(cfg: StoredNotificationConfig) {
  try {
    ensureDataDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Notifications] Failed to write local config file:', err);
  }
}

async function readSupabaseConfig(): Promise<Partial<StoredNotificationConfig> | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('description, created_at')
      .eq('id', SYS_CONFIG_EVENT_ID)
      .maybeSingle();

    if (!error && data?.description) {
      return JSON.parse(data.description);
    }
  } catch (err) {
    console.warn('[Notifications] Failed to read Supabase config:', err);
  }
  return null;
}

async function writeSupabaseConfig(cfg: StoredNotificationConfig): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from('calendar_events').upsert({
      id: SYS_CONFIG_EVENT_ID,
      summary: SYS_CONFIG_SUMMARY,
      description: JSON.stringify(cfg),
      start: '1970-01-01T00:00:00+00:00',
      end: '1970-01-01T00:01:00+00:00',
    });
  } catch (err) {
    console.warn('[Notifications] Failed to persist config to Supabase:', err);
  }
}

let cachedConfig: StoredNotificationConfig | null = null;

async function loadConfig(): Promise<StoredNotificationConfig> {
  const base = defaultConfig();
  const localCfg = readLocalConfigFile();
  const remoteCfg = await readSupabaseConfig();

  let merged: StoredNotificationConfig = { ...base };

  if (localCfg && remoteCfg) {
    const localTime = Number(localCfg.updatedAt || 0);
    const remoteTime = Number(remoteCfg.updatedAt || 0);
    merged =
      remoteTime >= localTime
        ? { ...base, ...localCfg, ...remoteCfg }
        : { ...base, ...remoteCfg, ...localCfg };
  } else if (remoteCfg) {
    merged = { ...base, ...remoteCfg };
  } else if (localCfg) {
    merged = { ...base, ...localCfg };
  }

  if (!merged.ntfyTopic) {
    merged.ntfyTopic = base.ntfyTopic;
  }
  if (typeof merged.ntfyEnabled !== 'boolean') {
    merged.ntfyEnabled = true;
  }
  if (!merged.cronSecret) {
    merged.cronSecret = crypto.randomBytes(12).toString('hex');
  }

  cachedConfig = merged;
  return merged;
}

async function saveConfig(next: StoredNotificationConfig): Promise<StoredNotificationConfig> {
  const withTimestamp: StoredNotificationConfig = {
    ...next,
    updatedAt: Date.now(),
  };
  cachedConfig = withTimestamp;
  writeLocalConfigFile(withTimestamp);
  await writeSupabaseConfig(withTimestamp);
  return withTimestamp;
}

function getEffectiveBotToken(cfg: StoredNotificationConfig): string {
  return cfg.botToken?.trim() || '';
}

function getEffectiveChatId(cfg: StoredNotificationConfig): string {
  return cfg.chatId?.trim() || '';
}

function toPublicConfig(cfg: StoredNotificationConfig) {
  const effectiveToken = getEffectiveBotToken(cfg);
  const effectiveChatId = getEffectiveChatId(cfg);
  return {
    enabled: Boolean(cfg.enabled),
    ntfyEnabled: cfg.ntfyEnabled !== false,
    ntfyTopic: cfg.ntfyTopic || '',
    hasBotToken: Boolean(effectiveToken),
    botTokenMasked: maskToken(effectiveToken),
    envBotTokenConfigured: false,
    chatId: effectiveChatId,
    chatLabel: cfg.chatLabel || '',
    envChatIdConfigured: false,
    sendTime: cfg.sendTime || '08:00',
    timezone: cfg.timezone || 'Europe/Madrid',
    language: cfg.language || 'fr',
    includePhone: cfg.includePhone !== false,
    includeMotif: cfg.includeMotif !== false,
    includeBono: cfg.includeBono !== false,
    lastSentDate: cfg.lastSentDate || null,
    lastSentAt: cfg.lastSentAt || null,
    lastSentCount: Number(cfg.lastSentCount || 0),
    lastStatus: cfg.lastStatus || null,
    lastError: cfg.lastError || null,
    cronSecret: cfg.cronSecret,
    botUsername: cfg.botUsername || '',
  };
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getZonedDateString(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

function getZonedMinutesOfDay(date: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find(p => p.type === 'hour')?.value || '0');
    const m = Number(parts.find(p => p.type === 'minute')?.value || '0');
    return (h === 24 ? 0 : h) * 60 + m;
  } catch {
    return date.getUTCHours() * 60 + date.getUTCMinutes();
  }
}

function formatTimeInZone(isoStr: string, timeZone: string): string {
  try {
    const d = new Date(isoStr);
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

function formatLongDateInZone(date: Date, timeZone: string, lang: 'fr' | 'es' | 'en'): string {
  const locale = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

const GENERIC_APPOINTMENT_SUMMARIES = new Set([
  'rdv patient',
  'rendez-vous',
  'cita',
  'appointment',
  'sesión de osteopatía',
  "séance d'ostéopathie",
  'osteopathy session',
]);

async function getTodayAppointments(cfg: StoredNotificationConfig): Promise<{
  dateStr: string;
  dateFormatted: string;
  appointments: AppointmentItem[];
}> {
  const timeZone = cfg.timezone || 'Europe/Madrid';
  const now = new Date();
  const todayStr = getZonedDateString(now, timeZone);
  const dateFormatted = formatLongDateInZone(now, timeZone, cfg.language || 'fr');

  if (!supabase) {
    return { dateStr: todayStr, dateFormatted, appointments: [] };
  }

  try {
    const [{ data: eventsData, error: eventsErr }, { data: clientsData }] = await Promise.all([
      supabase.from('calendar_events').select('*').order('start', { ascending: true }),
      supabase.from('clients').select('*'),
    ]);

    if (eventsErr || !eventsData) {
      return { dateStr: todayStr, dateFormatted, appointments: [] };
    }

    const clientsById = new Map<string, any>();
    const clientsByName = new Map<string, any>();
    for (const c of clientsData || []) {
      const fullName =
        c.name ||
        `${c.last_name || c.lastName || ''} ${c.first_name || c.firstName || ''}`.trim();
      const normalized = {
        ...c,
        fullName,
        phone: c.phone || '',
        hasBono: Boolean(c.hasBono ?? c.has_bono),
        bonoSessionsRemaining: Number(c.bonoSessionsRemaining ?? c.bono_sessions_remaining ?? 0),
        bonoType: c.bonoType || c.bono_type || '',
      };
      clientsById.set(String(c.id), normalized);
      if (fullName) {
        clientsByName.set(fullName.toLowerCase(), normalized);
      }
    }

    const appointments: AppointmentItem[] = [];

    for (const row of eventsData) {
      if (row.id === SYS_CONFIG_EVENT_ID || row.summary === SYS_CONFIG_SUMMARY) continue;

      const startRaw = row.start || row.start_time || row.startTime || '';
      const endRaw = row.end || row.end_time || row.endTime || '';
      if (!startRaw) continue;

      const startDate = new Date(startRaw);
      if (isNaN(startDate.getTime())) continue;

      const evDateStr = getZonedDateString(startDate, timeZone);
      if (evDateStr !== todayStr) continue;

      const rawDesc = String(row.description || row.notes || row.note || '');
      let eventType: string | undefined = row.eventType || row.event_type || row.type;
      if (!eventType && rawDesc) {
        const match =
          rawDesc.match(/\[eventType:([a-z]+)\]/i) || rawDesc.match(/\[type:([a-z]+)\]/i);
        if (match?.[1]) {
          eventType = match[1].toLowerCase() === 'appointment' ? 'appointment' : 'blocked';
        }
      }

      const summaryStr = String(row.summary || row.title || row.intitule || '').trim();
      const rawClientId = row.clientId || row.client_id || row.clientid || row.patient_id || '';

      if (!eventType) {
        if (rawClientId) {
          eventType = 'appointment';
        } else if (!summaryStr || GENERIC_APPOINTMENT_SUMMARIES.has(summaryStr.toLowerCase())) {
          eventType = 'appointment';
        } else {
          eventType = 'blocked';
        }
      }

      if (eventType !== 'appointment') continue;

      const cleanDesc = rawDesc
        .replace(/\[eventType:[a-z]+\]/gi, '')
        .replace(/\[type:[a-z]+\]/gi, '')
        .trim();

      const matchedClient =
        (rawClientId && clientsById.get(String(rawClientId))) ||
        (row.clientName && clientsByName.get(String(row.clientName).trim().toLowerCase())) ||
        (row.client_name && clientsByName.get(String(row.client_name).trim().toLowerCase())) ||
        (summaryStr && clientsByName.get(summaryStr.toLowerCase())) ||
        null;

      const clientName =
        matchedClient?.fullName ||
        row.clientName ||
        row.client_name ||
        row.patient_name ||
        summaryStr ||
        'Patient';

      let motif = cleanDesc;
      if (
        !motif &&
        summaryStr &&
        summaryStr.toLowerCase() !== clientName.toLowerCase() &&
        !GENERIC_APPOINTMENT_SUMMARIES.has(summaryStr.toLowerCase())
      ) {
        motif = summaryStr;
      }

      const startFmt = formatTimeInZone(startRaw, timeZone);
      const endFmt = endRaw ? formatTimeInZone(endRaw, timeZone) : '';
      const timeRange = endFmt ? `${startFmt} - ${endFmt}` : startFmt;

      appointments.push({
        id: String(row.id),
        start: startRaw,
        end: endRaw || startRaw,
        timeRange,
        clientId: matchedClient?.id ? String(matchedClient.id) : rawClientId || undefined,
        clientName,
        phone: matchedClient?.phone || undefined,
        motif: motif || undefined,
        hasBono: Boolean(matchedClient?.hasBono),
        bonoSessionsRemaining: matchedClient?.bonoSessionsRemaining || 0,
        bonoType: matchedClient?.bonoType || undefined,
      });
    }

    appointments.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return { dateStr: todayStr, dateFormatted, appointments };
  } catch (err) {
    console.error('[Notifications] Failed to load today appointments:', err);
    return { dateStr: todayStr, dateFormatted, appointments: [] };
  }
}

function formatDigestMessage(
  cfg: StoredNotificationConfig,
  dateFormatted: string,
  appointments: AppointmentItem[],
  forHtml: boolean = true
): string {
  const lang = cfg.language || 'fr';
  const count = appointments.length;
  const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);

  const b = (s: string) => (forHtml ? `<b>${escapeHtml(s)}</b>` : s);
  const esc = (s: string) => (forHtml ? escapeHtml(s) : s);

  const header = `🦴 ${b('Vincent Osteopatía')} — ${b(capitalizedDate)}`;

  const subheader =
    lang === 'fr'
      ? `👥 ${b(`${count} patient${count > 1 ? 's' : ''} programmé${count > 1 ? 's' : ''} aujourd'hui`)}`
      : lang === 'es'
      ? `👥 ${b(`${count} paciente${count > 1 ? 's' : ''} programado${count > 1 ? 's' : ''} hoy`)}`
      : `👥 ${b(`${count} patient${count > 1 ? 's' : ''} scheduled today`)}`;

  const lines: string[] = [header, subheader, ''];

  appointments.forEach((appt, index) => {
    lines.push(`${index + 1}. 🕐 ${b(appt.timeRange)} • ${b(appt.clientName)}`);
    if (cfg.includePhone && appt.phone) {
      lines.push(`   📞 ${esc(appt.phone)}`);
    }
    if (cfg.includeMotif && appt.motif) {
      lines.push(`   📝 ${esc(appt.motif)}`);
    }
    if (cfg.includeBono && appt.hasBono && (appt.bonoSessionsRemaining ?? 0) > 0) {
      const rem = appt.bonoSessionsRemaining;
      const bonoLabel =
        lang === 'fr'
          ? `🎟️ Bono : ${rem} séance${rem! > 1 ? 's' : ''} restante${rem! > 1 ? 's' : ''}`
          : lang === 'es'
          ? `🎟️ Bono: ${rem} sesión${rem! > 1 ? 'es' : ''} restante${rem! > 1 ? 's' : ''}`
          : `🎟️ Bono: ${rem} session${rem! > 1 ? 's' : ''} left`;
      lines.push(`   ${esc(bonoLabel)}`);
    }
    lines.push('');
  });

  const footer =
    lang === 'fr'
      ? 'Bonne journée de consultations ! ✨'
      : lang === 'es'
      ? '¡Buen día de consultas! ✨'
      : 'Have a great day of consultations! ✨';

  lines.push(footer);
  return lines.join('\n').trim();
}

async function sendNtfyNotification(
  topic: string,
  title: string,
  plainText: string
): Promise<{ ok: boolean; error?: string }> {
  if (!topic) return { ok: false, error: 'Missing topic' };
  try {
    const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        Title: title,
        Priority: 'default',
        Tags: 'calendar,clipboard',
      },
      body: plainText,
    });
    if (!res.ok) {
      return { ok: false, error: `Notification push HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error sending push notification' };
  }
}

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  htmlText: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const json = (await res.json()) as { ok: boolean; description?: string };
    if (!json.ok) {
      return { ok: false, error: json.description || `HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Network error' };
  }
}

let isSendingDigest = false;

async function checkAndSendMorningDigest(options: {
  enforceTimeWindow: boolean;
  bypassEnabledCheck?: boolean;
}): Promise<{
  action: 'sent' | 'skipped_no_patients' | 'skipped_already_sent' | 'skipped_disabled' | 'skipped_window' | 'error';
  count: number;
  message?: string;
  error?: string;
}> {
  if (isSendingDigest) {
    return { action: 'skipped_window', count: 0, message: 'Already processing' };
  }
  isSendingDigest = true;

  try {
    const cfg = cachedConfig || (await loadConfig());
    if (!options.bypassEnabledCheck && !cfg.enabled) {
      return { action: 'skipped_disabled', count: 0, message: 'Notifications désactivées' };
    }

    const timeZone = cfg.timezone || 'Europe/Madrid';
    const now = new Date();
    const todayStr = getZonedDateString(now, timeZone);

    if (options.enforceTimeWindow) {
      if (cfg.lastSentDate === todayStr) {
        return { action: 'skipped_already_sent', count: 0 };
      }

      const [hh, mm] = (cfg.sendTime || '08:00').split(':').map(n => parseInt(n, 10));
      const targetMinutes = (isNaN(hh) ? 8 : hh) * 60 + (isNaN(mm) ? 0 : mm);
      const currentMinutes = getZonedMinutesOfDay(now, timeZone);

      if (currentMinutes < targetMinutes || currentMinutes > targetMinutes + 240) {
        return { action: 'skipped_window', count: 0 };
      }
    }

    const { dateStr, dateFormatted, appointments } = await getTodayAppointments(cfg);

    // Crucial rule: ONLY send notification if there are patients scheduled today!
    if (appointments.length === 0) {
      if (options.enforceTimeWindow) {
        await saveConfig({
          ...cfg,
          lastSentDate: dateStr,
          lastSentAt: new Date().toISOString(),
          lastSentCount: 0,
          lastStatus: 'skipped_no_patients',
          lastError: null,
        });
      }
      return {
        action: 'skipped_no_patients',
        count: 0,
        message: 'Aucun patient programmé aujourd’hui — aucune notification envoyée.',
      };
    }

    const plainMessage = formatDigestMessage(cfg, dateFormatted, appointments, false);
    const htmlMessage = formatDigestMessage(cfg, dateFormatted, appointments, true);

    let anySent = false;
    let lastErr = '';

    // 1. Send via zero-secret Push channel (ntfy) if enabled
    if (cfg.ntfyEnabled !== false && cfg.ntfyTopic) {
      const title =
        cfg.language === 'fr'
          ? `Vincent Osteo — ${appointments.length} patient(s) aujourd'hui`
          : `Vincent Osteo — ${appointments.length} paciente(s) hoy`;
      const ntfyRes = await sendNtfyNotification(cfg.ntfyTopic, title, plainMessage);
      if (ntfyRes.ok) {
        anySent = true;
      } else if (ntfyRes.error) {
        lastErr = ntfyRes.error;
      }
    }

    // 2. Also send via Telegram if optional Bot Token & Chat ID were configured
    const botToken = getEffectiveBotToken(cfg);
    const chatId = getEffectiveChatId(cfg);
    if (botToken && chatId) {
      const tgRes = await sendTelegramMessage(botToken, chatId, htmlMessage);
      if (tgRes.ok) {
        anySent = true;
      } else if (tgRes.error) {
        lastErr = tgRes.error;
      }
    }

    if (!anySent) {
      await saveConfig({
        ...cfg,
        lastStatus: 'error',
        lastError: lastErr || 'Aucun canal de notification actif',
      });
      return {
        action: 'error',
        count: appointments.length,
        error: lastErr || 'Erreur lors de l’envoi de la notification.',
      };
    }

    await saveConfig({
      ...cfg,
      lastSentDate: dateStr,
      lastSentAt: new Date().toISOString(),
      lastSentCount: appointments.length,
      lastStatus: 'sent',
      lastError: null,
    });

    return {
      action: 'sent',
      count: appointments.length,
      message: `Notification récapitulative envoyée (${appointments.length} patient${appointments.length > 1 ? 's' : ''}).`,
    };
  } finally {
    isSendingDigest = false;
  }
}

async function startServer() {
  await loadConfig();

  const app = express();
  app.use(express.json());

  // Healthcheck
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  // Get Notification configuration
  app.get('/api/telegram/config', async (_req: Request, res: Response) => {
    const cfg = await loadConfig();
    res.json(toPublicConfig(cfg));
  });

  // Update Notification configuration
  app.post('/api/telegram/config', async (req: Request, res: Response) => {
    try {
      const current = await loadConfig();
      const body = req.body || {};

      let nextToken = current.botToken;
      if (typeof body.botToken === 'string') {
        const trimmed = body.botToken.trim();
        if (trimmed === '__CLEAR__') {
          nextToken = '';
        } else if (trimmed && !trimmed.includes('••••')) {
          nextToken = trimmed;
        }
      }

      let nextSendTime = current.sendTime || '08:00';
      if (typeof body.sendTime === 'string' && /^\d{2}:\d{2}$/.test(body.sendTime.trim())) {
        nextSendTime = body.sendTime.trim();
      }

      const next: StoredNotificationConfig = {
        ...current,
        enabled: typeof body.enabled === 'boolean' ? body.enabled : current.enabled,
        ntfyEnabled: typeof body.ntfyEnabled === 'boolean' ? body.ntfyEnabled : current.ntfyEnabled,
        ntfyTopic:
          typeof body.ntfyTopic === 'string' && body.ntfyTopic.trim()
            ? body.ntfyTopic.trim()
            : current.ntfyTopic,
        botToken: nextToken,
        botUsername: typeof body.botUsername === 'string' ? body.botUsername.trim() : current.botUsername,
        chatId: typeof body.chatId === 'string' ? body.chatId.trim() : current.chatId,
        chatLabel: typeof body.chatLabel === 'string' ? body.chatLabel.trim() : current.chatLabel,
        sendTime: nextSendTime,
        timezone: typeof body.timezone === 'string' && body.timezone.trim() ? body.timezone.trim() : current.timezone,
        language:
          body.language === 'fr' || body.language === 'es' || body.language === 'en'
            ? body.language
            : current.language,
        includePhone: typeof body.includePhone === 'boolean' ? body.includePhone : current.includePhone,
        includeMotif: typeof body.includeMotif === 'boolean' ? body.includeMotif : current.includeMotif,
        includeBono: typeof body.includeBono === 'boolean' ? body.includeBono : current.includeBono,
      };

      const saved = await saveConfig(next);
      res.json({ ok: true, config: toPublicConfig(saved) });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Failed to save config' });
    }
  });

  // Auto-detect Chat ID if user optionally connects a bot
  app.post('/api/telegram/detect-chat', async (req: Request, res: Response) => {
    try {
      const cfg = await loadConfig();
      const rawInputToken = typeof req.body?.botToken === 'string' ? req.body.botToken.trim() : '';
      const token =
        rawInputToken && !rawInputToken.includes('••••')
          ? rawInputToken
          : getEffectiveBotToken(cfg);

      if (!token) {
        res.status(400).json({ ok: false, error: 'Veuillez saisir un Bot Token.' });
        return;
      }

      const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const meJson = (await meRes.json()) as {
        ok: boolean;
        description?: string;
        result?: { username?: string; first_name?: string };
      };

      if (!meJson.ok) {
        res.status(400).json({
          ok: false,
          error: meJson.description || 'Token invalide.',
        });
        return;
      }

      const updatesRes = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=25&offset=-25`);
      const updatesJson = (await updatesRes.json()) as {
        ok: boolean;
        description?: string;
        result?: any[];
      };

      if (!updatesJson.ok) {
        res.status(400).json({
          ok: false,
          error: updatesJson.description || 'Impossible de lire les messages.',
        });
        return;
      }

      const chatsMap = new Map<
        string,
        { chatId: string; label: string; username?: string; type: string; lastMessage?: string }
      >();

      for (const upd of updatesJson.result || []) {
        const msg = upd.message || upd.edited_message || upd.my_chat_member;
        const chat = msg?.chat;
        if (!chat?.id) continue;
        const chatIdStr = String(chat.id);
        const label =
          chat.title ||
          [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
          (chat.username ? `@${chat.username}` : `Chat ${chatIdStr}`);
        chatsMap.set(chatIdStr, {
          chatId: chatIdStr,
          label,
          username: chat.username ? `@${chat.username}` : undefined,
          type: chat.type || 'private',
          lastMessage: msg?.text || '',
        });
      }

      const chats = Array.from(chatsMap.values()).reverse();

      const updatedCfg: StoredNotificationConfig = {
        ...cfg,
        botToken: rawInputToken && !rawInputToken.includes('••••') ? rawInputToken : cfg.botToken,
        botUsername: meJson.result?.username || cfg.botUsername,
      };
      if (chats.length > 0 && !getEffectiveChatId(updatedCfg)) {
        updatedCfg.chatId = chats[0].chatId;
        updatedCfg.chatLabel = chats[0].label;
      }
      await saveConfig(updatedCfg);

      res.json({
        ok: true,
        botUsername: meJson.result?.username || '',
        botName: meJson.result?.first_name || '',
        chats,
        config: toPublicConfig(updatedCfg),
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Erreur lors de la détection.' });
    }
  });

  // Live preview of today's morning summary
  app.get('/api/telegram/preview', async (req: Request, res: Response) => {
    try {
      const cfg = await loadConfig();
      const langParam = req.query.language;
      const previewCfg: StoredNotificationConfig = {
        ...cfg,
        language:
          langParam === 'fr' || langParam === 'es' || langParam === 'en'
            ? langParam
            : cfg.language,
        includePhone:
          req.query.includePhone !== undefined ? req.query.includePhone === 'true' : cfg.includePhone,
        includeMotif:
          req.query.includeMotif !== undefined ? req.query.includeMotif === 'true' : cfg.includeMotif,
        includeBono:
          req.query.includeBono !== undefined ? req.query.includeBono === 'true' : cfg.includeBono,
        timezone: typeof req.query.timezone === 'string' && req.query.timezone ? req.query.timezone : cfg.timezone,
      };

      const { dateStr, dateFormatted, appointments } = await getTodayAppointments(previewCfg);
      const messageText =
        appointments.length > 0
          ? formatDigestMessage(previewCfg, dateFormatted, appointments, false)
          : '';

      res.json({
        dateStr,
        dateFormatted,
        timezone: previewCfg.timezone,
        appointments,
        messageText,
      });
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'Preview error' });
    }
  });

  // Send immediate digest or connection ping test
  app.post('/api/telegram/send-test', async (req: Request, res: Response) => {
    try {
      const cfg = await loadConfig();
      const mode = req.body?.mode === 'ping' ? 'ping' : 'digest';

      if (mode === 'ping') {
        const lang = cfg.language || 'fr';
        const plainPing =
          lang === 'fr'
            ? `✅ Notifications activées !\n\nVotre cabinet Vincent Osteopatía vous enverra chaque matin à ${cfg.sendTime} le récapitulatif de vos patients (uniquement les jours avec rendez-vous).`
            : lang === 'es'
            ? `✅ ¡Notificaciones activadas!\n\nSu clínica Vincent Osteopatía le enviará cada mañana a las ${cfg.sendTime} el resumen de sus pacientes (solo los días con citas).`
            : `✅ Notifications enabled!\n\nVincent Osteopatía will send your daily patient digest at ${cfg.sendTime} (only on days with scheduled patients).`;

        let sentAny = false;
        let lastErr = '';

        if (cfg.ntfyEnabled !== false && cfg.ntfyTopic) {
          const ntfyRes = await sendNtfyNotification(
            cfg.ntfyTopic,
            'Vincent Osteopatía — Test de notification',
            plainPing
          );
          if (ntfyRes.ok) sentAny = true;
          else if (ntfyRes.error) lastErr = ntfyRes.error;
        }

        const botToken = getEffectiveBotToken(cfg);
        const chatId = getEffectiveChatId(cfg);
        if (botToken && chatId) {
          const htmlPing =
            lang === 'fr'
              ? `✅ <b>Notifications activées !</b>\n\nVotre cabinet <b>Vincent Osteopatía</b> vous enverra chaque matin à <b>${escapeHtml(cfg.sendTime)}</b> le récapitulatif de vos patients (uniquement les jours avec rendez-vous).`
              : `✅ <b>¡Notificaciones activadas!</b>\n\nSu clínica <b>Vincent Osteopatía</b> le enviará cada mañana a las <b>${escapeHtml(cfg.sendTime)}</b> el resumen de sus pacientes.`;
          const tgRes = await sendTelegramMessage(botToken, chatId, htmlPing);
          if (tgRes.ok) sentAny = true;
          else if (tgRes.error) lastErr = tgRes.error;
        }

        if (!sentAny) {
          res.status(400).json({ ok: false, error: lastErr || 'Impossible d’envoyer la notification test.' });
          return;
        }

        res.json({ ok: true, mode: 'ping', message: 'Notification de test envoyée avec succès !' });
        return;
      }

      const result = await checkAndSendMorningDigest({
        enforceTimeWindow: false,
        bypassEnabledCheck: true,
      });
      res.json({
        ok: result.action !== 'error',
        ...result,
      });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Test error' });
    }
  });

  // Cron trigger endpoint
  const handleCronTrigger = async (req: Request, res: Response) => {
    try {
      const cfg = await loadConfig();
      const providedSecret =
        String(req.query.secret || req.headers['x-cron-secret'] || '').trim();

      if (cfg.cronSecret && providedSecret !== cfg.cronSecret) {
        res.status(401).json({ ok: false, error: 'Invalid cron secret' });
        return;
      }

      const forceImmediate = req.query.force === '1';
      const result = await checkAndSendMorningDigest({
        enforceTimeWindow: !forceImmediate,
      });
      res.json({ ok: result.action !== 'error', ...result });
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err?.message || 'Cron execution error' });
    }
  };

  app.get('/api/telegram/cron', handleCronTrigger);
  app.post('/api/telegram/cron', handleCronTrigger);

  // Vite dev middleware OR production static dist
  if (!IS_PROD) {
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
    console.log(`[Server] Listening on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });

  // Morning scheduler: checks every 30 seconds
  setInterval(() => {
    checkAndSendMorningDigest({ enforceTimeWindow: true }).catch(err => {
      console.error('[Notifications Scheduler] Unexpected error:', err);
    });
  }, 30 * 1000);

  // Initial check 8 seconds after boot
  setTimeout(() => {
    checkAndSendMorningDigest({ enforceTimeWindow: true }).catch(() => {});
  }, 8000);
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
