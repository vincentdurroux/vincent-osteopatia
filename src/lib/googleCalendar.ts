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

let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we have a user but no cached token (e.g. page refresh),
        // we'll need them to sign in again to get a fresh token.
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
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
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Error during Google sign-in:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleSignOut = async () => {
  await auth.signOut();
  cachedAccessToken = null;
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

  async deleteEvent(accessToken: string, eventId: string): Promise<boolean> {
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to delete Google Calendar event: ${res.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }
};
