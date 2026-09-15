import React, { useState, useEffect } from 'react';
import {
  Bell,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Play,
  HeartHandshake,
  FileText,
  Compass,
  Swords,
  PieChart,
  Dice6,
} from 'lucide-react';
import {
  PracticeReminderConfig,
  getReminderConfig,
  saveReminderConfig,
  playSereneChime,
  sendBrowserNotification,
} from '../services/reminderService';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { TabType } from './Navbar';

interface PracticeReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToPractice?: (tab: TabType) => void;
  onTriggerNotificationBanner?: (title: string, message: string, tab: TabType) => void;
}

export const PracticeReminderModal: React.FC<PracticeReminderModalProps> = ({
  isOpen,
  onClose,
  onNavigateToPractice,
  onTriggerNotificationBanner,
}) => {
  const { lang, t } = useThemeLanguage();
  const [config, setConfig] = useState<PracticeReminderConfig>(getReminderConfig());
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [testSent, setTestSent] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const practices = [
    {
      id: 'affirmations',
      titleUk: 'Афірмації Дня',
      titleEn: 'Daily Affirmations',
      descUk: 'Ранкові ментальні якорі та психологічна опора',
      descEn: 'Morning mental anchors and psychological grounding',
      icon: Sparkles,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      tab: 'affirmations' as TabType,
    },
    {
      id: 'grounding',
      titleUk: 'SOS Заземлення',
      titleEn: 'SOS Grounding',
      descUk: 'Дихання 4-4-4-4, техніка 5-4-3-2-1 та зняття тривоги',
      descEn: 'Box breathing 4-4-4-4, 5-4-3-2-1 somatic calming',
      icon: HeartHandshake,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
      tab: 'consilium' as TabType, // launches grounding modal
    },
    {
      id: 'cbt',
      titleUk: 'КПТ Щоденник Думок',
      titleEn: 'CBT Thought Diary',
      descUk: 'Аналіз тригерів, когнітивних викривлень та факт-чек',
      descEn: 'Trigger analysis, cognitive distortions & fact check',
      icon: FileText,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/30',
      tab: 'cbt' as TabType,
    },
    {
      id: 'consilium',
      titleUk: 'Консиліум: Розбір дилеми',
      titleEn: 'Consilium: Dilemma Analysis',
      descUk: 'Глибинний аналіз ситуації 8 школами психотерапії',
      descEn: 'Deep situation inquiry across 8 therapy schools',
      icon: Compass,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/30',
      tab: 'consilium' as TabType,
    },
    {
      id: 'goalMakersBoard',
      titleUk: 'Goal MAker$ (Гра-тренінг)',
      titleEn: 'Goal MAker$ Board Game',
      descUk: 'Конфайнмент-моделювання, 9 секторів, кубик та банк монет',
      descEn: 'Confinement modeling, 9 sectors, dice & token economy',
      icon: Dice6,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
      tab: 'goalMakersBoard' as TabType,
    },
    {
      id: 'goalMakers',
      titleUk: 'Мета Героя',
      titleEn: 'Hero\'s Goal',
      descUk: 'Коучингові кроки 24г / 7д та подолання саботерів',
      descEn: '24h / 7d coaching milestones and saboteur overcome',
      icon: Swords,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
      tab: 'goalMakers' as TabType,
    },
    {
      id: 'wheelOfBalance',
      titleUk: 'Колесо Балансу',
      titleEn: 'Wheel of Balance',
      descUk: 'Діагностика 8 сфер життя та пошук точки-важеля',
      descEn: '8 life spheres diagnostic and leverage pivot point',
      icon: PieChart,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
      tab: 'wheelOfBalance' as TabType,
    },
  ];

  const handleRequestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setPermissionStatus(res);
      if (res === 'granted') {
        setConfig((prev) => ({ ...prev, browserNotificationsEnabled: true }));
      }
    }
  };

  const handleTestChime = () => {
    playSereneChime();
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    if (config.soundEnabled) {
      playSereneChime();
    }

    const currentPrac = practices.find((p) => p.id === config.practiceType);
    const title =
      lang === 'en'
        ? `🔔 Practice Time: ${currentPrac?.titleEn || 'Psychological Practice'}`
        : `🔔 Час для практики: ${currentPrac?.titleUk || 'Психологічна практика'}`;
    const body =
      config.customMessage ||
      (lang === 'en'
        ? 'Take a gentle mindful breath and reconnect with your inner compass.'
        : 'Зробіть спокійний вдих та поверніться до свого внутрішнього центру.');

    if (config.browserNotificationsEnabled) {
      await sendBrowserNotification(title, body);
    }

    if (onTriggerNotificationBanner && currentPrac) {
      onTriggerNotificationBanner(title, body, currentPrac.tab);
    }

    setTimeout(() => setTestSent(false), 3000);
  };

  const handleSave = () => {
    saveReminderConfig(config);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-6 shadow-2xl space-y-5 text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/30">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight font-serif">
                {lang === 'en' ? 'Practice Reminders & Notifications' : 'Сповіщення та Нагадування про Практики'}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {lang === 'en'
                  ? 'Build regular habits for emotional stability and self-coaching'
                  : 'Створюйте стабільну звичку емоційної гігієни та самокоучингу'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Master Toggle */}
        <div className="flex items-center justify-between rounded-xl bg-stone-50 dark:bg-stone-950 p-3.5 border border-stone-200 dark:border-stone-800">
          <div className="space-y-0.5">
            <span className="text-xs sm:text-sm font-semibold">
              {lang === 'en' ? 'Daily Practice Reminders' : 'Щоденні сповіщення про практики'}
            </span>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {config.enabled
                ? lang === 'en'
                  ? 'Reminders are active at your chosen time'
                  : 'Нагадування активні у встановлений час'
                : lang === 'en'
                ? 'Reminders are turned off'
                : 'Нагадування тимчасово вимкнено'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setConfig((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              config.enabled ? 'bg-teal-600' : 'bg-stone-300 dark:bg-stone-700'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                config.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Practice Selection */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            {lang === 'en' ? 'Choose Primary Practice:' : 'Оберіть пріоритетну практику для нагадування:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {practices.map((p) => {
              const Icon = p.icon;
              const isSelected = config.practiceType === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, practiceType: p.id as any }))}
                  className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-teal-500 bg-teal-500/10 shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 hover:border-stone-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${p.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold truncate">
                        {lang === 'en' ? p.titleEn : p.titleUk}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 leading-tight">
                      {lang === 'en' ? p.descEn : p.descUk}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Setting & Presets */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              {lang === 'en' ? 'Reminder Time:' : 'Час сповіщення:'}
            </label>
            <div className="flex gap-1">
              {['08:30', '13:00', '20:00'].map((presetTime) => (
                <button
                  key={presetTime}
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, time: presetTime }))}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-medium border cursor-pointer ${
                    config.time === presetTime
                      ? 'border-teal-500 bg-teal-500/20 text-teal-700 dark:text-teal-300'
                      : 'border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {presetTime}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="time"
                value={config.time}
                onChange={(e) => setConfig((prev) => ({ ...prev, time: e.target.value }))}
                className="w-full rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 pl-9 pr-3.5 py-2 text-xs font-semibold text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Options: Sound & Browser Push */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-2.5">
            <div className="flex items-center gap-2">
              {config.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-stone-400" />
              )}
              <span className="text-xs font-medium">
                {lang === 'en' ? 'Singing Bowl Chime' : 'Гармонійний гонг (528 Hz)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleTestChime}
                className="rounded-md bg-stone-200 dark:bg-stone-800 p-1 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                title={lang === 'en' ? 'Play sound test' : 'Прослухати звук'}
              >
                <Play className="h-3 w-3 fill-current" />
              </button>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => setConfig((prev) => ({ ...prev, soundEnabled: e.target.checked }))}
                className="h-4 w-4 rounded-sm border-stone-300 text-teal-600 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Browser Notification Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 p-2.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-medium">
                {lang === 'en' ? 'Browser Push' : 'Push-сповіщення'}
              </span>
            </div>
            {permissionStatus === 'granted' ? (
              <input
                type="checkbox"
                checked={config.browserNotificationsEnabled}
                onChange={(e) =>
                  setConfig((prev) => ({
                    ...prev,
                    browserNotificationsEnabled: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded-sm border-stone-300 text-teal-600 focus:ring-teal-500"
              />
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="rounded-md bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-teal-500 cursor-pointer"
              >
                {lang === 'en' ? 'Enable' : 'Увімкнути'}
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={handleSendTestNotification}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 px-3.5 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer transition-colors"
          >
            <Bell className="h-3.5 w-3.5 text-amber-500" />
            <span>{testSent ? (lang === 'en' ? 'Notification Sent!' : 'Сповіщення надіслано!') : (lang === 'en' ? 'Send Test Reminder' : 'Надіслати тестове сповіщення')}</span>
          </button>

          <div className="flex w-full sm:w-auto items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto rounded-xl border border-stone-300 dark:border-stone-700 px-4 py-2 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              {t('btn_cancel', 'Скасувати')}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-500 shadow-md cursor-pointer transition-all active:scale-95"
            >
              {savedFeedback ? <Check className="h-3.5 w-3.5" /> : null}
              <span>{savedFeedback ? t('btn_saved', 'Збережено!') : t('btn_save', 'Зберегти налаштування')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
