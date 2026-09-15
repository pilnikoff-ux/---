import { UserProfile, UserActivityLog, UserFeedback, SelfLearningSettings } from '../types';
export type { SelfLearningSettings };

const USER_PROFILE_KEY = 'psych_nav_user_profile_v1';
const ACTIVITY_LOGS_KEY = 'psych_nav_activity_logs_v1';
const FEEDBACKS_KEY = 'psych_nav_feedbacks_v1';
const SELF_LEARNING_SETTINGS_KEY = 'psych_nav_self_learning_rules_v1';

// Default Anonymous Guest Profile if not registered
const DEFAULT_GUEST_PROFILE: UserProfile = {
  id: 'guest_user',
  login: 'guest',
  name: 'Гість Навігатора',
  registeredAt: new Date().toISOString(),
  lastLoginAt: new Date().toISOString(),
  fieldOfActivity: 'Дослідник власного потенціалу',
};

// Check if user profile has all mandatory fields filled
export function isProfileComplete(profile: UserProfile | null): boolean {
  if (!profile) return false;
  if (profile.id === 'guest_user' || profile.login === 'guest') return false;

  const login = (profile.login || '').trim();
  const name = (profile.fullName || profile.name || '').trim();
  const birthDate = (profile.birthDate || profile.dateOfBirth || '').trim();
  const field = (profile.fieldOfActivity || '').trim();

  // All fields are strictly required: Login, Full Name, Birth Date, Field of Activity
  return login.length > 0 && name.length > 0 && birthDate.length > 0 && field.length > 0;
}

// Check if current user is owner / administrator (pilnikoff@gmail.com)
export function isAppOwner(profile: UserProfile | null): boolean {
  if (!profile) return false;
  const email = (profile.email || '').toLowerCase().trim();
  const login = (profile.login || '').toLowerCase().trim();
  return email === 'pilnikoff@gmail.com' || login === 'pilnikoff';
}

// 1. User Profile Management
export function getUserProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_PROFILE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Purge any legacy sample data (e.g. user.coach@gmail.com or user_coach)
    if (parsed && (parsed.email === 'user.coach@gmail.com' || parsed.login === 'user_coach')) {
      localStorage.removeItem(USER_PROFILE_KEY);
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to get user profile', e);
    return null;
  }
}

export function saveUserProfile(profileData: {
  login: string;
  name: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  authProvider?: 'google' | 'local' | 'guest';
  id?: string;
  pinOrPassword?: string;
  birthDate?: string;
  dateOfBirth?: string;
  fieldOfActivity?: string;
}): UserProfile {
  const existing = getUserProfile();
  const profile: UserProfile = {
    id: profileData.id || existing?.id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    login: profileData.login.trim(),
    name: profileData.name.trim() || profileData.login.trim(),
    fullName: profileData.fullName?.trim() || profileData.name.trim() || profileData.login.trim(),
    email: profileData.email?.trim() || existing?.email,
    avatarUrl: profileData.avatarUrl || existing?.avatarUrl,
    authProvider: profileData.authProvider || existing?.authProvider || 'local',
    pinOrPassword: profileData.pinOrPassword || existing?.pinOrPassword,
    birthDate: profileData.birthDate || profileData.dateOfBirth || existing?.birthDate,
    dateOfBirth: profileData.dateOfBirth || profileData.birthDate || existing?.dateOfBirth,
    fieldOfActivity: profileData.fieldOfActivity?.trim() || existing?.fieldOfActivity,
    registeredAt: existing?.registeredAt || new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save user profile', e);
  }

  // Send registration to server and Google Sheets in background
  try {
    fetch('/api/telemetry/user-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: profile.id,
        login: profile.login,
        name: profile.name,
        fullName: profile.fullName || profile.name,
        email: profile.email,
        birthDate: profile.birthDate || profile.dateOfBirth,
        fieldOfActivity: profile.fieldOfActivity,
        authProvider: profile.authProvider,
        registeredAt: profile.registeredAt,
      }),
    }).catch((e) => console.log('Telemetry sync notice:', e));
  } catch (e) {
    // Offline safe
  }

  // Log registration/login event
  logUserActivity({
    tab: 'auth',
    toolName: existing ? 'Оновлення профілю' : profile.authProvider === 'google' ? 'Google Авторизація' : 'Реєстрація користувача',
    querySummary: `Користувач ${profile.name} (${profile.login}) зареєструвався/увійшов у систему`,
    details: {
      authProvider: profile.authProvider,
      email: profile.email,
      fieldOfActivity: profile.fieldOfActivity,
      birthDate: profile.birthDate,
    },
  });

  return profile;
}

export function logoutUserProfile(): void {
  try {
    localStorage.removeItem(USER_PROFILE_KEY);
  } catch (e) {
    console.error('Failed to logout', e);
  }
}

// 2. Activity Logs & Stats
export function getActivityLogs(): UserActivityLog[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    if (!raw) return [];
    const logs = JSON.parse(raw);
    return Array.isArray(logs) ? logs : [];
  } catch (e) {
    console.error('Failed to get activity logs', e);
    return [];
  }
}

export function logUserActivity(params: {
  tab: string;
  toolName: string;
  querySummary: string;
  category?: string;
  details?: Record<string, any>;
}): UserActivityLog {
  const profile = getUserProfile() || DEFAULT_GUEST_PROFILE;
  const newLog: UserActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    userId: profile.id,
    userName: profile.name,
    tab: params.tab,
    toolName: params.toolName,
    querySummary: params.querySummary.slice(0, 200),
    category: params.category,
    details: params.details,
  };

  try {
    const logs = getActivityLogs();
    logs.unshift(newLog);
    // Keep last 1000 logs
    const trimmed = logs.slice(0, 1000);
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to append activity log', e);
  }

  // Send activity log to server and Google Sheets in background
  try {
    fetch('/api/telemetry/user-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: profile.id,
        userName: profile.name,
        userEmail: profile.email,
        tab: params.tab,
        toolName: params.toolName,
        querySummary: params.querySummary,
        category: params.category,
      }),
    }).catch((e) => console.log('Activity sync notice:', e));
  } catch (e) {
    // Offline safe
  }

  return newLog;
}

// Admin / Owner Google Sheets helpers (pilnikoff@gmail.com)
export async function getAdminTelemetrySummary(adminEmail: string, adminLogin?: string) {
  try {
    const res = await fetch(`/api/telemetry/admin-summary?adminEmail=${encodeURIComponent(adminEmail)}&adminLogin=${encodeURIComponent(adminLogin || '')}`);
    if (!res.ok) {
      throw new Error(`Помилка доступу (${res.status})`);
    }
    return await res.json();
  } catch (e) {
    console.error('Failed to fetch admin telemetry', e);
    return null;
  }
}

export async function saveAdminGoogleSheetsConfig(
  params: { webhookUrl?: string; sheetViewUrl?: string },
  adminEmail: string,
  adminLogin?: string
) {
  try {
    const res = await fetch('/api/telemetry/config-google-sheet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail,
        adminLogin,
        webhookUrl: params.webhookUrl,
        sheetViewUrl: params.sheetViewUrl,
      }),
    });
    return await res.json();
  } catch (e) {
    console.error('Failed to save Google Sheets config', e);
    return null;
  }
}

export function clearActivityLogs(): void {
  try {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear logs', e);
  }
}

export function exportLogsToCSV(): void {
  const logs = getActivityLogs();
  if (!logs.length) return;

  const headers = ['ID', 'Дата та час', 'Користувач', 'Вкладка / Модуль', 'Інструмент', 'Зміст запиту / Дія', 'Категорія'];
  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${new Date(log.timestamp).toLocaleString('uk-UA')}"`,
    `"${(log.userName || '').replace(/"/g, '""')}"`,
    `"${(log.tab || '').replace(/"/g, '""')}"`,
    `"${(log.toolName || '').replace(/"/g, '""')}"`,
    `"${(log.querySummary || '').replace(/"/g, '""')}"`,
    `"${(log.category || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `navigator_activity_stats_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// 3. User Feedback & Self-Learning Engine
export function getUserFeedbacks(): UserFeedback[] {
  try {
    const raw = localStorage.getItem(FEEDBACKS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to get feedbacks', e);
    return [];
  }
}

export function saveUserFeedback(feedbackData: Partial<UserFeedback> & { rating: number }): UserFeedback {
  const profile = getUserProfile() || DEFAULT_GUEST_PROFILE;
  const feedbacks = getUserFeedbacks();

  const adaptationInsights: string[] = [];
  if (feedbackData.rating >= 4) {
    adaptationInsights.push('Закріплено високий рівень задоволеності поточним стилем аналізу.');
  }
  const diffStr = Array.isArray(feedbackData.difficulties)
    ? feedbackData.difficulties.join(', ')
    : String(feedbackData.difficulties || '');
  if (diffStr.length > 5) {
    adaptationInsights.push(`Адаптовано спрощення формулювань у сфері: "${diffStr.slice(0, 60)}..."`);
  }
  const improveStr = feedbackData.improvementSuggestions || feedbackData.featureSuggestions || feedbackData.comment || '';
  if (improveStr.length > 5) {
    adaptationInsights.push(`Враховано побажання щодо покращення: "${improveStr.slice(0, 60)}..."`);
  }

  const feedback: UserFeedback = {
    id: feedbackData.id || `fb_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    date: feedbackData.date || new Date().toISOString(),
    userId: profile.id,
    userName: profile.name,
    rating: feedbackData.rating,
    likedAspects: feedbackData.likedAspects || [],
    difficulties: feedbackData.difficulties || '',
    improvementSuggestions: feedbackData.improvementSuggestions || '',
    featureSuggestions: feedbackData.featureSuggestions || '',
    comment: feedbackData.comment || '',
    selfLearningApplied: true,
    systemAdaptationInsights: adaptationInsights,
  };

  feedbacks.unshift(feedback);
  try {
    localStorage.setItem(FEEDBACKS_KEY, JSON.stringify(feedbacks));
  } catch (e) {
    console.error('Failed to save feedback', e);
  }

  // Update dynamic self-learning rules
  updateSelfLearningSettings(feedbacks);

  // Log feedback submission
  logUserActivity({
    tab: 'feedback',
    toolName: 'Відгук користувача',
    querySummary: `Оцінка: ${feedback.rating}/5. Побажання: ${(improveStr || feedback.comment || '').slice(0, 100) || 'Без тексту'}`,
    category: 'Feedback',
  });

  return feedback;
}

export function getSelfLearningSettings(): SelfLearningSettings {
  try {
    const raw = localStorage.getItem(SELF_LEARNING_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load self learning settings', e);
  }

  return {
    preferredDepth: 'deep_philosophical',
    favoredSchools: ['natural_linetsky', 'jungian_analytical', 'cbt', 'dilts_levels'],
    avoidJargon: false,
    morePracticalSteps: true,
    adaptedPromptDirectives: [
      'Застосовувати підтримуючий, поважний та теплий тон спілкування',
      'Завжди повʼязувати філософські інсайти з конкретними мікро-діями на 24 години',
      'Звертати увагу на рівні сприйняття Роберта Ділтса (піднімати рішення на рівень вище проблеми)',
    ],
    lastLearnedAt: new Date().toISOString(),
  };
}

export function updateSelfLearningSettings(feedbacks: UserFeedback[]): SelfLearningSettings {
  const current = getSelfLearningSettings();
  const directives: string[] = [...current.adaptedPromptDirectives];

  // Analyze all suggestions
  feedbacks.forEach((fb) => {
    const text = (fb.difficulties + ' ' + fb.improvementSuggestions).toLowerCase();
    if ((text.includes('простіше') || text.includes('складно') || text.includes('понятнее')) && !current.avoidJargon) {
      current.avoidJargon = true;
      directives.push('Пояснювати складні психоаналітичні терміни живими аналогіями та простими словами.');
    }
    if ((text.includes('практик') || text.includes('дій') || text.includes('шаги')) && !current.morePracticalSteps) {
      current.morePracticalSteps = true;
      directives.push('Посилювати розділ конкретних практичних кроків та соматичних вправ.');
    }
  });

  const updated: SelfLearningSettings = {
    ...current,
    adaptedPromptDirectives: Array.from(new Set(directives)).slice(-8),
    lastLearnedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(SELF_LEARNING_SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save self learning settings', e);
  }

  return updated;
}

// Aliases for component convenience
export const getUserActivityLogs = getActivityLogs;
export const clearUserSession = logoutUserProfile;
