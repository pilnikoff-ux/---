import React, { useState, useEffect } from 'react';
import {
  Bookmark,
  Search,
  Trash2,
  Download,
  Upload,
  Calendar,
  Layers,
  Compass,
  Grid2X2,
  HelpCircle,
  FileText,
  Swords,
  ChevronRight,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import { JournalEntry, UserProfile } from '../types';
import { getJournalEntries, deleteJournalEntry, exportJournalData, importJournalData } from '../services/storageService';
import { getUserProfile } from '../services/userStatsService';
import { quickGoogleSignIn } from '../services/googleAuthService';
import { TabType } from './Navbar';
import { JournalStatsChart } from './JournalStatsChart';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { User, ShieldCheck, LogIn, RefreshCw, Cloud, Check } from 'lucide-react';
import { syncCloudData, subscribeToSyncState, CloudSyncState } from '../services/cloudSyncService';

interface MyJournalProps {
  onNavigateToTool: (tab: TabType) => void;
  onOpenProfileModal?: () => void;
}

export const MyJournal: React.FC<MyJournalProps> = ({ onNavigateToTool, onOpenProfileModal }) => {
  const { lang, t } = useThemeLanguage();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getUserProfile());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<CloudSyncState>({
    isSyncing: false,
    lastSyncedAt: localStorage.getItem('psych_nav_last_cloud_sync'),
    error: null,
    syncedCount: 0,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadEntries = () => {
    const user = getUserProfile();
    setCurrentUser(user);
    const list = getJournalEntries(user?.id);
    setEntries(list);
    if (list.length > 0 && (!selectedEntry || !list.some((e) => e.id === selectedEntry.id))) {
      setSelectedEntry(list[0]);
    } else if (list.length === 0) {
      setSelectedEntry(null);
    }
  };

  useEffect(() => {
    loadEntries();
    const unsub = subscribeToSyncState((state) => {
      setSyncState(state);
    });
    const handleStorageSync = () => {
      loadEntries();
    };
    window.addEventListener('journal_cloud_synced', handleStorageSync);
    window.addEventListener('storage', handleStorageSync);
    return () => {
      unsub();
      window.removeEventListener('journal_cloud_synced', handleStorageSync);
      window.removeEventListener('storage', handleStorageSync);
    };
  }, []);

  const handleManualSync = async () => {
    const res = await syncCloudData(true);
    loadEntries();
    if (res.success) {
      showToast(
        lang === 'ru'
          ? `✓ Синхронизировано между вашими устройствами! Записей: ${res.count}`
          : `✓ Синхронізовано між вашими пристроями! Записів: ${res.count}`
      );
    } else {
      showToast(
        lang === 'ru'
          ? 'Для синхронизации подключите Google аккаунт в профиле'
          : 'Для синхронізації підключіть Google акаунт у профілі'
      );
    }
  };

  const handleGoogleQuickAuth = () => {
    if (currentUser?.email) {
      const updated = quickGoogleSignIn(currentUser.email, currentUser.fullName || currentUser.name);
      if (updated) {
        setCurrentUser(updated);
        loadEntries();
        showToast(lang === 'ru' ? 'Вы успешно вошли через Google' : 'Ви успішно увійшли через Google');
      }
    } else if (onOpenProfileModal) {
      onOpenProfileModal();
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteJournalEntry(id, currentUser?.id);
    const updated = getJournalEntries(currentUser?.id);
    setEntries(updated);
    if (selectedEntry?.id === id) {
      setSelectedEntry(updated.length > 0 ? updated[0] : null);
    }
    showToast(lang === 'en' ? 'Entry deleted' : 'Запис успішно видалено');
  };

  const handleExport = () => {
    exportJournalData(currentUser?.id);
    showToast(lang === 'en' ? 'Journal exported to JSON' : 'Журнал експортовано в JSON');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importJournalData(content, currentUser?.id);
      if (success) {
        loadEntries();
        showToast(lang === 'en' ? 'Data imported successfully' : 'Дані успішно імпортовано');
      } else {
        showToast(lang === 'en' ? 'Invalid journal file format' : 'Невірний формат файлу журналу');
      }
    };
    reader.readAsText(file);
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesType = selectedType === 'all' || entry.type === selectedType;
    const matchesSearch =
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getTypeBadge = (type: JournalEntry['type']) => {
    switch (type) {
      case 'consilium':
        return {
          label: lang === 'en' ? 'Consilium' : 'Консиліум',
          color: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
        };
      case 'associations16':
        return {
          label: lang === 'en' ? '16 Assoc.' : '16 Асоціацій',
          color: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
        };
      case 'descartes':
        return {
          label: lang === 'en' ? 'Descartes' : 'Декарт',
          color: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
        };
      case 'fiveWhys':
        return {
          label: lang === 'en' ? '5 Whys' : '5 Чому',
          color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        };
      case 'cbt':
        return {
          label: lang === 'en' ? 'CBT Journal' : 'КПТ Щоденник',
          color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
        };
      case 'nvcEq':
        return {
          label: lang === 'en' ? 'NVC & EQ' : 'ННК & EQ',
          color: 'bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
        };
      case 'wheelOfBalance':
        return {
          label: lang === 'en' ? 'Wheel of Balance' : 'Колесо Балансу',
          color: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        };
      case 'goalMakersBoard':
        return {
          label: 'Goal MAker$',
          color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        };
      case 'goalMakers':
        return {
          label: lang === 'en' ? 'Hero\'s Goal' : 'Мета Героя',
          color: 'bg-pink-500/10 dark:bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30',
        };
      case 'hundredWishes':
        return {
          label: lang === 'en' ? '100 Desires' : '100 Бажань',
          color: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        };
      case 'selfReflection':
        return {
          label: lang === 'en' ? 'Self-Reflection' : 'Саморефлексія',
          color: 'bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
        };
      case 'smartGoals':
        return {
          label: lang === 'en' ? 'SMART Goal' : 'Ціль по SMART',
          color: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
        };
      case 'preMortem':
        return {
          label: lang === 'en' ? 'Pre-Mortem' : 'Премортем',
          color: 'bg-rose-500/15 dark:bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/40',
        };
      default:
        return {
          label: lang === 'en' ? 'Practice' : 'Практика',
          color: 'bg-teal-500/10 text-teal-700 border-teal-500/30',
        };
    }
  };

  const filterTabs = [
    { id: 'all', label: lang === 'ru' ? 'Все записи' : lang === 'en' ? 'All Entries' : 'Усі записи' },
    { id: 'preMortem', label: lang === 'ru' ? 'Премортем' : lang === 'en' ? 'Pre-Mortem' : 'Премортем' },
    { id: 'consilium', label: lang === 'ru' ? 'Консилиумы' : lang === 'en' ? 'Consiliums' : 'Консиліуми' },
    { id: 'hundredWishes', label: lang === 'ru' ? '100 Желаний' : lang === 'en' ? '100 Wishes' : '100 Бажань' },
    { id: 'selfReflection', label: lang === 'ru' ? 'Саморефлексия' : lang === 'en' ? 'Reflection' : 'Саморефлексія' },
    { id: 'smartGoals', label: lang === 'ru' ? 'SMART-Цели' : lang === 'en' ? 'SMART Goals' : 'SMART-Цілі' },
    { id: 'goalMakersBoard', label: 'Goal MAker$' },
    { id: 'nvcEq', label: lang === 'ru' ? 'ННО & EQ' : lang === 'en' ? 'NVC & EQ' : 'ННК & EQ' },
    { id: 'wheelOfBalance', label: lang === 'ru' ? 'Колесо' : lang === 'en' ? 'Wheel' : 'Колесо' },
    { id: 'associations16', label: lang === 'ru' ? '16 Ассоциаций' : lang === 'en' ? '16 Assoc.' : '16 Асоціацій' },
    { id: 'cbt', label: lang === 'ru' ? 'КПТ' : lang === 'en' ? 'CBT' : 'КПТ' },
    { id: 'descartes', label: lang === 'ru' ? 'Декарт' : lang === 'en' ? 'Descartes' : 'Декарт' },
    { id: 'fiveWhys', label: lang === 'ru' ? '5 Почему' : lang === 'en' ? '5 Whys' : '5 Чому' },
    { id: 'goalMakers', label: lang === 'ru' ? 'Цель Героя' : lang === 'en' ? 'Hero\'s Goal' : 'Мета Героя' },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-2 sm:p-4 pb-36 sm:pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-700 dark:text-teal-400">
            <Bookmark className="h-3.5 w-3.5" />
            {lang === 'ru'
              ? 'Личное Пространство Саморефлексии'
              : lang === 'en'
              ? 'Personal Self-Reflection Space'
              : 'Особистий Простір Саморефлексії'}
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            {lang === 'ru'
              ? 'Мой Психологический Дневник'
              : lang === 'en'
              ? 'My Psychological Journal & History'
              : 'Мій Психологічний Щоденник'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
            {lang === 'ru'
              ? 'Сохраненные сессии консилиумов, тесты Юнга, дневники КПТ, квесты и статистика практик за 7 дней.'
              : lang === 'en'
              ? 'Saved consilium sessions, Jung associations, CBT entries, and coaching quests with 7-day practice analytics.'
              : 'Збережені сесії консиліумів, тести Юнга, щоденники КПТ, квести та статистика практик за 7 днів.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
              showChart
                ? 'border-teal-500/40 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>
              {showChart
                ? lang === 'ru'
                  ? 'Скрыть график'
                  : lang === 'en'
                  ? 'Hide Chart'
                  : 'Сховати графік'
                : lang === 'ru'
                ? 'Показать график'
                : lang === 'en'
                ? 'Show Chart'
                : 'Показати графік'}
            </span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'Экспорт' : lang === 'en' ? 'Export' : 'Експорт'}</span>
          </button>
          <label className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-3.5 py-2 text-xs font-medium text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer">
            <Upload className="h-3.5 w-3.5" />
            <span>{lang === 'ru' ? 'Импорт' : lang === 'en' ? 'Import' : 'Імпорт'}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
      </div>

      {/* User / Google Authentication Status Card */}
      {currentUser ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-100/90 dark:bg-stone-900/90 shadow-xs">
            <div className="flex items-center gap-3">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border border-teal-500/40 shadow-xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center font-bold text-sm">
                  {(currentUser.name || currentUser.login).slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {currentUser.fullName || currentUser.name}
                  </span>
                  {currentUser.authProvider === 'google' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" /> Google Авторизація
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {currentUser.email || currentUser.login} • {lang === 'ru' ? 'Изолированный личный журнал' : 'Ізольований особистий журнал'} ({entries.length} {entries.length === 1 ? (lang === 'ru' ? 'запись' : 'запис') : (lang === 'ru' ? 'записей' : 'записів')})
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncState.isSyncing}
                title="Синхронізація між ПК, телефоном та ноутбуком"
                className="px-3 py-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-700 dark:text-teal-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin text-teal-500' : ''}`} />
                <span>
                  {syncState.isSyncing
                    ? lang === 'ru'
                      ? 'Синхронизация...'
                      : 'Синхронізація...'
                    : lang === 'ru'
                    ? 'Синхронизировать'
                    : 'Синхронізувати'}
                </span>
              </button>

              {onOpenProfileModal && (
                <button
                  type="button"
                  onClick={onOpenProfileModal}
                  className="px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 text-xs font-medium cursor-pointer transition-colors"
                >
                  {lang === 'ru' ? 'Профиль / Сменить' : 'Профіль / Змінити'}
                </button>
              )}
            </div>
          </div>

          {/* Cross-Device Cloud Sync Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-teal-950/20 dark:bg-teal-950/35 border border-teal-500/30 text-xs text-teal-800 dark:text-teal-300">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-teal-500 shrink-0" />
              <span>
                {lang === 'ru'
                  ? `Синхронизация активна: ПК ↔ Ноутбук ↔ Телефон (${currentUser.email || currentUser.login})`
                  : `Синхронізація активна: ПК ↔ Ноутбук ↔ Телефон (${currentUser.email || currentUser.login})`}
              </span>
            </div>
            {syncState.lastSyncedAt && (
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                {lang === 'ru' ? 'Хмара оновлена: ' : 'Хмару оновлено: '}
                {new Date(syncState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-teal-500/40 bg-teal-950/20 dark:bg-teal-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white text-stone-900 shadow-sm shrink-0">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {lang === 'ru'
                  ? 'Авторизуйтесь через Google, чтобы вести личный журнал'
                  : lang === 'en'
                  ? 'Sign in with Google to maintain your private journal'
                  : 'Авторизуйтесь через Google, щоб вести власний приватний журнал'}
              </h4>
              <p className="text-[11px] text-stone-600 dark:text-stone-400">
                {lang === 'ru'
                  ? 'Каждый пользователь ведет свой отдельный защищенный журнал без смешивания записей'
                  : 'Кожен користувач веде свій окремий захищений журнал без змішування записів'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoogleQuickAuth}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'Войти через Google' : lang === 'en' ? 'Sign in with Google' : 'Увійти через Google'}</span>
          </button>
        </div>
      )}

      {toastMessage && (
        <div className="rounded-xl border border-teal-500/30 bg-teal-50 dark:bg-teal-950/60 px-4 py-2.5 text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-teal-600 dark:text-teal-400 hover:opacity-75">✕</button>
        </div>
      )}

      {/* 7-Day Recharts Data Visualization Component */}
      {showChart && (
        <JournalStatsChart entries={entries} />
      )}

      {/* Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {filterTabs.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                selectedType === type.id
                  ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/50'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400 dark:text-stone-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'en' ? 'Search journal entries...' : 'Пошук у журналі...'}
            className="w-full rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 pl-9 pr-4 py-2 text-xs text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:border-teal-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Empty State or 2-column Layout */}
      {entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 p-12 text-center space-y-4">
          <Bookmark className="mx-auto h-12 w-12 text-stone-400 dark:text-stone-600" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200">
              {lang === 'en' ? 'Your psychological journal is empty' : 'Ваш психологічний журнал поки що порожній'}
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
              {lang === 'en'
                ? 'Describe a situation in the Consilium, complete the 16 Jung associations, or save a CBT record to track your daily progress.'
                : 'Опишіть ситуацію у Консиліумі, пройдіть тест 16 асоціацій або створіть КПТ-запис — і результати з’являться тут.'}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onNavigateToTool('consilium')}
              className="rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 transition-colors"
            >
              {lang === 'en' ? 'Launch Consilium' : 'Запустити Консиліум'}
            </button>
            <button
              onClick={() => onNavigateToTool('associations16')}
              className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors"
            >
              {lang === 'en' ? '16 Associations Test' : 'Тест 16 Асоціацій'}
            </button>
            <button
              onClick={() => onNavigateToTool('goalMakers')}
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-stone-950 hover:bg-amber-400 transition-colors"
            >
              {lang === 'en' ? 'Hero\'s Goal Game' : 'Гра «Мета Героя»'}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of entries */}
          <div className="lg:col-span-5 space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredEntries.length === 0 ? (
              <div className="rounded-xl border border-stone-200 dark:border-stone-800 p-6 text-center text-xs text-stone-500">
                {lang === 'en' ? 'No entries match your search' : 'Не знайдено записів за цим фільтром'}
              </div>
            ) : (
              filteredEntries.map((entry) => {
                const isSelected = selectedEntry?.id === entry.id;
                const badge = getTypeBadge(entry.type);
                const dateFormatted = new Date(entry.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'uk-UA', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`rounded-xl border p-4 text-left transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'border-teal-500/50 bg-teal-50/40 dark:bg-stone-900 shadow-sm ring-1 ring-teal-500/30'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/60 hover:bg-stone-50 dark:hover:bg-stone-900 hover:border-stone-300 dark:hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-stone-400 dark:text-stone-500 text-[11px] shrink-0">
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span className="whitespace-nowrap">{dateFormatted}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(entry.id, e)}
                          title={lang === 'ru' ? 'Удалить' : lang === 'en' ? 'Delete' : 'Видалити'}
                          className="hover:text-rose-500 p-1 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 line-clamp-1">{entry.title}</h4>
                    <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Detailed View */}
          <div className="lg:col-span-7">
            {selectedEntry ? (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-4">
                  <div className="space-y-1">
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        getTypeBadge(selectedEntry.type).color
                      }`}
                    >
                      {getTypeBadge(selectedEntry.type).label}
                    </span>
                    <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 font-serif">
                      {selectedEntry.title}
                    </h3>
                  </div>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {new Date(selectedEntry.date).toLocaleString(lang === 'en' ? 'en-US' : 'uk-UA')}
                  </span>
                </div>

                <div className="rounded-xl bg-stone-50 dark:bg-stone-950 p-4 border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                  <strong className="text-teal-600 dark:text-teal-400 block font-semibold">
                    {lang === 'en' ? 'Session Summary:' : 'Короткий підсумок:'}
                  </strong>
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">{selectedEntry.summary}</p>
                </div>

                {/* Type specific details */}
                {selectedEntry.type === 'consilium' && selectedEntry.data?.analysis && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-1">
                      <strong className="text-amber-700 dark:text-amber-300 block">
                        {lang === 'en' ? 'Core Dilemma & Conflict:' : 'Глибинний конфлікт:'}
                      </strong>
                      <p className="text-stone-800 dark:text-stone-200">{selectedEntry.data.analysis.coreDilemma}</p>
                    </div>

                    {selectedEntry.data.analysis.goalMakersActionPlan && (
                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 space-y-2">
                        <strong className="text-teal-700 dark:text-teal-300 block">
                          {lang === 'en' ? 'Hero\'s Goal Action Plan:' : 'План дій «Мета Героя»:'}
                        </strong>
                        <div>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">24h: </span>
                          <span className="text-stone-700 dark:text-stone-300">
                            {selectedEntry.data.analysis.goalMakersActionPlan.immediate24hStep}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.type === 'associations16' && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-purple-500/40 bg-purple-50 dark:bg-purple-950/20 p-4 text-center">
                      <span className="text-[11px] text-purple-700 dark:text-purple-300 block">
                        {lang === 'en' ? 'Final Subconscious Key:' : 'Фінальний ключ несвідомого:'}
                      </span>
                      <div className="text-xl font-bold text-stone-900 dark:text-stone-100 mt-1">
                        «{selectedEntry.data.layer5}»
                      </div>
                    </div>
                  </div>
                )}

                {selectedEntry.type === 'cbt' && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4 space-y-1">
                      <strong className="text-rose-600 dark:text-rose-400 block">
                        {lang === 'en' ? 'Automatic Thought:' : 'Автоматична думка:'}
                      </strong>
                      <p className="text-stone-700 dark:text-stone-300">{selectedEntry.data.automaticThought}</p>
                    </div>
                    {selectedEntry.data.rationalAlternative && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 p-4 space-y-1">
                        <strong className="text-emerald-700 dark:text-emerald-300 block">
                          {lang === 'en' ? 'Rational Alternative:' : 'Раціональна альтернатива:'}
                        </strong>
                        <p className="text-stone-800 dark:text-stone-200">{selectedEntry.data.rationalAlternative}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.type === 'nvcEq' && selectedEntry.data && (
                  <div className="space-y-3 text-xs">
                    {selectedEntry.data.nvcCompletePhrasing && (
                      <div className="rounded-xl border border-violet-500/40 bg-violet-50 dark:bg-violet-950/20 p-4 space-y-1">
                        <strong className="text-violet-700 dark:text-violet-300 block text-xs">
                          {lang === 'en' ? 'Giraffe Language Formulation:' : 'Формула Ненасильницької Комунікації (Мова Жирафа):'}
                        </strong>
                        <p className="text-stone-800 dark:text-stone-200 text-sm font-medium italic">
                          «{selectedEntry.data.nvcCompletePhrasing}»
                        </p>
                      </div>
                    )}

                    {selectedEntry.data.nvc4Steps && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="rounded-lg bg-stone-50 dark:bg-stone-950 p-2.5 border border-stone-200 dark:border-stone-800">
                          <span className="font-bold text-sky-600 block text-[10px] uppercase">1. Спостереження:</span>
                          <span className="text-stone-700 dark:text-stone-300 text-[11px]">{selectedEntry.data.nvc4Steps.observation}</span>
                        </div>
                        <div className="rounded-lg bg-stone-50 dark:bg-stone-950 p-2.5 border border-stone-200 dark:border-stone-800">
                          <span className="font-bold text-rose-600 block text-[10px] uppercase">2. Почуття:</span>
                          <span className="text-stone-700 dark:text-stone-300 text-[11px]">{selectedEntry.data.nvc4Steps.feeling}</span>
                        </div>
                        <div className="rounded-lg bg-stone-50 dark:bg-stone-950 p-2.5 border border-stone-200 dark:border-stone-800">
                          <span className="font-bold text-amber-600 block text-[10px] uppercase">3. Потреба:</span>
                          <span className="text-stone-700 dark:text-stone-300 text-[11px]">{selectedEntry.data.nvc4Steps.need}</span>
                        </div>
                        <div className="rounded-lg bg-stone-50 dark:bg-stone-950 p-2.5 border border-stone-200 dark:border-stone-800">
                          <span className="font-bold text-emerald-600 block text-[10px] uppercase">4. Прохання:</span>
                          <span className="text-stone-700 dark:text-stone-300 text-[11px]">{selectedEntry.data.nvc4Steps.request}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.type === 'wheelOfBalance' && selectedEntry.data && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 p-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                          {lang === 'en' ? 'Systemic Balance Index:' : 'Індекс життєвого балансу:'}
                        </span>
                        <h4 className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                          {selectedEntry.data.balanceIndex}%
                        </h4>
                      </div>
                      {selectedEntry.data.aiAnalysis?.leverageSphere && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                            {lang === 'en' ? 'Leverage Pivot:' : 'Сфера-важіль:'}
                          </span>
                          <span className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                            {selectedEntry.data.aiAnalysis.leverageSphere}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedEntry.data.aiAnalysis?.systemicDiagnosis && (
                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-4">
                        <strong className="text-stone-800 dark:text-stone-200 block mb-1">
                          {lang === 'en' ? 'Diagnosis:' : 'Системний діагноз:'}
                        </strong>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {selectedEntry.data.aiAnalysis.systemicDiagnosis}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.type === 'goalMakers' && selectedEntry.data?.quests && (
                  <div className="space-y-2 text-xs">
                    <strong className="text-amber-600 dark:text-amber-400 block">
                      {lang === 'en' ? 'Quest List:' : 'Список квестів подорожі:'}
                    </strong>
                    <div className="space-y-1.5">
                      {selectedEntry.data.quests.map((q: any) => (
                        <div
                          key={q.id}
                          className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-2.5"
                        >
                          <span className={q.completed ? 'line-through text-stone-400 dark:text-stone-500' : 'text-stone-800 dark:text-stone-200'}>
                            {q.title}
                          </span>
                          <span className="text-amber-600 dark:text-amber-400 font-mono text-[11px]">+{q.rewardPoints} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.type === 'hundredWishes' && selectedEntry.data && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">
                          {lang === 'ru' ? 'Всего желаний:' : 'Всього бажань:'}
                        </span>
                        <h4 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                          {selectedEntry.data.wishes?.length || 0} / 100
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300">
                          {lang === 'ru' ? 'Исполнено:' : 'Здійснено:'}
                        </span>
                        <span className="block text-sm font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedEntry.data.wishes?.filter((w: any) => w.status === 'completed').length || 0}
                        </span>
                      </div>
                    </div>

                    {selectedEntry.data.aiAnalysis?.summary && (
                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3.5 space-y-1">
                        <strong className="text-stone-800 dark:text-stone-200 block text-xs">
                          {lang === 'ru' ? 'ШИ-Анализ структуры желаний:' : 'ШІ-Аналіз структури бажань:'}
                        </strong>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs">
                          {selectedEntry.data.aiAnalysis.summary}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                      <strong className="text-stone-700 dark:text-stone-300 block text-[11px] uppercase">
                        {lang === 'ru' ? 'Список записанных желаний:' : 'Список записаних бажань:'}
                      </strong>
                      {selectedEntry.data.wishes?.map((w: any) => (
                        <div
                          key={w.id}
                          className="flex items-center justify-between rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-2 text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-stone-400 font-bold">#{w.number}</span>
                            <span className={w.status === 'completed' ? 'line-through text-stone-400' : 'text-stone-800 dark:text-stone-200'}>
                              {w.text}
                            </span>
                          </div>
                          <span className="text-rose-500 font-bold shrink-0">{w.energyScore}/10</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedEntry.type === 'selfReflection' && selectedEntry.data && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-teal-500/30 bg-teal-50/40 dark:bg-teal-950/20 p-3.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300">
                          {lang === 'ru' ? 'Энергия & Настроение:' : 'Енергія & Настрій:'}
                        </span>
                        <h4 className="text-sm font-bold text-teal-900 dark:text-teal-100">
                          {selectedEntry.data.energyScore}/10 ⚡ | {selectedEntry.data.moodScore}/10 ✨
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-stone-500">
                          {lang === 'ru' ? 'Эмоции:' : 'Емоції:'}
                        </span>
                        <span className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                          {selectedEntry.data.primaryEmotions?.join(', ')}
                        </span>
                      </div>
                    </div>

                    {selectedEntry.data.aiSupervisorFeedback?.summary && (
                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3.5 space-y-1">
                        <strong className="text-teal-700 dark:text-teal-400 block text-xs">
                          {lang === 'ru' ? 'Отклик супервизора:' : 'Відгук супервізора:'}
                        </strong>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed text-xs">
                          {selectedEntry.data.aiSupervisorFeedback.summary}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.type === 'smartGoals' && selectedEntry.data && (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-3.5">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                          {lang === 'ru' ? 'Категория цели:' : 'Категорія цілі:'}
                        </span>
                        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-100">
                          {selectedEntry.data.title}
                        </h4>
                      </div>
                      {selectedEntry.data.deadline && (
                        <div className="text-right">
                          <span className="text-[10px] font-bold uppercase text-stone-500">
                            {lang === 'ru' ? 'Дедлайн:' : 'Дедлайн:'}
                          </span>
                          <span className="block text-xs font-bold text-rose-600 dark:text-rose-400">
                            {selectedEntry.data.deadline}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-lg bg-stone-50 dark:bg-stone-950 p-2.5 border border-stone-200 dark:border-stone-800">
                        <strong className="text-stone-700 dark:text-stone-300 block text-[10px] uppercase">S (Конкретика):</strong>
                        <p className="text-stone-600 dark:text-stone-400">{selectedEntry.data.specific || '—'}</p>
                      </div>
                      <div className="rounded-lg bg-stone-50 dark:bg-stone-950 p-2.5 border border-stone-200 dark:border-stone-800">
                        <strong className="text-stone-700 dark:text-stone-300 block text-[10px] uppercase">M (Метрики):</strong>
                        <p className="text-stone-600 dark:text-stone-400">{selectedEntry.data.measurable || '—'}</p>
                      </div>
                    </div>

                    {selectedEntry.data.first72hStep && (
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 p-2.5">
                        <strong className="text-emerald-700 dark:text-emerald-300 block text-[10px] uppercase">
                          {lang === 'ru' ? 'Первый шаг (72ч):' : 'Перший мікрокрок (72 год):'}
                        </strong>
                        <p className="text-stone-800 dark:text-stone-200 font-medium">{selectedEntry.data.first72hStep}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedEntry.type === 'preMortem' && selectedEntry.data && (
                  <div className="space-y-3 text-xs">
                    <div className="rounded-xl border border-rose-500/30 bg-rose-50/40 dark:bg-rose-950/20 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-rose-700 dark:text-rose-300">
                          {lang === 'en' ? 'Disaster Horizon & Expert Role:' : 'Горизонт краху та роль експерта:'}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-800 dark:text-rose-300 font-mono text-[11px] font-bold">
                          {selectedEntry.data.targetHorizon || '6 місяців'}
                        </span>
                      </div>
                      <p className="text-stone-800 dark:text-stone-200 font-medium">
                        {selectedEntry.data.expertPersona}
                      </p>
                    </div>

                    {selectedEntry.data.firstEarlyRedFlag && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-50/40 dark:bg-amber-950/20 p-3 space-y-1">
                        <strong className="text-amber-700 dark:text-amber-300 block text-[11px] uppercase font-bold">
                          ⚠️ {lang === 'en' ? 'First Ignored Red Flag:' : 'Перший проігнорований дзвіночок:'}
                        </strong>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {selectedEntry.data.firstEarlyRedFlag}
                        </p>
                      </div>
                    )}

                    {selectedEntry.data.mostDangerousFailure && (
                      <div className="rounded-xl border border-red-600/40 bg-red-50/40 dark:bg-red-950/30 p-3.5 space-y-1.5">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-[11px] uppercase">
                          <span>☠️ Смертельний провал #{selectedEntry.data.mostDangerousFailure.causeNumber}: {selectedEntry.data.mostDangerousFailure.title}</span>
                        </div>
                        <p className="text-stone-700 dark:text-stone-300 text-xs">
                          {selectedEntry.data.mostDangerousFailure.whyDeadliest}
                        </p>
                      </div>
                    )}

                    {selectedEntry.data.biggestHiddenAssumption && (
                      <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-3.5 space-y-1 text-xs">
                        <strong className="text-stone-800 dark:text-stone-200 block text-[11px]">
                          💥 Сліпе допущення: <span className="font-normal">{selectedEntry.data.biggestHiddenAssumption.assumption}</span>
                        </strong>
                        <p className="text-rose-600 dark:text-rose-400 font-medium">
                          Тотальний із'ян: {selectedEntry.data.biggestHiddenAssumption.fatalFlawDiagnosis}
                        </p>
                      </div>
                    )}

                    {selectedEntry.data.failureCauses && (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        <strong className="text-stone-700 dark:text-stone-300 block text-[11px] uppercase">
                          Причини краху та дедлайни:
                        </strong>
                        {selectedEntry.data.failureCauses.map((c: any) => (
                          <div
                            key={c.number}
                            className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 space-y-1"
                          >
                            <div className="flex items-center justify-between font-bold text-stone-800 dark:text-stone-200">
                              <span>#{c.number} {c.title}</span>
                              <span className="text-rose-500 text-[10px]">Тижд. {c.checkWeek}</span>
                            </div>
                            <p className="text-[11px] text-stone-600 dark:text-stone-400">
                              Сигнал: {c.earlyWarningSignal}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onNavigateToTool('preMortem')}
                        className="w-full py-2 rounded-xl bg-rose-600/15 hover:bg-rose-600/25 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold text-xs transition-all"
                      >
                        Перейти до практики Премортем →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/40 p-8 text-center text-xs text-stone-500">
                {lang === 'en' ? 'Select an entry on the left to view details' : 'Оберіть запис зі списку ліворуч для перегляду деталей'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
