import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell,
  BellOff,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  Phone,
  FileText,
  Ticket,
  Globe,
  MessageSquare,
  CalendarCheck,
  Send,
  Settings2,
  KeyRound,
  UserCheck,
} from 'lucide-react';
import { TelegramConfigResponse, TelegramPreviewResponse } from '../../types';
import { Language } from '../../translations';

interface TelegramSettingsPanelProps {
  lang: Language;
  onStatusChange?: (enabled: boolean, configured: boolean) => void;
}

interface DetectedChat {
  chatId: string;
  label: string;
  username?: string;
  type: string;
  lastMessage?: string;
}

const UI_TEXT = {
  fr: {
    title: 'Notifications',
    subtitle:
      'Recevez chaque matin le récapitulatif de vos patients du jour (uniquement lorsque des patients sont programmés).',
    activeBadge: 'Envoi matinal actif',
    pausedBadge: 'En pause',
    scheduleTitle: 'Horaire matinal & Contenu du récapitulatif',
    scheduleSubtitle: 'Silence automatique les jours sans patient programmé.',
    activeRule:
      "Règle active : la notification n'est envoyée que si au moins 1 rendez-vous patient est programmé dans la journée (les créneaux bloqués sont ignorés).",
    sendTimeLabel: "Heure d'envoi",
    timezoneLabel: 'Fuseau horaire',
    messageLangLabel: 'Langue du message',
    includedInfoLabel: 'Informations incluses par patient',
    phoneLabel: 'Téléphone',
    motifLabel: 'Motif / Remarque',
    bonoLabel: 'Statut Bono',
    saveBtn: 'Enregistrer les paramètres',
    connectedChannelTitle: 'Canal de réception connecté',
    activeRecipient: 'Destinataire actif',
    configureRecipientBelow: 'Configurez votre destinataire ci-dessous',
    hideBtn: 'Masquer',
    editConnectionBtn: 'Modifier la connexion',
    botTokenLabel: 'Token du Bot',
    savedBadge: '✓ Enregistré',
    recipientIdLabel: 'Identifiant Destinataire (Chat ID)',
    detectBtn: 'Détecter automatiquement',
    lastStatusLabel: 'Dernier état',
    statusSent: (count: number) => `✓ Envoyé (${count} patient${count > 1 ? 's' : ''})`,
    statusSkipped: 'Ignoré (0 patient ce jour-là)',
    statusError: (err: string) => `Erreur : ${err}`,
    statusReady: 'Prêt pour le prochain envoi',
    lastSentLabel: 'Dernier envoi',
    cronLabel: 'URL Webhook Cron (pour réveil matinal externe type cron-job.org) :',
    copiedBtn: 'Copié',
    copyBtn: 'Copier',
    previewTitle: "Aperçu de la notification d'aujourd'hui",
    patientCount: (count: number) => `${count} patient${count > 1 ? 's' : ''}`,
    noPatientsTitle: "Aucun patient programmé aujourd'hui",
    noPatientsDesc: (dateStr: string) =>
      `Pour le ${dateStr || 'jour'}, aucune notification matinale ne sera envoyée.`,
    sendDigestBtn: "Envoyer le récapitulatif d'aujourd'hui",
    sendTestBtn: 'Envoyer une notification test',
    errServer: 'Impossible de contacter le serveur de notifications.',
    savedFeedback: 'Paramètres de notifications sauvegardés et synchronisés.',
    errSave: 'Erreur lors de la sauvegarde.',
    errDetect: 'Erreur lors de la détection.',
    detectedFeedback: (label: string, id: string) => `Destinataire détecté : ${label} (${id}).`,
    errSend: "Échec de l'envoi de la notification.",
    skippedNoPatientsFeedback:
      "Aucun patient programmé aujourd'hui — aucun récapitulatif n'a été envoyé.",
    sentSuccessFeedback: 'Notification envoyée avec succès !',
  },
  es: {
    title: 'Notificaciones',
    subtitle:
      'Reciba cada mañana el resumen de sus pacientes del día (solo los días con citas programadas).',
    activeBadge: 'Envío matinal activo',
    pausedBadge: 'En pausa',
    scheduleTitle: 'Horario matinal y Contenido del resumen',
    scheduleSubtitle: 'Silencio automático los días sin pacientes programados.',
    activeRule:
      'Regla activa: la notificación solo se envía si hay al menos 1 cita de paciente programada en el día (los horarios bloqueados se ignoran).',
    sendTimeLabel: 'Hora de envío',
    timezoneLabel: 'Zona horaria',
    messageLangLabel: 'Idioma del mensaje',
    includedInfoLabel: 'Información incluida por paciente',
    phoneLabel: 'Teléfono',
    motifLabel: 'Motivo / Nota',
    bonoLabel: 'Estado Bono',
    saveBtn: 'Guardar configuración',
    connectedChannelTitle: 'Canal de recepción conectado',
    activeRecipient: 'Destinatario activo',
    configureRecipientBelow: 'Configure su destinatario a continuación',
    hideBtn: 'Ocultar',
    editConnectionBtn: 'Editar conexión',
    botTokenLabel: 'Token del Bot',
    savedBadge: '✓ Guardado',
    recipientIdLabel: 'ID del Destinatario (Chat ID)',
    detectBtn: 'Detectar automáticamente',
    lastStatusLabel: 'Último estado',
    statusSent: (count: number) => `✓ Enviado (${count} paciente${count > 1 ? 's' : ''})`,
    statusSkipped: 'Omitido (0 pacientes ese día)',
    statusError: (err: string) => `Error: ${err}`,
    statusReady: 'Listo para el próximo envío',
    lastSentLabel: 'Último envío',
    cronLabel: 'URL Webhook Cron (para activación matinal externa tipo cron-job.org):',
    copiedBtn: 'Copiado',
    copyBtn: 'Copiar',
    previewTitle: 'Vista previa de la notificación de hoy',
    patientCount: (count: number) => `${count} paciente${count > 1 ? 's' : ''}`,
    noPatientsTitle: 'No hay pacientes programados hoy',
    noPatientsDesc: (dateStr: string) =>
      `Para el ${dateStr || 'día de hoy'}, no se enviará ninguna notificación matinal.`,
    sendDigestBtn: 'Enviar el resumen de hoy',
    sendTestBtn: 'Enviar notificación de prueba',
    errServer: 'No se pudo conectar con el servidor de notificaciones.',
    savedFeedback: 'Configuración de notificaciones guardada y sincronizada.',
    errSave: 'Error al guardar la configuración.',
    errDetect: 'Error durante la detección.',
    detectedFeedback: (label: string, id: string) => `Destinatario detectado: ${label} (${id}).`,
    errSend: 'Error al enviar la notificación.',
    skippedNoPatientsFeedback:
      'No hay pacientes programados hoy — no se envió ningún resumen.',
    sentSuccessFeedback: '¡Notificación enviada con éxito!',
  },
  en: {
    title: 'Notifications',
    subtitle:
      'Receive a daily morning summary of your scheduled patients (only on days with appointments).',
    activeBadge: 'Morning digest active',
    pausedBadge: 'Paused',
    scheduleTitle: 'Morning Schedule & Summary Content',
    scheduleSubtitle: 'Automatic silence on days with no scheduled patients.',
    activeRule:
      'Active rule: the notification is only sent if at least 1 patient appointment is scheduled for the day (blocked slots are ignored).',
    sendTimeLabel: 'Send time',
    timezoneLabel: 'Timezone',
    messageLangLabel: 'Message language',
    includedInfoLabel: 'Information included per patient',
    phoneLabel: 'Phone number',
    motifLabel: 'Reason / Note',
    bonoLabel: 'Bono status',
    saveBtn: 'Save settings',
    connectedChannelTitle: 'Connected Receiving Channel',
    activeRecipient: 'Active recipient',
    configureRecipientBelow: 'Configure your recipient below',
    hideBtn: 'Hide',
    editConnectionBtn: 'Edit connection',
    botTokenLabel: 'Bot Token',
    savedBadge: '✓ Saved',
    recipientIdLabel: 'Recipient ID (Chat ID)',
    detectBtn: 'Auto-detect',
    lastStatusLabel: 'Last status',
    statusSent: (count: number) => `✓ Sent (${count} patient${count > 1 ? 's' : ''})`,
    statusSkipped: 'Skipped (0 patients that day)',
    statusError: (err: string) => `Error: ${err}`,
    statusReady: 'Ready for next scheduled send',
    lastSentLabel: 'Last sent',
    cronLabel: 'Cron Webhook URL (for external morning trigger like cron-job.org):',
    copiedBtn: 'Copied',
    copyBtn: 'Copy',
    previewTitle: "Today's Notification Preview",
    patientCount: (count: number) => `${count} patient${count > 1 ? 's' : ''}`,
    noPatientsTitle: 'No patients scheduled today',
    noPatientsDesc: (dateStr: string) =>
      `For ${dateStr || 'today'}, no morning notification will be sent.`,
    sendDigestBtn: "Send today's summary",
    sendTestBtn: 'Send test notification',
    errServer: 'Unable to reach the notifications server.',
    savedFeedback: 'Notification settings saved and synced.',
    errSave: 'Error saving settings.',
    errDetect: 'Error detecting recipient.',
    detectedFeedback: (label: string, id: string) => `Recipient detected: ${label} (${id}).`,
    errSend: 'Failed to send notification.',
    skippedNoPatientsFeedback: 'No patients scheduled today — no summary was sent.',
    sentSuccessFeedback: 'Notification sent successfully!',
  },
};

export default function TelegramSettingsPanel({ lang, onStatusChange }: TelegramSettingsPanelProps) {
  const txt = UI_TEXT[lang] || UI_TEXT.fr;

  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const langRef = useRef(lang);
  useEffect(() => {
    langRef.current = lang;
  }, [lang]);

  const [config, setConfig] = useState<TelegramConfigResponse | null>(null);
  const [preview, setPreview] = useState<TelegramPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingDigest, setIsTestingDigest] = useState(false);
  const [showConnectionFields, setShowConnectionFields] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [chatIdInput, setChatIdInput] = useState('');
  const [chatLabelInput, setChatLabelInput] = useState('');
  const [sendTime, setSendTime] = useState('08:00');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [messageLang, setMessageLang] = useState<'fr' | 'es' | 'en'>(lang);
  const [includePhone, setIncludePhone] = useState(true);
  const [includeMotif, setIncludeMotif] = useState(true);
  const [includeBono, setIncludeBono] = useState(true);

  const [detectedChats, setDetectedChats] = useState<DetectedChat[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Keep message preview language aligned when user switches UI language in header
  useEffect(() => {
    setMessageLang(lang);
  }, [lang]);

  const fetchPreview = useCallback(
    async (opts: {
      language: 'fr' | 'es' | 'en';
      includePhone: boolean;
      includeMotif: boolean;
      includeBono: boolean;
      timezone: string;
    }) => {
      try {
        const params = new URLSearchParams({
          language: opts.language,
          includePhone: String(opts.includePhone),
          includeMotif: String(opts.includeMotif),
          includeBono: String(opts.includeBono),
          timezone: opts.timezone,
        });
        const res = await fetch(`/api/telegram/preview?${params.toString()}`);
        if (res.ok) {
          const data: TelegramPreviewResponse = await res.json();
          setPreview(data);
        }
      } catch (err) {
        console.warn('Failed to fetch notification preview:', err);
      }
    },
    []
  );

  const loadConfig = useCallback(
    async (silent = false) => {
      try {
        if (!silent) setIsLoading(true);
        const res = await fetch('/api/telegram/config');
        if (!res.ok) throw new Error('API unavailable');
        const data: TelegramConfigResponse = await res.json();
        setConfig(data);
        setEnabled(data.enabled);
        setBotTokenInput(data.hasBotToken ? data.botTokenMasked : '');
        setChatIdInput(data.chatId || '');
        setChatLabelInput(data.chatLabel || '');
        setSendTime(data.sendTime || '08:00');
        setTimezone(data.timezone || 'Europe/Madrid');
        const initialLang = langRef.current || data.language || 'fr';
        setMessageLang(initialLang);
        setIncludePhone(data.includePhone);
        setIncludeMotif(data.includeMotif);
        setIncludeBono(data.includeBono);

        const alreadyConnected = Boolean(data.hasBotToken && data.chatId);
        if (!silent) {
          setShowConnectionFields(!alreadyConnected);
        }
        onStatusChangeRef.current?.(data.enabled, alreadyConnected);

        await fetchPreview({
          language: initialLang,
          includePhone: data.includePhone,
          includeMotif: data.includeMotif,
          includeBono: data.includeBono,
          timezone: data.timezone || 'Europe/Madrid',
        });
      } catch (err) {
        console.error('Failed to load Notifications config:', err);
        const currentTxt = UI_TEXT[langRef.current] || UI_TEXT.fr;
        setFeedback({
          type: 'error',
          text: currentTxt.errServer,
        });
      } finally {
        if (!silent) setIsLoading(false);
      }
    },
    [fetchPreview]
  );

  useEffect(() => {
    loadConfig(false);
  }, [loadConfig]);

  useEffect(() => {
    if (!isLoading) {
      fetchPreview({
        language: messageLang,
        includePhone,
        includeMotif,
        includeBono,
        timezone,
      });
    }
  }, [messageLang, includePhone, includeMotif, includeBono, timezone, isLoading, fetchPreview]);

  const handleSave = async (overrideEnabled?: boolean) => {
    try {
      setIsSaving(true);
      setFeedback(null);
      const nextEnabled = typeof overrideEnabled === 'boolean' ? overrideEnabled : enabled;

      const payload: Record<string, any> = {
        enabled: nextEnabled,
        chatId: chatIdInput.trim(),
        chatLabel: chatLabelInput.trim(),
        sendTime,
        timezone,
        language: messageLang,
        includePhone,
        includeMotif,
        includeBono,
      };

      if (botTokenInput.trim() === '') {
        payload.botToken = '__CLEAR__';
      } else if (!botTokenInput.includes('••••')) {
        payload.botToken = botTokenInput.trim();
      }

      const res = await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || txt.errSave);
      }

      const saved: TelegramConfigResponse = json.config;
      setConfig(saved);
      setEnabled(saved.enabled);
      setBotTokenInput(saved.hasBotToken ? saved.botTokenMasked : '');
      const connected = Boolean(saved.hasBotToken && saved.chatId);
      if (connected) {
        setShowConnectionFields(false);
      }
      onStatusChangeRef.current?.(saved.enabled, connected);

      setFeedback({
        type: 'success',
        text: txt.savedFeedback,
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || txt.errSave,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDetectChat = async () => {
    try {
      setIsDetecting(true);
      setFeedback(null);
      const res = await fetch('/api/telegram/detect-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          botToken: botTokenInput.includes('••••') ? undefined : botTokenInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || txt.errDetect);
      }

      const chats: DetectedChat[] = json.chats || [];
      setDetectedChats(chats);

      if (json.config) {
        setConfig(json.config);
        setBotTokenInput(json.config.hasBotToken ? json.config.botTokenMasked : '');
      }

      if (chats.length > 0) {
        const first = chats[0];
        setChatIdInput(first.chatId);
        setChatLabelInput(first.label);
        onStatusChangeRef.current?.(enabled, true);
        setFeedback({
          type: 'success',
          text: txt.detectedFeedback(first.label, first.chatId),
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || txt.errDetect,
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSendTest = async (mode: 'ping' | 'digest') => {
    try {
      if (mode === 'ping') setIsTestingPing(true);
      else setIsTestingDigest(true);
      setFeedback(null);

      await handleSave();

      const res = await fetch('/api/telegram/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || txt.errSend);
      }

      if (json.action === 'skipped_no_patients') {
        setFeedback({
          type: 'info',
          text: txt.skippedNoPatientsFeedback,
        });
      } else {
        setFeedback({
          type: 'success',
          text: txt.sentSuccessFeedback,
        });
      }
      await loadConfig(true);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || txt.errSend,
      });
    } finally {
      setIsTestingPing(false);
      setIsTestingDigest(false);
    }
  };

  const cronWebhookUrl =
    typeof window !== 'undefined' && config?.cronSecret
      ? `${window.location.origin}/api/telegram/cron?secret=${config.cronSecret}`
      : '';

  const handleCopyCron = () => {
    if (!cronWebhookUrl) return;
    navigator.clipboard.writeText(cronWebhookUrl);
    setCopiedCron(true);
    setTimeout(() => setCopiedCron(false), 2500);
  };

  const isConfigured = Boolean(
    (config?.hasBotToken || (botTokenInput && !botTokenInput.includes('••••'))) && chatIdInput.trim()
  );

  const localeCode = lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-GB';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-primary flex items-center gap-2.5">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bell size={20} />
            </span>
            <span>{txt.title}</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{txt.subtitle}</p>
        </div>

        {/* Master Activation Toggle Card */}
        <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-black/5 shadow-2xs shrink-0">
          <div className="flex items-center gap-2">
            {enabled ? (
              <Bell size={16} className="text-emerald-600" />
            ) : (
              <BellOff size={16} className="text-gray-400" />
            )}
            <span className="text-xs font-bold text-gray-700">
              {enabled ? txt.activeBadge : txt.pausedBadge}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => {
              const next = !enabled;
              setEnabled(next);
              handleSave(next);
            }}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              enabled ? 'bg-emerald-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : feedback.type === 'error' ? (
            <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Sparkles size={16} className="text-sky-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1">{feedback.text}</span>
        </div>
      )}

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Schedule & Connection */}
        <div className="xl:col-span-7 space-y-5">
          {/* Card 1: Schedule & Content Rules */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-primary">{txt.scheduleTitle}</h3>
                <p className="text-[11px] text-gray-500">{txt.scheduleSubtitle}</p>
              </div>
            </div>

            {/* Condition highlight */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center gap-2.5 text-xs text-emerald-900">
              <CalendarCheck size={16} className="text-emerald-700 shrink-0" />
              <span>{txt.activeRule}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  {txt.sendTimeLabel}
                </label>
                <input
                  type="time"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  {txt.timezoneLabel}
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                >
                  <option value="Europe/Madrid">Europe/Madrid (Valencia)</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1 flex items-center gap-1">
                  <Globe size={11} />
                  <span>{txt.messageLangLabel}</span>
                </label>
                <select
                  value={messageLang}
                  onChange={(e) => setMessageLang(e.target.value as 'fr' | 'es' | 'en')}
                  className="w-full px-3 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white"
                >
                  <option value="fr">Français</option>
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>

            {/* Content Checkboxes */}
            <div className="pt-2 space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {txt.includedInfoLabel}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/70 border border-black/5 cursor-pointer hover:bg-secondary transition-colors text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={includePhone}
                    onChange={(e) => setIncludePhone(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Phone size={13} className="text-primary/70 shrink-0" />
                  <span>{txt.phoneLabel}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/70 border border-black/5 cursor-pointer hover:bg-secondary transition-colors text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeMotif}
                    onChange={(e) => setIncludeMotif(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <FileText size={13} className="text-primary/70 shrink-0" />
                  <span>{txt.motifLabel}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/70 border border-black/5 cursor-pointer hover:bg-secondary transition-colors text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeBono}
                    onChange={(e) => setIncludeBono(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Ticket size={13} className="text-primary/70 shrink-0" />
                  <span>{txt.bonoLabel}</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={isSaving}
                className="px-5 py-2.5 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>{txt.saveBtn}</span>
              </button>
            </div>
          </div>

          {/* Card 2: Connected Channel Status (Collapsed by default when already configured) */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-primary">
                    {txt.connectedChannelTitle}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {config?.hasBotToken && config?.chatId
                      ? `${chatLabelInput || txt.activeRecipient} ${config.botUsername ? `• @${config.botUsername}` : ''}`
                      : txt.configureRecipientBelow}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowConnectionFields(!showConnectionFields)}
                className="flex items-center gap-1.5 text-[11px] font-bold text-gray-600 hover:text-primary bg-secondary hover:bg-black/5 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <Settings2 size={13} />
                <span>{showConnectionFields ? txt.hideBtn : txt.editConnectionBtn}</span>
              </button>
            </div>

            {showConnectionFields && (
              <div className="space-y-3.5 pt-2 border-t border-black/5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <KeyRound size={12} />
                      <span>{txt.botTokenLabel}</span>
                    </label>
                    {config?.hasBotToken && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        {txt.savedBadge}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={botTokenInput}
                    onChange={(e) => setBotTokenInput(e.target.value)}
                    placeholder="123456789:ABCdef..."
                    className="w-full px-3.5 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5 mb-1">
                    <UserCheck size={12} />
                    <span>
                      {txt.recipientIdLabel} {chatLabelInput ? `— ${chatLabelInput}` : ''}
                    </span>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={chatIdInput}
                      onChange={(e) => setChatIdInput(e.target.value)}
                      placeholder="Ex: 512345678"
                      className="flex-1 px-3.5 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleDetectChat}
                      disabled={isDetecting || (!botTokenInput.trim() && !config?.hasBotToken)}
                      className="px-4 py-2.5 bg-primary hover:bg-primary/95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RefreshCw size={13} className={isDetecting ? 'animate-spin' : ''} />
                      <span>{txt.detectBtn}</span>
                    </button>
                  </div>

                  {detectedChats.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {detectedChats.map((c) => (
                        <button
                          key={c.chatId}
                          type="button"
                          onClick={() => {
                            setChatIdInput(c.chatId);
                            setChatLabelInput(c.label);
                          }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border cursor-pointer transition-all ${
                            chatIdInput === c.chatId
                              ? 'bg-primary text-white border-primary'
                              : 'bg-secondary text-gray-700 border-black/5 hover:bg-white'
                          }`}
                        >
                          {c.label} ({c.chatId})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Execution Status & Optional Cron */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded-2xl bg-[#fbfbfa] border border-black/5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  {txt.lastStatusLabel}
                </span>
                <p className="font-bold text-gray-800 mt-0.5">
                  {config?.lastStatus === 'sent'
                    ? txt.statusSent(config.lastSentCount)
                    : config?.lastStatus === 'skipped_no_patients'
                    ? txt.statusSkipped
                    : config?.lastStatus === 'error'
                    ? txt.statusError(config.lastError || '')
                    : txt.statusReady}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#fbfbfa] border border-black/5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  {txt.lastSentLabel}
                </span>
                <p className="font-bold text-gray-800 mt-0.5">
                  {config?.lastSentAt
                    ? new Date(config.lastSentAt).toLocaleString(localeCode)
                    : '—'}
                </p>
              </div>
            </div>

            {cronWebhookUrl && showConnectionFields && (
              <div className="pt-2 border-t border-black/5 space-y-1.5">
                <p className="text-[11px] text-gray-500 leading-relaxed">{txt.cronLabel}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={cronWebhookUrl}
                    className="flex-1 px-3 py-2 bg-secondary rounded-xl border border-black/5 text-[11px] font-mono text-gray-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyCron}
                    className="px-3 py-2 bg-secondary hover:bg-black/5 text-gray-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedCron ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                    <span>{copiedCron ? txt.copiedBtn : txt.copyBtn}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Notification Preview & Test Actions */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-primary" />
                <h3 className="text-base font-serif font-bold text-primary">{txt.previewTitle}</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                {txt.patientCount(preview?.appointments.length || 0)}
              </span>
            </div>

            {/* Notification Preview Card */}
            <div className="rounded-2xl bg-[#f4f4ec] p-4 border border-black/5 min-h-[200px] flex flex-col justify-between">
              {preview && preview.appointments.length > 0 ? (
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-black/5 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {preview.messageText}
                </div>
              ) : (
                <div className="bg-white/90 rounded-2xl p-5 text-center space-y-2 my-auto border border-dashed border-gray-300">
                  <CalendarCheck size={24} className="mx-auto text-gray-400" />
                  <p className="text-xs font-bold text-gray-700">{txt.noPatientsTitle}</p>
                  <p className="text-[11px] text-gray-500">
                    {txt.noPatientsDesc(preview?.dateFormatted || '')}
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 px-1">
                <span>{preview?.dateStr}</span>
                <span>
                  {sendTime} • {timezone}
                </span>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSendTest('digest')}
                disabled={isTestingDigest || !isConfigured || (preview?.appointments.length || 0) === 0}
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary/95 disabled:opacity-45 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTestingDigest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>{txt.sendDigestBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTest('ping')}
                disabled={isTestingPing || !isConfigured}
                className="w-full py-2.5 px-4 bg-secondary hover:bg-black/5 disabled:opacity-45 text-gray-700 rounded-2xl text-xs font-bold transition-all border border-black/5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTestingPing ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} className="text-emerald-600" />
                )}
                <span>{txt.sendTestBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
