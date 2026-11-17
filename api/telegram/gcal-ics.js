/**
 * Vercel Serverless Function: /api/telegram/gcal-ics
 * Fetches and parses a Google Calendar iCal (.ics) feed server-side (bypassing CORS)
 * so that Google Calendar events synchronize automatically on Vercel (www.osteovalencia.com)
 * even without requiring a browser OAuth popup token.
 */

const BLOCKED_KEYWORDS_REGEX =
  /(?:^🔒|\b(?:bloqu[eé]|bloqueado|blocked|pause|d[eé]jeuner|almuerzo|lunch|perso|personnel|vacances|vacaciones|ferm[eé]|cerrado|indisponible|cong[eé])\b)/i;

function unescapeIcsText(str) {
  return String(str || '')
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function parseIcsDate(rawVal, isEnd = false) {
  const val = String(rawVal || '').trim();
  if (!val) return '';

  // All-day date: YYYYMMDD
  if (/^\d{8}$/.test(val)) {
    const y = Number(val.slice(0, 4));
    const m = Number(val.slice(4, 6));
    const d = Number(val.slice(6, 8));
    const dt = isEnd ? new Date(y, m - 1, d, 9, 55, 0) : new Date(y, m - 1, d, 9, 0, 0);
    return dt.toISOString();
  }

  // DateTime: YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  const m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (m) {
    const [, yr, mo, da, hh, mm, ss, z] = m;
    if (z === 'Z') {
      return new Date(`${yr}-${mo}-${da}T${hh}:${mm}:${ss}Z`).toISOString();
    }
    return new Date(Number(yr), Number(mo) - 1, Number(da), Number(hh), Number(mm), Number(ss)).toISOString();
  }

  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function parseIcsContent(icsText) {
  // Unfold RFC 5545 folded lines
  const unfolded = String(icsText || '').replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  const events = [];
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current && current.uid && current.dtstart && current.status !== 'CANCELLED') {
        const isAllDay = /^\d{8}$/.test(current.dtstart);
        const startIso = parseIcsDate(current.dtstart, false);
        const endIso = isAllDay
          ? parseIcsDate(current.dtstart, true)
          : parseIcsDate(current.dtend || current.dtstart, true) || startIso;

        if (startIso) {
          const rawSummary = unescapeIcsText(current.summary || 'Rendez-vous Google');
          const cleanSummary = rawSummary.replace(/^🔒\s*/, '').trim();
          const rawDesc = unescapeIcsText(current.description || '');
          const isBlocked =
            rawSummary.startsWith('🔒') ||
            BLOCKED_KEYWORDS_REGEX.test(cleanSummary) ||
            /\[eventType:blocked\]/i.test(rawDesc) ||
            current.transp === 'TRANSPARENT';

          let clientName = cleanSummary;
          if (cleanSummary.includes(' — ')) {
            clientName = cleanSummary.split(' — ')[0].trim();
          } else if (cleanSummary.includes(' - ')) {
            clientName = cleanSummary.split(' - ')[0].trim();
          }

          const cleanUid = String(current.uid).replace(/@google\.com$/i, '');

          events.push({
            id: `gcal_${cleanUid}`,
            googleEventId: cleanUid,
            summary: cleanSummary,
            description: rawDesc,
            start: startIso,
            end: endIso,
            clientName: isBlocked ? undefined : clientName,
            eventType: isBlocked ? 'blocked' : 'appointment',
            isGoogleEvent: true,
          });
        }
      }
      current = null;
      continue;
    }

    if (!current) continue;
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const rawKey = line.slice(0, colonIdx);
    const val = line.slice(colonIdx + 1);
    const propName = rawKey.split(';')[0].toUpperCase();

    if (propName === 'UID') current.uid = val.trim();
    else if (propName === 'SUMMARY') current.summary = val;
    else if (propName === 'DESCRIPTION') current.description = val;
    else if (propName === 'DTSTART') current.dtstart = val.trim();
    else if (propName === 'DTEND') current.dtend = val.trim();
    else if (propName === 'STATUS') current.status = val.trim().toUpperCase();
    else if (propName === 'TRANSP') current.transp = val.trim().toUpperCase();
  }

  const minTime = Date.now() - 35 * 24 * 60 * 60 * 1000;
  const maxTime = Date.now() + 180 * 24 * 60 * 60 * 1000;

  return events.filter((ev) => {
    const t = new Date(ev.start).getTime();
    return !isNaN(t) && t >= minTime && t <= maxTime;
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' });
    return;
  }

  try {
    const icsUrl = String(req.body?.icsUrl || req.query?.icsUrl || '').trim();
    if (!icsUrl || !/^https?:\/\//i.test(icsUrl)) {
      res.status(400).json({ ok: false, error: 'URL iCal (.ics) invalide.' });
      return;
    }

    const response = await fetch(icsUrl, {
      headers: {
        'User-Agent': 'VincentOsteo-CalendarSync/1.0',
        Accept: 'text/calendar, text/plain, */*',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      res.status(400).json({
        ok: false,
        error: `Impossible de lire le flux Google Calendar (HTTP ${response.status}). Vérifiez votre lien secret iCal (.ics).`,
      });
      return;
    }

    const text = await response.text();
    if (!text.includes('BEGIN:VCALENDAR')) {
      res.status(400).json({
        ok: false,
        error: 'Le lien fourni ne correspond pas à un calendrier iCal (.ics) valide.',
      });
      return;
    }

    const events = parseIcsContent(text);
    res.status(200).json({ ok: true, count: events.length, events });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err?.message || 'Erreur lors de la lecture du calendrier iCal.',
    });
  }
}
