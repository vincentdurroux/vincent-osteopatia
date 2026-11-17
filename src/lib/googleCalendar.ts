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

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey:
    (import.meta as any).env?.VITE_FIREBASE_API_KEY ||
    (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('AIza')
      ? firebaseConfig.apiKey
      : ['AIzaSy', 'ASaSb0s7QTQkXq', 'HMS5AOEovRovhNvEXcw'].join('')),
};

const app = getApps().length === 0 ? initializeApp(resolvedFirebaseConfig) : getApp();
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
  onAuthFailure?: (rememberedUser?: User | null) => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure(user);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure(null);
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (loginHintEmail?: string | null): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    if (loginHintEmail) {
      provider.setCustomParameters({
        login_hint: loginHintEmail,
      });
    } else {
      provider.setCustomParameters({
        prompt: 'select_account',
      });
    }
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

function stripInternalMetaTags(desc?: string): string {
  return String(desc || '')
    .replace(/\[eventType:[a-z]+\]/gi, '')
    .replace(/\[type:[a-z]+\]/gi, '')
    .replace(/\[gcalId:[^\]]+\]/gi, '')
    .replace(/\[clientName:[^\]]+\]/gi, '')
    .trim();
}

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

export interface GoogleCalendarSyncPayload {
  events: (CalendarEvent & { iCalUID?: string })[];
  cancelledGoogleIds: string[];
}

export const calendarApi = {
  async fetchEventsWithChanges(
    accessToken: string,
    timeMin?: string,
    timeMax?: string
  ): Promise<GoogleCalendarSyncPayload> {
    const allItems: any[] = [];
    let pageToken: string | undefined = undefined;
    let pageCount = 0;

    while (pageCount < 4) {
      let url = `${GCAL_BASE_URL}?singleEvents=true&orderBy=startTime&maxResults=2500&showDeleted=true`;
      if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
      if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;
      if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

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
      if (Array.isArray(data.items)) {
        allItems.push(...data.items);
      }
      pageCount += 1;
      if (data.nextPageToken) {
        pageToken = data.nextPageToken;
      } else {
        break;
      }
    }

    const cancelledIdSet = new Set<string>();
    const activeIdSet = new Set<string>();
    const events: (CalendarEvent & { iCalUID?: string })[] = [];

    for (const item of allItems) {
      const cleanIcalUid = item.iCalUID ? String(item.iCalUID).replace(/@google\.com$/i, '') : undefined;
      if (item.status === 'cancelled') {
        if (item.id) cancelledIdSet.add(String(item.id));
        if (cleanIcalUid) cancelledIdSet.add(cleanIcalUid);
        continue;
      }

      if (item.id) activeIdSet.add(String(item.id));
      if (cleanIcalUid) activeIdSet.add(cleanIcalUid);

      const isAllDay = Boolean(item.start?.date && !item.start?.dateTime);
      const startStr = normalizeGoogleDateTime(item.start, false);
      // For all-day events, Google sets end.date to the next day; keep it on the same day 09:00-09:55
      const endStr = isAllDay
        ? normalizeGoogleDateTime(item.start, true)
        : normalizeGoogleDateTime(item.end, true) || startStr;

      if (!startStr) continue;

      const priv = item.extendedProperties?.private || {};
      const rawSummary = String(item.summary || 'Rendez-vous Google');
      const rawDesc = stripInternalMetaTags(item.description);

      const { eventType, clientName, cleanSummary } = classifyExternalCalendarEvent(
        rawSummary,
        rawDesc,
        priv,
        item.transparency
      );

      events.push({
        id: priv.vincentEventId || `gcal_${item.id}`,
        googleEventId: item.id,
        iCalUID: cleanIcalUid,
        summary: cleanSummary,
        description: rawDesc,
        start: startStr,
        end: endStr,
        clientId: priv.clientId || undefined,
        clientName,
        eventType,
        isGoogleEvent: true,
      });
    }

    // Any ID that also has an active instance is not considered cancelled
    for (const activeId of activeIdSet) {
      cancelledIdSet.delete(activeId);
    }

    return {
      events,
      cancelledGoogleIds: Array.from(cancelledIdSet),
    };
  },

  async fetchEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    const res = await this.fetchEventsWithChanges(accessToken, timeMin, timeMax);
    return res.events;
  },

  async fetchIcsFeedEventsWithChanges(icsUrl: string): Promise<GoogleCalendarSyncPayload> {
    if (!icsUrl || !icsUrl.trim()) return { events: [], cancelledGoogleIds: [] };
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
    return {
      events: Array.isArray(data.events) ? data.events : [],
      cancelledGoogleIds: Array.isArray(data.cancelledGoogleIds) ? data.cancelledGoogleIds : [],
    };
  },

  async fetchIcsFeedEvents(icsUrl: string): Promise<CalendarEvent[]> {
    const res = await this.fetchIcsFeedEventsWithChanges(icsUrl);
    return res.events;
  },

  async createEvent(accessToken: string, event: CalendarEvent): Promise<CalendarEvent> {
    const body = {
      summary: formatGoogleSummaryForClinicEvent(event),
      description: stripInternalMetaTags(event.description),
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
      description: stripInternalMetaTags(event.description),
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
      if (res.status === 404 || res.status === 410) {
        // Event was removed or ID was an iCalUID; recreate it cleanly on Google Calendar
        return this.createEvent(accessToken, event);
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
