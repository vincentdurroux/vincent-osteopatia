import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Calendar, FileText, TrendingUp, Plus, Search, Trash2, 
  Download, LogOut, ArrowLeft, Check, RefreshCw, Calendar as CalendarIcon, 
  CreditCard, Shield, Clock, MapPin, Phone, Mail, FileCheck, Printer,
  ChevronRight, Pencil, ChevronLeft, LayoutGrid, List, ArrowRight,
  Copy, CheckCircle2, XCircle, AlertTriangle, Database, Server, UserPlus, User
} from 'lucide-react';
import { Client, ClientNote, Invoice, CalendarEvent } from '../../types';
import { api, isSupabaseConfigured, SUPABASE_SQL_SETUP } from '../../lib/supabase';
import SpineLogo from '../SpineLogo';
import { useTranslation } from '../../App';
import { Language, translations } from '../../translations';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Recharts imports for beautiful financial analytics
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';

interface AdminDashboardProps {
  onClose: () => void;
}

const getDefaultAppointmentTitle = (language: string) => {
  if (language === 'es') return "Sesión de Osteopatía";
  if (language === 'en') return "Osteopathy Session";
  return "Séance d'Ostéopathie";
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

type TabType = 'overview' | 'clients' | 'calendar' | 'billing';

export default function AdminDashboard({ onClose }: AdminDashboardProps) {
  const { lang, setLang, t } = useTranslation();
  const [receiptLang, setReceiptLang] = useState<Language>('fr');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // Calendar View Mode: 'grid' (Month grid), 'list' (List view)
  const [calendarViewMode, setCalendarViewMode] = useState<'grid' | 'list'>('grid');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Modals & Selected states
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientNotes, setClientNotes] = useState<ClientNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Forms states
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    address: '',
  });
  
  const [newNote, setNewNote] = useState({
    anamnese: '',
    treatment: '',
    category: 'treatment' as ClientNote['category'],
    date: new Date().toISOString().split('T')[0],
    motif: '',
  });
  
  const [isAddInvoiceOpen, setIsAddInvoiceOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    amount: 60,
    paymentMethod: 'card' as Invoice['paymentMethod'],
    description: "Séance d'Ostéopathie (1h)",
    language: 'fr' as 'fr' | 'en' | 'es',
  });
  
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isInlineNewPatient, setIsInlineNewPatient] = useState(false);
  const [inlinePatient, setInlinePatient] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  });
  const [newEvent, setNewEvent] = useState({
    clientId: '',
    title: "Séance d'Ostéopathie",
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    description: '',
  });

  // Keep appointment title updated according to language
  useEffect(() => {
    setNewEvent(prev => ({
      ...prev,
      title: getDefaultAppointmentTitle(lang)
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
  } | null>(null);

  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);

  // Edit states
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteAnamnese, setEditingNoteAnamnese] = useState('');
  const [editingNoteTreatment, setEditingNoteTreatment] = useState('');
  const [editingNoteCategory, setEditingNoteCategory] = useState<ClientNote['category']>('treatment');
  const [editingNoteMotif, setEditingNoteMotif] = useState('');
  const [editingNoteDate, setEditingNoteDate] = useState('');

  // Inline invoice creation states for patient notes
  const [creatingInvoiceForNoteId, setCreatingInvoiceForNoteId] = useState<string | null>(null);
  const [inlineInvoiceAmount, setInlineInvoiceAmount] = useState<number>(60);
  const [inlineInvoicePaymentMethod, setInlineInvoicePaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card');

  const [isEditInvoiceOpen, setIsEditInvoiceOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Accounting recap states
  const [recapPeriodType, setRecapPeriodType] = useState<'monthly' | 'annual'>('monthly');
  const [recapYear, setRecapYear] = useState<number>(new Date().getFullYear());
  const [recapMonth, setRecapMonth] = useState<number>(new Date().getMonth());
  const [selectedRecapForPrint, setSelectedRecapForPrint] = useState<{
    periodType: 'monthly' | 'annual';
    year: number;
    month: number;
    invoices: Invoice[];
    total: number;
    breakdown: { card: number; cash: number; transfer: number };
    count: number;
  } | null>(null);

  // Supabase Diagnostics & Synchronization states
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [tableDiagnostics, setTableDiagnostics] = useState<{
    isConfigured: boolean;
    clients: boolean;
    clientNotes: boolean;
    invoices: boolean;
    calendarEvents: boolean;
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
      const [allClients, allInvoices, allEvents] = await Promise.all([
        api.getClients(),
        api.getInvoices(),
        api.getLocalEvents(),
      ]);
      
      setClients(allClients);
      setInvoices(allInvoices);
      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedInvoiceForPrint) {
      setReceiptLang(selectedInvoiceForPrint.language || lang);
    }
  }, [selectedInvoiceForPrint, lang]);

  // Create new Client
  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.firstName || !newClient.lastName) return;
    
    try {
      const fullName = `${newClient.lastName.toUpperCase()} ${newClient.firstName}`;
      const created = await api.createClient({
        firstName: newClient.firstName,
        lastName: newClient.lastName,
        name: fullName,
        email: newClient.email,
        phone: newClient.phone,
        birthDate: newClient.birthDate,
        address: newClient.address,
      });
      setClients(prev => {
        const filtered = prev.filter(c => c.id !== created.id);
        return [...filtered, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setSelectedClient(created);
      setIsAddClientOpen(false);
      setNewClient({ firstName: '', lastName: '', email: '', phone: '', birthDate: '', address: '' });
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  // Delete Client Handler
  const handleDeleteClient = async (clientId: string) => {
    const clientToDelete = clients.find(c => c.id === clientId);
    const clientName = clientToDelete ? clientToDelete.name : '';
    const confirmMessage = lang === 'fr'
      ? `Êtes-vous sûr de vouloir supprimer définitivement le patient ${clientName} ?`
      : lang === 'es'
      ? `¿Está seguro de que desea eliminar al paciente ${clientName}?`
      : `Are you sure you want to delete patient ${clientName}?`;

    if (!window.confirm(confirmMessage)) return;

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
  };

  // Load notes when client changes
  useEffect(() => {
    if (selectedClient) {
      api.getClientNotes(selectedClient.id).then(setClientNotes);
    } else {
      setClientNotes([]);
    }
  }, [selectedClient]);

  // Create client Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || (!newNote.anamnese && !newNote.treatment)) return;
    
    try {
      const combinedContent = `Anamnèse :\n${newNote.anamnese}\n\nTraitement :\n${newNote.treatment}`;
      const created = await api.createClientNote({
        clientId: selectedClient.id,
        anamnese: newNote.anamnese,
        treatment: newNote.treatment,
        content: combinedContent,
        category: newNote.category,
        motif: newNote.motif,
        date: new Date(newNote.date).toISOString(),
      });
      setClientNotes(prev => [created, ...prev]);
      setNewNote({
        anamnese: '',
        treatment: '',
        category: 'treatment',
        date: new Date().toISOString().split('T')[0],
        motif: '',
      });
      
      // Update lastSessionAt locally
      setClients(prev => prev.map(c => c.id === selectedClient.id ? { ...c, lastSessionAt: created.date } : c));
    } catch (err) {
      console.error('Failed to create note:', err);
    }
  };

  // Delete client Note with confirmation
  const handleDeleteNote = async (noteId: string) => {
    const confirmed = window.confirm('Êtes-vous sûr de vouloir supprimer cette note clinique définitivement ?');
    if (!confirmed) return;
    
    try {
      await api.deleteClientNote(noteId);
      setClientNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Create invoice
  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.clientId || !newInvoice.amount) return;
    
    const client = clients.find(c => c.id === newInvoice.clientId);
    if (!client) return;
    
    try {
      const created = await api.createInvoice({
        clientId: client.id,
        clientName: client.name,
        amount: Number(newInvoice.amount),
        status: 'paid',
        paymentMethod: newInvoice.paymentMethod,
        date: new Date().toISOString().split('T')[0],
        description: newInvoice.description,
        language: newInvoice.language,
      });
      setInvoices(prev => [created, ...prev]);
      setIsAddInvoiceOpen(false);
      setNewInvoice({ clientId: '', amount: 60, paymentMethod: 'card', description: "Séance d'Ostéopathie (1h)", language: lang as 'fr' | 'en' | 'es' });
    } catch (err) {
      console.error('Failed to create invoice:', err);
    }
  };

  // Create inline invoice from notes history
  const handleCreateInlineInvoice = async (note: ClientNote) => {
    if (!selectedClient) return;
    try {
      const noteDateStr = note.date.includes('T') ? note.date.split('T')[0] : note.date;
      const created = await api.createInvoice({
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        amount: Number(inlineInvoiceAmount),
        status: 'paid',
        paymentMethod: inlineInvoicePaymentMethod,
        date: noteDateStr,
        description: translations[lang as Language].invoice.serviceDescription,
        language: lang as 'fr' | 'en' | 'es',
      });
      setInvoices(prev => [created, ...prev]);
      setCreatingInvoiceForNoteId(null);
    } catch (err) {
      console.error('Failed to create inline invoice:', err);
    }
  };

  // Update Client Handler
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editingClient.firstName || !editingClient.lastName) return;

    try {
      const fullName = `${editingClient.lastName.toUpperCase()} ${editingClient.firstName}`;
      const updated = await api.updateClient({
        ...editingClient,
        name: fullName,
      });
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      if (selectedClient?.id === updated.id) {
        setSelectedClient(updated);
      }
      setIsEditClientOpen(false);
      setEditingClient(null);
    } catch (err) {
      console.error('Failed to update client:', err);
    }
  };

  // Update Client Note Handler
  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteAnamnese && !editingNoteTreatment) return;
    try {
      const noteToUpdate = clientNotes.find(n => n.id === noteId);
      if (!noteToUpdate) return;

      const combinedContent = `Anamnèse :\n${editingNoteAnamnese}\n\nTraitement :\n${editingNoteTreatment}`;
      const updated = await api.updateClientNote({
        ...noteToUpdate,
        anamnese: editingNoteAnamnese,
        treatment: editingNoteTreatment,
        content: combinedContent,
        category: editingNoteCategory,
        motif: editingNoteMotif,
        date: new Date(editingNoteDate).toISOString(),
      });

      setClientNotes(prev => prev.map(n => n.id === noteId ? updated : n));
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
      });

      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i));
      setIsEditInvoiceOpen(false);
      setEditingInvoice(null);
    } catch (err) {
      console.error('Failed to update invoice:', err);
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
      });
      setIsEditEventOpen(true);
    } catch (err) {
      console.error('Error opening edit event modal:', err);
    }
  };

  // Direct Redirection to Clinical Notes from an Appointment
  const handleGoToNotes = (event: { clientId?: string; clientName?: string; summary?: string; start?: string; description?: string }) => {
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
      if (event.start) {
        const evDate = new Date(event.start);
        const dateStr = evDate.toISOString().split('T')[0];
        setNewNote(prev => ({
          ...prev,
          date: dateStr,
          motif: event.summary || prev.motif,
        }));
      }
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

  // Create new session/appointment on local / Supabase calendar
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalClientId: string | undefined = newEvent.clientId || undefined;
    let finalClientName: string | undefined = undefined;

    if (isInlineNewPatient) {
      if (!inlinePatient.lastName || !inlinePatient.firstName) {
        alert(lang === 'fr' ? "Veuillez saisir le nom et le prénom du nouveau patient." : "Please enter the new patient's first and last name.");
        return;
      }
      try {
        const fullName = `${inlinePatient.lastName.toUpperCase()} ${inlinePatient.firstName}`;
        const createdCl = await api.createClient({
          firstName: inlinePatient.firstName,
          lastName: inlinePatient.lastName,
          name: fullName,
          email: inlinePatient.email,
          phone: inlinePatient.phone,
        });
        setClients(prev => {
          const filtered = prev.filter(c => c.id !== createdCl.id);
          return [...filtered, createdCl].sort((a, b) => a.name.localeCompare(b.name));
        });
        finalClientId = createdCl.id;
        finalClientName = createdCl.name;
      } catch (err) {
        console.error('Failed to create inline patient:', err);
        alert(lang === 'fr' ? "Erreur lors de la création du patient." : "Error creating patient.");
        return;
      }
    } else if (newEvent.clientId) {
      const client = clients.find(c => c.id === newEvent.clientId);
      if (client) {
        finalClientName = client.name;
      }
    }

    let summary = newEvent.title;
    if (finalClientName && !summary.includes(finalClientName)) {
      summary = `${finalClientName} - ${newEvent.title}`;
    }
    
    const startIso = new Date(`${newEvent.date}T${newEvent.startTime}:00`).toISOString();
    const endIso = new Date(`${newEvent.date}T${newEvent.endTime}:00`).toISOString();
    
    try {
      const created = await api.createLocalEvent({
        summary,
        description: newEvent.description || "Consultation au cabinet Vincent Osteopatía.",
        start: startIso,
        end: endIso,
        clientId: finalClientId,
        clientName: finalClientName,
      });

      setEvents(prev => [...prev, created].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      setIsAddEventOpen(false);
      setIsInlineNewPatient(false);
      setInlinePatient({ firstName: '', lastName: '', phone: '', email: '' });
      setNewEvent({
        clientId: '',
        title: getDefaultAppointmentTitle(lang),
        date: new Date().toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:00',
        description: '',
      });
    } catch (err: any) {
      console.error('Failed to create appointment:', err);
      alert(lang === 'fr' ? "Erreur lors de l'enregistrement du rendez-vous." : "Error creating appointment.");
    }
  };

  // Update existing Calendar event
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    const startIso = new Date(`${editingEvent.date}T${editingEvent.startTime}:00`).toISOString();
    const endIso = new Date(`${editingEvent.date}T${editingEvent.endTime}:00`).toISOString();

    try {
      const existing = events.find(ev => ev.id === editingEvent.id);
      const updated = await api.updateLocalEvent({
        id: editingEvent.id,
        summary: editingEvent.summary,
        description: editingEvent.description,
        start: startIso,
        end: endIso,
        clientId: existing?.clientId,
        clientName: existing?.clientName,
      });

      setEvents(prev => prev.map(ev => ev.id === updated.id ? updated : ev).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()));
      setIsEditEventOpen(false);
      setEditingEvent(null);
    } catch (err: any) {
      console.error('Failed to update event:', err);
      alert(lang === 'fr' ? "Erreur lors de la modification du rendez-vous." : "Error updating appointment.");
    }
  };

  // Delete Calendar event
  const handleDeleteEvent = async (eventId: string) => {
    console.log("Delete attempt for event:", eventId);
    const confirmed = window.confirm(
      lang === 'fr' 
        ? 'Voulez-vous supprimer définitivement ce rendez-vous ?' 
        : 'Do you want to permanently delete this appointment?'
    );
    console.log("Confirmed:", confirmed);
    if (!confirmed) return;

    try {
      await api.deleteLocalEvent(eventId);
      console.log("Deletion successful");
      setEvents(prev => prev.filter(ev => ev.id !== eventId));
      if (isEditEventOpen) {
        setIsEditEventOpen(false);
        setEditingEvent(null);
      }
    } catch (err: any) {
      console.error('Failed to delete event:', err);
      alert(lang === 'fr' ? "Erreur lors de la suppression." : "Error deleting appointment.");
    }
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

  const handleExportPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element || isExporting) return;

    setIsExporting(true);
    try {
      // Small delay to ensure any layout shifts are settled
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 800, // Fixed width for consistent PDF layout
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert(lang === 'fr' ? 'Erreur lors de la génération du PDF. Veuillez réessayer.' : 'Error generating PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter clients based on search query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 z-[80] bg-[#fdfdfb] text-gray-800 flex flex-col md:flex-row overflow-hidden print:relative print:inset-auto print:overflow-visible print:bg-white">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-60 bg-[#f4f4ec] border-b md:border-b-0 md:border-r border-black/5 flex flex-col justify-between shrink-0 p-4 md:p-5 print:hidden">
        <div className="flex flex-col gap-4 md:gap-6">
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
            className="flex items-center gap-2 px-3.5 py-2 bg-white/80 hover:bg-white border border-black/5 rounded-xl text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-primary transition-all shadow-2xs w-fit md:w-full"
          >
            <ArrowLeft size={15} />
            <span>{lang === 'fr' ? "Retour au site" : lang === 'es' ? "Volver al sitio" : "Back to website"}</span>
          </button>

          {/* Navigation Items */}
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'overview', label: t.admin.tabs.overview, icon: TrendingUp },
              { id: 'clients', label: t.admin.tabs.clients, icon: Users },
              { id: 'calendar', label: t.admin.tabs.calendar, icon: Calendar },
              { id: 'billing', label: t.admin.tabs.billing, icon: FileText },
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all whitespace-nowrap md:w-full text-xs font-semibold uppercase tracking-wider ${
                    isActive 
                      ? 'bg-primary text-white shadow-md shadow-primary/10' 
                      : 'text-gray-600 hover:bg-black/5'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 overflow-y-auto bg-[#fbfbfa] p-4 sm:p-8 flex flex-col print:hidden">
        
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

            {/* Metrics cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {/* Metric 1 */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.admin.overview.stats.activePatients}</p>
                  <h3 className="text-4xl font-semibold mt-1 font-serif text-primary">{totalPatientsCount}</h3>
                  <p className="text-xs text-gray-500 mt-2">{totalPatientsCount} {t.admin.clients.totalPatients}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Users size={22} />
                </div>
              </div>
              
              {/* Metric 2 */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.admin.overview.stats.thisMonthSessions}</p>
                  <h3 className="text-4xl font-semibold mt-1 font-serif text-primary">{totalSessionsThisMonth}</h3>
                  <p className="text-xs text-gray-500 mt-2">
                    {lang === 'fr' 
                      ? `Séances réalisées en ${new Date().toLocaleDateString('fr-FR', { month: 'long' })}` 
                      : lang === 'es' 
                        ? `Sesiones realizadas en ${new Date().toLocaleDateString('es-ES', { month: 'long' })}` 
                        : `Sessions completed in ${new Date().toLocaleDateString('en-US', { month: 'long' })}`}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Clock size={22} />
                </div>
              </div>

              {/* Metric 3 */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{t.admin.overview.stats.monthlyIncome}</p>
                  <h3 className="text-4xl font-semibold mt-1 font-serif text-primary">{totalRevenueThisMonth} €</h3>
                  <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center gap-1">
                    <span>{lang === 'fr' ? "Objectif mensuel de cabinet actif" : lang === 'es' ? "Objetivo mensual de clínica activa" : "Monthly active clinic target"}</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                  <TrendingUp size={22} />
                </div>
              </div>
            </div>

            {/* AGENDA DU CABINET DIRECT SUR L'APERÇU */}
            {(() => {
              const now = new Date();
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

              const upcomingEvents = events.filter(ev => {
                try {
                  return new Date(ev.start).getTime() >= now.getTime();
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
                            : "View appointments and click \"Take Notes\" to open the patient file directly."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsAddEventOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-bold transition-all shadow-sm"
                      >
                        <Plus size={14} />
                        <span>{lang === 'fr' ? "Nouveau RDV" : "New Appointment"}</span>
                      </button>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-[#f4f4ec] hover:bg-black/5 text-gray-700 rounded-2xl text-xs font-bold transition-all border border-black/5"
                      >
                        <span>{lang === 'fr' ? "Voir l'agenda complet" : "Full calendar"}</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Appointments list */}
                  {todayEvents.length > 0 ? (
                    <div className="space-y-3 pt-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        {lang === 'fr' ? "Consultations prévues aujourd'hui" : "Appointments scheduled today"} ({todayEvents.length})
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {todayEvents.map(event => (
                          <div 
                            key={event.id} 
                            className="p-4 rounded-2xl bg-emerald-50/50 hover:bg-emerald-50/90 border border-emerald-200/60 transition-all flex flex-col justify-between gap-3 group"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                                  <Clock size={16} />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                                    {event.summary}
                                  </h4>
                                  <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                                    {new Date(event.start).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}
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
                                className="p-1.5 hover:bg-emerald-200/60 text-emerald-800 rounded-lg transition-all opacity-70 group-hover:opacity-100"
                                title={lang === 'fr' ? "Modifier le rendez-vous" : "Edit appointment"}
                              >
                                <Pencil size={13} />
                              </button>
                            </div>

                            {/* Action bar on appointment card */}
                            <div className="pt-2 border-t border-emerald-200/40 flex items-center justify-between gap-2">
                              <span className="text-[10px] text-gray-500 font-medium truncate max-w-[150px]">
                                {event.clientName || (lang === 'fr' ? "Patient associé" : "Linked patient")}
                              </span>
                              <button
                                onClick={() => handleGoToNotes(event)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition-all shadow-xs group/btn"
                                title={lang === 'fr' ? "Ouvrir la fiche médicale et rédiger les notes cliniques" : "Open medical record and write clinical notes"}
                              >
                                <FileCheck size={13} />
                                <span>{lang === 'fr' ? "Prise de notes" : lang === 'es' ? "Tomar notas" : "Take Notes"}</span>
                                <ArrowRight size={12} className="group-hover/btn:translate-x-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        ))}
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
                              {lang === 'fr' ? "Aucun rendez-vous prévu pour aujourd'hui." : "No appointments scheduled for today."}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsAddEventOpen(true)}
                          className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all"
                        >
                          {lang === 'fr' ? "+ Planifier un rendez-vous" : "+ Schedule appointment"}
                        </button>
                      </div>

                      {/* Prochains rendez-vous à venir */}
                      {upcomingEvents.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                            {lang === 'fr' ? "Prochaines consultations à venir" : "Upcoming appointments"}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {upcomingEvents.map(event => (
                              <div
                                key={event.id}
                                className="p-3.5 rounded-2xl bg-white hover:bg-[#fafafa] border border-black/5 hover:border-primary/20 transition-all flex flex-col justify-between gap-2 shadow-2xs group"
                              >
                                <div>
                                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold mb-1">
                                    <span>
                                      {new Date(event.start).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="text-primary font-bold">
                                      {new Date(event.start).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : 'es-ES', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-gray-800 line-clamp-1">
                                    {event.summary}
                                  </h5>
                                </div>

                                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/5">
                                  <button
                                    onClick={() => openEditEventModal(event)}
                                    className="text-[11px] text-gray-500 hover:text-primary transition-colors flex items-center gap-1 font-medium"
                                  >
                                    <Pencil size={11} />
                                    <span>{lang === 'fr' ? "Détails" : "Details"}</span>
                                  </button>
                                  <button
                                    onClick={() => handleGoToNotes(event)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-[11px] font-bold transition-all"
                                    title={lang === 'fr' ? "Ouvrir la fiche et prendre des notes" : "Open file and take notes"}
                                  >
                                    <FileCheck size={11} />
                                    <span>{lang === 'fr' ? "Notes" : "Notes"}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Financial Performance Chart & Activity Column */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Performance Chart Column */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm lg:col-span-2 flex flex-col justify-between">
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

              {/* Quick Actions & Recent list */}
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-serif font-bold text-primary mb-4">{t.admin.overview.recentActivity}</h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => { setActiveTab('clients'); setIsAddClientOpen(true); }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f4ec] hover:bg-primary/5 border border-black/5 text-left text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <Users size={16} className="text-primary" /> {t.admin.clients.addPatient}
                      </span>
                      <Plus size={16} />
                    </button>

                    <button 
                      onClick={() => { setActiveTab('calendar'); setIsAddEventOpen(true); }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f4ec] hover:bg-primary/5 border border-black/5 text-left text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <CalendarIcon size={16} className="text-primary" /> {t.admin.calendar.addEvent}
                      </span>
                      <Plus size={16} />
                    </button>

                    <button 
                      onClick={() => { setActiveTab('billing'); setIsAddInvoiceOpen(true); }}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-[#f4f4ec] hover:bg-primary/5 border border-black/5 text-left text-xs font-bold uppercase tracking-wider transition-all"
                    >
                      <span className="flex items-center gap-3">
                        <CreditCard size={16} className="text-primary" /> {t.admin.billing.addInvoice}
                      </span>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{t.admin.overview.recentPatients}</h4>
                  <div className="space-y-3">
                    {clients.slice(0, 3).map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => { setSelectedClient(c); setActiveTab('clients'); }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                            <User size={14} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-bold truncate">{c.name}</p>
                            <p className="text-[10px] text-gray-500 truncate">{c.email}</p>
                          </div>
                        </div>
                        <Check size={14} className="text-primary/40" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CLIENT DIRECTORY & NOTES */}
        {activeTab === 'clients' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
            
            {/* List and Search column */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm lg:col-span-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold font-serif text-primary">{t.admin.clients.title}</h3>
                  <p className="text-xs text-gray-500">
                    {lang === 'fr' ? "Gérez les fiches médicales." : lang === 'es' ? "Gestione los expedientes médicos." : "Manage medical records."}
                  </p>
                </div>
                <button
                  onClick={() => setIsAddClientOpen(true)}
                  className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white hover:scale-105 transition-transform"
                  title={t.admin.clients.addPatient}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Search bar */}
              <div className="relative mb-6">
                <Search size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={lang === 'fr' ? "Rechercher un patient..." : lang === 'es' ? "Buscar paciente..." : "Search patient..."}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-secondary border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                />
              </div>

              {/* Patients list */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[60vh] pr-1">
                {filteredClients.map(c => {
                  const isSelected = selectedClient?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`group w-full flex items-center justify-between p-3 rounded-2xl transition-all border ${
                        isSelected 
                          ? 'bg-primary/5 border-primary/20 shadow-sm' 
                          : 'border-transparent hover:bg-black/5'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedClient(c)}
                        className="flex-1 flex items-center gap-3 overflow-hidden text-left"
                      >
                        <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          <User size={18} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate">{c.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{c.phone}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClient(c.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 opacity-70 transition-all"
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
                  <p className="text-xs text-center text-gray-400 mt-12">
                    {lang === 'fr' ? "Aucun patient trouvé." : lang === 'es' ? "No se encontraron pacientes." : "No patients found."}
                  </p>
                )}
              </div>
            </div>

            {/* Detailed clinical card column */}
            <div className="lg:col-span-2 flex flex-col">
              {selectedClient ? (
                <div className="space-y-6 flex flex-col flex-1">
                  
                  {/* Patient Info Header card */}
                  <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary/15 rounded-full flex items-center justify-center text-primary font-serif font-bold text-2xl">
                          <User size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold font-serif text-primary leading-tight">{selectedClient.name}</h3>
                            <button
                              onClick={() => {
                                setEditingClient(selectedClient);
                                setIsEditClientOpen(true);
                              }}
                              className="p-1 hover:bg-black/5 rounded-lg text-gray-500 hover:text-primary transition-all"
                              title={lang === 'fr' ? "Modifier la fiche du patient" : lang === 'es' ? "Editar ficha del paciente" : "Edit patient file"}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClient(selectedClient.id)}
                              className="p-1 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-all"
                              title={lang === 'fr' ? "Supprimer ce patient" : lang === 'es' ? "Eliminar paciente" : "Delete patient"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {lang === 'fr' ? "Date de naissance" : lang === 'es' ? "Fecha de nacimiento" : "Date of birth"} : {selectedClient.birthDate ? new Date(selectedClient.birthDate).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US') : (lang === 'fr' ? 'Non renseignée' : lang === 'es' ? 'No especificado' : 'Not specified')}
                          </p>
                        </div>
                      </div>

                      {/* Info lines grid */}
                      <div className="flex flex-col gap-1.5 sm:text-right">
                        <p className="text-xs font-bold text-gray-600 flex items-center sm:justify-end gap-1.5">
                          <Phone size={12} className="text-primary" /> {selectedClient.phone}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center sm:justify-end gap-1.5 truncate">
                          <Mail size={12} className="text-primary" /> {selectedClient.email}
                        </p>
                        {selectedClient.address && (
                          <p className="text-[10px] text-gray-400 flex items-center sm:justify-end gap-1.5">
                            <MapPin size={10} className="text-primary" /> {selectedClient.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Consultation Notes Section */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-stretch">
                    
                    {/* Add Clinical Note Form Column */}
                    <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm md:col-span-2">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                        <FileCheck size={16} /> {lang === 'fr' ? "Nouvelle Consultation" : lang === 'es' ? "Nueva Consulta" : "New Consultation"}
                      </h4>

                      <form onSubmit={handleAddNote} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                              {lang === 'fr' ? "Catégorie" : lang === 'es' ? "Categoría" : "Category"}
                            </label>
                            <select
                              value={newNote.category}
                              onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value as ClientNote['category'] }))}
                              className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
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
                              onChange={(e) => setNewNote(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full p-2 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? "Motif de consultation" : lang === 'es' ? "Motivo de consulta" : "Reason for consultation"}
                          </label>
                          <input
                            type="text"
                            required
                            placeholder={lang === 'fr' ? "ex: Douleur lombaire aiguë, Bilan..." : lang === 'es' ? "ej: Dolor lumbar agudo, Evaluación..." : "e.g., Acute lower back pain, Assessment..."}
                            value={newNote.motif}
                            onChange={(e) => setNewNote(prev => ({ ...prev, motif: e.target.value }))}
                            className="w-full p-2.5 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? "Anamnèse & Symptômes" : lang === 'es' ? "Anamnesis y Síntomas" : "Anamnesis & Symptoms"}
                          </label>
                          <textarea
                            value={newNote.anamnese}
                            onChange={(e) => setNewNote(prev => ({ ...prev, anamnese: e.target.value }))}
                            rows={4}
                            placeholder={lang === 'fr' ? "ex: Douleur lombaire basse gauche depuis 3 jours, anamnèse..." : lang === 'es' ? "ej: Dolor lumbar bajo izquierdo desde hace 3 días, anamnesis..." : "e.g., Left lower back pain for 3 days, anamnesis..."}
                            className="w-full p-3 bg-[#f4f4ec] rounded-2xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                          ></textarea>
                        </div>

                        <div>
                          <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                            {lang === 'fr' ? "Traitement & Recommandations" : lang === 'es' ? "Tratamiento y Recomendaciones" : "Treatment & Recommendations"}
                          </label>
                          <textarea
                            value={newNote.treatment}
                            onChange={(e) => setNewNote(prev => ({ ...prev, treatment: e.target.value }))}
                            rows={4}
                            placeholder={lang === 'fr' ? "ex: Libération sacrée, mobilisations, étirements..." : lang === 'es' ? "ej: Liberación sacra, movilizaciones, estiramientos..." : "e.g., Sacral release, mobilizations, stretches..."}
                            className="w-full p-3 bg-[#f4f4ec] rounded-2xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                          ></textarea>
                          <span className="text-[9px] text-gray-400 block mt-1">
                            {lang === 'fr' ? "Dossier sauvegardé automatiquement en mode sécurisé." : lang === 'es' ? "Expediente guardado automáticamente en modo seguro." : "Record saved automatically in secure mode."}
                          </span>
                        </div>

                        <button
                          type="submit"
                          disabled={!newNote.anamnese && !newNote.treatment}
                          className="w-full py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 disabled:opacity-50"
                        >
                          {lang === 'fr' ? "Enregistrer la note" : lang === 'es' ? "Guardar la nota" : "Save note"}
                        </button>
                      </form>
                    </div>

                    {/* Chronic Notes History Column */}
                    <div className="md:col-span-3 space-y-4">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2 mb-2 px-1">
                        {lang === 'fr' ? 'Historique des fiches' : lang === 'es' ? 'Historial de fichas' : 'Record history'} ({clientNotes.length})
                      </h4>

                      {clientNotes.map(note => {
                        const isEditing = editingNoteId === note.id;
                        return (
                          <div key={note.id} className="bg-white p-5 rounded-3xl border border-black/5 shadow-sm space-y-3 relative group">
                            {isEditing ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1">
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Catégorie" : lang === 'es' ? "Categoría" : "Category"}
                                    </label>
                                    <select
                                      value={editingNoteCategory}
                                      onChange={(e) => setEditingNoteCategory(e.target.value as ClientNote['category'])}
                                      className="p-1.5 bg-[#f4f4ec] rounded-lg border border-black/5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all w-full sm:w-auto"
                                    >
                                      <option value="treatment">{lang === 'fr' ? "Traitement / Ostéopathie" : lang === 'es' ? "Tratamiento / Osteopatía" : "Treatment / Osteopathy"}</option>
                                      <option value="evaluation">{lang === 'fr' ? "Anamnèse / Évaluation" : lang === 'es' ? "Anamnesis / Evaluación" : "Anamnesis / Evaluation"}</option>
                                      <option value="follow-up">{lang === 'fr' ? "Suivi / Posture" : lang === 'es' ? "Seguimiento / Postura" : "Follow-up / Posture"}</option>
                                      <option value="general">{lang === 'fr' ? "Note générale" : lang === 'es' ? "Nota general" : "General note"}</option>
                                    </select>
                                  </div>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(note.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Date" : lang === 'es' ? "Fecha" : "Date"}
                                    </label>
                                    <input
                                      type="date"
                                      value={editingNoteDate}
                                      onChange={(e) => setEditingNoteDate(e.target.value)}
                                      className="w-full p-1.5 bg-[#f4f4ec] rounded-lg border border-black/5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Motif" : lang === 'es' ? "Motivo" : "Reason"}
                                    </label>
                                    <input
                                      type="text"
                                      value={editingNoteMotif}
                                      onChange={(e) => setEditingNoteMotif(e.target.value)}
                                      className="w-full p-1.5 bg-[#f4f4ec] rounded-lg border border-black/5 text-[11px] focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
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
                                      rows={6}
                                      className="w-full p-2.5 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                                      {lang === 'fr' ? "Traitement & Recommandations" : lang === 'es' ? "Tratamiento y Recomendaciones" : "Treatment & Recommendations"}
                                    </label>
                                    <textarea
                                      value={editingNoteTreatment}
                                      onChange={(e) => setEditingNoteTreatment(e.target.value)}
                                      rows={6}
                                      className="w-full p-2.5 bg-[#f4f4ec] rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none leading-relaxed"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => setEditingNoteId(null)}
                                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    {lang === 'fr' ? "Annuler" : lang === 'es' ? "Cancelar" : "Cancel"}
                                  </button>
                                  <button
                                    onClick={() => handleUpdateNote(note.id)}
                                    disabled={!editingNoteAnamnese && !editingNoteTreatment}
                                    className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                                  >
                                    {lang === 'fr' ? "Enregistrer" : lang === 'es' ? "Guardar" : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                      note.category === 'treatment' ? 'bg-emerald-50 text-emerald-700' :
                                      note.category === 'evaluation' ? 'bg-indigo-50 text-indigo-700' :
                                      note.category === 'follow-up' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {note.category === 'treatment' ? (lang === 'fr' ? 'Traitement' : lang === 'es' ? 'Tratamiento' : 'Treatment') :
                                       note.category === 'evaluation' ? (lang === 'fr' ? 'Évaluation' : lang === 'es' ? 'Evaluación' : 'Evaluation') :
                                       note.category === 'follow-up' ? (lang === 'fr' ? 'Suivi' : lang === 'es' ? 'Seguimiento' : 'Follow-up') : (lang === 'fr' ? 'Général' : lang === 'es' ? 'General' : 'General')}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(note.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                  </div>

                                  {/* Edit & Delete Buttons */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                    <button
                                      onClick={() => {
                                        setEditingNoteId(note.id);
                                        setEditingNoteAnamnese(note.anamnese || note.content || '');
                                        setEditingNoteTreatment(note.treatment || '');
                                        setEditingNoteCategory(note.category);
                                        setEditingNoteMotif(note.motif || '');
                                        setEditingNoteDate(new Date(note.date).toISOString().split('T')[0]);
                                      }}
                                      className="p-1 hover:bg-black/5 text-gray-500 hover:text-primary rounded-lg transition-all"
                                      title={lang === 'fr' ? "Modifier la note" : lang === 'es' ? "Editar nota" : "Edit note"}
                                    >
                                      <Pencil size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteNote(note.id)}
                                      className="p-1 hover:bg-rose-50 text-rose-500 rounded-lg transition-all"
                                      title={lang === 'fr' ? "Supprimer la note" : lang === 'es' ? "Eliminar nota" : "Delete note"}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </div>

                                {note.motif && (
                                  <div className="flex items-center gap-1.5 py-1 px-2.5 bg-primary/5 text-primary rounded-xl w-fit text-[11px] font-medium border border-primary/10">
                                    <span className="font-bold">{lang === 'fr' ? 'Motif' : lang === 'es' ? 'Motivo' : 'Reason'} :</span> {note.motif}
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
                              const noteDateStr = note.date.includes('T') ? note.date.split('T')[0] : note.date;
                              const associatedInvoice = invoices.find(inv => 
                                inv.clientId === note.clientId && 
                                (inv.date === noteDateStr || (inv.date && noteDateStr && inv.date.slice(0, 10) === noteDateStr.slice(0, 10)))
                              );

                              return associatedInvoice ? (
                                <div className="mt-4 pt-4 border-t border-black/5 flex flex-wrap items-center justify-between gap-3 bg-secondary/30 p-3 rounded-2xl">
                                  <div className="flex items-center gap-2">
                                    <CreditCard size={14} className="text-primary" />
                                    <div className="text-left">
                                      <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                        <span>{lang === 'fr' ? 'Facture' : lang === 'es' ? 'Factura' : 'Invoice'} #{associatedInvoice.invoiceNumber}</span>
                                        <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-bold">
                                          {lang === 'fr' ? 'Payée' : lang === 'es' ? 'Pagada' : 'Paid'}
                                        </span>
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        {associatedInvoice.amount} € • {
                                          associatedInvoice.paymentMethod === 'card' ? (lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card') :
                                          associatedInvoice.paymentMethod === 'cash' ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash') : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer')
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <button
                                    onClick={() => setSelectedInvoiceForPrint(associatedInvoice)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                                  >
                                    <Printer size={12} />
                                    <span>{lang === 'fr' ? 'Reçu' : lang === 'es' ? 'Recibo' : 'Receipt'}</span>
                                  </button>
                                </div>
                              ) : (
                                <div className="mt-4 pt-4 border-t border-black/5">
                                  {creatingInvoiceForNoteId === note.id ? (
                                    <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-3">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                                          <CreditCard size={13} />
                                          {lang === 'fr' ? 'Créer une facture' : lang === 'es' ? 'Crear factura' : 'Create invoice'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setCreatingInvoiceForNoteId(null)}
                                          className="text-[10px] text-gray-400 hover:text-gray-600 font-bold"
                                        >
                                          {lang === 'fr' ? 'Annuler' : 'Cancel'}
                                        </button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                            {lang === 'fr' ? 'Montant (€)' : 'Amount (€)'}
                                          </label>
                                          <input
                                            type="number"
                                            value={inlineInvoiceAmount}
                                            onChange={(e) => setInlineInvoiceAmount(Number(e.target.value))}
                                            className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[9px] uppercase tracking-wider font-bold text-gray-400 block mb-0.5">
                                            {lang === 'fr' ? 'Paiement' : 'Payment'}
                                          </label>
                                          <select
                                            value={inlineInvoicePaymentMethod}
                                            onChange={(e) => setInlineInvoicePaymentMethod(e.target.value as any)}
                                            className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                          >
                                            <option value="card">{lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card'}</option>
                                            <option value="cash">{lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash'}</option>
                                            <option value="transfer">{lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer'}</option>
                                          </select>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCreateInlineInvoice(note)}
                                        className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
                                      >
                                        {lang === 'fr' ? 'Générer & Enregistrer' : 'Generate & Save'}
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCreatingInvoiceForNoteId(note.id);
                                        setInlineInvoiceAmount(60);
                                        setInlineInvoicePaymentMethod('card');
                                      }}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-primary/5 text-gray-500 hover:text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border border-black/5"
                                    >
                                      <Plus size={12} />
                                      <span>{lang === 'fr' ? 'Créer une facture' : lang === 'es' ? 'Crear factura' : 'Create Invoice'}</span>
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
            
            {/* Header / Config Bar */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold font-serif text-primary flex items-center gap-2">
                    <CalendarIcon className="text-primary" size={22} />
                    {lang === 'fr' ? 'Agenda du Cabinet' : lang === 'es' ? 'Agenda de la Clínica' : 'Clinic Calendar'}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {isSupabaseConfigured 
                      ? (lang === 'fr' ? "Enregistré sur Supabase Cloud" : lang === 'es' ? "Guardado en Supabase Cloud" : "Saved on Supabase Cloud")
                      : (lang === 'fr' ? "Agenda Local" : lang === 'es' ? "Agenda Local" : "Local Calendar")}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'fr' 
                    ? "Gérez l'ensemble de vos consultations et créneaux directement depuis votre application." 
                    : lang === 'es' 
                      ? "Gestione todas sus consultas y horarios directamente desde su aplicación." 
                      : "Manage all your appointments and time slots directly in your application."}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-between lg:justify-end">
                {/* View Switcher: Grid vs List */}
                <div className="flex items-center bg-[#f4f4ec] p-1 rounded-2xl border border-black/5">
                  <button
                    onClick={() => setCalendarViewMode('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      calendarViewMode === 'grid' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <LayoutGrid size={14} />
                    <span>{lang === 'fr' ? "Vue Grille" : lang === 'es' ? "Vista Cuadrícula" : "Grid View"}</span>
                  </button>
                  <button
                    onClick={() => setCalendarViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      calendarViewMode === 'list' 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <List size={14} />
                    <span>{lang === 'fr' ? "Liste" : lang === 'es' ? "Lista" : "List View"}</span>
                  </button>
                </div>

                <button 
                  onClick={loadData}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 rounded-2xl transition-all text-xs font-bold text-gray-700 disabled:opacity-50 shadow-sm"
                  title={lang === 'fr' ? "Actualiser l'agenda" : "Refresh calendar"}
                >
                  <RefreshCw size={14} className={isSyncing ? "animate-spin text-primary" : ""} />
                  <span>{lang === 'fr' ? "Actualiser" : "Refresh"}</span>
                </button>

                <button
                  onClick={() => setIsAddEventOpen(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
                >
                  <Plus size={16} /> {lang === 'fr' ? "Nouveau RDV" : lang === 'es' ? "Nueva Cita" : "New Appointment"}
                </button>
              </div>
            </div>

            {/* VIEW 1: MONTH/DAY GRID */}
            {calendarViewMode === 'grid' && (
              <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
                
                {/* Month Navigator Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
                  <div className="flex items-center gap-4">
                    <h4 className="text-xl font-bold font-serif text-gray-800 capitalize">
                      {currentCalendarDate.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    
                    <div className="flex items-center gap-1 bg-[#f4f4ec] p-1 rounded-xl">
                      <button
                        onClick={() => {
                          const prev = new Date(currentCalendarDate);
                          prev.setMonth(prev.getMonth() - 1);
                          setCurrentCalendarDate(prev);
                        }}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-all"
                        title={lang === 'fr' ? "Mois précédent" : "Previous month"}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      
                      <button
                        onClick={() => setCurrentCalendarDate(new Date())}
                        className="px-2.5 py-1 text-xs font-bold text-gray-700 hover:bg-white rounded-lg transition-all"
                      >
                        {lang === 'fr' ? "Aujourd'hui" : lang === 'es' ? "Hoy" : "Today"}
                      </button>

                      <button
                        onClick={() => {
                          const next = new Date(currentCalendarDate);
                          next.setMonth(next.getMonth() + 1);
                          setCurrentCalendarDate(next);
                        }}
                        className="p-1.5 hover:bg-white rounded-lg text-gray-700 transition-all"
                        title={lang === 'fr' ? "Mois suivant" : "Next month"}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>{lang === 'fr' ? "Cliquez sur un jour pour ajouter un RDV, ou sur un créneau pour le modifier" : "Click on a day to add, or an event to edit"}</span>
                  </div>
                </div>

                {/* Monthly Calendar Grid Layout */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[700px]">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
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

                      const todayStr = (() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = String(now.getMonth() + 1).padStart(2, '0');
                        const d = String(now.getDate()).padStart(2, '0');
                        return `${y}-${m}-${d}`;
                      })();

                      return (
                        <div className="grid grid-cols-7 gap-2">
                          {allDays.map((cell, idx) => {
                            // Find events for this day
                            const dayEvents = events.filter(ev => {
                              try {
                                const evDate = new Date(ev.start);
                                const y = evDate.getFullYear();
                                const m = String(evDate.getMonth() + 1).padStart(2, '0');
                                const d = String(evDate.getDate()).padStart(2, '0');
                                return `${y}-${m}-${d}` === cell.dateString;
                              } catch (e) {
                                return false;
                              }
                            });

                            const isToday = cell.dateString === todayStr;

                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  setNewEvent(prev => ({
                                    ...prev,
                                    date: cell.dateString
                                  }));
                                  setIsAddEventOpen(true);
                                }}
                                className={`min-h-[115px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group/cell ${
                                  cell.currentMonth 
                                    ? isToday 
                                      ? 'bg-primary/5 border-primary/40 shadow-sm' 
                                      : 'bg-[#fafafa] border-black/5 hover:border-primary/30 hover:bg-white' 
                                    : 'bg-black/[0.02] border-transparent opacity-40 hover:opacity-80'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className={`text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center ${
                                    isToday 
                                      ? 'bg-primary text-white shadow-sm' 
                                      : 'text-gray-700'
                                  }`}>
                                    {cell.day}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {dayEvents.length > 0 && (
                                      <span className="text-[10px] font-bold text-gray-400">
                                        {dayEvents.length} {dayEvents.length === 1 ? 'rdv' : 'rdvs'}
                                      </span>
                                    )}
                                    <span className="opacity-0 group-hover/cell:opacity-100 text-primary p-0.5 rounded transition-opacity" title="Ajouter un RDV">
                                      <Plus size={12} />
                                    </span>
                                  </div>
                                </div>

                                {/* Events snippets in cell */}
                                <div className="mt-1 space-y-1 overflow-hidden">
                                  {dayEvents.slice(0, 3).map((ev, evIdx) => {
                                    const timeStr = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                                    return (
                                      <div
                                        key={evIdx}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditEventModal(ev);
                                        }}
                                        className="px-2 py-1 rounded-lg text-[10px] font-bold truncate leading-tight flex items-center justify-between bg-emerald-100/90 hover:bg-emerald-200 text-emerald-900 border border-emerald-300/80 transition-colors shadow-2xs"
                                        title={`${timeStr} - ${ev.summary} (Cliquer pour modifier)`}
                                      >
                                        <span className="truncate">{timeStr} {ev.summary}</span>
                                        <Pencil size={10} className="shrink-0 opacity-60 hover:opacity-100 ml-1" />
                                      </div>
                                    );
                                  })}
                                  {dayEvents.length > 3 && (
                                    <p className="text-[9px] font-bold text-gray-500 pl-1">
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
              </div>
            )}

            {/* VIEW 2: APPOINTMENT LIST & CABINET HOURS */}
            {calendarViewMode === 'list' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left col: Appointment list */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm lg:col-span-2 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                      <CalendarIcon size={14} /> {lang === 'fr' ? "Prochains rendez-vous cliniques" : "Upcoming Clinical Appointments"}
                    </h4>
                    <span className="text-[11px] font-bold text-gray-400">{events.length} rdv(s)</span>
                  </div>

                  <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-1">
                    {events.map(event => (
                      <div 
                        key={event.id} 
                        onClick={() => openEditEventModal(event)}
                        className="p-4 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50/80 border border-emerald-100/90 flex items-start justify-between group cursor-pointer transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                            <CalendarIcon size={18} />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-gray-800 leading-tight">
                              {event.summary} 
                            </h5>
                            <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                              <Clock size={12} /> {new Date(event.start).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { weekday: 'long', day: 'numeric', month: 'short' })} • {new Date(event.start).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end).toLocaleTimeString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            {event.description && <p className="text-[10px] text-gray-400 mt-2 italic leading-relaxed">{event.description}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGoToNotes(event);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-xs"
                            title={lang === 'fr' ? "Prendre des notes / Ouvrir la fiche patient" : "Take notes / Open patient file"}
                          >
                            <FileCheck size={13} />
                            <span>{lang === 'fr' ? "Prise de notes" : "Notes"}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditEventModal(event);
                            }}
                            className="p-1.5 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-all"
                            title={lang === 'fr' ? "Modifier" : "Edit"}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                            className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                            title={lang === 'fr' ? "Supprimer ce rendez-vous" : "Delete this appointment"}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {events.length === 0 && (
                      <div className="text-center py-12">
                        <p className="text-xs text-gray-400">
                          {lang === 'fr' ? "Aucun rendez-vous enregistré pour le moment." : "No appointments scheduled at the moment."}
                        </p>
                        <button
                          onClick={() => setIsAddEventOpen(true)}
                          className="mt-3 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
                        >
                          {lang === 'fr' ? "Ajouter un premier rendez-vous" : "Add first appointment"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right col: Cabinet Details Card */}
                <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-sm font-serif font-bold text-primary mb-1">
                      {lang === 'fr' ? "Horaires de consultations" : lang === 'es' ? "Horarios de consulta" : "Consultation hours"}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {lang === 'fr' ? "Vos créneaux d'activité générale définis." : lang === 'es' ? "Sus franjas horarias de actividad general definidas." : "Your defined general active time slots."}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {[
                      { day: lang === 'fr' ? 'Lundi - Vendredi' : lang === 'es' ? 'Lunes - Viernes' : 'Monday - Friday', hours: '09:00 - 13:00, 16:00 - 20:00' },
                      { day: lang === 'fr' ? 'Samedi' : lang === 'es' ? 'Sábado' : 'Saturday', hours: '09:00 - 13:00' },
                      { day: lang === 'fr' ? 'Dimanche' : lang === 'es' ? 'Domingo' : 'Sunday', hours: lang === 'fr' ? 'Fermé' : lang === 'es' ? 'Cerrado' : 'Closed' },
                    ].map((sched, i) => (
                      <div key={i} className="flex justify-between items-center text-xs py-1">
                        <span className="font-bold text-gray-600">{sched.day}</span>
                        <span className="text-gray-500">{sched.hours}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* TAB 4: BILLING & FINANCIALS */}
        {activeTab === 'billing' && (
          <div className="space-y-8 flex-1">
            {/* Header Block */}
            <div className="bg-white p-6 rounded-3xl border border-black/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold font-serif text-primary">
                  {lang === 'fr' ? 'Facturation & Honoraires' : lang === 'es' ? 'Facturación y Honorarios' : 'Billing & Fees'}
                </h3>
                <p className="text-xs text-gray-500">
                </p>
              </div>

              <button
                onClick={() => setIsAddInvoiceOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10"
              >
                <Plus size={16} /> {lang === 'fr' ? "Émettre une Facture" : lang === 'es' ? "Emitir una Factura" : "Issue an Invoice"}
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
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        {lang === 'fr' ? "Chiffre d'Affaires Global" : lang === 'es' ? "Facturación Global" : "Total Revenue"}
                      </p>
                      <h4 className="text-3xl font-serif font-bold text-primary">{invoices.reduce((sum, item) => sum + item.amount, 0)} €</h4>
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
                    {lang === 'fr' ? 'Récapitulatif Comptable' : lang === 'es' ? 'Resumen Contable' : 'Accounting Recap'}
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
                      {lang === 'fr' ? 'Mensuel' : lang === 'es' ? 'Mensual' : 'Monthly'}
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
                      {lang === 'fr' ? 'Annuel' : lang === 'es' ? 'Anual' : 'Annual'}
                    </button>
                  </div>

                  {/* Selectors */}
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>

                  {/* Filtered statistics */}
                  {(() => {
                    const filtered = invoices.filter(inv => {
                      try {
                        const d = new Date(inv.date);
                        if (recapPeriodType === 'annual') {
                          return d.getFullYear() === recapYear;
                        } else {
                          return d.getFullYear() === recapYear && d.getMonth() === recapMonth;
                        }
                      } catch {
                        return false;
                      }
                    });

                    const totalAmt = filtered.reduce((sum, item) => sum + item.amount, 0);
                    const count = filtered.length;
                    const cardTotal = filtered.filter(i => i.paymentMethod === 'card').reduce((sum, item) => sum + item.amount, 0);
                    const cashTotal = filtered.filter(i => i.paymentMethod === 'cash').reduce((sum, item) => sum + item.amount, 0);
                    const transferTotal = filtered.filter(i => i.paymentMethod === 'transfer').reduce((sum, item) => sum + item.amount, 0);

                    return (
                      <div className="space-y-4 pt-3 border-t border-black/5">
                        <div className="flex justify-between items-end">
                          <div className="text-left">
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                              {lang === 'fr' ? "Recettes de la période" : lang === 'es' ? "Ingresos del período" : "Revenue for period"}
                            </p>
                            <h4 className="text-2xl font-serif font-bold text-primary">{totalAmt} €</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-gray-400 uppercase tracking-wider">
                              {lang === 'fr' ? "Consultations" : lang === 'es' ? "Consultas" : "Consultations"}
                            </p>
                            <p className="text-sm font-bold text-gray-700">{count}</p>
                          </div>
                        </div>

                        {/* Payment Breakdown */}
                        <div className="bg-[#f4f4ec]/40 p-3 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>{lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card'} :</span>
                            <span className="font-bold">{cardTotal} €</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>{lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash'} :</span>
                            <span className="font-bold">{cashTotal} €</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>{lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer'} :</span>
                            <span className="font-bold">{transferTotal} €</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRecapForPrint({
                              periodType: recapPeriodType,
                              year: recapYear,
                              month: recapMonth,
                              invoices: filtered,
                              total: totalAmt,
                              breakdown: { card: cardTotal, cash: cashTotal, transfer: transferTotal },
                              count
                            });
                          }}
                          disabled={count === 0}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                        >
                          <Printer size={14} />
                          <span>{lang === 'fr' ? 'Imprimer le récapitulatif' : lang === 'es' ? 'Imprimir resumen' : 'Print summary'}</span>
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-4 flex items-center gap-2">
                  <FileText size={14} /> {lang === 'fr' ? "Journal des factures émises" : lang === 'es' ? "Diario de facturas emitidas" : "Log of issued invoices"}
                </h4>

                <table className="w-full text-xs text-left border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-black/5 text-gray-400">
                      <th className="py-3 font-semibold">{lang === 'fr' ? 'Numéro' : lang === 'es' ? 'Número' : 'Number'}</th>
                      <th className="py-3 font-semibold">{lang === 'fr' ? 'Patient' : lang === 'es' ? 'Paciente' : 'Patient'}</th>
                      <th className="py-3 font-semibold">{lang === 'fr' ? 'Date' : lang === 'es' ? 'Fecha' : 'Date'}</th>
                      <th className="py-3 font-semibold">{lang === 'fr' ? 'Règlement' : lang === 'es' ? 'Pago' : 'Payment'}</th>
                      <th className="py-3 font-semibold text-right">{lang === 'fr' ? 'Montant' : lang === 'es' ? 'Monto' : 'Amount'}</th>
                      <th className="py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id} className="border-b border-black/5 hover:bg-black/[0.01] transition-colors group">
                        <td className="py-4 font-bold text-primary">{inv.invoiceNumber}</td>
                        <td className="py-4 font-bold">{inv.clientName}</td>
                        <td className="py-4 text-gray-500">{new Date(inv.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}</td>
                        <td className="py-4">
                          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            inv.paymentMethod === 'card' ? 'bg-indigo-50 text-indigo-700' :
                            inv.paymentMethod === 'cash' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {inv.paymentMethod === 'card' ? (lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card') :
                             inv.paymentMethod === 'cash' ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash') : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer')}
                          </span>
                        </td>
                        <td className="py-4 text-right font-bold text-primary">{inv.amount} €</td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingInvoice(inv);
                                setIsEditInvoiceOpen(true);
                              }}
                              className="p-1.5 hover:bg-black/5 text-gray-500 hover:text-primary rounded-lg transition-all inline-flex items-center"
                              title={lang === 'fr' ? "Modifier la facture" : lang === 'es' ? "Editar factura" : "Edit invoice"}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setSelectedInvoiceForPrint(inv)}
                              className="p-1.5 hover:bg-primary/10 text-primary rounded-lg transition-colors inline-flex items-center gap-1.5"
                              title={lang === 'fr' ? "Imprimer" : lang === 'es' ? "Imprimir" : "Print"}
                            >
                              <Printer size={13} />
                              <span className="text-[10px] uppercase font-bold tracking-wider">
                                {lang === 'fr' ? "Reçu" : lang === 'es' ? "Recibo" : "Receipt"}
                              </span>
                            </button>
                            <button
                              onClick={async () => {
                                console.log("Delete attempt for invoice:", inv.id);
                                const confirmed = window.confirm(lang === 'fr' ? "Êtes-vous sûr de vouloir supprimer cette facture ?" : "Are you sure you want to delete this invoice?");
                                console.log("Confirmed:", confirmed);
                                if (confirmed) {
                                  try {
                                    await api.deleteInvoice(inv.id);
                                    console.log("Invoice deletion successful");
                                    setInvoices(prev => prev.filter(i => i.id !== inv.id));
                                  } catch (err) {
                                    console.error("Invoice deletion failed:", err);
                                  }
                                }
                              }}
                              className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-500 rounded-lg transition-all inline-flex items-center"
                              title={lang === 'fr' ? "Supprimer" : lang === 'es' ? "Eliminar" : "Delete"}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-gray-400">
                          {lang === 'fr' ? "Aucune facture émise pour le moment." : lang === 'es' ? "Ninguna factura emitida por el momento." : "No invoices issued yet."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          MODALS & OVERLAYS
          ========================================== */}
      
      {/* MODAL: ADD CLIENT */}
      <AnimatePresence>
        {isAddClientOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddClientOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-black/5"
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
                      onChange={(e) => setNewClient(prev => ({ ...prev, lastName: e.target.value }))}
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
                      onChange={(e) => setNewClient(prev => ({ ...prev, firstName: e.target.value }))}
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddClientOpen(false)}
                    className="flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md"
                  >
                    {lang === 'fr' ? 'Créer la fiche' : lang === 'es' ? 'Crear ficha' : 'Create profile'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: BLOCK / PLAN EVENT (GOOGLE CALENDAR) */}
      <AnimatePresence>
        {isAddEventOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddEventOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-black/5"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-primary">
                    {lang === 'fr' ? 'Nouveau Rendez-vous' : lang === 'es' ? 'Nueva Cita' : 'New Appointment'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'fr' ? 'Enregistrement sur votre agenda' : 'Saved to your calendar'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <CalendarIcon size={16} />
                </div>
              </div>
              
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                      {lang === 'fr' ? 'Patient associé' : 'Associated Patient'}
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsInlineNewPatient(!isInlineNewPatient)}
                      className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                    >
                      <UserPlus size={13} />
                      <span>
                        {isInlineNewPatient
                          ? (lang === 'fr' ? 'Choisir patient existant' : 'Select existing patient')
                          : (lang === 'fr' ? '+ Nouveau patient' : '+ New patient')}
                      </span>
                    </button>
                  </div>

                  {isInlineNewPatient ? (
                    <div className="p-3 bg-primary/5 rounded-2xl border border-primary/20 space-y-2.5">
                      <p className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                        <UserPlus size={13} />
                        <span>{lang === 'fr' ? 'Nouveau patient (création automatique)' : 'New patient (auto-created)'}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder={lang === 'fr' ? 'Nom *' : 'Last Name *'}
                          value={inlinePatient.lastName}
                          onChange={(e) => setInlinePatient(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="text"
                          required
                          placeholder={lang === 'fr' ? 'Prénom *' : 'First Name *'}
                          value={inlinePatient.firstName}
                          onChange={(e) => setInlinePatient(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="tel"
                          placeholder={lang === 'fr' ? 'Téléphone' : 'Phone'}
                          value={inlinePatient.phone}
                          onChange={(e) => setInlinePatient(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="email"
                          placeholder={lang === 'fr' ? 'Email' : 'Email'}
                          value={inlinePatient.email}
                          onChange={(e) => setInlinePatient(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full p-2 bg-white rounded-xl border border-black/10 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  ) : (
                    <select
                      value={newEvent.clientId}
                      onChange={(e) => {
                        const selectedId = e.target.value;
                        setNewEvent(prev => ({
                          ...prev,
                          clientId: selectedId,
                          title: prev.title || getDefaultAppointmentTitle(lang)
                        }));
                      }}
                      className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    >
                      <option value="">-- Aucun ou patient non répertorié --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone || c.email})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Intitulé de la consultation' : 'Appointment Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={getDefaultAppointmentTitle(lang)}
                    value={newEvent.title}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date' : 'Date'} *
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
                        {lang === 'fr' ? 'Début' : 'Start'} *
                      </label>
                      <input
                        type="time"
                        required
                        value={newEvent.startTime}
                        onChange={(e) => {
                          const startTime = e.target.value;
                          const [hours, minutes] = startTime.split(':').map(Number);
                          const date = new Date();
                          date.setHours(hours);
                          date.setMinutes(minutes + 55);
                          const endTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                          setNewEvent(prev => ({ ...prev, startTime, endTime }));
                        }}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Fin' : 'End'} *
                      </label>
                      <input
                        type="time"
                        required
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Note / Motif de consultation' : 'Notes / Reason'}
                  </label>
                  <textarea
                    value={newEvent.description}
                    placeholder={lang === 'fr' ? 'Motif, antécédents, remarques...' : 'Reason, notes...'}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full p-3 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddEventOpen(false)}
                    className="flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    {lang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary hover:bg-primary/95 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5"
                  >
                    <CalendarIcon size={14} />
                    <span>{lang === 'fr' ? 'Créer le rendez-vous' : 'Create appointment'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDIT EVENT */}
      <AnimatePresence>
        {isEditEventOpen && editingEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditEventOpen(false);
                setEditingEvent(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-black/5"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-serif font-bold text-primary">
                    {lang === 'fr' ? 'Modifier le Rendez-vous' : lang === 'es' ? 'Modificar Cita' : 'Edit Appointment'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {lang === 'fr' ? 'Mise à jour dans votre agenda' : 'Update in your calendar'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                  title={lang === 'fr' ? 'Supprimer ce rendez-vous' : 'Delete appointment'}
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {/* Direct Link to Clinical Notes */}
              <div className="mb-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <FileCheck size={15} className="text-emerald-700" />
                    {lang === 'fr' ? 'Dossier Patient & Prise de notes' : 'Patient File & Clinical Notes'}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-0.5">
                    {lang === 'fr' ? 'Ouvrir la fiche clinique pour ce rendez-vous' : 'Open clinical file for this appointment'}
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
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 flex items-center gap-1"
                >
                  <span>{lang === 'fr' ? 'Prendre des notes' : 'Take Notes'}</span>
                  <ArrowRight size={13} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateEvent} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Intitulé de la consultation' : 'Appointment Title'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingEvent.summary}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, summary: e.target.value } : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                      {lang === 'fr' ? 'Date' : 'Date'} *
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
                        {lang === 'fr' ? 'Début' : 'Start'} *
                      </label>
                      <input
                        type="time"
                        required
                        value={editingEvent.startTime}
                        onChange={(e) => setEditingEvent(prev => prev ? { ...prev, startTime: e.target.value } : null)}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                        {lang === 'fr' ? 'Fin' : 'End'} *
                      </label>
                      <input
                        type="time"
                        required
                        value={editingEvent.endTime}
                        onChange={(e) => setEditingEvent(prev => prev ? { ...prev, endTime: e.target.value } : null)}
                        className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Note / Motif de consultation' : 'Notes / Reason'}
                  </label>
                  <textarea
                    value={editingEvent.description}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                    className="w-full p-3 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditEventOpen(false);
                      setEditingEvent(null);
                    }}
                    className="flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    {lang === 'fr' ? 'Fermer' : 'Close'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md"
                  >
                    {lang === 'fr' ? 'Enregistrer' : 'Save'}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-black/5"
            >
              <h3 className="text-xl font-serif font-bold text-primary mb-6">
                {lang === 'fr' ? 'Nouvelle Facture' : lang === 'es' ? 'Nueva Factura' : 'New Invoice'}
              </h3>
              
              <form onSubmit={handleAddInvoice} className="space-y-4">
                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Patient destinataire' : lang === 'es' ? 'Paciente destinatario' : 'Recipient Patient'}
                  </label>
                  <select
                    required
                    value={newInvoice.clientId}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, clientId: e.target.value }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  >
                    <option value="">-- {lang === 'fr' ? 'Sélectionnez un patient' : lang === 'es' ? 'Seleccione un paciente' : 'Select a patient'} --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Montant (€)' : lang === 'es' ? 'Monto (€)' : 'Amount (€)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

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

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Langue du reçu' : lang === 'es' ? 'Idioma del recibo' : 'Receipt language'}
                  </label>
                  <select
                    value={newInvoice.language}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, language: e.target.value as 'fr' | 'en' | 'es' }))}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="en">English (EN)</option>
                    <option value="es">Español (ES)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddInvoiceOpen(false)}
                    className="flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md"
                  >
                    {lang === 'fr' ? 'Générer la facture' : lang === 'es' ? 'Generar factura' : 'Generate invoice'}
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditClientOpen(false);
                setEditingClient(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-black/5"
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
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, lastName: e.target.value }) : null)}
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
                      onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, firstName: e.target.value }) : null)}
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

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Date de naissance' : lang === 'es' ? 'Fecha de nacimiento' : 'Date of birth'}
                  </label>
                  <input
                    type="date"
                    value={editingClient.birthDate}
                    onChange={(e) => setEditingClient(prev => prev ? ({ ...prev, birthDate: e.target.value }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
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

                <div className="flex items-center justify-between pt-4 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDeleteClient(editingClient.id)}
                    className="px-3 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5"
                    title={lang === 'fr' ? 'Supprimer ce patient' : 'Delete patient'}
                  >
                    <Trash2 size={14} />
                    <span>{lang === 'fr' ? 'Supprimer' : 'Delete'}</span>
                  </button>
                  <div className="flex gap-2 flex-1 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditClientOpen(false);
                        setEditingClient(null);
                      }}
                      className="px-4 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                    >
                      {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md"
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsEditInvoiceOpen(false);
                setEditingInvoice(null);
              }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 z-10 border border-black/5"
            >
              <h3 className="text-xl font-serif font-bold text-primary mb-6">
                {lang === 'fr' ? 'Modifier la Facture' : lang === 'es' ? 'Editar Factura' : 'Edit Invoice'}
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
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Montant (€)' : lang === 'es' ? 'Monto (€)' : 'Amount (€)'}
                  </label>
                  <input
                    type="number"
                    required
                    value={editingInvoice.amount}
                    onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, amount: Number(e.target.value) }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

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

                <div>
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block mb-1">
                    {lang === 'fr' ? 'Langue du reçu' : lang === 'es' ? 'Idioma del recibo' : 'Receipt language'}
                  </label>
                  <select
                    value={editingInvoice.language || 'fr'}
                    onChange={(e) => setEditingInvoice(prev => prev ? ({ ...prev, language: e.target.value as 'fr' | 'en' | 'es' }) : null)}
                    className="w-full p-2.5 bg-secondary rounded-xl border border-black/5 text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  >
                    <option value="fr">Français (FR)</option>
                    <option value="en">English (EN)</option>
                    <option value="es">Español (ES)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditInvoiceOpen(false);
                      setEditingInvoice(null);
                    }}
                    className="flex-1 py-3 bg-secondary text-gray-600 rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    {lang === 'fr' ? 'Annuler' : lang === 'es' ? 'Cancelar' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-primary text-white rounded-2xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md"
                  >
                    {lang === 'fr' ? 'Enregistrer' : lang === 'es' ? 'Guardar' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: PRINTABLE RECEIPT / MUTUELLE REÇU */}
      <AnimatePresence>
        {selectedInvoiceForPrint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto print:bg-white print:p-0 print:block print:static print:overflow-visible">
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-12 z-10 border border-black/5 my-8 print:m-0 print:p-0 print:max-w-none print:shadow-none print:border-none print:bg-white"
            >
              {/* Close and Print Actions */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 pb-4 border-b border-black/5 print:hidden">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary">{translations[receiptLang].invoice.receiptSubtitle}</h4>
                  
                  {/* Language Selector for Invoice Receipts */}
                  <div className="flex items-center gap-1.5 mt-2 bg-[#f4f4ec] p-1 rounded-xl border border-black/5 self-start">
                    <span className="text-[10px] font-bold text-gray-500 px-2">{translations[receiptLang].invoice.invoiceLang} :</span>
                    {(['fr', 'en', 'es'] as const).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={async () => {
                          setReceiptLang(l);
                          try {
                            const updatedInvoice = { ...selectedInvoiceForPrint, language: l };
                            await api.updateInvoice(updatedInvoice);
                            setInvoices(prev => prev.map(inv => inv.id === selectedInvoiceForPrint.id ? updatedInvoice : inv));
                            setSelectedInvoiceForPrint(updatedInvoice);
                          } catch (err) {
                            console.error('Failed to update invoice language:', err);
                          }
                        }}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg transition-all ${
                          receiptLang === l
                            ? 'bg-primary text-white shadow-sm'
                            : 'text-gray-500 hover:bg-black/5'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={isExporting}
                    onClick={async () => {
                      const filename = `FAC-${selectedInvoiceForPrint.invoiceNumber}-${selectedInvoiceForPrint.clientName.replace(/\s+/g, '_')}`;
                      await handleExportPDF('receipt-print-area', filename);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 bg-secondary text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                  >
                    {isExporting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    {isExporting ? (lang === 'fr' ? 'Export...' : 'Export...') : 'PDF'}
                  </button>
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        window.print();
                      }, 50);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow-sm active:scale-95"
                  >
                    <Printer size={14} /> {translations[receiptLang]?.invoice?.printButton || (lang === 'fr' ? 'Imprimer' : 'Print')}
                  </button>
                  <button
                    onClick={() => setSelectedInvoiceForPrint(null)}
                    className="px-4 py-2 bg-secondary text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all shadow-sm active:scale-95"
                  >
                    {translations[receiptLang]?.invoice?.closeButton || (lang === 'fr' ? 'Fermer' : 'Close')}
                  </button>
                </div>
              </div>

              {/* PRINTABLE RECEIPT CORE (Can be styled specifically for printing) */}
              <div id="receipt-print-area" className="space-y-6 text-xs font-sans print:p-0 print:space-y-4 print:text-[10pt]">
                {/* Header Section */}
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-lg font-bold font-serif text-primary">{translations[receiptLang].invoice.practitionerTitle}</h1>
                    <p className="text-gray-500 mt-1">{translations[receiptLang].invoice.practitionerSubtitle}</p>
                    <p className="text-gray-400 text-[10px] mt-2">Calle General Pastor 25, 46183 L'Eliana, Valencia</p>
                    <p className="text-gray-400 text-[10px]">Tél : +34 614 159 462</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60">{translations[receiptLang].invoice.receiptTitle}</span>
                    <h3 className="text-base font-bold text-gray-800 mt-1">{selectedInvoiceForPrint.invoiceNumber}</h3>
                    <p className="text-gray-400 mt-1">{translations[receiptLang].invoice.dateOfIssue} : {new Date(selectedInvoiceForPrint.date).toLocaleDateString(receiptLang === 'fr' ? 'fr-FR' : receiptLang === 'es' ? 'es-ES' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>

                {/* Patient / Destinataire Block */}
                <div className="bg-[#f4f4ec] p-4 print:p-3 rounded-2xl border border-black/5">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-primary/60 block mb-2">{translations[receiptLang].invoice.recipient}</span>
                  <h4 className="text-sm font-bold text-gray-800">{selectedInvoiceForPrint.clientName}</h4>
                </div>

                {/* Invoice Table Grid */}
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2 border-primary/20 text-left text-[10px] font-bold uppercase text-gray-400">
                      <th className="py-2.5">{translations[receiptLang].invoice.tableDescription}</th>
                      <th className="py-2.5 text-center">{translations[receiptLang].invoice.tableTva}</th>
                      <th className="py-2.5 text-right">{translations[receiptLang].invoice.tableUnitAmount}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-black/5 text-gray-700">
                      <td className="py-4">
                        <p className="font-bold">{selectedInvoiceForPrint.description}</p>
                      </td>
                      <td className="py-4 text-center">{translations[receiptLang].invoice.tableExempt}</td>
                      <td className="py-4 text-right font-bold">{selectedInvoiceForPrint.amount} €</td>
                    </tr>
                  </tbody>
                </table>

                {/* Total Recap */}
                <div className="flex justify-end pt-4">
                  <div className="w-64 text-right space-y-2">
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>{translations[receiptLang].invoice.totalHt}</span>
                      <span>{(selectedInvoiceForPrint.amount / 1.21).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-gray-500">
                      <span>{translations[receiptLang].invoice.tvaLabel}</span>
                      <span>{(selectedInvoiceForPrint.amount - (selectedInvoiceForPrint.amount / 1.21)).toFixed(2)} €</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t border-black/10">
                      <span>{translations[receiptLang].invoice.totalTtc}</span>
                      <span>{selectedInvoiceForPrint.amount} €</span>
                    </div>
                  </div>
                </div>

                {/* Signature or Certificate footer note */}
                <div className="pt-8 print:pt-4 flex justify-between items-end border-t border-black/5">
                  <div>
                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm">
                      {translations[receiptLang].invoice.receiptDeclaration
                        .replace('{date}', new Date(selectedInvoiceForPrint.date).toLocaleDateString(receiptLang === 'fr' ? 'fr-FR' : receiptLang === 'es' ? 'es-ES' : 'en-US'))
                        .replace('{paymentMethod}', selectedInvoiceForPrint.paymentMethod === 'card' 
                          ? translations[receiptLang].invoice.methods.card 
                          : selectedInvoiceForPrint.paymentMethod === 'cash' 
                            ? translations[receiptLang].invoice.methods.cash 
                            : translations[receiptLang].invoice.methods.transfer
                        )}
                    </p>
                  </div>
                  
                  <div className="text-center w-48 border-t border-dashed border-gray-300 pt-3">
                    <p className="font-serif italic text-primary mt-1 text-[13px]">{translations[receiptLang].invoice.signatureName}</p>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}

        {/* ACCOUNTING PERIOD RECAP PRINT MODAL */}
        {selectedRecapForPrint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn print:bg-white print:p-0 print:block print:static print:overflow-visible">
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
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl p-8 sm:p-12 z-10 border border-black/5 my-8 print:m-0 print:p-0 print:max-w-none print:shadow-none print:border-none print:bg-white"
            >
              {/* Actions Bar */}
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-black/5 print:hidden">
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? "Récapitulatif Comptable" : lang === 'es' ? "Resumen de Contabilidad" : "Accounting Summary"}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-1">
                    {selectedRecapForPrint.periodType === 'annual'
                      ? `${lang === 'fr' ? 'Année' : lang === 'es' ? 'Año' : 'Year'} ${selectedRecapForPrint.year}`
                      : `${getMonthsList(lang)[selectedRecapForPrint.month]} ${selectedRecapForPrint.year}`
                    }
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    disabled={isExporting}
                    onClick={async () => {
                      const period = selectedRecapForPrint.periodType === 'annual' 
                        ? selectedRecapForPrint.year 
                        : `${getMonthsList(lang)[selectedRecapForPrint.month]}_${selectedRecapForPrint.year}`;
                      await handleExportPDF('recap-print-area', `RECAP_${period}`);
                    }}
                    className={`flex items-center gap-2 px-4 py-2 bg-secondary text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}
                  >
                    {isExporting ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Download size={14} />
                    )}
                    {isExporting ? (lang === 'fr' ? 'Export...' : 'Export...') : 'PDF'}
                  </button>
                  <button
                    onClick={() => {
                      setTimeout(() => {
                        window.print();
                      }, 50);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-primary/95 transition-all shadow"
                  >
                    <Printer size={14} /> {lang === 'fr' ? 'Imprimer' : lang === 'es' ? 'Imprimir' : 'Print'}
                  </button>
                  <button
                    onClick={() => setSelectedRecapForPrint(null)}
                    className="px-4 py-2 bg-secondary text-gray-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-black/5 transition-all"
                  >
                    {lang === 'fr' ? 'Fermer' : lang === 'es' ? 'Cerrar' : 'Close'}
                  </button>
                </div>
              </div>

              {/* PRINTABLE AREA */}
              <div id="recap-print-area" className="space-y-6 text-xs font-sans print:p-0 text-left print:space-y-4 print:text-[10pt]">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-black/5 pb-6">
                  <div>
                    <h1 className="text-lg font-bold font-serif text-primary">Vincent Durroux</h1>
                    <p className="text-gray-500 mt-1 font-medium">Ostéopathe D.O. • Osteo Valencia</p>
                    <p className="text-gray-400 text-[10px] mt-1">Calle General Pastor 25, 46183 L'Eliana, Valencia</p>
                    <p className="text-gray-400 text-[10px]">Tél : +34 614 159 462</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60 block">
                      {lang === 'fr' ? 'Rapport Financier' : lang === 'es' ? 'Informe Financiero' : 'Financial Report'}
                    </span>
                    <p className="text-sm font-serif font-bold text-gray-800 mt-1">
                      {selectedRecapForPrint.periodType === 'annual'
                        ? `${lang === 'fr' ? 'Bilan Annuel' : lang === 'es' ? 'Balance Anual' : 'Annual Balance'} ${selectedRecapForPrint.year}`
                        : `${lang === 'fr' ? 'Bilan Mensuel' : lang === 'es' ? 'Balance Mensual' : 'Monthly Balance'} - ${getMonthsList(lang)[selectedRecapForPrint.month]} ${selectedRecapForPrint.year}`
                      }
                    </p>
                    <p className="text-[9px] text-gray-400 mt-1">
                      {lang === 'fr' ? 'Généré le' : lang === 'es' ? 'Generado el' : 'Generated on'} : {new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}
                    </p>
                  </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-[#f4f4ec] p-4 rounded-2xl border border-black/5">
                    <p className="text-[9px] uppercase font-bold text-gray-400">{lang === 'fr' ? 'Chiffre d\'Affaires' : lang === 'es' ? 'Facturación' : 'Total Revenue'}</p>
                    <p className="text-xl font-bold font-serif text-primary mt-1">{selectedRecapForPrint.total} €</p>
                  </div>
                  <div className="bg-[#f4f4ec] p-4 rounded-2xl border border-black/5">
                    <p className="text-[9px] uppercase font-bold text-gray-400">{lang === 'fr' ? 'Consultations' : lang === 'es' ? 'Consultas' : 'Consultations'}</p>
                    <p className="text-xl font-bold font-serif text-primary mt-1">{selectedRecapForPrint.count}</p>
                  </div>
                  <div className="bg-[#f4f4ec] p-4 rounded-2xl border border-black/5">
                    <p className="text-[9px] uppercase font-bold text-gray-400">{lang === 'fr' ? 'Panier Moyen' : lang === 'es' ? 'Ticket Promedio' : 'Average Ticket'}</p>
                    <p className="text-xl font-bold font-serif text-primary mt-1">
                      {selectedRecapForPrint.count > 0 ? Math.round(selectedRecapForPrint.total / selectedRecapForPrint.count) : 0} €
                    </p>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? 'Répartition par mode de règlement' : lang === 'es' ? 'Distribución por método de pago' : 'Breakdown by payment method'}
                  </h3>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="p-3 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                      <span className="text-gray-500">{lang === 'fr' ? 'Carte Bancaire' : lang === 'es' ? 'Tarjeta' : 'Credit Card'}</span>
                      <span className="font-bold text-gray-800">{selectedRecapForPrint.breakdown.card} €</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                      <span className="text-gray-500">{lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash'}</span>
                      <span className="font-bold text-gray-800">{selectedRecapForPrint.breakdown.cash} €</span>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-black/5 flex justify-between items-center">
                      <span className="text-gray-500">{lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer'}</span>
                      <span className="font-bold text-gray-800">{selectedRecapForPrint.breakdown.transfer} €</span>
                    </div>
                  </div>
                </div>

                {/* Detailed Invoices List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    {lang === 'fr' ? 'Détail des factures' : lang === 'es' ? 'Detalle de facturas' : 'Invoices detail'} ({selectedRecapForPrint.invoices.length})
                  </h3>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b-2 border-primary/20 text-left font-bold text-gray-400 uppercase text-[9px] tracking-wider">
                        <th className="py-2">{lang === 'fr' ? 'Facture' : lang === 'es' ? 'Factura' : 'Invoice'}</th>
                        <th className="py-2">{lang === 'fr' ? 'Patient' : lang === 'es' ? 'Paciente' : 'Patient'}</th>
                        <th className="py-2">{lang === 'fr' ? 'Date' : lang === 'es' ? 'Fecha' : 'Date'}</th>
                        <th className="py-2">{lang === 'fr' ? 'Règlement' : lang === 'es' ? 'Pago' : 'Payment'}</th>
                        <th className="py-2 text-right">{lang === 'fr' ? 'Montant' : lang === 'es' ? 'Monto' : 'Amount'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRecapForPrint.invoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-black/5 text-gray-700">
                          <td className="py-2 font-bold text-primary">{inv.invoiceNumber}</td>
                          <td className="py-2 font-medium">{inv.clientName}</td>
                          <td className="py-2 text-gray-500">{new Date(inv.date).toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}</td>
                          <td className="py-2">
                            <span className="text-[10px] font-medium uppercase">
                              {inv.paymentMethod === 'card' ? (lang === 'fr' ? 'Carte' : lang === 'es' ? 'Tarjeta' : 'Card') :
                               inv.paymentMethod === 'cash' ? (lang === 'fr' ? 'Espèces' : lang === 'es' ? 'Efectivo' : 'Cash') : (lang === 'fr' ? 'Virement' : lang === 'es' ? 'Transferencia' : 'Transfer')}
                            </span>
                          </td>
                          <td className="py-2 text-right font-bold">{inv.amount} €</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer validation statement */}
                <div className="pt-8 border-t border-black/5 flex justify-between items-center text-[10px] text-gray-400">
                  <p>
                    {lang === 'fr' 
                      ? "Rapport comptable officiel pour déclarations fiscales et suivi d'activité." 
                      : lang === 'es' 
                        ? "Informe contable oficial para declaraciones fiscales y seguimiento de actividad." 
                        : "Official accounting report for tax declarations and activity tracking."}
                  </p>
                  <p className="font-serif italic text-primary">{lang === 'fr' ? "Vincent Durroux - Ostéo Valencia" : "Vincent Durroux - Osteo Valencia"}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* SUPABASE DIAGNOSTICS & SYNCHRONIZATION MODAL */}
        {isSupabaseModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-black/10 max-h-[90vh] overflow-y-auto space-y-6"
            >
              <div className="flex items-start justify-between gap-4 border-b border-black/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Database size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-primary">
                      {lang === 'fr' ? 'Synchronisation Base de Données Supabase' : 'Supabase Database Sync'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {lang === 'fr' 
                        ? 'Diagnostic de vos 4 tables cloud et synchronisation des données.' 
                        : 'Diagnostics for your 4 cloud tables and data sync.'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {lang === 'fr' ? 'État des 4 Tables Supabase' : 'Supabase Tables Status'}
                  </h4>
                  <button
                    onClick={runDiagnostics}
                    disabled={isDiagnosing}
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={isDiagnosing ? 'animate-spin' : ''} />
                    <span>{lang === 'fr' ? 'Tester la connexion' : 'Test connection'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Table 1: Clients */}
                  <div className="p-3 rounded-2xl border border-black/5 bg-[#fafafa] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Users size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">clients</p>
                        <p className="text-[10px] text-gray-400">Patients & Coordonnées</p>
                      </div>
                    </div>
                    {tableDiagnostics ? (
                      tableDiagnostics.clients ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} /> Connectée
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle size={12} /> À créer
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-400">En attente de test</span>
                    )}
                  </div>

                  {/* Table 2: Client Notes */}
                  <div className="p-3 rounded-2xl border border-black/5 bg-[#fafafa] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileText size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">client_notes</p>
                        <p className="text-[10px] text-gray-400">Consultations & Anamnèses</p>
                      </div>
                    </div>
                    {tableDiagnostics ? (
                      tableDiagnostics.clientNotes ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} /> Connectée
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle size={12} /> À créer
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-400">En attente de test</span>
                    )}
                  </div>

                  {/* Table 3: Invoices */}
                  <div className="p-3 rounded-2xl border border-black/5 bg-[#fafafa] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CreditCard size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">invoices</p>
                        <p className="text-[10px] text-gray-400">Factures & Reçus</p>
                      </div>
                    </div>
                    {tableDiagnostics ? (
                      tableDiagnostics.invoices ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} /> Connectée
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle size={12} /> À créer
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-400">En attente de test</span>
                    )}
                  </div>

                  {/* Table 4: Calendar Events */}
                  <div className="p-3 rounded-2xl border border-black/5 bg-[#fafafa] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <CalendarIcon size={16} className="text-gray-500" />
                      <div>
                        <p className="text-xs font-bold text-gray-800">calendar_events</p>
                        <p className="text-[10px] text-gray-400">Rendez-vous Cabinet</p>
                      </div>
                    </div>
                    {tableDiagnostics ? (
                      tableDiagnostics.calendarEvents ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 size={12} /> Connectée
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                          <XCircle size={12} /> À créer
                        </span>
                      )
                    ) : (
                      <span className="text-[10px] text-gray-400">En attente de test</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Sync Message Alert */}
              {syncMessage && (
                <div className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                  syncMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {syncMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>{syncMessage.text}</span>
                </div>
              )}

              {/* SQL Script Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    {lang === 'fr' ? 'Script SQL complet (Création des 4 tables)' : 'Full SQL Script (All 4 Tables)'}
                  </h4>
                  <button
                    onClick={handleCopySql}
                    className="flex items-center gap-1.5 px-3 py-1 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition-all shadow-2xs"
                  >
                    {copiedSql ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copiedSql ? (lang === 'fr' ? 'Copié !' : 'Copied!') : (lang === 'fr' ? 'Copier le script SQL' : 'Copy SQL')}</span>
                  </button>
                </div>
                <p className="text-[11px] text-gray-500">
                  {lang === 'fr' 
                    ? "Si vos tables de patients ou de factures ne sont pas encore créées dans Supabase : copiez ce script, ouvrez votre tableau de bord Supabase > SQL Editor > collez et cliquez sur Run." 
                    : "If your patients or invoices tables are not created in Supabase yet: copy this script, open your Supabase dashboard > SQL Editor > paste and click Run."}
                </p>
                <div className="bg-[#1e1e1e] text-gray-200 p-3.5 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-40 border border-black/10">
                  <pre>{SUPABASE_SQL_SETUP}</pre>
                </div>
              </div>

              {/* Sync Actions */}
              <div className="pt-2 border-t border-black/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={handleSyncAllToSupabase}
                  disabled={isSyncingAll}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw size={14} className={isSyncingAll ? 'animate-spin' : ''} />
                  <span>
                    {isSyncingAll 
                      ? (lang === 'fr' ? 'Synchronisation en cours...' : 'Syncing...') 
                      : (lang === 'fr' ? 'Synchroniser les données locales vers Supabase' : 'Sync local data to Supabase')}
                  </span>
                </button>

                <button
                  onClick={() => setIsSupabaseModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all"
                >
                  {lang === 'fr' ? 'Fermer' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </AnimatePresence>

    </div>
  );
}
