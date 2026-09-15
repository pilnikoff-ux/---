import React from 'react';
import {
  Compass,
  Layers,
  Grid2X2,
  HelpCircle,
  FileText,
  Swords,
  BookOpen,
  BookmarkCheck,
  HeartHandshake,
  MessageSquareHeart,
  PieChart,
  Sparkles,
  Sun,
  Moon,
  Globe,
  Bell,
  Dice6,
  Crown,
  Target,
  Brain,
  MessageSquarePlus,
  UserCheck,
  Smartphone,
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { PWAInstallButton } from './PWAInstallButton';
import { getUserProfile } from '../services/userStatsService';

export type TabType =
  | 'consilium'
  | 'hundredWishes'
  | 'selfReflection'
  | 'smartGoals'
  | 'archetypes'
  | 'values'
  | 'beliefs'
  | 'goalMakersBoard'
  | 'goalMakers'
  | 'affirmations'
  | 'cbt'
  | 'associations16'
  | 'descartes'
  | 'fiveWhys'
  | 'nvcEq'
  | 'wheelOfBalance'
  | 'feedback'
  | 'knowledge'
  | 'journal';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab?: (tab: TabType) => void;
  setActiveTab?: (tab: TabType) => void;
  onOpenGrounding?: () => void;
  onOpenSomaticModal?: () => void;
  onOpenReminders?: () => void;
  onOpenProfileModal?: () => void;
  journalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  setActiveTab,
  onOpenGrounding,
  onOpenSomaticModal,
  onOpenReminders,
  onOpenProfileModal,
  journalCount,
}) => {
  const { theme, toggleTheme, lang, setLang, t } = useThemeLanguage();
  const currentUser = getUserProfile();

  const handleSelect = (tab: TabType) => {
    if (onSelectTab) {
      onSelectTab(tab);
    } else if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  const handleOpenGrounding = () => {
    if (onOpenGrounding) {
      onOpenGrounding();
    } else if (onOpenSomaticModal) {
      onOpenSomaticModal();
    }
  };

  interface NavItem {
    id: TabType;
    label: string;
    desc: string;
    icon: React.ElementType;
    accentColor: string;
    activeBg: string;
    dotColor: string;
    badge?: number;
  }

  const navItems: NavItem[] = [
    {
      id: 'consilium',
      label: t('tab_consilium', 'Консиліум'),
      desc: t('tab_consilium_desc', 'Інтегративний консиліум шкіл психології'),
      icon: Compass,
      accentColor: 'text-teal-500',
      activeBg: 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-400 font-bold',
      dotColor: 'bg-teal-500',
    },
    {
      id: 'hundredWishes',
      label: lang === 'ru' ? '100 Желаний' : lang === 'en' ? '100 Wishes' : '100 Бажань',
      desc: lang === 'ru' ? 'Практика 100 желаний и распаковка РАС' : lang === 'en' ? '100 Desires Practice & RAS Awakening' : 'Практика 100 бажань та зняття цензури',
      icon: Sparkles,
      accentColor: 'text-amber-500',
      activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'selfReflection',
      label: lang === 'ru' ? 'Саморефлексия' : lang === 'en' ? 'Self-Reflection' : 'Саморефлексія',
      desc: lang === 'ru' ? 'Стоицизм, Цикл Гиббса и KPT-аудит дня' : lang === 'en' ? 'Stoic evening, Gibbs cycle & life review' : 'Стоїчна вечірня рефлексія та цикл Гіббса',
      icon: Brain,
      accentColor: 'text-teal-500',
      activeBg: 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-400 font-bold',
      dotColor: 'bg-teal-500',
    },
    {
      id: 'smartGoals',
      label: lang === 'ru' ? 'Цілі по SMART' : lang === 'en' ? 'SMART Goals' : 'Цілі по SMART',
      desc: lang === 'ru' ? 'SMART + WOOP ментальный контрастинг и 72ч' : lang === 'en' ? 'SMART criteria, WOOP & 72h momentum' : 'SMART + WOOP ментальний контрастинг та 72 год',
      icon: Target,
      accentColor: 'text-rose-500',
      activeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold',
      dotColor: 'bg-rose-500',
    },
    {
      id: 'archetypes',
      label: lang === 'en' ? 'Archetypes' : 'Архетипи & Тінь',
      desc: lang === 'en' ? '12 Jungian Archetypes & Shadow Integration' : '12 Архетипів Юнга та інтеграція Тіні',
      icon: Crown,
      accentColor: 'text-purple-500',
      activeBg: 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-400 font-bold',
      dotColor: 'bg-purple-500',
    },
    {
      id: 'values',
      label: lang === 'en' ? 'Values & Drive' : 'Цінності',
      desc: lang === 'en' ? 'Schwartz Values & Motivation Diagnostic' : 'Діагностика цінностей Шварца та мотивації',
      icon: Target,
      accentColor: 'text-emerald-500',
      activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'beliefs',
      label: lang === 'en' ? 'Beliefs' : 'Переконання',
      desc: lang === 'en' ? 'Dilts Sleight of Mouth Belief Transformation' : 'Трансформація переконань Роберта Ділтса',
      icon: Brain,
      accentColor: 'text-indigo-500',
      activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-bold',
      dotColor: 'bg-indigo-500',
    },
    {
      id: 'goalMakersBoard',
      label: 'Goal MAker$',
      desc: lang === 'en' ? 'Confinement Training Board Game' : 'Настільна гра-тренінг «Goal MAker$»',
      icon: Dice6,
      accentColor: 'text-amber-500',
      activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'goalMakers',
      label: t('tab_goalMakers', 'Мета Героя'),
      desc: t('tab_goalMakers_desc', 'Коучинговий квест та дія за 24 години'),
      icon: Swords,
      accentColor: 'text-rose-500',
      activeBg: 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400 font-bold',
      dotColor: 'bg-rose-500',
    },
    {
      id: 'affirmations',
      label: lang === 'en' ? 'Affirmations' : 'Афірмації',
      desc: lang === 'en' ? 'Daily Psychological Anchors' : 'Щоденні афірмації та нейро-опори',
      icon: Sparkles,
      accentColor: 'text-amber-500',
      activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'cbt',
      label: t('tab_cbt', 'КПТ Щоденник'),
      desc: t('tab_cbt_desc', 'Когнітивно-поведінковий щоденник думок'),
      icon: FileText,
      accentColor: 'text-sky-500',
      activeBg: 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400 font-bold',
      dotColor: 'bg-sky-500',
    },
    {
      id: 'associations16',
      label: t('tab_associations16', '16 Асоціацій'),
      desc: t('tab_associations16_desc', 'Тест Сабухі Юнга на несвідомі установки'),
      icon: Layers,
      accentColor: 'text-indigo-500',
      activeBg: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-400 font-bold',
      dotColor: 'bg-indigo-500',
    },
    {
      id: 'descartes',
      label: t('tab_descartes', 'Декарт'),
      desc: t('tab_descartes_desc', 'Квадрат Декарта для прийняття рішень'),
      icon: Grid2X2,
      accentColor: 'text-emerald-500',
      activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'fiveWhys',
      label: t('tab_fiveWhys', '5 Чому'),
      desc: t('tab_fiveWhys_desc', 'Пошук першопричини за методом 5 Чому'),
      icon: HelpCircle,
      accentColor: 'text-amber-500',
      activeBg: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 font-bold',
      dotColor: 'bg-amber-500',
    },
    {
      id: 'nvcEq',
      label: t('tab_nvcEq', 'ННК & EQ'),
      desc: t('tab_nvcEq_desc', 'Ненасильницьке спілкування та емоційний інтелект'),
      icon: MessageSquareHeart,
      accentColor: 'text-violet-500',
      activeBg: 'bg-violet-500/15 border-violet-500/40 text-violet-600 dark:text-violet-400 font-bold',
      dotColor: 'bg-violet-500',
    },
    {
      id: 'wheelOfBalance',
      label: t('tab_wheelOfBalance', 'Баланс'),
      desc: t('tab_wheelOfBalance_desc', 'Колесо життєвого балансу'),
      icon: PieChart,
      accentColor: 'text-emerald-500',
      activeBg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold',
      dotColor: 'bg-emerald-500',
    },
    {
      id: 'feedback',
      label: lang === 'en' ? 'Feedback' : 'Зворотній звʼязок',
      desc: lang === 'en' ? 'Feedback & AI Self-Learning Engine' : 'Зворотній звʼязок та самонавчання ШІ',
      icon: MessageSquarePlus,
      accentColor: 'text-cyan-500',
      activeBg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600 dark:text-cyan-400 font-bold',
      dotColor: 'bg-cyan-500',
    },
    {
      id: 'journal',
      label: `${t('tab_journal', 'Журнал')}${journalCount > 0 ? ` (${journalCount})` : ''}`,
      desc: t('tab_journal_desc', 'Особистий журнал збережених сесій'),
      icon: BookmarkCheck,
      accentColor: 'text-fuchsia-500',
      activeBg: 'bg-fuchsia-500/15 border-fuchsia-500/40 text-fuchsia-600 dark:text-fuchsia-400 font-bold',
      dotColor: 'bg-fuchsia-500',
      badge: journalCount > 0 ? journalCount : undefined,
    },
  ];

  return (
    <header
      id="main-app-header"
      className="sticky top-0 z-40 w-full border-b border-stone-200 dark:border-stone-800 bg-stone-50/95 dark:bg-stone-950/95 backdrop-blur-md transition-colors duration-200 shadow-xs"
    >
      {/* Top Header Row: Brand, SOS, Profile, Feedback, Theme & Language toggles */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6">
        {/* Brand */}
        <div
          id="brand-logo-button"
          onClick={() => handleSelect('consilium')}
          className="flex cursor-pointer items-center gap-2 text-stone-900 dark:text-stone-100 transition hover:opacity-90 select-none"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 dark:bg-teal-500 text-stone-950 shadow-sm">
            <Compass className="h-4.5 w-4.5 text-white dark:text-stone-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-serif text-base sm:text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                {t('app_name', 'Психологічний Навігатор')}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-200/90 dark:bg-stone-800 text-teal-700 dark:text-teal-400 border border-teal-500/30">
                v1.0.2
              </span>
            </div>
            <span className="hidden sm:inline-block text-[10px] text-stone-500 dark:text-stone-400 leading-none">
              {t('app_subtitle', 'Консиліум шкіл та інструменти трансформації')} • Pilnikov Maksym Studio
            </span>
          </div>
        </div>

        {/* Right Controls: PWA Install, Profile, Reminders, SOS Grounding, Theme Toggle, Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Profile & Activity Stats */}
          {onOpenProfileModal && (
            <button
              id="profile-header-btn"
              type="button"
              onClick={onOpenProfileModal}
              className="flex items-center gap-1.5 rounded-lg bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-stone-200 transition-all hover:bg-stone-200 dark:hover:bg-stone-800 active:scale-95 whitespace-nowrap shadow-xs cursor-pointer"
              title={lang === 'ru' ? 'Личный профиль' : 'Особистий профіль'}
            >
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt=""
                  className="w-4 h-4 rounded-full object-cover border border-teal-500/50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <UserCheck className="h-4 w-4 text-indigo-500 shrink-0" />
              )}
              <span className="hidden md:inline text-xs">
                {currentUser?.name ? currentUser.name.split(' ')[0] : 'Профіль'}
              </span>
            </button>
          )}

          {/* Practice Reminders Button */}
          {onOpenReminders && (
            <button
              id="reminders-header-btn"
              type="button"
              onClick={onOpenReminders}
              className="flex items-center gap-1.5 rounded-lg bg-teal-500/10 dark:bg-teal-500/15 border border-teal-500/30 px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 transition-all hover:bg-teal-500/20 active:scale-95 whitespace-nowrap shadow-xs cursor-pointer"
              title={t('reminders_tooltip', 'Налаштувати щоденні сповіщення та нагадування про практики')}
            >
              <Bell className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="hidden md:inline text-xs">{t('reminders_btn', 'Нагадування')}</span>
            </button>
          )}

          {/* SOS Grounding Button */}
          <button
            id="sos-grounding-btn"
            type="button"
            onClick={handleOpenGrounding}
            className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 transition-all hover:bg-amber-500/20 active:scale-95 whitespace-nowrap shadow-xs cursor-pointer"
            title={t('sos_grounding_tooltip')}
          >
            <HeartHandshake className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
            <span className="hidden xs:inline sm:inline text-xs">{t('sos_grounding', 'SOS Заземлення')}</span>
          </button>

          {/* Theme Switcher Toggle */}
          <button
            id="theme-toggle-btn"
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center h-8 w-8 sm:w-auto sm:px-2.5 sm:gap-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 hover:text-stone-950 dark:hover:text-white transition-all text-xs font-medium cursor-pointer"
            title={theme === 'dark' ? t('theme_light', 'Світла тема') : t('theme_dark', 'Темна тема')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="hidden md:inline text-xs">{t('theme_light', 'Світла')}</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="hidden md:inline text-xs">{t('theme_dark', 'Темна')}</span>
              </>
            )}
          </button>

          {/* 3-Language Switcher (UA | RU | EN) */}
          <div
            id="lang-selector-group"
            className="flex items-center rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 p-0.5 shadow-xs"
            role="group"
            aria-label="Language selection"
          >
            {(['ua', 'ru', 'en'] as const).map((l) => {
              const isCurrent = lang === l;
              return (
                <button
                  key={l}
                  id={`lang-btn-${l}`}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-md text-[11px] font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                    isCurrent
                      ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-stone-950 shadow-xs scale-100'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-white hover:bg-stone-200/70 dark:hover:bg-stone-800/70'
                  }`}
                  title={
                    l === 'ua'
                      ? 'Українська мова'
                      : l === 'ru'
                      ? 'Русский язык'
                      : 'English language'
                  }
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel with ALL MODULES: Non-scrolling wrapped responsive tab bar */}
      <div className="border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-100/90 dark:bg-stone-900/90 px-2 sm:px-4 py-1.5 shadow-xs">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                type="button"
                onClick={() => handleSelect(item.id as TabType)}
                title={item.desc}
                className={`group relative flex items-center gap-1 sm:gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-center transition-all duration-150 cursor-pointer border whitespace-nowrap ${
                  isActive
                    ? `${item.activeBg} font-bold shadow-xs`
                    : 'border-transparent text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-800/80 hover:text-stone-950 dark:hover:text-white'
                }`}
              >
                {/* Icon with themed accent */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon
                    className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-150 group-hover:scale-110 ${
                      isActive ? 'scale-105' : item.accentColor
                    }`}
                  />
                  {item.badge !== undefined && (
                    <span className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-fuchsia-600 px-0.5 text-[9px] font-bold text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span className="text-[11px] sm:text-xs tracking-tight leading-tight font-medium">
                  {item.label}
                </span>

                {/* Active dot indicator */}
                {isActive && (
                  <span
                    className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full ${item.dotColor}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
