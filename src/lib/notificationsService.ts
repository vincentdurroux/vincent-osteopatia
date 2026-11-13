import { supabase } from './supabase';
import { TelegramConfigResponse, TelegramPreviewResponse } from '../types';

export const SYS_CONFIG_EVENT_ID = '00000000-0000-4000-8000-743567000001';
export const SYS_CONFIG_SUMMARY = '__SYS_TELEGRAM_CONFIG__';
const LOCAL_STORAGE_KEY = 'vincent_osteo_notifications_config';

export interface StoredNotificationConfig {
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

export interface DetectedChat {
  chatId: string;
  label: string;
  username?: string;
  type: string;
  lastMessage?: string;
}

function generateSecret(): string {
  try {
    const arr = new Uint8Array(12);
    crypto.getRandomValues(arr);
    return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}

export function defaultNotificationConfig(): StoredNotificationConfig {
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
    cronSecret: generateSecret(),
    updatedAt: 0,
  };
}

export function maskBotToken(token: string): string {
  if (!token) return '';
  if (token.length <= 10) return '••••••••';
  return `${token.slice(0, 6)}••••••${token.slice(-4)}`;
}

export function toPublicNotificationConfig(cfg: StoredNotificationConfig): TelegramConfigResponse {
  const effectiveToken = (cfg.botToken || '').trim();
  const effectiveChatId = (cfg.chatId || '').trim();
  return {
    enabled: Boolean(cfg.enabled),
    ntfyEnabled: cfg.ntfyEnabled !== false,
    ntfyTopic: cfg.ntfyTopic || '',
    hasBotToken: Boolean(effectiveToken),
    botTokenMasked: maskBotToken(effectiveToken),
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
    cronSecret: cfg.cronSecret || '',
    botUsername: cfg.botUsername || '',
  };
}

function readBrowserCache(): Partial<StoredNotificationConfig> | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeBrowserCache(cfg: StoredNotificationConfig) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cfg));
  } catch {}
}

async function readSupabaseStoredConfig(): Promise<Partial<StoredNotificationConfig> | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('description')
      .eq('id', SYS_CONFIG_EVENT_ID)
      .maybeSingle();

    if (!error && data?.description) {
      return JSON.parse(data.description);
    }
  } catch (err) {
    console.warn('[Notifications] Supabase read failed:', err);
  }
  return null;
}

async function writeSupabaseStoredConfig(cfg: StoredNotificationConfig): Promise<void> {
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
    console.warn('[Notifications] Supabase write failed:', err);
  }
}

export async function loadRawNotificationConfig(): Promise<StoredNotificationConfig> {
  const base = defaultNotificationConfig();
  const localCfg = readBrowserCache();
  const remoteCfg = await readSupabaseStoredConfig();

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

  if (!merged.cronSecret) {
    merged.cronSecret = generateSecret();
  }

  writeBrowserCache(merged);
  return merged;
}

export async function loadNotificationConfig(): Promise<TelegramConfigResponse> {
  const raw = await loadRawNotificationConfig();
  return toPublicNotificationConfig(raw);
}

export async function saveRawNotificationConfig(
  next: StoredNotificationConfig
): Promise<StoredNotificationConfig> {
  const withTimestamp: StoredNotificationConfig = {
    ...next,
    updatedAt: Date.now(),
  };
  writeBrowserCache(withTimestamp);
  await writeSupabaseStoredConfig(withTimestamp);

  // Best-effort sync with local Express backend if running (e.g. inside Google AI Studio)
  try {
    fetch('/api/telegram/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        enabled: withTimestamp.enabled,
        botToken: withTimestamp.botToken || '__CLEAR__',
        botUsername: withTimestamp.botUsername || '',
        chatId: withTimestamp.chatId,
        chatLabel: withTimestamp.chatLabel,
        sendTime: withTimestamp.sendTime,
        timezone: withTimestamp.timezone,
        language: withTimestamp.language,
        includePhone: withTimestamp.includePhone,
        includeMotif: withTimestamp.includeMotif,
        includeBono: withTimestamp.includeBono,
      }),
    }).catch(() => {});
  } catch {}

  return withTimestamp;
}

export async function saveNotificationConfig(payload: {
  enabled?: boolean;
  botToken?: string;
  chatId?: string;
  chatLabel?: string;
  sendTime?: string;
  timezone?: string;
  language?: 'fr' | 'es' | 'en';
  includePhone?: boolean;
  includeMotif?: boolean;
  includeBono?: boolean;
}): Promise<TelegramConfigResponse> {
  const current = await loadRawNotificationConfig();

  let nextToken = current.botToken;
  if (typeof payload.botToken === 'string') {
    const trimmed = payload.botToken.trim();
    if (trimmed === '__CLEAR__') {
      nextToken = '';
    } else if (trimmed && !trimmed.includes('••••')) {
      nextToken = trimmed;
    }
  }

  let nextSendTime = current.sendTime || '08:00';
  if (typeof payload.sendTime === 'string' && /^\d{2}:\d{2}$/.test(payload.sendTime.trim())) {
    nextSendTime = payload.sendTime.trim();
  }

  const next: StoredNotificationConfig = {
    ...current,
    enabled: typeof payload.enabled === 'boolean' ? payload.enabled : current.enabled,
    botToken: nextToken,
    chatId: typeof payload.chatId === 'string' ? payload.chatId.trim() : current.chatId,
    chatLabel: typeof payload.chatLabel === 'string' ? payload.chatLabel.trim() : current.chatLabel,
    sendTime: nextSendTime,
    timezone:
      typeof payload.timezone === 'string' && payload.timezone.trim()
        ? payload.timezone.trim()
        : current.timezone || 'Europe/Madrid',
    language:
      payload.language === 'fr' || payload.language === 'es' || payload.language === 'en'
        ? payload.language
        : current.language || 'fr',
    includePhone:
      typeof payload.includePhone === 'boolean' ? payload.includePhone : current.includePhone,
    includeMotif:
      typeof payload.includeMotif === 'boolean' ? payload.includeMotif : current.includeMotif,
    includeBono:
      typeof payload.includeBono === 'boolean' ? payload.includeBono : current.includeBono,
  };

  // Validate token and auto-detect Chat ID directly against api.telegram.org (CORS enabled)
  if (next.botToken) {
    const meRes = await fetch(`https://api.telegram.org/bot${next.botToken}/getMe`);
    const meJson = (await meRes.json()) as {
      ok: boolean;
      result?: { username?: string };
      description?: string;
    };
    if (!meJson.ok) {
      throw new Error(
        `Token invalide (${meJson.description || 'Vérifiez le token fourni par @BotFather'})`
      );
    }
    next.botUsername = meJson.result?.username || '';

    if (!next.chatId) {
      try {
        const upRes = await fetch(
          `https://api.telegram.org/bot${next.botToken}/getUpdates?limit=20`
        );
        const upJson = (await upRes.json()) as { ok: boolean; result?: any[] };
        if (upJson.ok && Array.isArray(upJson.result)) {
          for (let i = upJson.result.length - 1; i >= 0; i--) {
            const u = upJson.result[i];
            const msg = u.message || u.edited_message || u.channel_post || u.my_chat_member;
            const chat = msg?.chat;
            if (chat?.id) {
              next.chatId = String(chat.id);
              next.chatLabel =
                chat.title ||
                [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
                chat.username ||
                `Chat ${chat.id}`;
              break;
            }
          }
        }
      } catch {}
    }
  } else {
    next.botUsername = '';
  }

  const saved = await saveRawNotificationConfig(next);
  return toPublicNotificationConfig(saved);
}

export async function detectNotificationChats(botTokenOverride?: string): Promise<{
  chats: DetectedChat[];
  config: TelegramConfigResponse;
}> {
  const cfg = await loadRawNotificationConfig();
  const candidateToken =
    botTokenOverride && !botTokenOverride.includes('••••')
      ? botTokenOverride.trim()
      : cfg.botToken.trim();

  if (!candidateToken) {
    throw new Error('Veuillez renseigner le Token du Bot.');
  }

  const meRes = await fetch(`https://api.telegram.org/bot${candidateToken}/getMe`);
  const meJson = (await meRes.json()) as {
    ok: boolean;
    result?: { username?: string };
    description?: string;
  };
  if (!meJson.ok) {
    throw new Error(`Token invalide : ${meJson.description || 'Non reconnu'}`);
  }
  const botUsername = meJson.result?.username || '';

  const upRes = await fetch(`https://api.telegram.org/bot${candidateToken}/getUpdates?limit=50`);
  const upJson = (await upRes.json()) as {
    ok: boolean;
    result?: any[];
    description?: string;
  };
  if (!upJson.ok) {
    throw new Error(upJson.description || 'Impossible de récupérer les messages.');
  }

  const chatsMap = new Map<string, DetectedChat>();
  for (const u of upJson.result || []) {
    const msg = u.message || u.edited_message || u.channel_post || u.my_chat_member;
    const chat = msg?.chat;
    if (!chat || !chat.id) continue;
    const idStr = String(chat.id);
    const label =
      chat.title ||
      [chat.first_name, chat.last_name].filter(Boolean).join(' ') ||
      chat.username ||
      `Chat ${idStr}`;
    chatsMap.set(idStr, {
      chatId: idStr,
      label,
      username: chat.username || undefined,
      type: chat.type || 'private',
      lastMessage: msg.text || undefined,
    });
  }

  const chats = Array.from(chatsMap.values());
  if (chats.length === 0) {
    throw new Error(
      `Aucun message trouvé. Ouvrez ${
        botUsername ? `@${botUsername}` : 'votre bot'
      } dans Telegram, cliquez sur "Démarrer" (/start), puis réessayez.`
    );
  }

  const firstChat = chats[chats.length - 1];
  const updated = await saveRawNotificationConfig({
    ...cfg,
    botToken: candidateToken,
    botUsername,
    chatId: cfg.chatId || firstChat.chatId,
    chatLabel: cfg.chatLabel || firstChat.label,
  });

  return {
    chats: chats.reverse(),
    config: toPublicNotificationConfig(updated),
  };
}

function escapeHtml(text: string): string {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getZonedDateString(date: Date, timeZone: string): string {
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

export function getZonedMinutesOfDay(date: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(date);
    const h = Number(parts.find((p) => p.type === 'hour')?.value || '0');
    const m = Number(parts.find((p) => p.type === 'minute')?.value || '0');
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

export async function getTodayAppointmentsFromSupabase(opts: {
  timezone: string;
  language: 'fr' | 'es' | 'en';
}) {
  const timeZone = opts.timezone || 'Europe/Madrid';
  const now = new Date();
  const todayStr = getZonedDateString(now, timeZone);
  const dateFormatted = formatLongDateInZone(now, timeZone, opts.language || 'fr');

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

    const appointments: TelegramPreviewResponse['appointments'] = [];

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

export function formatDigestMessageText(
  opts: {
    language: 'fr' | 'es' | 'en';
    includePhone: boolean;
    includeMotif: boolean;
    includeBono: boolean;
  },
  dateFormatted: string,
  appointments: TelegramPreviewResponse['appointments'],
  forHtml: boolean = true
): string {
  const lang = opts.language || 'fr';
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
    if (opts.includePhone && appt.phone) {
      lines.push(`   📞 ${esc(appt.phone)}`);
    }
    if (opts.includeMotif && appt.motif) {
      lines.push(`   📝 ${esc(appt.motif)}`);
    }
    if (opts.includeBono && appt.hasBono && (appt.bonoSessionsRemaining ?? 0) > 0) {
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

export async function getNotificationPreview(opts: {
  language: 'fr' | 'es' | 'en';
  includePhone: boolean;
  includeMotif: boolean;
  includeBono: boolean;
  timezone: string;
}): Promise<TelegramPreviewResponse> {
  const { dateStr, dateFormatted, appointments } = await getTodayAppointmentsFromSupabase({
    timezone: opts.timezone,
    language: opts.language,
  });

  const messageText =
    appointments.length > 0
      ? formatDigestMessageText(opts, dateFormatted, appointments, false)
      : '';

  return {
    dateStr,
    dateFormatted,
    timezone: opts.timezone,
    appointments,
    messageText,
  };
}

async function sendTelegramApiMessage(
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
    return { ok: false, error: err?.message || 'Erreur réseau' };
  }
}

export async function sendNotificationNow(
  mode: 'ping' | 'digest',
  options?: { enforceTimeWindow?: boolean; bypassEnabledCheck?: boolean }
): Promise<{
  ok: boolean;
  action?: 'sent' | 'skipped_no_patients' | 'skipped_already_sent' | 'skipped_disabled' | 'skipped_window' | 'error';
  count?: number;
  error?: string;
}> {
  const cfg = await loadRawNotificationConfig();
  const botToken = (cfg.botToken || '').trim();
  const chatId = (cfg.chatId || '').trim();

  if (!botToken || !chatId) {
    return {
      ok: false,
      error: 'Veuillez configurer le Token du Bot et le Chat ID avant d’envoyer une notification.',
    };
  }

  if (mode === 'ping') {
    const lang = cfg.language || 'fr';
    const htmlMsg =
      lang === 'fr'
        ? `✅ <b>Notifications connectées avec succès !</b>\n\n🦴 <b>Vincent Osteopatía</b>\n⏰ Envoi matinal programmé à <b>${cfg.sendTime}</b> (${cfg.timezone})\n📋 Vous recevrez un récapitulatif uniquement les matins où au moins un patient est programmé.`
        : lang === 'es'
        ? `✅ <b>¡Notificaciones conectadas con éxito!</b>\n\n🦴 <b>Vincent Osteopatía</b>\n⏰ Envío matinal programado a las <b>${cfg.sendTime}</b> (${cfg.timezone})\n📋 Recibirá un resumen únicamente las mañanas en las que haya al menos un paciente programado.`
        : `✅ <b>Notifications connected successfully!</b>\n\n🦴 <b>Vincent Osteopatía</b>\n⏰ Morning digest scheduled at <b>${cfg.sendTime}</b> (${cfg.timezone})\n📋 You will receive a summary only on mornings when at least one patient is scheduled.`;

    const res = await sendTelegramApiMessage(botToken, chatId, htmlMsg);
    if (!res.ok) {
      return { ok: false, error: res.error };
    }
    return { ok: true, action: 'sent' };
  }

  // Digest mode
  if (!options?.bypassEnabledCheck && !cfg.enabled) {
    return { ok: true, action: 'skipped_disabled', count: 0 };
  }

  const timeZone = cfg.timezone || 'Europe/Madrid';
  const now = new Date();
  const todayStr = getZonedDateString(now, timeZone);

  if (options?.enforceTimeWindow) {
    if (cfg.lastSentDate === todayStr) {
      return { ok: true, action: 'skipped_already_sent', count: 0 };
    }
    const [hh, mm] = (cfg.sendTime || '08:00').split(':').map((n) => parseInt(n, 10));
    const targetMinutes = (isNaN(hh) ? 8 : hh) * 60 + (isNaN(mm) ? 0 : mm);
    const currentMinutes = getZonedMinutesOfDay(now, timeZone);
    if (currentMinutes < targetMinutes || currentMinutes > targetMinutes + 240) {
      return { ok: true, action: 'skipped_window', count: 0 };
    }
  }

  const { dateStr, dateFormatted, appointments } = await getTodayAppointmentsFromSupabase({
    timezone: timeZone,
    language: cfg.language || 'fr',
  });

  if (appointments.length === 0) {
    if (options?.enforceTimeWindow) {
      await saveRawNotificationConfig({
        ...cfg,
        lastSentDate: dateStr,
        lastSentAt: new Date().toISOString(),
        lastSentCount: 0,
        lastStatus: 'skipped_no_patients',
        lastError: null,
      });
    }
    return { ok: true, action: 'skipped_no_patients', count: 0 };
  }

  const htmlMessage = formatDigestMessageText(cfg, dateFormatted, appointments, true);
  const tgRes = await sendTelegramApiMessage(botToken, chatId, htmlMessage);

  if (!tgRes.ok) {
    await saveRawNotificationConfig({
      ...cfg,
      lastStatus: 'error',
      lastError: tgRes.error || 'Erreur envoi',
    });
    return { ok: false, action: 'error', error: tgRes.error };
  }

  await saveRawNotificationConfig({
    ...cfg,
    lastSentDate: dateStr,
    lastSentAt: new Date().toISOString(),
    lastSentCount: appointments.length,
    lastStatus: 'sent',
    lastError: null,
  });

  return { ok: true, action: 'sent', count: appointments.length };
}
