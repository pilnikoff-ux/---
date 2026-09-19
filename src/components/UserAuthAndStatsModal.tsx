import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  X,
  Lock,
  Calendar,
  Briefcase,
  CheckCircle,
  LogOut,
  FileSpreadsheet,
  ExternalLink,
  Copy,
  Download,
  ShieldCheck,
  AlertCircle,
  Database,
  Users,
  Sparkles,
  Info,
  RefreshCw,
  Mail,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  getUserProfile,
  saveUserProfile,
  clearUserSession,
  isProfileComplete,
  isAppOwner,
  getAdminTelemetrySummary,
  saveAdminGoogleSheetsConfig,
  isAuthDismissed,
  setAuthDismissed,
  saveProfileDraft,
  getProfileDraft,
} from '../services/userStatsService';
import {
  getGoogleProfileDraft,
  getQuickGoogleDraft,
} from '../services/googleAuthService';
import { syncCloudData } from '../services/cloudSyncService';
import { UserProfile } from '../types';

interface UserAuthAndStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProfileSaved?: () => void;
  isMandatoryOnboarding?: boolean;
}

const SAMPLE_APPS_SCRIPT_CODE = `// ==========================================
// Google Apps Script для автоматичного запису даних Навігатора
// Вставте цей код у: Розширення -> Apps Script у вашій Google Таблиці
// та натисніть "Розгорнути" -> "Нове розгортання" -> "Веб-програма" (Доступ: Всі)
// ==========================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'user_registration') {
      var userSheet = sheet.getSheetByName("Користувачі") || sheet.insertSheet("Користувачі");
      if (userSheet.getLastRow() === 0) {
        userSheet.appendRow(["Дата реєстрації", "Логін", "Повне ім'я", "Email", "Дата народження", "Сфера діяльності", "Авторизація"]);
      }
      userSheet.appendRow([
        data.registeredAt || new Date().toLocaleString("uk-UA"),
        data.login || "",
        data.fullName || data.name || "",
        data.email || "",
        data.birthDate || "",
        data.fieldOfActivity || "",
        data.authProvider || "local"
      ]);
    } else if (data.type === 'user_activity') {
      var logSheet = sheet.getSheetByName("Логи активності") || sheet.insertSheet("Логи активності");
      if (logSheet.getLastRow() === 0) {
        logSheet.appendRow(["Час", "Користувач", "Email", "Розділ", "Інструмент", "Зміст запиту"]);
      }
      logSheet.appendRow([
        data.timestamp || new Date().toLocaleString("uk-UA"),
        data.userName || "",
        data.userEmail || "",
        data.tab || "",
        data.toolName || "",
        data.querySummary || ""
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export const UserAuthAndStatsModal: React.FC<UserAuthAndStatsModalProps> = ({
  isOpen,
  onClose,
  onProfileSaved,
  isMandatoryOnboarding = false,
}) => {
  const { lang } = useThemeLanguage();

  const [profile, setProfile] = useState<UserProfile | null>(getUserProfile());
  const [activeTab, setActiveTab] = useState<'profile' | 'adminGoogleSheet'>('profile');

  // Form Fields (All 4 are strictly mandatory)
  const [login, setLogin] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fieldOfActivity, setFieldOfActivity] = useState('');
  const [password, setPassword] = useState('');
  const [authProvider, setAuthProvider] = useState<'google' | 'local'>('local');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);

  // States
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleConnectedNotice, setGoogleConnectedNotice] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showGoogleInput, setShowGoogleInput] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);

  // Admin states for pilnikoff@gmail.com
  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [sheetWebhookInput, setSheetWebhookInput] = useState('');
  const [sheetViewUrlInput, setSheetViewUrlInput] = useState('');
  const [adminSaving, setAdminSaving] = useState(false);
  const [adminSavedSuccess, setAdminSavedSuccess] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Owner check (pilnikoff@gmail.com or login pilnikoff)
  const isOwner = isAppOwner(profile) || email.toLowerCase() === 'pilnikoff@gmail.com' || login.toLowerCase() === 'pilnikoff';

  useEffect(() => {
    if (isOpen) {
      const p = getUserProfile();
      const draft = getProfileDraft();
      setProfile(p);
      setErrorMessage(null);
      setGoogleConnectedNotice(null);
      setSavedSuccess(false);

      // Prioritize existing saved profile, fallback to any previously entered draft
      const effective = p || draft;
      if (effective) {
        setLogin(effective.login || '');
        setFullName(effective.fullName || (effective as any).name || '');
        setEmail(effective.email || '');
        setDateOfBirth(effective.dateOfBirth || (effective as any).birthDate || '');
        setFieldOfActivity(effective.fieldOfActivity || '');
        setAuthProvider(effective.authProvider === 'google' ? 'google' : 'local');
        setAvatarUrl(effective.avatarUrl);
        if (effective.authProvider === 'google' && effective.email) {
          setGoogleConnectedNotice(
            lang === 'ru'
              ? `✓ Google аккаунт (${effective.email}) подключен`
              : `✓ Google акаунт (${effective.email}) підключено`
          );
        }
      }

      // If user is owner, load admin telemetry
      if (isAppOwner(p)) {
        loadAdminTelemetry(p?.email || 'pilnikoff@gmail.com', p?.login);
      }

      // Initialize native Google Identity Services only if valid VITE_GOOGLE_CLIENT_ID exists
      try {
        const rawClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
        const googleClientId = typeof rawClientId === 'string' ? rawClientId.trim() : '';
        if (googleClientId && googleClientId.length > 5) {
          const loadAndInitGsi = () => {
            const w = window as any;
            if (w.google?.accounts?.id && googleBtnRef.current) {
              w.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (res: any) => {
                  if (res.credential) {
                    const draft = getGoogleProfileDraft(res.credential);
                    if (draft) {
                      applyGoogleDraft(draft);
                    }
                  }
                },
              });
              w.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: 'outline',
                size: 'large',
                width: 320,
                text: 'continue_with',
              });
            }
          };

          if (!(window as any).google?.accounts?.id) {
            const existingScript = document.getElementById('google-gsi-client');
            if (!existingScript) {
              const script = document.createElement('script');
              script.id = 'google-gsi-client';
              script.src = 'https://accounts.google.com/gsi/client';
              script.async = true;
              script.defer = true;
              script.onload = loadAndInitGsi;
              document.head.appendChild(script);
            }
          } else {
            loadAndInitGsi();
          }
        }
      } catch (e) {
        console.log('Google Identity Services not initialized', e);
      }
    }
  }, [isOpen]);

  const loadAdminTelemetry = async (ownerEmail: string, ownerLogin?: string) => {
    const data = await getAdminTelemetrySummary(ownerEmail, ownerLogin);
    if (data) {
      setAdminSummary(data);
      if (data.googleSheetsWebhookUrl) setSheetWebhookInput(data.googleSheetsWebhookUrl);
      if (data.googleSheetViewUrl) setSheetViewUrlInput(data.googleSheetViewUrl);
    }
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    setErrorMessage(null);
    // If login is empty and val contains @, propose login from email username
    if (!login.trim() && val.includes('@')) {
      const suggested = val.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
      setLogin(suggested);
    }
  };

  const updateDraft = (patch: Partial<UserProfile>) => {
    saveProfileDraft({
      login,
      fullName,
      email,
      dateOfBirth,
      fieldOfActivity,
      authProvider,
      avatarUrl,
      ...patch,
    });
  };

  const applyGoogleDraft = (draft: {
    login: string;
    fullName: string;
    email: string;
    avatarUrl: string;
    authProvider: 'google';
  }) => {
    const cleanLogin = draft.login || login.trim() || draft.email.split('@')[0];
    const cleanName = draft.fullName || fullName.trim() || cleanLogin;

    setLogin(cleanLogin);
    setFullName(cleanName);
    setEmail(draft.email);
    setAvatarUrl(draft.avatarUrl);
    setAuthProvider('google');
    setErrorMessage(null);
    setGoogleConnectedNotice(
      lang === 'ru'
        ? `✓ Google аккаунт (${draft.email}) подключен`
        : `✓ Google акаунт (${draft.email}) підключено`
    );

    // Immediately persist Google profile so refresh never loses user login
    const saved = saveUserProfile({
      login: cleanLogin,
      name: cleanName,
      fullName: cleanName,
      email: draft.email,
      avatarUrl: draft.avatarUrl,
      authProvider: 'google',
      fieldOfActivity: fieldOfActivity || 'Дослідник власного потенціалу',
      dateOfBirth: dateOfBirth || undefined,
    });
    setProfile(saved);
    setAuthDismissed();

    // Trigger cloud synchronization across devices (laptop, phone, PC)
    syncCloudData().catch(() => {});
  };

  const handleQuickGoogleDraft = (targetEmail?: string) => {
    const candidate = (targetEmail || customGoogleEmail || email || '').trim();
    if (!candidate) {
      setShowGoogleInput(true);
      setErrorMessage(
        lang === 'ru'
          ? 'Пожалуйста, укажите ваш Google Email для подключения (в поле ниже или в форме).'
          : 'Будь ласка, вкажіть ваш Google Email для підключення (у полі нижче або у формі).'
      );
      return;
    }
    const draft = getQuickGoogleDraft(candidate);
    if (draft) {
      applyGoogleDraft(draft);
      setShowGoogleInput(false);
      setErrorMessage(null);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Flexible validation: login or email is required, name defaults to login
    const cleanLogin = (login.trim() || email.split('@')[0] || 'user').trim();
    const cleanFullName = (fullName.trim() || cleanLogin).trim();
    const cleanBirthDate = dateOfBirth.trim();
    const cleanField = (fieldOfActivity.trim() || 'Дослідник власного потенціалу').trim();

    if (!cleanLogin && !email.trim()) {
      setErrorMessage(lang === 'ru' ? 'Пожалуйста, укажите логин или email' : 'Будь ласка, вкажіть логін або email');
      return;
    }

    const newProfile: UserProfile = {
      id: profile?.id || (email.trim() ? `google_${email.replace(/[^a-z0-9]/gi, '_')}` : `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`),
      login: cleanLogin,
      name: cleanFullName,
      fullName: cleanFullName,
      email: email.trim() || undefined,
      birthDate: cleanBirthDate || undefined,
      dateOfBirth: cleanBirthDate || undefined,
      fieldOfActivity: cleanField,
      pinOrPassword: password.trim() || undefined,
      authProvider: authProvider,
      avatarUrl: avatarUrl || (authProvider === 'google' ? `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanLogin)}` : undefined),
      registeredAt: profile?.registeredAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    };

    saveUserProfile(newProfile);
    setProfile(newProfile);
    setSavedSuccess(true);
    setAuthDismissed();

    // Trigger cloud synchronization across devices
    syncCloudData().catch(() => {});

    if (onProfileSaved) {
      onProfileSaved();
    }

    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    clearUserSession();
    try {
      localStorage.removeItem('psych_nav_auth_dismissed_v1');
    } catch {}
    setProfile(null);
    setLogin('');
    setFullName('');
    setEmail('');
    setDateOfBirth('');
    setFieldOfActivity('');
    setPassword('');
    setAuthProvider('local');
    setAvatarUrl(undefined);
    setGoogleConnectedNotice(null);
    if (onProfileSaved) onProfileSaved();
  };

  const handleSaveAdminConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminSaving(true);
    setAdminSavedSuccess(false);

    const res = await saveAdminGoogleSheetsConfig(
      {
        webhookUrl: sheetWebhookInput,
        sheetViewUrl: sheetViewUrlInput,
      },
      profile?.email || 'pilnikoff@gmail.com',
      profile?.login || 'pilnikoff'
    );

    setAdminSaving(false);
    if (res && res.success) {
      setAdminSavedSuccess(true);
      setTimeout(() => setAdminSavedSuccess(false), 3000);
      loadAdminTelemetry(profile?.email || 'pilnikoff@gmail.com', profile?.login);
    }
  };

  const copyAppsScript = () => {
    navigator.clipboard.writeText(SAMPLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  if (!isOpen) return null;

  const mustCompleteRegistration = isMandatoryOnboarding && !isProfileComplete(profile);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-2xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden text-stone-100"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80">
            <div className="flex items-center gap-3">
              {avatarUrl || profile?.avatarUrl ? (
                <img
                  src={avatarUrl || profile?.avatarUrl}
                  alt={fullName || 'Avatar'}
                  className="w-11 h-11 rounded-xl object-cover border border-teal-500/50 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="p-2.5 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-white">
                    {profile && isProfileComplete(profile)
                      ? profile.fullName || profile.name
                      : lang === 'ru'
                      ? 'Вход & Обязательная регистрация'
                      : 'Вхід & Обовʼязкова реєстрація'}
                  </h3>
                  {isOwner && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold">
                      ВЛАСНИК
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-400">
                  {mustCompleteRegistration
                    ? lang === 'ru'
                      ? 'Все поля формы являются обязательными для входа в приложение'
                      : 'Усі поля форми є обовʼязковими для входу в додаток'
                    : profile && isProfileComplete(profile)
                    ? `${profile.fieldOfActivity} • ${profile.authProvider === 'google' ? 'Google: ' + profile.email : profile.login}`
                    : lang === 'ru'
                    ? 'Заполните ваш личный профиль для старта'
                    : 'Заповніть ваш особистий профіль для старту'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAuthDismissed();
                  onClose();
                }}
                className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
                title="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Exclusive Tabs: ONLY shown to owner pilnikoff@gmail.com */}
          {isOwner && (
            <div className="flex border-b border-stone-800 bg-stone-950/40 px-5 gap-4">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'border-teal-500 text-teal-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{lang === 'ru' ? 'Мой Профиль' : 'Мій Профіль'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('adminGoogleSheet');
                  loadAdminTelemetry(profile?.email || 'pilnikoff@gmail.com', profile?.login);
                }}
                className={`py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'adminGoogleSheet'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Google Таблиця & Статистика (Власник)</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
            {activeTab === 'profile' ? (
              <div className="max-w-xl mx-auto space-y-5">
                {/* Mandatory Onboarding Notice */}
                {mustCompleteRegistration && (
                  <div className="p-3.5 rounded-xl bg-teal-950/40 border border-teal-500/30 flex items-start gap-3">
                    <Info className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-stone-200 space-y-1">
                      <p className="font-semibold text-teal-300">
                        {lang === 'ru'
                          ? 'Обязательное заполнение данных для доступа к Навигатору'
                          : 'Обовʼязкове заповнення даних для доступу до Навігатора'}
                      </p>
                      <p className="text-stone-400">
                        {lang === 'ru'
                          ? 'Для персонализации техник, психологических алгоритмов и сохранения сессий заполните все 4 поля ниже. Вы также можете быстро подключить Google аккаунт.'
                          : 'Для персоналізації технік, психологічних алгоритмів та збереження сесій заповніть усі 4 поля нижче. Ви також можете швидко підключити Google акаунт.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Google Sign-In Card */}
                <div className="rounded-2xl border border-stone-800 bg-stone-950/60 p-4 sm:p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <svg className="w-6 h-6" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <div>
                        <h4 className="text-sm font-bold text-white">
                          {lang === 'ru' ? 'Вход через Google' : 'Вхід через Google'}
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          {lang === 'ru'
                            ? 'Свяжите профиль с Google (поля формы все равно заполняются)'
                            : 'Звʼяжіть профіль з Google (поля форми все одно заповнюються)'}
                        </p>
                      </div>
                    </div>

                    {authProvider === 'google' && email && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        {email}
                      </span>
                    )}
                  </div>

                  {/* Native Google Button if initialized */}
                  <div ref={googleBtnRef} className="flex justify-center empty:hidden" />

                  {/* 1-Click Fast Google Connect Button */}
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        const rawClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
                        const googleClientId = typeof rawClientId === 'string' ? rawClientId.trim() : '';
                        const w = window as any;
                        if (googleClientId && googleClientId.length > 5 && w.google?.accounts?.id?.prompt) {
                          try {
                            w.google.accounts.id.prompt();
                          } catch (err) {
                            console.log('GIS prompt fallback', err);
                          }
                        }
                        if (email.trim()) {
                          handleQuickGoogleDraft(email.trim());
                        } else {
                          setShowGoogleInput(true);
                        }
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>
                        {authProvider === 'google' && email
                          ? lang === 'ru'
                            ? `Google подключен (${email})`
                            : `Google підключено (${email})`
                          : lang === 'ru'
                          ? 'Подключить Google аккаунт'
                          : 'Підключити Google акаунт'}
                      </span>
                    </button>

                    <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
                      <button
                        type="button"
                        onClick={() => setShowGoogleInput(!showGoogleInput)}
                        className="text-teal-400 hover:underline cursor-pointer"
                      >
                        {showGoogleInput
                          ? lang === 'ru'
                            ? 'Скрыть ввод email'
                            : 'Сховати введення email'
                          : lang === 'ru'
                          ? 'Ввести конкретный Google email'
                          : 'Ввести конкретний Google email'}
                      </button>
                      {authProvider === 'google' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setAuthProvider('local');
                            setGoogleConnectedNotice(null);
                          }}
                          className="text-stone-400 hover:text-rose-400 underline cursor-pointer"
                        >
                          {lang === 'ru' ? 'Отвязать Google' : 'Відвʼязати Google'}
                        </button>
                      ) : (
                        <span className="text-stone-500">
                          {lang === 'ru' ? 'Синхронизация с профилем' : 'Синхронізація з профілем'}
                        </span>
                      )}
                    </div>

                    {showGoogleInput && (
                      <div className="flex gap-2 pt-1">
                        <input
                          type="email"
                          value={customGoogleEmail}
                          onChange={(e) => setCustomGoogleEmail(e.target.value)}
                          placeholder="your.email@gmail.com"
                          className="flex-1 text-xs bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-teal-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuickGoogleDraft(customGoogleEmail)}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Google Connected Notice */}
                  {googleConnectedNotice && (
                    <div className="p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>{googleConnectedNotice}</span>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-stone-800" />
                  <span className="flex-shrink mx-4 text-[11px] uppercase tracking-wider text-stone-500 font-semibold">
                    {lang === 'ru' ? 'Обязательные поля профиля' : 'Обовʼязкові поля профілю'}
                  </span>
                  <div className="flex-grow border-t border-stone-800" />
                </div>

                {/* Validation Error Message */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Standard Profile Form with 4 REQUIRED fields */}
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  {/* Email Field - Can be filled manually or automatically via Google */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-teal-400" />
                        <span>{lang === 'ru' ? 'Email (Электронная почта):' : 'Email (Електронна пошта):'}</span>
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {authProvider === 'google' && email
                          ? (lang === 'ru' ? '✓ Синхронизировано с Google' : '✓ Синхронізовано з Google')
                          : (lang === 'ru' ? 'Вручную или через Google' : 'Вручну або через Google')}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => handleEmailChange(e.target.value)}
                        placeholder="your.email@gmail.com"
                        className="w-full text-xs bg-stone-950/80 border border-stone-700/80 rounded-xl p-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-teal-500"
                      />
                      {authProvider === 'google' && email && (
                        <div className="absolute right-2.5 top-2.5 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-semibold">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Google</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-400">
                      {lang === 'ru'
                        ? 'Поле изначально пустое. Заполните его вручную или выполните вход через Google.'
                        : 'Поле початково пусте. Заповніть його вручну або виконайте вхід через Google.'}
                    </p>
                  </div>

                  {/* 1. Login */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                      <span>
                        {lang === 'ru' ? '1. Логин (Никнейм):' : '1. Логін (Нікнейм):'} <span className="text-teal-400 font-bold">*</span>
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {lang === 'ru' ? 'Логин или email' : 'Логін або email'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={login}
                      onChange={(e) => {
                        setLogin(e.target.value);
                        updateDraft({ login: e.target.value });
                      }}
                      placeholder="наприклад: ivan_m"
                      className="w-full text-xs bg-stone-950/80 border border-stone-700/80 rounded-xl p-3 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* 2. Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                      <span>
                        {lang === 'ru' ? '2. Полное имя / Как обращаться:' : '2. Повне імʼя / Як звертатися:'}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {lang === 'ru' ? 'За бажанням' : 'За бажанням'}
                      </span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        updateDraft({ fullName: e.target.value });
                      }}
                      placeholder="Іван Мельник"
                      className="w-full text-xs bg-stone-950/80 border border-stone-700/80 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* 3. Birth Date & 4. Field of Activity */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Date of Birth */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                        <span>
                          {lang === 'ru' ? '3. Дата рождения:' : '3. Дата народження:'}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {lang === 'ru' ? 'За бажанням' : 'За бажанням'}
                        </span>
                      </label>
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          updateDraft({ dateOfBirth: e.target.value });
                        }}
                        className="w-full text-xs bg-stone-950/80 border border-stone-700/80 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>

                    {/* Field of Activity */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                        <span>
                          {lang === 'ru' ? '4. Сфера деятельности:' : '4. Сфера діяльності:'}
                        </span>
                        <span className="text-[10px] text-stone-500">
                          {lang === 'ru' ? 'За бажанням' : 'За бажанням'}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={fieldOfActivity}
                        onChange={(e) => {
                          setFieldOfActivity(e.target.value);
                          updateDraft({ fieldOfActivity: e.target.value });
                        }}
                        placeholder="Коучинг, IT, Бізнес, Психологія..."
                        className="w-full text-xs bg-stone-950/80 border border-stone-700/80 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  {/* Quick suggestions for Field of Activity */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {['Психологія & Коучинг', 'IT & Технології', 'Підприємництво', 'Освіта & Наука', 'Мистецтво & Дизайн'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setFieldOfActivity(preset);
                          updateDraft({ fieldOfActivity: preset });
                        }}
                        className="text-[10px] px-2 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 border border-stone-700/60 transition-colors cursor-pointer"
                      >
                        + {preset}
                      </button>
                    ))}
                  </div>

                  {/* Password / PIN (Optional protection) */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                      <span>{lang === 'ru' ? 'Пароль / PIN для защиты журнала:' : 'Пароль / PIN для захисту журналу:'}</span>
                      <span className="text-[10px] text-stone-500">За бажанням</span>
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full text-xs bg-stone-950/80 border border-stone-700/80 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center gap-3">
                    <button
                      type="submit"
                      className="w-full sm:flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{savedSuccess ? (lang === 'ru' ? 'Успешно сохранено!' : 'Збережено успішно!') : (lang === 'ru' ? 'Сохранить и войти' : 'Зберегти та увійти')}</span>
                    </button>

                    {profile && isProfileComplete(profile) && (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full sm:w-auto py-3 px-4 bg-stone-800 hover:bg-rose-950/60 hover:text-rose-300 text-stone-400 font-semibold text-xs rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{lang === 'ru' ? 'Выйти' : 'Вийти'}</span>
                      </button>
                    )}
                  </div>
                </form>

                {/* Developer / Studio Footer */}
                <div className="mt-4 pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-1.5">
                  <span className="text-center sm:text-left">
                    Розроблено — <strong className="text-stone-200">Pilnikov Maksym Studio</strong> • Версія: 1.0.2
                  </span>
                  <a
                    href="https://t.me/pilnikoff"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 transition-colors"
                  >
                    <span>Звʼязок у Telegram: @pilnikoff</span>
                  </a>
                </div>
              </div>
            ) : (
              /* Exclusive Tab for owner pilnikoff@gmail.com */
              <div className="space-y-5">
                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                    <span>Центральна Google Таблиця статистики (Тільки для власника pilnikoff@gmail.com)</span>
                  </div>
                  <p className="text-xs text-stone-300">
                    Усі дані зареєстрованих користувачів та їхні логи дій автоматично синхронізуються на сервері та передаються у вашу приватну Google Таблицю через Webhook (Google Apps Script).
                  </p>
                </div>

                {/* Counters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800">
                    <span className="text-xs text-stone-400 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-400" />
                      Зареєстровані користувачі
                    </span>
                    <h4 className="text-2xl font-bold text-white mt-1">
                      {adminSummary?.totalUsers ?? '...'}
                    </h4>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800">
                    <span className="text-xs text-stone-400 flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-purple-400" />
                      Логів активності
                    </span>
                    <h4 className="text-2xl font-bold text-white mt-1">
                      {adminSummary?.totalActivities ?? '...'}
                    </h4>
                  </div>
                  <div className="p-4 rounded-xl bg-stone-950/80 border border-stone-800">
                    <span className="text-xs text-stone-400 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Google Таблиця
                    </span>
                    <div className="mt-1">
                      {adminSummary?.googleSheetsWebhookUrl ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                          <CheckCircle className="w-3.5 h-3.5" /> Підключено
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-medium">Очікує Webhook</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Google Sheet Webhook & View URL Settings */}
                <form onSubmit={handleSaveAdminConfig} className="space-y-4 p-4 rounded-xl bg-stone-950/60 border border-stone-800">
                  <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Налаштування Google Таблиці
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                      <span>URL Google Apps Script Webhook (для автозапису даних):</span>
                      <span className="text-[10px] text-stone-400">POST endpoint</span>
                    </label>
                    <input
                      type="url"
                      value={sheetWebhookInput}
                      onChange={(e) => setSheetWebhookInput(e.target.value)}
                      placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                      className="w-full text-xs bg-stone-900 border border-stone-700 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-stone-300 flex items-center justify-between">
                      <span>Пряме посилання на Google Таблицю (для швидкого перегляду):</span>
                      <span className="text-[10px] text-stone-400">docs.google.com/spreadsheets</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={sheetViewUrlInput}
                        onChange={(e) => setSheetViewUrlInput(e.target.value)}
                        placeholder="https://docs.google.com/spreadsheets/d/1BxiM.../edit"
                        className="flex-1 text-xs bg-stone-900 border border-stone-700 rounded-xl p-3 text-stone-100 focus:outline-none focus:border-amber-500"
                      />
                      {sheetViewUrlInput && (
                        <a
                          href={sheetViewUrlInput}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-3 bg-stone-800 hover:bg-stone-700 text-teal-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 border border-stone-700"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Відкрити</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      disabled={adminSaving}
                      className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{adminSaving ? 'Збереження...' : adminSavedSuccess ? 'Збережено!' : 'Зберегти налаштування'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => loadAdminTelemetry(profile?.email || 'pilnikoff@gmail.com', profile?.login)}
                      className="py-2.5 px-3 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-xl border border-stone-700 flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Оновити дані</span>
                    </button>
                  </div>
                </form>

                {/* CSV Exports */}
                <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-3">
                  <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                    Експорт у Google Таблиці (CSV)
                  </h4>
                  <p className="text-xs text-stone-400">
                    Ви можете завантажити зібрану базу в форматі CSV з підтримкою UTF-8 для імпорту в Google Таблицю:
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href={`/api/telemetry/export-users-csv?adminEmail=${encodeURIComponent(profile?.email || 'pilnikoff@gmail.com')}&adminLogin=${encodeURIComponent(profile?.login || 'pilnikoff')}`}
                      download
                      className="py-2 px-3.5 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/40 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Завантажити базу користувачів (CSV)</span>
                    </a>
                    <a
                      href={`/api/telemetry/export-logs-csv?adminEmail=${encodeURIComponent(profile?.email || 'pilnikoff@gmail.com')}&adminLogin=${encodeURIComponent(profile?.login || 'pilnikoff')}`}
                      download
                      className="py-2 px-3.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Завантажити логи активності (CSV)</span>
                    </a>
                  </div>
                </div>

                {/* 1-Minute Apps Script Setup Guide */}
                <div className="p-4 rounded-xl bg-stone-950/60 border border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">
                      Готовий Google Apps Script для вашої Google Таблиці
                    </h4>
                    <button
                      type="button"
                      onClick={copyAppsScript}
                      className="py-1 px-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 border border-stone-700 cursor-pointer"
                    >
                      {copiedScript ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedScript ? 'Скопійовано!' : 'Скопіювати код'}</span>
                    </button>
                  </div>
                  <ol className="text-xs text-stone-300 space-y-1.5 list-decimal list-inside">
                    <li>Створіть нову Google Таблицю на своєму акаунті <b>pilnikoff@gmail.com</b>.</li>
                    <li>У верхньому меню натисніть <b>Розширення (Extensions) &rarr; Apps Script</b>.</li>
                    <li>Вставте скопійований код нижче та натисніть <b>Зберегти</b>.</li>
                    <li>Натисніть <b>Розгорнути (Deploy) &rarr; Нове розгортання (New deployment) &rarr; Веб-програма (Web app)</b>.</li>
                    <li>Встановіть: «Виконувати від імені: Мене» та «Хто має доступ: <b>Усі (Anyone)</b>».</li>
                    <li>Скопіюйте отриманий URL веб-програми та вставте його в поле вище.</li>
                  </ol>
                  <pre className="p-3 bg-stone-950 rounded-xl text-[11px] text-stone-400 font-mono overflow-x-auto max-h-44 custom-scrollbar border border-stone-800">
                    {SAMPLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default UserAuthAndStatsModal;
