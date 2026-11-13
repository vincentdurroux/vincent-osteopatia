import React, { useState, useEffect, useCallback } from 'react';
import {
  Send,
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
  Bot,
  MessageSquare,
  Bell,
  BellOff,
  CalendarCheck,
  HelpCircle,
  KeyRound,
  UserCheck,
  ExternalLink,
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

export default function TelegramSettingsPanel({ lang, onStatusChange }: TelegramSettingsPanelProps) {
  const [config, setConfig] = useState<TelegramConfigResponse | null>(null);
  const [preview, setPreview] = useState<TelegramPreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isTestingDigest, setIsTestingDigest] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedCron, setCopiedCron] = useState(false);

  // Form states
  const [enabled, setEnabled] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState('');
  const [chatIdInput, setChatIdInput] = useState('');
  const [chatLabelInput, setChatLabelInput] = useState('');
  const [sendTime, setSendTime] = useState('08:00');
  const [timezone, setTimezone] = useState('Europe/Madrid');
  const [messageLang, setMessageLang] = useState<'fr' | 'es' | 'en'>('fr');
  const [includePhone, setIncludePhone] = useState(true);
  const [includeMotif, setIncludeMotif] = useState(true);
  const [includeBono, setIncludeBono] = useState(true);

  const [detectedChats, setDetectedChats] = useState<DetectedChat[]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchPreview = useCallback(
    async (opts?: {
      language?: 'fr' | 'es' | 'en';
      includePhone?: boolean;
      includeMotif?: boolean;
      includeBono?: boolean;
      timezone?: string;
    }) => {
      try {
        const params = new URLSearchParams({
          language: opts?.language || messageLang,
          includePhone: String(opts?.includePhone ?? includePhone),
          includeMotif: String(opts?.includeMotif ?? includeMotif),
          includeBono: String(opts?.includeBono ?? includeBono),
          timezone: opts?.timezone || timezone,
        });
        const res = await fetch(`/api/telegram/preview?${params.toString()}`);
        if (res.ok) {
          const data: TelegramPreviewResponse = await res.json();
          setPreview(data);
        }
      } catch (err) {
        console.warn('Failed to fetch Telegram preview:', err);
      }
    },
    [messageLang, includePhone, includeMotif, includeBono, timezone]
  );

  const loadConfig = useCallback(async () => {
    try {
      setIsLoading(true);
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
      setMessageLang(data.language || 'fr');
      setIncludePhone(data.includePhone);
      setIncludeMotif(data.includeMotif);
      setIncludeBono(data.includeBono);
      if (!data.hasBotToken) {
        setShowGuide(true);
      }

      onStatusChange?.(data.enabled, Boolean(data.hasBotToken && data.chatId));

      await fetchPreview({
        language: data.language,
        includePhone: data.includePhone,
        includeMotif: data.includeMotif,
        includeBono: data.includeBono,
        timezone: data.timezone,
      });
    } catch (err) {
      console.error('Failed to load Telegram config:', err);
      setFeedback({
        type: 'error',
        text:
          lang === 'fr'
            ? 'Impossible de contacter le serveur de notifications.'
            : 'No se pudo conectar con el servidor de notificaciones.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Refresh live preview whenever formatting options change
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

      // Only send botToken if modified (doesn't contain masked dots) or explicitly cleared
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
        throw new Error(json.error || 'Save failed');
      }

      const saved: TelegramConfigResponse = json.config;
      setConfig(saved);
      setEnabled(saved.enabled);
      setBotTokenInput(saved.hasBotToken ? saved.botTokenMasked : '');
      onStatusChange?.(saved.enabled, Boolean(saved.hasBotToken && saved.chatId));

      setFeedback({
        type: 'success',
        text:
          lang === 'fr'
            ? 'Paramètres Telegram sauvegardés et synchronisés.'
            : lang === 'es'
            ? 'Configuración de Telegram guardada y sincronizada.'
            : 'Telegram settings saved and synced.',
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erreur lors de la sauvegarde.',
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
        throw new Error(json.error || 'Détection impossible.');
      }

      const chats: DetectedChat[] = json.chats || [];
      setDetectedChats(chats);

      if (json.config) {
        setConfig(json.config);
        setBotTokenInput(json.config.hasBotToken ? json.config.botTokenMasked : '');
      }

      if (chats.length === 0) {
        setFeedback({
          type: 'info',
          text:
            lang === 'fr'
              ? `Bot @${json.botUsername || ''} reconnu ! Envoyez-lui "/start" sur Telegram puis cliquez à nouveau sur "Détecter mon Chat ID".`
              : `Bot @${json.botUsername || ''} conectado. Envíele "/start" en Telegram y vuelva a pulsar Detectar.`,
        });
      } else {
        const first = chats[0];
        setChatIdInput(first.chatId);
        setChatLabelInput(first.label);
        onStatusChange?.(enabled, true);
        setFeedback({
          type: 'success',
          text:
            lang === 'fr'
              ? `Chat détecté : ${first.label} (${first.chatId}). N'oubliez pas d'enregistrer !`
              : `Chat detectado: ${first.label} (${first.chatId}).`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erreur lors de la détection du Chat ID.',
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

      // Save latest settings first so the test uses current token/chatId/options
      await handleSave();

      const res = await fetch('/api/telegram/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();

      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Échec de l’envoi Telegram.');
      }

      if (json.action === 'skipped_no_patients') {
        setFeedback({
          type: 'info',
          text:
            lang === 'fr'
              ? "Aucun patient programmé aujourd'hui — aucun récapitulatif n'a été envoyé (utilisez « Tester la connexion » pour vérifier votre bot)."
              : "No hay pacientes programados hoy — no se envió resumen.",
        });
      } else {
        setFeedback({
          type: 'success',
          text:
            json.message ||
            (lang === 'fr'
              ? 'Notification envoyée sur votre Telegram !'
              : '¡Notificación enviada a su Telegram!'),
        });
      }
      await loadConfig();
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Erreur lors du test Telegram.',
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

  const isConfigured = Boolean((config?.hasBotToken || (botTokenInput && !botTokenInput.includes('••••'))) && chatIdInput.trim());

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
            <span className="w-10 h-10 rounded-2xl bg-[#229ED9]/15 text-[#229ED9] flex items-center justify-center shrink-0">
              <Send size={20} />
            </span>
            <span>
              {lang === 'fr'
                ? 'Notifications Telegram'
                : lang === 'es'
                ? 'Notificaciones Telegram'
                : 'Telegram Notifications'}
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {lang === 'fr'
              ? 'Recevez chaque matin sur Telegram le récapitulatif de vos patients du jour (uniquement les jours avec consultations).'
              : lang === 'es'
              ? 'Reciba cada mañana en Telegram el resumen de sus pacientes del día (solo los días con citas).'
              : 'Receive a daily morning Telegram digest of your scheduled patients (only on days with appointments).'}
          </p>
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
              {enabled
                ? lang === 'fr'
                  ? 'Envoi matinal actif'
                  : 'Envío matinal activo'
                : lang === 'fr'
                ? 'En pause'
                : 'En pausa'}
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
        {/* LEFT COLUMN: Configuration & Schedule */}
        <div className="xl:col-span-7 space-y-5">
          {/* Card 1: Bot Connection */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#229ED9]/10 text-[#229ED9] flex items-center justify-center">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-primary">
                    {lang === 'fr' ? '1. Connexion à votre Bot Telegram' : '1. Conexión con su Bot de Telegram'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    {config?.botUsername
                      ? `Bot connecté : @${config.botUsername}`
                      : lang === 'fr'
                      ? 'Créez un bot gratuit en 1 minute via @BotFather'
                      : 'Cree un bot gratuito en 1 minuto con @BotFather'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-1 text-[11px] font-bold text-[#229ED9] hover:bg-[#229ED9]/10 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
              >
                <HelpCircle size={14} />
                <span>{showGuide ? (lang === 'fr' ? 'Masquer le guide' : 'Ocultar guía') : (lang === 'fr' ? 'Comment faire ?' : '¿Cómo hacerlo?')}</span>
              </button>
            </div>

            {showGuide && (
              <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/80 text-xs text-sky-950 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold text-sky-900">
                    {lang === 'fr' ? 'Configuration rapide en 3 étapes :' : 'Configuración rápida en 3 pasos:'}
                  </p>
                  <a
                    href="https://t.me/BotFather"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#229ED9] hover:bg-[#1d8cc1] text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <span>{lang === 'fr' ? 'Ouvrir @BotFather dans Telegram' : 'Abrir @BotFather en Telegram'}</span>
                    <ExternalLink size={12} />
                  </a>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-[11px] leading-relaxed">
                  <li>
                    {lang === 'fr' ? (
                      <>
                        Cliquez sur le bouton bleu ci-dessus (ou cherchez <b>@BotFather</b> dans la barre de recherche Telegram avec le badge bleu officiel).
                      </>
                    ) : (
                      <>Pulse el botón azul de arriba o busque <b>@BotFather</b> en Telegram.</>
                    )}
                  </li>
                  <li>
                    {lang === 'fr' ? (
                      <>
                        Appuyez sur <b>Démarrer</b>, envoyez <code>/newbot</code>, puis choisissez un nom (ex : <i>Vincent Osteo</i>) et un identifiant finissant par <code>bot</code> (ex : <i>vincent_osteo_bot</i>).
                      </>
                    ) : (
                      <>Pulse <b>Iniciar</b>, envíe <code>/newbot</code> y elija un nombre e identificador acabado en <code>bot</code>.</>
                    )}
                  </li>
                  <li>
                    {lang === 'fr' ? (
                      <>
                        @BotFather vous répond avec un code long (<b>HTTP API Token</b>) : copiez-le et collez-le dans le champ <b>Bot Token</b> ci-dessous.
                      </>
                    ) : (
                      <>Copie el <b>HTTP API Token</b> que le envía @BotFather y péguelo abajo.</>
                    )}
                  </li>
                  <li>
                    {lang === 'fr' ? (
                      <>
                        Ouvrez ensuite la conversation avec <b>votre nouveau bot</b> (le lien <code>t.me/...</code> donné par @BotFather), appuyez sur <b>Démarrer (/start)</b>, puis cliquez ici sur <b>« Détecter mon Chat ID »</b>.
                      </>
                    ) : (
                      <>Abra su nuevo bot en Telegram, pulse <b>Iniciar (/start)</b> y vuelva aquí para pulsar <b>Detectar Chat ID</b>.</>
                    )}
                  </li>
                </ol>
                {config?.botUsername && (
                  <div className="pt-1">
                    <a
                      href={`https://t.me/${config.botUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-sky-100 text-sky-900 border border-sky-200 rounded-xl text-[11px] font-bold transition-all"
                    >
                      <span>{lang === 'fr' ? `Ouvrir mon bot @${config.botUsername}` : `Abrir mi bot @${config.botUsername}`}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3.5">
              {/* Bot Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <KeyRound size={12} />
                    <span>Bot Token (@BotFather)</span>
                  </label>
                  {config?.hasBotToken && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      ✓ {config.envBotTokenConfigured ? 'Variable serveur' : 'Enregistré'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  disabled={config?.envBotTokenConfigured}
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  className="w-full px-3.5 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all disabled:opacity-60"
                />
              </div>

              {/* Chat ID + Auto-detect */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <UserCheck size={12} />
                    <span>Chat ID {chatLabelInput ? `(${chatLabelInput})` : ''}</span>
                  </label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={chatIdInput}
                    onChange={(e) => setChatIdInput(e.target.value)}
                    disabled={config?.envChatIdConfigured}
                    placeholder="Ex: 512345678"
                    className="flex-1 px-3.5 py-2.5 bg-secondary rounded-xl border border-black/5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={handleDetectChat}
                    disabled={isDetecting || (!botTokenInput.trim() && !config?.hasBotToken)}
                    className="px-4 py-2.5 bg-[#229ED9] hover:bg-[#1d8cc1] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RefreshCw size={13} className={isDetecting ? 'animate-spin' : ''} />
                    <span>{lang === 'fr' ? 'Détecter mon Chat ID' : 'Detectar Chat ID'}</span>
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
          </div>

          {/* Card 2: Schedule & Content Rules */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock size={18} />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-primary">
                  {lang === 'fr' ? '2. Horaire matinal & Contenu du message' : '2. Horario matinal y Contenido'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  {lang === 'fr'
                    ? 'Silence automatique les jours sans patient programmé.'
                    : 'Silencio automático los días sin pacientes programados.'}
                </p>
              </div>
            </div>

            {/* Condition highlight */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 flex items-center gap-2.5 text-xs text-emerald-900">
              <CalendarCheck size={16} className="text-emerald-700 shrink-0" />
              <span>
                {lang === 'fr'
                  ? "Règle active : la notification n'est envoyée que si au moins 1 rendez-vous patient est programmé dans la journée (les créneaux bloqués sont ignorés)."
                  : 'Regla activa: solo se envía si hay al menos 1 paciente programado hoy.'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">
                  {lang === 'fr' ? "Heure d'envoi" : 'Hora de envío'}
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
                  {lang === 'fr' ? 'Fuseau horaire' : 'Zona horaria'}
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
                  <span>{lang === 'fr' ? 'Langue du message' : 'Idioma'}</span>
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
                {lang === 'fr' ? 'Informations incluses par patient' : 'Datos incluidos por paciente'}
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
                  <span>{lang === 'fr' ? 'Téléphone' : 'Teléfono'}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/70 border border-black/5 cursor-pointer hover:bg-secondary transition-colors text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeMotif}
                    onChange={(e) => setIncludeMotif(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <FileText size={13} className="text-primary/70 shrink-0" />
                  <span>{lang === 'fr' ? 'Motif / Remarque' : 'Motivo / Nota'}</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary/70 border border-black/5 cursor-pointer hover:bg-secondary transition-colors text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={includeBono}
                    onChange={(e) => setIncludeBono(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <Ticket size={13} className="text-primary/70 shrink-0" />
                  <span>{lang === 'fr' ? 'Statut Bono' : 'Estado Bono'}</span>
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
                <span>{lang === 'fr' ? 'Enregistrer les paramètres' : 'Guardar configuración'}</span>
              </button>
            </div>
          </div>

          {/* Card 3: Execution Status & Optional External Cron */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {lang === 'fr' ? 'Statut du planificateur & Webhook Cron' : 'Estado del programador y Webhook Cron'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#fbfbfa] border border-black/5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  {lang === 'fr' ? 'Dernier état' : 'Último estado'}
                </span>
                <p className="font-bold text-gray-800 mt-0.5">
                  {config?.lastStatus === 'sent'
                    ? `✓ Envoyé (${config.lastSentCount} patient${config.lastSentCount > 1 ? 's' : ''})`
                    : config?.lastStatus === 'skipped_no_patients'
                    ? 'Ignoré (0 patient ce jour-là)'
                    : config?.lastStatus === 'error'
                    ? `Erreur : ${config.lastError}`
                    : 'Aucun envoi automatique effectué'}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-[#fbfbfa] border border-black/5">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  {lang === 'fr' ? 'Dernier contrôle / envoi' : 'Última comprobación'}
                </span>
                <p className="font-bold text-gray-800 mt-0.5">
                  {config?.lastSentAt
                    ? new Date(config.lastSentAt).toLocaleString(lang === 'fr' ? 'fr-FR' : 'es-ES')
                    : '—'}
                </p>
              </div>
            </div>

            {cronWebhookUrl && (
              <div className="pt-2 border-t border-black/5 space-y-1.5">
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {lang === 'fr'
                    ? "Astuce fiabilité 24h/24 : si le serveur cloud se met en veille la nuit, vous pouvez appeler cette URL chaque matin (ex: via cron-job.org gratuit à 08:00) pour garantir le réveil :"
                    : 'Consejo de fiabilidad 24/7: si su servidor entra en reposo por la noche, puede llamar esta URL cada mañana (ej. con cron-job.org):'}
                </p>
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
                    <span>{copiedCron ? 'Copié' : 'Copier'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Telegram Message Preview & Test Actions */}
        <div className="xl:col-span-5 space-y-5">
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-black/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-[#229ED9]" />
                <h3 className="text-base font-serif font-bold text-primary">
                  {lang === 'fr' ? "Aperçu du message d'aujourd'hui" : 'Vista previa del mensaje de hoy'}
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#229ED9]/10 text-[#229ED9]">
                {preview?.appointments.length || 0}{' '}
                {lang === 'fr'
                  ? `patient${(preview?.appointments.length || 0) > 1 ? 's' : ''}`
                  : `paciente${(preview?.appointments.length || 0) > 1 ? 's' : ''}`}
              </span>
            </div>

            {/* Telegram Chat Simulation Bubble */}
            <div className="rounded-2xl bg-[#e6ebee] p-4 border border-black/5 min-h-[200px] flex flex-col justify-between">
              {preview && preview.appointments.length > 0 ? (
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-xs border border-black/5 text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {preview.messageText}
                </div>
              ) : (
                <div className="bg-white/90 rounded-2xl p-5 text-center space-y-2 my-auto border border-dashed border-gray-300">
                  <CalendarCheck size={24} className="mx-auto text-gray-400" />
                  <p className="text-xs font-bold text-gray-700">
                    {lang === 'fr'
                      ? "Aucun patient programmé aujourd'hui"
                      : 'No hay pacientes programados hoy'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {lang === 'fr'
                      ? `Pour le ${preview?.dateFormatted || "jour"}, aucune notification matinale ne sera envoyée.`
                      : 'No se enviará notificación matinal los días sin pacientes.'}
                  </p>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-gray-500 px-1">
                <span>{preview?.dateStr}</span>
                <span>{sendTime} • {timezone}</span>
              </div>
            </div>

            {/* Test Buttons */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleSendTest('digest')}
                disabled={isTestingDigest || !isConfigured || (preview?.appointments.length || 0) === 0}
                className="w-full py-2.5 px-4 bg-[#229ED9] hover:bg-[#1d8cc1] disabled:opacity-45 text-white rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTestingDigest ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>
                  {lang === 'fr'
                    ? "Envoyer le récapitulatif d'aujourd'hui sur Telegram"
                    : 'Enviar resumen de hoy a Telegram'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSendTest('ping')}
                disabled={isTestingPing || !isConfigured}
                className="w-full py-2.5 px-4 bg-secondary hover:bg-black/5 disabled:opacity-45 text-gray-700 rounded-2xl text-xs font-bold transition-all border border-black/5 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTestingPing ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} className="text-emerald-600" />}
                <span>
                  {lang === 'fr'
                    ? 'Tester la connexion (message test)'
                    : 'Probar conexión (mensaje de prueba)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
