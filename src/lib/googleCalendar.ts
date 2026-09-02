import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CalendarEvent } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/calendar.readonly');
provider.setCustomParameters({
  prompt: 'select_account'
});

const STORAGE_KEY = 'vincent_gcal_token';

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
let isSigningIn = false;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google Popup and retrieve Access Token for Calendar API
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Google Auth.');
    }
    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, credential.accessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error during Google sign-in:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
};

export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// ==========================================
// GOOGLE CALENDAR API FUNCTIONS
// ==========================================
export const calendarApi = {
  async fetchEvents(accessToken: string, timeMin?: string, timeMax?: string): Promise<CalendarEvent[]> {
    try {
      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime';
      if (timeMin) url += `&timeMin=${encodeURIComponent(timeMin)}`;
      if (timeMax) url += `&timeMax=${encodeURIComponent(timeMax)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
          }
          cachedAccessToken = null;
          throw new Error('TOKEN_EXPIRED');
        }
        throw new Error(`Google Calendar API error: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.items) return [];

      return data.items.map((item: any) => {
        const startStr = item.start?.dateTime || item.start?.date || '';
        const endStr = item.end?.dateTime || item.end?.date || '';

        // Extract client name if possible from summary (e.g. "Marie Laurent - Séance de suivi")
        let clientName = '';
        const summary = item.summary || 'Sans titre';
        if (summary.includes(' - ')) {
          clientName = summary.split(' - ')[0].trim();
        }

        return {
          id: item.id,
          summary,
          description: item.description || '',
          start: startStr,
          end: endStr,
          clientName: clientName || undefined,
          isGoogleEvent: true,
        };
      });
    } catch (error) {
      console.error('Failed to fetch Google Calendar events:', error);
      throw error;
    }
  },

  async createEvent(accessToken: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    try {
      const body = {
        summary: event.summary,
        description: event.description || '',
        start: {
          dateTime: event.start,
        },
        end: {
          dateTime: event.end,
        },
      };

      const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
          }
          cachedAccessToken = null;
          throw new Error('TOKEN_EXPIRED');
        }
        const errText = await res.text();
        throw new Error(`Failed to create Google Calendar event: ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      return {
        id: data.id,
        summary: data.summary,
        description: data.description || '',
        start: data.start?.dateTime || data.start?.date || event.start,
        end: data.end?.dateTime || data.end?.date || event.end,
        isGoogleEvent: true,
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw error;
    }
  },

  async updateEvent(accessToken: string, eventId: string, event: Partial<Omit<CalendarEvent, 'id'>>): Promise<CalendarEvent> {
    try {
      const body: any = {};
      if (event.summary !== undefined) body.summary = event.summary;
      if (event.description !== undefined) body.description = event.description;
      if (event.start) body.start = { dateTime: event.start };
      if (event.end) body.end = { dateTime: event.end };

      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
          }
          cachedAccessToken = null;
          throw new Error('TOKEN_EXPIRED');
        }
        const errText = await res.text();
        throw new Error(`Failed to update Google Calendar event: ${res.statusText} - ${errText}`);
      }

      const data = await res.json();
      return {
        id: data.id,
        summary: data.summary,
        description: data.description || '',
        start: data.start?.dateTime || data.start?.date || (event.start as string),
        end: data.end?.dateTime || data.end?.date || (event.end as string),
        isGoogleEvent: true,
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  },

  async deleteEvent(accessToken: string, eventId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
          }
          cachedAccessToken = null;
          throw new Error('TOKEN_EXPIRED');
        }
        throw new Error(`Failed to delete Google Calendar event: ${res.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }
};
