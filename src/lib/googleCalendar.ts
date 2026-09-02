import { supabase, isSupabaseConfigured } from './supabase';
import { CalendarEvent } from '../types';

export interface SupabaseGoogleUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    name?: string;
    [key: string]: any;
  };
}

const STORAGE_KEY = 'vincent_gcal_token';

let cachedAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;

// Initialize auth state listener via Supabase
export const initAuth = (
  onAuthSuccess?: (user: SupabaseGoogleUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (!supabase) {
    // If Supabase not configured or local mode, check cached token
    const token = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
    if (token && onAuthSuccess) {
      onAuthSuccess({ id: 'local-user', email: 'vincentosteopath1@gmail.com' }, token);
    } else if (onAuthFailure) {
      onAuthFailure();
    }
    return () => {};
  }

  // 1. Check initial session
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      const providerToken = session.provider_token || cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
      if (session.provider_token && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, session.provider_token);
        cachedAccessToken = session.provider_token;
      }
      if (providerToken && onAuthSuccess) {
        onAuthSuccess(session.user as SupabaseGoogleUser, providerToken);
      } else if (onAuthFailure) {
        onAuthFailure();
      }
    } else {
      const token = cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
      if (token && onAuthSuccess) {
        onAuthSuccess({ id: 'local-user', email: 'vincentosteopath1@gmail.com' }, token);
      } else if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });

  // 2. Listen for auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      const providerToken = session.provider_token || cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
      if (session.provider_token && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, session.provider_token);
        cachedAccessToken = session.provider_token;
      }
      if (providerToken && onAuthSuccess) {
        onAuthSuccess(session.user as SupabaseGoogleUser, providerToken);
      } else if (onAuthFailure) {
        onAuthFailure();
      }
    } else if (event === 'SIGNED_OUT') {
      cachedAccessToken = null;
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      if (onAuthFailure) onAuthFailure();
    }
  });

  return () => {
    subscription.unsubscribe();
  };
};

// Sign in with Google using Supabase OAuth
export const googleSignIn = async (): Promise<void> => {
  if (!supabase) {
    alert('Veuillez configurer Supabase dans Vercel (VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY).');
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      scopes: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly',
      redirectTo: typeof window !== 'undefined' ? window.location.href : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('Supabase Google OAuth error:', error);
    throw error;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken || (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null);
};

export const googleSignOut = async () => {
  if (supabase) {
    await supabase.auth.signOut();
  }
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
