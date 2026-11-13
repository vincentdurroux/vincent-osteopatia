import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, FileText, TrendingUp, Plus, Search, Trash2, 
  LogOut, ArrowLeft, Check, RefreshCw, Calendar as CalendarIcon, 
  CreditCard, Shield, Clock, MapPin, Phone, Mail, FileCheck, Printer,
  ChevronRight, Pencil, ChevronLeft, ChevronDown, LayoutGrid, List, ArrowRight,
  Copy, CheckCircle2, XCircle, AlertTriangle, Database, Server, UserPlus, User,
  Tag, BadgePercent, Percent, Sparkles, IdCard, X, Columns3, Lock, Coffee, Briefcase, Bookmark, Pin, StickyNote,
  ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, Info, Star, Cloud, Send, Bell
} from 'lucide-react';
import { Client, ClientNote, Invoice, CalendarEvent, EventType, GoogleReview, ClinicalNoteDraftItem } from '../../types';
import { api, supabase, isSupabaseConfigured, SUPABASE_SQL_SETUP, capitalizeFirstName, sortInvoicesByDate, normalizeInvoiceDescription } from '../../lib/supabase';
import SpineLogo from '../SpineLogo';
import TelegramSettingsPanel from './TelegramSettingsPanel';
import { useTranslation } from '../../App';
import { Language, translations } from '../../translations';

// Recharts imports for beautiful financial analytics
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';

interface AdminDashboardProps {
  onClose: () => void;
}

const getDefaultAppointmentTitle = (_language?: string) => {
  return "Sesión de osteopatía";
};

const getDefaultAppointmentDescription = (_language?: string) => {
  return "";
};

const getMonthsList = (lang: string) => {
  if (lang === 'es') {
    return ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  }
  if (lang === 'en') {
    return ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  }
  return ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
};

const formatSpanishDateStr = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

const formatRecapPeriodTitle = (
  recap: {
    periodType: 'monthly' | 'annual' | 'custom';
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  },
  lang: 'fr' | 'es' | 'en' = 'fr'
) => {
  const monthsByLang = {
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };

  const months = monthsByLang[lang] || monthsByLang.fr;
  const year = recap.year || new Date().getFullYear();

  if (recap.periodType === 'annual') {
    return lang === 'fr' ? `Bilan Annuel ${year}` : lang === 'es' ? `Balance Anual ${year}` : `Annual Summary ${year}`;
  }

  if (recap.periodType === 'custom') {
    const start = recap.startDate ? formatSpanishDateStr(recap.startDate) : '';
    const end = recap.endDate ? formatSpanishDateStr(recap.endDate) : '';
    if (start && end) {
      if (start === end) {
        return lang === 'fr' ? `Bilan du ${start}` : lang === 'es' ? `Balance del ${start}` : `Summary of ${start}`;
      }
      return lang === 'fr' ? `Bilan du ${start} au ${end}` : lang === 'es' ? `Balance del ${start} al ${end}` : `Summary from ${start} to ${end}`;
    }
    return lang === 'fr' ? 'Bilan - Période personnalisée' : lang === 'es' ? 'Balance - Período personalizado' : 'Summary - Custom period';
  }

  const mIdx = typeof recap.month === 'number' && recap.month >= 0 && recap.month <= 11 
    ? recap.month 
    : new Date().getMonth();

  return lang === 'fr' ? `Bilan Mensuel - ${months[mIdx]} ${year}` : lang === 'es' ? `Balance Mensual - ${months[mIdx]} ${year}` : `Monthly Summary - ${months[mIdx]} ${year}`;
};

const formatRecapSubtitle = (
  recap: {
    periodType: 'monthly' | 'annual' | 'custom';
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
  },
  lang: 'fr' | 'es' | 'en' = 'fr'
) => {
  const monthsByLang = {
    fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
    es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };

  const months = monthsByLang[lang] || monthsByLang.fr;
  const year = recap.year || new Date().getFullYear();

  if (recap.periodType === 'annual') {
    return lang === 'fr' ? `Année ${year}` : lang === 'es' ? `Año ${year}` : `Year ${year}`;
  }

  if (recap.periodType === 'custom') {
    const start = recap.startDate ? formatSpanishDateStr(recap.startDate) : '';
    const end = recap.endDate ? formatSpanishDateStr(recap.endDate) : '';
    if (start && end) {
      if (start === end) return lang === 'fr' ? `Date : ${start}` : lang === 'es' ? `Fecha: ${start}` : `Date: ${start}`;
      return lang === 'fr' ? `Du ${start} au ${end}` : lang === 'es' ? `Del ${start} al ${end}` : `From ${start} to ${end}`;
    }
    return lang === 'fr' ? 'Période personnalisée' : lang === 'es' ? 'Período personalizado' : 'Custom period';
  }

  const mIdx = typeof recap.month === 'number' && recap.month >= 0 && recap.month <= 11 
    ? recap.month 
    : new Date().getMonth();

  return `${months[mIdx]} ${year}`;
};

type TabType = 'overview' | 'clients' | 'calendar' | 'billing' | 'reviews' | 'telegram';

const DEFAULT_PATIENT_FORM = {
  firstName: '',
  lastName: '',
  dni: '',
  email: '',
  phone: '',
  birthDate: '',
  address: '',
  
  bonoType: '',
  defaultDiscount: 10,
  bonoSessionsRemaining: 0,
};

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const rawTrans = useTranslation();
  const lang = rawTrans.lang;
  const setLang = rawTrans.setLang;
  const dict = rawTrans.t;
  const t: any = (pathOrKey: string) => {
    if (typeof pathOrKey !== 'string') return '';
    const parts = pathOrKey.split('.');
    let curr: any = dict;
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        return pathOrKey;
      }
    }
    return typeof curr === 'string' ? curr : pathOrKey;
  };
  Object.assign(t, dict);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [allNotes, setAllNotes] = useState<ClientNote[]>([]);
  
  // Calendar View Mode: 'month' (Month grid), 'week' (Weekly columns), 'day' (Daily timeline)
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);

  // Live clock: tick every 15 seconds so appointment statuses (Upcoming -> Ongoing -> Past) transition in real-time
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(clockInterval);
  }, []);

  // Morning notifications digest status badge
  const [telegramStatus, setTelegramStatus] = useState<{ enabled: boolean; configured: boolean; sendTime?: string }>({
    enabled: true,
    configured: true,
  });

  useEffect(() => {
    fetch('/api/telegram/config')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setTelegramStatus({
            enabled: Boolean(data.enabled),
            configured: Boolean(data.ntfyTopic || (data.hasBotToken && data.chatId)),
            sendTime: data.sendTime,
          });
        }
      })
      .catch(() => {});
  }, []);
  
  // Google Reviews management state
  const [customReviews, setCustomReviews] = useState<GoogleReview[]>([]);
  const [isAddReviewModalOpen, setIsAddReviewModalOpen] = useState(false);
  const [editingReviewIndex, setEditingReviewIndex] = useState<number | null>(null);
  const [reviewForm, setReviewForm] = useState({
    author: '',
    initials: '',
    date: new Date().toISOString().split('T')[0],
    rating: 5,
    text: '',
  });

  const loadReviewsFromAPI = async () => {
    try {
      const data = await api.getGoogleReviews();
      setCustomReviews(data || []);
    } catch (err) {
      console.warn('Error loading reviews from Supabase:', err);
    }
  };

  useEffect(() => {
    loadReviewsFromAPI();
    runDiagnostics();
  }, []);

  // Migration logic: if we have local reviews but Supabase is configured, push them up
  useEffect(() => {
    const migrateLocalReviews = async () => {
      if (typeof window === 'undefined' || !isSupabaseConfigured) return;
      
      const stored = localStorage.getItem('vincent_custom_google_reviews');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Check if remote is empty
            const remote = await api.getGoogleReviews();
            if (remote.length === 0) {
              console.log('Migrating local reviews to Supabase...');
              for (const r of parsed) {
                await api.createGoogleReview(r);
              }
              // Clear local after successful migration
              localStorage.removeItem('vincent_custom_google_reviews');
              loadReviewsFromAPI();
              window.dispatchEvent(new Event('vincent_google_reviews_updated'));
            }
          }
        } catch (e) {
          console.warn('Migration error:', e);
        }
      }
    };
    
    migrateLocalReviews();
  }, []);

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.author.trim() || !reviewForm.text.trim()) return;

    const authorClean = reviewForm.author.trim();
    const initialsClean = reviewForm.initials.trim() || authorClean.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    const dateTimestamp = reviewForm.date ? new Date(reviewForm.date).getTime() : Date.now();
    
    const reviewData: any = {
      author: authorClean,
      initials: initialsClean,
      date: dateTimestamp,
      rating: Number(reviewForm.rating) || 5,
      text: reviewForm.text.trim(),
    };

    try {
      const currentEditing = editingReviewIndex !== null ? customReviews[editingReviewIndex] : null;
      if (currentEditing?.id) {
        reviewData.id = currentEditing.id;
      }
      
      await api.createGoogleReview(reviewData);
      await loadReviewsFromAPI();
      
      window.dispatchEvent(new Event('vincent_google_reviews_updated'));
      setIsAddReviewModalOpen(false);
      setEditingReviewIndex(null);
      setReviewForm({ author: '', initials: '', date: new Date().toISOString().split('T')[0], rating: 5, text: '' });
    } catch (err) {
      console.error('Error saving review:', err);
    }
  };

  const handleDeleteReview = (index: number) => {
    const target = customReviews[index];
    if (!target?.id) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Delete Google review',
      message: 'Are you sure you want to delete this Google review? It will be removed from your website homepage.',
      confirmText: 'Delete review',
      cancelText: 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await api.deleteGoogleReview(target.id!);
          await loadReviewsFromAPI();
          window.dispatchEvent(new Event('vincent_google_reviews_updated'));
        } catch (err) {
          console.error('Error deleting review:', err);
        }
      },
    });
  };



  // Ref to main scroll container to scroll to top when changing tabs
  const mainContentRef = useRef<HTMLElement | null>(null);

  // Modals & Selected states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab, selectedClient]);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms states
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({ ...DEFAULT_PATIENT_FORM });
  
  const [newNote, setNewNote] = useState({
    anamnese: '',
    treatment: '',
    category: 'treatment' as ClientNote['category'],
    date: new Date().toISOString().split('T')[0],
    motif: '',
    eventId: '',
  });

  // Persistent Clinical Note Draft Storage (saved in localStorage across page leaves/refreshes, associated with client + session/date/eventId)
  const NOTE_DRAFTS_STORAGE_KEY = 'vincent_osteo_note_drafts_v3';

  interface ClinicalNoteDraftItem {
    clientId: string;
    clientName?: string;
    anamnese: string;
    treatment: string;
    category: ClientNote['category'];
    date: string;
    motif: string;
    eventId?: string;
    updatedAt: number;
  }

  const getStoredDrafts = (): Record<string, ClinicalNoteDraftItem> => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(NOTE_DRAFTS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const [draftsMap, setDraftsMap] = useState<Record<string, ClinicalNoteDraftItem>>(getStoredDrafts);

  // Robust draft retriever for a client with smart matching across general and appointment-specific drafts
  const getClientDraft = (clientId: string, preferredEventId?: string): { key: string; draft: ClinicalNoteDraftItem } | null => {
    if (!clientId) return null;
    const stored = getStoredDrafts();

    // 1. Exact match with preferredEventId
    if (preferredEventId) {
      const candidateKeys = [
        `${clientId}::evt_${preferredEventId}`,
        `${clientId}_evt_${preferredEventId}`,
      ];
      for (const k of candidateKeys) {
        if (stored[k] && (stored[k].anamnese?.trim() || stored[k].treatment?.trim() || stored[k].motif?.trim())) {
          return { key: k, draft: stored[k] };
        }
      }
      for (const [k, d] of Object.entries(stored)) {
        if ((d.clientId === clientId || k.startsWith(clientId)) && d.eventId === preferredEventId && (d.anamnese?.trim() || d.treatment?.trim() || d.motif?.trim())) {
          return { key: k, draft: d };
        }
      }
    }

    // 2. Direct general draft keys
    const generalKeys = [
      `${clientId}::general`,
      `${clientId}::draft`,
      `${clientId}_date_${new Date().toISOString().split('T')[0]}`,
    ];
    for (const k of generalKeys) {
      if (stored[k] && (stored[k].anamnese?.trim() || stored[k].treatment?.trim() || stored[k].motif?.trim())) {
        return { key: k, draft: stored[k] };
      }
    }

    // 3. Any non-empty draft belonging to this client (latest updatedAt first)
    const clientCandidates = Object.entries(stored).filter(([k, d]) => {
      const matchesClient = d.clientId === clientId || k.startsWith(`${clientId}::`) || k.startsWith(`${clientId}_`);
      const hasContent = Boolean(d.anamnese?.trim() || d.treatment?.trim() || d.motif?.trim());
      return matchesClient && hasContent;
    });

    if (clientCandidates.length > 0) {
      clientCandidates.sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));
      return { key: clientCandidates[0][0], draft: clientCandidates[0][1] };
    }

    return null;
  };

  const hasClientDraft = (clientId?: string, eventId?: string): boolean => {
    if (!clientId) return false;
    return Boolean(getClientDraft(clientId, eventId));
  };

  const allActiveDrafts = useMemo(() => {
    const drafts = getStoredDrafts();
    return Object.entries(drafts).map(([key, draft]) => {
      const clientId = draft.clientId || key.split('::')[0].split('_')[0];
      const client = clients.find(c => c.id === clientId);
      return {
        key,
        clientId,
        client,
        ...draft
      };
    }).filter(d => Boolean(d.anamnese?.trim() || d.treatment?.trim() || d.motif?.trim()));
  }, [draftsMap, clients]);

  const [activeDraftNotice, setActiveDraftNotice] = useState<boolean>(false);
  const prevSessionRef = useRef<{ clientId: string | null; eventId: string; date: string }>({
    clientId: null,
    eventId: '',
    date: '',
  });
  const newNoteRef = useRef(newNote);

  // Keep newNoteRef up-to-date with state changes
  useEffect(() => {
    newNoteRef.current = newNote;
  }, [newNote]);

  // Sync remote drafts from Supabase on mount and keep local/remote in sync across devices
  useEffect(() => {
    let isMounted = true;
    const syncRemoteDrafts = async () => {
      if (!isSupabaseConfigured) return;
      try {
        const remote = await api.getRemoteDrafts();
        if (!isMounted || !remote) return;
        const local = getStoredDrafts();
        let updated = false;

        Object.entries(remote).forEach(([key, remoteDraft]) => {
          const localDraft = local[key];
          if (!localDraft || (remoteDraft.updatedAt && remoteDraft.updatedAt > (localDraft.updatedAt || 0))) {
            local[key] = remoteDraft;
            updated = true;
          }
        });

        if (updated) {
          localStorage.setItem(NOTE_DRAFTS_STORAGE_KEY, JSON.stringify(local));
          setDraftsMap({ ...local });

          // If current selected client has a draft, restore into form if empty
          if (selectedClient?.id) {
            const currentClientDraft = getClientDraft(selectedClient.id, newNoteRef.current.eventId);
            if (currentClientDraft && (!newNoteRef.current.anamnese.trim() && !newNoteRef.current.treatment.trim() && !newNoteRef.current.motif.trim())) {
              setNewNote({
                anamnese: currentClientDraft.draft.anamnese || '',
                treatment: currentClientDraft.draft.treatment || '',
                category: currentClientDraft.draft.category || 'treatment',
                date: currentClientDraft.draft.date || new Date().toISOString().split('T')[0],
                motif: currentClientDraft.draft.motif || '',
                eventId: currentClientDraft.draft.eventId || '',
              });
              setActiveDraftNotice(true);
            }
          }
        }
      } catch (e) {
        console.warn('Failed to sync remote drafts:', e);
      }
    };

    syncRemoteDrafts();
    return () => {
      isMounted = false;
    };
  }, [isSupabaseConfigured, selectedClient?.id]);

  const saveDraftToStorage = (
    clientId: string,
    arg2?: string | Partial<typeof newNote> | null,
    arg3?: string | Partial<typeof newNote> | null,
    arg4?: Partial<typeof newNote> | null
  ) => {
    if (typeof window === 'undefined' || !clientId) return;
    let eventId: string | undefined = newNoteRef.current.eventId;
    let date: string | undefined = newNoteRef.current.date;
    let draft: Partial<typeof newNote> | null = null;

    if (arguments.length === 2 && typeof arg2 === 'object') {
      draft = arg2 as Partial<typeof newNote> | null;
      eventId = draft?.eventId || eventId;
      date = draft?.date || date;
    } else if (arguments.length >= 4) {
      eventId = arg2 as string | undefined;
      date = arg3 as string | undefined;
      draft = arg4 as Partial<typeof newNote> | null;
    } else if (typeof arg3 === 'object') {
      eventId = arg2 as string | undefined;
      draft = arg3 as Partial<typeof newNote> | null;
      date = draft?.date || date;
    } else {
      draft = arg2 as Partial<typeof newNote> | null;
    }

    try {
      const current = getStoredDrafts();
      const primaryKey = `${clientId}::${eventId ? `evt_${eventId}` : 'general'}`;
      const hasContent = Boolean(draft && (draft.anamnese?.trim() || draft.treatment?.trim() || draft.motif?.trim()));

      if (!hasContent) {
        // Clear all drafts for this client locally and remotely
        let changed = false;
        Object.keys(current).forEach(k => {
          if (k.startsWith(`${clientId}::`) || k.startsWith(`${clientId}_`) || current[k].clientId === clientId) {
            delete current[k];
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(NOTE_DRAFTS_STORAGE_KEY, JSON.stringify(current));
          setDraftsMap({ ...current });
        }
        api.deleteRemoteDraft(clientId, eventId);
      } else {
        const client = clients.find(c => c.id === clientId);
        const draftItem: ClinicalNoteDraftItem = {
          clientId,
          clientName: client?.name || '',
          anamnese: draft?.anamnese || '',
          treatment: draft?.treatment || '',
          category: draft?.category || 'treatment',
          date: draft?.date || date || new Date().toISOString().split('T')[0],
          motif: draft?.motif || '',
          eventId: draft?.eventId || eventId || '',
          updatedAt: Date.now(),
        };
        current[primaryKey] = draftItem;
        localStorage.setItem(NOTE_DRAFTS_STORAGE_KEY, JSON.stringify(current));
        setDraftsMap({ ...current });
        api.saveRemoteDraft(draftItem);
      }
    } catch (e) {
      console.error('Failed to persist draft:', e);
    }
  };

  // Immediate field update + automatic draft saving
  const handleUpdateNoteField = (fields: Partial<typeof newNote>) => {
    setNewNote(prev => {
      const updated = { ...prev, ...fields };
      newNoteRef.current = updated;
      if (selectedClient?.id) {
        saveDraftToStorage(selectedClient.id, updated);
        if (updated.anamnese.trim() || updated.treatment.trim() || updated.motif.trim()) {
          setActiveDraftNotice(true);
        }
      }
      return updated;
    });
  };

  // Discard draft for current session
  const handleDiscardDraft = () => {
    if (!selectedClient?.id) return;
    saveDraftToStorage(selectedClient.id, null);
    setNewNote({
      anamnese: '',
      treatment: '',
      category: 'treatment',
      date: new Date().toISOString().split('T')[0],
      motif: '',
      eventId: '',
    });
    setActiveDraftNotice(false);
  };

  // Save draft on window beforeunload or pagehide
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedClient?.id && (newNoteRef.current.anamnese.trim() || newNoteRef.current.treatment.trim() || newNoteRef.current.motif.trim())) {
        saveDraftToStorage(selectedClient.id, newNoteRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      if (selectedClient?.id && (newNoteRef.current.anamnese.trim() || newNoteRef.current.treatment.trim() || newNoteRef.current.motif.trim())) {
        saveDraftToStorage(selectedClient.id, newNoteRef.current);
      }
    };
  }, [selectedClient?.id]);

  // Synchronize drafts when client selection changes
  useEffect(() => {
    const prev = prevSessionRef.current;
    const currClientId = selectedClient?.id || null;

    // 1. Save draft of previous client if it had uncommitted text
    if (prev.clientId && prev.clientId !== currClientId) {
      if (newNoteRef.current.anamnese.trim() || newNoteRef.current.treatment.trim() || newNoteRef.current.motif.trim()) {
        saveDraftToStorage(prev.clientId, newNoteRef.current);
      }
    }

    // 2. Load draft of current client from localStorage
    if (currClientId) {
      if (prev.clientId !== currClientId) {
        const found = getClientDraft(currClientId);
        if (found) {
          setNewNote({
            anamnese: found.draft.anamnese || '',
            treatment: found.draft.treatment || '',
            category: found.draft.category || 'treatment',
            date: found.draft.date || new Date().toISOString().split('T')[0],
            motif: found.draft.motif || '',
            eventId: found.draft.eventId || '',
          });
          setActiveDraftNotice(true);
        } else {
          setNewNote({
            anamnese: '',
            treatment: '',
            category: 'treatment',
            date: new Date().toISOString().split('T')[0],
            motif: '',
            eventId: '',
          });
          setActiveDraftNotice(false);
        }
      }
    } else {
      setNewNote({
        anamnese: '',
        treatment: '',
        category: 'treatment',
        date: new Date().toISOString().split('T')[0],
        motif: '',
        eventId: '',
      });
      setActiveDraftNotice(false);
    }

    prevSessionRef.current = { clientId: currClientId, eventId: newNoteRef.current.eventId, date: newNoteRef.current.date };
  }, [selectedClient?.id]);
  
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newInvoiceBillingPlan, setNewInvoiceBillingPlan] = useState<'single' | 'bono3' | 'bono5' | 'deduct_bono' | 'custom'>('single');
  const [newInvoiceIncludeToday, setNewInvoiceIncludeToday] = useState<boolean>(true);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    amount: 60,
    originalAmount: 60,
    discountAmount: 0,
    discountType: 'none' as 'none' | 'bono' | 'custom',
    discountLabel: '',
    status: 'paid' as 'paid' | 'pending',
    paymentMethod: 'card' as Invoice['paymentMethod'],
    description: "Sesión de osteopatía",
    language: 'es' as 'fr' | 'en' | 'es',
    quantity: 1,
    date: new Date().toISOString().split('T')[0],
    paymentDate: new Date().toISOString().split('T')[0],
    eventId: '',
  });
  
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [selectedDayModalDate, setSelectedDayModalDate] = useState<string | null>(null);
  const [selectedAppointmentForDetails, setSelectedAppointmentForDetails] = useState<CalendarEvent | null>(null);
  const [isInlineNewPatient, setIsInlineNewPatient] = useState(false);
  const [inlinePatient, setInlinePatient] = useState({ ...DEFAULT_PATIENT_FORM });
  const [returnToAppointmentAfterClientCreate, setReturnToAppointmentAfterClientCreate] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    clientId: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    eventType: EventType;
  }>({
    clientId: '',
    title: "Sesión de osteopatía",
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    description: '',
    eventType: 'appointment',
  });

  // Keep appointment title set to Spanish default if empty
  useEffect(() => {
    setNewEvent(prev => ({
      ...prev,
      title: prev.title || (prev.eventType === 'appointment' ? "Sesión de osteopatía" : (lang === 'fr' ? "Créneau bloqué / Autre" : "Horario bloqueado")),
    }));
  }, [lang]);

  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<{
    id: string;
    summary: string;
    date: string;
    startTime: string;
    endTime: string;
    description: string;
    clientId?: string;
    clientName?: string;
    eventType?: EventType;
  } | null>(null);

  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const recapRef = useRef<HTMLDivElement>(null);
  const weekScrollContainerRef = useRef<HTMLDivElement>(null);

  const centerOnTodayInWeekView = useCallback((smooth = true) => {
    if (calendarViewMode !== 'week') return;
    const container = weekScrollContainerRef.current;
    if (!container) return;

    const todayEl = container.querySelector<HTMLElement>('[data-is-today="true"]');
    if (!todayEl) return;

    const stickyAxisWidth = 64;
    const containerRect = container.getBoundingClientRect();
    const todayRect = todayEl.getBoundingClientRect();

    const currentRelLeft = todayRect.left - containerRect.left;
    const todayCenterRel = currentRelLeft + (todayRect.width / 2);
    const visibleCenter = (containerRect.width + stickyAxisWidth) / 2;
    const diff = todayCenterRel - visibleCenter;
    const targetScrollLeft = Math.max(0, container.scrollLeft + diff);

    container.scrollTo({
      left: targetScrollLeft,
      behavior: smooth ? 'smooth' : 'auto'
    });
  }, [calendarViewMode]);

  // Center horizontally on Today whenever the calendar tab opens or week view is activated
  useEffect(() => {
    if (activeTab === 'calendar' && calendarViewMode === 'week') {
      const t1 = setTimeout(() => {
        centerOnTodayInWeekView(false);
      }, 50);
      const t2 = setTimeout(() => {
        centerOnTodayInWeekView(true);
      }, 220);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [activeTab, calendarViewMode, currentCalendarDate, centerOnTodayInWeekView]);

  // Re-center on window resize if viewing calendar in week mode
  useEffect(() => {
    if (activeTab !== 'calendar' || calendarViewMode !== 'week') return;
    const handleResize = () => {
      centerOnTodayInWeekView(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab, calendarViewMode, centerOnTodayInWeekView]);

  // Patient list scroll detection
  const patientListRef = useRef<HTMLDivElement>(null);
  const [canScrollPatientsDown, setCanScrollPatientsDown] = useState(false);
  const [isScrolledPatients, setIsScrolledPatients] = useState(false);

  const checkPatientScroll = () => {
    const el = patientListRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight - el.scrollTop - el.clientHeight > 15;
    setCanScrollPatientsDown(hasMore);
    setIsScrolledPatients(el.scrollTop > 8);
  };

  const handleScrollPatientsDown = () => {
    if (patientListRef.current) {
      patientListRef.current.scrollBy({ top: 220, behavior: 'smooth' });
    }
  };

  // Edit states
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Profile quick note state (petite note / remarque sur le profil patient)
  const [isEditingProfileNote, setIsEditingProfileNote] = useState(false);
  const [profileNoteInput, setProfileNoteInput] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteAnamnese, setEditingNoteAnamnese] = useState('');
  const [editingNoteTreatment, setEditingNoteTreatment] = useState('');
  const [editingNoteCategory, setEditingNoteCategory] = useState<ClientNote['category']>('treatment');
  const [editingNoteMotif, setEditingNoteMotif] = useState('');
  const [editingNoteDate, setEditingNoteDate] = useState('');

  // Inline invoice creation states for patient notes
  const [creatingInvoiceForNoteId, setCreatingInvoiceForNoteId] = useState<string | null>(null);
  const [inlineBillingPlan, setInlineBillingPlan] = useState<'single' | 'bono3' | 'bono5' | 'deduct_bono' | 'custom'>('single');
  const [inlineIncludeToday, setInlineIncludeToday] = useState<boolean>(true);
  const [inlineInvoiceAmount, setInlineInvoiceAmount] = useState<number>(60);
  const [inlineInvoiceOriginalAmount, setInlineInvoiceOriginalAmount] = useState<number>(60);
  const [inlineInvoiceDiscountAmount, setInlineInvoiceDiscountAmount] = useState<number>(0);
  const [inlineInvoiceDiscountType, setInlineInvoiceDiscountType] = useState<'none' | 'bono' | 'custom'>('none');
  const [inlineInvoiceDiscountLabel, setInlineInvoiceDiscountLabel] = useState<string>('');
  const [inlineInvoicePaymentMethod, setInlineInvoicePaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card');
  const [inlineInvoiceStatus, setInlineInvoiceStatus] = useState<'paid' | 'pending'>('paid');

  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Billing table default date sorting & filtering state
  const [invoiceSortField, setInvoiceSortField] = useState<'date' | 'invoiceNumber' | 'clientName' | 'amount' | 'status'>('date');
  const [invoiceSortAsc, setInvoiceSortAsc] = useState<boolean>(false); // default: false = date descending (most recent first)
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState<string>('');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [invoiceMethodFilter, setInvoiceMethodFilter] = useState<'all' | 'card' | 'cash' | 'transfer'>('all');
  const [showBonoRedemptions, setShowBonoRedemptions] = useState<boolean>(false);

  // Accounting recap states
  const [recapPeriodType, setRecapPeriodType] = useState<'monthly' | 'annual' | 'custom'>('monthly');
  const [recapYear, setRecapYear] = useState<number>(new Date().getFullYear());
  const [recapMonth, setRecapMonth] = useState<number>(new Date().getMonth());
  const [recapStartDate, setRecapStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [recapEndDate, setRecapEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedRecapForPrint, setSelectedRecapForPrint] = useState<{
    periodType: 'monthly' | 'annual' | 'custom';
    year?: number;
    month?: number;
    startDate?: string;
    endDate?: string;
    invoices: Invoice[];
    total: number;
    breakdown: { card: number; cash: number; transfer: number };
    count: number;
  } | null>(null);

  // Custom Confirmation Dialog State (Works reliably across iframes, Google AI Studio, and deployed sites)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
    isLoading?: boolean;
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Supabase Diagnostics & Synchronization states
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [tableDiagnostics, setTableDiagnostics] = useState<{
    isConfigured: boolean;
    clients: boolean;
    clientNotes: boolean;
    invoices: boolean;
    calendarEvents: boolean;
    googleReviews: boolean;
    errorSummary?: string;
  } | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Run diagnostics for Supabase tables
  const runDiagnostics = async () => {
    setIsDiagnosing(true);
    setSyncMessage(null);
    try {
      const res = await api.checkTablesStatus();
      setTableDiagnostics(res);
    } catch (err: any) {
      setTableDiagnostics({
        isConfigured: false,
        clients: false,
        clientNotes: false,
        invoices: false,
        calendarEvents: false,
        googleReviews: false,
        errorSummary: err.message,
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Sync Local data to Supabase
  const handleSyncAllToSupabase = async () => {
    setIsSyncingAll(true);
    setSyncMessage(null);
    try {
      const res = await api.syncAllToSupabase();
      if (res.success) {
        setSyncMessage({ type: 'success', text: res.message });
        await loadData();
        await runDiagnostics();
      } else {
        setSyncMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      setSyncMessage({ type: 'error', text: err.message || 'Erreur inconnue' });
    } finally {
      setIsSyncingAll(false);
    }
  };

  // Copy SQL script to clipboard
  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  // Load baseline app data
  const loadData = async () => {
    try {
      setIsSyncing(true);
      const [allClients, allInvoices, allEvents, fetchedNotes] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
        api.getLocalEvents(),
        api.getAllNotes(),
      ]);
      
      const dedupe = <T extends { id?: string }>(items: T[]): T[] => {
        const seen = new Set<string>();
        return items.filter((item, idx) => {
          const key = item.id ? String(item.id).trim() : `idx-${idx}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      };

      const cleanClients = dedupe(allClients);
      const cleanEvents = dedupe(allEvents);
      const cleanInvoices = dedupe(allInvoices);
      const cleanNotes = dedupe(fetchedNotes);
      
      const clientMap = new Map(cleanClients.map(c => [c.id, c.name]));
      const enrichedEvents = cleanEvents.map(ev => {
        let name = ev.clientName;
        if (!name && ev.clientId && clientMap.has(ev.clientId)) {
          name = clientMap.get(ev.clientId);
        }
        return {
          ...ev,
          clientName: name,
        };
      });

      setClients(cleanClients);
      setAllNotes(cleanNotes);
      const enrichedInvoices = cleanInvoices.map(inv => {
        let name = inv.clientName;
        if ((!name || name.trim() === '') && inv.clientId && clientMap.has(inv.clientId)) {
          name = clientMap.get(inv.clientId)!;
        }
        return {
          ...inv,
          clientName: name,
        };
      });
      setInvoices(sortInvoicesByDate(enrichedInvoices, false));
      setEvents(enrichedEvents);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    if (!supabase) return;

    console.log('Setting up Realtime subscription...');
    const channel = supabase.channel('calendar-sync')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Realtime update received:', payload);
        loadData();
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      console.log('Removing Realtime subscription...');
      supabase.removeChannel(channel);
    };
  }, []);

  // Memoized sorted and filtered invoices for the billing log
  // Default sort is strictly by date descending (newest first)
  const displayedInvoices = useMemo(() => {
    let baseList = [...invoices];

    // Collect all unique keys of 0 € redemption entries already existing in invoices
    const existingRedemptionKeys = new Set<string>();
    baseList.forEach(inv => {
      const isRed = Boolean(
        inv.amount === 0 &&
        (inv.isBonoRedemption ||
         inv.paymentMethod === 'not_applicable' ||
         inv.paymentMethod === 'bono' ||
         (formatLocalizedBonoText(inv.description, lang) && (formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('décomptée') || formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('decomptée'))))
      );
      if (isRed) {
        const clientKey = inv.clientId || inv.clientName?.trim().toLowerCase() || '';
        const dateKey = inv.date ? inv.date.split('T')[0] : '';
        if (clientKey && dateKey) {
          existingRedemptionKeys.add(`${clientKey}_${dateKey}`);
        }
      }
    });

    // Collect all dates that have a real paid invoice (> 0) for each client (e.g. Bono purchase of 160 € or 250 €)
    const clientPaidDates = new Set<string>();
    baseList.forEach(inv => {
      if (inv.amount > 0) {
        const clientKey = inv.clientId || inv.clientName?.trim().toLowerCase() || '';
        const dateKey = inv.date ? inv.date.split('T')[0] : '';
        if (clientKey && dateKey) {
          clientPaidDates.add(`${clientKey}_${dateKey}`);
        }
      }
    });

    // Synthesize entries for client notes marked with isBonoRedeemed (0 € redemptions without payment)
    allNotes.forEach(note => {
      if (!note.isBonoRedeemed) return;
      const noteDate = note.date ? note.date.split('T')[0] : '';
      const client = clients.find(c => c.id === note.clientId);
      const clientKey = note.clientId || client?.name?.trim().toLowerCase() || '';
      const key = `${clientKey}_${noteDate}`;
      // Do not synthesize if already in existing redemption invoices OR if a paid invoice exists on that date
      if (noteDate && clientKey && !existingRedemptionKeys.has(key) && !clientPaidDates.has(key)) {
        existingRedemptionKeys.add(key);
        baseList.push({
          id: `syn-note-bono-${note.id}`,
          clientId: note.clientId,
          clientName: client?.name || note.clientName || 'Patient',
          amount: 0,
          originalAmount: 60,
          discountAmount: 60,
          discountType: 'bono',
          discountLabel: `Décompté sur ${note.bonoType || client?.bonoType || 'Bono'}`,
          status: 'paid',
          paymentMethod: 'not_applicable',
          date: noteDate,
          paymentDate: noteDate,
          description: `Séance décomptée du Bono (${note.bonoType || client?.bonoType || 'Bono'})`,
          language: 'es',
          quantity: 1,
          isBonoRedemption: true,
          noteId: note.id,
          eventId: note.eventId,
        });
      }
    });

    // Synthesize entries for client.bonoRedeemedDates (0 € redemptions without payment)
    clients.forEach(c => {
      if (!c.hasBono || !c.bonoRedeemedDates || c.bonoRedeemedDates.length === 0) return;
      c.bonoRedeemedDates.forEach((rDate, idx) => {
        const cleanDate = rDate.split('T')[0];
        const key = `${c.id}_${cleanDate}`;
        // Do not synthesize if already in existing redemption invoices OR if a paid invoice exists on that date
        if (cleanDate && !existingRedemptionKeys.has(key) && !clientPaidDates.has(key)) {
          existingRedemptionKeys.add(key);
          baseList.push({
            id: `syn-client-bono-${c.id}-${idx}`,
            clientId: c.id,
            clientName: c.name,
            amount: 0,
            originalAmount: 60,
            discountAmount: 60,
            discountType: 'bono',
            discountLabel: `Décompté sur ${c.bonoType || 'Bono'}`,
            status: 'paid',
            paymentMethod: 'not_applicable',
            date: cleanDate,
            paymentDate: cleanDate,
            description: `Séance décomptée du Bono (${c.bonoType || 'Bono'})`,
            language: 'es',
            quantity: 1,
            isBonoRedemption: true,
          });
        }
      });
    });

    let list = baseList.filter(inv => {
      // Paid invoices (including paid Bono package purchases like 160 € / 250 €) have amount > 0 and are ALWAYS shown!
      // ONLY 0 € session redemptions (amount === 0) are subject to the showBonoRedemptions toggle.
      const is0EURRedemption = Boolean(
        inv.amount === 0 &&
        (inv.isBonoRedemption ||
         inv.paymentMethod === 'not_applicable' ||
         inv.paymentMethod === 'bono' ||
         (inv.discountType === 'bono' && inv.amount === 0) ||
         (formatLocalizedBonoText(inv.description, lang) && (formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('décomptée') || formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('decomptée'))))
      );

      // Hide 0 € Bono session redemptions unless user checked showBonoRedemptions
      if (!showBonoRedemptions && is0EURRedemption) {
        return false;
      }

      if (invoiceSearchQuery.trim()) {
        const q = invoiceSearchQuery.toLowerCase().trim();
        const matchesNum = inv.invoiceNumber?.toLowerCase().includes(q);
        const matchesClient = inv.clientName?.toLowerCase().includes(q);
        const matchesDesc = formatLocalizedBonoText(inv.description, lang)?.toLowerCase().includes(q);
        if (!matchesNum && !matchesClient && !matchesDesc) return false;
      }

      if (invoiceStatusFilter !== 'all' && inv.status !== invoiceStatusFilter) {
        return false;
      }

      if (invoiceMethodFilter !== 'all' && inv.paymentMethod !== invoiceMethodFilter && !is0EURRedemption) {
        return false;
      }

      return true;
    });

    return list.sort((a, b) => {
      let comp = 0;
      if (invoiceSortField === 'date') {
        const timeA = a.date ? new Date(a.date).getTime() : 0;
        const timeB = b.date ? new Date(b.date).getTime() : 0;
        comp = timeA - timeB;
      } else if (invoiceSortField === 'invoiceNumber') {
        const numA = parseInt(String(a.invoiceNumber || '').match(/\d+$/)?.[0] || '0', 10);
        const numB = parseInt(String(b.invoiceNumber || '').match(/\d+$/)?.[0] || '0', 10);
        comp = numA - numB;
      } else if (invoiceSortField === 'clientName') {
        comp = (a.clientName || '').localeCompare(b.clientName || '');
      } else if (invoiceSortField === 'amount') {
        comp = (a.amount || 0) - (b.amount || 0);
      } else if (invoiceSortField === 'status') {
        comp = (a.status || '').localeCompare(b.status || '');
      }

      if (comp !== 0) {
        return invoiceSortAsc ? comp : -comp;
      }

      // Tie breaker: date descending then invoice number descending
      const timeA = a.date ? new Date(a.date).getTime() : 0;
      const timeB = b.date ? new Date(b.date).getTime() : 0;
      if (timeA !== timeB) return timeB - timeA;
      const numA = parseInt(String(a.invoiceNumber || '').match(/\d+$/)?.[0] || '0', 10);
      const numB = parseInt(String(b.invoiceNumber || '').match(/\d+$/)?.[0] || '0', 10);
      return numB - numA;
    });
  }, [invoices, allNotes, clients, invoiceSortField, invoiceSortAsc, invoiceSearchQuery, invoiceStatusFilter, invoiceMethodFilter, showBonoRedemptions]);

  // Create new Client
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.firstName || !newClient.lastName) return;
    
    try {
      const formattedLastName = newClient.lastName.trim().toUpperCase();
      const formattedFirstName = capitalizeFirstName(newClient.firstName);
      const fullName = `${formattedLastName} ${formattedFirstName}`;
      const created = await api.createClient({
        firstName: formattedFirstName,
        lastName: formattedLastName,
        name: fullName,
        dni: newClient.dni?.trim() ? newClient.dni.trim().toUpperCase() : undefined,
        email: newClient.email,
        phone: newClient.phone,
        birthDate: newClient.birthDate,
        address: newClient.address,
        hasBono: newClient.hasBono,
        bonoType: newClient.hasBono ? newClient.bonoType : undefined,
        defaultDiscount: newClient.hasBono ? Number(newClient.defaultDiscount) : undefined,
        bonoSessionsRemaining: newClient.hasBono ? Number(newClient.bonoSessionsRemaining) : undefined,
      });
      setClients(prev => {
        const filtered = prev.filter(c => c.id !== created.id);
        return [...filtered, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedClient(created);
      setIsAddClientOpen(false);
      setNewClient({ ...DEFAULT_PATIENT_FORM });

      // If opened from within appointment modal, automatically link this patient to the appointment
      if (returnToAppointmentAfterClientCreate) {
        setNewEvent(prev => ({
          ...prev,
          clientId: created.id,
          title: created.name,
        }));
        setIsInlineNewPatient(false);
        setIsAddEventOpen(true);
        setReturnToAppointmentAfterClientCreate(false);
      }
    } catch (err: any) {
      console.error('Failed to create client:', err);
      alert(lang === 'fr' ? `Erreur lors de la création du patient : ${err?.message || 'Erreur réseau'}` : "Error creating patient.");
    }
  };

  // Delete Client Handler
  const handleDeleteClient = (clientId: string) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    const clientName = clientToDelete ? clientToDelete.name : '';

    setConfirmDialog({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer le patient' : lang === 'es' ? 'Eliminar paciente' : 'Delete patient',
      message: lang === 'fr'
        ? `Êtes-vous sûr de vouloir supprimer définitivement le patient "${clientName}" et l'historique associé ? Cette action est irréversible.`
        : lang === 'es'
        ? `¿Está seguro de que desea eliminar definitivamente al paciente "${clientName}"?`
        : `Are you sure you want to permanently delete patient "${clientName}"?`,
      confirmText: lang === 'fr' ? 'Supprimer le patient' : lang === 'es' ? 'Eliminar' : 'Delete patient',
      cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await api.deleteClient(clientId);
          setClients(prev => prev.filter(c => c.id !== clientId));
          if (selectedClient?.id === clientId) {
            setSelectedClient(null);
          }
          setIsEditClientOpen(false);
          setEditingClient(null);
        } catch (err) {
          console.error('Failed to delete client:', err);
        }
      },
    });
  };

  // Load notes and profile note when client changes
  useEffect(() => {
    if (selectedClient) {
      api.getClientNotes(selectedClient.id).then(setClientNotes);
      setProfileNoteInput(selectedClient.profileNote || '');
      setIsEditingProfileNote(false);
    } else {
      setClientNotes([]);
      setProfileNoteInput('');
      setIsEditingProfileNote(false);
    }
  }, [selectedClient?.id]);

  // Create client Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || (!newNote.anamnese.trim() && !newNote.treatment.trim() && !newNote.motif?.trim())) return;
    
    try {
      const parts: string[] = [];
      if (newNote.anamnese.trim()) parts.push(newNote.anamnese.trim());
      if (newNote.treatment.trim()) parts.push(newNote.treatment.trim());
      const combinedContent = parts.join('\n\n') || newNote.motif?.trim() || '';

      const noteDateOnly = new Date(newNote.date).toISOString().split('T')[0];
      const isAlreadyRedeemed = Boolean(
        selectedClient.bonoRedeemedDates && selectedClient.bonoRedeemedDates.includes(noteDateOnly)
      );

      const created = await api.createClientNote({
        clientId: selectedClient.id,
        anamnese: newNote.anamnese.trim(),
        treatment: newNote.treatment.trim(),
        content: combinedContent,
        category: newNote.category,
        motif: newNote.motif?.trim() || undefined,
        date: new Date(newNote.date).toISOString(),
        eventId: newNote.eventId || undefined,
        isBonoRedeemed: isAlreadyRedeemed,
        bonoType: isAlreadyRedeemed ? (selectedClient.bonoType || 'Bono') : undefined,
      });
      setClientNotes(prev => [created, ...prev]);
      setAllNotes(prev => [created, ...prev]);
      if (selectedClient?.id) {
        saveDraftToStorage(selectedClient.id, null);
      }
      setActiveDraftNotice(false);
      setNewNote({
        anamnese: '',
        treatment: '',
        category: 'treatment',
        date: new Date().toISOString().split('T')[0],
        motif: '',
        eventId: '',
      });
      
      // Update lastSessionAt locally
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, lastSessionAt: created.date } : c));
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // Delete client Note with confirmation
  const handleDeleteNote = (noteId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer la note clinique' : lang === 'es' ? 'Eliminar nota clínica' : 'Delete clinical note',
      message: lang === 'fr' 
        ? 'Êtes-vous certain de vouloir supprimer cette note clinique définitivement ?'
        : lang === 'es'
        ? '¿Está seguro de que desea eliminar esta nota clínica definitivamente?'
        : 'Are you sure you want to permanently delete this clinical note?',
      confirmText: lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await api.deleteClientNote(noteId);
          setClientNotes(prev => prev.filter(n => n.id !== noteId));
          setAllNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
          console.error('Failed to delete note:', err);
        }
      },
    });
  };

  // Scroll smoothly to a specific note in the history list and highlight it
  const handleScrollToNote = (noteId: string) => {
    const el = document.getElementById(`note-${noteId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-primary', 'bg-primary/5');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary', 'bg-primary/5');
      }, 2500);
    }
  };

  const getClientActiveBonoInfo = (client: Client | null) => {
    if (!client) return { hasBono: false, remaining: 0, bonoType: '' };
    
    // 1. Primary Source of Truth: if client.hasBono is true and bonoSessionsRemaining is defined on the client model (synced 1:1 with Supabase column bono_sessions_remaining)
    if (client.hasBono && client.bonoSessionsRemaining !== undefined && client.bonoSessionsRemaining !== null && !isNaN(Number(client.bonoSessionsRemaining))) {
      const remaining = Math.max(0, Number(client.bonoSessionsRemaining));
      return {
        hasBono: remaining > 0,
        remaining,
        bonoType: client.bonoType || (lang === 'fr' ? 'Bono 3 séances' : lang === 'es' ? 'Bono 3 sesiones' : 'Bono 3 sessions'),
      };
    }

    // 2. Secondary Fallback: compute from purchase and redemption invoices
    const clientInvoices = invoices.filter(i => 
      (client.id && i.clientId === client.id) || 
      (i.clientName && client.name && i.clientName.trim().toLowerCase() === client.name.trim().toLowerCase())
    );

    const purchaseInvoices = clientInvoices.filter(inv => 
      inv.amount > 0 && 
      (
        inv.discountType === 'bono' || 
        (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('bono')) ||
        (formatLocalizedBonoText(inv.discountLabel, lang) && formatLocalizedBonoText(inv.discountLabel, lang).toLowerCase().includes('bono'))
      )
    );

    const redemptionInvoices = clientInvoices.filter(inv => 
      inv.amount === 0 && 
      (
        inv.isBonoRedemption || 
        inv.paymentMethod === 'not_applicable' ||
        inv.discountType === 'bono' ||
        (formatLocalizedBonoText(inv.description, lang) && (formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('décompté') || formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('decompté'))) ||
        (formatLocalizedBonoText(inv.discountLabel, lang) && (formatLocalizedBonoText(inv.discountLabel, lang).toLowerCase().includes('décompté') || formatLocalizedBonoText(inv.discountLabel, lang).toLowerCase().includes('decompté')))
      )
    );

    if (purchaseInvoices.length > 0) {
      let totalCapacity = 0;
      let lastType = client.bonoType || '';

      for (const pInv of purchaseInvoices) {
        const desc = (pInv.description || '').toLowerCase();
        const lbl = (pInv.discountLabel || '').toLowerCase();
        const is5 = desc.includes('5') || lbl.includes('5') || pInv.amount >= 250;
        totalCapacity += (is5 ? 5 : 3);
        if (!lastType) {
          lastType = is5 
            ? (lang === 'fr' ? 'Bono 5 séances' : lang === 'es' ? 'Bono 5 sesiones' : 'Bono 5 sessions') 
            : (lang === 'fr' ? 'Bono 3 séances' : lang === 'es' ? 'Bono 3 sesiones' : 'Bono 3 sessions');
        }
      }

      const remaining = Math.max(0, totalCapacity - redemptionInvoices.length);
      return {
        hasBono: remaining > 0,
        remaining,
        bonoType: lastType || (lang === 'fr' ? 'Bono 3 séances' : lang === 'es' ? 'Bono 3 sesiones' : 'Bono 3 sessions'),
      };
    }

    return { hasBono: false, remaining: 0, bonoType: '' };
  };

  // Delete Invoice with confirmation and Bono cascade deletion
  const handleDeleteInvoice = (invoiceId: string) => {
    const inv = invoices.find(i => i.id === invoiceId || i.invoiceNumber === invoiceId);
    const invLabel = inv ? `#${inv.invoiceNumber} (${inv.clientName} - ${inv.amount}€)` : '';

    const isPaidBono = Boolean(
      inv &&
      inv.amount > 0 &&
      (
        inv.discountType === 'bono' ||
        (formatLocalizedBonoText(inv.discountLabel, lang) && formatLocalizedBonoText(inv.discountLabel, lang).toLowerCase().includes('bono')) ||
        (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('bono'))
      )
    );

    const isSingleRedemption = Boolean(
      inv &&
      inv.amount === 0 &&
      (
        inv.isBonoRedemption ||
        inv.discountType === 'bono' ||
        (formatLocalizedBonoText(inv.discountLabel, lang) && formatLocalizedBonoText(inv.discountLabel, lang).toLowerCase().includes('bono'))
      )
    );

    let confirmMsg = lang === 'fr' 
      ? `Êtes-vous certain de vouloir supprimer définitivement la facture ${invLabel} ? Cette action est irréversible.`
      : lang === 'es'
      ? `¿Está seguro de que desea eliminar definitivamente la factura ${invLabel}?`
      : `Are you sure you want to permanently delete invoice ${invLabel}?`;

    if (isPaidBono) {
      confirmMsg = lang === 'fr'
        ? `Attention : La suppression de cette facture d'achat de Bono (${invLabel}) va automatiquement supprimer toutes les séances décomptées en cascade et réinitialiser le Bono du patient. Souhaitez-vous continuer ?`
        : lang === 'es'
        ? `Atención: Al eliminar esta factura de Bono (${invLabel}) se eliminarán automáticamente todas las sesiones descontadas asociadas y se reiniciará el Bono del paciente. ¿Desea continuar?`
        : `Warning: Deleting this Bono purchase invoice (${invLabel}) will automatically delete all associated redeemed sessions and reset the patient's Bono. Continue?`;
    } else if (isSingleRedemption) {
      confirmMsg = lang === 'fr'
        ? `Supprimer ce décompte de séance récréditera 1 séance sur le forfait du patient. Souhaitez-vous continuer ?`
        : lang === 'es'
        ? `¿Eliminar este descuento de sesión y récreditar 1 sesión al Bono del paciente?`
        : `Delete this session redemption and credit 1 session back to the patient's package?`;
    }

    setConfirmDialog({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer la facture' : lang === 'es' ? 'Eliminar factura' : 'Delete invoice',
      message: confirmMsg,
      confirmText: lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const clientId = inv?.clientId;
          const clientName = inv?.clientName;

          // Perform API deletion (which executes database cascade & tombstones)
          await api.deleteInvoice(invoiceId, inv?.invoiceNumber);

          if (isSingleRedemption && (clientId || clientName)) {
            const targetDateStr = inv?.date ? inv.date.split('T')[0] : '';
            const targetClient = clients.find(c => (clientId && c.id === clientId) || (clientName && c.name?.trim().toLowerCase() === clientName.trim().toLowerCase()));

            if (targetClient) {
              const maxSessions = targetClient.bonoTotalSessions || 5;
              const currentRemaining = targetClient.bonoSessionsRemaining !== undefined ? targetClient.bonoSessionsRemaining : 0;
              const newRemaining = Math.min(maxSessions, currentRemaining + 1);
              const newDates = (targetClient.bonoRedeemedDates || []).filter(d => d !== targetDateStr);

              const updatedClient: Client = {
                ...targetClient,
                hasBono: true,
                bonoSessionsRemaining: newRemaining,
                bonoRedeemedDates: newDates,
              };

              // Persist re-credited session count to DB / Supabase & local storage
              try {
                await api.updateClient(updatedClient);
              } catch (err) {
                console.warn('Could not persist updated client bono to DB:', err);
              }

              // Update React state for clients
              setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));

              if (selectedClient && selectedClient.id === updatedClient.id) {
                setSelectedClient(updatedClient);
              }
            }

            // Update invoices state
            setInvoices(prev => prev.filter(i => i.id !== invoiceId && (!inv?.invoiceNumber || i.invoiceNumber !== inv.invoiceNumber)));

            // Reset isBonoRedeemed on associated notes
            setClientNotes(prev => prev.map(n => {
              const isEventMatch = inv?.eventId && n.eventId === inv.eventId;
              const isNoteMatch = inv?.noteId && n.id === inv.noteId;
              const isDateMatch = targetDateStr && n.date.split('T')[0] === targetDateStr;
              if (isEventMatch || isNoteMatch || isDateMatch) {
                const updatedNote = { ...n, isBonoRedeemed: false };
                api.updateClientNote(updatedNote).catch(() => {});
                return updatedNote;
              }
              return n;
            }));

            setAllNotes(prev => prev.map(n => {
              const isClientMatch = (clientId && n.clientId === clientId) || (clientName && n.clientName?.trim().toLowerCase() === clientName.trim().toLowerCase());
              const isEventMatch = inv?.eventId && n.eventId === inv.eventId;
              const isNoteMatch = inv?.noteId && n.id === inv.noteId;
              const isDateMatch = targetDateStr && n.date.split('T')[0] === targetDateStr;
              if (isClientMatch && (isEventMatch || isNoteMatch || isDateMatch)) {
                return { ...n, isBonoRedeemed: false };
              }
              return n;
            }));

          } else if (isPaidBono && (clientId || clientName)) {
            const targetClient = clients.find(c => (clientId && c.id === clientId) || (clientName && c.name?.trim().toLowerCase() === clientName.trim().toLowerCase()));

            if (targetClient) {
              const updatedClient: Client = {
                ...targetClient,
                hasBono: false,
                bonoSessionsRemaining: 0,
                bonoRedeemedDates: [],
                bonoType: '',
              };

              try {
                await api.updateClient(updatedClient);
              } catch (err) {
                console.warn('Could not reset client bono in DB:', err);
              }

              setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
              if (selectedClient && selectedClient.id === updatedClient.id) {
                setSelectedClient(updatedClient);
              }
            }

            setInvoices(prev => prev.filter(i => i.id !== invoiceId && (!inv?.invoiceNumber || i.invoiceNumber !== inv.invoiceNumber)));

          } else {
            setInvoices(prev => prev.filter(i => i.id !== invoiceId && (!inv?.invoiceNumber || i.invoiceNumber !== inv.invoiceNumber)));
          }

          if (isEditInvoiceOpen && editingInvoice?.id === invoiceId) {
            setIsEditInvoiceOpen(false);
            setEditingInvoice(null);
          }
        } catch (err) {
          console.error('Invoice deletion failed:', err);
        }
      },
    });
  };

  // Create invoice
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientId || newInvoice.amount === undefined) return;
    
    const client = clients.find(c => c.id === newInvoice.clientId);
    if (!client) return;
    
    const executeInvoiceCreation = async () => {
      try {
        let finalDescription = newInvoice.description;
        let finalAmount = Number(newInvoice.amount);
        let finalOriginal = Number(newInvoice.originalAmount || newInvoice.amount);
        let finalDiscount = Number(newInvoice.discountAmount || 0);
        let finalDiscType = newInvoice.discountType;
        let finalDiscLabel = newInvoice.discountLabel;
        let finalPaymentMethod = newInvoice.paymentMethod;
        let isRedemption = false;

        if (newInvoiceBillingPlan === 'deduct_bono') {
          finalAmount = 0;
          finalOriginal = 60;
          finalDiscount = 60;
          finalDiscType = 'bono';
          finalDiscLabel = `Décompté sur ${formatLocalizedBonoText(client.bonoType, lang) || 'Bono'}`;
          finalDescription = `Séance décomptée du Bono (${formatLocalizedBonoText(client.bonoType, lang) || 'Bono'})`;
          finalPaymentMethod = 'not_applicable';
          isRedemption = true;
        }

        if (newInvoiceBillingPlan === 'bono3' || newInvoiceBillingPlan === 'bono5') {
          const totalSessions = newInvoiceBillingPlan === 'bono3' ? 3 : 5;
          const bonoTitle = newInvoiceBillingPlan === 'bono3' ? 'Bono 3 séances' : 'Bono 5 séances';
          
          const purchaseInvoice = await api.createInvoice({
            clientId: client.id,
            clientName: client.name,
            amount: newInvoiceBillingPlan === 'bono3' ? 160 : 250,
            originalAmount: newInvoiceBillingPlan === 'bono3' ? 180 : 300,
            discountAmount: newInvoiceBillingPlan === 'bono3' ? 20 : 50,
            discountType: 'bono',
            discountLabel: bonoTitle,
            status: newInvoice.status || 'paid',
            paymentMethod: newInvoice.paymentMethod,
            date: newInvoice.date || new Date().toISOString().split('T')[0],
            paymentDate: newInvoice.status === 'paid' ? (newInvoice.paymentDate || newInvoice.date || new Date().toISOString().split('T')[0]) : undefined,
            description: `Bono Ostéopathie - Forfait ${totalSessions} séances`,
            language: 'es',
            quantity: 1,
            eventId: newInvoice.eventId || undefined,
            noteId: newInvoice.eventId || undefined,
            isBonoRedemption: false,
          });

          let remaining = totalSessions;
          const targetToday = newInvoice.date || new Date().toISOString().split('T')[0];
          const existingDates = client.bonoRedeemedDates || [];
          let updatedDates = [...existingDates];

          if (newInvoiceIncludeToday) {
            remaining = totalSessions - 1;
            updatedDates = Array.from(new Set([...updatedDates, targetToday]));

            // Also update any matching note for this client on targetToday or for this eventId
            const matchingNotes = allNotes.filter(n =>
              (newInvoice.eventId && n.eventId === newInvoice.eventId) ||
              (n.clientId === client.id && n.date && n.date.split('T')[0] === targetToday)
            );
            for (const mn of matchingNotes) {
              const updatedNote: ClientNote = {
                ...mn,
                isBonoRedeemed: true,
                bonoType: bonoTitle,
              };
              api.updateClientNote(updatedNote).catch(() => {});
            }
            setAllNotes(prev => prev.map(n =>
              (newInvoice.eventId && n.eventId === newInvoice.eventId) ||
              (n.clientId === client.id && n.date && n.date.split('T')[0] === targetToday)
                ? { ...n, isBonoRedeemed: true, bonoType: bonoTitle }
                : n
            ));
            setClientNotes(prev => prev.map(n =>
              (newInvoice.eventId && n.eventId === newInvoice.eventId) ||
              (n.clientId === client.id && n.date && n.date.split('T')[0] === targetToday)
                ? { ...n, isBonoRedeemed: true, bonoType: bonoTitle }
                : n
            ));
          }

          const updatedClient: Client = {
            ...client,
            hasBono: true,
            bonoType: bonoTitle,
            bonoSessionsRemaining: remaining,
            bonoRedeemedDates: updatedDates,
          };
          const savedClient = await api.updateClient(updatedClient);
          setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
          if (selectedClient?.id === client.id) setSelectedClient(savedClient);

          setInvoices(prev => sortInvoicesByDate([
            purchaseInvoice,
            ...prev.filter(i => i.id !== purchaseInvoice.id)
          ], false));

        } else {
          const isDiscounted = finalDiscount > 0;
          const created = await api.createInvoice({
            clientId: client.id,
            clientName: client.name,
            amount: finalAmount,
            originalAmount: isDiscounted ? finalOriginal : finalAmount,
            discountAmount: isDiscounted ? finalDiscount : undefined,
            discountType: isDiscounted && finalDiscType !== 'none' ? finalDiscType : undefined,
            discountLabel: isDiscounted ? finalDiscLabel : undefined,
            status: newInvoice.status || 'paid',
            paymentMethod: finalPaymentMethod,
            date: newInvoice.date || new Date().toISOString().split('T')[0],
            paymentDate: newInvoice.status === 'paid' ? (newInvoice.paymentDate || newInvoice.date || new Date().toISOString().split('T')[0]) : undefined,
            description: normalizeInvoiceDescription(formatLocalizedBonoText(finalDescription, lang)),
            language: 'es',
            quantity: 1,
            noteId: newInvoice.eventId || undefined,
            eventId: newInvoice.eventId || undefined,
            isBonoRedemption: isRedemption,
          });

          if (newInvoiceBillingPlan === 'deduct_bono' && client.hasBono) {
            const currentRem = client.bonoSessionsRemaining ?? 1;
            const newRemaining = Math.max(0, currentRem - 1);
            const targetDate = newInvoice.date || new Date().toISOString().split('T')[0];
            const existingDates = client.bonoRedeemedDates || [];
            const newDates = Array.from(new Set([...existingDates, targetDate]));

            const updatedClient: Client = {
              ...client,
              bonoSessionsRemaining: newRemaining,
              bonoRedeemedDates: newDates,
            };
            const savedClient = await api.updateClient(updatedClient);
            setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
            if (selectedClient?.id === client.id) setSelectedClient(savedClient);
          }

          setInvoices(prev => sortInvoicesByDate([created, ...prev.filter(i => i.id !== created.id)], false));
        }

        setIsAddInvoiceOpen(false);
        setNewInvoiceBillingPlan('single');
        setNewInvoiceIncludeToday(true);
        setNewInvoice({
          clientId: '',
          amount: 60,
          originalAmount: 60,
          discountAmount: 0,
          discountType: 'none',
          discountLabel: '',
          status: 'paid',
          paymentMethod: 'card',
          description: "Sesión de osteopatía",
          language: 'es',
          quantity: 1,
          date: new Date().toISOString().split('T')[0],
          paymentDate: new Date().toISOString().split('T')[0],
          eventId: '',
        });
      } catch (err) {
        console.error('Failed to create invoice:', err);
      }
    };

    if (newInvoiceBillingPlan === 'deduct_bono') {
      const bonoInfo = getClientActiveBonoInfo(client);
      const remainingAfter = Math.max(0, bonoInfo.remaining - 1);

      setConfirmDialog({
        isOpen: true,
        title: lang === 'fr' ? 'Confirmer le décompte du Bono' : lang === 'es' ? 'Confirmar descuento del Bono' : 'Confirm Bono Deduction',
        message: lang === 'fr'
          ? `Souhaitez-vous vraiment décompter 1 séance sur le forfait Bono de ${client.name} ? Il lui restera ${remainingAfter} séance(s).`
          : lang === 'es'
          ? `¿Desea realmente descontar 1 sesión del Bono de ${client.name}? Le quedarán ${remainingAfter} sesión(es).`
          : `Do you really want to deduct 1 session from ${client.name}'s Bono package? They will have ${remainingAfter} session(s) remaining.`,
        confirmText: lang === 'fr' ? 'Décompter 1 séance' : lang === 'es' ? 'Descontar 1 sesión' : 'Deduct 1 session',
        cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
        isDangerous: false,
        onConfirm: executeInvoiceCreation,
      });
      return;
    }

    await executeInvoiceCreation();
  };

  // Create inline invoice from notes history
  const handleCreateInlineInvoice = async (note: ClientNote) => {
    if (!selectedClient) return;

    const executeInlineCreation = async () => {
      try {
        const noteDateStr = note.date.includes('T') ? note.date.split('T')[0] : note.date;

        if (inlineBillingPlan === 'bono3' || inlineBillingPlan === 'bono5') {
          const totalSessions = inlineBillingPlan === 'bono3' ? 3 : 5;
          const bonoTitle = inlineBillingPlan === 'bono3' ? 'Bono 3 séances' : 'Bono 5 séances';
          const purchaseAmount = inlineBillingPlan === 'bono3' ? 160 : 250;
          const originalAmount = inlineBillingPlan === 'bono3' ? 180 : 300;
          const discountAmount = inlineBillingPlan === 'bono3' ? 20 : 50;

          const purchaseInvoice = await api.createInvoice({
            clientId: selectedClient.id,
            clientName: selectedClient.name,
            amount: purchaseAmount,
            originalAmount: originalAmount,
            discountAmount: discountAmount,
            discountType: 'bono',
            discountLabel: bonoTitle,
            status: inlineInvoiceStatus,
            paymentMethod: inlineInvoicePaymentMethod,
            date: noteDateStr,
            paymentDate: inlineInvoiceStatus === 'paid' ? noteDateStr : undefined,
            description: `Bono Ostéopathie - Forfait ${totalSessions} séances`,
            language: 'es',
            quantity: 1,
            noteId: note.id,
            eventId: note.eventId || undefined,
            isBonoRedemption: false,
          });

          let remaining = totalSessions;
          const existingDates = selectedClient.bonoRedeemedDates || [];
          let updatedDates = [...existingDates];

          if (inlineIncludeToday) {
            remaining = totalSessions - 1;
            updatedDates = Array.from(new Set([...updatedDates, noteDateStr]));
          }

          const updatedClient: Client = {
            ...selectedClient,
            hasBono: true,
            bonoType: bonoTitle,
            bonoSessionsRemaining: remaining,
            bonoRedeemedDates: updatedDates,
          };
          const savedClient = await api.updateClient(updatedClient);
          setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
          setSelectedClient(savedClient);

          if (inlineIncludeToday) {
            const updatedNote: ClientNote = {
              ...note,
              isBonoRedeemed: true,
              bonoType: bonoTitle,
            };
            try {
              await api.updateClientNote(updatedNote);
            } catch (err) {
              console.warn('Could not persist updated note:', err);
            }
            setClientNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
            setAllNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
          }

          setInvoices(prev => sortInvoicesByDate([purchaseInvoice, ...prev.filter(i => i.id !== purchaseInvoice.id)], false));
          setCreatingInvoiceForNoteId(null);
          return;
        }
        
        let finalDescription = translations[lang as Language].invoice.serviceDescription;
        let finalAmount = Number(inlineInvoiceAmount);
        let finalOriginal = Number(inlineInvoiceOriginalAmount);
        let finalDiscount = Number(inlineInvoiceDiscountAmount);
        let finalDiscType = inlineInvoiceDiscountType;
        let finalDiscLabel = inlineInvoiceDiscountLabel;
        let finalPaymentMethod = inlineInvoicePaymentMethod;
        let isRedemption = false;

        if (inlineBillingPlan === 'deduct_bono') {
          finalAmount = 0;
          finalOriginal = 60;
          finalDiscount = 60;
          finalDiscType = 'bono';
          finalDiscLabel = `Décompté sur ${formatLocalizedBonoText(selectedClient.bonoType, lang) || 'Bono'}`;
          finalDescription = `Séance décomptée du Bono (${formatLocalizedBonoText(selectedClient.bonoType, lang) || 'Bono'})`;
          finalPaymentMethod = 'not_applicable';
          isRedemption = true;
        }

        const isDiscounted = finalDiscount > 0;
        const created = await api.createInvoice({
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          amount: finalAmount,
          originalAmount: isDiscounted ? finalOriginal : finalAmount,
          discountAmount: isDiscounted ? finalDiscount : undefined,
          discountType: isDiscounted && finalDiscType !== 'none' ? finalDiscType : undefined,
          discountLabel: isDiscounted ? finalDiscLabel : undefined,
          status: inlineInvoiceStatus,
          paymentMethod: finalPaymentMethod,
          date: noteDateStr,
          paymentDate: inlineInvoiceStatus === 'paid' ? noteDateStr : undefined,
          description: normalizeInvoiceDescription(formatLocalizedBonoText(finalDescription, lang)),
          language: 'es',
          quantity: 1,
          noteId: note.id,
          eventId: note.eventId || undefined,
          isBonoRedemption: isRedemption,
        });

        if (inlineBillingPlan === 'deduct_bono' && selectedClient.hasBono) {
          const curRem = selectedClient.bonoSessionsRemaining ?? 1;
          const newRem = Math.max(0, curRem - 1);
          const targetDate = noteDateStr || new Date().toISOString().split('T')[0];
          const existingDates = selectedClient.bonoRedeemedDates || [];
          const newDates = Array.from(new Set([...existingDates, targetDate]));

          const updatedClient = await api.updateClient({
            ...selectedClient,
            bonoSessionsRemaining: newRem,
            bonoRedeemedDates: newDates,
          });
          setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
          setSelectedClient(updatedClient);

          // Update note state and persist
          const updatedNote: ClientNote = {
            ...note,
            isBonoRedeemed: true,
            bonoType: selectedClient.bonoType || 'Bono',
          };
          try {
            await api.updateClientNote(updatedNote);
          } catch (err) {
            console.warn('Could not persist updated note:', err);
          }
          setClientNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
          setAllNotes(prev => prev.map(n => n.id === note.id ? updatedNote : n));
        }

        setInvoices(prev => sortInvoicesByDate([created, ...prev.filter(i => i.id !== created.id)], false));
        setCreatingInvoiceForNoteId(null);
      } catch (err) {
        console.error('Failed to create inline invoice:', err);
      }
    };

    if (inlineBillingPlan === 'deduct_bono') {
      const bonoInfo = getClientActiveBonoInfo(selectedClient);
      const remainingAfter = Math.max(0, bonoInfo.remaining - 1);

      setConfirmDialog({
        isOpen: true,
        title: lang === 'fr' ? 'Confirmer le décompte du Bono' : lang === 'es' ? 'Confirmar descuento del Bono' : 'Confirm Bono Deduction',
        message: lang === 'fr'
          ? `Souhaitez-vous vraiment décompter 1 séance sur le forfait Bono de ${selectedClient.name} ? Il lui restera ${remainingAfter} séance(s).`
          : lang === 'es'
          ? `¿Desea realmente descontar 1 sesión del Bono de ${selectedClient.name}? Le quedarán ${remainingAfter} sesión(es).`
          : `Do you really want to deduct 1 session from ${selectedClient.name}'s Bono package? They will have ${remainingAfter} session(s) remaining.`,
        confirmText: lang === 'fr' ? 'Décompter 1 séance' : lang === 'es' ? 'Descontar 1 sesión' : 'Deduct 1 session',
        cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
        isDangerous: false,
        onConfirm: executeInlineCreation,
      });
      return;
    }

    await executeInlineCreation();
  };
  // Update Client Handler
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.firstName || !editingClient.lastName) return;

    try {
      const formattedLastName = editingClient.lastName.trim().toUpperCase();
      const formattedFirstName = capitalizeFirstName(editingClient.firstName);
      const fullName = `${formattedLastName} ${formattedFirstName}`;
      const oldClientName = editingClient.name;

      const updated = await api.updateClient({
        ...editingClient,
        firstName: formattedFirstName,
        lastName: formattedLastName,
        name: fullName,
      });

      setClients(prev => prev.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));

      // Synchronize appointment events with updated patient name in React state
      setEvents(prev => prev.map(ev => {
        const isMatchingClient = 
          ev.clientId === updated.id || 
          (oldClientName && (
            ev.clientName?.trim().toLowerCase() === oldClientName.trim().toLowerCase() ||
            ev.summary?.trim().toLowerCase() === oldClientName.trim().toLowerCase() ||
            ev.summary?.trim().toLowerCase().startsWith(oldClientName.trim().toLowerCase() + ' -')
          )) ||
          (editingClient.firstName && editingClient.lastName && (
            ev.clientName?.toLowerCase().includes(editingClient.lastName.toLowerCase()) && 
            ev.clientName?.toLowerCase().includes(editingClient.firstName.toLowerCase())
          )) ||
          (formattedLastName && formattedFirstName && (
            ev.clientName?.toLowerCase().includes(formattedLastName.toLowerCase()) &&
            ev.clientName?.toLowerCase().includes(formattedFirstName.toLowerCase())
          ));

        if (isMatchingClient) {
          let updatedSummary = ev.summary;
          if (ev.summary && ev.summary.includes(' - ')) {
            const parts = ev.summary.split(' - ');
            updatedSummary = `${fullName} - ${parts.slice(1).join(' - ')}`;
          } else if (!ev.summary || ev.summary === ev.clientName || (oldClientName && ev.summary === oldClientName) || ev.summary === "Sesión de osteopatía" || ev.summary === "Séance d'ostéopathie" || ev.summary === "Consultation d'ostéopathie") {
            updatedSummary = fullName;
          }
          return {
            ...ev,
            clientId: updated.id,
            clientName: fullName,
            summary: updatedSummary,
          };
        }
        return ev;
      }));

      // Synchronize invoices with updated patient name in React state - Disabled to preserve historical records on existing invoices
      /*
      setInvoices(prev => prev.map(inv => {
        if (inv.clientId === updated.id || (oldClientName && inv.clientName === oldClientName)) {
          return {
            ...inv,
            clientId: updated.id,
            clientName: fullName,
          };
        }
        return inv;
      }));
      */

      if (selectedClient?.id === updated.id) {
        setSelectedClient(updated);
      }
      setIsEditClientOpen(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Failed to update client:', err);
    }
  };

  // Save or Delete Profile Quick Note
  const handleSaveProfileNote = async () => {
    if (!selectedClient) return;
    try {
      const updatedClient: Client = {
        ...selectedClient,
        profileNote: profileNoteInput.trim(),
      };
      const saved = await api.updateClient(updatedClient);
      setSelectedClient(saved);
      setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
      setIsEditingProfileNote(false);
    } catch (err) {
      console.error('Failed to save profile note:', err);
    }
  };

  const handleDeleteProfileNote = async () => {
    if (!selectedClient) return;
    setConfirmDialog({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer la note du profil' : lang === 'es' ? 'Eliminar nota de perfil' : 'Delete profile note',
      message: lang === 'fr' ? 'Êtes-vous sûr de vouloir supprimer définitivement cette note du profil patient ?' : lang === 'es' ? '¿Está seguro de que desea eliminar esta nota del perfil del paciente?' : 'Are you sure you want to delete this note from the patient profile?',
      confirmText: lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : 'Delete',
      cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          const updatedClient: Client = {
            ...selectedClient,
            profileNote: '',
          };
          const saved = await api.updateClient(updatedClient);
          setSelectedClient(saved);
          setClients(prev => prev.map(c => c.id === saved.id ? saved : c));
          setProfileNoteInput('');
          setIsEditingProfileNote(false);
        } catch (err) {
          console.error('Failed to delete profile note:', err);
        }
      }
    });
  };

  // Update Client Note Handler
  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteAnamnese.trim() && !editingNoteTreatment.trim() && !editingNoteMotif.trim()) return;
    try {
      const noteToUpdate = clientNotes.find(n => n.id === noteId);
      if (!noteToUpdate) return;

      const parts: string[] = [];
      if (editingNoteAnamnese.trim()) parts.push(editingNoteAnamnese.trim());
      if (editingNoteTreatment.trim()) parts.push(editingNoteTreatment.trim());
      const combinedContent = parts.join('\n\n') || editingNoteMotif.trim() || '';

      let noteDate = noteToUpdate.date;
      if (editingNoteDate) {
        try {
          noteDate = new Date(editingNoteDate).toISOString();
        } catch {
          noteDate = noteToUpdate.date;
        }
      }

      const updated = await api.updateClientNote({
        ...noteToUpdate,
        anamnese: editingNoteAnamnese.trim(),
        treatment: editingNoteTreatment.trim(),
        content: combinedContent,
        category: editingNoteCategory,
        motif: editingNoteMotif.trim() || undefined,
        date: noteDate,
      });

      setClientNotes(prev => prev.map(n => n.id === noteId ? updated : n));
      setAllNotes(prev => prev.map(n => n.id === noteId ? updated : n));
      setEditingNoteId(null);
      setEditingNoteAnamnese('');
      setEditingNoteTreatment('');
      setEditingNoteMotif('');
      setEditingNoteDate('');
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  };

  // Update Invoice Handler
  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    try {
      const client = clients.find(c => c.id === editingInvoice.clientId);
      const clientName = client ? client.name : editingInvoice.clientName;

      const updated = await api.updateInvoice({
        ...editingInvoice,
        clientName,
        language: 'es',
        description: normalizeInvoiceDescription(editingInvoice.description),
        quantity: 1,
      });

      setInvoices(prev => sortInvoicesByDate(prev.map(i => i.id === updated.id ? updated : i), false));
      setIsEditInvoiceOpen(false);
      setEditingInvoice(null);
    } catch (err) {
      console.error('Failed to update invoice:', err);
    }
  };

  // Toggle invoice payment status handler
  const handleToggleInvoiceStatus = async (invoice: Invoice, targetStatus?: 'paid' | 'pending') => {
    const newStatus = targetStatus || (invoice.status === 'paid' ? 'pending' : 'paid');

    const executeToggle = async () => {
      try {
        const updated = await api.updateInvoice({
          ...invoice,
          status: newStatus,
          paymentDate: newStatus === 'paid' ? (invoice.paymentDate || new Date().toISOString().split('T')[0]) : undefined,
          language: 'es',
          description: normalizeInvoiceDescription(invoice.description),
          quantity: 1,
        });
        setInvoices(prev => sortInvoicesByDate(prev.map(i => i.id === updated.id ? updated : i), false));
        if (selectedInvoiceForPrint?.id === updated.id) {
          setSelectedInvoiceForPrint(updated);
        }
      } catch (err) {
        console.error('Failed to update invoice status:', err);
      }
    };

    const invNum = invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : '';

    if (newStatus === 'paid' && invoice.status === 'pending') {
      setConfirmDialog({
        isOpen: true,
        title: lang === 'fr' ? 'Confirmer le règlement' : lang === 'es' ? 'Confirmar pago' : 'Confirm payment',
        message: lang === 'fr'
          ? `Confirmez-vous que la facture ${invNum} (${invoice.clientName} - ${invoice.amount} €) a bien été réglée par le patient ?`
          : lang === 'es'
          ? `¿Confirma que la factura ${invNum} (${invoice.clientName} - ${invoice.amount} €) ha sido pagada por el paciente?`
          : `Do you confirm that invoice ${invNum} (${invoice.clientName} - ${invoice.amount} €) has been paid by the patient?`,
        confirmText: lang === 'fr' ? 'Confirmer le paiement' : lang === 'es' ? 'Confirmar pago' : 'Confirm payment',
        cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
        isDangerous: false,
        onConfirm: executeToggle,
      });
    } else if (newStatus === 'pending' && invoice.status === 'paid') {
      setConfirmDialog({
        isOpen: true,
        title: lang === 'fr' ? 'Passer en attente de règlement' : lang === 'es' ? 'Cambiar a pendiente de pago' : 'Set to pending payment',
        message: lang === 'fr'
          ? `Voulez-vous vraiment repasser la facture ${invNum} (${invoice.clientName} - ${invoice.amount} €) au statut "En attente de règlement" (impayée) ?`
          : lang === 'es'
          ? `¿Realmente desea cambiar el estado de la factura ${invNum} (${invoice.clientName} - ${invoice.amount} €) a "Pendiente de pago"?`
          : `Are you sure you want to change invoice ${invNum} (${invoice.clientName} - ${invoice.amount} €) back to "Pending payment" (unpaid)?`,
        confirmText: lang === 'fr' ? 'Passer en attente' : lang === 'es' ? 'Marcar pendiente' : 'Mark as pending',
        cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
        isDangerous: true,
        onConfirm: executeToggle,
      });
    } else {
      await executeToggle();
    }
  };

  // Event Helper Functions for display & styling
  const getEventDisplayName = (ev: { clientName?: string; clientId?: string; summary?: string; description?: string; eventType?: EventType }) => {
    if (ev.eventType && ev.eventType !== 'appointment') {
      const remark = ev.description?.replace(/\[eventType:[a-z]+\]/gi, '').replace(/\[type:[a-z]+\]/gi, '').trim();
      if (remark) return remark;
      return ev.summary || (lang === 'fr' ? 'Créneau indisponible' : lang === 'es' ? 'Horario bloqueado' : 'Blocked slot');
    }
    if (ev.clientId) {
      const foundClient = clients.find(c => c.id === ev.clientId);
      if (foundClient?.name) return foundClient.name;
    }
    if (ev.clientName && ev.clientName.trim() && ev.clientName !== 'Patient sans nom') {
      return ev.clientName;
    }
    return ev.summary || (lang === 'fr' ? "Rendez-vous" : lang === 'es' ? "Cita" : "Appointment");
  };

  const getEventClient = (ev: { clientId?: string; clientName?: string; summary?: string }) => {
    if (ev.clientId) {
      const found = clients.find(c => c.id === ev.clientId);
      if (found) return found;
    }
    if (ev.clientName) {
      const trimmed = ev.clientName.trim().toLowerCase();
      const found = clients.find(c => c.name.toLowerCase() === trimmed);
      if (found) return found;
    }
    if (ev.summary) {
      const summaryClean = ev.summary
        .replace(/^(consultation|rdv|rendez-vous|séance|seance|visite|osteopathie|ostéopathie)\s*[:-]?\s*/i, '')
        .split('-')[0]
        .trim()
        .toLowerCase();
      const found = clients.find(c => c.name.toLowerCase().includes(summaryClean) || summaryClean.includes(c.name.toLowerCase()));
      if (found) return found;
    }
    return null;
  };

  // Helper to dynamically format and translate Bono titles, descriptions and labels according to selected language
  const formatLocalizedBonoText = (text?: string, targetLang: Language = lang): string => {
    if (!text) return '';
    const lower = text.toLowerCase();
    const t = translations[targetLang]?.admin?.billing;
    
    // Exact matches or variations for Bono packages
    if (lower.includes('bono 3') || lower.includes('3 séances') || lower.includes('3 sesiones') || lower.includes('3 sessions')) {
      if (lower.includes('160') || lower.includes('forfait') || lower.includes('paquete') || lower.includes('package') || lower.includes('ostéopathie') || lower.includes('osteopatía') || lower.includes('osteopathy')) {
        return t?.bono3Description || text;
      }
      return t?.bono3Label || text;
    }
    if (lower.includes('bono 5') || lower.includes('5 séances') || lower.includes('5 sesiones') || lower.includes('5 sessions')) {
      if (lower.includes('250') || lower.includes('forfait') || lower.includes('paquete') || lower.includes('package') || lower.includes('ostéopathie') || lower.includes('osteopatía') || lower.includes('osteopathy')) {
        return t?.bono5Description || text;
      }
      return t?.bono5Label || text;
    }
    
    // Bono redemptions / deductions
    if (lower.includes('décompté') || lower.includes('decompté') || lower.includes('descontado') || lower.includes('deducted') || lower.includes('redemption')) {
      if (lower.includes('séance') || lower.includes('sesión') || lower.includes('session')) {
        const base = t?.sessionDeductedFromBono || 'Séance décomptée du Bono ({bonoType})';
        return base.replace('{bonoType}', 'Bono');
      }
      return t?.bonoRedemptionLabel || text;
    }
    
    return text;
  };

  const hasAppointmentNote = (ev: { id?: string; clientId?: string; start?: string }) => {
    if (ev.id && allNotes.some(n => n.eventId === ev.id)) return true;
    if (ev.clientId && ev.start) {
      const targetDateStr = ev.start.split('T')[0];
      return allNotes.some(n => n.clientId === ev.clientId && n.date && n.date.split('T')[0] === targetDateStr);
    }
    return false;
  };

  const isAppointmentSettledOrRedeemed = (ev: { id?: string; clientId?: string; start?: string }) => {
    if (!ev) return false;
    const targetDateStr = ev.start ? ev.start.split('T')[0] : '';
    const client = getEventClient(ev);
    const clientId = ev.clientId || client?.id;
    const clientName = client?.name;

    // Check if client has bonoRedeemedDates matching this appointment date
    if (client?.bonoRedeemedDates && targetDateStr && client.bonoRedeemedDates.includes(targetDateStr)) {
      return true;
    }

    // Check notes for isBonoRedeemed
    const associatedNotes = allNotes.filter(n => 
      (ev.id && n.eventId === ev.id) ||
      (clientId && n.clientId === clientId && n.date && n.date.split('T')[0] === targetDateStr)
    );

    if (associatedNotes.some(n => n.isBonoRedeemed)) {
      return true;
    }

    // Check invoices for paid or bono redemption
    const associatedInvoices = invoices.filter(inv => {
      const isEventMatch = Boolean(ev.id && (inv.eventId === ev.id || inv.noteId === ev.id));
      const isClientMatch = Boolean((clientId && inv.clientId === clientId) || 
                            (clientName && inv.clientName && inv.clientName.trim().toLowerCase() === clientName.trim().toLowerCase()));
      const isDateMatch = Boolean(targetDateStr && inv.date && inv.date.split('T')[0] === targetDateStr);
      return isEventMatch || (isClientMatch && isDateMatch);
    });

    return associatedInvoices.some(inv => 
      inv.status === 'paid' || 
      inv.isBonoRedemption || 
      inv.amount === 0 || 
      inv.paymentMethod === 'not_applicable' || 
      inv.discountType === 'bono'
    );
  };

  const isAppointmentFullyCompleted = (ev: CalendarEvent) => {
    const isOther = ev.eventType && ev.eventType !== 'appointment';
    if (isOther) return false;
    return hasAppointmentNote(ev) && isAppointmentSettledOrRedeemed(ev);
  };

  const getAppointmentInvoice = (ev: { id?: string; clientId?: string; start?: string }) => {
    return invoices.find(i => 
      (i.eventId && i.eventId === ev.id) || 
      (i.noteId && i.noteId === ev.id)
    );
  };

  const getEventNote = (ev: { id?: string; clientId?: string; start?: string }) => {
    return allNotes.find(n => n.eventId && n.eventId === ev.id);
  };

  const getEventTypeLabel = (type?: EventType) => {
    switch (type) {
      case 'blocked':
        return lang === 'fr' ? 'Bloqué / Indispo' : lang === 'es' ? 'Bloqueado / No disp.' : 'Blocked slot';
      case 'appointment':
      default:
        return lang === 'fr' ? 'Rendez-vous' : lang === 'es' ? 'Cita' : 'Appointment';
    }
  };

  const getEventTypeBadgeClass = (type?: EventType) => {
    switch (type) {
      case 'blocked':
        return 'bg-amber-100 text-amber-900 border-amber-300/80';
      case 'appointment':
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-300/80';
    }
  };

  // Helper to determine real-time status of an appointment (ongoing, past, upcoming)
  const getAppointmentTimeStatus = (ev: { start: string; end?: string }) => {
    try {
      const startMs = new Date(ev.start).getTime();
      const endMs = ev.end ? new Date(ev.end).getTime() : startMs + 55 * 60 * 1000;
      const nowMs = currentTime.getTime();

      if (nowMs >= startMs && nowMs < endMs) {
        return { status: 'ongoing' as const, isOngoing: true, isPast: false, isUpcoming: false };
      }
      if (nowMs >= endMs) {
        return { status: 'past' as const, isOngoing: false, isPast: true, isUpcoming: false };
      }
      return { status: 'upcoming' as const, isOngoing: false, isPast: false, isUpcoming: true };
    } catch {
      return { status: 'upcoming' as const, isOngoing: false, isPast: false, isUpcoming: true };
    }
  };

  // Helper to open edit event modal
  const openEditEventModal = (event: CalendarEvent) => {
    try {
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      const pad = (n: number) => n < 10 ? '0' + n : String(n);
      const year = startDate.getFullYear();
      const month = pad(startDate.getMonth() + 1);
      const day = pad(startDate.getDate());
      const dateStr = `${year}-${month}-${day}`;
      
      const startHour = pad(startDate.getHours());
      const startMin = pad(startDate.getMinutes());
      const startTimeStr = `${startHour}:${startMin}`;

      const endHour = pad(endDate.getHours());
      const endMin = pad(endDate.getMinutes());
      const endTimeStr = `${endHour}:${endMin}`;

      setEditingEvent({
        id: event.id,
        summary: event.summary,
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        description: event.description || '',
        clientId: event.clientId,
        clientName: event.clientName,
        eventType: event.eventType || 'appointment',
      });
      setIsEditEventOpen(true);
    } catch (err) {
      console.error('Error opening edit event modal:', err);
    }
  };

  // Direct Redirection to Clinical Notes from an Appointment
  const handleGoToNotes = (event: { id?: string; clientId?: string; clientName?: string; summary?: string; start?: string; description?: string; eventType?: EventType }) => {
    setSelectedDayModalDate(null);
    setIsEditEventOpen(false);
    setEditingEvent(null);
    setIsAddEventOpen(false);
    setIsAddClientOpen(false);

    // 1. Try finding client by explicit clientId
    let targetClient = event.clientId ? clients.find(c => c.id === event.clientId) : undefined;

    // 2. If not found, try matching by clientName
    if (!targetClient && event.clientName) {
      const search = event.clientName.trim().toLowerCase();
      targetClient = clients.find(c => c.name.trim().toLowerCase() === search);
    }

    // 3. If not found, parse summary (e.g. "Jean Dupont - Séance d'Ostéopathie")
    if (!targetClient && event.summary) {
      const summaryClean = event.summary
        .replace(/^(consultation|rdv|rendez-vous|séance|seance|visite|osteopathie|ostéopathie)\s*[:-]?\s*/i, '')
        .split('-')[0]
        .trim()
        .toLowerCase();
      
      targetClient = clients.find(c => 
        c.name.toLowerCase().includes(summaryClean) || 
        summaryClean.includes(c.name.toLowerCase())
      );
    }

    if (targetClient) {
      setSelectedClient(targetClient);
      setActiveTab('clients');
      const evDate = event.start ? new Date(event.start) : new Date();
      const dateStr = evDate.toISOString().split('T')[0];
      const existingDraft = getClientDraft(targetClient.id, event.id) || getClientDraft(targetClient.id);

      if (existingDraft) {
        setNewNote({
          anamnese: existingDraft.draft.anamnese || '',
          treatment: existingDraft.draft.treatment || '',
          category: existingDraft.draft.category || 'treatment',
          date: existingDraft.draft.date || dateStr,
          motif: existingDraft.draft.motif || event.summary || '',
          eventId: event.id || existingDraft.draft.eventId || '',
        });
        setActiveDraftNotice(true);
      } else {
        setNewNote({
          anamnese: '',
          treatment: '',
          category: 'treatment',
          date: dateStr,
          motif: event.summary || '',
          eventId: event.id || '',
        });
        setActiveDraftNotice(false);
      }

      setTimeout(() => {
        const noteFormElem = document.getElementById('new-note-form');
        if (noteFormElem) {
          noteFormElem.scrollIntoView({ behavior: 'smooth' });
          const firstField = noteFormElem.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
          if (firstField) firstField.focus();
        }
      }, 100);
    } else {
      const fallbackName = event.clientName || (event.summary ? event.summary.split('-')[0].trim() : '');
      if (fallbackName && fallbackName.length > 1) {
        const shouldCreate = window.confirm(
          lang === 'fr'
            ? `Le patient "${fallbackName}" n'a pas encore de fiche médicale créée. Souhaitez-vous créer sa fiche maintenant ?`
            : `Patient "${fallbackName}" does not have a medical record yet. Would you like to create their profile now?`
        );
        if (shouldCreate) {
          const parts = fallbackName.split(' ');
          setNewClient({
            firstName: parts[0] || fallbackName,
            lastName: parts.slice(1).join(' ') || '',
            email: '',
            phone: '',
            birthDate: '',
            address: '',
          });
          setIsAddClientOpen(true);
        }
      }
      setActiveTab('clients');
    }
  };

  // Create new session/appointment or other slot on local / Supabase calendar
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    const isOtherType = newEvent.eventType && newEvent.eventType !== 'appointment';
    let finalClientId: string | undefined = isOtherType ? undefined : (newEvent.clientId || undefined);
    let finalClientName: string | undefined = undefined;

    if (!isOtherType && isInlineNewPatient) {
      const cleanFirstName = capitalizeFirstName(inlinePatient.firstName);
      const cleanLastName = inlinePatient.lastName.trim().toUpperCase();
      if (!cleanLastName || !cleanFirstName) {
        alert(lang === 'fr' ? "Veuillez saisir le nom et le prénom du nouveau patient." : "Please enter the new patient's first and last name.");
        return;
      }
      try {
        const fullName = `${cleanLastName} ${cleanFirstName}`;
        const createdCl = await api.createClient({
          firstName: cleanFirstName,
          lastName: cleanLastName,
          name: fullName,
          dni: inlinePatient.dni?.trim() ? inlinePatient.dni.trim().toUpperCase() : undefined,
          email: inlinePatient.email?.trim() || '',
          phone: inlinePatient.phone?.trim() || '',
          birthDate: inlinePatient.birthDate || '',
          address: inlinePatient.address || '',
          hasBono: inlinePatient.hasBono,
          bonoType: inlinePatient.hasBono ? inlinePatient.bonoType : undefined,
          defaultDiscount: inlinePatient.hasBono ? Number(inlinePatient.defaultDiscount) : undefined,
          bonoSessionsRemaining: inlinePatient.hasBono ? Number(inlinePatient.bonoSessionsRemaining) : undefined,
        });
        setClients(prev => {
          const filtered = prev.filter(c => c.id !== createdCl.id);
          return [...filtered, createdCl].sort((a, b) => a.name.localeCompare(b.name));
        });
        setSelectedClient(createdCl);
        finalClientId = createdCl.id;
        finalClientName = (createdCl.name && createdCl.name !== 'Patient sans nom') ? createdCl.name : fullName;
      } catch (err: any) {
        console.error('Failed to create inline patient:', err);
        alert(lang === 'fr' ? `Erreur lors de la création du patient : ${err?.message || 'Erreur réseau'}` : "Error creating patient.");
        return;
      }
    } else if (!isOtherType && newEvent.clientId) {
      const client = clients.find(c => c.id === newEvent.clientId);
      if (client) {
        finalClientName = client.name;
      }
    } else if (!isOtherType && !newEvent.clientId) {
      // If no patient was selected from the dropdown, check if user entered a patient name in the title
      const cleanTitle = newEvent.title.trim();
      const isDefaultTitle = !cleanTitle || 
        cleanTitle === "Sesión de osteopatía" || 
        cleanTitle === "Séance d'ostéopathie" || 
        cleanTitle === "Osteopathy session" || 
        cleanTitle === getDefaultAppointmentTitle(lang) ||
        cleanTitle.toLowerCase() === 'consultation' ||
        cleanTitle.toLowerCase() === 'rdv' ||
        cleanTitle.toLowerCase() === 'rendez-vous';

      if (!isDefaultTitle && cleanTitle.length >= 2) {
        // First check if an existing client matches this name
        const existing = clients.find(c => 
          c.name.toLowerCase() === cleanTitle.toLowerCase() ||
          `${c.firstName} ${c.lastName}`.toLowerCase() === cleanTitle.toLowerCase() ||
          `${c.lastName} ${c.firstName}`.toLowerCase() === cleanTitle.toLowerCase()
        );

        if (existing) {
          finalClientId = existing.id;
          finalClientName = existing.name;
        } else {
          // Auto-create new patient from entered title so it is saved in DB and appears in patient list
          try {
            const parts = cleanTitle.split(/\s+/);
            const cleanLastName = parts[0].toUpperCase();
            const cleanFirstName = parts.length > 1 ? capitalizeFirstName(parts.slice(1).join(' ')) : cleanLastName;
            const fullName = `${cleanLastName} ${cleanFirstName}`.trim();
            const createdCl = await api.createClient({
              firstName: cleanFirstName,
              lastName: cleanLastName,
              name: fullName,
              email: '',
              phone: '',
              birthDate: '',
              address: '',
              
              bonoType: '',
              defaultDiscount: 10,
              bonoSessionsRemaining: 0,
            });
            setClients(prev => {
              const filtered = prev.filter(c => c.id !== createdCl.id);
              return [...filtered, createdCl].sort((a, b) => a.name.localeCompare(b.name));
            });
            setSelectedClient(createdCl);
            finalClientId = createdCl.id;
            finalClientName = createdCl.name || fullName;
          } catch (err) {
            console.warn('Auto-create patient from appointment title warning:', err);
          }
        }
      }
    }

    let summary = newEvent.title.trim();
    if (isOtherType) {
      if (!summary) {
        summary = getEventTypeLabel(newEvent.eventType);
      }
    } else {
      if (!summary || summary === "Sesión de osteopatía" || summary === "Séance d'ostéopathie" || summary === "Osteopathy session" || summary === getDefaultAppointmentTitle(lang)) {
        if (finalClientName) {
          summary = finalClientName;
        } else {
          summary = getDefaultAppointmentTitle(lang);
        }
      }
    }
    const description = newEvent.description?.trim() || "";
    
    const startIso = new Date(`${newEvent.date}T${newEvent.startTime}:00`).toISOString();
    const endIso = new Date(`${newEvent.date}T${newEvent.endTime}:00`).toISOString();
    
    try {
      const created = await api.createLocalEvent({
        summary,
        description,
        start: startIso,
        end: endIso,
        clientId: isOtherType ? undefined : finalClientId,
        clientName: isOtherType ? undefined : finalClientName,
        eventType: newEvent.eventType || 'appointment',
      });

      setEvents(prev => [...prev, created].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      setIsAddEventOpen(false);
      setIsInlineNewPatient(false);
      setInlinePatient({ ...DEFAULT_PATIENT_FORM });
      setNewEvent({
        clientId: '',
        title: getDefaultAppointmentTitle(lang),
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        description: '',
        eventType: 'appointment',
      });

      // Background refresh to guarantee local client cache reflects Supabase
      api.getClients().then(refreshed => {
        if (refreshed && refreshed.length > 0) {
          setClients(refreshed);
        }
      }).catch(() => {});
    } catch (err: any) {
      console.error('Failed to create event:', err);
      alert(lang === 'fr' ? "Erreur lors de l'enregistrement de l'événement." : "Error creating event.");
    }
  };

  // Update existing Calendar event
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const isOtherType = editingEvent.eventType && editingEvent.eventType !== 'appointment';
    const startIso = new Date(`${editingEvent.date}T${editingEvent.startTime}:00`).toISOString();
    const endIso = new Date(`${editingEvent.date}T${editingEvent.endTime}:00`).toISOString();

    let clientName = editingEvent.clientName;
    if (!isOtherType && editingEvent.clientId) {
      const foundClient = clients.find(c => c.id === editingEvent.clientId);
      if (foundClient) {
        clientName = foundClient.name;
      }
    }

    try {
      const existing = events.find(ev => ev.id === editingEvent.id);
      const updated = await api.updateLocalEvent({
        id: editingEvent.id,
        summary: editingEvent.summary,
        description: editingEvent.description,
        start: startIso,
        end: endIso,
        clientId: isOtherType ? undefined : (editingEvent.clientId || existing?.clientId),
        clientName: isOtherType ? undefined : (clientName || existing?.clientName),
        eventType: editingEvent.eventType || 'appointment',
      });

      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      setIsEditEventOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      alert(lang === 'fr' ? "Erreur lors de la modification de l'événement." : "Error updating event.");
    }
  };

  // Delete Calendar event
  const handleDeleteEvent = (eventId: string) => {
    const eventToDelete = events.find(ev => ev.id === eventId);
    const eventTitle = eventToDelete ? eventToDelete.summary : '';

    setConfirmDialog({
      isOpen: true,
      title: lang === 'fr' ? 'Supprimer le rendez-vous' : lang === 'es' ? 'Eliminar cita' : 'Delete appointment',
      message: lang === 'fr' 
        ? `Êtes-vous certain de vouloir supprimer définitivement le rendez-vous "${eventTitle}" ?`
        : lang === 'es'
        ? `¿Está seguro de que desea eliminar definitivamente la cita "${eventTitle}"?`
        : `Are you sure you want to permanently delete appointment "${eventTitle}"?`,
      confirmText: lang === 'fr' ? 'Supprimer le RDV' : lang === 'es' ? 'Eliminar' : 'Delete appointment',
      cancelText: lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await api.deleteLocalEvent(eventId);
          setEvents(prev => prev.filter(ev => ev.id !== eventId));
          if (isEditEventOpen) {
            setIsEditEventOpen(false);
            setEditingEvent(null);
          }
        } catch (err: any) {
          console.error('Failed to delete event:', err);
        }
      },
    });
  };

  // CALCULATE KPI METRICS
  const totalPatientsCount = clients.length;
  
  const currentMonthInvoices = invoices.filter(inv => {
    const invDate = new Date(inv.date);
    const now = new Date();
    return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
  });
  
  const totalRevenueThisMonth = currentMonthInvoices.reduce((sum, item) => sum + item.amount, 0);
  
  const totalSessionsThisMonth = currentMonthInvoices.length;

  // CHARTS DATA PROCESSING (Monthly grouping)
  const getRevenueChartData = () => {
    const months = ['Jan', 'Féb', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentYear = new Date().getFullYear();
    
    // Initialize months
    const data = months.map((m, index) => ({
      name: m,
      Montant: 0,
      Séances: 0,
      index,
    }));
    
    invoices.forEach(inv => {
      const date = new Date(inv.date);
      if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        if (monthIndex >= 0 && monthIndex < 12) {
          data[monthIndex].Montant += inv.amount;
          data[monthIndex].Séances += 1;
        }
      }
    });
    
    return data;
  };

  const chartData = getRevenueChartData();

  // Pre-calculate activity counts for each client to display badges and detect "active" profiles
  const clientActivityMap = useMemo(() => {
    const map: Record<string, { noteCount: number; invCount: number; evCount: number; total: number }> = {};
    clients.forEach(c => {
      map[c.id] = { noteCount: 0, invCount: 0, evCount: 0, total: 0 };
    });
    allNotes.forEach(n => { if (map[n.clientId]) map[n.clientId].noteCount++; });
    invoices.forEach(i => { if (map[i.clientId]) map[i.clientId].invCount++; });
    events.forEach(e => { if (e.clientId && map[e.clientId]) map[e.clientId].evCount++; });
    Object.values(map).forEach(v => { v.total = v.noteCount + v.invCount + v.evCount; });
    return map;
  }, [clients, allNotes, invoices, events]);

  // Duplicate detection logic: group patients by name and count associated records
  const duplicateGroups = useMemo(() => {
    const groups: Record<string, Client[]> = {};
    clients.forEach(c => {
      const nameKey = c.name?.trim().toLowerCase();
      if (!nameKey || nameKey === 'patient sans nom') return;
      if (!groups[nameKey]) groups[nameKey] = [];
      groups[nameKey].push(c);
    });

    return Object.entries(groups)
      .filter(([_, list]) => list.length > 1)
      .map(([name, list]) => {
        return {
          name: list[0].name,
          clients: list.map(c => {
            const activity = clientActivityMap[c.id] || { noteCount: 0, invCount: 0, evCount: 0, total: 0 };
            return { 
              ...c, 
              noteCount: activity.noteCount, 
              invoiceCount: activity.invCount, 
              eventCount: activity.evCount, 
              totalRecords: activity.total 
            };
          }).sort((a, b) => b.totalRecords - a.totalRecords) // Most "active" first
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, clientActivityMap]);

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.dni && c.dni.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  // Monitor patient list scrollability
  useEffect(() => {
    checkPatientScroll();
    const t = setTimeout(checkPatientScroll, 120);
    return () => clearTimeout(t);
  }, [filteredClients.length, activeTab, searchQuery]);

  const handlePrintInvoice = () => {
    const element = invoiceRef.current;
    if (!element || !selectedInvoiceForPrint) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres surgissantes (pop-ups) pour imprimer.');
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Facture ${selectedInvoiceForPrint.invoiceNumber}</title>
          <style>
            ${styles}
            @page { margin: 0; size: A4; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #print-wrapper { padding: 20mm; background: white; min-height: 297mm; }
          </style>
        </head>
        <body>
          <div id="print-wrapper">
            ${element.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintRecap = () => {
    const element = recapRef.current;
    if (!element || !selectedRecapForPrint) return;

    const printWindow = window.open('', '_blank', 'width=800,height=1000');
    if (!printWindow) {
      alert('Por favor, autorice las ventanas emergentes (pop-ups) para imprimir.');
      return;
    }

    const styles = Array.from(document.styleSheets)
      .map(styleSheet => {
        try {
          return Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('');
        } catch (e) {
          return '';
        }
      })
      .join('');

    const period = formatRecapPeriodTitle(selectedRecapForPrint);

    printWindow.document.write(`
      <html>
        <head>
          <title>${period}</title>
          <style>
            ${styles}
            @page { margin: 0; size: A4; }
            body { margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            #print-wrapper { padding: 20mm; background: white; min-height: 297mm; }
          </style>
        </head>
        <body>
          <div id="print-wrapper">
            ${element.innerHTML}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 250);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div id="admin-dashboard-layout" className="fixed inset-0 z-[80] bg-[#fdfdfb] text-gray-800 flex flex-col md:flex-row h-screen w-screen overflow-hidden print:relative print:inset-auto print:overflow-visible print:bg-white">
      
      {/* MOBILE TOP APP BAR (Native App style, md:hidden) */}
      <header className="md:hidden bg-[#f4f4ec] border-b border-black/5 px-3.5 py-2.5 flex flex-col gap-2 shrink-0 shadow-2xs z-30 print:hidden">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white shrink-0 shadow-xs">
              <SpineLogo size={17} />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-serif font-bold text-gray-900 block">Vincent Osteo</span>
              <span className="text-[9px] uppercase tracking-widest font-bold text-primary/70">Gestion</span>
            </div>
          </div>

        <div className="flex items-center gap-2">
          {/* Language Selector compact */}
          <div className="flex items-center gap-0.5 bg-white/90 p-0.5 rounded-lg border border-black/5 shadow-2xs">
            {(['fr', 'en', 'es'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md transition-all ${
                  lang === l
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-gray-500 hover:bg-black/5'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Back to website button */}
          <button
            onClick={onClose}
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 hover:bg-white border border-black/5 rounded-xl text-xs font-semibold text-gray-700 hover:text-primary transition-all shadow-2xs active:scale-95"
            title={lang === 'fr' ? "Retour au site" : lang === 'es' ? "Volver al sitio" : "Back to website"}
            aria-label={lang === 'fr' ? "Retour au site" : lang === 'es' ? "Volver al sitio" : "Back to website"}
          >
            <ArrowLeft size={13} />
            <span className="text-[11px] font-medium hidden sm:inline">{lang === 'fr' ? "Site" : lang === 'es' ? "Sitio" : "Site"}</span>
          </button>
        </div>
      </div>

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="w-full flex items-center gap-1 overflow-x-auto pt-1 pb-0.5 no-scrollbar border-t border-black/5">
          {[
            { id: 'overview', label: t.admin.tabs.overview, icon: TrendingUp },
            { id: 'clients', label: t.admin.tabs.clients, icon: Users },
            { id: 'calendar', label: t.admin.tabs.calendar, icon: Calendar },
            { id: 'billing', label: t.admin.tabs.billing, icon: FileText },
            { id: 'reviews', label: lang === 'fr' ? 'Avis Google' : lang === 'es' ? 'Reseñas Google' : 'Google Reviews', icon: Star },
            { id: 'telegram', label: lang === 'fr' ? 'Notifications' : lang === 'es' ? 'Notificaciones' : 'Notifications', icon: Bell },
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'calendar') {
                    setCurrentCalendarDate(new Date());
                  }
                  setActiveTab(item.id as TabType);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-white/80 text-gray-600 hover:bg-white border border-black/5'
                }`}
              >
                <Icon size={12} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* DESKTOP SIDEBAR (hidden on mobile, md:flex) */}
      <aside className="hidden md:flex md:w-60 bg-[#f4f4ec] border-r border-black/5 flex-col justify-between shrink-0 p-5 print:hidden">
        <div className="flex flex-col gap-6">
          {/* Logo Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shrink-0 shadow-xs">
                <SpineLogo size={20} />
              </div>
              <div>
                <h1 className="text-base font-serif font-semibold tracking-tight leading-none">Vincent Osteo</h1>
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary/60">Gestion</span>
              </div>
            </div>

            {/* Language Selector compact */}
            <div className="flex items-center gap-0.5 bg-white/80 p-0.5 rounded-lg border border-black/5 shadow-2xs">
              {(['fr', 'en', 'es'] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-md transition-all ${
                    lang === l
                      ? 'bg-primary text-white shadow-xs'
                      : 'text-gray-500 hover:bg-black/5'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Back to website button */}
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-3.5 py-2 bg-white/80 hover:bg-white border border-black/5 rounded-xl text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-primary transition-all shadow-2xs w-full"
          >
            <ArrowLeft size={15} />
            <span>{lang === 'fr' ? "Retour au site" : lang === 'es' ? "Volver al sitio" : "Back to website"}</span>
          </button>

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5">
            {[
              { id: 'overview', label: t.admin.tabs.overview, icon: TrendingUp },
              { id: 'clients', label: t.admin.tabs.clients, icon: Users },
              { id: 'calendar', label: t.admin.tabs.calendar, icon: Calendar },
              { id: 'billing', label: t.admin.tabs.billing, icon: FileText },
              { id: 'reviews', label: lang === 'fr' ? 'Avis Google' : lang === 'es' ? 'Reseñas Google' : 'Google Reviews', icon: Star },
              { id: 'telegram', label: lang === 'fr' ? 'Notifications' : lang === 'es' ? 'Notificaciones' : 'Notifications', icon: Bell },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'calendar') {
                      setCurrentCalendarDate(new Date());
                    }
                    setActiveTab(item.id as TabType);
                  }}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap w-full text-xs font-semibold uppercase tracking-wider cursor-pointer ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/10' 
                      : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </span>
                  {item.id === 'telegram' && telegramStatus.enabled && telegramStatus.configured && (
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main ref={mainContentRef} className="flex-1 overflow-y-auto bg-[#fbfbfa] p-3.5 sm:p-6 md:p-8 pb-32 md:pb-16 flex flex-col print:hidden">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8 flex-1">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary">{t.admin.overview.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {lang === 'fr' 
                  ? "Statistiques de performance du cabinet et gestion locale." 
                  : lang === 'es' 
                    ? "Estadísticas de rendimiento de la clínica y gestión local." 
                    : "Clinic performance statistics and management."}
              </p>
            </div>

            {/* Metrics cards grid (Single row & compact) */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {/* Metric 1: Patients actifs */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-2xs flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 truncate">{t.admin.overview.stats.activePatients}</p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5 font-serif text-primary leading-tight">{totalPatientsCount}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Users size={18} className="sm:w-5 sm:h-5" />
                </div>
              </div>
              
              {/* Metric 2: Séances ce mois */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-2xs flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 truncate">{t.admin.overview.stats.thisMonthSessions}</p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5 font-serif text-primary leading-tight">{totalSessionsThisMonth}</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-primary shrink-0">
                  <Clock size={18} className="sm:w-5 sm:h-5" />
                </div>
              </div>

              {/* Metric 3: Chiffre d'affaires ce mois */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-black/5 shadow-2xs flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 truncate">{t.admin.overview.stats.monthlyIncome}</p>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5 font-serif text-primary leading-tight">{totalRevenueThisMonth} €</h3>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                  <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                </div>
              </div>
            </div>
            
            {/* DUPLICATE DETECTION & CLEANUP (Maintenance) */}
            {duplicateGroups.length > 0 && (
              <div className="bg-amber-50/70 p-6 rounded-3xl border border-amber-200/80 shadow-xs space-y-4">
                 <div className="flex items-start gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                     <AlertTriangle size={24} />
                   </div>
                   <div className="flex-1">
                     <h3 className="text-xl font-serif font-bold text-amber-900 leading-tight">
                       {lang === 'fr' ? "Nettoyage des doublons" : lang === 'es' ? "Limpieza de duplicados" : "Duplicate Cleanup"}
                     </h3>
                     <p className="text-sm text-amber-800/80 mt-0.5">
                       {lang === 'fr' 
                         ? `Nous avons détecté ${duplicateGroups.length} patient(s) avec des comptes en double. Gardez le profil avec le plus d'enregistrements et supprimez les autres.` 
                         : lang === 'es'
                         ? `Hemos detectado ${duplicateGroups.length} paciente(s) con cuentas duplicadas. Mantenga el perfil con más registros y elimine los demás.`
                         : `Detected ${duplicateGroups.length} patient(s) with duplicate accounts. Keep the profile with more records and delete the others.`}
                     </p>
                   </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {duplicateGroups.map((group, idx) => (
                     <div key={idx} className="bg-white p-5 rounded-2xl border border-amber-200/60 shadow-xs space-y-3">
                       <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                         <p className="text-base font-bold text-gray-900 truncate">{group.name}</p>
                         <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                           {group.clients.length} {lang === 'fr' ? 'profils' : lang === 'es' ? 'perfiles' : 'profiles'}
                         </span>
                       </div>
                       
                       <div className="space-y-3">
                         {group.clients.map((c, cIdx) => (
                           <div key={c.id} className={`p-3 rounded-xl text-xs space-y-2 border transition-all ${cIdx === 0 ? 'bg-emerald-50/40 border-emerald-100' : 'bg-gray-50 border-gray-100'}`}>
                             <div className="flex items-center justify-between gap-2">
                               <div className="flex items-center gap-2">
                                 <span className="font-mono text-[9px] text-gray-400 font-bold">{c.id.substring(0, 8)}...</span>
                                 {cIdx === 0 && (
                                   <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-widest">
                                     {lang === 'fr' ? 'Conserver' : lang === 'es' ? 'Conservar' : 'Keep'}
                                   </span>
                                 )}
                               </div>
                               <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${c.totalRecords > 0 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                 {c.totalRecords} {lang === 'fr' ? 'enreg.' : lang === 'es' ? 'reg.' : 'records'}
                               </span>
                             </div>
                             
                             <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-500 font-medium">
                               <div className="flex items-center gap-1"><FileText size={10} className="text-primary/60" /> {c.noteCount} {lang === 'fr' ? 'notes' : lang === 'es' ? 'notas' : 'notes'}</div>
                               <div className="flex items-center gap-1"><CreditCard size={10} className="text-primary/60" /> {c.invoiceCount} {lang === 'fr' ? 'factures' : lang === 'es' ? 'facturas' : 'invoices'}</div>
                               <div className="flex items-center gap-1"><CalendarIcon size={10} className="text-primary/60" /> {c.eventCount} {lang === 'fr' ? 'RDV' : lang === 'es' ? 'citas' : 'events'}</div>
                             </div>
                             
                             {cIdx > 0 && (
                               <button 
                                 type="button"
                                 onClick={() => handleDeleteClient(c.id)}
                                 className="w-full mt-1.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 rounded-xl text-[10px] font-bold border border-rose-200 hover:border-rose-300 transition-all shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
                               >
                                 <Trash2 size={11} />
                                 <span>{lang === 'fr' ? 'Supprimer ce doublon' : lang === 'es' ? 'Eliminar duplicado' : 'Delete duplicate'}</span>
                               </button>
                             )}
                           </div>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {/* AGENDA DU CABINET DIRECT SUR L'APERÇU */}
            {(() => {
              const now = currentTime;
              const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
              
              const todayEvents = events.filter(ev => {
                try {
                  const evDate = new Date(ev.start);
                  const evStr = `${evDate.getFullYear()}-${String(evDate.getMonth() + 1).padStart(2, '0')}-${String(evDate.getDate()).padStart(2, '0')}`;
                  return evStr === todayStr;
                } catch {
                  return false;
                }
              }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

              const todayAppointmentsCount = todayEvents.filter(ev => !ev.eventType || ev.eventType === 'appointment').length;

              const upcomingEvents = events.filter(ev => {
                try {
                  const isAppt = !ev.eventType || ev.eventType === 'appointment';
                  return isAppt && new Date(ev.start).getTime() >= currentTime.getTime();
                } catch {
                  return false;
                }
              }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 6);

              return (
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <CalendarIcon size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-serif font-bold text-primary">
                          {lang === 'fr' ? "Agenda" : lang === 'es' ? "Agenda" : "Agenda"}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {lang === 'fr' 
                            ? "Consultez vos rendez-vous et cliquez sur \"Prise de notes\" pour ouvrir directement le dossier patient." 
                            : lang === 'es'
                              ? "Consulte sus citas y haga clic en \"Tomar notas\" para abrir directamente la ficha del paciente."
                              : "View appointments and click \"Take Notes\" to open the patient file directly."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTab('telegram')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
                          telegramStatus.enabled && telegramStatus.configured
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-[#f4f4ec] hover:bg-black/5 text-gray-600 border-black/5'
                        }`}
                        title={
                          lang === 'fr'
                            ? 'Configurer les notifications matinales'
                            : lang === 'es'
                              ? 'Configurar notificaciones matinales'
                              : 'Configure morning notifications'
                        }
                      >
                        <Bell size={13} />
                        <span>
                          {telegramStatus.enabled && telegramStatus.configured
                            ? `${lang === 'es' ? 'Notificaciones' : 'Notifications'} ${telegramStatus.sendTime || '08:00'}`
                            : lang === 'es' ? 'Notificaciones' : 'Notifications'}
                        </span>
                      </button>
                      <button
                        onClick={() => setIsAddEventOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Plus size={14} />
                        <span>{lang === 'fr' ? "Nouveau RDV" : lang === 'es' ? "Nueva cita" : "New Appointment"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setCurrentCalendarDate(new Date());
                          setActiveTab('calendar');
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f4ec] hover:bg-black/5 text-gray-700 rounded-2xl text-xs font-bold transition-all border border-black/5"
                      >
                        <span>{lang === 'fr' ? "Voir l'agenda complet" : lang === 'es' ? "Ver agenda completa" : "Full calendar"}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Appointments list */}
                  {todayEvents.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {lang === 'fr' ? "Consultations prévues aujourd'hui" : lang === 'es' ? "Consultas previstas hoy" : "Appointments scheduled today"} ({todayAppointmentsCount})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {todayEvents.map((event, idx) => {
                          const isOther = event.eventType && event.eventType !== 'appointment';
                          const timeStatus = getAppointmentTimeStatus(event);
                          const localeCode = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';
                          const startTime = new Date(event.start).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });
                          const endTime = new Date(event.end).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' });

                          return (
                            <div 
                              key={event.id ? `${event.id}-${idx}` : `today-${idx}`} 
                              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 group ${
                                isOther 
                                  ? 'bg-amber-50/50 hover:bg-amber-50/80 border-amber-200/80' 
                                  : timeStatus.isOngoing
                                  ? 'bg-teal-50/80 hover:bg-teal-50 border-teal-300 ring-2 ring-teal-400/40 shadow-sm'
                                  : timeStatus.isPast
                                  ? 'bg-[#fafafa] hover:bg-white border-black/5 opacity-85 hover:opacity-100'
                                  : 'bg-emerald-50/50 hover:bg-emerald-50/90 border-emerald-200/60'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                                    isOther 
                                      ? 'bg-amber-100 text-amber-900' 
                                      : timeStatus.isOngoing
                                      ? 'bg-teal-600 text-white shadow-xs'
                                      : timeStatus.isPast
                                      ? 'bg-gray-100 text-gray-500'
                                      : 'bg-emerald-100 text-emerald-800'
                                  }`}>
                                    {isOther ? <Lock size={15} /> : <Clock size={16} />}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4 className="text-xs font-bold text-gray-900 leading-tight">
                                        {getEventDisplayName(event)}
                                      </h4>
                                      {isOther ? (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200/80 text-amber-900 border border-amber-300">
                                          {getEventTypeLabel(event.eventType)}
                                        </span>
                                      ) : timeStatus.isOngoing ? (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-teal-600 text-white animate-pulse flex items-center gap-1 shadow-xs">
                                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                          {lang === 'fr' ? 'En cours' : lang === 'es' ? 'En curso' : 'In progress'}
                                        </span>
                                      ) : timeStatus.isPast ? (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-gray-200 text-gray-700">
                                          {lang === 'fr' ? 'Terminé' : lang === 'es' ? 'Terminada' : 'Completed'}
                                        </span>
                                      ) : (
                                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-600 text-white">
                                          {lang === 'fr' ? 'À venir' : lang === 'es' ? 'Próxima' : 'Upcoming'}
                                        </span>
                                      )}
                                    </div>
                                    <p className={`text-[11px] font-semibold mt-1 ${
                                      isOther 
                                        ? 'text-amber-800' 
                                        : timeStatus.isOngoing
                                        ? 'text-teal-900 font-bold'
                                        : timeStatus.isPast
                                        ? 'text-gray-500'
                                        : 'text-emerald-800'
                                    }`}>
                                      {startTime} - {endTime}
                                    </p>
                                    {event.description && (
                                      <p className="text-[10px] text-gray-500 mt-1 line-clamp-1 italic">
                                        {event.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => openEditEventModal(event)}
                                  className={`p-1.5 rounded-lg transition-all opacity-70 group-hover:opacity-100 ${
                                    isOther ? 'hover:bg-amber-200 text-amber-900' : 'hover:bg-emerald-200/60 text-emerald-800'
                                  }`}
                                  title={lang === 'fr' ? "Modifier l'événement" : lang === 'es' ? "Editar evento" : "Edit event"}
                                >
                                  <Pencil size={13} />
                                </button>
                              </div>

                              {/* Action bar on appointment card */}
                              <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                                isOther ? 'border-amber-200/60' : 'border-emerald-200/40'
                              }`}>
                                <span className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">
                                  {getEventDisplayName(event)}
                                </span>
                                {isOther ? (
                                  <button
                                    onClick={() => openEditEventModal(event)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                  >
                                    <Pencil size={12} />
                                    <span>{lang === 'fr' ? "Modifier" : lang === 'es' ? "Editar" : "Edit"}</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleGoToNotes(event)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-xs group/btn"
                                    title={lang === 'fr' ? "Ouvrir la fiche médicale et rédiger les notes cliniques" : lang === 'es' ? "Abrir la ficha médica y redactar notas clínicas" : "Open medical record and write clinical notes"}
                                  >
                                    <FileCheck size={13} />
                                    <span>{lang === 'fr' ? "Prise de notes" : lang === 'es' ? "Tomar notas" : "Take Notes"}</span>
                                    <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-2">
                      <div className="p-4 rounded-2xl bg-[#fafafa] border border-black/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                            <Clock size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-700">
                              {lang === 'fr' ? "Aucun rendez-vous prévu pour aujourd'hui." : lang === 'es' ? "No hay citas programadas para hoy." : "No appointments scheduled for today."}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsAddEventOpen(true)}
                          className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all"
                        >
                          {lang === 'fr' ? "+ Planifier un rendez-vous" : lang === 'es' ? "+ Programar una cita" : "+ Schedule appointment"}
                        </button>
                      </div>

                      {/* Prochains rendez-vous à venir */}
                      {upcomingEvents.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            {lang === 'fr' ? "Prochaines consultations à venir" : lang === 'es' ? "Próximas consultas" : "Upcoming appointments"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {upcomingEvents.map((event, idx) => {
                              const isOther = event.eventType && event.eventType !== 'appointment';
                              const localeCode = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';
                              return (
                                <div
                                  key={event.id ? `${event.id}-${idx}` : `upcoming-${idx}`}
                                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 shadow-2xs group ${
                                    isOther 
                                      ? 'bg-amber-50/40 hover:bg-amber-50/80 border-amber-200/70' 
                                      : 'bg-white hover:bg-[#fafafa] border-black/5 hover:border-primary/20'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-1">
                                      <span>
                                        {new Date(event.start).toLocaleDateString(localeCode, { weekday: 'short', day: 'numeric', month: 'short' })}
                                      </span>
                                      <span className={isOther ? "text-amber-800 font-bold" : "text-primary font-bold"}>
                                        {new Date(event.start).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <h5 className="text-xs font-bold text-gray-800 line-clamp-1">
                                        {getEventDisplayName(event)}
                                      </h5>
                                      {isOther && (
                                        <span className="text-[8px] font-bold px-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                          {getEventTypeLabel(event.eventType)}
                                        </span>
                                      )}
                                    </div>
                                    {event.clientName && event.summary && event.summary !== event.clientName && 
                                     event.summary !== "Sesión de osteopatía" && event.summary !== "Séance d'ostéopathie" && 
                                     event.summary !== "Osteopathy session" && (
                                      <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                                        {event.summary}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                                    <button
                                      onClick={() => openEditEventModal(event)}
                                      className="text-[11px] text-gray-500 hover:text-primary transition-colors flex items-center gap-1 font-medium"
                                    >
                                      <Pencil size={11} />
                                      <span>{lang === 'fr' ? "Détails" : lang === 'es' ? "Detalles" : "Details"}</span>
                                    </button>
                                    {!isOther && (
                                      <button
                                        onClick={() => handleGoToNotes(event)}
                                        className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-[11px] font-bold transition-all"
                                        title={lang === 'fr' ? "Ouvrir la fiche et prendre des notes" : lang === 'es' ? "Abrir la ficha y tomar notas" : "Open file and take notes"}
                                      >
                                        <FileCheck size={11} />
                                        <span>{lang === 'fr' ? "Notes" : lang === 'es' ? "Notas" : "Notes"}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Financial Performance Chart (Full width) */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
              <div>
                <h3 className="text-lg font-bold font-serif text-primary mb-1">{t.admin.overview.revenueChart}</h3>
                <p className="text-xs text-gray-500 mb-6">
                  {lang === 'fr' 
                    ? `Récapitulatif financier et volume de consultations par mois pour l'année en cours (${new Date().getFullYear()}).` 
                    : lang === 'es' 
                      ? `Resumen financiero y volumen de consultas por mes para el año en curso (${new Date().getFullYear()}).` 
                      : `Financial summary and volume of consultations per month for the current year (${new Date().getFullYear()}).`}
                </p>
              </div>
              
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#415a44" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#415a44" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }} 
                      labelClassName="font-serif font-bold text-primary"
                    />
                    <Area type="monotone" dataKey="Montant" stroke="#415a44" strokeWidth={2} fillOpacity={1} fill="url(#revenueGrad)" name="Revenu (€)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT DIRECTORY & NOTES */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
            
            {/* List and Search column */}
            <div className={`bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm lg:col-span-4 xl:col-span-4 flex flex-col lg:sticky lg:top-24 max-h-[82vh] relative ${selectedClient ? 'hidden lg:flex' : 'flex'}`}>
              <div className="flex items-center justify-between mb-4 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold font-serif text-primary">{t.admin.clients.title}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {filteredClients.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? "Fiches et dossiers médicaux" : lang === 'es' ? "Expedientes y notas médicas" : "Medical records"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddClientOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-primary text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xs cursor-pointer shrink-0"
                  title={t.admin.clients.addPatient}
                >
                  <Plus size={15} />
                  <span>{lang === 'fr' ? 'Nouveau' : lang === 'es' ? 'Nuevo' : 'New'}</span>
                </button>
              </div>

              {/* Pending Drafts Notice Box */}
              {allActiveDrafts.length > 0 && (
                <div className="mb-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0">
                        <StickyNote size={13} />
                      </div>
                      <span className="text-xs font-bold text-amber-950">
                        {lang === 'fr' ? `Brouillons en attente (${allActiveDrafts.length})` : lang === 'es' ? `Borradores pendientes (${allActiveDrafts.length})` : `Pending Drafts (${allActiveDrafts.length})`}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {allActiveDrafts.map((d) => (
                      <div key={d.key} className="flex items-center justify-between gap-2 p-2 bg-white/90 rounded-xl border border-amber-200/60 text-xs shadow-2xs">
                        <button
                          type="button"
                          onClick={() => {
                            const targetCl = d.client || clients.find(c => c.id === d.clientId);
                            if (targetCl) {
                              setSelectedClient(targetCl);
                            }
                            setNewNote({
                              anamnese: d.anamnese || '',
                              treatment: d.treatment || '',
                              category: d.category || 'treatment',
                              date: d.date || new Date().toISOString().split('T')[0],
                              motif: d.motif || '',
                              eventId: d.eventId || '',
                            });
                            setActiveDraftNotice(true);
                            setTimeout(() => {
                              const noteFormElem = document.getElementById('new-note-form');
                              if (noteFormElem) {
                                noteFormElem.scrollIntoView({ behavior: 'smooth' });
                                const firstField = noteFormElem.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
                                if (firstField) firstField.focus();
                              }
                            }, 100);
                          }}
                          className="flex-1 text-left min-w-0 cursor-pointer"
                        >
                          <p className="font-bold text-amber-950 truncate">{d.client?.name || d.clientName || 'Patient'}</p>
                          <p className="text-[10px] text-amber-800/80 truncate">
                            {d.motif || d.anamnese.substring(0, 40) || (lang === 'fr' ? 'Brouillon de consultation' : 'Draft note')}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const current = getStoredDrafts();
                            delete current[d.key];
                            localStorage.setItem(NOTE_DRAFTS_STORAGE_KEY, JSON.stringify(current));
                            setDraftsMap({ ...current });
                            api.deleteRemoteDraft(d.clientId, d.eventId);
                          }}
                          className="p-1 text-amber-700/60 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                          title={lang === 'fr' ? "Supprimer ce brouillon" : "Discard draft"}
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Search bar */}
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'fr' ? "Rechercher par nom, tél, DNI..." : lang === 'es' ? "Buscar por nombre, tel, DNI..." : "Search patient..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-secondary border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

              {/* Patients list container with visible scroll cue */}
              <div className="relative flex-1 min-h-0 flex flex-col">
                {/* Subtle top shadow when scrolled */}
                {isScrolledPatients && (
                  <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/5 to-transparent pointer-events-none z-10 transition-opacity" />
                )}

                <div 
                  ref={patientListRef}
                  onScroll={checkPatientScroll}
                  className="flex-1 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin scrollbar-thumb-stone-300 hover:scrollbar-thumb-stone-400"
                >
                  {canScrollPatientsDown && (
                    <button 
                      onClick={handleScrollPatientsDown} 
                      className="absolute bottom-2 right-4 p-1.5 bg-primary/10 rounded-full text-primary z-20 hover:bg-primary/20"
                    >
                      <ChevronDown size={16} />
                    </button>
                  )}
                  {filteredClients.map((c, idx) => {
                    const isSelected = selectedClient?.id === c.id;
                    return (
                      <div
                        key={c.id ? `${c.id}-${idx}` : `client-${idx}`}
                        className={`group w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${
                          isSelected 
                            ? 'bg-primary/5 border-primary/20 shadow-sm' 
                            : 'border-transparent hover:bg-black/5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClient(c);
                            const found = getClientDraft(c.id);
                            if (found) {
                              setNewNote({
                                anamnese: found.draft.anamnese || '',
                                treatment: found.draft.treatment || '',
                                category: found.draft.category || 'treatment',
                                date: found.draft.date || new Date().toISOString().split('T')[0],
                                motif: found.draft.motif || '',
                                eventId: found.draft.eventId || '',
                              });
                              setActiveDraftNotice(true);
                            }
                          }}
                          className="flex-1 flex items-center gap-3 overflow-hidden text-left cursor-pointer"
                        >
                          <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                            isSelected ? 'bg-primary text-white shadow-xs' : 'bg-primary/10 text-primary'
                          }`}>
                            <User size={18} />
                          </div>
                          <div className="overflow-hidden min-w-0">
                            <p className="text-xs font-bold truncate flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{c.name}</span>
                              {c.profileNote && (
                                <span className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded-full text-[9px] font-semibold shrink-0" title={c.profileNote}>
                                  <Pin size={9} className="fill-amber-700/40" />
                                  <span>Note</span>
                                </span>
                              )}
                              {hasClientDraft(c.id) && (
                                <span className="inline-flex items-center gap-0.5 text-amber-800 bg-amber-100/90 border border-amber-300/60 px-1.5 py-0.2 rounded-full text-[9px] font-semibold shrink-0" title={lang === 'fr' ? "Brouillon de consultation en cours" : "Draft in progress"}>
                                  <StickyNote size={9} className="text-amber-700" />
                                  <span>{lang === 'fr' ? "Brouillon" : "Draft"}</span>
                                </span>
                              )}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 truncate mt-0.5">
                              {c.dni && (
                                <span className="font-semibold text-primary/90 bg-primary/10 px-1.5 py-0.2 rounded text-[9px] font-mono shrink-0">
                                  {c.dni}
                                </span>
                              )}
                              <span className="truncate">{c.phone || c.email}</span>
                            </div>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClient(c.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title={lang === 'fr' ? "Supprimer le patient" : "Delete patient"}
                          >
                            <Trash2 size={13} />
                          </button>
                          <ChevronRight size={14} className={isSelected ? 'text-primary' : 'text-gray-300'} />
                        </div>
                      </div>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <div className="py-12 text-center">
                      <Users className="mx-auto text-gray-300 mb-2" size={28} />
                      <p className="text-xs text-gray-400">
                        {lang === 'fr' ? "Aucun patient trouvé." : lang === 'es' ? "No se encontraron pacientes." : "No patients found."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Explicit Scroll Affordance Banner */}
                {filteredClients.length > 4 && (
                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[11px] text-gray-500">
                    <span className="font-medium text-[11px] text-gray-500">
                      {filteredClients.length} {lang === 'fr' ? 'patients' : lang === 'es' ? 'pacientes' : 'patients'}
                    </span>
                    {canScrollPatientsDown ? (
                      <button
                        type="button"
                        onClick={handleScrollPatientsDown}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer animate-pulse"
                        title={lang === 'fr' ? 'Faites défiler vers le bas' : 'Desplace hacia abajo'}
                      >
                        <span>{lang === 'fr' ? 'Défiler pour voir plus' : lang === 'es' ? 'Desplazar abajo' : 'Scroll down'}</span>
                        <ChevronDown size={12} />
                      </button>
                    ) : (
                      <span className="text-[10px] text-gray-400">
                        {lang === 'fr' ? 'Fin de liste' : lang === 'es' ? 'Fin de lista' : 'End of list'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Detailed clinical card column */}
            <div className={`lg:col-span-8 xl:col-span-8 flex flex-col ${!selectedClient ? 'hidden lg:flex' : 'flex'}`}>
              {selectedClient ? (
                <div className="space-y-6 flex flex-col flex-1">
                  
                  {/* Mobile Back Button to Patient Directory */}
                  <div className="lg:hidden">
                    <button
                      type="button"
                      onClick={() => setSelectedClient(null)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-gray-700 hover:text-primary rounded-2xl border border-black/5 text-xs font-bold shadow-2xs active:scale-95 transition-all cursor-pointer"
                    >
                      <ArrowLeft size={14} className="text-primary" />
                      <span>{lang === 'fr' ? "← Liste des patients" : lang === 'es' ? "← Lista de pacientes" : "← Patient list"}</span>
                    </button>
                  </div>

                  {/* Patient Info Header card */}
                  <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5 sm:gap-4">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 bg-primary/15 rounded-full flex items-center justify-center text-primary font-serif font-bold text-2xl shrink-0">
                          <User size={26} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xl sm:text-2xl font-bold font-serif text-primary leading-tight">{selectedClient.name}</h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500">
                            <p>
                              {lang === 'fr' ? "Date de naissance" : lang === 'es' ? "Fecha de nacimiento" : "Date of birth"} : {selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US') : (lang === 'fr' ? 'Non renseignée' : lang === 'es' ? 'No especificado' : 'Not specified')}
                            </p>
                            {selectedClient.dni && (
                              <span className="inline-flex items-center gap-1 font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[11px] font-mono">
                                <IdCard size={12} />
                                <span>DNI / NIE : {selectedClient.dni}</span>
                              </span>
                            )}
                          </div>
                          
                          {/* Bono / Discount status */}
                          {selectedClient.hasBono && (
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                                <BadgePercent size={13} className="text-emerald-600" />
                                <span>{formatLocalizedBonoText(selectedClient.bonoType, lang) || 'Bono'}</span>
                                {typeof selectedClient.bonoSessionsRemaining === 'number' && (
                                  <span className="text-emerald-800 font-bold bg-white px-2 py-0.5 rounded-full text-[10px] shadow-xs border border-emerald-200">
                                    {selectedClient.bonoSessionsRemaining} {lang === 'fr' ? 'séance(s) restante(s)' : lang === 'es' ? 'sesión(es) restante(s)' : 'remaining session(s)'}
                                  </span>
                                )}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingClient(selectedClient);
                                  setIsEditClientOpen(true);
                                }}
                                className="text-[11px] text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil size={11} /> {lang === 'fr' ? 'Gérer le Bono' : lang === 'es' ? 'Gestionar Bono' : 'Manage Bono'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Top Action Buttons Group & Contact lines */}
                      <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingClient(selectedClient);
                              setIsEditClientOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-black/5 text-gray-700 rounded-xl border border-black/5 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                            title={lang === 'fr' ? "Modifier la fiche du patient" : lang === 'es' ? "Editar ficha del paciente" : "Edit patient file"}
                          >
                            <Pencil size={13} className="text-gray-500" />
                            <span>{lang === 'fr' ? 'Modifier la fiche' : lang === 'es' ? 'Editar ficha' : 'Edit file'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(selectedClient.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl border border-rose-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                            title={lang === 'fr' ? "Supprimer ce patient" : lang === 'es' ? "Eliminar paciente" : "Delete patient"}
                          >
                            <Trash2 size={13} className="text-rose-500" />
                            <span>{lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : 'Delete'}</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap sm:flex-nowrap md:flex-col gap-1.5 text-xs text-gray-600 md:text-right">
                          {selectedClient.phone && (
                            <a href={`tel:${selectedClient.phone}`} className="hover:text-primary font-bold flex items-center md:justify-end gap-1.5 transition-colors">
                              <Phone size={12} className="text-primary" /> <span>{selectedClient.phone}</span>
                            </a>
                          )}
                          {selectedClient.email && (
                            <a href={`mailto:${selectedClient.email}`} className="hover:text-primary text-gray-500 flex items-center md:justify-end gap-1.5 truncate transition-colors max-w-[220px]">
                              <Mail size={12} className="text-primary shrink-0" /> <span className="truncate">{selectedClient.email}</span>
                            </a>
                          )}
                          {selectedClient.address && (
                            <p className="text-[10px] text-gray-400 flex items-center md:justify-end gap-1.5">
                              <MapPin size={10} className="text-primary shrink-0" /> <span>{selectedClient.address}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Patient Quick Profile Note Card (Note / Remarque fixe du profil) */}
                    <div className="mt-3 pt-3 border-t border-black/5">
                      <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3.5 shadow-xs transition-all">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                            <Pin size={13} className="text-amber-700 fill-amber-700/30" />
                            <span>{lang === 'fr' ? 'Remarque / Note profil' : lang === 'es' ? 'Nota de perfil' : 'Profile note'}</span>
                          </div>
                          {selectedClient.profileNote && !isEditingProfileNote && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setProfileNoteInput(selectedClient.profileNote || '');
                                  setIsEditingProfileNote(true);
                                }}
                                className="p-1 px-2.5 text-amber-900 hover:text-primary hover:bg-amber-200/60 rounded-lg transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer bg-white/70 border border-amber-200/60"
                                title={lang === 'fr' ? 'Modifier la remarque du profil' : 'Edit profile note'}
                              >
                                <Pencil size={12} />
                                <span>{lang === 'fr' ? 'Modifier' : 'Edit'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleDeleteProfileNote}
                                className="p-1 px-2.5 text-rose-700 hover:text-rose-800 hover:bg-rose-100/80 rounded-lg transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer bg-white/70 border border-rose-200/60"
                                title={lang === 'fr' ? 'Supprimer la remarque du profil' : 'Delete profile note'}
                              >
                                <Trash2 size={12} />
                                <span>{lang === 'fr' ? 'Supprimer' : 'Delete'}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditingProfileNote ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              value={profileNoteInput}
                              onChange={(e) => setProfileNoteInput(e.target.value)}
                              rows={2}
                              placeholder={lang === 'fr' ? 'Saisissez une remarque ou note d\'information pour ce patient (ex: vient toujours le matin, allergie au baume, contact WhatsApp...)...' : 'Enter a profile note...'}
                              className="w-full p-2.5 bg-white rounded-xl border border-amber-300 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none shadow-inner"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingProfileNote(false)}
                                className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-200 cursor-pointer"
                              >
                                {lang === 'fr' ? 'Annuler' : 'Cancel'}
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveProfileNote}
                                className="px-3.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Check size={13} />
                                <span>{lang === 'fr' ? 'Enregistrer' : 'Save'}</span>
                              </button>
                            </div>
                          </div>
                        ) : selectedClient.profileNote ? (
                          <p className="text-xs text-amber-950 font-medium leading-relaxed whitespace-pre-wrap pl-0.5 pt-0.5">
                            {selectedClient.profileNote}
                          </p>
                        ) : (
                          <div className="flex items-center justify-between gap-2 pt-0.5">
                            <p className="text-xs text-amber-800/80 italic">
                              {lang === 'fr' ? 'Aucune remarque ou note profil enregistrée.' : 'No profile note.'}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setProfileNoteInput('');
                                setIsEditingProfileNote(true);
                              }}
                              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 rounded-xl text-xs font-bold transition-all border border-amber-300/80 shadow-2xs flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Plus size={12} />
                              <span>{lang === 'fr' ? 'Ajouter une remarque' : 'Add note'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patient Quick Add / Continue Draft Button */}
                    <div className="flex items-center justify-end pt-3 border-t border-black/5">
                      {selectedClient && hasClientDraft(selectedClient.id) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const found = getClientDraft(selectedClient.id);
                            if (found) {
                              setNewNote({
                                anamnese: found.draft.anamnese || '',
                                treatment: found.draft.treatment || '',
                                category: found.draft.category || 'treatment',
                                date: found.draft.date || new Date().toISOString().split('T')[0],
                                motif: found.draft.motif || '',
                                eventId: found.draft.eventId || '',
                              });
                              setActiveDraftNotice(true);
                            }
                            const noteFormElem = document.getElementById('new-note-form');
                            if (noteFormElem) {
                              noteFormElem.scrollIntoView({ behavior: 'smooth' });
                              const firstField = noteFormElem.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
                              if (firstField) firstField.focus();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-xs cursor-pointer border border-amber-500"
                        >
                          <StickyNote size={13} className="text-amber-200" />
                          <span>{lang === 'fr' ? 'Continuer le brouillon' : lang === 'es' ? 'Continuar borrador' : 'Continue draft'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const noteFormElem = document.getElementById('new-note-form');
                            if (noteFormElem) {
                              noteFormElem.scrollIntoView({ behavior: 'smooth' });
                              const firstField = noteFormElem.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
                              if (firstField) firstField.focus();
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                        >
                          <Plus size={13} />
                          <span>{lang === 'fr' ? 'Ajouter une note' : lang === 'es' ? 'Añadir una nota' : 'Add a note'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Patient Appointments Card - Directly links Agenda & Medical Dossier */}
                  {(() => {
                    const patientAppointments = events.filter(ev => {
                      if (ev.eventType && ev.eventType !== 'appointment') return false;
                      if (ev.clientId === selectedClient.id) return true;
                      if (ev.clientName && ev.clientName.trim().toLowerCase() === selectedClient.name.trim().toLowerCase()) return true;
                      return false;
                    });

                    const todayStr = new Date().toISOString().split('T')[0];
                    const upcomingAppointments = patientAppointments.filter(ev => {
                      const evDateStr = ev.start ? ev.start.split('T')[0] : '';
                      const isToday = evDateStr === todayStr;
                      const isFuture = new Date(ev.start).getTime() > currentTime.getTime();
                      return isFuture && !isToday;
                    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                    const pastOrTodayAppointments = patientAppointments.filter(ev => {
                      const evDateStr = ev.start ? ev.start.split('T')[0] : '';
                      const isToday = evDateStr === todayStr;
                      const isFuture = new Date(ev.start).getTime() > currentTime.getTime();
                      return !isFuture || isToday;
                    }).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

                    return (
                      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                              <CalendarIcon size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                <span>{lang === 'fr' ? 'Rendez-vous associés au dossier' : lang === 'es' ? 'Citas asociadas al expediente' : 'Appointments on file'}</span>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  {patientAppointments.length}
                                </span>
                              </h4>
                              <p className="text-[11px] text-gray-500">
                                {lang === 'fr' 
                                  ? 'Consultations du jour, passées et à venir' 
                                  : 'Today, past and upcoming consultations'}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setNewEvent(prev => ({
                                ...prev,
                                clientId: selectedClient.id,
                                title: selectedClient.name,
                                eventType: 'appointment'
                              }));
                              setIsInlineNewPatient(false);
                              setIsAddEventOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white hover:bg-primary/95 transition-all shadow-xs cursor-pointer"
                          >
                            <Plus size={13} />
                            <span>{lang === 'fr' ? 'Planifier un RDV' : lang === 'es' ? 'Programar cita' : 'Schedule appointment'}</span>
                          </button>
                        </div>

                        {/* Upcoming Appointments in less detailed format just above */}
                        {upcomingAppointments.length > 0 && (
                          <div className="space-y-2 pt-1 pb-2 border-b border-black/5">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 px-1">
                              <Clock size={13} className="text-emerald-600" />
                              <span>{lang === 'fr' ? 'Rendez-vous à venir' : lang === 'es' ? 'Próximas citas' : 'Upcoming appointments'} ({upcomingAppointments.length})</span>
                            </h5>
                            <div className="space-y-2">
                              {upcomingAppointments.map((ev, idx) => {
                                const evDate = new Date(ev.start);
                                const dateStr = evDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                });
                                const timeStr = `${evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                return (
                                  <div key={ev.id ? `${ev.id}-${idx}` : `up-app-${idx}`} className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                                      <div className="min-w-0">
                                        <p className="font-bold text-gray-900 truncate">{ev.summary || (lang === 'fr' ? "Séance d'ostéopathie" : "Osteopathy session")}</p>
                                        <p className="text-[11px] text-gray-500 font-medium">{dateStr} • <span className="font-mono">{timeStr}</span></p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => openEditEventModal(ev)}
                                        className="px-2.5 py-1 bg-white hover:bg-emerald-100/80 text-emerald-800 rounded-lg text-[10px] font-bold transition-all border border-emerald-200 cursor-pointer"
                                      >
                                        {lang === 'fr' ? 'Modifier' : lang === 'es' ? 'Editar' : 'Edit'}
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Past and Today's Appointments (Detailed) */}
                        {pastOrTodayAppointments.length > 0 ? (
                          <div className="space-y-2">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 px-1 pt-1">
                              <span>{lang === 'fr' ? "Rendez-vous du jour et passés" : lang === 'es' ? "Citas de hoy y pasadas" : "Today and past appointments"} ({pastOrTodayAppointments.length})</span>
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {pastOrTodayAppointments.map((ev, idx) => {
                                const evDate = new Date(ev.start);
                                const timeStatus = getAppointmentTimeStatus(ev);
                                const isOngoing = timeStatus.isOngoing;
                                const isUpcoming = timeStatus.isUpcoming;
                                const isPast = timeStatus.isPast;
                                const dateStr = evDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                });
                                const timeStr = `${evDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
                                const getLocalDateStr = (dStr?: string) => {
                                  if (!dStr) return '';
                                  try {
                                    const d = new Date(dStr);
                                    if (isNaN(d.getTime())) return dStr.split('T')[0] || '';
                                    const pad = (n: number) => n < 10 ? '0' + n : String(n);
                                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                                  } catch {
                                    return dStr.split('T')[0] || '';
                                  }
                                };
                                const evDateStr = getLocalDateStr(ev.start);

                                // 1. Associated clinical notes (by eventId with date fallback)
                                let associatedNotes = clientNotes.filter(n => Boolean(n.eventId && n.eventId === ev.id));
                                if (associatedNotes.length === 0) {
                                  associatedNotes = clientNotes.filter(n => {
                                    const nDateStr = getLocalDateStr(n.date);
                                    return nDateStr === evDateStr;
                                  });
                                }
                                const hasNote = associatedNotes.length > 0;
                                const firstNote = associatedNotes[0];

                                // 2. Associated invoices / payments
                                const associatedInvoices = invoices.filter(inv => {
                                  if (inv.eventId && inv.eventId === ev.id) return true;
                                  if (inv.noteId && inv.noteId === ev.id) return true;
                                  if (inv.noteId && associatedNotes.some(n => n.id === inv.noteId)) return true;
                                  const isSameClient = inv.clientId === (ev.clientId || selectedClient?.id) || (
                                    selectedClient && inv.clientName && selectedClient.name &&
                                    inv.clientName.trim().toLowerCase() === selectedClient.name.trim().toLowerCase()
                                  );
                                  if (isSameClient) {
                                    const invDateStr = getLocalDateStr(inv.date);
                                    const invPayDateStr = getLocalDateStr(inv.paymentDate);
                                    if (invDateStr === evDateStr || invPayDateStr === evDateStr) {
                                      return true;
                                    }
                                  }
                                  return false;
                                });

                                const bonoInvoice = associatedInvoices.find(inv => 
                                  inv.amount === 0 || inv.isBonoRedemption || (inv.discountType === 'bono' && inv.amount === 0) || (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('décomptée'))
                                );

                                const bonoPurchaseInvoice = associatedInvoices.find(inv => 
                                  inv.status === 'paid' && inv.amount > 0 &&
                                  (inv.discountType === 'bono' || (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('bono')))
                                ) || invoices.find(inv => {
                                  const isClientMatch = inv.clientId === (ev.clientId || selectedClient?.id) || (
                                    selectedClient && inv.clientName && selectedClient.name &&
                                    inv.clientName.trim().toLowerCase() === selectedClient.name.trim().toLowerCase()
                                  );
                                  if (!isClientMatch) return false;
                                  const isBonoType = inv.discountType === 'bono' || (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('bono'));
                                  const isPurchaseAmount = inv.amount === 160 || inv.amount === 250 || inv.amount > 0;
                                  if (!isBonoType || !isPurchaseAmount) return false;
                                  const invDateStr = getLocalDateStr(inv.date);
                                  return invDateStr === evDateStr || (inv.eventId && inv.eventId === ev.id);
                                });

                                const isBonoRedeemed = Boolean(
                                  bonoInvoice ||
                                  associatedNotes.some(n => n.isBonoRedeemed) || 
                                  (selectedClient?.bonoRedeemedDates && selectedClient.bonoRedeemedDates.includes(evDateStr)) ||
                                  Boolean(bonoPurchaseInvoice && selectedClient?.hasBono)
                                );

                                const standardPaidInvoice = associatedInvoices.find(inv => inv.status === 'paid' && inv.amount > 0 && !inv.isBonoRedemption && inv.discountType !== 'bono');

                                const paidInvoice = isBonoRedeemed ? undefined : standardPaidInvoice;
                                const pendingInvoice = isBonoRedeemed ? undefined : associatedInvoices.find(inv => inv.status === 'pending');
                                const isPaymentSettled = Boolean(paidInvoice || isBonoRedeemed || (bonoPurchaseInvoice && bonoPurchaseInvoice.status === 'paid'));
                                const isComplete = Boolean(hasNote && isPaymentSettled);

                                return (
                                  <div 
                                    key={ev.id ? `${ev.id}-${idx}` : `past-app-${idx}`}
                                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                                      isOngoing
                                        ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-400/40 shadow-xs'
                                        : isComplete
                                        ? 'bg-sky-50/90 border-sky-300/80 hover:bg-sky-100/60 shadow-xs'
                                        : (isPast || evDateStr === todayStr)
                                        ? 'bg-amber-50/90 border-amber-200 hover:bg-amber-50 shadow-xs'
                                        : 'bg-[#fafafa] border-black/5 hover:bg-white'
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="space-y-1.5 flex-1 min-w-0">
                                        {/* Badges row: Ongoing/Today vs Past + Note Notification + Payment Notification */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          {isOngoing ? (
                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-teal-600 text-white animate-pulse flex items-center gap-1 shadow-xs">
                                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                              {lang === 'fr' ? 'En cours' : lang === 'es' ? 'En curso' : 'In progress'}
                                            </span>
                                          ) : evDateStr === todayStr ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                                              {lang === 'fr' ? "Aujourd'hui" : lang === 'es' ? 'Hoy' : 'Today'}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-200 text-gray-700">
                                              {lang === 'fr' ? 'Passé' : lang === 'es' ? 'Pasada' : 'Past'}
                                            </span>
                                          )}
                                          <span className="text-xs font-bold text-gray-900">{dateStr}</span>

                                          {/* Note Status Notification Badge */}
                                          {hasNote ? (
                                            <button
                                              type="button"
                                              onClick={() => handleScrollToNote(firstNote.id)}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 hover:bg-sky-200 transition-colors cursor-pointer"
                                              title={lang === 'fr' ? "Note rédigée - Cliquer pour voir au dossier" : "Nota redactada - Ver en ficha"}
                                            >
                                              <FileCheck size={11} className="text-sky-700" />
                                              <span>{lang === 'fr' ? '✓ Note rédigée' : lang === 'es' ? '✓ Nota redactada' : '✓ Note added'}</span>
                                            </button>
                                          ) : isPast ? (
                                            <span 
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80"
                                              title={lang === 'fr' ? "Rendez-vous passé sans note rédigée" : "Sin nota"}
                                            >
                                              <FileText size={10} className="text-amber-500" />
                                              <span>{lang === 'fr' ? 'Note en attente' : lang === 'es' ? 'Nota pendiente' : 'Note pending'}</span>
                                            </span>
                                          ) : isOngoing ? (
                                            <span 
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-teal-50 text-teal-800 border border-teal-200"
                                              title={lang === 'fr' ? "Consultation actuellement en cours" : "Consulta en curso"}
                                            >
                                              <FileText size={10} className="text-teal-600" />
                                              <span>{lang === 'fr' ? 'En consultation' : lang === 'es' ? 'En consulta' : 'In session'}</span>
                                            </span>
                                          ) : null}

                                          {/* Payment Status Notification Badge */}
                                          {isBonoRedeemed ? (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span 
                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs"
                                                title={lang === 'fr' ? "Séance décomptée du Bono - Réglé" : "Session redeemed from Bono - Settled"}
                                              >
                                                <Sparkles size={11} className="text-emerald-700" />
                                                <span>{translations[lang]?.admin?.billing?.bonoRedemptionLabel || (lang === 'fr' ? 'Décompté du Bono' : lang === 'es' ? 'Descontado del Bono' : 'Redeemed from Bono')} (✓ {lang === 'fr' ? 'Réglé' : lang === 'es' ? 'Pagado' : 'Settled'})</span>
                                              </span>
                                              {bonoPurchaseInvoice && bonoPurchaseInvoice.status === 'paid' && (
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedInvoiceForPrint(bonoPurchaseInvoice)}
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-900 border border-emerald-300 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                  title={lang === 'fr' ? `Facture Bono ${bonoPurchaseInvoice.amount} € - Cliquer pour voir la facture` : `Bono receipt ${bonoPurchaseInvoice.amount} €`}
                                                >
                                                  <Printer size={10} />
                                                  <span>{bonoPurchaseInvoice.amount} €</span>
                                                </button>
                                              )}
                                            </div>
                                          ) : paidInvoice ? (
                                            (() => {
                                              const methodLabel = paidInvoice.paymentMethod === 'card'
                                                ? (lang === 'fr' ? 'CB' : lang === 'es' ? 'Tarjeta' : 'Card')
                                                : paidInvoice.paymentMethod === 'cash'
                                                ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash')
                                                : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transf.' : 'Transfer');
                                              return (
                                                <button
                                                  type="button"
                                                  onClick={() => setSelectedInvoiceForPrint(paidInvoice)}
                                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200 transition-colors cursor-pointer"
                                                  title={lang === 'fr' ? `Paiement validé (${paidInvoice.amount} € - ${methodLabel}) - Cliquer pour voir la facture` : `Pago registrado (${paidInvoice.amount} €)`}
                                                >
                                                  <CheckCircle2 size={11} className="text-emerald-700" />
                                                  <span>{lang === 'fr' ? 'Payé' : lang === 'es' ? 'Pagado' : 'Paid'} : {paidInvoice.amount} € ({methodLabel})</span>
                                                </button>
                                              );
                                            })()
                                          ) : pendingInvoice ? (
                                            <button
                                              type="button"
                                              onClick={() => setSelectedInvoiceForPrint(pendingInvoice)}
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                                              title={lang === 'fr' ? `Facture émise en attente de paiement (${pendingInvoice.amount} €)` : `Factura pendiente`}
                                            >
                                              <Clock size={11} className="text-amber-700" />
                                              <span>{lang === 'fr' ? 'En attente' : lang === 'es' ? 'Pendiente' : 'Pending'} : {pendingInvoice.amount} €</span>
                                            </button>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500 border border-gray-200">
                                              <CreditCard size={10} className="text-gray-400" />
                                              <span>{lang === 'fr' ? 'Non réglé' : lang === 'es' ? 'No cobrado' : 'Unbilled'}</span>
                                            </span>
                                          )}
                                        </div>

                                        <p className="text-xs font-semibold text-primary mt-1">
                                          {ev.summary || (lang === 'fr' ? "Séance d'ostéopathie" : "Osteopathy session")}
                                        </p>
                                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                          {timeStr}
                                        </p>
                                        {ev.description && (
                                          <p className="text-[11px] text-gray-600 italic mt-1 line-clamp-2 bg-white/70 p-1.5 rounded-lg border border-black/5">
                                            {ev.description}
                                          </p>
                                        )}

                                        {/* Note Preview Snippet if note exists */}
                                        {hasNote && (firstNote.motif || firstNote.treatment || firstNote.anamnese || firstNote.content) && (
                                          <div 
                                            onClick={() => handleScrollToNote(firstNote.id)}
                                            className="bg-sky-50/80 hover:bg-sky-100/90 p-2 rounded-xl border border-sky-200/80 text-[11px] text-gray-700 cursor-pointer transition-all group/note mt-1"
                                            title={lang === 'fr' ? "Cliquer pour voir la note complète dans le dossier" : "Clic para ver la nota en la ficha"}
                                          >
                                            <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-sky-900 mb-0.5">
                                              <span className="flex items-center gap-1 truncate">
                                                <FileCheck size={11} className="text-sky-600 shrink-0" />
                                                <span className="truncate">{firstNote.motif || (lang === 'fr' ? "Note clinique associée" : "Nota clínica")}</span>
                                              </span>
                                              <span className="text-sky-600 group-hover/note:underline font-semibold text-[9px] shrink-0 flex items-center gap-0.5">
                                                <span>{lang === 'fr' ? "Voir note" : "Ver"}</span>
                                                <ArrowDown size={10} />
                                              </span>
                                            </div>
                                            <p className="line-clamp-2 text-gray-600 text-[10px] leading-relaxed italic">
                                              {firstNote.treatment || firstNote.anamnese || firstNote.content}
                                            </p>
                                          </div>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => openEditEventModal(ev)}
                                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-white rounded-lg transition-all"
                                          title={lang === 'fr' ? "Modifier le rendez-vous" : "Edit appointment"}
                                        >
                                          <Pencil size={13} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteEvent(ev.id)}
                                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                          title={lang === 'fr' ? "Supprimer le rendez-vous" : "Delete appointment"}
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Quick actions for this appointment */}
                                    <div className="pt-2 border-t border-black/5 flex items-center justify-between gap-2 text-[11px] flex-wrap">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {hasNote ? (
                                          <button
                                            type="button"
                                            onClick={() => handleScrollToNote(firstNote.id)}
                                            className="text-sky-700 hover:text-sky-900 font-bold inline-flex items-center gap-1 cursor-pointer hover:underline"
                                          >
                                            <FileCheck size={11} className="text-sky-600" />
                                            <span>{lang === 'fr' ? 'Voir la note au dossier' : lang === 'es' ? 'Ver nota en ficha' : 'View note in file'} ↓</span>
                                          </button>
                                        ) : (() => {
                                          const apptDraft = getClientDraft(selectedClient.id, ev.id) || getClientDraft(selectedClient.id);
                                          const isDraftPending = Boolean(apptDraft && (apptDraft.draft.anamnese?.trim() || apptDraft.draft.treatment?.trim() || apptDraft.draft.motif?.trim()));

                                          return (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const isoDate = evDate.toISOString().split('T')[0];
                                                if (isDraftPending && apptDraft) {
                                                  setNewNote({
                                                    anamnese: apptDraft.draft.anamnese || '',
                                                    treatment: apptDraft.draft.treatment || '',
                                                    category: apptDraft.draft.category || 'treatment',
                                                    date: apptDraft.draft.date || isoDate,
                                                    motif: apptDraft.draft.motif || ev.summary || '',
                                                    eventId: ev.id || apptDraft.draft.eventId || '',
                                                  });
                                                  setActiveDraftNotice(true);
                                                } else {
                                                  setNewNote(prev => ({
                                                    ...prev,
                                                    date: isoDate,
                                                    motif: ev.summary || prev.motif,
                                                    eventId: ev.id,
                                                  }));
                                                }
                                                const noteFormElem = document.getElementById('new-note-form');
                                                if (noteFormElem) {
                                                  noteFormElem.scrollIntoView({ behavior: 'smooth' });
                                                  const firstField = noteFormElem.querySelector('input, textarea') as HTMLInputElement | HTMLTextAreaElement | null;
                                                  if (firstField) firstField.focus();
                                                }
                                              }}
                                              className={isDraftPending
                                                ? "text-amber-900 hover:text-amber-950 font-bold inline-flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-lg border border-amber-300 transition-all cursor-pointer text-[10px] shadow-2xs"
                                                : "text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                                              }
                                              title={isDraftPending ? (lang === 'fr' ? 'Reprendre la rédaction du brouillon pour ce patient' : 'Continuar borrador') : undefined}
                                            >
                                              {isDraftPending ? (
                                                <>
                                                  <StickyNote size={12} className="text-amber-700 animate-pulse" />
                                                  <span>{lang === 'fr' ? 'Continuer le brouillon' : lang === 'es' ? 'Continuar borrador' : 'Continue draft'}</span>
                                                </>
                                              ) : (
                                                <>
                                                  <Plus size={11} />
                                                  <span>{lang === 'fr' ? 'Rédiger une note pour ce RDV' : 'Write note for this appointment'}</span>
                                                </>
                                              )}
                                            </button>
                                          );
                                        })()}

                                        {!paidInvoice && !isBonoRedeemed && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (!selectedClient) return;
                                              const isoDate = evDate.toISOString().split('T')[0];
                                              setNewInvoice(prev => ({
                                                ...prev,
                                                clientId: selectedClient.id,
                                                date: isoDate,
                                                paymentDate: isoDate,
                                                eventId: ev.id,
                                                description: ev.summary || prev.description,
                                              }));
                                              setNewInvoiceBillingPlan(selectedClient.hasBono && (selectedClient.bonoSessionsRemaining ?? 0) > 0 ? 'deduct_bono' : 'single');
                                              setNewInvoiceIncludeToday(true);
                                              setIsAddInvoiceOpen(true);
                                            }}
                                            className="text-emerald-800 hover:text-emerald-950 font-bold inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200/80 transition-all cursor-pointer text-[10px]"
                                            title={lang === 'fr' ? "Associer un paiement ou émettre une facture pour ce rendez-vous" : "Cobrar cita"}
                                          >
                                            <Plus size={10} />
                                            <span>{lang === 'fr' ? 'Encaisser / Facturer' : lang === 'es' ? 'Cobrar / Facturar' : 'Bill / Collect'}</span>
                                          </button>
                                        )}
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCurrentCalendarDate(evDate);
                                          setActiveTab('calendar');
                                          setCalendarViewMode('day');
                                        }}
                                        className="text-gray-500 hover:text-gray-800 text-[10px] font-medium cursor-pointer ml-auto"
                                      >
                                        {lang === 'fr' ? "Voir dans l'agenda" : "View in calendar"} →
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : upcomingAppointments.length === 0 ? (
                          <div className="py-5 px-4 bg-[#fafafa] rounded-2xl border border-dashed border-gray-200 text-center space-y-1.5">
                            <CalendarIcon className="mx-auto text-gray-300" size={20} />
                            <p className="text-xs text-gray-400">
                              {lang === 'fr' 
                                ? "Aucun rendez-vous enregistré pour ce patient dans l'agenda." 
                                : "No appointments scheduled for this patient in the calendar."}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Consultation Notes Section - Responsive layout: stacked on tablet/mobile, side-by-side on large desktop */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                    
                    {/* Add Clinical Note Form Column */}
                    <div id="new-note-form" className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm xl:col-span-5">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <FileCheck size={16} /> {lang === 'fr' ? "Nouvelle Consultation / Note" : lang === 'es' ? "Nueva Consulta / Nota" : "New Consultation / Note"}
                      </h4>

                      {/* Draft auto-save indicator & discard button */}
                      {activeDraftNotice && (newNote.anamnese.trim() || newNote.treatment.trim() || newNote.motif.trim()) && (
                        <div className="mb-4 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 flex items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <div className="relative shrink-0">
                              <StickyNote size={16} className="text-amber-700" />
                              <Cloud size={10} className="text-amber-800 absolute -bottom-1 -right-1 fill-amber-100" />
                            </div>
                            <div>
                              <p className="font-bold text-amber-950 flex items-center gap-1.5 flex-wrap">
                                <span>{lang === 'fr' ? "Brouillon sauvegardé & synchronisé" : lang === 'es' ? "Borrador guardado y sincronizado" : "Draft saved & synced"}</span>
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-200/90 text-amber-900 uppercase tracking-wider">Multi-appareils</span>
                              </p>
                              <p className="text-[10px] text-amber-800">
                                {lang === 'fr' 
                                  ? "Ce brouillon est enregistré en ligne et immédiatement disponible sur tous vos appareils (PC, tablette, mobile)." 
                                  : lang === 'es'
                                  ? "Este borrador está guardado en la nube y disponible en todos sus dispositivos."
                                  : "Saved online and synced across all your devices."}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleDiscardDraft}
                            className="text-[10px] font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-100/70 px-2 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                            title={lang === 'fr' ? "Effacer ce brouillon et réinitialiser" : "Discard"}
                          >
                            {lang === 'fr' ? "Effacer le brouillon" : lang === 'es' ? "Borrar borrador" : "Discard"}
                          </button>
                        </div>
                      )}

                      {newNote.eventId && (
                        <div className="mb-4 p-2.5 rounded-xl bg-sky-50 border border-sky-200/80 flex items-center justify-between gap-2 text-xs text-sky-900">
                          <div className="flex items-center gap-1.5 truncate">
                            <CalendarIcon size={13} className="text-sky-600 shrink-0" />
                            <span className="font-semibold truncate">
                              {lang === 'fr' ? 'Note associée au rendez-vous' : lang === 'es' ? 'Nota asociada a la cita' : 'Note linked to appointment'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUpdateNoteField({ eventId: '' })}
                            className="text-sky-600 hover:text-sky-900 p-0.5 rounded hover:bg-sky-100 transition-colors cursor-pointer"
                            title={lang === 'fr' ? "Dissocier du rendez-vous" : "Desvincular"}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}

                      <form onSubmit={handleAddNote} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                              {lang === 'fr' ? "Catégorie" : lang === 'es' ? "Categoría" : "Category"}
                            </label>
                            <select
                              value={newNote.category}
                              onChange={(e) => handleUpdateNoteField({ category: e.target.value as ClientNote['category'] })}
                              className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all font-medium"
                            >
                              <option value="treatment">{lang === 'fr' ? "Traitement / Ostéopathie" : lang === 'es' ? "Tratamiento / Osteopatía" : "Treatment / Osteopathy"}</option>
                              <option value="evaluation">{lang === 'fr' ? "Anamnèse / Évaluation" : lang === 'es' ? "Anamnesis / Evaluación" : "Anamnesis / Evaluation"}</option>
                              <option value="follow-up">{lang === 'fr' ? "Suivi / Posture" : lang === 'es' ? "Seguimiento / Postura" : "Follow-up / Posture"}</option>
                              <option value="general">{lang === 'fr' ? "Note générale" : lang === 'es' ? "Nota general" : "General note"}</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                              {lang === 'fr' ? "Date" : lang === 'es' ? "Fecha" : "Date"}
                            </label>
                            <input
                              type="date"
                              required
                              value={newNote.date}
                              onChange={(e) => handleUpdateNoteField({ date: e.target.value })}
                              className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? "Motif / Titre (optionnel)" : lang === 'es' ? "Motivo / Título (opcional)" : "Reason / Title (optional)"}
                          </label>
                          <input
                            type="text"
                            value={newNote.motif}
                            onChange={(e) => handleUpdateNoteField({ motif: e.target.value })}
                            placeholder={lang === 'fr' ? "ex: Lombalgie, Note de suivi, Bilan..." : lang === 'es' ? "ej: Cervicalgia, Nota de seguimiento..." : "e.g., Back pain, Follow-up note..."}
                            className="w-full p-2.5 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? "Anamnèse & Symptômes / Observation" : lang === 'es' ? "Anamnesis y Síntomas / Observación" : "Anamnesis & Symptoms / Note"}
                          </label>
                          <textarea
                            value={newNote.anamnese}
                            onChange={(e) => handleUpdateNoteField({ anamnese: e.target.value })}
                            rows={4}
                            placeholder={lang === 'fr' ? "Saisissez les symptômes, observations ou notes sur le patient..." : lang === 'es' ? "Escriba los síntomas, observaciones o notas..." : "Enter symptoms, observations or notes..."}
                            className="w-full p-3 bg-[#f4f4ec] rounded-2xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                          ></textarea>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? "Traitement & Recommandations (optionnel)" : lang === 'es' ? "Tratamiento y Recomendaciones (opcional)" : "Treatment & Recommendations (optional)"}
                          </label>
                          <textarea
                            value={newNote.treatment}
                            onChange={(e) => handleUpdateNoteField({ treatment: e.target.value })}
                            rows={3}
                            placeholder={lang === 'fr' ? "ex: Libération sacrée, mobilisations, étirements..." : lang === 'es' ? "ej: Liberación sacra, movilizaciones..." : "e.g., Sacral release, mobilizations..."}
                            className="w-full p-3 bg-[#f4f4ec] rounded-2xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                          ></textarea>
                          <span className="text-[9px] text-gray-400 block mt-1">
                            {lang === 'fr' ? "Note enregistrée de manière sécurisée sur le profil patient." : lang === 'es' ? "Nota guardada de manera segura en el perfil del paciente." : "Note securely saved to patient profile."}
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={!newNote.anamnese.trim() && !newNote.treatment.trim() && !newNote.motif.trim()}
                          className="w-full py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>{lang === 'fr' ? "Enregistrer la note" : lang === 'es' ? "Guardar la nota" : "Save note"}</span>
                        </button>
                      </form>
                    </div>

                    {/* Chronic Notes History Column */}
                    <div className="xl:col-span-7 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-2 px-1">
                        {lang === 'fr' ? 'Historique des fiches' : lang === 'es' ? 'Historial de fichas' : 'Record history'} ({clientNotes.length})
                      </h4>

                      {clientNotes.map((note, noteIdx) => {
                        const isEditing = editingNoteId === note.id;
                        const associatedInvoice = invoices.find(inv => {
                          if (inv.noteId === note.id) return true;
                          if (!selectedClient) return false;
                          const isSameClient = inv.clientId === selectedClient.id || (
                            inv.clientName && selectedClient.name && (
                              inv.clientName.toLowerCase() === selectedClient.name.toLowerCase() ||
                              (selectedClient.lastName && inv.clientName.toLowerCase().includes(selectedClient.lastName.toLowerCase()))
                            )
                          );
                          if (!isSameClient) return false;
                          try {
                            const invDateStr = new Date(inv.date).toISOString().split('T')[0];
                            const noteDateStr = new Date(note.date).toISOString().split('T')[0];
                            return invDateStr === noteDateStr;
                          } catch (e) {
                            return false;
                          }
                        });

                        const noteDateOnly = note.date.includes('T') ? note.date.split('T')[0] : note.date;
                        const isZeroBonoInvoice = Boolean(
                          associatedInvoice && (
                            associatedInvoice.isBonoRedemption || 
                            (associatedInvoice.amount === 0 && associatedInvoice.discountType === 'bono') ||
                            associatedInvoice.amount === 0
                          )
                        );

                        const isNoteBonoRedeemed = Boolean(
                          note.isBonoRedeemed || 
                          isZeroBonoInvoice ||
                          (selectedClient?.bonoRedeemedDates && selectedClient.bonoRedeemedDates.includes(noteDateOnly))
                        );

                        const isNotePaid = Boolean(associatedInvoice && associatedInvoice.status === 'paid' && associatedInvoice.amount > 0);
                        const isNotePaymentSettled = Boolean(isNotePaid || isNoteBonoRedeemed);
                        const hasNoteContent = Boolean(
                          (note.content && note.content.trim()) || 
                          (note.anamnese && note.anamnese.trim()) || 
                          (note.treatment && note.treatment.trim()) || 
                          (note.motif && note.motif.trim())
                        );
                        const isNoteComplete = Boolean(hasNoteContent && isNotePaymentSettled);

                        return (
                          <div 
                            key={note.id ? `${note.id}-${noteIdx}` : `note-${noteIdx}`} 
                            id={`note-${note.id}`} 
                            className={`p-5 rounded-3xl border shadow-sm space-y-3 relative group transition-all ${
                              isNoteComplete
                                ? 'bg-sky-50/70 border-sky-200/90 hover:border-sky-300 hover:bg-sky-50'
                                : 'bg-amber-50/70 border-amber-200/90 hover:border-amber-300 hover:bg-amber-50'
                            }`}
                          >
                            {isEditing ? (
                              <div className="space-y-3 bg-[#fafaf7] p-4 rounded-2xl border border-primary/20 shadow-inner">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Catégorie" : lang === 'es' ? "Categoría" : "Category"}
                                    </label>
                                    <select
                                      value={editingNoteCategory}
                                      onChange={(e) => setEditingNoteCategory(e.target.value as ClientNote['category'])}
                                      className="p-1.5 bg-white rounded-lg border border-black/10 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary transition-all w-full sm:w-auto font-medium"
                                    >
                                      <option value="treatment">{lang === 'fr' ? "Traitement / Ostéopathie" : lang === 'es' ? "Tratamiento / Osteopatía" : "Treatment / Osteopathy"}</option>
                                      <option value="evaluation">{lang === 'fr' ? "Anamnèse / Évaluation" : lang === 'es' ? "Anamnesis / Evaluación" : "Anamnesis / Evaluation"}</option>
                                      <option value="follow-up">{lang === 'fr' ? "Suivi / Posture" : lang === 'es' ? "Seguimiento / Postura" : "Follow-up / Posture"}</option>
                                      <option value="general">{lang === 'fr' ? "Note générale" : lang === 'es' ? "Nota general" : "General note"}</option>
                                    </select>
                                  </div>
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {new Date(note.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Date" : lang === 'es' ? "Fecha" : "Date"}
                                    </label>
                                    <input
                                      type="date"
                                      value={editingNoteDate}
                                      onChange={(e) => setEditingNoteDate(e.target.value)}
                                      className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Motif / Titre (optionnel)" : lang === 'es' ? "Motivo / Título (opcional)" : "Reason / Title (optional)"}
                                    </label>
                                    <input
                                      type="text"
                                      value={editingNoteMotif}
                                      onChange={(e) => setEditingNoteMotif(e.target.value)}
                                      placeholder={lang === 'fr' ? "ex: Lombalgie aiguë, Suivi posture..." : "e.g., Back pain..."}
                                      className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Anamnèse & Symptômes" : lang === 'es' ? "Anamnesis y Síntomas" : "Anamnesis & Symptoms"}
                                    </label>
                                    <textarea
                                      value={editingNoteAnamnese}
                                      onChange={(e) => setEditingNoteAnamnese(e.target.value)}
                                      rows={5}
                                      placeholder={lang === 'fr' ? "Observations, symptômes, motifs de consultation..." : "Observations, symptoms..."}
                                      className="w-full p-2.5 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Traitement & Recommandations" : lang === 'es' ? "Tratamiento y Recomendaciones" : "Treatment & Recommendations"}
                                    </label>
                                    <textarea
                                      value={editingNoteTreatment}
                                      onChange={(e) => setEditingNoteTreatment(e.target.value)}
                                      rows={5}
                                      placeholder={lang === 'fr' ? "Techniques ostéopathiques réalisées, conseils, exercices..." : "Techniques, advice..."}
                                      className="w-full p-2.5 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none leading-relaxed"
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/10">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-all cursor-pointer border border-rose-200"
                                    title={lang === 'fr' ? "Supprimer cette note" : lang === 'es' ? "Eliminar nota" : "Delete note"}
                                    aria-label={lang === 'fr' ? "Supprimer la note" : lang === 'es' ? "Eliminar nota" : "Delete note"}
                                  >
                                    <Trash2 size={13} />
                                    <span>{lang === 'fr' ? "Supprimer" : lang === 'es' ? "Eliminar" : "Delete"}</span>
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setEditingNoteId(null)}
                                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    >
                                      {lang === 'fr' ? "Annuler" : lang === 'es' ? "Cancelar" : "Cancel"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateNote(note.id)}
                                      disabled={!editingNoteAnamnese.trim() && !editingNoteTreatment.trim() && !editingNoteMotif.trim()}
                                      className="px-4 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1.5"
                                    >
                                      <Check size={13} />
                                      <span>{lang === 'fr' ? "Enregistrer" : lang === 'es' ? "Guardar" : "Save"}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      note.category === 'treatment' ? 'bg-emerald-50 text-emerald-700' :
                                      note.category === 'evaluation' ? 'bg-indigo-50 text-indigo-700' :
                                      note.category === 'follow-up' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {note.category === 'treatment' ? (lang === 'fr' ? 'Traitement' : lang === 'es' ? 'Tratamiento' : 'Treatment') :
                                       note.category === 'evaluation' ? (lang === 'fr' ? 'Évaluation' : lang === 'es' ? 'Evaluación' : 'Evaluation') :
                                       note.category === 'follow-up' ? (lang === 'fr' ? 'Suivi' : lang === 'es' ? 'Seguimiento' : 'Follow-up') : (lang === 'fr' ? 'Général' : lang === 'es' ? 'General' : 'General')}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-medium">
                                      {new Date(note.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                    {note.eventId && (
                                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/70 inline-flex items-center gap-1">
                                        <CalendarIcon size={10} />
                                        <span>{lang === 'fr' ? 'Liée à un RDV' : lang === 'es' ? 'Vinculada a cita' : 'Linked to appt'}</span>
                                      </span>
                                    )}
                                  </div>

                                  {/* Edit & Delete Buttons - ALWAYS clearly visible on all devices */}
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingNoteId(note.id);
                                        setEditingNoteAnamnese(note.anamnese || note.content || '');
                                        setEditingNoteTreatment(note.treatment || '');
                                        setEditingNoteCategory(note.category);
                                        setEditingNoteMotif(note.motif || '');
                                        try {
                                          setEditingNoteDate(new Date(note.date).toISOString().split('T')[0]);
                                        } catch {
                                          setEditingNoteDate(new Date().toISOString().split('T')[0]);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-gray-700 hover:text-primary hover:bg-primary/5 rounded-xl border border-black/10 bg-white text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                      title={lang === 'fr' ? "Modifier cette note" : lang === 'es' ? "Editar nota" : "Edit note"}
                                      aria-label={lang === 'fr' ? "Modifier la note" : lang === 'es' ? "Editar nota" : "Edit note"}
                                    >
                                      <Pencil size={12} className="text-gray-500" />
                                      <span>{lang === 'fr' ? "Modifier" : lang === 'es' ? "Editar" : "Edit"}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNote(note.id)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 bg-rose-50/50 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                      title={lang === 'fr' ? "Supprimer cette note" : lang === 'es' ? "Eliminar nota" : "Delete note"}
                                      aria-label={lang === 'fr' ? "Supprimer la note" : lang === 'es' ? "Eliminar nota" : "Delete note"}
                                    >
                                      <Trash2 size={12} className="text-rose-500" />
                                      <span>{lang === 'fr' ? "Supprimer" : lang === 'es' ? "Eliminar" : "Delete"}</span>
                                    </button>
                                  </div>
                                </div>

                                {note.motif && (
                                  <div className="pt-0.5">
                                    <h5 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                                      <span>{note.motif}</span>
                                    </h5>
                                  </div>
                                )}

                                {note.anamnese || note.treatment ? (
                                  <div className="space-y-3 pt-1">
                                    {note.anamnese && (
                                      <div className="space-y-1">
                                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                          {lang === 'fr' ? 'Anamnèse & Diagnostic' : lang === 'es' ? 'Anamnesis y Diagnóstico' : 'Anamnesis & Diagnosis'}
                                        </h5>
                                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50/50 p-2.5 rounded-xl border border-black/5">
                                          {note.anamnese}
                                        </p>
                                      </div>
                                    )}
                                    {note.treatment && (
                                      <div className="space-y-1">
                                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                                          {lang === 'fr' ? 'Traitement & Conseils' : lang === 'es' ? 'Tratamiento y Consejos' : 'Treatment & Advice'}
                                        </h5>
                                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-emerald-50/20 p-2.5 rounded-xl border border-emerald-500/5">
                                          {note.treatment}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans bg-gray-50/50 p-2.5 rounded-xl border border-black/5">
                                    {note.content}
                                  </p>
                                )}
                              </>
                            )}

                            {/* Associated Invoice or Inline Creation Options */}
                            {(() => {
                              const associatedInvoice = invoices.find(inv => {
                                if (inv.noteId === note.id) return true;
                                if (!selectedClient) return false;
                                const isSameClient = inv.clientId === selectedClient.id || (
                                  inv.clientName && selectedClient.name && (
                                    inv.clientName.toLowerCase() === selectedClient.name.toLowerCase() ||
                                    (selectedClient.lastName && inv.clientName.toLowerCase().includes(selectedClient.lastName.toLowerCase()))
                                  )
                                );
                                if (!isSameClient) return false;
                                try {
                                  const invDateStr = new Date(inv.date).toISOString().split('T')[0];
                                  const noteDateStr = new Date(note.date).toISOString().split('T')[0];
                                  return invDateStr === noteDateStr;
                                } catch (e) {
                                  return false;
                                }
                              });

                              const noteDateOnly = note.date.includes('T') ? note.date.split('T')[0] : note.date;
                              const isZeroBonoInvoice = Boolean(
                                associatedInvoice && (
                                  associatedInvoice.isBonoRedemption || 
                                  (associatedInvoice.amount === 0 && associatedInvoice.discountType === 'bono') ||
                                  associatedInvoice.amount === 0
                                )
                              );

                              const isBonoPurchaseInvoice = Boolean(
                                associatedInvoice && (
                                  associatedInvoice.discountType === 'bono' || 
                                  (associatedInvoice.description && associatedInvoice.description.toLowerCase().includes('bono'))
                                ) && associatedInvoice.amount > 0
                              );

                              const isNoteBonoRedeemed = Boolean(
                                note.isBonoRedeemed || 
                                isZeroBonoInvoice ||
                                (selectedClient?.bonoRedeemedDates && selectedClient.bonoRedeemedDates.includes(noteDateOnly)) ||
                                (isBonoPurchaseInvoice && Boolean(selectedClient?.hasBono))
                              );

                              return isNoteBonoRedeemed ? (
                                <div className="mt-4 pt-4 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 shadow-2xs">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0 shadow-2xs">
                                      <Sparkles size={16} />
                                    </div>
                                    <div className="text-left">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-emerald-950">
                                          {lang === 'fr' ? 'Séance décomptée du Bono' : lang === 'es' ? 'Sesión descontada del Bono' : 'Session redeemed from Bono'}
                                        </span>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 bg-emerald-600 text-white shadow-2xs">
                                          <CheckCircle2 size={11} />
                                          <span>{lang === 'fr' ? 'Réglé' : lang === 'es' ? 'Pagado' : 'Settled'}</span>
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-emerald-800 font-medium mt-0.5">
                                        {formatLocalizedBonoText(note.bonoType || selectedClient?.bonoType, lang) || 'Bono'} • {
                                          associatedInvoice && associatedInvoice.amount > 0
                                            ? (lang === 'fr' ? `Forfait acheté et réglé ce jour (${associatedInvoice.amount} € · 1ère séance décomptée)` : lang === 'es' ? `Bono comprado y abonado hoy (${associatedInvoice.amount} € · 1ª sesión descontada)` : `Prepaid package purchased & settled today (${associatedInvoice.amount} € · 1st session redeemed)`)
                                            : (lang === 'fr' ? 'Forfait prépayé (Décompté du solde · Aucune facture à émettre)' : lang === 'es' ? 'Bono prepagado (Descontado del saldo)' : 'Prepaid package (Redeemed from balance)')
                                        }
                                      </p>
                                    </div>
                                  </div>

                                  {associatedInvoice && associatedInvoice.amount > 0 && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedInvoiceForPrint(associatedInvoice)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs"
                                        title={lang === 'fr' ? "Imprimer le reçu du Bono" : "Print Bono receipt"}
                                      >
                                        <Printer size={13} />
                                        <span>{translations[lang].admin.billing.receipt} ({associatedInvoice.amount} €)</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : associatedInvoice && associatedInvoice.amount > 0 ? (
                                <div className="mt-4 pt-4 border-t border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-3.5 rounded-2xl border border-black/5">
                                  <div className="flex items-center gap-2.5">
                                    <CreditCard size={15} className="text-primary shrink-0" />
                                    <div className="text-left">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-bold text-gray-800">{lang === 'fr' ? 'Facture' : lang === 'es' ? 'Factura' : 'Invoice'} #{associatedInvoice.invoiceNumber}</span>
                                        <button
                                          type="button"
                                          onClick={() => handleToggleInvoiceStatus(associatedInvoice)}
                                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                            associatedInvoice.status === 'paid'
                                              ? 'text-emerald-700 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200'
                                              : 'text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 animate-pulse'
                                          }`}
                                          title={associatedInvoice.status === 'pending'
                                            ? (lang === 'fr' ? 'Cliquer pour marquer comme payée' : 'Click to mark as paid')
                                            : (lang === 'fr' ? 'Cliquer pour passer en attente' : 'Click to mark as pending')}
                                        >
                                          {associatedInvoice.status === 'paid' ? (
                                            <>
                                              <CheckCircle2 size={11} />
                                              <span>{translations[lang].admin.billing.statusPaid}</span>
                                            </>
                                          ) : (
                                            <>
                                              <Clock size={11} />
                                              <span>{translations[lang].admin.billing.statusPending}</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <p className="text-[10px] text-gray-500 mt-0.5">
                                        {associatedInvoice.amount} € • {
                                          associatedInvoice.isBonoRedemption || associatedInvoice.amount === 0 || associatedInvoice.paymentMethod === 'not_applicable'
                                            ? (translations[lang]?.admin?.billing?.notApplicable || (lang === 'fr' ? 'Non applicable' : lang === 'es' ? 'No aplicable' : 'Not applicable'))
                                            : associatedInvoice.paymentMethod === 'card' ? (lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card') :
                                              associatedInvoice.paymentMethod === 'cash' ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash') : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer')
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 shrink-0">
                                    {associatedInvoice.status === 'pending' && (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleInvoiceStatus(associatedInvoice)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                      >
                                        <CheckCircle2 size={13} />
                                        <span>{lang === 'fr' ? 'Marquer payée' : lang === 'es' ? 'Marcar pagada' : 'Mark paid'}</span>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedInvoiceForPrint(associatedInvoice)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                                    >
                                      <Printer size={13} />
                                      <span>{translations[lang].admin.billing.receipt}</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-4 pt-4 border-t border-black/5">
                                  {creatingInvoiceForNoteId === note.id ? (
                                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-4">
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                                          <CreditCard size={14} />
                                          {translations[lang].admin.billing.issueInvoice}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setCreatingInvoiceForNoteId(null)}
                                          className="text-[11px] text-gray-400 hover:text-gray-600 font-bold"
                                        >
                                          {translations[lang].admin.billing.cancel}
                                        </button>
                                      </div>

                                      {/* Package & Bono Selector */}
                                      <div>
                                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-500 block mb-1.5">
                                          {translations[lang].admin.billing.pricingPlan}
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                          {/* Option 1: Single Session 60€ */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setInlineBillingPlan('single');
                                              setInlineInvoiceOriginalAmount(60);
                                              setInlineInvoiceDiscountAmount(0);
                                              setInlineInvoiceDiscountType('none');
                                              setInlineInvoiceDiscountLabel('');
                                              setInlineInvoiceAmount(60);
                                            }}
                                            className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                              inlineBillingPlan === 'single'
                                                ? 'bg-white border-primary ring-2 ring-primary/20 shadow-xs'
                                                : 'bg-white/80 border-black/5 hover:border-black/20 text-gray-600'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-bold text-gray-800">{translations[lang].admin.billing.singleSession}</span>
                                              <span className="text-xs font-bold text-primary">60 €</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{translations[lang].admin.billing.singleSessionSubtitle}</p>
                                          </button>

                                          {/* Option 2: Bono 3 Sessions 160€ */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setInlineBillingPlan('bono3');
                                              setInlineInvoiceOriginalAmount(180);
                                              setInlineInvoiceDiscountAmount(20);
                                              setInlineInvoiceDiscountType('bono');
                                              setInlineInvoiceDiscountLabel("");
                                              setInlineInvoiceAmount(160);
                                            }}
                                            className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                              inlineBillingPlan === 'bono3'
                                                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                                : 'bg-white/80 border-black/5 hover:border-black/20 text-gray-600'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                                <Sparkles size={11} className="text-emerald-600" />
                                                {""}
                                              </span>
                                              <span className="text-xs font-bold text-emerald-700">160 €</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1 text-[10px]">
                                              <span className="text-emerald-800/80 font-medium">53,33 € / s.</span>
                                              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md text-[9px]">
                                                {translations[lang].admin.billing.bono3Saving}
                                              </span>
                                            </div>
                                          </button>

                                          {/* Option 3: Bono 5 Sessions 250€ */}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setInlineBillingPlan('bono5');
                                              setInlineInvoiceOriginalAmount(300);
                                              setInlineInvoiceDiscountAmount(50);
                                              setInlineInvoiceDiscountType('bono');
                                              setInlineInvoiceDiscountLabel("");
                                              setInlineInvoiceAmount(250);
                                            }}
                                            className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                              inlineBillingPlan === 'bono5'
                                                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                                : 'bg-white/80 border-black/5 hover:border-black/20 text-gray-600'
                                            }`}
                                          >
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                                <Sparkles size={11} className="text-emerald-600" />
                                                {""}
                                              </span>
                                              <span className="text-xs font-bold text-emerald-700">250 €</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1 text-[10px]">
                                              <span className="text-emerald-800/80 font-medium">50,00 € / s.</span>
                                              <span className="bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md text-[9px]">
                                                {translations[lang].admin.billing.bono5Saving}
                                              </span>
                                            </div>
                                          </button>

                                          {/* Option 4: Deduct from active Bono (if patient has remaining sessions) */}
                                          {selectedClient?.hasBono && (selectedClient.bonoSessionsRemaining ?? 0) > 0 ? (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setInlineBillingPlan('deduct_bono');
                                                setInlineInvoiceOriginalAmount(60);
                                                setInlineInvoiceDiscountAmount(60);
                                                setInlineInvoiceDiscountType('bono');
                                                setInlineInvoiceDiscountLabel(`Décompté sur ${formatLocalizedBonoText(selectedClient.bonoType, lang) || 'Bono'}`);
                                                setInlineInvoiceAmount(0);
                                              }}
                                              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                                inlineBillingPlan === 'deduct_bono'
                                                  ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                                                  : 'bg-white/80 border-black/5 hover:border-black/20 text-gray-600'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-teal-900">{""}</span>
                                                <span className="text-xs font-bold text-teal-700">0 €</span>
                                              </div>
                                              <p className="text-[10px] text-teal-700 font-semibold mt-0.5">
                                                {(translations[lang]?.admin?.billing?.bonoSessionsLeft || '{count} séances restantes').replace('{count}', String(selectedClient.bonoSessionsRemaining ?? 0))}
                                              </p>
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setInlineBillingPlan('custom');
                                                if (inlineInvoiceDiscountAmount === 0) setInlineInvoiceDiscountAmount(10);
                                                setInlineInvoiceDiscountType('custom');
                                                setInlineInvoiceAmount(Math.max(0, inlineInvoiceOriginalAmount - (inlineInvoiceDiscountAmount || 10)));
                                              }}
                                              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                                inlineBillingPlan === 'custom'
                                                  ? 'bg-white border-primary ring-2 ring-primary/20 shadow-xs'
                                                  : 'bg-white/80 border-black/5 hover:border-black/20 text-gray-600'
                                              }`}
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-800">{translations[lang].admin.billing.customDiscount}</span>
                                                <span className="text-xs font-bold text-gray-500">{inlineInvoiceAmount} €</span>
                                              </div>
                                              <p className="text-[10px] text-gray-400 mt-0.5">{translations[lang].admin.billing.customDiscountSubtitle}</p>
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {/* Information card when Bono 3 or Bono 5 is selected */}
                                      {(inlineBillingPlan === 'bono3' || inlineBillingPlan === 'bono5') && (
                                        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 space-y-2 text-xs text-emerald-950">
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold flex items-center gap-1.5 text-emerald-800">
                                              <Sparkles size={13} className="text-emerald-600" />
                                              {inlineBillingPlan === 'bono3' ? "" : ""}
                                            </span>
                                            <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                                              {""}
                                            </span>
                                          </div>
                                          <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-emerald-900 select-none">
                                            <input
                                              type="checkbox"
                                              checked={inlineIncludeToday}
                                              onChange={(e) => setInlineIncludeToday(e.target.checked)}
                                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span>
                                              {inlineIncludeToday
                                                ? (translations[lang]?.admin?.billing?.bonoIncludeTodayYes || "Inclure la séance ({remaining} restantes)").replace('{remaining}', String(inlineBillingPlan === 'bono3' ? 2 : 4))
                                                : (translations[lang]?.admin?.billing?.bonoIncludeTodayNo || "Ne pas inclure ({total} crédités)").replace('{total}', String(inlineBillingPlan === 'bono3' ? 3 : 5))}
                                            </span>
                                          </label>
                                        </div>
                                      )}

                                      {/* Information card when Deduct from active Bono is selected */}
                                      {inlineBillingPlan === 'deduct_bono' && selectedClient?.hasBono && (
                                        <div className="bg-teal-50/70 border border-teal-200/70 rounded-xl p-3 text-xs text-teal-950 flex items-center justify-between">
                                          <div>
                                            <p className="font-bold text-teal-900 flex items-center gap-1.5">
                                              <BadgePercent size={13} className="text-teal-600" />
                                              {""}
                                            </p>
                                            <p className="text-[11px] text-teal-800 mt-0.5">
                                              {(translations[lang]?.admin?.billing?.deductBonoRemainingAfter || "Il restera {count} séance(s) sur son forfait").replace('{count}', String(Math.max(0, (selectedClient.bonoSessionsRemaining ?? 1) - 1)))}
                                            </p>
                                          </div>
                                          <span className="text-xs font-bold text-teal-800 bg-teal-100 px-2 py-1 rounded-lg">
                                            {translations[lang].admin.billing.prepaid}
                                          </span>
                                        </div>
                                      )}

                                      {/* Custom Discount inputs if custom plan */}
                                      {inlineBillingPlan === 'custom' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-black/5">
                                          <div>
                                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                              {translations[lang].admin.billing.discountAmount || (lang === 'fr' ? 'Montant remise (€)' : 'Discount (€)')}
                                            </label>
                                            <input
                                              type="number"
                                              value={inlineInvoiceDiscountAmount}
                                              onChange={(e) => {
                                                const disc = Number(e.target.value);
                                                setInlineInvoiceDiscountAmount(disc);
                                                setInlineInvoiceAmount(Math.max(0, inlineInvoiceOriginalAmount - disc));
                                              }}
                                              className="w-full p-1.5 bg-[#f4f4ec] rounded-lg border border-black/10 text-xs font-bold text-emerald-700"
                                            />
                                          </div>
                                          <div>
                                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                              {translations[lang].admin.billing.discountLabel || (lang === 'fr' ? 'Libellé sur le reçu' : 'Label on receipt')}
                                            </label>
                                            <input
                                              type="text"
                                              value={inlineInvoiceDiscountLabel}
                                              onChange={(e) => setInlineInvoiceDiscountLabel(e.target.value)}
                                              placeholder="Ex: Remise fidélité"
                                              className="w-full p-1.5 bg-[#f4f4ec] rounded-lg border border-black/10 text-xs"
                                            />
                                          </div>
                                        </div>
                                      )}

                                      {/* Payment Method & Status */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                            {translations[lang].admin.billing.tableMethod}
                                          </label>
                                          <select
                                            value={inlineInvoicePaymentMethod}
                                            onChange={(e) => setInlineInvoicePaymentMethod(e.target.value as any)}
                                            className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                          >
                                            <option value="card">{translations[lang].admin.billing.paymentCard}</option>
                                            <option value="cash">{translations[lang].admin.billing.paymentCash}</option>
                                            <option value="transfer">{translations[lang].admin.billing.paymentTransfer}</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                            {translations[lang].admin.billing.status}
                                          </label>
                                          <select
                                            value={inlineInvoiceStatus}
                                            onChange={(e) => setInlineInvoiceStatus(e.target.value as any)}
                                            className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                          >
                                            <option value="paid">{translations[lang].admin.billing.statusPaid}</option>
                                            <option value="pending">{translations[lang].admin.billing.statusPending}</option>
                                          </select>
                                        </div>
                                      </div>

                                      {/* Final Net Amount Display */}
                                      <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-black/5 text-xs">
                                        <div>
                                          <span className="font-bold text-gray-700">
                                            {translations[lang].admin.billing.netAmountToPay || (lang === 'fr' ? 'Net à régler par le patient :' : 'Net to pay :')}
                                          </span>
                                          {inlineInvoiceDiscountAmount > 0 && (
                                            <span className="text-[10px] text-gray-400 line-through ml-2">
                                              {inlineInvoiceOriginalAmount} €
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-base font-bold text-primary font-serif">
                                          {inlineInvoiceAmount} €
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2 pt-1">
                                        <button
                                          type="button"
                                          onClick={() => handleCreateInlineInvoice(note)}
                                          className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-sm ${
                                            inlineBillingPlan === 'deduct_bono'
                                              ? 'bg-emerald-600 hover:bg-emerald-700'
                                              : 'bg-primary hover:bg-primary/95'
                                          }`}
                                        >
                                          {inlineBillingPlan === 'deduct_bono'
                                            ? (translations[lang]?.admin?.billing?.confirmBonoDeductionAction || (lang === 'fr' ? 'Confirmer le décompte' : lang === 'es' ? 'Confirmar descuento' : 'Confirm Deduction'))
                                            : translations[lang].admin.billing.issueInvoiceAction}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setCreatingInvoiceForNoteId(null)}
                                          className="px-3.5 py-2.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-200 transition-all"
                                        >
                                          {translations[lang].admin.billing.cancel}
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCreatingInvoiceForNoteId(note.id);
                                        const hasActiveBono = !!selectedClient?.hasBono && (selectedClient.bonoSessionsRemaining ?? 0) > 0;
                                        if (hasActiveBono) {
                                          setInlineBillingPlan('deduct_bono');
                                          setInlineInvoiceOriginalAmount(60);
                                          setInlineInvoiceDiscountAmount(60);
                                          setInlineInvoiceDiscountType('bono');
                                          setInlineInvoiceDiscountLabel(`Décompté sur ${formatLocalizedBonoText(selectedClient.bonoType, lang) || 'Bono'}`);
                                          setInlineInvoiceAmount(0);
                                        } else {
                                          setInlineBillingPlan('single');
                                          setInlineInvoiceOriginalAmount(60);
                                          setInlineInvoiceDiscountAmount(0);
                                          setInlineInvoiceDiscountType('none');
                                          setInlineInvoiceDiscountLabel('');
                                          setInlineInvoiceAmount(60);
                                        }
                                        setInlineIncludeToday(true);
                                        setInlineInvoicePaymentMethod('card');
                                        setInlineInvoiceStatus('paid');
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-xs font-bold transition-all shadow-xs group/btn"
                                    >
                                      <Plus size={13} className="group-hover/btn:rotate-90 transition-transform" />
                                      <span>{translations[lang].admin.billing.issueInvoice}</span>
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        );
                      })}

                      {clientNotes.length === 0 && (
                        <div className="bg-white p-8 rounded-3xl border border-dashed border-gray-200 text-center">
                          <p className="text-xs text-gray-400">
                            {lang === 'fr' ? "Aucune consultation enregistrée pour ce patient." : lang === 'es' ? "No hay consultas registradas para este paciente." : "No consultations recorded for this patient."}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="flex-1 bg-white rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center p-8 text-center min-h-[50vh]">
                  <div className="w-16 h-16 bg-[#f4f4ec] rounded-full flex items-center justify-center text-primary mb-4">
                    <Users size={28} />
                  </div>
                  <h3 className="text-lg font-serif font-bold text-primary">
                    {lang === 'fr' ? "Aucun patient sélectionné" : lang === 'es' ? "Ningún paciente seleccionado" : "No patient selected"}
                  </h3>
                  <p className="text-xs text-gray-400 mt-2 max-w-sm">
                    {lang === 'fr' ? "Veuillez sélectionner un patient dans la colonne de gauche ou en créer un nouveau pour consulter son dossier." : lang === 'es' ? "Por favor, seleccione un paciente en la columna izquierda o cree uno nuevo para ver su expediente." : "Please select a patient from the left column or create a new one to view their file."}
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="space-y-6 flex-1">
            
            {/* Clinic Schedule Header Bar */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-[#009cb2] flex items-center justify-center border border-cyan-100 shadow-2xs">
                    <CalendarIcon size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 flex items-center gap-2">
                      {lang === 'fr' ? 'Agenda du Cabinet' : lang === 'es' ? 'Agenda de la Clínica' : 'Clinic Schedule'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {lang === 'fr' 
                        ? "Planning des consultations · Horaires, coordonnées et notes cliniques" 
                        : lang === 'es' 
                          ? "Planificación de consultas · Horarios, contacto y notas clínicas" 
                          : "Appointment schedule · Times, contact and clinical notes"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                {/* Live Real-time Status Badge */}
                <div className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-semibold font-mono">
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-slate-400">·</span>
                  <span className="text-[11px] text-slate-600">
                    {lang === 'fr' ? 'En direct' : 'Live'}
                  </span>
                </div>

                <button 
                  onClick={loadData}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-2xl transition-all text-xs font-bold text-slate-700 disabled:opacity-50 shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
                  title={lang === 'fr' ? "Actualiser l'agenda" : "Refresh"}
                >
                  <RefreshCw size={14} className={`shrink-0 ${isSyncing ? "animate-spin text-[#0e9f8e]" : ""}`} />
                  <span className="whitespace-nowrap">{lang === 'fr' ? "Actualiser" : "Refresh"}</span>
                </button>

                <button
                  onClick={() => setIsAddEventOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0e9f8e] hover:bg-[#0c8a7b] text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-[#0e9f8e]/20 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus size={16} className="shrink-0" />
                  <span className="whitespace-nowrap">{lang === 'fr' ? "Nouveau RDV" : lang === 'es' ? "Nueva Cita" : "New Appointment"}</span>
                </button>
              </div>
            </div>

            {/* SHARED JANE.APP CALENDAR LOGIC & RENDER */}
            {(() => {
              const todayStr = (() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                return `${y}-${m}-${d}`;
              })();

              const getWeekDates = (baseDate: Date) => {
                const d = new Date(baseDate);
                const day = d.getDay();
                const diffToMonday = d.getDate() - (day === 0 ? 6 : day - 1);
                const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday);

                const weekDays = [];
                for (let i = 0; i < 7; i++) {
                  const dayDate = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
                  const y = dayDate.getFullYear();
                  const m = String(dayDate.getMonth() + 1).padStart(2, '0');
                  const dayNum = String(dayDate.getDate()).padStart(2, '0');
                  const dateStr = `${y}-${m}-${dayNum}`;
                  weekDays.push({
                    date: dayDate,
                    dateString: dateStr,
                    dayNumber: dayDate.getDate(),
                    dayName: dayDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'short' }),
                    fullDayName: dayDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long' }),
                    isToday: dateStr === todayStr,
                  });
                }
                return weekDays;
              };

              const handleCalendarPrev = () => {
                const prev = new Date(currentCalendarDate);
                if (calendarViewMode === 'month') {
                  prev.setMonth(prev.getMonth() - 1);
                } else if (calendarViewMode === 'week') {
                  prev.setDate(prev.getDate() - 7);
                } else {
                  prev.setDate(prev.getDate() - 1);
                }
                setCurrentCalendarDate(prev);
              };

              const handleCalendarNext = () => {
                const next = new Date(currentCalendarDate);
                if (calendarViewMode === 'month') {
                  next.setMonth(next.getMonth() + 1);
                } else if (calendarViewMode === 'week') {
                  next.setDate(next.getDate() + 7);
                } else {
                  next.setDate(next.getDate() + 1);
                }
                setCurrentCalendarDate(next);
              };

              const getCalendarHeaderTitle = () => {
                if (calendarViewMode === 'month') {
                  return currentCalendarDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' });
                }
                if (calendarViewMode === 'week') {
                  const week = getWeekDates(currentCalendarDate);
                  const first = week[0].date;
                  const last = week[6].date;
                  const sameMonth = first.getMonth() === last.getMonth();
                  const sameYear = first.getFullYear() === last.getFullYear();

                  if (sameMonth && sameYear) {
                    return `${first.getDate()} - ${last.getDate()} ${first.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}`;
                  } else if (sameYear) {
                    return `${first.getDate()} ${first.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { month: 'short' })} - ${last.getDate()} ${last.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', year: 'numeric' })}`;
                  } else {
                    return `${first.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short' })} - ${last.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
                  }
                }
                // Day view
                return currentCalendarDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
              };

              const getEventsForDate = (dateString: string) => {
                return events.filter(ev => {
                  try {
                    const evDate = new Date(ev.start);
                    const y = evDate.getFullYear();
                    const m = String(evDate.getMonth() + 1).padStart(2, '0');
                    const d = String(evDate.getDate()).padStart(2, '0');
                    return `${y}-${m}-${d}` === dateString;
                  } catch (e) {
                    return false;
                  }
                }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
              };

              const handleQuickAddEvent = (dateStr: string, timeStr?: string) => {
                const startTime = timeStr || '10:00';
                let endTime = '10:55';
                if (timeStr) {
                  const [h, m] = timeStr.split(':').map(Number);
                  const date = new Date();
                  date.setHours(h);
                  date.setMinutes((m || 0) + 55);
                  endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                }
                setNewEvent(prev => ({
                  ...prev,
                  date: dateStr,
                  startTime: startTime,
                  endTime: endTime,
                  title: getDefaultAppointmentTitle(lang),
                  description: '',
                  eventType: 'appointment',
                }));
                setIsAddEventOpen(true);
              };

              // Clean Medical Cyan Appointment Card (Heure, Nom Prénom, Profile Note)
              const renderAppointmentCard = (ev: CalendarEvent, cardKey?: string) => {
                const isOther = ev.eventType && ev.eventType !== 'appointment';
                const startStr = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endStr = new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const hasNote = !isOther && hasAppointmentNote(ev);
                const isSettled = !isOther && isAppointmentSettledOrRedeemed(ev);
                const client = !isOther ? getEventClient(ev) : null;
                const profileNote = client?.profileNote?.trim();
                const cleanRemark = ev.description?.replace(/\[eventType:[a-z]+\]/gi, '').replace(/\[type:[a-z]+\]/gi, '').trim();
                const isFullyCompleted = !isOther && hasNote && isSettled;

                if (isOther) {
                  // Si il y a une remarque pour les slots bloqués, privilégier la remarque plutôt que le slot title
                  const displayLabel = cleanRemark || ev.summary || (lang === 'fr' ? 'Créneau indisponible' : 'Bloqueado');
                  return (
                    <div
                      key={cardKey || (ev.id ? `${ev.id}-slot-card` : `slot-card-${ev.start || 'slot'}`)}
                      onClick={() => setSelectedAppointmentForDetails(ev)}
                      className="rounded-lg p-2 bg-amber-100/90 hover:bg-amber-100 border border-amber-300 text-amber-950 shadow-2xs hover:shadow-sm cursor-pointer transition-all relative group/card"
                      title={lang === 'fr' ? "Cliquer pour voir les détails" : "Click to view details"}
                    >
                      <div className="flex items-center justify-between gap-1 text-[11px] font-bold">
                        <span className="font-mono">{startStr} - {endStr}</span>
                        <Lock size={12} className="text-amber-700 shrink-0" />
                      </div>
                      <p className="text-xs font-semibold text-amber-900 truncate mt-0.5">
                        {displayLabel}
                      </p>
                      {cleanRemark && ev.summary && cleanRemark !== ev.summary && (
                        <p className="text-[10px] text-amber-800/80 truncate font-normal mt-0.5">
                          {ev.summary}
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={cardKey || (ev.id ? `${ev.id}-app-card` : `app-card-${ev.start || 'app'}`)}
                    onClick={() => setSelectedAppointmentForDetails(ev)}
                    className="rounded-lg p-2 bg-[#38c9d8] hover:bg-[#2fc0cf] border border-[#20b4c5] text-[#063840] shadow-2xs hover:shadow-md cursor-pointer transition-all relative group/card select-none"
                    title={lang === 'fr' ? "Cliquer pour voir les détails du rendez-vous" : "Click to view appointment details"}
                  >
                    {/* Top row: Heure - Nom Prénom & Note / Completion status badge */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-[13px] font-bold text-[#063840] leading-tight flex items-baseline gap-1.5 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold text-[#063840]/80 shrink-0">
                            {startStr} - {endStr}
                          </span>
                          <span className="truncate">{getEventDisplayName(ev)}</span>
                        </div>
                      </div>

                      {/* Status Indicators in top-right: Note rédigée & Paiement/Bono réglé */}
                      <div className="flex items-center gap-1 shrink-0">
                        {hasNote && (
                          <span
                            className="w-5 h-5 rounded-md bg-white/50 text-[#063840] flex items-center justify-center shadow-2xs"
                            title={lang === 'fr' ? "Note clinique enregistrée" : lang === 'es' ? "Nota clínica registrada" : "Clinical note recorded"}
                          >
                            <FileText size={11} className="text-[#063840]" />
                          </span>
                        )}

                        {isSettled && (
                          <span
                            className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center shadow-2xs border border-emerald-400/40 shrink-0"
                            title={lang === 'fr' ? "Règlement effectué / Séance décomptée du Bono" : lang === 'es' ? "Pago cobrado / Sesión descontada del Bono" : "Payment settled / Bono deducted"}
                          >
                            <CreditCard size={11} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Profile Note si il y en a une */}
                    {profileNote && (
                      <div className="mt-1 p-1 px-1.5 rounded-md bg-white/60 border border-white/50 text-[10px] text-[#063840] flex items-start gap-1 leading-snug">
                        <Info size={10} className="shrink-0 mt-0.5 opacity-80 text-[#063840]" />
                        <span className="line-clamp-2 italic font-medium">
                          {profileNote}
                        </span>
                      </div>
                    )}
                  </div>
                );
              };

              return (
                <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
                  
                  {/* Navigator Header (Jane.app style) */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                      <h4 className="text-base sm:text-xl font-bold font-serif text-slate-900 capitalize shrink-0 mr-1">
                        {getCalendarHeaderTitle()}
                      </h4>
                      
                      <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
                        <button
                          onClick={handleCalendarPrev}
                          className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer"
                          title={lang === 'fr' ? "Précédent" : "Previous"}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        
                        <button
                          onClick={() => {
                            setCurrentCalendarDate(new Date());
                            setTimeout(() => centerOnTodayInWeekView(true), 60);
                          }}
                          className="px-2.5 sm:px-3 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded-lg transition-all shadow-2xs cursor-pointer"
                        >
                          {lang === 'fr' ? "Aujourd'hui" : lang === 'es' ? "Hoy" : "Today"}
                        </button>

                        <button
                          onClick={handleCalendarNext}
                          className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition-all cursor-pointer"
                          title={lang === 'fr' ? "Suivant" : "Next"}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      {/* View Switcher Segmented Control (Jane.app style) */}
                      <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
                        <button
                          onClick={() => setCalendarViewMode('month')}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            calendarViewMode === 'month' 
                              ? 'bg-white text-[#0e9f8e] shadow-xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <CalendarIcon size={14} />
                          <span>{lang === 'fr' ? "Mois" : lang === 'es' ? "Mes" : "Month"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setCalendarViewMode('week');
                            setTimeout(() => centerOnTodayInWeekView(true), 60);
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            calendarViewMode === 'week' 
                              ? 'bg-white text-[#0e9f8e] shadow-xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Columns3 size={14} />
                          <span>{lang === 'fr' ? "Semaine" : lang === 'es' ? "Semana" : "Week"}</span>
                        </button>
                        <button
                          onClick={() => setCalendarViewMode('day')}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            calendarViewMode === 'day' 
                              ? 'bg-white text-[#0e9f8e] shadow-xs' 
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <Clock size={14} />
                          <span>{lang === 'fr' ? "Jour" : lang === 'es' ? "Día" : "Day"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#009cb2]"></span>
                      <span>
                        {calendarViewMode === 'month' 
                          ? (lang === 'fr' ? "Cliquez sur une date pour voir les rendez-vous" : "Click on a date to see appointments")
                          : calendarViewMode === 'week'
                          ? (lang === 'fr' ? "Cliquez sur un rendez-vous pour voir les détails et le gérer" : "Click on an appointment to view details and manage")
                          : (lang === 'fr' ? "Planning journalier des consultations" : "Daily consultation schedule")}
                      </span>
                    </div>
                  </div>

                  {/* VIEW 1: WEEK VIEW (Hourly grid respecting real time-slot spaces) */}
                  {calendarViewMode === 'week' && (() => {
                    const weekDays = getWeekDates(currentCalendarDate);
                    const allWeekEvents = weekDays.flatMap(d => getEventsForDate(d.dateString));

                    // Default hours from 08:00 to 20:00, expanding if earlier or later appointments exist
                    let minHour = 8;
                    let maxHour = 20;
                    allWeekEvents.forEach(ev => {
                      try {
                        const h = new Date(ev.start).getHours();
                        if (!isNaN(h)) {
                          if (h < minHour && h >= 6) minHour = h;
                          if (h > maxHour && h <= 23) maxHour = h;
                        }
                      } catch {}
                    });

                    const hours: string[] = [];
                    for (let h = minHour; h <= maxHour; h++) {
                      hours.push(`${String(h).padStart(2, '0')}:00`);
                    }

                    return (
                      <div 
                        ref={weekScrollContainerRef}
                        className="w-full overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs scroll-smooth"
                      >
                        <div className="min-w-[1050px]">
                          {/* Grid Header: Time column + 7 Day Headers with Day Number & Gold Counters */}
                          <div className="grid grid-cols-[64px_repeat(7,minmax(140px,1fr))] border-b border-slate-200 bg-slate-50/95 sticky top-0 z-10 shadow-2xs">
                            {/* Left axis header - Sticky on horizontal scroll for tablet and mobile */}
                            <div className="p-3 border-r border-slate-200/80 flex items-center justify-center text-slate-500 sticky left-0 z-30 bg-slate-50 w-[64px] min-w-[64px] shrink-0 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)]">
                              <Clock size={16} />
                            </div>

                            {/* 7 Days of the Week */}
                            {weekDays.map((dayItem, dayIdx) => {
                              const dayEvents = getEventsForDate(dayItem.dateString);
                              const dayApptsCount = dayEvents.filter(ev => !ev.eventType || ev.eventType === 'appointment').length;

                              return (
                                <div
                                  key={dayIdx}
                                  data-is-today={dayItem.isToday ? "true" : undefined}
                                  className={`p-2.5 border-r border-slate-200/80 last:border-r-0 flex items-center justify-between gap-1.5 transition-colors ${
                                    dayItem.isToday ? 'bg-[#e0f5f7]/70 ring-1 ring-inset ring-[#009cb2]/30' : 'bg-white/80'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                                        dayItem.isToday ? 'text-[#009cb2]' : 'text-slate-500'
                                      }`}>
                                        {dayItem.dayName}
                                      </span>
                                      {dayItem.isToday && (
                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#009cb2] text-white tracking-wide">
                                          {lang === 'fr' ? "Aujourd'hui" : lang === 'es' ? "Hoy" : "Today"}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <button
                                        onClick={() => {
                                          setCurrentCalendarDate(dayItem.date);
                                          setCalendarViewMode('day');
                                        }}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all hover:scale-105 cursor-pointer ${
                                          dayItem.isToday
                                            ? 'bg-[#009cb2] text-white shadow-xs ring-2 ring-[#009cb2]/30'
                                            : 'text-slate-800 hover:bg-slate-200/60'
                                        }`}
                                        title={lang === 'fr' ? "Basculer sur la vue Jour" : "Switch to Day View"}
                                      >
                                        {dayItem.dayNumber}
                                      </button>
                                      {dayApptsCount > 0 && (
                                        <span 
                                          className="w-5 h-5 rounded-full bg-[#f59e0b] text-white font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0" 
                                          title={`${dayApptsCount} RDV`}
                                        >
                                          {dayApptsCount}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => handleQuickAddEvent(dayItem.dateString)}
                                    className="p-1.5 rounded-xl text-[#009cb2] hover:bg-cyan-100/70 transition-colors cursor-pointer"
                                    title={lang === 'fr' ? `Ajouter un RDV le ${dayItem.dayName} ${dayItem.dayNumber}` : "Add appointment"}
                                  >
                                    <Plus size={15} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Hourly Slot Rows */}
                          <div className="divide-y divide-slate-200/70">
                            {hours.map((hourStr, hIdx) => {
                              const hourNum = parseInt(hourStr.split(':')[0], 10);

                              return (
                                <div
                                  key={hIdx}
                                  className="grid grid-cols-[64px_repeat(7,minmax(140px,1fr))] min-h-[66px]"
                                >
                                  {/* Left Hour Label - Sticky on horizontal scroll for tablet and mobile */}
                                  <div className="py-2.5 pr-2.5 text-right font-mono text-[11px] font-bold text-slate-500 select-none bg-slate-50 border-r border-slate-200/80 sticky left-0 z-20 w-[64px] min-w-[64px] shrink-0 shadow-[2px_0_6px_-2px_rgba(0,0,0,0.08)] flex items-center justify-end">
                                    {hourStr}
                                  </div>

                                  {/* 7 Columns for this hour */}
                                  {weekDays.map((dayItem, dayIdx) => {
                                    const dayEvents = getEventsForDate(dayItem.dateString);
                                    const slotEvents = dayEvents.filter(ev => {
                                      try {
                                        const evDate = new Date(ev.start);
                                        return evDate.getHours() === hourNum;
                                      } catch {
                                        return false;
                                      }
                                    });

                                    return (
                                      <div
                                        key={dayIdx}
                                        data-is-today={dayItem.isToday ? "true" : undefined}
                                        className={`p-1 border-r border-slate-200/60 last:border-r-0 relative group/slot transition-colors min-h-[72px] ${
                                          dayItem.isToday ? 'bg-[#e0f5f7]/25' : 'bg-white'
                                        }`}
                                      >
                                        {slotEvents.length > 0 ? (
                                          <div className="relative w-full h-full min-h-[64px]">
                                            {slotEvents.map((ev, sIdx) => {
                                              try {
                                                const evDate = new Date(ev.start);
                                                const mins = evDate.getMinutes();
                                                const topPercent = Math.min(85, Math.max(0, (mins / 60) * 100));
                                                return (
                                                  <div 
                                                    key={ev.id || sIdx} 
                                                    style={{ top: `${topPercent}%` }}
                                                    className="absolute left-1 right-1 z-10"
                                                  >
                                                    {renderAppointmentCard(ev, `${dayItem.dateString}-${hourNum}-${ev.id || sIdx}-${sIdx}`)}
                                                  </div>
                                                );
                                              } catch {
                                                return <div key={sIdx}>{renderAppointmentCard(ev, `${dayItem.dateString}-${hourNum}-${ev.id || sIdx}-${sIdx}`)}</div>;
                                              }
                                            })}
                                          </div>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAddEvent(dayItem.dateString, hourStr)}
                                            className="w-full h-full min-h-[64px] rounded-lg border border-dashed border-transparent hover:border-[#009cb2]/40 hover:bg-[#009cb2]/5 flex items-center justify-center text-[#009cb2] opacity-0 group-hover/slot:opacity-100 transition-all cursor-pointer"
                                            title={lang === 'fr' ? `Ajouter à ${hourStr}` : `Add at ${hourStr}`}
                                          >
                                            <Plus size={14} className="stroke-[2.5]" />
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* VIEW 2: DAY VIEW (Matching screenshot organization & practitioner column) */}
                  {calendarViewMode === 'day' && (
                    <div className="space-y-6">
                      {(() => {
                        const currentDateStr = (() => {
                          const y = currentCalendarDate.getFullYear();
                          const m = String(currentCalendarDate.getMonth() + 1).padStart(2, '0');
                          const d = String(currentCalendarDate.getDate()).padStart(2, '0');
                          return `${y}-${m}-${d}`;
                        })();

                        const dayEvents = getEventsForDate(currentDateStr);
                        const isToday = currentDateStr === todayStr;
                        const dayApptsCount = dayEvents.filter(ev => !ev.eventType || ev.eventType === 'appointment').length;

                        const hours = [
                          '08:00', '09:00', '10:00', '11:00', '12:00', 
                          '13:00', '14:00', '15:00', '16:00', '17:00', 
                          '18:00', '19:00', '20:00'
                        ];

                        return (
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left 2 Cols: Schedule Grid inspired by uploaded image */}
                            <div className="lg:col-span-2 space-y-4">
                              {/* Practitioner Header Column (like Dr. Cam Coleman [4] Room 1 in screenshot) */}
                              <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  {/* Doctor Avatar */}
                                  <div className="w-10 h-10 rounded-full bg-cyan-100 border-2 border-[#38c9d8] flex items-center justify-center text-[#00838f] font-bold text-xs shadow-2xs shrink-0 overflow-hidden">
                                    <User size={20} className="text-[#00838f]" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-[#009cb2]">
                                        Vincent Durroux
                                      </h4>
                                      <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-white font-bold text-[11px] flex items-center justify-center shadow-2xs">
                                        {dayApptsCount}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#38c9d8]/20 text-[#006064] border border-[#38c9d8]/40">
                                        {lang === 'fr' ? 'Cabinet Principal' : 'Main Clinic'}
                                      </span>
                                      <span className="text-[11px] text-slate-500 capitalize">
                                        {currentCalendarDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleQuickAddEvent(currentDateStr)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#009cb2] hover:bg-[#00838f] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                >
                                  <Plus size={14} />
                                  <span className="hidden sm:inline">{lang === 'fr' ? "Nouveau RDV" : "New Appt"}</span>
                                </button>
                              </div>

                              {/* Hourly Schedule Table with Aqua Mint Column Background */}
                              <div className="rounded-2xl border border-slate-200 bg-[#e0f5f7]/30 p-3 sm:p-4 space-y-2 relative">
                                {hours.map((hourStr, hIdx) => {
                                  const hourNum = parseInt(hourStr.split(':')[0], 10);
                                  
                                  // Find events that start in this hour slot
                                  const slotEvents = dayEvents.filter(ev => {
                                    try {
                                      const evDate = new Date(ev.start);
                                      return evDate.getHours() === hourNum;
                                    } catch (e) {
                                      return false;
                                    }
                                  });

                                  return (
                                    <div key={hIdx} className="flex items-start gap-3 py-1 border-b border-cyan-100/60 last:border-0">
                                      {/* Hour Label (left axis like screenshot) */}
                                      <div className="w-14 shrink-0 text-right pt-2">
                                        <span className="text-xs font-bold text-slate-500 font-mono">{hourStr}</span>
                                      </div>

                                      {/* Slot Content */}
                                      <div className="flex-1 relative min-h-[72px]">
                                        {slotEvents.length > 0 ? (
                                          <div className="space-y-1.5">
                                            {slotEvents.map((ev, sIdx) => renderAppointmentCard(ev, `${currentDateStr}-${hourNum}-${ev.id || sIdx}-${sIdx}`))}
                                            <button
                                              type="button"
                                              onClick={() => handleQuickAddEvent(currentDateStr, hourStr)}
                                              className="w-full py-1 text-[11px] font-bold text-[#009cb2] hover:bg-white/80 rounded-lg border border-dashed border-cyan-300/60 transition-all flex items-center justify-center gap-1.5 opacity-60 hover:opacity-100 cursor-pointer"
                                              title={lang === 'fr' ? `Ajouter un autre RDV dans ce créneau (${hourStr})` : `Add another appointment (${hourStr})`}
                                            >
                                              <Plus size={12} />
                                              <span>{lang === 'fr' ? `+ Ajouter un autre rendez-vous dans ce créneau (${hourStr})` : `+ Add another appointment (${hourStr})`}</span>
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            onClick={() => handleQuickAddEvent(currentDateStr, hourStr)}
                                            className="h-9 rounded-lg border border-dashed border-cyan-300/60 hover:border-[#009cb2] hover:bg-white/70 flex items-center justify-between px-3 cursor-pointer group/slot transition-all bg-white/30"
                                          >
                                            <span className="text-[11px] text-cyan-900/60 group-hover/slot:text-[#009cb2] transition-colors flex items-center gap-1 font-medium">
                                              <Plus size={12} className="opacity-0 group-hover/slot:opacity-100 transition-opacity" />
                                              <span>{lang === 'fr' ? `Créneau libre (${hourStr})` : `Free slot (${hourStr})`}</span>
                                            </span>
                                            <span className="text-[10px] font-bold text-[#009cb2] opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                              {lang === 'fr' ? "+ Réserver" : "+ Book"}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Right 1 Col: Day Insights & Patients List */}
                            <div className="space-y-6">
                              {/* Quick summary of today's patients */}
                              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-[#009cb2] flex items-center gap-2">
                                  <Users size={14} /> {lang === 'fr' ? "Patients du jour" : "Patients of the day"}
                                </h4>
                                
                                <div className="space-y-2">
                                  {dayEvents.filter(ev => !ev.eventType || ev.eventType === 'appointment').map((ev, evIdx) => {
                                    const client = getEventClient(ev);
                                    const profileNote = client?.profileNote?.trim();

                                    return (
                                      <div 
                                        key={ev.id ? `${ev.id}-${evIdx}` : `patient-ev-${evIdx}`}
                                        onClick={() => setSelectedAppointmentForDetails(ev)}
                                        className="p-3 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs hover:border-[#009cb2] transition-all cursor-pointer"
                                      >
                                        <div className="min-w-0">
                                          <h5 className="text-xs font-bold text-slate-900 leading-tight truncate">
                                            {getEventDisplayName(ev)}
                                          </h5>
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-1">
                                            <span className="font-mono">{new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            {profileNote && (
                                              <>
                                                <span>·</span>
                                                <span className="text-amber-800 font-medium italic truncate max-w-[150px]">{profileNote}</span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleGoToNotes(ev);
                                          }}
                                          className="px-2.5 py-1.5 bg-cyan-50 hover:bg-[#009cb2] text-[#009cb2] hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shrink-0"
                                          title={lang === 'fr' ? "Ouvrir la fiche patient & notes" : "Patient File"}
                                        >
                                          {lang === 'fr' ? "Fiche" : "File"}
                                        </button>
                                      </div>
                                    );
                                  })}

                                  {dayEvents.filter(ev => !ev.eventType || ev.eventType === 'appointment').length === 0 && (
                                    <p className="text-xs text-slate-400 italic py-2">
                                      {lang === 'fr' ? "Aucun patient prévu pour cette journée." : "No patients scheduled for this day."}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Consultation Hours Summary */}
                              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#009cb2] mb-1">
                                    {lang === 'fr' ? "Horaires du Cabinet" : lang === 'es' ? "Horarios de consulta" : "Consultation hours"}
                                  </h4>
                                  <p className="text-[11px] text-slate-500">
                                    {lang === 'fr' ? "Plages d'ouverture habituelles du cabinet." : "Standard active clinic hours."}
                                  </p>
                                </div>

                                <div className="space-y-2.5">
                                  {[
                                    { day: lang === 'fr' ? 'Lundi - Vendredi' : lang === 'es' ? 'Lunes - Viernes' : 'Monday - Friday', hours: '09:00 - 13:00, 16:00 - 20:00' },
                                    { day: lang === 'fr' ? 'Samedi' : lang === 'es' ? 'Sábado' : 'Saturday', hours: '09:00 - 13:00' },
                                    { day: lang === 'fr' ? 'Dimanche' : lang === 'es' ? 'Domingo' : 'Sunday', hours: lang === 'fr' ? 'Fermé' : lang === 'es' ? 'Cerrado' : 'Closed' },
                                  ].map((sched, i) => (
                                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-slate-200/40 last:border-0">
                                      <span className="font-bold text-slate-700">{sched.day}</span>
                                      <span className="text-slate-500 text-[11px] font-mono">{sched.hours}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* VIEW 3: MONTH VIEW */}
                  {calendarViewMode === 'month' && (
                    <div className="w-full overflow-x-auto">
                      <div className="min-w-[700px]">
                        {/* Days of week header */}
                        <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {(lang === 'fr' 
                            ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] 
                            : lang === 'es' 
                            ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] 
                            : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                          ).map((d, i) => (
                            <div key={i} className="py-2">{d}</div>
                          ))}
                        </div>

                        {/* Month Days Calculation */}
                        {(() => {
                          const year = currentCalendarDate.getFullYear();
                          const month = currentCalendarDate.getMonth();
                          
                          const firstDayDate = new Date(year, month, 1);
                          let startDay = firstDayDate.getDay();
                          startDay = startDay === 0 ? 6 : startDay - 1; // 0 = Monday
                          
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const daysInPrevMonth = new Date(year, month, 0).getDate();

                          const allDays: { day: number; currentMonth: boolean; dateString: string }[] = [];

                          // Leading days from prev month
                          for (let i = startDay - 1; i >= 0; i--) {
                            const dayNum = daysInPrevMonth - i;
                            const prevMonthDate = new Date(year, month - 1, dayNum);
                            const y = prevMonthDate.getFullYear();
                            const m = String(prevMonthDate.getMonth() + 1).padStart(2, '0');
                            const d = String(dayNum).padStart(2, '0');
                            allDays.push({ day: dayNum, currentMonth: false, dateString: `${y}-${m}-${d}` });
                          }

                          // Current month days
                          for (let i = 1; i <= daysInMonth; i++) {
                            const m = String(month + 1).padStart(2, '0');
                            const d = String(i).padStart(2, '0');
                            allDays.push({ day: i, currentMonth: true, dateString: `${year}-${m}-${d}` });
                          }

                          // Trailing days to complete grid cells
                          const remaining = (7 - (allDays.length % 7)) % 7;
                          for (let i = 1; i <= remaining; i++) {
                            const nextMonthDate = new Date(year, month + 1, i);
                            const y = nextMonthDate.getFullYear();
                            const m = String(nextMonthDate.getMonth() + 1).padStart(2, '0');
                            const d = String(i).padStart(2, '0');
                            allDays.push({ day: i, currentMonth: false, dateString: `${y}-${m}-${d}` });
                          }

                          return (
                            <div className="grid grid-cols-7 gap-2">
                              {allDays.map((cell, idx) => {
                                const dayEvents = getEventsForDate(cell.dateString);
                                const isToday = cell.dateString === todayStr;

                                return (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setSelectedDayModalDate(cell.dateString);
                                    }}
                                    className={`min-h-[115px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group/cell ${
                                      cell.currentMonth 
                                        ? isToday 
                                          ? 'bg-teal-50/30 border-[#0e9f8e]/50 shadow-sm' 
                                          : 'bg-[#fafafa] border-slate-200/80 hover:border-[#0e9f8e]/40 hover:bg-white' 
                                        : 'bg-black/[0.02] border-transparent opacity-40 hover:opacity-80'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const [y, m, d] = cell.dateString.split('-').map(Number);
                                          setCurrentCalendarDate(new Date(y, m - 1, d));
                                          setCalendarViewMode('day');
                                        }}
                                        className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transition-transform hover:scale-110 ${
                                          isToday 
                                            ? 'bg-[#0e9f8e] text-white shadow-xs' 
                                            : 'text-slate-700 hover:bg-black/5'
                                        }`}
                                        title={lang === 'fr' ? "Voir la journée en vue Jour" : "Switch to Day View"}
                                      >
                                        {cell.day}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        {(() => {
                                          const dayApptsCount = dayEvents.filter(ev => !ev.eventType || ev.eventType === 'appointment').length;
                                          return dayApptsCount > 0 ? (
                                            <span className="text-[10px] font-bold text-[#0e9f8e] bg-teal-50 px-1.5 py-0.2 rounded-full border border-teal-100">
                                              {dayApptsCount} {dayApptsCount === 1 ? 'rdv' : 'rdvs'}
                                            </span>
                                          ) : null;
                                        })()}
                                        <span 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickAddEvent(cell.dateString);
                                          }}
                                          className="opacity-0 group-hover/cell:opacity-100 text-[#0e9f8e] p-0.5 rounded hover:bg-teal-50 transition-opacity" 
                                          title={lang === 'fr' ? "Nouveau RDV rapide" : "Quick Add RDV"}
                                        >
                                          <Plus size={12} />
                                        </span>
                                      </div>
                                    </div>

                                    {/* Events snippets in cell (mini cyan cards) */}
                                    <div className="mt-1 space-y-1 overflow-hidden">
                                      {dayEvents.slice(0, 3).map((ev, evIdx) => {
                                        const isOther = ev.eventType && ev.eventType !== 'appointment';
                                        const timeStr = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                        const hasNote = !isOther && hasAppointmentNote(ev);
                                        const isSettled = !isOther && isAppointmentSettledOrRedeemed(ev);

                                        return (
                                          <div
                                            key={`month-ev-${cell.dateString}-${ev.id || 'ev'}-${evIdx}`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedAppointmentForDetails(ev);
                                            }}
                                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate leading-tight flex items-center justify-between transition-colors shadow-2xs ${
                                              isOther
                                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                                : 'bg-[#38c9d8] hover:bg-[#2fc0cf] text-[#063840] border border-[#20b4c5]'
                                            }`}
                                            title={`${timeStr} - ${getEventDisplayName(ev)}`}
                                          >
                                            <span className="truncate flex items-center gap-1">
                                              {isOther && <Lock size={10} className="shrink-0 text-amber-800" />}
                                              <span className="font-mono text-[9px] opacity-80">{timeStr}</span> {getEventDisplayName(ev)}
                                            </span>
                                            <div className="flex items-center gap-0.5 ml-1 shrink-0">
                                              {hasNote && (
                                                <FileText size={10} className="text-[#063840] shrink-0" title={lang === 'fr' ? "Note clinique enregistrée" : "Note recorded"} />
                                              )}
                                              {isSettled && (
                                                <span 
                                                  className="shrink-0 text-emerald-900 bg-emerald-100 p-0.5 rounded flex items-center justify-center border border-emerald-300/60" 
                                                  title={lang === 'fr' ? "Paiement réglé / Séance décomptée du Bono" : "Payment settled / Bono deducted"}
                                                >
                                                  <CreditCard size={8} className="text-emerald-800" />
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                      {dayEvents.length > 3 && (
                                        <p className="text-[9px] font-bold text-slate-500 pl-1">
                                          +{dayEvents.length - 3} {lang === 'fr' ? 'autre(s)' : 'more'}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                </div>
              );
            })()}

          </div>
        )}

        {/* TAB 4: BILLING & FINANCIALS */}
        {activeTab === 'billing' && (
          <div className="space-y-8 flex-1">
            {/* Header Block */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-primary">
                  {lang === 'fr' ? 'Facturation' : lang === 'es' ? 'Facturación' : 'Billing'}
                </h3>
                <p className="text-xs text-gray-500">
                </p>
              </div>

              <button
                onClick={() => setIsAddInvoiceOpen(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 whitespace-nowrap cursor-pointer"
              >
                <Plus size={16} className="shrink-0" />
                <span className="whitespace-nowrap">{lang === 'fr' ? "Émettre une Facture" : lang === 'es' ? "Emitir una Factura" : "Issue an Invoice"}</span>
              </button>
            </div>

            {/* billing performance & list block */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Financial stats card Column */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? 'Aperçu Récapitulatif' : lang === 'es' ? 'Resumen General' : 'Overview Summary'}
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                          {lang === 'fr' ? "Total Encaissé (Payé)" : lang === 'es' ? "Total Cobrado" : "Total Collected"}
                        </p>
                        <h4 className="text-2xl font-serif font-bold text-emerald-700">
                          {invoices.filter(i => i.status === 'paid').reduce((sum, item) => sum + item.amount, 0)} €
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-amber-600 uppercase tracking-wider font-bold">
                          {lang === 'fr' ? "En attente (Impayé)" : lang === 'es' ? "Pendiente" : "Pending"}
                        </p>
                        <h4 className="text-xl font-serif font-bold text-amber-700">
                          {invoices.filter(i => i.status === 'pending').reduce((sum, item) => sum + item.amount, 0)} €
                        </h4>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-black/5 flex justify-between text-xs">
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card'}
                        </p>
                        <p className="font-bold text-gray-700 mt-1">{invoices.filter(i => i.paymentMethod === 'card').reduce((sum, item) => sum + item.amount, 0)} €</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash'}
                        </p>
                        <p className="font-bold text-gray-700 mt-1">{invoices.filter(i => i.paymentMethod === 'cash').reduce((sum, item) => sum + item.amount, 0)} €</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase">
                          {lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transf.' : 'Transfer'}
                        </p>
                        <p className="font-bold text-gray-700 mt-1">{invoices.filter(i => i.paymentMethod === 'transfer').reduce((sum, item) => sum + item.amount, 0)} €</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accounting Period Recap & Print Card */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {translations[lang].admin.billing.accountingRecap}
                  </h4>

                  {/* Toggle Period Type */}
                  <div className="flex bg-[#f4f4ec] p-1 rounded-xl border border-black/5">
                    <button
                      type="button"
                      onClick={() => setRecapPeriodType('monthly')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        recapPeriodType === 'monthly'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-500 hover:bg-black/5'
                      }`}
                    >
                      {translations[lang].admin.billing.monthly}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecapPeriodType('annual')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        recapPeriodType === 'annual'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-500 hover:bg-black/5'
                      }`}
                    >
                      {translations[lang].admin.billing.annual}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecapPeriodType('custom')}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                        recapPeriodType === 'custom'
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-gray-500 hover:bg-black/5'
                      }`}
                    >
                      {translations[lang].admin.billing.custom}
                    </button>
                  </div>

                  {/* Selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    {recapPeriodType !== 'custom' ? (
                      <>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? 'Année' : lang === 'es' ? 'Año' : 'Year'}
                          </label>
                          <select
                            value={recapYear}
                            onChange={(e) => setRecapYear(Number(e.target.value))}
                            className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                          >
                            {(() => {
                              const yearNums: number[] = invoices.map(inv => {
                                try {
                                  return new Date(inv.date).getFullYear();
                                } catch {
                                  return new Date().getFullYear();
                                }
                              });
                              const invoiceYears = Array.from(new Set<number>(yearNums)).sort((a: number, b: number) => b - a);
                              const displayYears = invoiceYears.length > 0 ? invoiceYears : [new Date().getFullYear()];
                              return displayYears.map(yr => (
                                <option key={yr} value={yr}>{yr}</option>
                              ));
                            })()}
                          </select>
                        </div>

                        {recapPeriodType === 'monthly' && (
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                              {lang === 'fr' ? 'Mois' : lang === 'es' ? 'Mes' : 'Month'}
                            </label>
                            <select
                              value={recapMonth}
                              onChange={(e) => setRecapMonth(Number(e.target.value))}
                              className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                            >
                              {getMonthsList(lang).map((mthName, idx) => (
                                <option key={idx} value={idx}>{mthName}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {translations[lang].admin.billing.startDate}
                          </label>
                          <input
                            type="date"
                            value={recapStartDate}
                            onChange={(e) => setRecapStartDate(e.target.value)}
                            className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {translations[lang].admin.billing.endDate}
                          </label>
                          <input
                            type="date"
                            value={recapEndDate}
                            onChange={(e) => setRecapEndDate(e.target.value)}
                            className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Filtered statistics */}
                  {(() => {
                    const filtered = invoices.filter(inv => {
                      // Exclude 0 € Bono package session deductions from accounting recap!
                      const isRedemption = Boolean(
                        inv.amount === 0 ||
                        inv.isBonoRedemption ||
                        inv.paymentMethod === 'not_applicable' ||
                        (inv.discountType === 'bono' && inv.amount === 0) ||
                        (formatLocalizedBonoText(inv.discountLabel, lang) && formatLocalizedBonoText(inv.discountLabel, lang).toLowerCase().includes('décompté')) ||
                        (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('décompté'))
                      );

                      if (isRedemption) return false;

                      try {
                        const d = new Date(inv.date);
                        if (recapPeriodType === 'annual') {
                          return d.getFullYear() === recapYear;
                        } else if (recapPeriodType === 'monthly') {
                          return d.getFullYear() === recapYear && d.getMonth() === recapMonth;
                        } else {
                          const start = new Date(recapStartDate);
                          const end = new Date(recapEndDate);
                          start.setHours(0, 0, 0, 0);
                          end.setHours(23, 59, 59, 999);
                          return d >= start && d <= end;
                        }
                      } catch {
                        return false;
                      }
                    });

                    const totalAmt = filtered.reduce((sum, item) => sum + item.amount, 0);
                    const count = filtered.length;

                    const paidInvoices = filtered.filter(i => i.status !== 'pending');
                    const pendingInvoices = filtered.filter(i => i.status === 'pending');

                    const paidTotal = paidInvoices.reduce((sum, item) => sum + item.amount, 0);
                    const pendingTotal = pendingInvoices.reduce((sum, item) => sum + item.amount, 0);

                    const cardTotal = paidInvoices.filter(i => i.paymentMethod === 'card').reduce((sum, item) => sum + item.amount, 0);
                    const cashTotal = paidInvoices.filter(i => i.paymentMethod === 'cash').reduce((sum, item) => sum + item.amount, 0);
                    const transferTotal = paidInvoices.filter(i => i.paymentMethod === 'transfer').reduce((sum, item) => sum + item.amount, 0);

                    const cardPending = pendingInvoices.filter(i => i.paymentMethod === 'card').reduce((sum, item) => sum + item.amount, 0);
                    const cashPending = pendingInvoices.filter(i => i.paymentMethod === 'cash').reduce((sum, item) => sum + item.amount, 0);
                    const transferPending = pendingInvoices.filter(i => i.paymentMethod === 'transfer').reduce((sum, item) => sum + item.amount, 0);

                    return (
                      <div className="space-y-4 pt-3 border-t border-black/5">
                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <div className="text-left">
                              <p className="text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                                {lang === 'fr' ? 'Chiffre d\'Affaires Encaissé' : lang === 'es' ? 'Facturación Cobrada' : 'Collected Revenue'}
                              </p>
                              <h4 className="text-2xl font-serif font-bold text-emerald-700">{paidTotal} €</h4>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                                {translations[lang].admin.billing.consultations}
                              </p>
                              <p className="text-sm font-bold text-gray-700">{paidInvoices.length} / {count}</p>
                            </div>
                          </div>

                          {pendingTotal > 0 && (
                            <div className="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs text-amber-800">
                              <span className="font-semibold">{lang === 'fr' ? 'En attente (Impayé)' : lang === 'es' ? 'Pendiente (No cobrado)' : 'Pending (Unpaid)'} :</span>
                              <span className="font-bold">{pendingTotal} €</span>
                            </div>
                          )}

                          <div className="text-[10px] text-gray-400 text-right">
                            {lang === 'fr' ? 'Total facturé : ' : lang === 'es' ? 'Total facturado: ' : 'Total invoiced: '}
                            <span className="font-semibold">{totalAmt} €</span>
                          </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="bg-[#f4f4ec]/40 p-3 rounded-2xl space-y-2 text-xs">
                          <p className="text-[9px] uppercase font-bold text-primary/60 mb-1">
                            {lang === 'fr' ? 'Modes de règlement (Encaissé)' : lang === 'es' ? 'Métodos de pago (Cobrado)' : 'Payment Methods (Collected)'}
                          </p>
                          <div className="flex justify-between text-gray-600">
                            <span>{translations[lang].admin.billing.paymentCard} :</span>
                            <span className="font-bold text-gray-800">{cardTotal} €</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>{translations[lang].admin.billing.paymentCash} :</span>
                            <span className="font-bold text-gray-800">{cashTotal} €</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>{translations[lang].admin.billing.paymentTransfer} :</span>
                            <span className="font-bold text-gray-800">{transferTotal} €</span>
                          </div>

                          {pendingTotal > 0 && (
                            <div className="pt-2 border-t border-black/5 text-[10px] text-amber-700 space-y-1">
                              <p className="font-bold uppercase tracking-wider text-[8px] text-amber-600">
                                {lang === 'fr' ? 'Dont en attente de règlement :' : lang === 'es' ? 'Pendiente de cobro:' : 'Pending collection:'}
                              </p>
                              {cardPending > 0 && (
                                <div className="flex justify-between">
                                  <span>{translations[lang].admin.billing.paymentCard} :</span>
                                  <span className="font-medium">{cardPending} €</span>
                                </div>
                              )}
                              {cashPending > 0 && (
                                <div className="flex justify-between">
                                  <span>{translations[lang].admin.billing.paymentCash} :</span>
                                  <span className="font-medium">{cashPending} €</span>
                                </div>
                              )}
                              {transferPending > 0 && (
                                <div className="flex justify-between">
                                  <span>{translations[lang].admin.billing.paymentTransfer} :</span>
                                  <span className="font-medium">{transferPending} €</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecapForPrint({
                              periodType: recapPeriodType,
                              year: recapYear,
                              month: recapMonth,
                              startDate: recapStartDate,
                              endDate: recapEndDate,
                              invoices: filtered,
                              total: totalAmt,
                              collectedTotal: paidTotal,
                              pendingTotal: pendingTotal,
                              breakdown: { card: cardTotal, cash: cashTotal, transfer: transferTotal },
                              pendingBreakdown: { card: cardPending, cash: cashPending, transfer: transferPending },
                              count,
                              collectedCount: paidInvoices.length
                            });
                          }}
                          disabled={count === 0}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                        >
                          <Printer size={14} />
                          <span>{translations[lang].admin.billing.printRecap}</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-[#f4f4ec] p-6 rounded-3xl border border-black/5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? "Impression Directe" : lang === 'es' ? "Impresión Directa" : "Direct Printing"}
                  </h4>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    {lang === 'fr' ? "Cliquez sur l'icône d'imprimante à droite de n'importe quelle facture dans la liste pour ouvrir la fiche de reçu imprimable épurée, idéale à remettre directement aux patients pour leurs remboursements mutuelle." : lang === 'es' ? "Haga clic en el icono de la impresora a la derecha de cualquier factura de la lista para abrir el recibo imprimible simplificado, ideal para entregar directamente a los pacientes para los reembolsos de sus seguros." : "Click on the printer icon to the right of any invoice in the list to open the clean printable receipt sheet, ideal to give directly to patients for their health insurance reimbursements."}
                  </p>
                </div>
              </div>

              {/* Invoice Table Column */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm lg:col-span-2 overflow-x-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <FileText size={14} /> {lang === 'fr' ? "Journal des factures émises" : lang === 'es' ? "Diario de facturas emitidas" : "Log of issued invoices"}
                    </h4>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {displayedInvoices.length} {lang === 'fr' ? 'facture(s)' : lang === 'es' ? 'factura(s)' : 'invoice(s)'}
                    </span>
                  </div>

                  {/* Active default sort indicator */}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="inline-flex items-center gap-1.5 font-medium bg-[#f4f4ec] px-3 py-1.5 rounded-xl border border-black/5">
                      <Clock size={12} className="text-primary" />
                      <span className="font-semibold text-gray-700">
                        {invoiceSortField === 'date' ? (
                          invoiceSortAsc
                            ? (lang === 'fr' ? 'Classement : Date (anciennes d\'abord)' : lang === 'es' ? 'Fecha ascendente' : 'Date (oldest first)')
                            : (lang === 'fr' ? 'Classement : Date (plus récentes d\'abord)' : lang === 'es' ? 'Fecha (más recientes primero)' : 'Date (newest first)')
                        ) : invoiceSortField === 'invoiceNumber' ? (
                          lang === 'fr' ? `Classement : N° ${invoiceSortAsc ? 'croissant' : 'décroissant'}` : `Sort: Num ${invoiceSortAsc ? 'asc' : 'desc'}`
                        ) : invoiceSortField === 'clientName' ? (
                          lang === 'fr' ? `Classement : Patient (${invoiceSortAsc ? 'A-Z' : 'Z-A'})` : `Sort: Patient (${invoiceSortAsc ? 'A-Z' : 'Z-A'})`
                        ) : invoiceSortField === 'amount' ? (
                          lang === 'fr' ? `Classement : Montant (${invoiceSortAsc ? 'croissant' : 'décroissant'})` : `Sort: Amount`
                        ) : (
                          lang === 'fr' ? `Classement : Statut` : `Sort: Status`
                        )}
                      </span>
                    </span>
                    {(invoiceSortField !== 'date' || invoiceSortAsc !== false || invoiceSearchQuery || invoiceStatusFilter !== 'all' || invoiceMethodFilter !== 'all' || showBonoRedemptions) && (
                      <button
                        type="button"
                        onClick={() => {
                          setInvoiceSortField('date');
                          setInvoiceSortAsc(false);
                          setInvoiceSearchQuery('');
                          setInvoiceStatusFilter('all');
                          setInvoiceMethodFilter('all');
                          setShowBonoRedemptions(false);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline px-2 py-1 bg-primary/5 rounded-lg"
                      >
                        {lang === 'fr' ? 'Réinitialiser' : lang === 'es' ? 'Restablecer' : 'Reset'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter and search bar */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={invoiceSearchQuery}
                      onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                      placeholder={lang === 'fr' ? "Rechercher par nom de patient ou numéro..." : lang === 'es' ? "Buscar por paciente o número..." : "Search by patient or number..."}
                      className="w-full pl-8 pr-7 py-2 text-xs bg-[#f4f4ec] rounded-xl border border-black/5 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                    {invoiceSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setInvoiceSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Visual option checkbox to toggle 0 € Bono session deductions in billing log */}
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold select-none bg-[#f4f4ec] hover:bg-[#eaeae0] px-3 py-1.5 rounded-xl border border-black/5 transition-all">
                      <input
                        type="checkbox"
                        checked={showBonoRedemptions}
                        onChange={(e) => setShowBonoRedemptions(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-primary flex items-center gap-1">
                        <Sparkles size={11} className="text-teal-600" />
                        {lang === 'fr' 
                          ? "Afficher les décomptes Bono (0 €)" 
                          : lang === 'es' 
                          ? "Mostrar décomptes de Bono (0 €)" 
                          : "Show Bono redemptions (0 €)"}
                      </span>
                    </label>

                    {/* Status pills */}
                    <div className="flex items-center gap-1 bg-[#f4f4ec] p-1 rounded-xl border border-black/5">
                      <button
                        type="button"
                        onClick={() => setInvoiceStatusFilter('all')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          invoiceStatusFilter === 'all'
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-500 hover:bg-black/5'
                        }`}
                      >
                        {lang === 'fr' ? 'Toutes' : lang === 'es' ? 'Todas' : 'All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceStatusFilter('paid')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          invoiceStatusFilter === 'paid'
                            ? 'bg-emerald-700 text-white shadow-sm'
                            : 'text-gray-500 hover:bg-black/5'
                        }`}
                      >
                        {lang === 'fr' ? 'Payées' : lang === 'es' ? 'Cobradas' : 'Paid'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInvoiceStatusFilter('pending')}
                        className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all ${
                          invoiceStatusFilter === 'pending'
                            ? 'bg-amber-700 text-white shadow-sm'
                            : 'text-gray-500 hover:bg-black/5'
                        }`}
                      >
                        {lang === 'fr' ? 'En attente' : lang === 'es' ? 'Pendientes' : 'Pending'}
                      </button>
                    </div>
                  </div>
                </div>

                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-black/5 text-gray-400 select-none">
                      <th 
                        onClick={() => {
                          if (invoiceSortField === 'invoiceNumber') {
                            setInvoiceSortAsc(!invoiceSortAsc);
                          } else {
                            setInvoiceSortField('invoiceNumber');
                            setInvoiceSortAsc(false);
                          }
                        }}
                        className="py-3 font-semibold cursor-pointer hover:text-primary transition-colors"
                        title={lang === 'fr' ? 'Cliquer pour trier par numéro' : 'Click to sort by number'}
                      >
                        <div className="flex items-center gap-1">
                          <span>{translations[lang].admin.billing.tableNum}</span>
                          {invoiceSortField === 'invoiceNumber' ? (
                            invoiceSortAsc ? <ArrowUp size={11} className="text-primary font-bold" /> : <ArrowDown size={11} className="text-primary font-bold" />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (invoiceSortField === 'clientName') {
                            setInvoiceSortAsc(!invoiceSortAsc);
                          } else {
                            setInvoiceSortField('clientName');
                            setInvoiceSortAsc(true);
                          }
                        }}
                        className="py-3 font-semibold cursor-pointer hover:text-primary transition-colors"
                        title={lang === 'fr' ? 'Cliquer pour trier par patient' : 'Click to sort by patient'}
                      >
                        <div className="flex items-center gap-1">
                          <span>{translations[lang].admin.billing.tablePatient}</span>
                          {invoiceSortField === 'clientName' ? (
                            invoiceSortAsc ? <ArrowUp size={11} className="text-primary font-bold" /> : <ArrowDown size={11} className="text-primary font-bold" />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (invoiceSortField === 'date') {
                            setInvoiceSortAsc(!invoiceSortAsc);
                          } else {
                            setInvoiceSortField('date');
                            setInvoiceSortAsc(false);
                          }
                        }}
                        className="py-3 font-bold cursor-pointer text-primary hover:opacity-80 transition-colors"
                        title={lang === 'fr' ? 'Classement par date (Par défaut: plus récentes d\'abord)' : 'Sort by date (Default: newest first)'}
                      >
                        <div className="flex items-center gap-1 font-bold">
                          <span>{translations[lang].admin.billing.tableDate}</span>
                          {invoiceSortField === 'date' ? (
                            invoiceSortAsc ? <ArrowUp size={12} className="text-primary font-bold" /> : <ArrowDown size={12} className="text-primary font-bold" />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 font-semibold">{translations[lang].admin.billing.tableMethod}</th>
                      <th 
                        onClick={() => {
                          if (invoiceSortField === 'status') {
                            setInvoiceSortAsc(!invoiceSortAsc);
                          } else {
                            setInvoiceSortField('status');
                            setInvoiceSortAsc(false);
                          }
                        }}
                        className="py-3 font-semibold text-center cursor-pointer hover:text-primary transition-colors"
                        title={lang === 'fr' ? 'Cliquer pour trier par statut' : 'Click to sort by status'}
                      >
                        <div className="inline-flex items-center justify-center gap-1">
                          <span>{lang === 'fr' ? 'Statut' : lang === 'es' ? 'Estado' : 'Status'}</span>
                          {invoiceSortField === 'status' ? (
                            invoiceSortAsc ? <ArrowUp size={11} className="text-primary font-bold" /> : <ArrowDown size={11} className="text-primary font-bold" />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-40" />
                          )}
                        </div>
                      </th>
                      <th 
                        onClick={() => {
                          if (invoiceSortField === 'amount') {
                            setInvoiceSortAsc(!invoiceSortAsc);
                          } else {
                            setInvoiceSortField('amount');
                            setInvoiceSortAsc(false);
                          }
                        }}
                        className="py-3 font-semibold text-right cursor-pointer hover:text-primary transition-colors"
                        title={lang === 'fr' ? 'Cliquer pour trier par montant' : 'Click to sort by amount'}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span>{translations[lang].admin.billing.tableAmount}</span>
                          {invoiceSortField === 'amount' ? (
                            invoiceSortAsc ? <ArrowUp size={11} className="text-primary font-bold" /> : <ArrowDown size={11} className="text-primary font-bold" />
                          ) : (
                            <ArrowUpDown size={10} className="opacity-40" />
                          )}
                        </div>
                      </th>
                      <th className="py-3 font-semibold text-right">{translations[lang].admin.billing.tableActions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedInvoices.map((inv, invIdx) => {
                      const isZeroBonoRedemption = Boolean(
                        inv.amount === 0 &&
                        (inv.isBonoRedemption || 
                         inv.paymentMethod === 'not_applicable' ||
                         (inv.discountType === 'bono' && inv.amount === 0) ||
                         (formatLocalizedBonoText(inv.description, lang) && (formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('décomptée') || formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('decomptée'))))
                      );
                      return (
                      <tr 
                        key={inv.id ? `${inv.id}-${invIdx}` : `inv-${invIdx}`} 
                        className={`border-b transition-colors group ${
                          isZeroBonoRedemption 
                            ? 'bg-emerald-50/40 hover:bg-emerald-50/70 border-emerald-100/60' 
                            : 'border-black/5 hover:bg-black/[0.01]'
                        }`}
                      >
                        <td className="py-4">
                          {isZeroBonoRedemption ? (
                            <div className="flex flex-col items-start gap-1">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-200/90 shadow-2xs">
                                <Sparkles size={11} className="text-emerald-700 shrink-0" />
                                {translations[lang]?.admin?.billing?.bonoRedemptionLabel || (lang === 'fr' ? 'Décompté du Bono' : lang === 'es' ? 'Descontado del Bono' : 'Redeemed from Bono')}
                              </span>
                              <span className="text-[9px] text-gray-400 font-medium">
                                {inv.invoiceNumber ? `#${inv.invoiceNumber}` : (lang === 'fr' ? 'Séance décomptée' : lang === 'es' ? 'Sesión descontada' : 'Redeemed session')}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-primary">{inv.invoiceNumber}</span>
                          )}
                        </td>
                        <td className="py-4 font-bold">
                          <div>{inv.clientName}</div>
                          {isZeroBonoRedemption && (
                            <div className="text-[10px] font-medium text-emerald-800/80 mt-0.5">
                              {formatLocalizedBonoText(inv.discountLabel, lang) || (lang === 'fr' ? 'Forfait Bono' : lang === 'es' ? 'Bono prepagado' : 'Prepaid Bono')}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-gray-500 text-xs">
                          <div className="font-medium text-gray-700">{new Date(inv.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}</div>
                          {inv.status === 'paid' && inv.paymentDate && inv.paymentDate !== inv.date ? (
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              {lang === 'fr' ? 'Règlement : ' : lang === 'es' ? 'Pago: ' : 'Paid: '}
                              {new Date(inv.paymentDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-4">
                          {isZeroBonoRedemption || inv.paymentMethod === 'not_applicable' ? (
                            <span 
                              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200 inline-block"
                              title={lang === 'fr' ? 'Aucun paiement direct : décompté du Bono précédemment payé' : lang === 'es' ? 'Sin pago directo: descontado del Bono previamente pagado' : 'No direct payment: deducted from previously paid Bono'}
                            >
                              {translations[lang]?.admin?.billing?.notApplicable || (lang === 'fr' ? 'Non applicable' : lang === 'es' ? 'No aplicable' : 'Not applicable')}
                            </span>
                          ) : (
                            <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              inv.paymentMethod === 'card' ? 'bg-indigo-50 text-indigo-700' :
                              inv.paymentMethod === 'cash' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {inv.paymentMethod === 'card' ? (lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card') :
                               inv.paymentMethod === 'cash' ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash') : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer')}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {isZeroBonoRedemption ? (
                            <span 
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-2xs"
                              title={lang === 'fr' ? 'Séance réglée par décompte sur forfait' : lang === 'es' ? 'Sesión pagada mediante descuento de bono' : 'Session paid via package deduction'}
                            >
                              <CheckCircle2 size={11} className="text-emerald-700" />
                              <span>{translations[lang]?.admin?.billing?.statusSettledBono || (lang === 'fr' ? 'Réglé (Bono)' : lang === 'es' ? 'Pagado (Bono)' : 'Settled (Bono)')}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleToggleInvoiceStatus(inv)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider transition-all cursor-pointer ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300/60'
                                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300/80 animate-pulse'
                              }`}
                              title={inv.status === 'pending'
                                ? (lang === 'fr' ? 'Cliquer pour marquer comme payée' : 'Click to mark as paid')
                                : (lang === 'fr' ? 'Cliquer pour passer en attente' : 'Click to mark as pending')}
                            >
                              {inv.status === 'paid' ? (
                                <>
                                  <CheckCircle2 size={11} className="text-emerald-700" />
                                  <span>{translations[lang].admin.billing.statusPaid || 'Payée'}</span>
                                </>
                              ) : (
                                <>
                                  <Clock size={11} className="text-amber-700" />
                                  <span>{translations[lang].admin.billing.statusPending || 'En attente'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          {isZeroBonoRedemption ? (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-gray-400 line-through">
                                  {inv.originalAmount ? `${inv.originalAmount} €` : '60 €'}
                                </span>
                                <span className="font-extrabold text-emerald-800 text-xs">0 €</span>
                              </div>
                              <span className="text-[9px] text-gray-500 text-right leading-tight mt-0.5">
                                {translations[lang]?.admin?.billing?.redeemedFromPrepaidBono || (lang === 'fr' ? '(Décompté du Bono précédemment payé)' : lang === 'es' ? '(Descontado del Bono previamente pagado)' : '(Deducted from previously paid Bono)')}
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1.5">
                                {inv.originalAmount !== undefined && inv.discountAmount !== undefined && inv.discountAmount > 0 ? (
                                  <span className="text-[10px] text-gray-400 line-through">
                                    {inv.originalAmount} €
                                  </span>
                                ) : null}
                                <span className="font-bold text-primary">{inv.amount} €</span>
                              </div>
                              {inv.discountAmount && inv.discountAmount > 0 ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 text-[9px] font-semibold mt-0.5">
                                  <BadgePercent size={10} />
                                  {formatLocalizedBonoText(inv.discountLabel, lang) || (inv.discountType === 'bono' ? 'Bono' : 'Remise')} -{inv.discountAmount}€
                                </span>
                              ) : null}
                            </div>
                          )}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingInvoice(inv);
                                setIsEditInvoiceOpen(true);
                              }}
                              className="p-1.5 hover:bg-black/5 text-gray-500 hover:text-primary rounded-lg transition-all inline-flex items-center"
                              title={lang === 'fr' ? "Modifier" : lang === 'es' ? "Editar" : "Edit"}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className={`p-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 ${
                                isZeroBonoRedemption 
                                  ? 'hover:bg-emerald-100 text-emerald-800' 
                                  : 'hover:bg-primary/10 text-primary'
                              }`}
                              title={isZeroBonoRedemption 
                                ? (lang === 'fr' ? "Justificatif de séance décomptée" : lang === 'es' ? "Comprobante de sesión" : "Session voucher")
                                : translations[lang].admin.billing.print
                              }
                            >
                              <Printer size={13} />
                              <span className="text-[10px] uppercase font-bold tracking-wider">
                                {isZeroBonoRedemption 
                                  ? (translations[lang]?.admin?.billing?.sessionVoucher || (lang === 'fr' ? 'Justificatif' : lang === 'es' ? 'Comprobante' : 'Voucher'))
                                  : translations[lang].admin.billing.receipt}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg transition-all inline-flex items-center"
                              title={translations[lang].admin.billing.delete}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    {displayedInvoices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          {invoices.length === 0
                            ? translations[lang].admin.billing.noInvoices
                            : (lang === 'fr' ? 'Aucune facture ne correspond à ces critères.' : 'No invoices match these criteria.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: TELEGRAM MORNING DIGEST */}
        {activeTab === 'telegram' && (
          <TelegramSettingsPanel
            lang={lang}
            onStatusChange={(enabled, configured) =>
              setTelegramStatus(prev => ({ ...prev, enabled, configured }))
            }
          />
        )}

      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (md:hidden, Native App style) */}
      <nav 
        aria-label="Navigation mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] print:hidden pb-[max(env(safe-area-inset-bottom,0px),8px)] pt-1.5 px-2 select-none"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {[
            { id: 'overview', label: t.admin.tabs.overview, icon: TrendingUp },
            { id: 'clients', label: t.admin.tabs.clients, icon: Users },
            { id: 'calendar', label: t.admin.tabs.calendar, icon: Calendar },
            { id: 'billing', label: t.admin.tabs.billing, icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (item.id === 'calendar') {
                    setCurrentCalendarDate(new Date());
                  }
                  setActiveTab(item.id as TabType);
                }}
                className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-2xl transition-all active:scale-95 touch-manipulation min-h-[48px] cursor-pointer ${
                  isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    isActive ? 'bg-primary/10 text-primary scale-105' : 'text-gray-400'
                  }`}
                >
                  <Icon size={19} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-[72px] ${
                    isActive ? 'font-bold text-primary' : 'font-medium text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ==========================================
          MODALS & OVERLAYS
          ========================================== */}
      
      {/* MODAL: ADD CLIENT */}
      <AnimatePresence>
        {isAddClientOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setIsAddClientOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-8 z-10 border border-black/5 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-serif font-bold text-primary mb-6">
                {lang === 'fr' ? 'Nouveau Patient' : lang === 'es' ? 'Nuevo Paciente' : 'New Patient'}
              </h3>
              
              <form onSubmit={handleAddClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Nom' : lang === 'es' ? 'Apellido' : 'Last name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newClient.lastName}
                      onChange={(e) => setNewClient(prev => ({ ...prev, lastName: e.target.value.toUpperCase() }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Prénom' : lang === 'es' ? 'Nombre' : 'First name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newClient.firstName}
                      onChange={(e) => setNewClient(prev => ({ ...prev, firstName: capitalizeFirstName(e.target.value) }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                 <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Email' : lang === 'es' ? 'Correo' : 'Email'}
                  </label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Téléphone' : lang === 'es' ? 'Teléfono' : 'Phone'}
                  </label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'DNI / NIE (Identité)' : lang === 'es' ? 'DNI / NIE (Identificación)' : 'DNI / NIE (ID number)'}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 48765432A"
                      value={newClient.dni}
                      onChange={(e) => setNewClient(prev => ({ ...prev, dni: e.target.value.toUpperCase() }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all uppercase placeholder:normal-case font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date de Naissance' : lang === 'es' ? 'Fecha de nacimiento' : 'Date of Birth'}
                    </label>
                    <input
                      type="date"
                      value={newClient.birthDate}
                      onChange={(e) => setNewClient(prev => ({ ...prev, birthDate: e.target.value }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Adresse postale' : lang === 'es' ? 'Dirección postal' : 'Postal address'}
                  </label>
                  <input
                    type="text"
                    value={newClient.address}
                    onChange={(e) => setNewClient(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>



                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddClientOpen(false)}
                    className="w-full sm:flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all text-center cursor-pointer"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-3 px-4 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md text-center whitespace-nowrap cursor-pointer"
                  >
                    {lang === 'fr' ? 'Créer la fiche' : lang === 'es' ? 'Crear ficha' : 'Create profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: DAY SPECIFIC APPOINTMENTS */}
      <AnimatePresence>
        {selectedDayModalDate && (
          <div 
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
            onClick={() => setSelectedDayModalDate(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-4 sm:p-8 z-10 border border-black/5 flex flex-col my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <CalendarIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-serif font-bold text-gray-900 capitalize">
                      {(() => {
                        const [y, m, d] = selectedDayModalDate.split('-').map(Number);
                        const dateObj = new Date(y, m - 1, d);
                        return dateObj.toLocaleDateString(
                          lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US',
                          { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                        );
                      })()}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {(() => {
                        const dayAppts = events.filter(ev => {
                          try {
                            const isAppt = !ev.eventType || ev.eventType === 'appointment';
                            if (!isAppt) return false;
                            const evDate = new Date(ev.start);
                            const y = evDate.getFullYear();
                            const m = String(evDate.getMonth() + 1).padStart(2, '0');
                            const d = String(evDate.getDate()).padStart(2, '0');
                            return `${y}-${m}-${d}` === selectedDayModalDate;
                          } catch (e) {
                            return false;
                          }
                        });
                        if (dayAppts.length === 0) {
                          return lang === 'fr' ? 'Aucune consultation ce jour' : lang === 'es' ? 'Sin citas este día' : 'No appointments on this day';
                        }
                        return lang === 'fr' 
                          ? `${dayAppts.length} consultation${dayAppts.length > 1 ? 's' : ''} programmée${dayAppts.length > 1 ? 's' : ''}` 
                          : lang === 'es' 
                          ? `${dayAppts.length} cita${dayAppts.length > 1 ? 's' : ''}` 
                          : `${dayAppts.length} appointment${dayAppts.length > 1 ? 's' : ''}`;
                      })()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setNewEvent(prev => ({
                        ...prev,
                        date: selectedDayModalDate,
                        title: "Sesión de osteopatía",
                        description: ""
                      }));
                      setIsAddEventOpen(true);
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-sm whitespace-nowrap cursor-pointer"
                  >
                    <Plus size={14} className="shrink-0" />
                    <span>{lang === 'fr' ? 'Nouveau RDV' : lang === 'es' ? 'Nueva Cita' : 'New Appointment'}</span>
                  </button>

                  <button
                    onClick={() => setSelectedDayModalDate(null)}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Day Events List */}
              <div className="flex-1 overflow-y-auto my-4 pr-1 space-y-3">
                {(() => {
                  const dayEvents = events.filter(ev => {
                    try {
                      const evDate = new Date(ev.start);
                      const y = evDate.getFullYear();
                      const m = String(evDate.getMonth() + 1).padStart(2, '0');
                      const d = String(evDate.getDate()).padStart(2, '0');
                      return `${y}-${m}-${d}` === selectedDayModalDate;
                    } catch (e) {
                      return false;
                    }
                  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

                  if (dayEvents.length === 0) {
                    return (
                      <div className="py-12 text-center bg-gray-50/70 rounded-2xl border border-dashed border-gray-200">
                        <Clock size={32} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm font-semibold text-gray-700">
                          {lang === 'fr' ? 'Aucun rendez-vous prévu pour cette journée' : lang === 'es' ? 'No hay citas programadas para este día' : 'No appointments scheduled for this day'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                          {lang === 'fr' ? 'Vous pouvez planifier un nouveau rendez-vous en cliquant sur le bouton ci-dessus.' : 'You can schedule a new appointment using the button above.'}
                        </p>
                        <button
                          onClick={() => {
                            setNewEvent(prev => ({
                              ...prev,
                              date: selectedDayModalDate,
                              title: "Sesión de osteopatía",
                              description: ""
                            }));
                            setIsAddEventOpen(true);
                          }}
                          className="mt-4 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 hover:bg-primary/90 transition-all"
                        >
                          <Plus size={14} />
                          <span>{lang === 'fr' ? 'Ajouter un RDV pour ce jour' : 'Add appointment for this day'}</span>
                        </button>
                      </div>
                    );
                  }

                  return dayEvents.map((ev, evIdx) => {
                    const isOther = ev.eventType && ev.eventType !== 'appointment';
                    const startDate = new Date(ev.start);
                    const endDate = new Date(ev.end);
                    const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const hasNote = !isOther && allNotes.some(n => n.eventId && n.eventId === ev.id);
                    const note = !isOther ? allNotes.find(n => n.eventId && n.eventId === ev.id) : undefined;
                    const client = !isOther ? (ev.clientId ? clients.find(c => c.id === ev.clientId) : (ev.clientName ? clients.find(c => c.name.toLowerCase() === ev.clientName?.toLowerCase()) : undefined)) : undefined;
                    const clientPhone = client?.phone || '';

                    return (
                      <div
                        key={ev.id ? `${ev.id}-${evIdx}` : `agenda-ev-${evIdx}`}
                        onClick={() => setSelectedAppointmentForDetails(ev)}
                        className={`p-3.5 rounded-2xl border shadow-2xs transition-all space-y-2 group cursor-pointer ${
                          isOther 
                            ? 'bg-amber-50 border-amber-200 text-amber-950 hover:bg-amber-100/90' 
                            : 'bg-[#38c9d8]/15 hover:bg-[#38c9d8]/30 border-[#20b4c5]/50'
                        }`}
                        title={lang === 'fr' ? 'Cliquer pour voir les détails' : 'Click to view details'}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-lg border shrink-0 ${
                              isOther ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-[#009cb2] border-[#20b4c5]/60'
                            }`}>
                              {startTime} - {endTime}
                            </span>
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-slate-900 truncate">{getEventDisplayName(ev)}</span>
                              {isOther && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-200/80 text-amber-900 border border-amber-300">
                                  {getEventTypeLabel(ev.eventType)}
                                </span>
                              )}
                              {hasNote && (
                                <span className="w-5 h-5 rounded-md bg-white text-[#009cb2] flex items-center justify-center shadow-2xs shrink-0" title="Note clinique au dossier">
                                  <FileText size={11} />
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {!isOther && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGoToNotes(ev);
                                }}
                                className="px-2.5 py-1 bg-[#009cb2] hover:bg-[#00838f] text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                title={lang === 'fr' ? 'Fiche patient & Notes' : 'Patient Notes'}
                              >
                                <FileText size={12} />
                                <span className="hidden sm:inline">{lang === 'fr' ? 'Fiche' : 'File'}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Profile Note si il y en a une */}
                        {client?.profileNote && (
                          <div className="p-2 rounded-xl bg-white border border-[#20b4c5]/40 text-xs text-slate-800 flex items-start gap-1.5 shadow-2xs">
                            <Info size={12} className="text-[#009cb2] shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-snug font-medium italic text-slate-700">
                              {client.profileNote}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-black/5 flex justify-end">
                <button
                  onClick={() => setSelectedDayModalDate(null)}
                  className="px-5 py-2.5 bg-secondary text-gray-700 rounded-xl text-xs font-bold hover:bg-black/5 transition-all"
                >
                  {lang === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BLOCK / PLAN EVENT (GOOGLE CALENDAR) */}
      <AnimatePresence>
        {isAddEventOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => setIsAddEventOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-8 z-10 border border-black/5 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-serif font-bold text-primary">
                    {newEvent.eventType === 'appointment'
                      ? (lang === 'fr' ? 'Nouveau Rendez-vous' : lang === 'es' ? 'Nueva Cita' : 'New Appointment')
                      : (lang === 'fr' ? 'Nouveau Créneau Bloqué / Indispo' : lang === 'es' ? 'Nuevo Horario Bloqueado' : 'New Blocked Slot')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'fr' ? 'Planifier sur votre agenda' : lang === 'es' ? 'Planificar en su agenda' : 'Schedule on your calendar'}
                  </p>
                </div>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                  newEvent.eventType === 'appointment' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {newEvent.eventType === 'appointment' ? <CalendarIcon size={18} /> : <Lock size={18} />}
                </div>
              </div>

              {/* Event Type Selector */}
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-2">
                  {lang === 'fr' ? 'Type de créneau' : lang === 'es' ? 'Tipo de horario' : 'Slot Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'appointment' as EventType, label: lang === 'fr' ? 'RDV Patient' : lang === 'es' ? 'Cita Paciente' : 'Patient Appt', icon: CalendarIcon, color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                    { type: 'blocked' as EventType, label: lang === 'fr' ? 'Bloqué / Indispo' : lang === 'es' ? 'Bloqueado / No disp.' : 'Blocked', icon: Lock, color: 'border-amber-500 bg-amber-50 text-amber-900' },
                  ].map(item => {
                    const isSelected = (newEvent.eventType || 'appointment') === item.type;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setNewEvent(prev => ({
                            ...prev,
                            eventType: item.type,
                            title: item.type === 'appointment' 
                              ? (prev.clientId ? (clients.find(c => c.id === prev.clientId)?.name || getDefaultAppointmentTitle(lang)) : getDefaultAppointmentTitle(lang))
                              : (lang === 'fr' ? 'Créneau bloqué' : lang === 'es' ? 'Horario bloqueado' : 'Blocked slot')
                          }));
                        }}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-bold transition-all border text-left ${
                          isSelected ? `${item.color} shadow-xs` : 'bg-secondary/60 border-transparent text-gray-600 hover:bg-secondary'
                        }`}
                      >
                        <ItemIcon size={16} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                {/* Patient selection only for appointment */}
                {(!newEvent.eventType || newEvent.eventType === 'appointment') ? (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                        {lang === 'fr' ? 'Patient associé' : lang === 'es' ? 'Paciente asociado' : 'Associated Patient'}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsInlineNewPatient(!isInlineNewPatient)}
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={13} />
                        <span>
                          {isInlineNewPatient
                            ? (lang === 'fr' ? 'Choisir patient existant' : lang === 'es' ? 'Elegir paciente existente' : 'Select existing patient')
                            : (lang === 'fr' ? '+ Nouveau patient' : lang === 'es' ? '+ Nuevo paciente' : '+ New patient')}
                        </span>
                      </button>
                    </div>

                    {isInlineNewPatient ? (
                      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
                        <div className="flex items-center justify-between gap-2 border-b border-primary/10 pb-2">
                          <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                            <UserPlus size={14} />
                            <span>{lang === 'fr' ? 'Création de la fiche patient (enregistrée dans vos dossiers)' : lang === 'es' ? 'Creación de ficha paciente' : 'Create patient record'}</span>
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setNewClient({
                                firstName: inlinePatient.firstName,
                                lastName: inlinePatient.lastName,
                                dni: inlinePatient.dni,
                                email: inlinePatient.email,
                                phone: inlinePatient.phone,
                                birthDate: inlinePatient.birthDate || '',
                                address: inlinePatient.address || '',
                                hasBono: inlinePatient.hasBono || false,
                                bonoType: inlinePatient.bonoType || "",
                                defaultDiscount: inlinePatient.defaultDiscount || 10,
                                bonoSessionsRemaining: inlinePatient.bonoSessionsRemaining || 5,
                              });
                              setReturnToAppointmentAfterClientCreate(true);
                              setIsAddClientOpen(true);
                            }}
                            className="text-[10px] text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            title={lang === 'fr' ? "Ouvrir dans la boîte de dialogue complète" : "Open in full modal"}
                          >
                            <ExternalLink size={11} />
                            <span>{lang === 'fr' ? 'Formulaire complet' : 'Full form'}</span>
                          </button>
                        </div>

                        {/* Nom & Prénom */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                              {lang === 'fr' ? 'Nom *' : 'Last name *'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="NOM"
                              value={inlinePatient.lastName}
                              onChange={(e) => setInlinePatient(prev => ({ ...prev, lastName: e.target.value.toUpperCase() }))}
                              className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                              {lang === 'fr' ? 'Prénom *' : 'First name *'}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="Prénom"
                              value={inlinePatient.firstName}
                              onChange={(e) => setInlinePatient(prev => ({ ...prev, firstName: capitalizeFirstName(e.target.value) }))}
                              className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        {/* Téléphone & Email */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                              {lang === 'fr' ? 'Téléphone' : 'Phone'}
                            </label>
                            <input
                              type="tel"
                              placeholder="06 12 34 56 78"
                              value={inlinePatient.phone}
                              onChange={(e) => setInlinePatient(prev => ({ ...prev, phone: e.target.value }))}
                              className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                              {lang === 'fr' ? 'Email' : 'Email'}
                            </label>
                            <input
                              type="email"
                              placeholder="patient@email.com"
                              value={inlinePatient.email}
                              onChange={(e) => setInlinePatient(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        {/* DNI / NIE & Date de Naissance */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                              {lang === 'fr' ? 'DNI / NIE (Identité)' : 'DNI / NIE (ID)'}
                            </label>
                            <input
                              type="text"
                              placeholder="48765432A"
                              value={inlinePatient.dni}
                              onChange={(e) => setInlinePatient(prev => ({ ...prev, dni: e.target.value.toUpperCase() }))}
                              className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary uppercase placeholder:normal-case font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                              {lang === 'fr' ? 'Date de Naissance' : 'Date of Birth'}
                            </label>
                            <input
                              type="date"
                              value={inlinePatient.birthDate}
                              onChange={(e) => setInlinePatient(prev => ({ ...prev, birthDate: e.target.value }))}
                              className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </div>
                        </div>

                        {/* Adresse */}
                        <div>
                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-500 block mb-0.5">
                            {lang === 'fr' ? 'Adresse postale' : 'Postal address'}
                          </label>
                          <input
                            type="text"
                            placeholder="Rue, Code postal, Ville..."
                            value={inlinePatient.address}
                            onChange={(e) => setInlinePatient(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>


                      </div>
                    ) : (
                      <select
                        value={newEvent.clientId}
                        onChange={(e) => {
                          const selectedId = e.target.value;
                          if (selectedId === '__new__') {
                            setIsInlineNewPatient(true);
                            return;
                          }
                          if (selectedId === '__new_modal__') {
                            setReturnToAppointmentAfterClientCreate(true);
                            setIsAddClientOpen(true);
                            return;
                          }
                          const client = clients.find(c => c.id === selectedId);
                          setNewEvent(prev => ({
                            ...prev,
                            clientId: selectedId,
                            title: client ? client.name : getDefaultAppointmentTitle(lang)
                          }));
                        }}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all font-medium"
                      >
                        <option value="">-- {lang === 'fr' ? 'Aucun ou patient non répertorié' : lang === 'es' ? 'Ninguno o no registrado' : 'None or unlisted'} --</option>
                        <option value="__new__" className="font-bold text-primary">
                          ✨ + {lang === 'fr' ? 'Nouveau patient' : lang === 'es' ? 'Nuevo paciente' : 'New patient'}
                        </option>
                        {clients.map((c, cIdx) => (
                          <option key={c.id ? `${c.id}-${cIdx}` : `client-opt-${cIdx}`} value={c.id}>{c.name} ({c.phone || c.email || 'N/A'})</option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* Quick suggestion tags for non-RDV types */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">
                        {lang === 'fr' ? 'Suggestions rapides :' : lang === 'es' ? 'Sugerencias rápidas:' : 'Quick suggestions:'}
                      </span>
                      {(
                        lang === 'fr' ? ['Indisponible', 'Indispo / Bloqué', 'Formation', 'Congés / Vacances', 'Déplacement'] :
                        lang === 'es' ? ['No disponible', 'Formación', 'Vacaciones', 'Desplazamiento'] :
                        ['Unavailable', 'Training', 'Vacation', 'Travel']
                      ).map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setNewEvent(prev => ({ ...prev, title: suggestion }))}
                          className="px-2 py-0.5 rounded-lg bg-secondary hover:bg-black/10 text-[11px] font-medium text-gray-700 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {newEvent.eventType === 'appointment' 
                      ? (lang === 'fr' ? 'Intitulé de la consultation' : lang === 'es' ? 'Título de la consulta' : 'Appointment Title') 
                      : (lang === 'fr' ? 'Titre ou Motif du créneau' : lang === 'es' ? 'Título o Motivo del horario' : 'Slot Title / Reason')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={newEvent.eventType === 'appointment' 
                      ? getDefaultAppointmentTitle(lang) 
                      : (lang === 'fr' ? 'Ex: Pause déjeuner, Indisponible...' : lang === 'es' ? 'Ej: Pausa almuerzo, No disponible...' : 'Ex: Lunch break, Unavailable...')}
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date' : lang === 'es' ? 'Fecha' : 'Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={newEvent.date}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Début' : lang === 'es' ? 'Inicio' : 'Start'} *
                      </label>
                      <input
                        type="time"
                        step="60"
                        required
                        value={newEvent.startTime}
                        onChange={(e) => {
                          const startTime = e.target.value;
                          if (!startTime) return;
                          const [hours, minutes] = startTime.split(':').map(Number);
                          const date = new Date();
                          date.setHours(hours);
                          date.setMinutes((minutes || 0) + (newEvent.eventType === 'appointment' ? 55 : 30));
                          const endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                          setNewEvent(prev => ({ ...prev, startTime, endTime }));
                        }}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                      {/* Minute presets :00, :15, :30, :45 */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {['00', '15', '30', '45'].map(min => {
                          const currentH = newEvent.startTime ? newEvent.startTime.split(':')[0] : '10';
                          const isSel = newEvent.startTime?.split(':')[1] === min;
                          return (
                            <button
                              key={min}
                              type="button"
                              onClick={() => {
                                const startTime = `${currentH}:${min}`;
                                const [h, m] = [parseInt(currentH, 10), parseInt(min, 10)];
                                const date = new Date();
                                date.setHours(h);
                                date.setMinutes((m || 0) + (newEvent.eventType === 'appointment' ? 55 : 30));
                                const endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                setNewEvent(prev => ({ ...prev, startTime, endTime }));
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                isSel ? 'bg-[#009cb2] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              :{min}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Fin' : lang === 'es' ? 'Fin' : 'End'} *
                      </label>
                      <input
                        type="time"
                        step="60"
                        required
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                      {/* Duration presets */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {[
                          { label: '30m', mins: 30 },
                          { label: '45m', mins: 45 },
                          { label: '55m', mins: 55 },
                          { label: '1h', mins: 60 },
                        ].map(d => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => {
                              if (!newEvent.startTime) return;
                              const [h, m] = newEvent.startTime.split(':').map(Number);
                              const date = new Date();
                              date.setHours(h);
                              date.setMinutes((m || 0) + d.mins);
                              const endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                              setNewEvent(prev => ({ ...prev, endTime }));
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Notes / Remarques' : lang === 'es' ? 'Notas / Observaciones' : 'Notes / Remarks'}
                  </label>
                  <textarea
                    value={newEvent.description}
                    placeholder={lang === 'fr' ? 'Remarques (optionnel)...' : lang === 'es' ? 'Notas (opcional)...' : 'Remarks (optional)...'}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="w-full sm:flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all text-center cursor-pointer"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-3 px-4 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <CalendarIcon size={14} className="shrink-0" />
                    <span className="whitespace-nowrap">
                      {newEvent.eventType === 'appointment'
                        ? (lang === 'fr' ? 'Créer le rendez-vous' : lang === 'es' ? 'Crear cita' : 'Create appointment')
                        : (lang === 'fr' ? 'Enregistrer le créneau' : lang === 'es' ? 'Guardar horario' : 'Save slot')}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: APPOINTMENT DETAILS (Détails du rendez-vous & Suppression sécurisée) */}
      <AnimatePresence>
        {selectedAppointmentForDetails && (() => {
          const ev = selectedAppointmentForDetails;
          const isOther = ev.eventType && ev.eventType !== 'appointment';
          const client = !isOther ? getEventClient(ev) : null;
          const cleanRemark = ev.description?.replace(/\[eventType:[a-z]+\]/gi, '').replace(/\[type:[a-z]+\]/gi, '').trim();
          const profileNote = client?.profileNote?.trim();
          
          const startDate = new Date(ev.start);
          const endDate = new Date(ev.end);
          const dateFormatted = !isNaN(startDate.getTime())
            ? startDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })
            : '';
          const startStr = !isNaN(startDate.getTime())
            ? startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
          const endStr = !isNaN(endDate.getTime())
            ? endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '';
          const durationMinutes = !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())
            ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
            : 55;

          const eventDisplayName = isOther
            ? (cleanRemark || ev.summary || (lang === 'fr' ? 'Créneau indisponible' : 'Bloqueado'))
            : getEventDisplayName(ev);

          const hasNote = !isOther && hasAppointmentNote(ev);
          const targetDateStr = ev.start ? ev.start.split('T')[0] : '';
          const clientId = ev.clientId || client?.id;
          const clientName = client?.name;

          const associatedInvoices = !isOther ? invoices.filter(inv => {
            const isEventMatch = Boolean(ev.id && (inv.eventId === ev.id || inv.noteId === ev.id));
            const isClientMatch = Boolean((clientId && inv.clientId === clientId) || 
                                  (clientName && inv.clientName && inv.clientName.trim().toLowerCase() === clientName.trim().toLowerCase()));
            const isDateMatch = Boolean(targetDateStr && inv.date && inv.date.split('T')[0] === targetDateStr);
            return isEventMatch || (isClientMatch && isDateMatch);
          }) : [];

          const paidInvoice = associatedInvoices.find(inv => inv.status === 'paid' && inv.amount > 0);
          const pendingInvoice = associatedInvoices.find(inv => inv.status === 'pending');

          const associatedNotes = !isOther ? allNotes.filter(n => 
            (ev.id && n.eventId === ev.id) ||
            (clientId && n.clientId === clientId && n.date && n.date.split('T')[0] === targetDateStr)
          ) : [];

          // Check if this appointment corresponds to a Bono deduction:
          // either 0 € redemption invoice, or note marked as isBonoRedeemed, or date in bonoRedeemedDates,
          // OR paid Bono purchase invoice where this session was included!
          const bonoPurchaseInvoice = associatedInvoices.find(inv =>
            inv.status === 'paid' && inv.amount > 0 &&
            (inv.discountType === 'bono' || (formatLocalizedBonoText(inv.description, lang) && formatLocalizedBonoText(inv.description, lang).toLowerCase().includes('bono')))
          );

          const isBonoDeducted = !isOther && Boolean(
            associatedNotes.some(n => n.isBonoRedeemed) ||
            (client?.bonoRedeemedDates && targetDateStr && client.bonoRedeemedDates.includes(targetDateStr)) ||
            associatedInvoices.some(inv => inv.isBonoRedemption || (inv.amount === 0 && inv.discountType === 'bono')) ||
            Boolean(bonoPurchaseInvoice && client?.hasBono)
          );

          return (
            <div 
              className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
              onClick={() => setSelectedAppointmentForDetails(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-7 z-10 border border-slate-200 text-left my-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      isOther ? 'bg-amber-100 text-amber-800' : 'bg-[#38c9d8]/20 text-[#00838f]'
                    }`}>
                      {isOther ? <Lock size={20} /> : <CalendarIcon size={20} />}
                    </div>
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                        isOther ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-cyan-100 text-cyan-900 border border-cyan-300'
                      }`}>
                        {isOther 
                          ? (lang === 'fr' ? 'Créneau bloqué / Indisponible' : 'Horario bloqueado') 
                          : (lang === 'fr' ? 'Rendez-vous Patient' : 'Cita de Paciente')}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold font-serif text-slate-900 leading-tight">
                        {isOther ? eventDisplayName : (lang === 'fr' ? "Détails de la consultation" : lang === 'es' ? "Detalles de la consulta" : "Consultation details")}
                      </h3>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedAppointmentForDetails(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body Content */}
                <div className="py-4 space-y-4">
                  {/* Time & Date Box */}
                  <div className="p-3.5 rounded-2xl bg-[#e0f5f7]/40 border border-[#38c9d8]/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Clock size={18} className="text-[#00838f] shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-[#063840] capitalize">
                          {dateFormatted}
                        </p>
                        <p className="text-sm font-mono font-extrabold text-[#00838f]">
                          {startStr} - {endStr} <span className="text-xs font-normal text-slate-500 font-sans">({durationMinutes} min)</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Remarks / Notes (Priority Section) */}
                  {!isOther && (
                    <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200/80 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00838f] block">
                        {lang === 'fr' ? 'Remarques du rendez-vous' : lang === 'es' ? 'Notas de la cita' : 'Appointment remarks'}
                      </span>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        {cleanRemark && cleanRemark.toLowerCase() !== (client?.name || '').toLowerCase() 
                          ? cleanRemark 
                          : (lang === 'fr' ? 'Aucune remarque spécifiée' : lang === 'es' ? 'Sin notas' : 'No remarks')}
                      </p>
                    </div>
                  )}

                  {/* Blocked Slot Remark / Description (Prioritized for non-appointments) */}
                  {isOther && (
                    <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                        {lang === 'fr' ? 'Remarque / Motif du créneau' : 'Motivo / Nota'}
                      </span>
                      <p className="text-sm font-semibold text-amber-950">
                        {cleanRemark || ev.summary || (lang === 'fr' ? "Aucun motif spécifié" : "No reason specified")}
                      </p>
                      {cleanRemark && ev.summary && cleanRemark !== ev.summary && (
                        <p className="text-xs text-amber-800/80 pt-1 border-t border-amber-200/60 mt-1">
                          <span className="font-semibold">{lang === 'fr' ? 'Titre initial :' : 'Título:'}</span> {ev.summary}
                        </p>
                      )}
                    </div>
                  )}

                  {!isOther && (
                    <div className="space-y-3 pt-1">
                      {/* Status badges row: Note clinique & Facture */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(() => {
                          const evDraft = clientId ? (getClientDraft(clientId, ev.id) || getClientDraft(clientId)) : null;
                          const hasDraft = Boolean(evDraft && (evDraft.draft.anamnese?.trim() || evDraft.draft.treatment?.trim() || evDraft.draft.motif?.trim()));

                          return (
                            <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                              hasNote 
                                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900' 
                                : hasDraft
                                ? 'bg-amber-50/90 border-amber-300 text-amber-900'
                                : 'bg-slate-50 border-slate-200 text-slate-600'
                            }`}>
                              {hasNote ? (
                                <FileText size={14} className="text-emerald-700" />
                              ) : hasDraft ? (
                                <StickyNote size={14} className="text-amber-700 animate-pulse" />
                              ) : (
                                <FileText size={14} className="text-slate-400" />
                              )}
                              <span className="truncate text-[11px] font-semibold">
                                {hasNote 
                                  ? (lang === 'fr' ? '✓ Note clinique' : '✓ Nota guardada') 
                                  : hasDraft
                                  ? (lang === 'fr' ? 'Brouillon en attente' : 'Borrador pendiente')
                                  : (lang === 'fr' ? 'Sans note clinique' : 'Sin nota')
                                }
                              </span>
                            </div>
                          );
                        })()}

                        <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          isBonoDeducted
                            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                            : paidInvoice
                            ? 'bg-cyan-50/80 border-cyan-200 text-cyan-900'
                            : pendingInvoice
                            ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}>
                          {isBonoDeducted ? (
                            <Sparkles size={14} className="text-emerald-700 shrink-0" />
                          ) : (
                            <CreditCard size={14} className={paidInvoice ? 'text-[#009cb2] shrink-0' : pendingInvoice ? 'text-amber-700 shrink-0' : 'text-slate-400 shrink-0'} />
                          )}
                          <span className="truncate text-[11px] font-semibold">
                              {isBonoDeducted
                                ? (
                                  bonoPurchaseInvoice
                                    ? (lang === 'fr' ? `Réglé (Achat ${bonoPurchaseInvoice.amount} €)` : lang === 'es' ? `Liquidado (Compra ${bonoPurchaseInvoice.amount} €)` : `Settled (Purchase ${bonoPurchaseInvoice.amount} €)`)
                                    : (lang === 'fr' ? 'Réglé avec Bono' : lang === 'es' ? 'Liquidado con Bono' : 'Settled with Bono')
                                  )
                                : paidInvoice
                                ? (lang === 'fr' ? 'Réglé' : lang === 'es' ? 'Liquidado' : 'Settled')
                                : pendingInvoice
                                ? `${pendingInvoice.amount} € (${lang === 'fr' ? 'En attente' : lang === 'es' ? 'Pendiente' : 'Pending'})`
                                : (lang === 'fr' ? 'Non réglé' : lang === 'es' ? 'No liquidado' : 'Unbilled')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Delete button (with confirmation) */}
                  <button
                    type="button"
                    onClick={() => {
                      const eventToDeleteId = ev.id;
                      const eventTitle = isOther
                        ? (cleanRemark || ev.summary || (lang === 'fr' ? 'Créneau bloqué' : 'Horario bloqueado'))
                        : getEventDisplayName(ev);

                      setSelectedAppointmentForDetails(null);
                      setConfirmDialog({
                        isOpen: true,
                        title: lang === 'fr' ? 'Supprimer le rendez-vous' : lang === 'es' ? 'Eliminar cita' : 'Delete appointment',
                        message: lang === 'fr'
                          ? `Êtes-vous certain de vouloir supprimer définitivement le rendez-vous "${eventTitle}" ? Cette action est irréversible.`
                          : `¿Está seguro de que desea eliminar definitivamente la cita "${eventTitle}"?`,
                        confirmText: lang === 'fr' ? 'Supprimer définitivement' : 'Eliminar',
                        cancelText: lang === 'fr' ? 'Annuler' : 'Cancelar',
                        isDangerous: true,
                        onConfirm: async () => {
                          try {
                            await api.deleteLocalEvent(eventToDeleteId);
                            setEvents(prev => prev.filter(e => e.id !== eventToDeleteId));
                          } catch (err: any) {
                            console.error('Failed to delete appointment:', err);
                          }
                        },
                      });
                    }}
                    className="w-full sm:w-auto px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    title={lang === 'fr' ? "Supprimer ce rendez-vous" : "Delete appointment"}
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>{lang === 'fr' ? "Supprimer le RDV" : "Eliminar cita"}</span>
                  </button>

                  <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                    {/* Edit button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAppointmentForDetails(null);
                        openEditEventModal(ev);
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <Pencil size={13} className="shrink-0" />
                      <span>{lang === 'fr' ? "Modifier" : "Editar"}</span>
                    </button>

                    {/* Patient File & Notes button (for appointments) */}
                    {!isOther && (() => {
                      const evDraft = clientId ? (getClientDraft(clientId, ev.id) || getClientDraft(clientId)) : null;
                      const hasDraft = Boolean(evDraft && (evDraft.draft.anamnese?.trim() || evDraft.draft.treatment?.trim() || evDraft.draft.motif?.trim()));

                      return (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAppointmentForDetails(null);
                            handleGoToNotes(ev);
                          }}
                          className={hasDraft
                            ? "flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap border border-amber-400"
                            : "flex-1 sm:flex-initial px-4 py-2.5 bg-[#009cb2] hover:bg-[#00838f] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                          }
                          title={hasDraft ? (lang === 'fr' ? "Continuer la rédaction du brouillon pour ce rendez-vous" : "Continuar borrador") : undefined}
                        >
                          {hasDraft ? (
                            <>
                              <StickyNote size={14} className="shrink-0 text-amber-100" />
                              <span>{lang === 'fr' ? "Continuer le brouillon" : lang === 'es' ? "Continuar borrador" : "Continue draft"}</span>
                              <ArrowRight size={13} className="shrink-0" />
                            </>
                          ) : (
                            <>
                              <FileText size={14} className="shrink-0" />
                              <span>{lang === 'fr' ? "Fiche & Notes" : "Ficha y Notas"}</span>
                              <ArrowRight size={13} className="shrink-0" />
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* MODAL: EDIT EVENT */}
      <AnimatePresence>
        {isEditEventOpen && editingEvent && (
          <div 
            className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto"
            onClick={() => {
              setIsEditEventOpen(false);
              setEditingEvent(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-8 z-10 border border-black/5 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-xl font-serif font-bold text-primary">
                    {editingEvent.eventType === 'appointment'
                      ? (lang === 'fr' ? 'Modifier le Rendez-vous' : lang === 'es' ? 'Modificar Cita' : 'Edit Appointment')
                      : (lang === 'fr' ? 'Modifier le Créneau' : lang === 'es' ? 'Modificar Horario' : 'Edit Slot')}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'fr' ? 'Mise à jour dans votre agenda' : lang === 'es' ? 'Actualizar en su agenda' : 'Update in your calendar'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title={lang === 'fr' ? 'Supprimer cet événement' : lang === 'es' ? 'Eliminar este evento' : 'Delete event'}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* Event Type Switcher in Edit Modal */}
              <div className="mb-5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-2">
                  {lang === 'fr' ? 'Type de créneau' : lang === 'es' ? 'Tipo de horario' : 'Slot Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'appointment' as EventType, label: lang === 'fr' ? 'RDV Patient' : lang === 'es' ? 'Cita Paciente' : 'Patient Appt', icon: CalendarIcon, color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                    { type: 'blocked' as EventType, label: lang === 'fr' ? 'Bloqué / Indispo' : lang === 'es' ? 'Bloqueado / No disp.' : 'Blocked', icon: Lock, color: 'border-amber-500 bg-amber-50 text-amber-900' },
                  ].map(item => {
                    const isSelected = (editingEvent.eventType || 'appointment') === item.type;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => {
                          setEditingEvent(prev => prev ? ({
                            ...prev,
                            eventType: item.type,
                          }) : null);
                        }}
                        className={`flex items-center gap-1.5 p-2.5 rounded-xl text-xs font-bold transition-all border text-left ${
                          isSelected ? `${item.color} shadow-xs` : 'bg-secondary/60 border-transparent text-gray-600 hover:bg-secondary'
                        }`}
                      >
                        <ItemIcon size={16} className="shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Direct Link to Clinical Notes & Billing Status (for appointments) */}
              {(!editingEvent.eventType || editingEvent.eventType === 'appointment') && (() => {
                const associatedNote = clientNotes.find(n => n.eventId && n.eventId === editingEvent.id);
                const associatedInv = invoices.find(i => (i.eventId && i.eventId === editingEvent.id) || (i.noteId && i.noteId === editingEvent.id));
                const editClient = editingEvent.clientId ? clients.find(c => c.id === editingEvent.clientId) : (editingEvent.clientName ? clients.find(c => c.name.toLowerCase() === editingEvent.clientName?.toLowerCase()) : undefined);
                const editDraft = editClient ? (getClientDraft(editClient.id, editingEvent.id) || getClientDraft(editClient.id)) : null;
                const isDraftPending = Boolean(!associatedNote && editDraft && (editDraft.draft.anamnese?.trim() || editDraft.draft.treatment?.trim() || editDraft.draft.motif?.trim()));

                return (
                  <div className={`mb-4 rounded-2xl p-3.5 space-y-2.5 border ${
                    isDraftPending ? 'bg-amber-50/90 border-amber-300' : 'bg-emerald-50 border-emerald-200/80'
                  }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-xs font-bold flex items-center gap-1.5 ${
                          isDraftPending ? 'text-amber-950' : 'text-emerald-900'
                        }`}>
                          {isDraftPending ? <StickyNote size={15} className="text-amber-700" /> : <FileCheck size={15} className="text-emerald-700" />}
                          {lang === 'fr' ? 'Dossier Patient & Prise de notes' : lang === 'es' ? 'Historial del Paciente & Notas' : 'Patient File & Clinical Notes'}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${
                          isDraftPending ? 'text-amber-800 font-medium' : 'text-emerald-700'
                        }`}>
                          {associatedNote
                            ? (lang === 'fr' ? '✓ Une note clinique est rédigée pour ce rendez-vous' : '✓ Nota clínica redactada para esta cita')
                            : isDraftPending
                              ? (lang === 'fr' ? 'Un brouillon est sauvegardé et prêt à être continué' : 'Tiene un borrador pendiente')
                              : (lang === 'fr' ? 'Ouvrir la fiche clinique pour ce rendez-vous' : 'Abrir ficha clínica para esta cita')
                          }
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (editingEvent) {
                            setIsEditEventOpen(false);
                            handleGoToNotes(editingEvent);
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1.5 cursor-pointer ${
                          isDraftPending
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-400'
                            : 'bg-primary hover:bg-primary/95 text-white'
                        }`}
                      >
                        {isDraftPending ? (
                          <>
                            <StickyNote size={13} className="text-amber-100" />
                            <span>{lang === 'fr' ? 'Continuer le brouillon' : 'Continuar borrador'}</span>
                          </>
                        ) : (
                          <span>
                            {associatedNote 
                              ? (lang === 'fr' ? 'Consulter la note' : 'Ver nota') 
                              : (lang === 'fr' ? 'Prendre des notes' : 'Tomar notas')
                            }
                          </span>
                        )}
                        <ArrowRight size={13} />
                      </button>
                    </div>

                    {/* Status badges for this event in edit modal */}
                    <div className={`flex items-center gap-2 pt-2 border-t text-[10px] flex-wrap ${
                      isDraftPending ? 'border-amber-200' : 'border-emerald-200/60'
                    }`}>
                      {associatedNote ? (
                        <span className="font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-sky-300">
                          <FileCheck size={11} className="text-sky-700" />
                          <span>{lang === 'fr' ? '✓ Note rédigée' : '✓ Nota redactada'}</span>
                        </span>
                      ) : isDraftPending ? (
                        <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-300">
                          <StickyNote size={11} className="text-amber-700 animate-pulse" />
                          <span>{lang === 'fr' ? 'Brouillon en attente' : 'Borrador pendiente'}</span>
                        </span>
                      ) : (
                        <span className="font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-amber-300">
                          <FileText size={11} className="text-amber-600" />
                          <span>{lang === 'fr' ? 'Note en attente' : 'Sin nota'}</span>
                        </span>
                      )}

                      {associatedInv ? (
                        <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-emerald-300">
                          <CheckCircle2 size={11} className="text-emerald-700" />
                          <span>
                            {associatedInv.status === 'paid' 
                              ? `${lang === 'fr' ? 'Payé' : 'Pagado'} : ${associatedInv.amount} €`
                              : `${lang === 'fr' ? 'En attente' : 'Pendiente'} : ${associatedInv.amount} €`}
                          </span>
                        </span>
                      ) : (
                        <span className="font-medium text-gray-600 bg-white px-2 py-0.5 rounded-md inline-flex items-center gap-1 border border-gray-200">
                          <CreditCard size={11} className="text-gray-400" />
                          <span>{lang === 'fr' ? 'Paiement non associé' : 'Sin pago asociado'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
              
              <form onSubmit={handleUpdateEvent} className="space-y-4">
                {(!editingEvent.eventType || editingEvent.eventType === 'appointment') && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Patient associé' : lang === 'es' ? 'Paciente asociado' : 'Associated Patient'}
                    </label>
                    <select
                      value={editingEvent.clientId || ''}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        const foundClient = clients.find(c => c.id === selectedId);
                        setEditingEvent(prev => prev ? ({
                          ...prev,
                          clientId: selectedId,
                          clientName: foundClient ? foundClient.name : prev.clientName,
                        }) : null);
                      }}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all font-medium"
                    >
                      <option value="">-- {lang === 'fr' ? 'Aucun ou patient non répertorié' : lang === 'es' ? 'Ninguno o no registrado' : 'None or unlisted'} --</option>
                      {clients.map((c, cIdx) => (
                        <option key={c.id ? `${c.id}-${cIdx}` : `edit-client-opt-${cIdx}`} value={c.id}>{c.name} ({c.phone || c.email || 'N/A'})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {editingEvent.eventType === 'appointment'
                      ? (lang === 'fr' ? 'Intitulé de la consultation' : lang === 'es' ? 'Título de la consulta' : 'Appointment Title')
                      : (lang === 'fr' ? 'Titre ou Motif du créneau' : lang === 'es' ? 'Título o Motivo del horario' : 'Slot Title / Reason')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.summary}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, summary: e.target.value } : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date' : lang === 'es' ? 'Fecha' : 'Date'} *
                    </label>
                    <input
                      type="date"
                      required
                      value={editingEvent.date}
                      onChange={(e) => setEditingEvent(prev => prev ? { ...prev, date: e.target.value } : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Début' : lang === 'es' ? 'Inicio' : 'Start'} *
                      </label>
                      <input
                        type="time"
                        step="60"
                        required
                        value={editingEvent.startTime}
                        onChange={(e) => setEditingEvent(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                      {/* Minute presets :00, :15, :30, :45 */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {['00', '15', '30', '45'].map(min => {
                          const currentH = editingEvent?.startTime ? editingEvent.startTime.split(':')[0] : '10';
                          const isSel = editingEvent?.startTime?.split(':')[1] === min;
                          return (
                            <button
                              key={min}
                              type="button"
                              onClick={() => {
                                const startTime = `${currentH}:${min}`;
                                const [h, m] = [parseInt(currentH, 10), parseInt(min, 10)];
                                const date = new Date();
                                date.setHours(h);
                                date.setMinutes((m || 0) + (editingEvent?.eventType === 'appointment' ? 55 : 30));
                                const endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                                setEditingEvent(prev => prev ? ({ ...prev, startTime, endTime }) : null);
                              }}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                isSel ? 'bg-[#009cb2] text-white shadow-2xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              :{min}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Fin' : lang === 'es' ? 'Fin' : 'End'} *
                      </label>
                      <input
                        type="time"
                        step="60"
                        required
                        value={editingEvent.endTime}
                        onChange={(e) => setEditingEvent(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                      {/* Duration presets */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {[
                          { label: '30m', mins: 30 },
                          { label: '45m', mins: 45 },
                          { label: '55m', mins: 55 },
                          { label: '1h', mins: 60 },
                        ].map(d => (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => {
                              if (!editingEvent?.startTime) return;
                              const [h, m] = editingEvent.startTime.split(':').map(Number);
                              const date = new Date();
                              date.setHours(h);
                              date.setMinutes((m || 0) + d.mins);
                              const endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                              setEditingEvent(prev => prev ? ({ ...prev, endTime }) : null);
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Notes / Remarques' : lang === 'es' ? 'Notas / Observaciones' : 'Notes / Remarks'}
                  </label>
                  <textarea
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full p-3 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditEventOpen(false);
                      setEditingEvent(null);
                    }}
                    className="w-full sm:flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all text-center cursor-pointer"
                  >
                    {lang === 'fr' ? 'Fermer' : lang === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-3 px-4 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md text-center whitespace-nowrap cursor-pointer"
                  >
                    {lang === 'fr' ? 'Enregistrer' : lang === 'es' ? 'Guardar' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD INVOICE */}
      <AnimatePresence>
        {isAddInvoiceOpen && (
          <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddInvoiceOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-8 z-10 border border-black/5 scrollbar-thin scrollbar-thumb-gray-200 my-auto"
            >
              <h3 className="text-xl font-serif font-bold text-primary mb-6">
                {lang === 'fr' ? 'Nouvelle Facture' : lang === 'es' ? 'Nueva Factura' : 'New Invoice'}
              </h3>

              {newInvoice.eventId && (
                <div className="mb-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2 text-xs text-emerald-900">
                  <div className="flex items-center gap-1.5 truncate">
                    <CalendarIcon size={13} className="text-emerald-700 shrink-0" />
                    <span className="font-semibold truncate">
                      {lang === 'fr' ? 'Facture associée au rendez-vous' : lang === 'es' ? 'Factura asociada a la cita' : 'Invoice linked to appointment'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewInvoice(prev => ({ ...prev, eventId: '' }))}
                    className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                    title={lang === 'fr' ? "Dissocier du rendez-vous" : "Desvincular"}
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
              
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Patient destinataire' : lang === 'es' ? 'Paciente destinatario' : 'Recipient Patient'}
                  </label>
                  <select
                    required
                    value={newInvoice.clientId}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      setNewInvoice(prev => ({
                        ...prev,
                        clientId: selectedId,
                        originalAmount: 60,
                        discountType: 'none',
                        discountAmount: 0,
                        discountLabel: '',
                        amount: 60,
                        description: 'Sesión de osteopatía',
                      }));
                    }}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  >
                    <option value="">-- {lang === 'fr' ? 'Sélectionnez un patient' : lang === 'es' ? 'Seleccione un paciente' : 'Select a patient'} --</option>
                    {clients.map((c, cIdx) => (
                      <option key={c.id ? `${c.id}-${cIdx}` : `inv-client-opt-${cIdx}`} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {newInvoice.clientId && (
                  <div className="space-y-3 bg-[#f8f8f2] p-4 rounded-2xl border border-black/5">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Associer à un rendez-vous (Optionnel)' : lang === 'es' ? 'Asociar a una cita (Opcional)' : 'Link to an appointment (Optional)'}
                      </label>
                      {(() => {
                        const clientEvents = events.filter(ev => ev.clientId === newInvoice.clientId).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
                        if (clientEvents.length === 0) {
                          return (
                            <p className="text-[10px] text-gray-400 italic">
                              {lang === 'fr' ? "Aucun rendez-vous trouvé pour ce patient." : lang === 'es' ? "No se encontraron citas para este paciente." : "No appointments found for this patient."}
                            </p>
                          );
                        }
                        return (
                          <select
                            value={newInvoice.eventId}
                            onChange={(e) => {
                              const selEventId = e.target.value;
                              const selEvent = clientEvents.find(ev => ev.id === selEventId);
                              if (selEvent) {
                                const eventDate = selEvent.start.split('T')[0];
                                setNewInvoice(prev => ({
                                  ...prev,
                                  eventId: selEventId,
                                  date: eventDate,
                                  description: "Sesión de osteopatía",
                                }));
                              } else {
                                setNewInvoice(prev => ({
                                  ...prev,
                                  eventId: '',
                                  date: new Date().toISOString().split('T')[0],
                                  description: "Sesión de osteopatía",
                                }));
                              }
                            }}
                            className="w-full p-2.5 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                          >
                            <option value="">-- {lang === 'fr' ? 'Ne pas associer (Date libre)' : lang === 'es' ? 'No asociar (Fecha libre)' : 'Do not link (Free date)'} --</option>
                            {clientEvents.map((ev, evIdx) => {
                              const evDate = new Date(ev.start).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                              const evTime = new Date(ev.start).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'es-ES', { hour: '2-digit', minute: '2-digit' });
                              return (
                                <option key={ev.id ? `${ev.id}-${evIdx}` : `client-ev-opt-${evIdx}`} value={ev.id}>
                                  {lang === 'fr' ? `${evDate} à ${evTime}` : lang === 'es' ? `${evDate} a las ${evTime}` : `${evDate} at ${evTime}`}
                                </option>
                              );
                            })}
                          </select>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? "Date de la facture" : lang === 'es' ? "Fecha de la factura" : "Invoice date"}
                      </label>
                      <input
                        type="date"
                        required
                        value={newInvoice.date}
                        onChange={(e) => setNewInvoice(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full p-2.5 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Pricing Plan Selector */}
                {(() => {
                  const modalPatient = clients.find(c => c.id === newInvoice.clientId);
                  const bonoInfo = getClientActiveBonoInfo(modalPatient || null);
                  const patientHasRemainingBono = bonoInfo.hasBono && bonoInfo.remaining > 0;

                  return (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1.5">
                          {translations[lang].admin.billing.pricingPlan}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setNewInvoiceBillingPlan('single');
                              setNewInvoice(prev => ({
                                ...prev,
                                originalAmount: 60,
                                discountType: 'none',
                                discountAmount: 0,
                                discountLabel: '',
                                amount: 60,
                                description: 'Sesión de osteopatía',
                              }));
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              newInvoiceBillingPlan === 'single'
                                ? 'bg-white border-primary ring-2 ring-primary/25 shadow-xs'
                                : 'bg-[#f8f8f2] border-black/5 hover:border-black/20 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-800">{translations[lang].admin.billing.singleSession}</span>
                              <span className="text-xs font-bold text-primary">60 €</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{translations[lang].admin.billing.standardSessionSub}</p>
                          </button>

                          {patientHasRemainingBono ? (
                            <button
                              type="button"
                              onClick={() => {
                                setNewInvoiceBillingPlan('deduct_bono');
                                setNewInvoice(prev => ({
                                  ...prev,
                                  originalAmount: 60,
                                  discountType: 'custom',
                                  discountAmount: 60,
                                  discountLabel: translations[lang].admin.billing.deductedFromBono.replace('{bonoType}', bonoInfo.bonoType),
                                  amount: 0,
                                  description: translations[lang].admin.billing.sessionDeductedFromBono.replace('{bonoType}', bonoInfo.bonoType),
                                }));
                              }}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                newInvoiceBillingPlan === 'deduct_bono'
                                  ? 'bg-teal-50/70 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                                  : 'bg-[#f8f8f2] border-black/5 hover:border-black/20 text-gray-600'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-teal-900">{translations[lang].admin.billing.deductBonoLabel}</span>
                                <span className="text-xs font-bold text-teal-700">0 €</span>
                              </div>
                              <p className="text-[10px] text-teal-700 font-semibold mt-0.5">
                                {translations[lang].admin.billing.bonoSessionsLeft.replace('{count}', String(bonoInfo.remaining))}
                              </p>
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewInvoiceBillingPlan('bono3');
                                  setNewInvoice(prev => ({
                                    ...prev,
                                    originalAmount: 180,
                                    discountType: 'custom',
                                    discountAmount: 20,
                                    discountLabel: translations[lang].admin.billing.bono3Label,
                                    amount: 160,
                                    description: translations[lang].admin.billing.bono3Description,
                                  }));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  newInvoiceBillingPlan === 'bono3'
                                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-[#f8f8f2] border-black/5 hover:border-black/20 text-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                    <Sparkles size={11} className="text-emerald-600" />
                                    {translations[lang].admin.billing.bono3Label}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-700">160 €</span>
                                </div>
                                <p className="text-[10px] text-emerald-700 mt-0.5">{translations[lang].admin.billing.prepaidPackage}</p>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setNewInvoiceBillingPlan('bono5');
                                  setNewInvoice(prev => ({
                                    ...prev,
                                    originalAmount: 300,
                                    discountType: 'custom',
                                    discountAmount: 50,
                                    discountLabel: translations[lang].admin.billing.bono5Label,
                                    amount: 250,
                                    description: translations[lang].admin.billing.bono5Description,
                                  }));
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                  newInvoiceBillingPlan === 'bono5'
                                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                    : 'bg-[#f8f8f2] border-black/5 hover:border-black/20 text-gray-600'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                                    <Sparkles size={11} className="text-emerald-600" />
                                    {translations[lang].admin.billing.bono5Label}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-700">250 €</span>
                                </div>
                                <p className="text-[10px] text-emerald-700 mt-0.5">{translations[lang].admin.billing.prepaidPackage}</p>
                              </button>
                            </>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setNewInvoiceBillingPlan('custom');
                              const disc = newInvoice.discountAmount > 0 ? newInvoice.discountAmount : 10;
                              setNewInvoice(prev => ({
                                ...prev,
                                discountType: 'custom',
                                discountAmount: disc,
                                amount: Math.max(0, (prev.originalAmount || 60) - disc),
                              }));
                            }}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              newInvoiceBillingPlan === 'custom'
                                ? 'bg-white border-primary ring-2 ring-primary/25 shadow-xs'
                                : 'bg-[#f8f8f2] border-black/5 hover:border-black/20 text-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-800">{translations[lang].admin.billing.customDiscount}</span>
                              <span className="text-xs font-bold text-gray-500">{newInvoice.amount} €</span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{translations[lang].admin.billing.customDiscountSubtitle}</p>
                          </button>
                        </div>
                      </div>

                      {(newInvoiceBillingPlan === 'bono3' || newInvoiceBillingPlan === 'bono5') && (
                        <div className="bg-emerald-50/70 border border-emerald-200/70 rounded-xl p-3 space-y-2 text-xs text-emerald-950">
                          <label className="flex items-center gap-2 cursor-pointer text-[11px] font-semibold text-emerald-900 select-none">
                            <input
                              type="checkbox"
                              checked={newInvoiceIncludeToday}
                              onChange={(e) => setNewInvoiceIncludeToday(e.target.checked)}
                              className="w-3.5 h-3.5 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>
                              {newInvoiceIncludeToday
                                ? translations[lang].admin.billing.includeTodaySession.replace('{remaining}', String(newInvoiceBillingPlan === 'bono3' ? 2 : 4))
                                : translations[lang].admin.billing.doNotIncludeTodaySession.replace('{total}', String(newInvoiceBillingPlan === 'bono3' ? 3 : 5))}
                            </span>
                          </label>
                        </div>
                      )}

                      {newInvoiceBillingPlan === 'custom' && (
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#f8f8f2] rounded-xl border border-black/5">
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                              {translations[lang].admin.billing.discountAmount || 'Descuento (€)'}
                            </label>
                            <input
                              type="number"
                              value={newInvoice.discountAmount}
                              onChange={(e) => {
                                const disc = Number(e.target.value);
                                setNewInvoice(prev => ({
                                  ...prev,
                                  discountAmount: disc,
                                  amount: Math.max(0, (prev.originalAmount || 60) - disc),
                                }));
                              }}
                              className="w-full p-2 bg-white rounded-lg border border-black/10 text-xs font-bold text-emerald-700"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                              {translations[lang].admin.billing.discountLabel || 'Motivo'}
                            </label>
                            <input
                              type="text"
                              value={newInvoice.discountLabel}
                              onChange={(e) => setNewInvoice(prev => ({ ...prev, discountLabel: e.target.value }))}
                              placeholder="Ej: Descuento"
                              className="w-full p-2 bg-white rounded-lg border border-black/10 text-xs"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-black/10 shadow-xs">
                        <div>
                          <span className="text-xs font-bold text-gray-700 block">
                            {translations[lang].admin.billing.netAmountToPay || 'Total a pagar'}
                          </span>
                          {newInvoice.discountAmount > 0 && (
                            <span className="text-[11px] text-gray-400 line-through">
                              {newInvoice.originalAmount} €
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-serif font-bold text-primary">
                            {newInvoice.amount} €
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Moyen de règlement' : lang === 'es' ? 'Método de pago' : 'Payment method'}
                    </label>
                    <select
                      value={newInvoice.paymentMethod}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentMethod: e.target.value as Invoice['paymentMethod'] }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    >
                      <option value="card">{lang === 'fr' ? 'Carte Bancaire' : lang === 'es' ? 'Tarjeta bancaria' : 'Credit/Debit Card'}</option>
                      <option value="cash">{lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash'}</option>
                      <option value="transfer">{lang === 'fr' ? 'Virement Bancaire' : lang === 'es' ? 'Transferencia bancaria' : 'Bank Transfer'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Statut du paiement' : lang === 'es' ? 'Estado del pago' : 'Payment status'}
                    </label>
                    <select
                      value={newInvoice.status || 'paid'}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, status: e.target.value as 'paid' | 'pending' }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    >
                      <option value="paid">{lang === 'fr' ? 'Payée (Encaissé)' : lang === 'es' ? 'Pagada' : 'Paid'}</option>
                      <option value="pending">{lang === 'fr' ? 'En attente (Impayée)' : lang === 'es' ? 'Pendiente' : 'Pending'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Description de la prestation' : lang === 'es' ? 'Descripción del servicio' : 'Service description'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newInvoice.description}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                {newInvoice.status === 'paid' && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date de règlement' : lang === 'es' ? 'Fecha de pago' : 'Payment date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={newInvoice.paymentDate || newInvoice.date}
                      onChange={(e) => setNewInvoice(prev => ({ ...prev, paymentDate: e.target.value }))}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddInvoiceOpen(false)}
                    className="w-full sm:flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all text-center cursor-pointer"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className={`w-full sm:flex-1 py-3 px-4 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md text-center whitespace-nowrap cursor-pointer ${
                      newInvoiceBillingPlan === 'deduct_bono'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-primary hover:bg-primary/95'
                    }`}
                  >
                    <span className="whitespace-nowrap">
                      {newInvoiceBillingPlan === 'deduct_bono'
                        ? (translations[lang]?.admin?.billing?.confirmBonoDeductionAction || (lang === 'fr' ? 'Confirmer le décompte' : lang === 'es' ? 'Confirmar descuento' : 'Confirm Deduction'))
                        : (lang === 'fr' ? 'Générer la facture' : lang === 'es' ? 'Generar factura' : 'Generate invoice')}
                    </span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT CLIENT */}
      <AnimatePresence>
        {isEditClientOpen && editingClient && (
          <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditClientOpen(false);
                setEditingClient(null);
              }}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-8 z-10 border border-black/5 my-auto"
            >
              <h3 className="text-xl font-serif font-bold text-primary mb-6">
                {lang === 'fr' ? 'Modifier le Patient' : lang === 'es' ? 'Editar Paciente' : 'Edit Patient'}
              </h3>
              
              <form onSubmit={handleUpdateClient} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Nom' : lang === 'es' ? 'Apellido' : 'Last name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingClient.lastName}
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, lastName: e.target.value.toUpperCase() }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Prénom' : lang === 'es' ? 'Nombre' : 'First name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={editingClient.firstName}
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, firstName: capitalizeFirstName(e.target.value) }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Adresse email' : lang === 'es' ? 'Correo electrónico' : 'Email address'}
                  </label>
                  <input
                    type="email"
                    value={editingClient.email}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Numéro de téléphone' : lang === 'es' ? 'Número de teléfono' : 'Phone number'}
                  </label>
                  <input
                    type="tel"
                    value={editingClient.phone}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'DNI / NIE (Identité)' : lang === 'es' ? 'DNI / NIE (Identificación)' : 'DNI / NIE (ID number)'}
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 48765432A"
                      value={editingClient.dni || ''}
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, dni: e.target.value.toUpperCase() }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all uppercase placeholder:normal-case font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date de naissance' : lang === 'es' ? 'Fecha de nacimiento' : 'Date of birth'}
                    </label>
                    <input
                      type="date"
                      value={editingClient.birthDate || ''}
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, birthDate: e.target.value }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Adresse postale' : lang === 'es' ? 'Dirección postal' : 'Postal address'}
                  </label>
                  <input
                    type="text"
                    value={editingClient.address || ''}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, address: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Remarque / Note d\'information du profil' : lang === 'es' ? 'Nota rápida del perfil' : 'Profile note'}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={lang === 'fr' ? 'Ex: Préférences horaires, allergie, passe-temps, contact WhatsApp...' : 'e.g., Preferences, reminders...'}
                    value={editingClient.profileNote || ''}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, profileNote: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none"
                  />
                </div>



                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteClient(editingClient.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer order-2 sm:order-1"
                    title={lang === 'fr' ? 'Supprimer ce patient' : 'Delete patient'}
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>{lang === 'fr' ? 'Supprimer le patient' : lang === 'es' ? 'Eliminar paciente' : 'Delete patient'}</span>
                  </button>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditClientOpen(false);
                        setEditingClient(null);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all text-center whitespace-nowrap cursor-pointer"
                    >
                      {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md text-center whitespace-nowrap cursor-pointer"
                    >
                      {lang === 'fr' ? 'Enregistrer' : lang === 'es' ? 'Guardar' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT INVOICE */}
      <AnimatePresence>
        {isEditInvoiceOpen && editingInvoice && (
          <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditInvoiceOpen(false);
                setEditingInvoice(null);
              }}
              className="absolute inset-0"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-8 z-10 border border-black/5 my-auto"
            >
              <h3 className="text-xl font-serif font-bold text-primary mb-6">
                {editingInvoice.isBonoRedemption && editingInvoice.amount === 0 
                  ? (lang === 'fr' ? 'Modifier le suivi Bono' : lang === 'es' ? 'Editar uso de Bono' : 'Edit Bono usage')
                  : (lang === 'fr' ? 'Modifier la Facture' : lang === 'es' ? 'Editar Factura' : 'Edit Invoice')}
              </h3>
              
              <form onSubmit={handleUpdateInvoice} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Patient destinataire' : lang === 'es' ? 'Paciente destinatario' : 'Recipient Patient'}
                  </label>
                  <select
                    required
                    value={editingInvoice.clientId || ''}
                    onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, clientId: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  >
                    <option value="">-- {lang === 'fr' ? 'Sélectionnez un patient' : lang === 'es' ? 'Seleccione un paciente' : 'Select a patient'} --</option>
                    {clients.map((c, cIdx) => (
                      <option key={c.id ? `${c.id}-${cIdx}` : `edit-inv-client-${cIdx}`} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {translations[lang].admin.billing.standardFee || (lang === 'fr' ? 'Tarif de base (€)' : 'Standard Fee (€)')}
                    </label>
                    <input
                      type="number"
                      required
                      value={editingInvoice.originalAmount ?? editingInvoice.amount}
                      onChange={(e) => {
                        const orig = Number(e.target.value);
                        setEditingInvoice(prev => prev ? ({
                          ...prev,
                          originalAmount: orig,
                          amount: Math.max(0, orig - (prev.discountAmount || 0)),
                        }) : null);
                      }}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {translations[lang].admin.billing.netAmountToPay || (lang === 'fr' ? 'Net payé (€)' : 'Net Paid (€)')}
                    </label>
                    <input
                      type="number"
                      required
                      value={editingInvoice.amount}
                      onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, amount: Number(e.target.value) }) : null)}
                      className="w-full p-2.5 bg-primary/10 rounded-xl border border-primary/20 text-xs font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Bono & Discount Card */}
                <div className="bg-[#f4f4ec] p-3 rounded-2xl border border-black/5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-600 flex items-center gap-1.5">
                      <BadgePercent size={13} className="text-emerald-600" />
                      {(lang === 'fr' ? 'Tarif préférentiel / Remise' : 'Discount')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingInvoice(prev => prev ? ({
                            ...prev,
                            discountType: 'none',
                            discountAmount: 0,
                            discountLabel: '',
                            amount: prev.originalAmount || prev.amount,
                          }) : null);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${(!editingInvoice.discountType || editingInvoice.discountType === 'none') ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-black/5'}`}
                      >
                        {translations[lang].admin.billing.noDiscount || (lang === 'fr' ? 'Aucune' : 'None')}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const patient = clients.find(c => c.id === editingInvoice.clientId);
                          const discount = (patient && patient.defaultDiscount !== undefined && patient.defaultDiscount > 0) ? patient.defaultDiscount : (editingInvoice.discountAmount || 10);
                          const orig = editingInvoice.originalAmount || editingInvoice.amount;
                          setEditingInvoice(prev => prev ? ({
                            ...prev,
                            discountType: 'custom',
                            discountAmount: discount,
                            discountLabel: patient?.bonoType || prev.discountLabel || 'Bono séance',
                            amount: Math.max(0, orig - discount),
                          }) : null);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${editingInvoice.discountType === 'bono' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                      >
                        Bono
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const orig = editingInvoice.originalAmount || editingInvoice.amount;
                          const discount = (editingInvoice.discountAmount && editingInvoice.discountAmount > 0) ? editingInvoice.discountAmount : 10;
                          setEditingInvoice(prev => prev ? ({
                            ...prev,
                            discountType: 'custom',
                            discountAmount: discount,
                            amount: Math.max(0, orig - discount),
                          }) : null);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${editingInvoice.discountType === 'custom' ? 'bg-primary text-white' : 'bg-white text-gray-600 hover:bg-black/5'}`}
                      >
                        {translations[lang].admin.billing.customDiscount || (lang === 'fr' ? 'Autre' : 'Other')}
                      </button>
                    </div>
                  </div>

                  {editingInvoice.discountType && editingInvoice.discountType !== 'none' && (
                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-black/5">
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                          {translations[lang].admin.billing.discountAmount || (lang === 'fr' ? 'Montant déduit (€)' : 'Discount Amount (€)')}
                        </label>
                        <input
                          type="number"
                          value={editingInvoice.discountAmount || 0}
                          onChange={(e) => {
                            const disc = Number(e.target.value);
                            setEditingInvoice(prev => prev ? ({
                              ...prev,
                              discountAmount: disc,
                              amount: Math.max(0, (prev.originalAmount || prev.amount) - disc),
                            }) : null);
                          }}
                          className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs font-bold text-emerald-700 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                          {translations[lang].admin.billing.discountLabel || (lang === 'fr' ? 'Libellé affiché sur reçu' : 'Receipt Label')}
                        </label>
                        <input
                          type="text"
                          value={editingInvoice.discountLabel || ''}
                          onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, discountLabel: e.target.value }) : null)}
                          placeholder={t('admin.billing.bonoTitle')}
                          className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Moyen de règlement' : lang === 'es' ? 'Método de pago' : 'Payment method'}
                    </label>
                    <select
                      value={editingInvoice.paymentMethod}
                      onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, paymentMethod: e.target.value as Invoice['paymentMethod'] }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    >
                      <option value="card">{lang === 'fr' ? 'Carte Bancaire' : lang === 'es' ? 'Tarjeta bancaria' : 'Credit/Debit Card'}</option>
                      <option value="cash">{lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash'}</option>
                      <option value="transfer">{lang === 'fr' ? 'Virement Bancaire' : lang === 'es' ? 'Transferencia bancaria' : 'Bank Transfer'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Statut du paiement' : lang === 'es' ? 'Estado del pago' : 'Payment status'}
                    </label>
                    <select
                      value={editingInvoice.status || 'paid'}
                      onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, status: e.target.value as 'paid' | 'pending' }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    >
                      <option value="paid">{lang === 'fr' ? 'Payée (Encaissé)' : lang === 'es' ? 'Pagada' : 'Paid'}</option>
                      <option value="pending">{lang === 'fr' ? 'En attente (Impayée)' : lang === 'es' ? 'Pendiente' : 'Pending'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Description de la prestation' : lang === 'es' ? 'Descripción del servicio' : 'Service description'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editingInvoice.description}
                    onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, description: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                {editingInvoice.status === 'paid' && (
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date de règlement' : lang === 'es' ? 'Fecha de pago' : 'Payment date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={editingInvoice.paymentDate || editingInvoice.date}
                      onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, paymentDate: e.target.value }) : null)}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteInvoice(editingInvoice.id)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer order-2 sm:order-1"
                    title={lang === 'fr' ? 'Supprimer cette facture' : 'Delete invoice'}
                  >
                    <Trash2 size={14} className="shrink-0" />
                    <span>{lang === 'fr' ? 'Supprimer la facture' : lang === 'es' ? 'Eliminar factura' : 'Delete invoice'}</span>
                  </button>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditInvoiceOpen(false);
                        setEditingInvoice(null);
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2.5 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all text-center whitespace-nowrap cursor-pointer"
                    >
                      {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md text-center whitespace-nowrap cursor-pointer"
                    >
                      {lang === 'fr' ? 'Enregistrer' : lang === 'es' ? 'Guardar' : 'Save'}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* TAB 5: GOOGLE REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col h-full w-full pb-32">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6 shrink-0">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary flex items-center gap-2">
                  <Star className="fill-amber-400 text-amber-400 shrink-0" size={24} />
                  <span>{lang === 'fr' ? 'Avis Google' : lang === 'es' ? 'Reseñas de Google' : 'Google Reviews'}</span>
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {lang === 'fr'
                    ? "Gérez les vrais avis Google de vos patients affichés sur la page d'accueil de votre site."
                    : lang === 'es'
                      ? 'Gestione las reseñas reales de Google de sus pacientes mostradas en la página de inicio.'
                      : 'Manage real Google patient reviews displayed on your website homepage.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReviewIndex(null);
                    setReviewForm({ author: '', initials: '', date: new Date().toISOString().split('T')[0], rating: 5, text: '' });
                    setIsAddReviewModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>{lang === 'fr' ? 'Ajouter un avis' : lang === 'es' ? 'Añadir reseña' : 'Add review'}</span>
                </button>
              </div>
            </div>

            {isSupabaseConfigured && (
              <div className={`mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                tableDiagnostics?.googleReviews 
                  ? (customReviews.length > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100')
                  : 'bg-rose-50 border-rose-100'
              }`}>
                <div className="flex items-start sm:items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    tableDiagnostics?.googleReviews 
                      ? (customReviews.length > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600')
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {tableDiagnostics?.googleReviews ? <Database size={20} /> : <AlertTriangle size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      {!tableDiagnostics?.googleReviews 
                        ? (lang === 'fr' ? 'Base de données non initialisée' : lang === 'es' ? 'Base de datos no inicializada' : 'Database not initialized')
                        : customReviews.length > 0
                          ? (lang === 'fr' ? 'Synchronisation Cloud active' : lang === 'es' ? 'Sincronización en la nube activa' : 'Cloud sync active')
                          : (lang === 'fr' ? 'Base de données prête' : lang === 'es' ? 'Base de datos lista' : 'Database ready')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {!tableDiagnostics?.googleReviews 
                        ? (lang === 'fr'
                            ? "La table des avis n'existe pas encore dans votre base de données Supabase."
                            : lang === 'es'
                              ? 'La tabla de reseñas aún no existe en su base de datos Supabase.'
                              : 'The reviews table does not exist yet in your Supabase database.')
                        : customReviews.length > 0 
                          ? (lang === 'fr'
                              ? `Vos ${customReviews.length} avis sont sauvegardés en ligne et visibles par tous vos patients.`
                              : lang === 'es'
                                ? `Sus ${customReviews.length} reseñas están guardadas en línea y son visibles para todos sus pacientes.`
                                : `Your ${customReviews.length} reviews are saved online and visible to all your patients.`)
                          : (lang === 'fr'
                              ? 'Ajoutez votre premier avis pour le synchroniser sur votre site internet.'
                              : lang === 'es'
                                ? 'Añada su primera reseña para sincronizarla en su sitio web.'
                                : 'Add your first review to sync it on your website.')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 self-end sm:self-center">
                  {!tableDiagnostics?.googleReviews ? (
                    <>
                      <button
                        onClick={runDiagnostics}
                        disabled={isDiagnosing}
                        className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-all disabled:opacity-50"
                        title={lang === 'fr' ? 'Vérifier à nouveau' : lang === 'es' ? 'Comprobar de nuevo' : 'Check again'}
                      >
                        <RefreshCw size={14} className={isDiagnosing ? 'animate-spin' : ''} />
                      </button>
                      <button
                        onClick={handleCopySql}
                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        {copiedSql ? <Check size={14} /> : <FileText size={14} />}
                        <span>{copiedSql ? (lang === 'fr' ? 'Copié !' : lang === 'es' ? '¡Copiado!' : 'Copied!') : (lang === 'fr' ? 'Initialiser (SQL)' : lang === 'es' ? 'Inicializar (SQL)' : 'Initialize (SQL)')}</span>
                      </button>
                    </>
                  ) : (
                    customReviews.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                        <Check size={11} /> {lang === 'fr' ? 'Synchro Cloud OK' : lang === 'es' ? 'Sincro Cloud OK' : 'Cloud Sync OK'}
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Reviews Cards List (Scrollable Area) */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {customReviews.map((rev: any, index: number) => (
                  <div key={rev.id ? `${rev.id}-${index}` : `rev-${index}`} className="bg-white rounded-2xl p-4 sm:p-5 border border-black/5 shadow-2xs flex flex-col justify-between gap-4 relative group">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                            {rev.initials || (rev.author ? rev.author.substring(0, 2).toUpperCase() : 'GP')}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-gray-900 leading-tight truncate">{rev.author}</h4>
                            <span className="text-[11px] text-gray-400 mt-0.5 block">
                            {new Date(Number(rev.date)).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB')}
                          </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400 shrink-0">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={`star-${index}-${i}`} size={13} className="fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 italic leading-relaxed">
                        « {rev.text} »
                      </p>
                    </div>

                    <div className="pt-3 border-t border-black/5 flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                        <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                        <span>{lang === 'fr' ? 'Avis Google vérifié' : lang === 'es' ? 'Reseña de Google verificada' : 'Verified Google Review'}</span>
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewIndex(index);
                            setReviewForm({
                              author: rev.author || '',
                              initials: rev.initials || '',
                              date: (!isNaN(Number(rev.date))) ? new Date(Number(rev.date)).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                              rating: rev.rating || 5,
                              text: rev.text || '',
                            });
                            setIsAddReviewModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs text-primary hover:bg-primary/5 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil size={12} />
                          <span>{lang === 'fr' ? 'Modifier' : lang === 'es' ? 'Editar' : 'Edit'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(index)}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 size={12} />
                          <span>{lang === 'fr' ? 'Supprimer' : lang === 'es' ? 'Eliminar' : 'Delete'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      {/* MODAL: PRINTABLE RECEIPT / MUTUELLE REÇU */}
      <AnimatePresence>
        {selectedInvoiceForPrint && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:block print:static print:overflow-visible print-modal-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInvoiceForPrint(null)}
              className="absolute inset-0 print:hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12 z-10 border border-black/5 my-4 sm:my-8 print:m-0 print:p-0 print:max-w-none print:shadow-none print:border-none print:bg-white"
            >
              {/* Close and Print Actions */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-black/5 print:hidden">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? 'Aperçu de la facture' : lang === 'es' ? 'Vista Previa de la Factura' : 'Invoice Preview'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {lang === 'fr' ? 'Reçu officiel d\'honoraires' : lang === 'es' ? 'Recibo oficial de honorarios en español' : 'Official fee receipt'}
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={handlePrintInvoice}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    <Printer size={14} className="shrink-0" /> 
                    <span>{lang === 'fr' ? 'Imprimer la facture' : lang === 'es' ? 'Imprimir Factura' : 'Print Invoice'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceForPrint(null)}
                    className="px-4 py-2.5 sm:py-2 bg-secondary text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all shadow-sm active:scale-95 text-center whitespace-nowrap cursor-pointer"
                  >
                    {lang === 'fr' ? 'Fermer' : lang === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              </div>

              {/* PRINTABLE RECEIPT CORE (Can be styled specifically for printing) */}
              <div 
                ref={invoiceRef}
                id="receipt-print-area" 
                className="space-y-6 text-xs font-sans print:p-0 print:space-y-4 print:text-[10pt] bg-white"
              >
                {selectedInvoiceForPrint.status === 'pending' && (
                  <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl p-3.5 flex items-center justify-between print:bg-amber-50/50">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-amber-700" />
                      <div>
                        <p className="font-bold text-xs uppercase tracking-wider">
                          Factura pendiente de pago
                        </p>
                        <p className="text-[10px] text-amber-700 font-normal">
                          Esta factura aún no ha sido marcada como saldada.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleInvoiceStatus(selectedInvoiceForPrint, 'paid')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs print:hidden flex items-center gap-1.5 shrink-0"
                    >
                      <CheckCircle2 size={14} />
                      <span>Marcar como pagada</span>
                    </button>
                  </div>
                )}
                {/* Header Section */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-bold font-serif text-primary">Vincent Durroux</h1>
                    <p className="text-gray-800 text-xs font-bold tracking-wide mt-0.5">NIE : Z1503310N</p>
                    <p className="text-gray-500 text-xs mt-0.5">Osteo Valencia</p>
                    <p className="text-gray-400 text-[10px] mt-2">Calle General Pastor 25, 46183 L'Eliana, Valencia</p>
                    <p className="text-gray-400 text-[10px]">{lang === 'fr' ? 'Tél' : lang === 'es' ? 'Tel' : 'Phone'} : +34 614 159 462</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60">RECIBO DE HONORARIOS</span>
                    <h3 className="text-base font-bold text-gray-800 mt-1">{selectedInvoiceForPrint.invoiceNumber}</h3>
                    <p className="text-gray-400 mt-1">Fecha de emisión : {new Date(selectedInvoiceForPrint.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Patient / Destinataire Block */}
                <div className="bg-[#f4f4ec] p-4 print:p-3 rounded-2xl border border-black/5">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-primary/60 block mb-2">DESTINATARIO (PACIENTE)</span>
                  <h4 className="text-sm font-bold text-gray-800">{selectedInvoiceForPrint.clientName}</h4>
                  {(() => {
                    const client = clients.find(c => c.id === selectedInvoiceForPrint.clientId || c.name === selectedInvoiceForPrint.clientName);
                    if (!client) return null;
                    return (
                      <div className="text-[11px] text-gray-600 mt-1 space-y-0.5">
                        {client.dni && <p className="font-mono text-[11px]"><span className="font-semibold text-gray-700">DNI / NIE :</span> {client.dni}</p>}
                        {client.address && <p>{client.address}</p>}
                      </div>
                    );
                  })()}
                </div>

                {/* Invoice Table Grid */}
                <div className="overflow-x-auto -mx-1 sm:mx-0">
                  <table className="w-full border-collapse min-w-[340px]">
                    <thead>
                      <tr className="border-b-2 border-primary/20 text-left text-[10px] font-bold uppercase text-gray-400">
                        <th className="py-2.5">Descripción de los servicios</th>
                        <th className="py-2.5 text-center">Unidades</th>
                        <th className="py-2.5 text-center">IVA</th>
                        <th className="py-2.5 text-right">Importe Unitario</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-black/5 text-gray-700">
                        <td className="py-4">
                          <p className="font-bold">
                            {normalizeInvoiceDescription(formatLocalizedBonoText(selectedInvoiceForPrint.description, lang))}
                          </p>
                        </td>
                        <td className="py-4 text-center font-medium">
                          {selectedInvoiceForPrint.quantity || 1}
                        </td>
                        <td className="py-4 text-center">21%</td>
                        <td className="py-4 text-right font-bold">
                          {selectedInvoiceForPrint.originalAmount ? `${selectedInvoiceForPrint.originalAmount} €` : `${selectedInvoiceForPrint.amount} €`}
                        </td>
                      </tr>
                      {selectedInvoiceForPrint.discountAmount && selectedInvoiceForPrint.discountAmount > 0 ? (
                        <tr className="border-b border-black/5 text-emerald-800 bg-emerald-50/50">
                          <td className="py-3">
                            <p className="font-semibold text-xs flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase">
                                {selectedInvoiceForPrint.discountType === 'bono' ? 'Bono' : 'Descuento'}
                              </span>
                              {formatLocalizedBonoText(selectedInvoiceForPrint.discountLabel, lang) || (selectedInvoiceForPrint.discountType === 'bono' ? 'Bono aplicado' : 'Descuento aplicado')}
                            </p>
                          </td>
                          <td className="py-3 text-center text-[10px] text-emerald-700 font-medium">-</td>
                          <td className="py-3 text-center text-[10px] text-emerald-700 font-medium">-</td>
                          <td className="py-3 text-right font-bold text-emerald-700">
                            -{selectedInvoiceForPrint.discountAmount} €
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                {/* Total Recap */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 text-right space-y-2">
                    {(selectedInvoiceForPrint.discountAmount !== undefined && selectedInvoiceForPrint.discountAmount > 0 && selectedInvoiceForPrint.originalAmount !== undefined) ? (
                      <>
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Tarifa estándar</span>
                          <span>{selectedInvoiceForPrint.originalAmount} €</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-emerald-700 font-medium">
                          <span>
                            {selectedInvoiceForPrint.discountType === 'bono' ? 'Descuento Bono' : 'Descuento aplicado'}
                          </span>
                          <span>-{selectedInvoiceForPrint.discountAmount} €</span>
                        </div>
                      </>
                    ) : null}
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>Total base imponible</span>
                      <span>{(selectedInvoiceForPrint.amount / 1.21).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>IVA (21%)</span>
                      <span>{(selectedInvoiceForPrint.amount - (selectedInvoiceForPrint.amount / 1.21)).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-black/10">
                      <span>Total con IVA</span>
                      <span>{selectedInvoiceForPrint.amount} €</span>
                    </div>
                  </div>
                </div>

                {/* Signature or Certificate footer note */}
                <div className="pt-8 print:pt-4 flex justify-between items-end border-t border-black/5">
                  <div>
                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm">
                      {selectedInvoiceForPrint.status === 'pending'
                        ? "Factura pendiente de pago (no saldada)."
                        : selectedInvoiceForPrint.isBonoRedemption || selectedInvoiceForPrint.amount === 0 || selectedInvoiceForPrint.paymentMethod === 'not_applicable'
                          ? `Sesión deducida del Bono prepagado el ${new Date(selectedInvoiceForPrint.paymentDate || selectedInvoiceForPrint.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}. Método de pago: No aplicable (sesión descontada del Bono previamente adquirido).`
                          : `Recibo de factura pagada el ${new Date(selectedInvoiceForPrint.paymentDate || selectedInvoiceForPrint.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} mediante ${
                              selectedInvoiceForPrint.paymentMethod === 'card' 
                                ? 'tarjeta de crédito' 
                                : selectedInvoiceForPrint.paymentMethod === 'cash' 
                                  ? 'efectivo' 
                                  : 'transferencia bancaria'
                            }.`
                      }
                    </p>
                  </div>
                  
                  <div className="text-center w-48 border-t border-dashed border-gray-300 pt-3">
                    <p className="font-serif italic text-primary mt-1 text-[13px]">Vincent Durroux</p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* ACCOUNTING PERIOD RECAP PRINT MODAL */}
        {selectedRecapForPrint && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn print:bg-white print:p-0 print:block print:static print:overflow-visible print-modal-container">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecapForPrint(null)}
              className="absolute inset-0 print:hidden"
            />
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-4 sm:p-8 md:p-12 z-10 border border-black/5 my-4 sm:my-8 print:m-0 print:p-0 print:max-w-none print:shadow-none print:border-none print:bg-white"
            >
              {/* Actions Bar */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-4 border-b border-black/5 print:hidden">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? 'Récapitulatif comptable' : lang === 'es' ? 'Resumen Contable' : 'Accounting Summary'}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {formatRecapSubtitle(selectedRecapForPrint)}
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <button
                    onClick={handlePrintRecap}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer"
                  >
                    <Printer size={14} className="shrink-0" /> 
                    <span>{lang === 'fr' ? 'Imprimer le récapitulatif' : lang === 'es' ? 'Imprimir resumen' : 'Print summary'}</span>
                  </button>
                  <button
                    onClick={() => setSelectedRecapForPrint(null)}
                    className="px-4 py-2.5 sm:py-2 bg-secondary text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all shadow-sm active:scale-95 text-center whitespace-nowrap cursor-pointer"
                  >
                    {lang === 'fr' ? 'Fermer' : lang === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              </div>

              {/* ACCOUNTING RECAP CORE CONTENT */}
              <div 
                ref={recapRef}
                id="recap-print-area" 
                className="space-y-8 bg-white"
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-black/5 pb-6">
                  <div>
                    <h1 className="text-lg font-bold font-serif text-primary">Vincent Durroux</h1>
                    <p className="text-gray-800 text-xs font-bold tracking-wide mt-0.5">NIE : Z1503310N</p>
                    <p className="text-gray-500 mt-1 font-medium">Osteo Valencia</p>
                    <p className="text-gray-400 text-[10px] mt-1">Calle General Pastor 25, 46183 L'Eliana, Valencia</p>
                    <p className="text-gray-400 text-[10px]">{lang === 'fr' ? 'Tél' : lang === 'es' ? 'Tel' : 'Phone'} : +34 614 159 462</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60 block">
                      {lang === 'fr' ? 'RAPPORT FINANCIER' : lang === 'es' ? 'INFORME FINANCIERO' : 'FINANCIAL REPORT'}
                    </span>
                    <p className="text-sm font-serif font-bold text-gray-800 mt-1">
                      {formatRecapPeriodTitle(selectedRecapForPrint, lang)}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      {lang === 'fr' ? 'Généré le : ' : lang === 'es' ? 'Generado el : ' : 'Generated on: '}
                      {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                  <div className="bg-[#f4f4ec] p-3.5 rounded-2xl border border-black/5">
                    <p className="text-[9px] uppercase font-bold text-emerald-800">
                      {lang === 'fr' ? 'Chiffre d\'affaires Encaissé' : lang === 'es' ? 'Total Cobrado' : 'Total Collected'}
                    </p>
                    <p className="text-lg font-bold font-serif text-emerald-700 mt-1">
                      {selectedRecapForPrint.collectedTotal !== undefined ? selectedRecapForPrint.collectedTotal : selectedRecapForPrint.total} €
                    </p>
                    <p className="text-[8px] text-emerald-600 font-medium mt-0.5">
                      {selectedRecapForPrint.collectedCount !== undefined ? selectedRecapForPrint.collectedCount : selectedRecapForPrint.count} {lang === 'fr' ? 'réglées' : lang === 'es' ? 'pagadas' : 'paid'}
                    </p>
                  </div>
                  <div className="bg-[#f4f4ec] p-3.5 rounded-2xl border border-black/5">
                    <p className="text-[9px] uppercase font-bold text-amber-800">
                      {lang === 'fr' ? 'En attente' : lang === 'es' ? 'Pendiente' : 'Pending'}
                    </p>
                    <p className="text-lg font-bold font-serif text-amber-700 mt-1">
                      {selectedRecapForPrint.pendingTotal || 0} €
                    </p>
                    <p className="text-[8px] text-amber-600 font-medium mt-0.5">
                      {selectedRecapForPrint.invoices.filter(i => i.status === 'pending').length} {lang === 'fr' ? 'en attente' : lang === 'es' ? 'pendientes' : 'pending'}
                    </p>
                  </div>
                  <div className="bg-[#f4f4ec] p-3.5 rounded-2xl border border-black/5">
                    <p className="text-[9px] uppercase font-bold text-gray-400">
                      {lang === 'fr' ? 'Total Facturé' : lang === 'es' ? 'Total Facturado' : 'Total Invoiced'}
                    </p>
                    <p className="text-lg font-bold font-serif text-primary mt-1">
                      {selectedRecapForPrint.total} €
                    </p>
                    <p className="text-[8px] text-gray-400 font-medium mt-0.5">
                      {selectedRecapForPrint.count} {lang === 'fr' ? 'consultations' : lang === 'es' ? 'consultas' : 'consultations'}
                    </p>
                  </div>
                </div>

                {/* Detailed Invoices List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? `Détail des factures (${selectedRecapForPrint.invoices.length})` : lang === 'es' ? `Detalle de facturas (${selectedRecapForPrint.invoices.length})` : `Invoice details (${selectedRecapForPrint.invoices.length})`}
                  </h3>
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <table className="w-full border-collapse text-xs min-w-[480px]">
                      <thead>
                        <tr className="border-b-2 border-primary/20 text-left font-bold text-gray-400 uppercase text-[9px] tracking-wider">
                          <th className="py-2">{lang === 'fr' ? 'N° Facture' : lang === 'es' ? 'Factura' : 'Invoice'}</th>
                          <th className="py-2">{lang === 'fr' ? 'Patient' : lang === 'es' ? 'Paciente' : 'Patient'}</th>
                          <th className="py-2">{lang === 'fr' ? 'Date' : lang === 'es' ? 'Fecha' : 'Date'}</th>
                          <th className="py-2">{lang === 'fr' ? 'Règlement' : lang === 'es' ? 'Pago' : 'Payment'}</th>
                          <th className="py-2 text-center">{lang === 'fr' ? 'Statut' : lang === 'es' ? 'Estado' : 'Status'}</th>
                          <th className="py-2 text-right">{lang === 'fr' ? 'Montant' : lang === 'es' ? 'Importe' : 'Amount'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecapForPrint.invoices.map((inv, invIdx) => {
                          const isZeroBono = Boolean((inv.isBonoRedemption && inv.amount === 0) || (inv.amount === 0 && inv.discountType === 'bono'));
                          return (
                          <tr key={inv.id ? `${inv.id}-${invIdx}` : `recap-inv-${invIdx}`} className="border-b border-black/5 text-gray-700">
                            <td className="py-2 font-bold text-primary">
                              {isZeroBono ? (
                                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  Bono
                                </span>
                              ) : (
                                inv.invoiceNumber
                              )}
                            </td>
                            <td className="py-2 font-medium">{inv.clientName}</td>
                            <td className="py-2 text-gray-500">{new Date(inv.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}</td>
                            <td className="py-2">
                              <span className="text-[10px] font-medium uppercase">
                                {isZeroBono || inv.paymentMethod === 'not_applicable'
                                  ? (lang === 'fr' ? 'Non applicable' : lang === 'es' ? 'No aplicable' : 'N/A')
                                  : inv.paymentMethod === 'card' ? (lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card') :
                                    inv.paymentMethod === 'cash' ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash') : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer')}
                              </span>
                            </td>
                            <td className="py-2 text-center font-bold">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                                isZeroBono || inv.status === 'paid' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-amber-100 text-amber-900 font-bold'
                              }`}>
                                {isZeroBono ? (lang === 'fr' ? 'Réglé (Bono)' : lang === 'es' ? 'Pagada (Bono)' : 'Settled (Bono)') : inv.status === 'paid' ? (lang === 'fr' ? 'Réglée' : lang === 'es' ? 'Pagada' : 'Paid') : (lang === 'fr' ? 'En attente' : lang === 'es' ? 'Pendiente' : 'Pending')}
                              </span>
                            </td>
                            <td className="py-2 text-right font-bold">
                              {isZeroBono ? (
                                <span className="text-emerald-800 text-[10px]">0 € (Bono)</span>
                              ) : (
                                `${inv.amount} €`
                              )}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer validation statement */}
                <div className="pt-8 border-t border-black/5 flex justify-between items-center text-[10px] text-gray-400">
                  <p>
                    {lang === 'fr' 
                      ? 'Rapport comptable officiel pour déclarations fiscales et suivi d\'activité.' 
                      : lang === 'es' 
                        ? 'Informe contable oficial para declaraciones fiscales y seguimiento de actividad.' 
                        : 'Official accounting report for tax declarations and activity tracking.'}
                  </p>
                  <p className="font-serif italic text-primary">Vincent Durroux - Osteo Valencia</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}


      {/* MODAL: ADD / EDIT GOOGLE REVIEW */}
      <AnimatePresence>
        {isAddReviewModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-start sm:items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[92dvh] overflow-y-auto p-5 sm:p-6 shadow-2xl border border-black/10 text-left my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-4">
                <h3 className="font-serif text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Star className="fill-amber-400 text-amber-400" size={18} />
                  <span>
                    {editingReviewIndex !== null
                      ? (lang === 'fr' ? 'Modifier l\'avis Google' : lang === 'es' ? 'Editar reseña de Google' : 'Edit Google Review')
                      : (lang === 'fr' ? 'Ajouter un avis Google' : lang === 'es' ? 'Añadir reseña de Google' : 'Add Google Review')}
                  </span>
                </h3>
                <button
                  onClick={() => setIsAddReviewModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-black/5 cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveReview} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      {lang === 'fr' ? 'Nom du patient' : lang === 'es' ? 'Nombre del paciente' : 'Patient Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'fr' ? 'ex. Sarah Connor' : lang === 'es' ? 'ej. Sarah Connor' : 'e.g., Sarah Connor'}
                      value={reviewForm.author}
                      onChange={e => setReviewForm(prev => ({ ...prev, author: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      {lang === 'fr' ? 'Initiales' : lang === 'es' ? 'Iniciales' : 'Initials'}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'fr' ? 'ex. SC' : lang === 'es' ? 'ej. SC' : 'e.g., SC'}
                      maxLength={3}
                      value={reviewForm.initials}
                      onChange={e => setReviewForm(prev => ({ ...prev, initials: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      {lang === 'fr' ? "Date de l'avis" : lang === 'es' ? 'Fecha de la reseña' : 'Review Date'}
                    </label>
                    <input
                      type="date"
                      required
                      value={reviewForm.date}
                      onChange={e => setReviewForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      {lang === 'fr' ? 'Note (étoiles)' : lang === 'es' ? 'Valoración (estrellas)' : 'Rating (Stars)'}
                    </label>
                    <select
                      value={reviewForm.rating}
                      onChange={e => setReviewForm(prev => ({ ...prev, rating: Number(e.target.value) }))}
                      className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      <option value={5}>{lang === 'fr' ? '5 Étoiles ★★★★★ (Recommandé)' : lang === 'es' ? '5 Estrellas ★★★★★ (Recomendado)' : '5 Stars ★★★★★ (Recommended)'}</option>
                      <option value={4}>{lang === 'fr' ? '4 Étoiles ★★★★☆' : lang === 'es' ? '4 Estrellas ★★★★☆' : '4 Stars ★★★★☆'}</option>
                      <option value={3}>{lang === 'fr' ? '3 Étoiles ★★★☆☆' : lang === 'es' ? '3 Estrellas ★★★☆☆' : '3 Stars ★★★☆☆'}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    {lang === 'fr' ? "Texte de l'avis Google" : lang === 'es' ? 'Texto de la reseña de Google' : 'Google Review Text'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder={
                      lang === 'fr'
                        ? "Collez l'avis exact laissé par le patient sur votre fiche Google..."
                        : lang === 'es'
                          ? 'Pegue la reseña exacta dejada por el paciente en su perfil de Google...'
                          : 'Paste the exact patient review left on Google Business Profile...'
                    }
                    value={reviewForm.text}
                    onChange={e => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                    className="w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-black/5">
                  <button
                    type="button"
                    onClick={() => setIsAddReviewModalOpen(false)}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-black/5 rounded-xl cursor-pointer text-center"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-primary hover:bg-primary/95 rounded-xl shadow-xs cursor-pointer text-center whitespace-nowrap"
                  >
                    {editingReviewIndex !== null 
                      ? (lang === 'fr' ? 'Mettre à jour l\'avis' : lang === 'es' ? 'Actualizar reseña' : 'Update Review')
                      : (lang === 'fr' ? 'Ajouter l\'avis' : lang === 'es' ? 'Añadir reseña' : 'Add Review')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* MODAL: CUSTOM IN-APP CONFIRMATION DIALOG (Guaranteed to work in iframe, Google AI Studio, and Deployed sites) */}
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!confirmDialog.isLoading) {
                  setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                }
              }}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-5 sm:p-6 z-10 border border-black/10 text-left my-auto"
            >
              <div className="flex items-start gap-3.5 mb-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.isDangerous ? 'bg-rose-50 text-rose-600' : 'bg-primary/10 text-primary'
                }`}>
                  {confirmDialog.isDangerous ? <AlertTriangle size={20} /> : <FileText size={20} />}
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 font-serif">
                    {confirmDialog.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {confirmDialog.message}
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-3 border-t border-black/5">
                <button
                  type="button"
                  disabled={confirmDialog.isLoading}
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 text-center whitespace-nowrap cursor-pointer"
                >
                  {confirmDialog.cancelText || (lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={confirmDialog.isLoading}
                  onClick={async () => {
                    setConfirmDialog(prev => ({ ...prev, isLoading: true }));
                    try {
                      await confirmDialog.onConfirm();
                    } finally {
                      setConfirmDialog(prev => ({ ...prev, isLoading: false, isOpen: false }));
                    }
                  }}
                  className={`w-full sm:w-auto px-4 py-2.5 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 text-center whitespace-nowrap cursor-pointer ${
                    confirmDialog.isDangerous 
                      ? 'bg-rose-600 hover:bg-rose-700' 
                      : 'bg-primary hover:bg-primary/95'
                  }`}
                >
                  {confirmDialog.isLoading && <RefreshCw size={13} className="animate-spin shrink-0" />}
                  <span className="whitespace-nowrap">{confirmDialog.confirmText || (lang === 'fr' ? 'Confirmer' : lang === 'es' ? 'Confirmar' : 'Confirm')}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
