import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lnlemynayesjduntoran.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGVteW5heWVzamR1bnRvcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDAyMDgsImV4cCI6MjA4MjkxNjIwOH0.3b9fFgeWTXen1fsOO0xMdM5Fd3PTxYs41UxlPapo0ZU';

const SYS_CONFIG_EVENT_ID = '00000000-0000-4000-8000-743567000001';
const SYS_CONFIG_SUMMARY = '__SYS_TELEGRAM_CONFIG__';

const GENERIC_APPOINTMENT_SUMMARIES = new Set([
  'rdv patient',
  'rendez-vous',
  'cita',
  'appointment',
  'sesión de osteopatía',
  "séance d'ostéopathie",
  'osteopathy session',
]);

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getZonedDateString(date, timeZone) {
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

function formatTimeInZone(isoStr, timeZone) {
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

function formatLongDateInZone(date, timeZone, lang) {
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

export default async function handler(req, res) {
  try {
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

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: cfgRow } = await supabase
      .from('calendar_events')
      .select('description')
      .eq('id', SYS_CONFIG_EVENT_ID)
      .maybeSingle();

    if (!cfgRow?.description) {
      return res.status(200).json({ ok: false, error: 'Configuration non trouvée dans Supabase.' });
    }

    const cfg = JSON.parse(cfgRow.description);
    const providedSecret = String(req.query?.secret || req.headers?.['x-cron-secret'] || '');
    if (cfg.cronSecret && providedSecret && providedSecret !== cfg.cronSecret) {
      return res.status(401).json({ ok: false, error: 'Invalid cron secret' });
    }

    const force = req.query?.force === '1' || req.query?.force === 'true';
    if (!force && !cfg.enabled) {
      return res.status(200).json({ ok: true, action: 'skipped_disabled', count: 0 });
    }

    const timeZone = cfg.timezone || 'Europe/Madrid';
    const now = new Date();
    const todayStr = getZonedDateString(now, timeZone);

    if (!force && cfg.lastSentDate === todayStr) {
      return res.status(200).json({ ok: true, action: 'skipped_already_sent', count: 0 });
    }

    const lang = cfg.language || 'fr';
    const dateFormatted = formatLongDateInZone(now, timeZone, lang);

    const [{ data: eventsData }, { data: clientsData }] = await Promise.all([
      supabase.from('calendar_events').select('*').order('start', { ascending: true }),
      supabase.from('clients').select('*'),
    ]);

    const clientsById = new Map();
    const clientsByName = new Map();
    for (const c of clientsData || []) {
      const fullName =
        c.name || `${c.last_name || c.lastName || ''} ${c.first_name || c.firstName || ''}`.trim();
      const normalized = {
        ...c,
        fullName,
        phone: c.phone || '',
        hasBono: Boolean(c.hasBono ?? c.has_bono),
        bonoSessionsRemaining: Number(c.bonoSessionsRemaining ?? c.bono_sessions_remaining ?? 0),
      };
      clientsById.set(String(c.id), normalized);
      if (fullName) clientsByName.set(fullName.toLowerCase(), normalized);
    }

    const appointments = [];
    for (const row of eventsData || []) {
      if (row.id === SYS_CONFIG_EVENT_ID || row.summary === SYS_CONFIG_SUMMARY) continue;
      const startRaw = row.start || row.start_time || row.startTime || '';
      const endRaw = row.end || row.end_time || row.endTime || '';
      if (!startRaw) continue;
      const startDate = new Date(startRaw);
      if (isNaN(startDate.getTime())) continue;
      if (getZonedDateString(startDate, timeZone) !== todayStr) continue;

      const rawDesc = String(row.description || row.notes || row.note || '');
      let eventType = row.eventType || row.event_type || row.type;
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
        if (rawClientId || !summaryStr || GENERIC_APPOINTMENT_SUMMARIES.has(summaryStr.toLowerCase())) {
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
        start: startRaw,
        timeRange,
        clientName,
        phone: matchedClient?.phone || undefined,
        motif: motif || undefined,
        hasBono: Boolean(matchedClient?.hasBono),
        bonoSessionsRemaining: matchedClient?.bonoSessionsRemaining || 0,
      });
    }

    appointments.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

    if (appointments.length === 0) {
      const nextCfg = {
        ...cfg,
        lastSentDate: todayStr,
        lastSentAt: new Date().toISOString(),
        lastSentCount: 0,
        lastStatus: 'skipped_no_patients',
        lastError: null,
        updatedAt: Date.now(),
      };
      await supabase.from('calendar_events').upsert({
        id: SYS_CONFIG_EVENT_ID,
        summary: SYS_CONFIG_SUMMARY,
        description: JSON.stringify(nextCfg),
        start: '1970-01-01T00:00:00+00:00',
        end: '1970-01-01T00:01:00+00:00',
      });
      return res.status(200).json({ ok: true, action: 'skipped_no_patients', count: 0 });
    }

    const count = appointments.length;
    const capitalizedDate = dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1);
    const header = `🦴 <b>Vincent Osteopatía</b> — <b>${escapeHtml(capitalizedDate)}</b>`;
    const subheader =
      lang === 'fr'
        ? `👥 <b>${count} patient${count > 1 ? 's' : ''} programmé${count > 1 ? 's' : ''} aujourd'hui</b>`
        : lang === 'es'
        ? `👥 <b>${count} paciente${count > 1 ? 's' : ''} programado${count > 1 ? 's' : ''} hoy</b>`
        : `👥 <b>${count} patient${count > 1 ? 's' : ''} scheduled today</b>`;

    const lines = [header, subheader, ''];
    appointments.forEach((appt, index) => {
      lines.push(`${index + 1}. 🕐 <b>${escapeHtml(appt.timeRange)}</b> • <b>${escapeHtml(appt.clientName)}</b>`);
      if (cfg.includePhone !== false && appt.phone) {
        lines.push(`   📞 ${escapeHtml(appt.phone)}`);
      }
      if (cfg.includeMotif !== false && appt.motif) {
        lines.push(`   📝 ${escapeHtml(appt.motif)}`);
      }
      if (cfg.includeBono !== false && appt.hasBono && appt.bonoSessionsRemaining > 0) {
        const rem = appt.bonoSessionsRemaining;
        const bonoLabel =
          lang === 'fr'
            ? `🎟️ Bono : ${rem} séance${rem > 1 ? 's' : ''} restante${rem > 1 ? 's' : ''}`
            : lang === 'es'
            ? `🎟️ Bono: ${rem} sesión${rem > 1 ? 'es' : ''} restante${rem > 1 ? 's' : ''}`
            : `🎟️ Bono: ${rem} session${rem > 1 ? 's' : ''} left`;
        lines.push(`   ${escapeHtml(bonoLabel)}`);
      }
      lines.push('');
    });

    lines.push(
      lang === 'fr'
        ? 'Bonne journée de consultations ! ✨'
        : lang === 'es'
        ? '¡Buen día de consultas! ✨'
        : 'Have a great day of consultations! ✨'
    );

    const htmlText = lines.join('\n').trim();
    const tgRes = await fetch(`https://api.telegram.org/bot${cfg.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cfg.chatId,
        text: htmlText,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    const tgJson = await tgRes.json();

    if (!tgJson.ok) {
      return res.status(500).json({ ok: false, error: tgJson.description || 'Telegram API error' });
    }

    const nextCfg = {
      ...cfg,
      lastSentDate: todayStr,
      lastSentAt: new Date().toISOString(),
      lastSentCount: count,
      lastStatus: 'sent',
      lastError: null,
      updatedAt: Date.now(),
    };
    await supabase.from('calendar_events').upsert({
      id: SYS_CONFIG_EVENT_ID,
      summary: SYS_CONFIG_SUMMARY,
      description: JSON.stringify(nextCfg),
      start: '1970-01-01T00:00:00+00:00',
      end: '1970-01-01T00:01:00+00:00',
    });

    return res.status(200).json({ ok: true, action: 'sent', count });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || 'Cron execution error' });
  }
}
