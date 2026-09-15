import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  Calendar,
  Send,
  BookmarkCheck,
  ChevronDown,
  ChevronUp,
  Heart,
  Smile,
  Zap,
  ShieldAlert,
  Compass,
  ArrowRight,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ReflectionMethod, SelfReflectionData } from '../types';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { getUserProfile } from '../services/userStatsService';
import { saveJournalEntry } from '../services/storageService';
import { requestSelfReflectionFeedback } from '../services/geminiService';
import { VoiceInputButton } from './VoiceInputButton';

interface SelfReflectionProps {
  onSavedToJournal?: () => void;
}

const METHODS_CONFIG: Record<
  ReflectionMethod,
  {
    titleUk: string;
    titleRu: string;
    titleEn: string;
    descUk: string;
    descRu: string;
    descEn: string;
    badge: string;
  }
> = {
  stoic_evening: {
    titleUk: 'Стоїчна вечірня рефлексія',
    titleRu: 'Стоическая вечерняя рефлексия',
    titleEn: 'Stoic Evening Reflection',
    descUk: 'Щоденна практика Марка Аврелія та Сенеки для кришталевої ясності розуму та спокою.',
    descRu: 'Ежедневная практика Марка Аврелия и Сенеки для кристальной ясности ума и покоя.',
    descEn: 'Marcus Aurelius & Seneca daily audit: what was noble, where was lapse, how to act tomorrow.',
    badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
  },
  gibbs_cycle: {
    titleUk: 'Цикл рефлексії Гіббса',
    titleRu: 'Цикл рефлексии Гиббса',
    titleEn: 'Gibbs Reflective Cycle',
    descUk: 'Класична 6-етапна модель для глибокого аналізу емоційно насиченої або критичної ситуації.',
    descRu: 'Классическая 6-этапная модель для глубокого анализа эмоционально заряженной ситуации.',
    descEn: 'Structured 6-stage reflection: Description -> Feelings -> Evaluation -> Analysis -> Conclusion -> Action.',
    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30',
  },
  what_so_what: {
    titleUk: 'Дрісколл: Що? Ну і що? Що тепер?',
    titleRu: 'Дрисколл: Что? Ну и что? Что теперь?',
    titleEn: 'Driscoll: What? So What? Now What?',
    descUk: 'Елегантна трьохетапна модель швидкого перетворення будь-якого досвіду на практичну мудрість.',
    descRu: 'Элегантная 3-этапная модель быстрого превращения опыта в практическую мудрость.',
    descEn: 'Fast and impactful 3-question loop for extracting actionable learning from any event.',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30',
  },
  kpt_retrospective: {
    titleUk: 'KPT: Keep / Problem / Try',
    titleRu: 'KPT: Keep / Problem / Try',
    titleEn: 'KPT Life Retrospective',
    descUk: 'Методика життєвого аудиту тижня або місяця: що зберігати, де затики, що спробувати.',
    descRu: 'Методика жизненного аудита недели или месяца: что сохранять, где затыки, что попробовать.',
    descEn: 'Agile-adapted life audit: Keep working habits, resolve Problems, Try new experiments.',
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/30',
  },
  express_checkin: {
    titleUk: 'Експрес-чек-ін дня',
    titleRu: 'Экспресс-чек-ин дня',
    titleEn: 'Daily Express Check-in',
    descUk: '3 швидкі питання для фокусування на перемогах, уроках та вдячності (до 3 хвилин).',
    descRu: '3 быстрых вопроса для фиксации побед, уроков и благодарности (до 3 минут).',
    descEn: '3-minute check-in focusing on wins, learning, and gratitude.',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
  },
};

const EMOTIONS_LIST = [
  'Спокій',
  'Вдячність',
  'Натхнення',
  'Радість',
  'Гордість',
  'Втома',
  'Тривога',
  'Роздратування',
  'Сум',
  'Провина',
  'Розгубленість',
  'Надія',
  'Прийняття',
];

export const SelfReflectionTool: React.FC<SelfReflectionProps> = ({ onSavedToJournal }) => {
  const { lang, t } = useThemeLanguage();

  const [selectedMethod, setSelectedMethod] = useState<ReflectionMethod>('stoic_evening');
  const [energyScore, setEnergyScore] = useState<number>(7);
  const [moodScore, setMoodScore] = useState<number>(7);
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(['Спокій', 'Вдячність']);
  const [showGuide, setShowGuide] = useState(false);

  // Form Fields per method
  // Stoic
  const [stoicDoneWell, setStoicDoneWell] = useState('');
  const [stoicFaltered, setStoicFaltered] = useState('');
  const [stoicTomorrowBetter, setStoicTomorrowBetter] = useState('');

  // Gibbs
  const [gibbsDescription, setGibbsDescription] = useState('');
  const [gibbsFeelings, setGibbsFeelings] = useState('');
  const [gibbsEvaluation, setGibbsEvaluation] = useState('');
  const [gibbsAnalysis, setGibbsAnalysis] = useState('');
  const [gibbsConclusion, setGibbsConclusion] = useState('');
  const [gibbsActionPlan, setGibbsActionPlan] = useState('');

  // Driscoll
  const [whatHappened, setWhatHappened] = useState('');
  const [soWhatMeaning, setSoWhatMeaning] = useState('');
  const [nowWhatNextStep, setNowWhatNextStep] = useState('');

  // KPT
  const [kptKeep, setKptKeep] = useState('');
  const [kptProblem, setKptProblem] = useState('');
  const [kptTry, setKptTry] = useState('');

  // Express
  const [expressWins, setExpressWins] = useState('');
  const [expressDifficulties, setExpressDifficulties] = useState('');
  const [expressGratitude, setExpressGratitude] = useState('');

  const [isSubmittingAi, setIsSubmittingAi] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<SelfReflectionData['aiSupervisorFeedback'] | null>(
    null
  );
  const [isSaved, setIsSaved] = useState(false);

  const toggleEmotion = (emo: string) => {
    setSelectedEmotions((prev) =>
      prev.includes(emo) ? prev.filter((e) => e !== emo) : [...prev, emo]
    );
  };

  const getActiveContentObject = () => {
    switch (selectedMethod) {
      case 'stoic_evening':
        return { stoicDoneWell, stoicFaltered, stoicTomorrowBetter };
      case 'gibbs_cycle':
        return {
          gibbsDescription,
          gibbsFeelings,
          gibbsEvaluation,
          gibbsAnalysis,
          gibbsConclusion,
          gibbsActionPlan,
        };
      case 'what_so_what':
        return { whatHappened, soWhatMeaning, nowWhatNextStep };
      case 'kpt_retrospective':
        return { kptKeep, kptProblem, kptTry };
      case 'express_checkin':
        return { expressWins, expressDifficulties, expressGratitude };
    }
  };

  const hasContentEntered = () => {
    const content = getActiveContentObject();
    return Object.values(content).some((val) => typeof val === 'string' && val.trim().length > 0);
  };

  const handleRequestAiFeedback = async () => {
    if (!hasContentEntered()) {
      alert(
        lang === 'ru'
          ? 'Пожалуйста, заполните хотя бы одно поле рефлексии.'
          : 'Будь ласка, заповніть хоча б одне поле рефлексії перед запуском аналізу.'
      );
      return;
    }

    setIsSubmittingAi(true);
    try {
      const feedback = await requestSelfReflectionFeedback({
        method: METHODS_CONFIG[selectedMethod].titleUk,
        energyScore,
        moodScore,
        primaryEmotions: selectedEmotions,
        content: getActiveContentObject(),
      });
      setAiFeedback(feedback);
    } catch (e) {
      console.error('Error fetching reflection feedback:', e);
    } finally {
      setIsSubmittingAi(false);
    }
  };

  const handleSaveToJournal = () => {
    const user = getUserProfile();
    const data: SelfReflectionData = {
      id: `reflection-${Date.now()}`,
      title: `${METHODS_CONFIG[selectedMethod].titleUk} (${new Date().toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'uk-UA')})`,
      date: new Date().toISOString(),
      method: selectedMethod,
      energyScore,
      moodScore,
      primaryEmotions: selectedEmotions,
      content: getActiveContentObject(),
      aiSupervisorFeedback: aiFeedback || undefined,
    };

    saveJournalEntry({
      id: data.id,
      type: 'selfReflection',
      title: data.title,
      date: data.date,
      summary: `Метод: ${METHODS_CONFIG[selectedMethod].titleUk} | Енергія: ${energyScore}/10 | Настрій: ${moodScore}/10 | Емоції: ${selectedEmotions.join(', ')}`,
      data,
      userId: user?.id,
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    if (onSavedToJournal) onSavedToJournal();
  };

  return (
    <div id="self-reflection-container" className="mx-auto max-w-5xl space-y-6 pb-20">
      {/* Header Banner */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-linear-to-br from-stone-50 via-teal-50/20 to-indigo-50/20 dark:from-stone-900 dark:via-teal-950/20 dark:to-indigo-950/20 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400">
              <Brain className="h-3.5 w-3.5" />
              {lang === 'ru'
                ? 'Осознанность, Стоицизм & Продуктивная Рефлексия'
                : lang === 'en'
                ? 'Mindfulness, Stoicism & Reflective Learning'
                : 'Усвідомленість, Стоїцизм & Продуктивна Рефлексія'}
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 dark:text-stone-100">
              {lang === 'ru' ? 'Саморефлексия' : lang === 'en' ? 'Self-Reflection Lab' : 'Саморефлексія'}
            </h1>
            <p className="text-sm text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
              {lang === 'ru'
                ? 'Пространство безопасного диалога с собой. Переводите хаос пережитого в чёткие инсайты без токсичного самобичевания.'
                : lang === 'en'
                ? 'A safe harbor for self-dialogue. Transform daily emotional turbulence into wisdom and clarity without toxic self-judgment.'
                : 'Простір безпечного діалогу із собою. Перетворюйте хаос пережитого на кришталеві інсайти без токсичного самобичування та румінацій.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reflection-guide-btn"
              type="button"
              onClick={() => setShowGuide(!showGuide)}
              className="flex items-center gap-1.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white/80 dark:bg-stone-800/80 px-3 py-2 text-xs font-semibold text-stone-800 dark:text-stone-200 transition hover:bg-stone-100 dark:hover:bg-stone-700 shadow-xs cursor-pointer"
            >
              <BookOpen className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>{lang === 'ru' ? 'Рекомендации к заполнению' : 'Рекомендації до заповнення'}</span>
              {showGuide ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>

            <button
              id="reflection-save-journal-btn"
              type="button"
              onClick={handleSaveToJournal}
              disabled={!hasContentEntered()}
              className="flex items-center gap-1.5 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 disabled:opacity-50 px-3.5 py-2 text-xs font-bold text-white dark:text-stone-950 transition shadow-xs cursor-pointer active:scale-95"
            >
              <BookmarkCheck className="h-4 w-4" />
              <span>{isSaved ? (lang === 'ru' ? 'Сохранено!' : 'Збережено!') : (lang === 'ru' ? 'В Журнал' : 'В Журнал')}</span>
            </button>
          </div>
        </div>

        {/* Detailed Coaching Guide Accordion */}
        {showGuide && (
          <div className="mt-5 rounded-xl border border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/30 p-4 sm:p-5 text-stone-800 dark:text-stone-200 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-2 font-bold text-teal-800 dark:text-teal-300 text-sm">
              <Lightbulb className="h-4 w-4" />
              <span>
                {lang === 'ru'
                  ? 'Как проводить глубокую и целительную саморефлексию'
                  : 'Як проводити зрілу, глибоку та зцілюючу саморефлексію'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500" />
                  1. {lang === 'ru' ? '«Любящий свидетель» вместо «Сурового прокурора»' : '«Добрий свідок» замість «Суворого прокурора»'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Главный враг рефлексии — руминация (токсичное пережевывание чувства вины). Смотрите на свои ошибки глазами мудрого друга, который видит вашу усталость и искренне верит в вас.'
                    : 'Головний ворог рефлексії — румінація (нескінченне самобичування «чому я такий/така»). Дивіться на власні промахи очима мудрого та турботливого наставника, який підтримує, а не карає.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Compass className="h-3.5 w-3.5 text-amber-500" />
                  2. {lang === 'ru' ? 'Отделяйте факты от драматических оценок' : 'Відокремлюйте факти від драматичних оцінок'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Факт: «Я не успел отправить отчет до 18:00». Драма: «Я никчемный работник». Записывайте сначала сухой факт, затем эмоцию, и только потом ищите конструктивный урок.'
                    : 'Факт: «Я відклав дзвінок і зайшов у соцмережі». Драма: «У мене немає сили волі». Опишіть чистий факт, відчуйте емоційну причину (наприклад, страх відмови) та знайдіть опору.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-indigo-500" />
                  3. {lang === 'ru' ? 'Золотое правило Стоиков: Круг контроля' : 'Золоте правило стоїків: Коло контролю'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Не тратьте энергию на то, что вне вашей власти (поведение других, погода, мировые новости). Фокусируйтесь строго на своих реакциях, намерениях и следующем шаге.'
                    : 'Не картайте себе за те, що перебуває поза вашим прямим контролем (реакції інших людей, обставини). Зосередьте увагу на своїх виборах, цінностях та якості присутності.'}
                </p>
              </div>

              <div className="space-y-2 rounded-lg bg-white/70 dark:bg-stone-900/70 p-3.5 border border-stone-200/70 dark:border-stone-800">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  4. {lang === 'ru' ? 'Микро-действие на завтра' : 'Один реалістичний мікрокрок на завтра'}
                </h4>
                <p className="text-stone-600 dark:text-stone-400">
                  {lang === 'ru'
                    ? 'Рефлексия без действия превращается в философию на диване. Завершайте каждый сеанс одним крошечным действием на завтра (выпить чашку чая в тишине, сделать 1 звонок).'
                    : 'Рефлексія завершується тоді, коли усвідомлення кристалізується в конкретну дію. Сформулюйте один простий крок на завтра, який не вимагає героїзму, але закріплює зміну.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Method Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {(Object.keys(METHODS_CONFIG) as ReflectionMethod[]).map((m) => {
          const cfg = METHODS_CONFIG[m];
          const isSelected = selectedMethod === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMethod(m)}
              className={`flex flex-col text-left p-3 rounded-xl border transition cursor-pointer ${
                isSelected
                  ? 'border-teal-500 bg-teal-500/15 dark:bg-teal-500/20 shadow-xs'
                  : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-teal-500/40 text-stone-700 dark:text-stone-300'
              }`}
            >
              <span className={`text-xs font-bold leading-tight ${isSelected ? 'text-teal-700 dark:text-teal-300' : ''}`}>
                {cfg.titleUk}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 line-clamp-2 mt-1">
                {cfg.descUk}
              </span>
            </button>
          );
        })}
      </div>

      {/* Emotional Thermometer & State Gauges */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 sm:p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-amber-500" />
          {lang === 'ru' ? 'Психоэмоциональный термометр состояния:' : 'Психоемоційний термометр стану перед записом:'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Energy Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                {lang === 'ru' ? 'Уровень жизненной энергии' : 'Рівень життєвої енергії'}
              </span>
              <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">{energyScore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={energyScore}
              onChange={(e) => setEnergyScore(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>1: {lang === 'ru' ? 'Истощение' : 'Виснаження'}</span>
              <span>5: {lang === 'ru' ? 'Норма' : 'Норма'}</span>
              <span>10: {lang === 'ru' ? 'Пик драйва' : 'Пік драйву'}</span>
            </div>
          </div>

          {/* Mood Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Smile className="h-3.5 w-3.5 text-teal-500" />
                {lang === 'ru' ? 'Фон настроения' : 'Фон настрою'}
              </span>
              <span className="text-teal-600 dark:text-teal-400 font-mono text-sm">{moodScore} / 10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={moodScore}
              onChange={(e) => setMoodScore(Number(e.target.value))}
              className="w-full accent-teal-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>1: {lang === 'ru' ? 'Тяжесть / Мрак' : 'Тяжкість / Темінь'}</span>
              <span>5: {lang === 'ru' ? 'Ровно' : 'Рівно'}</span>
              <span>10: {lang === 'ru' ? 'Свет / Вдохновение' : 'Світло / Радість'}</span>
            </div>
          </div>
        </div>

        {/* Emotions Chips */}
        <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
            {lang === 'ru' ? 'Доминирующие оттенки чувств сегодня:' : 'Домінуючі відтінки почуттів сьогодні (оберіть важливі):'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EMOTIONS_LIST.map((emo) => {
              const isSelected = selectedEmotions.includes(emo);
              return (
                <button
                  key={emo}
                  type="button"
                  onClick={() => toggleEmotion(emo)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-600 dark:bg-teal-500 text-white dark:text-stone-950 border-teal-600 font-bold shadow-xs'
                      : 'border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  {emo}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Form Fields depending on selectedMethod */}
      <div className="rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Method 1: Stoic Evening */}
        {selectedMethod === 'stoic_evening' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between">
                <span>1. Що сьогодні зроблено гідно, правильно і чесно?</span>
                <VoiceInputButton onTranscript={(txt) => setStoicDoneWell((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <p className="text-[11px] text-stone-500">
                Ваші перемоги, збережений самоконтроль, добрі вчинки, проявлені чесноти (мужність, помірність, мудрість, справедливість).
              </p>
              <textarea
                value={stoicDoneWell}
                onChange={(e) => setStoicDoneWell(e.target.value)}
                rows={3}
                placeholder="Сьогодні я знайшов(ла) у собі сили спокійно вислухати колегу, не піддався(лася) імпульсивній покупці..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>2. Де я піддався(лася) слабкості, автоматизму або зайвим емоціям?</span>
                <VoiceInputButton onTranscript={(txt) => setStoicFaltered((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <p className="text-[11px] text-stone-500">
                Без самобичування: де ви втратили фокус, злякалися, роздратувалися або відступили від своїх стандартів?
              </p>
              <textarea
                value={stoicFaltered}
                onChange={(e) => setStoicFaltered(e.target.value)}
                rows={3}
                placeholder="Відчув(ла) напад тривоги через новини та просидів(ла) 40 хвилин у соцмережах замість прогулянки..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
                <span>3. Що завтра я зроблю мудріше, спокійніше та краще?</span>
                <VoiceInputButton onTranscript={(txt) => setStoicTomorrowBetter((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <p className="text-[11px] text-stone-500">
                Конкретна стоїчна настанова собі на прийдешній день.
              </p>
              <textarea
                value={stoicTomorrowBetter}
                onChange={(e) => setStoicTomorrowBetter(e.target.value)}
                rows={3}
                placeholder="Вранці залишу телефон в іншій кімнаті, приділю 15 хвилин диханню і зроблю найважливіше завдання першим..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Method 2: Gibbs Reflective Cycle */}
        {selectedMethod === 'gibbs_cycle' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>1. Опис події (Description): Що конкретно сталося?</span>
                <VoiceInputButton onTranscript={(txt) => setGibbsDescription((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={gibbsDescription}
                onChange={(e) => setGibbsDescription(e.target.value)}
                rows={2}
                placeholder="Факти ситуації: хто був поруч, що відбулося, які були дії..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center justify-between">
                <span>2. Почуття та думки (Feelings): Що я переживав(ла)?</span>
                <VoiceInputButton onTranscript={(txt) => setGibbsFeelings((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={gibbsFeelings}
                onChange={(e) => setGibbsFeelings(e.target.value)}
                rows={2}
                placeholder="Які емоції виникли в момент події і після неї? Що відбувалося в тілі?"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  3. Оцінка (Evaluation): Що було добре/погано?
                </label>
                <textarea
                  value={gibbsEvaluation}
                  onChange={(e) => setGibbsEvaluation(e.target.value)}
                  rows={2}
                  placeholder="Що спрацювало на користь, а що пішло не так?"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  4. Аналіз (Analysis): Чому це сталося?
                </label>
                <textarea
                  value={gibbsAnalysis}
                  onChange={(e) => setGibbsAnalysis(e.target.value)}
                  rows={2}
                  placeholder="Які приховані фактори або потреби вплинули на розвиток подій?"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                  5. Висновок (Conclusion): Чого це мене навчило?
                </label>
                <textarea
                  value={gibbsConclusion}
                  onChange={(e) => setGibbsConclusion(e.target.value)}
                  rows={2}
                  placeholder="Що нового я дізнався(лася) про себе, свої межі та реакції?"
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  6. План дій (Action Plan): Що зроблю наступного разу?
                </label>
                <textarea
                  value={gibbsActionPlan}
                  onChange={(e) => setGibbsActionPlan(e.target.value)}
                  rows={2}
                  placeholder="Якщо ситуація повториться, мій конкретний алгоритм дій..."
                  className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        )}

        {/* Method 3: Driscoll (What? So What? Now What?) */}
        {selectedMethod === 'what_so_what' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 flex items-center justify-between">
                <span>1. Що сталося? (What?)</span>
                <VoiceInputButton onTranscript={(txt) => setWhatHappened((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                rows={3}
                placeholder="Опишіть головну подію, розмову чи внутрішній стан..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>2. Ну і що? Яке це має значення для мене? (So What?)</span>
                <VoiceInputButton onTranscript={(txt) => setSoWhatMeaning((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={soWhatMeaning}
                onChange={(e) => setSoWhatMeaning(e.target.value)}
                rows={3}
                placeholder="Чому це мене зачепило? Які мої цінності тут задіяні? Які наслідки?"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>3. Що тепер? Що я з цим робитиму? (Now What?)</span>
                <VoiceInputButton onTranscript={(txt) => setNowWhatNextStep((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={nowWhatNextStep}
                onChange={(e) => setNowWhatNextStep(e.target.value)}
                rows={3}
                placeholder="Мій наступний конкретний крок або зміна ставлення..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Method 4: KPT Retrospective */}
        {selectedMethod === 'kpt_retrospective' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center justify-between">
                <span>KEEP (Зберегти): Що працює класно і що варто продовжувати?</span>
                <VoiceInputButton onTranscript={(txt) => setKptKeep((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={kptKeep}
                onChange={(e) => setKptKeep(e.target.value)}
                rows={3}
                placeholder="Мої вдалі звички, корисні рішення та приємні моменти, які дають силу..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>PROBLEM (Проблема): Де виникли труднощі, зриви або злив ресурсу?</span>
                <VoiceInputButton onTranscript={(txt) => setKptProblem((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={kptProblem}
                onChange={(e) => setKptProblem(e.target.value)}
                rows={3}
                placeholder="Що заважало, викликало дискомфорт або гальмувало мій рух?"
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 flex items-center justify-between">
                <span>TRY (Спробувати): Який новий експеримент чи дію я протестую?</span>
                <VoiceInputButton onTranscript={(txt) => setKptTry((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={kptTry}
                onChange={(e) => setKptTry(e.target.value)}
                rows={3}
                placeholder="Одне нове рішення, яке я спробую впровадити протягом наступних 7 днів..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Method 5: Express Check-in */}
        {selectedMethod === 'express_checkin' && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center justify-between">
                <span>1. Перемоги дня (хоча б одна дрібниця):</span>
                <VoiceInputButton onTranscript={(txt) => setExpressWins((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={expressWins}
                onChange={(e) => setExpressWins(e.target.value)}
                rows={2}
                placeholder="Сьогодні я молодець тому, що..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-between">
                <span>2. Труднощі та подолання:</span>
                <VoiceInputButton onTranscript={(txt) => setExpressDifficulties((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={expressDifficulties}
                onChange={(e) => setExpressDifficulties(e.target.value)}
                rows={2}
                placeholder="Що було непросто, але я з цим впорався(лася)..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center justify-between">
                <span>3. Вдячність собі та дню:</span>
                <VoiceInputButton onTranscript={(txt) => setExpressGratitude((p) => (p ? `${p} ${txt}` : txt))} />
              </label>
              <textarea
                value={expressGratitude}
                onChange={(e) => setExpressGratitude(e.target.value)}
                rows={2}
                placeholder="Я щиро вдячний(на) за..."
                className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 p-3 text-sm text-stone-900 dark:text-stone-100 focus:border-teal-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {/* Action Button: AI Feedback */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 dark:border-stone-800">
          <span className="text-xs text-stone-500 dark:text-stone-400">
            {lang === 'ru'
              ? 'ШИ-супервизор поможет отследить когнитивные ловушки и предложит поддерживающий рефрейминг'
              : 'ШІ-супервізор допоможе відстежити румінації та запропонує мʼякий підтримуючий рефреймінг'}
          </span>

          <button
            type="button"
            onClick={handleRequestAiFeedback}
            disabled={isSubmittingAi || !hasContentEntered()}
            className="flex items-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            {isSubmittingAi ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span>
              {isSubmittingAi
                ? (lang === 'ru' ? 'Супервизор слушает...' : 'Супервізор аналізує...')
                : (lang === 'ru' ? 'Получить ШИ-Супервизию' : 'Отримати ШІ-Супервізію')}
            </span>
          </button>
        </div>
      </div>

      {/* AI Supervisor Response Block */}
      {aiFeedback && (
        <div className="rounded-2xl border border-teal-500/40 bg-linear-to-br from-teal-50/50 via-white to-indigo-50/40 dark:from-teal-950/40 dark:via-stone-900 dark:to-indigo-950/40 p-5 sm:p-7 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-teal-500/20 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                {lang === 'ru' ? 'Отклик Психологического Супервизора' : 'Відгук Психологічного Супервізора'}
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300">
              Compassionate Reflection
            </span>
          </div>

          <p className="text-sm leading-relaxed text-stone-800 dark:text-stone-200">
            {aiFeedback.summary}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Validation */}
            <div className="rounded-xl border border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 space-y-1.5 shadow-xs">
              <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                {lang === 'ru' ? 'Валидация чувств:' : 'Емпатична валідація почуттів:'}
              </h4>
              <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                {aiFeedback.supportiveValidation}
              </p>
            </div>

            {/* Cognitive Trap Detector */}
            <div className="rounded-xl border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/20 p-4 space-y-1.5 shadow-xs">
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                {lang === 'ru' ? 'Защита от руминаций:' : 'Захист від когнітивних пасток:'}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {aiFeedback.cognitiveTrapDetector || 'Паттернів румінації не виявлено. Ви зберігаєте здоровий фокус на конструктивних діях.'}
              </p>
            </div>
          </div>

          {/* Reframe & Action for tomorrow */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-teal-500/30 bg-teal-50/30 dark:bg-teal-950/20 p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-teal-600" />
                {lang === 'ru' ? 'Ресурсный рефрейминг:' : 'Ресурсний рефреймінг:'}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {aiFeedback.resourceReframe}
              </p>
            </div>

            <div className="rounded-xl border border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20 p-4 space-y-1.5">
              <h4 className="text-xs font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600" />
                {lang === 'ru' ? 'Микро-шаг на завтра:' : 'Підтримуючий мікрокрок на завтра:'}
              </h4>
              <p className="text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
                {aiFeedback.actionStepForTomorrow}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
