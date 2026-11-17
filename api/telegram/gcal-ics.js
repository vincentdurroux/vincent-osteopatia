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
    .replace(/\[eventType:[a-z]+\]/gi, '')
    .replace(/\[type:[a-z]+\]/gi, '')
    .replace(/\[gcalId:[^\]]+\]/gi, '')
    .replace(/\[clientName:[^\]]+\]/gi, '')
    .trim();
}

function zonedWallTimeToUtcIso(year, month, day, hour, minute, second, timeZone) {
  const tz = timeZone || 'Europe/Madrid';
  try {
    const approxUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = dtf.formatToParts(new Date(approxUtcMs));
    const map = {};
    for (const p of parts) {
      if (p.type !== 'literal') map[p.type] = Number(p.value);
    }
    const tzHour = map.hour === 24 ? 0 : map.hour;
    const asIfUtcMs = Date.UTC(map.year, map.month - 1, map.day, tzHour, map.minute, map.second);
    const offsetMs = asIfUtcMs - approxUtcMs;
    return new Date(approxUtcMs - offsetMs).toISOString();
  } catch {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }
}

function parseIcsDate(rawVal, tzid, isEnd = false) {
  const val = String(rawVal || '').trim();
  if (!val) return '';

  // All-day date: YYYYMMDD
  if (/^\d{8}$/.test(val)) {
    const y = Number(val.slice(0, 4));
    const m = Number(val.slice(4, 6));
    const d = Number(val.slice(6, 8));
    return isEnd
      ? zonedWallTimeToUtcIso(y, m, d, 9, 55, 0, tzid)
      : zonedWallTimeToUtcIso(y, m, d, 9, 0, 0, tzid);
  }

  // DateTime: YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
  const m = val.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (m) {
    const [, yr, mo, da, hh, mm, ss, z] = m;
    if (z === 'Z') {
      return new Date(`${yr}-${mo}-${da}T${hh}:${mm}:${ss}Z`).toISOString();
    }
    return zonedWallTimeToUtcIso(
      Number(yr),
      Number(mo),
      Number(da),
      Number(hh),
      Number(mm),
      Number(ss),
      tzid
    );
  }

  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? '' : parsed.toISOString();
}

function extractTzidFromKey(rawKey, defaultTz) {
  const match = String(rawKey || '').match(/TZID=([^;:]+)/i);
  return match && match[1] ? match[1].trim() : defaultTz;
}

function parseIcsContent(icsText) {
  // Unfold RFC 5545 folded lines
  const unfolded = String(icsText || '').replace(/\r?\n[ \t]/g, '');
  const lines = unfolded.split(/\r?\n/);

  let calendarTz = 'Europe/Madrid';
  for (const line of lines) {
    if (line.toUpperCase().startsWith('X-WR-TIMEZONE:')) {
      const tz = line.slice('X-WR-TIMEZONE:'.length).trim();
      if (tz) calendarTz = tz;
      break;
    }
  }

  const events = [];
  const cancelledSet = new Set();
  const activeSet = new Set();
  let current = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current && current.uid) {
        const cleanUid = String(current.uid).replace(/@google\.com$/i, '');
        if (current.status === 'CANCELLED') {
          cancelledSet.add(cleanUid);
        } else if (current.dtstart) {
          activeSet.add(cleanUid);
          const isAllDay = /^\d{8}$/.test(current.dtstart);
          const startIso = parseIcsDate(current.dtstart, current.dtstartTz || calendarTz, false);
          const endIso = isAllDay
            ? parseIcsDate(current.dtstart, current.dtstartTz || calendarTz, true)
            : parseIcsDate(
                current.dtend || current.dtstart,
                current.dtendTz || current.dtstartTz || calendarTz,
                true
              ) || startIso;

          if (startIso) {
            const rawSummary = unescapeIcsText(current.summary || 'Rendez-vous Google');
            const cleanSummary = rawSummary.replace(/^🔒\s*/, '').trim();
            const rawDesc = unescapeIcsText(current.description || '');
            const isBlocked =
              rawSummary.startsWith('🔒') ||
              BLOCKED_KEYWORDS_REGEX.test(cleanSummary) ||
              /\[eventType:blocked\]/i.test(current.description || '') ||
              current.transp === 'TRANSPARENT';

            let clientName = cleanSummary;
            if (cleanSummary.includes(' — ')) {
              clientName = cleanSummary.split(' — ')[0].trim();
            } else if (cleanSummary.includes(' - ')) {
              clientName = cleanSummary.split(' - ')[0].trim();
            }

            events.push({
              id: `gcal_${cleanUid}`,
              googleEventId: cleanUid,
              iCalUID: cleanUid,
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
    else if (propName === 'DTSTART') {
      current.dtstart = val.trim();
      current.dtstartTz = extractTzidFromKey(rawKey, calendarTz);
    } else if (propName === 'DTEND') {
      current.dtend = val.trim();
      current.dtendTz = extractTzidFromKey(rawKey, calendarTz);
    } else if (propName === 'STATUS') current.status = val.trim().toUpperCase();
    else if (propName === 'TRANSP') current.transp = val.trim().toUpperCase();
  }

  for (const activeId of activeSet) {
    cancelledSet.delete(activeId);
  }

  const minTime = Date.now() - 35 * 24 * 60 * 60 * 1000;
  const maxTime = Date.now() + 180 * 24 * 60 * 60 * 1000;

  const filteredEvents = events.filter((ev) => {
    const t = new Date(ev.start).getTime();
    return !isNaN(t) && t >= minTime && t <= maxTime;
  });

  return {
    events: filteredEvents,
    cancelledGoogleIds: Array.from(cancelledSet),
  };
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

    const separator = icsUrl.includes('?') ? '&' : '?';
    const bustUrl = `${icsUrl}${separator}_t=${Date.now()}`;

    const response = await fetch(bustUrl, {
      headers: {
        'User-Agent': 'VincentOsteo-CalendarSync/1.0',
        Accept: 'text/calendar, text/plain, */*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
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

    const { events, cancelledGoogleIds } = parseIcsContent(text);
    res.status(200).json({
      ok: true,
      count: events.length,
      events,
      cancelledGoogleIds,
    });
  } catch (err) {
    res.status(500).json({
      ok: false,
      error: err?.message || 'Erreur lors de la lecture du calendrier iCal.',
    });
  }
}
