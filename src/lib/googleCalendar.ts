import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CalendarEvent, EventType } from '../types';

export const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token strictly in memory (never in localStorage/sessionStorage).
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getFirebaseProjectId = (): string => {
  return firebaseConfig.projectId || 'gen-lang-client-0940402535';
};

const GCAL_BASE_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

const BLOCKED_KEYWORDS_REGEX =
  /(?:^🔒|\b(?:bloqu[eé]|bloqueado|blocked|pause|d[eé]jeuner|almuerzo|lunch|perso|personnel|vacances|vacaciones|ferm[eé]|cerrado|indisponible|cong[eé])\b)/i;

function normalizeGoogleDateTime(dtObj?: { dateTime?: string; date?: string }, isEnd = false): string {
  if (!dtObj) return '';
  if (dtObj.dateTime) {
    const parsed = new Date(dtObj.dateTime);
    return isNaN(parsed.getTime()) ? dtObj.dateTime : parsed.toISOString();
  }
  if (dtObj.date) {
    // Parse YYYY-MM-DD in local time so all-day events created in Google Calendar
    // land on the exact local date at 09:00 - 09:55 on the clinic schedule grid.
    const parts = dtObj.date.split('-').map(Number);
    if (parts.length === 3 && !parts.some(isNaN)) {
      const [y, m, d] = parts;
      const localDate = isEnd
        ? new Date(y, m - 1, d, 9, 55, 0)
        : new Date(y, m - 1, d, 9, 0, 0);
      return localDate.toISOString();
    }
    return dtObj.date;
  }
  return '';
}

function formatGoogleSummaryForClinicEvent(event: Omit<CalendarEvent, 'id'> | CalendarEvent): string {
  if (event.eventType === 'blocked') {
    const title = event.summary?.trim() || 'Créneau bloqué';
    return title.startsWith('🔒') ? title : `🔒 ${title}`;
  }
  const patient = event.clientName?.trim();
  const sum = event.summary?.trim() || 'Séance d’ostéopathie';
  if (patient && sum.toLowerCase() !== patient.toLowerCase() && !sum.toLowerCase().includes(patient.toLowerCase())) {
    return `${patient} — ${sum}`;
  }
  return patient || sum;
}

export function classifyExternalCalendarEvent(
  rawSummary: string,
  rawDesc: string,
  priv: Record<string, string> = {},
  transparency?: string
): { eventType: EventType; clientName?: string; cleanSummary: string } {
  const cleanSummary = String(rawSummary || 'Rendez-vous Google Calendar')
    .replace(/^🔒\s*/, '')
    .trim();

  if (priv.eventType === 'blocked') {
    return { eventType: 'blocked', cleanSummary };
  }
  if (priv.eventType === 'appointment' || priv.clientId || priv.clientName) {
    const cName =
      priv.clientName ||
      (cleanSummary.includes(' — ') ? cleanSummary.split(' — ')[0].trim() : cleanSummary);
    return { eventType: 'appointment', clientName: cName, cleanSummary };
  }

  const isBlockedKeyword =
    String(rawSummary || '').trim().startsWith('🔒') ||
    BLOCKED_KEYWORDS_REGEX.test(cleanSummary) ||
    /\[eventType:blocked\]/i.test(rawDesc) ||
    transparency === 'transparent';

  if (isBlockedKeyword) {
    return { eventType: 'blocked', cleanSummary };
  }

  // Default: any standard event created on Google Calendar is treated as a patient appointment
  // so it appears immediately as a consultation card on the clinic schedule and in daily views.
  let extractedClientName = cleanSummary;
  if (cleanSummary.includes(' — ')) {
    extractedClientName = cleanSummary.split(' — ')[0].trim();
  } else if (cleanSummary.includes(' - ')) {
    extractedClientName = cleanSummary.split(' - ')[0].trim();
  }

  return {
    eventType: 'appointment',
    clientName: extractedClientName || cleanSummary,
    cleanSummary,
  };
}

export const calendarApi = {
  async fetchEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    let url = `${GCAL_BASE_URL}?singleEvents=true&orderBy=startTime&maxResults=250`;
    if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
    if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;

    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        cachedAccessToken = null;
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(`Google Calendar API error: ${res.status}`);
    }

    const data = await res.json();
    if (!Array.isArray(data.items)) return [];

    return data.items
      .filter((item: any) => item.status !== 'cancelled')
      .map((item: any): CalendarEvent => {
        const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
        const startStr = normalizeGoogleDateTime(item.start, false);
        // For all-day events, Google sets end.date to the next day; keep it on the same day 09:00-09:55
        const endStr = isAllDay
          ? normalizeGoogleDateTime(item.start, true)
          : normalizeGoogleDateTime(item.end, true) || startStr;

        const priv = item.extendedProperties?.private || {};
        const rawSummary = String(item.summary || 'Rendez-vous Google');
        const rawDesc = String(item.description || '').trim();

        const { eventType, clientName, cleanSummary } = classifyExternalCalendarEvent(
          rawSummary,
          rawDesc,
          priv,
          item.transparency
        );

        return {
          id: priv.vincentEventId || `gcal_${item.id}`,
          googleEventId: item.id,
          summary: cleanSummary,
          description: rawDesc,
          start: startStr,
          end: endStr,
          clientId: priv.clientId || undefined,
          clientName,
          eventType,
          isGoogleEvent: true,
        };
      })
      .filter((ev: CalendarEvent) => Boolean(ev.start));
  },

  async fetchIcsFeedEvents(icsUrl: string): Promise<CalendarEvent[]> {
    if (!icsUrl || !icsUrl.trim()) return [];
    const res = await fetch('/api/telegram/gcal-ics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ icsUrl: icsUrl.trim() }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    return Array.isArray(data.events) ? data.events : [];
  },

  async createEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
    const body = {
      summary: formatGoogleSummaryForClinicEvent(event),
      description: event.description || '',
      start: { dateTime: new Date(event.start).toISOString() },
      end: { dateTime: new Date(event.end).toISOString() },
      extendedProperties: {
        private: {
          vincentEventId: event.id,
          eventType: event.eventType || 'appointment',
          clientId: event.clientId || '',
          clientName: event.clientName || '',
        },
      },
    };

    const res = await fetch(GCAL_BASE_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        cachedAccessToken = null;
        throw new Error('TOKEN_EXPIRED');
      }
      const errText = await res.text();
      throw new Error(`Failed to create Google Calendar event: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    return {
      ...event,
      googleEventId: data.id,
      isGoogleEvent: true,
    };
  },

  async updateEvent(
    accessToken: string,
    googleEventId: string,
    event: CalendarEvent
  ): Promise<CalendarEvent> {
    const body = {
      summary: formatGoogleSummaryForClinicEvent(event),
      description: event.description || '',
      start: { dateTime: new Date(event.start).toISOString() },
      end: { dateTime: new Date(event.end).toISOString() },
      extendedProperties: {
        private: {
          vincentEventId: event.id,
          eventType: event.eventType || 'appointment',
          clientId: event.clientId || '',
          clientName: event.clientName || '',
        },
      },
    };

    const res = await fetch(`${GCAL_BASE_URL}/${encodeURIComponent(googleEventId)}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        cachedAccessToken = null;
        throw new Error('TOKEN_EXPIRED');
      }
      const errText = await res.text();
      throw new Error(`Failed to update Google Calendar event: ${res.status} - ${errText}`);
    }

    const data = await res.json();
    return {
      ...event,
      googleEventId: data.id,
      isGoogleEvent: true,
    };
  },

  async deleteEvent(accessToken: string, googleEventId: string): Promise<boolean> {
    const res = await fetch(`${GCAL_BASE_URL}/${encodeURIComponent(googleEventId)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok && res.status !== 404 && res.status !== 410) {
      if (res.status === 401 || res.status === 403) {
        cachedAccessToken = null;
        throw new Error('TOKEN_EXPIRED');
      }
      throw new Error(`Failed to delete Google Calendar event: ${res.status}`);
    }

    return true;
  },
};
