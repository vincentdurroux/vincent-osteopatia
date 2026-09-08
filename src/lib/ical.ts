import { CalendarEvent } from '../types';

/**
 * Format Date into RFC 5545 iCalendar UTC string format: YYYYMMDDTHHMMSSZ
 */
export function formatICalDate(dateInput: Date | string | number): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '20260101T000000Z';
  
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Escapes characters according to RFC 5545 rules
 */
export function escapeICalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generates an RFC 5545 compliant .ics calendar feed string
 */
export function generateICSFeed(
  events: CalendarEvent[],
  calendarName = 'Agenda Cabinet Ostéopathie'
): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Cabinet Osteopathie//Agenda//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${calendarName}`,
    'X-WR-TIMEZONE:Europe/Paris',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
    'X-PUBLISHED-TTL:PT1H',
  ];

  const nowStamp = formatICalDate(new Date());

  events.forEach((evt) => {
    if (!evt.start || !evt.end) return;

    const startDateStr = formatICalDate(evt.start);
    const endDateStr = formatICalDate(evt.end);

    const clientLabel = evt.clientName ? ` (${evt.clientName})` : '';
    const summary = evt.summary || `Consultation Ostéopathie${clientLabel}`;

    let description = evt.description || '';
    if (evt.clientName) {
      description = `Patient: ${evt.clientName}\n${description}`.trim();
    }

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:evt-${evt.id || Math.random().toString(36).substring(2)}@cabinet-osteopathie`);
    lines.push(`DTSTAMP:${nowStamp}`);
    lines.push(`DTSTART:${startDateStr}`);
    lines.push(`DTEND:${endDateStr}`);
    lines.push(`SUMMARY:${escapeICalText(summary)}`);
    if (description) {
      lines.push(`DESCRIPTION:${escapeICalText(description)}`);
    }
    lines.push('LOCATION:Cabinet d\'Ostéopathie');
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Triggers a browser download of the .ics file
 */
export function downloadICSFile(
  events: CalendarEvent[],
  filename = 'agenda-cabinet.ics',
  calendarName = 'Agenda Cabinet Ostéopathie'
): void {
  const icalContent = generateICSFeed(events, calendarName);
  const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Builds a direct Google Calendar web import link for a single event
 */
export function buildGoogleCalendarUrl(evt: CalendarEvent): string {
  const startIso = formatICalDate(evt.start);
  const endIso = formatICalDate(evt.end);
  const title = encodeURIComponent(evt.summary || (evt.clientName ? `RDV ${evt.clientName}` : 'Consultation Ostéopathie'));
  const details = encodeURIComponent(evt.description ? `${evt.clientName ? 'Patient: ' + evt.clientName + '\n' : ''}${evt.description}` : (evt.clientName ? `Patient: ${evt.clientName}` : 'Rendez-vous ostéopathie'));
  const location = encodeURIComponent('Cabinet d\'Ostéopathie');

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
}
