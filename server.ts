import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { generateICSFeed } from "./src/lib/ical.js";
import { mockEvents } from "./src/lib/supabase.js";
import { CalendarEvent } from "./src/types";

// Default Supabase project credentials as fallback
const DEFAULT_SUPABASE_URL = 'https://lnlemynayesjduntoran.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubGVteW5heWVzamR1bnRvcmFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjczNDAyMDgsImV4cCI6MjA4MjkxNjIwOH0.3b9fFgeWTXen1fsOO0xMdM5Fd3PTxYs41UxlPapo0ZU';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// In-memory fallback store for server-side events
let serverEventsStore: CalendarEvent[] = [...mockEvents];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // CORS for API endpoints
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Endpoint for browser client to sync local events to server & Supabase
  app.post("/api/calendar/sync", async (req, res) => {
    try {
      const { events } = req.body || {};
      if (Array.isArray(events) && events.length > 0) {
        const existingMap = new Map(serverEventsStore.map(e => [e.id, e]));
        events.forEach((evt: any) => {
          if (evt && evt.id && evt.start) {
            existingMap.set(String(evt.id), {
              id: String(evt.id),
              summary: evt.summary || (evt.clientName ? `RDV ${evt.clientName}` : 'Consultation'),
              description: evt.description || '',
              start: evt.start,
              end: evt.end,
              clientId: evt.clientId,
              clientName: evt.clientName,
            });
          }
        });
        serverEventsStore = Array.from(existingMap.values());

        // Upsert events to Supabase asynchronously
        for (const evt of events) {
          if (!evt.id || !evt.start) continue;
          try {
            await supabase.from('calendar_events').upsert({
              id: evt.id,
              summary: evt.summary || 'Consultation',
              description: evt.description || '',
              start: evt.start,
              end: evt.end,
              client_id: evt.clientId || null,
              client_name: evt.clientName || '',
              patient_name: evt.clientName || '',
            });
          } catch {
            // ignore individual upsert errors
          }
        }
      }
      res.json({ status: 'ok', count: serverEventsStore.length });
    } catch (err) {
      console.error('Error syncing events:', err);
      res.status(500).json({ error: 'Sync failed' });
    }
  });

  // iCal Feed Endpoint for Google Calendar / Apple Calendar / Outlook subscription
  const handleCalendarFeed = async (_req: express.Request, res: express.Response) => {
    try {
      const eventsMap = new Map<string, CalendarEvent>();

      // 1. Add server-side store events first
      serverEventsStore.forEach(e => eventsMap.set(e.id, e));

      // 2. Query Supabase for remote events
      try {
        const { data, error } = await supabase
          .from('calendar_events')
          .select('*');

        if (!error && data && data.length > 0) {
          data.forEach((e: any) => {
            const mapped: CalendarEvent = {
              id: String(e.id),
              summary: e.summary || e.title || (e.client_name ? `RDV ${e.client_name}` : (e.patient_name ? `RDV ${e.patient_name}` : 'Consultation')),
              description: e.description || e.notes || '',
              start: e.start || e.start_time || '',
              end: e.end || e.end_time || '',
              clientId: e.clientId || e.client_id,
              clientName: e.clientName || e.client_name || e.patient_name,
            };
            eventsMap.set(mapped.id, mapped);
          });
        }
      } catch (err) {
        console.warn('Supabase query error in iCal feed:', err);
      }

      // 3. Fallback to default mockEvents if map is still empty
      if (eventsMap.size === 0) {
        mockEvents.forEach(e => eventsMap.set(e.id, e));
      }

      const eventsList = Array.from(eventsMap.values()).sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );

      const icalContent = generateICSFeed(eventsList, 'Agenda Cabinet Ostéopathie');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="agenda-cabinet.ics"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.send(icalContent);
    } catch (err) {
      console.error('Error generating calendar feed:', err);
      res.status(500).send('Error generating calendar feed');
    }
  };

  app.get('/api/calendar/feed.ics', handleCalendarFeed);
  app.get('/api/calendar/feed', handleCalendarFeed);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
